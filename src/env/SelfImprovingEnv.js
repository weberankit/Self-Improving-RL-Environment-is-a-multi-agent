// src/env/SelfImprovingEnv.js
import { v4 as uuidv4 } from 'uuid';
import { SolverAgent } from '../agents/solver.js';
import { CriticAgent } from '../agents/critic.js';
import { OptimizerAgent } from '../agents/optimizer.js';
import { LLMGrader } from '../grader/llmGrader.js';
import { MemoryStore } from '../memory/memoryStore.js';
import { sampleTask, getCurriculumSequence } from '../tasks/sampleTasks.js';
import { logger } from '../utils/logger.js';

/**
 * Self-Improving Reinforcement Learning Environment
 *
 * Architecture:
 *   Episode = Task → Solver → Grade → Critic → [Retry loop] → Record
 *   After N episodes → Optimizer updates Solver prompt + Memory stores rules
 *
 * RL Formulation:
 *   State:    Task + Memory context + Attempt number
 *   Action:   Solver's text response
 *   Reward:   Hybrid grade score (0–1)
 *   Policy:   Solver's system prompt (updated by Optimizer)
 *   V(s):     Per-category success rate from Memory
 */
export class SelfImprovingEnv {
  constructor({
    maxEpisodes = parseInt(process.env.MAX_EPISODES || '20'),
    maxStepsPerEpisode = parseInt(process.env.MAX_STEPS_PER_EPISODE || '3'),
    rewardThreshold = parseFloat(process.env.REWARD_THRESHOLD || '0.85'),
    optimizeEvery = 5,       // Run optimizer every N episodes
    useCurriculum = true,    // Start easy, progress to hard
    memoryFile = process.env.MEMORY_FILE || './memory/agent_memory.json',
  } = {}) {
    this.maxEpisodes = maxEpisodes;
    this.maxStepsPerEpisode = maxStepsPerEpisode;
    this.rewardThreshold = rewardThreshold;
    this.optimizeEvery = optimizeEvery;
    this.useCurriculum = useCurriculum;

    // Core components
    this.memory = new MemoryStore({ memoryFile });
    this.solver = new SolverAgent();
    this.critic = new CriticAgent();
    this.grader = new LLMGrader();
    this.optimizer = new OptimizerAgent(this.memory);

    // Runtime state
    this.episodeHistory = [];
    this.currentEpisode = 0;
    this.taskQueue = useCurriculum ? getCurriculumSequence() : [];
    this.usedTaskIds = new Set();

    // Per-run metrics
    this.metrics = {
      episodeRewards: [],
      successCount: 0,
      avgReward: 0,
      peakReward: 0,
      optimizationCount: 0,
      startTime: Date.now(),
    };
  }

  // ─── Main Training Loop ────────────────────────────────────────────────────

  async run() {
    logger.separator('SELF-IMPROVING RL ENVIRONMENT STARTING');
    this._printConfig();

    const memStats = this.memory.getStats();
    if (memStats.totalEpisodes > 0) {
      logger.memory(`Resuming from memory: ${memStats.totalEpisodes} prior episodes, ${memStats.ruleCount} rules`);
    }

    for (let i = 0; i < this.maxEpisodes; i++) {
      this.currentEpisode = i + 1;
      const task = this._selectTask();

      logger.separator(`Episode ${this.currentEpisode}/${this.maxEpisodes}`);
      logger.episode(`Task: "${task.title}" [${task.category}/${task.difficulty}]`);

      const episode = await this._runEpisode(task);
      this.episodeHistory.push(episode);
      this._updateMetrics(episode);
      this.memory.recordEpisode(episode);

      logger.reward(
        `Episode ${this.currentEpisode} complete | Reward: ${episode.totalReward.toFixed(3)} | ` +
        `Steps: ${episode.steps.length} | Success: ${episode.success ? '✅' : '❌'}`
      );

      // Optimization trigger
      if (this.currentEpisode % this.optimizeEvery === 0) {
        await this._runOptimization(task.category);
      }

      this._printProgress();
      await this._sleep(500); // Rate limiting buffer
    }

    logger.separator('TRAINING COMPLETE');
    return this._buildFinalReport();
  }

  // ─── Episode Loop ──────────────────────────────────────────────────────────

  async _runEpisode(task) {
    const episode = {
      id: uuidv4(),
      task,
      steps: [],
      totalReward: 0,
      success: false,
      startTime: Date.now(),
    };

    // Load relevant memories for this task type
    const memories = this.memory.getRelevantMemories(task);
    let criticFeedback = null;
    let bestResponse = null;
    let bestReward = 0;

    for (let step = 1; step <= this.maxStepsPerEpisode; step++) {
      logger.step(`Step ${step}/${this.maxStepsPerEpisode}`);

      // ── Action: Solver generates response ──
      const response = await this.solver.solve(task, {
        memories,
        criticFeedback,
        attempt: step,
        optimizedPrompt: this.memory.getPromptStrategy(task.category)?.strategy || null,
      });

      // ── Reward: Grade the response ──
      const gradeResult = await this.grader.grade(response, task, {
        recentFeedback: criticFeedback,
      });

      // ── Critique: Analyze failure if not good enough ──
      let critique = null;
      if (gradeResult.score < this.rewardThreshold && step < this.maxStepsPerEpisode) {
        critique = await this.critic.critique(response, task, gradeResult);
        criticFeedback = critique.specificFeedback;
      }

      // Track best response
      if (gradeResult.score > bestReward) {
        bestReward = gradeResult.score;
        bestResponse = response;
      }

      const stepRecord = {
        step,
        action: response,
        reward: gradeResult.score,
        feedback: gradeResult.feedback,
        criticFeedback: critique?.specificFeedback || null,
        gradeBreakdown: gradeResult.breakdown,
        timestamp: new Date().toISOString(),
      };
      episode.steps.push(stepRecord);

      logger.step(`  → Score: ${gradeResult.score.toFixed(3)} | ${gradeResult.feedback?.slice(0, 80)}`);

      // Early stop if threshold reached
      if (gradeResult.score >= this.rewardThreshold) {
        logger.success(`  Threshold reached at step ${step}!`);
        break;
      }
    }

    episode.totalReward = bestReward;
    episode.success = bestReward >= this.rewardThreshold;
    episode.bestResponse = bestResponse;
    episode.duration = Date.now() - episode.startTime;

    return episode;
  }

  // ─── Optimization Step ─────────────────────────────────────────────────────

  async _runOptimization(triggerCategory) {
    logger.separator('OPTIMIZATION PASS');

    // Get recent episodes by category
    const recentByCategory = {};
    this.episodeHistory.slice(-this.optimizeEvery).forEach(ep => {
      const cat = ep.task.category;
      if (!recentByCategory[cat]) recentByCategory[cat] = [];
      recentByCategory[cat].push(ep);
    });

    // Optimize for each category that had poor performance
    for (const [category, episodes] of Object.entries(recentByCategory)) {
      const avgReward = episodes.reduce((s, e) => s + e.totalReward, 0) / episodes.length;

      // Collect critiques for this category
      const critiques = episodes.flatMap(e =>
        e.steps
          .filter(s => s.criticFeedback)
          .map(s => ({ priorityFix: s.criticFeedback, overallAssessment: s.feedback }))
      );

      const result = await this.optimizer.optimize({
        episodes,
        currentPrompt: this.solver.getSystemPrompt(),
        category,
        solverCritiques: critiques,
        targetScore: this.rewardThreshold,
      });

      if (result.changed) {
        this.solver.updateSystemPrompt(result.updatedPrompt);
        logger.optimize(`Solver prompt updated for [${category}] | avg was ${avgReward.toFixed(2)}`);
      }
    }

    this.metrics.optimizationCount++;
    this.memory.save();
  }

  // ─── Task Selection ────────────────────────────────────────────────────────

  _selectTask() {
    if (this.useCurriculum && this.taskQueue.length > 0) {
      // Curriculum: pop from front, cycle
      const task = this.taskQueue.shift();
      this.taskQueue.push(task); // cycle
      this.usedTaskIds.add(task.id);
      return task;
    }

    // Random with no-repeat preference
    const exclude = this.usedTaskIds.size > 10 ? [] : [...this.usedTaskIds];
    const task = sampleTask({ exclude });
    this.usedTaskIds.add(task.id);
    if (this.usedTaskIds.size > 20) {
      const first = [...this.usedTaskIds][0];
      this.usedTaskIds.delete(first);
    }
    return task;
  }

  // ─── Metrics & Reporting ───────────────────────────────────────────────────

  _updateMetrics(episode) {
    this.metrics.episodeRewards.push(episode.totalReward);
    if (episode.success) this.metrics.successCount++;
    this.metrics.avgReward =
      this.metrics.episodeRewards.reduce((a, b) => a + b, 0) / this.metrics.episodeRewards.length;
    if (episode.totalReward > this.metrics.peakReward) {
      this.metrics.peakReward = episode.totalReward;
    }
  }

  _printProgress() {
    const successRate = ((this.metrics.successCount / this.currentEpisode) * 100).toFixed(1);
    const elapsed = ((Date.now() - this.metrics.startTime) / 1000).toFixed(0);
    logger.info(
      `Progress | Episode ${this.currentEpisode}/${this.maxEpisodes} | ` +
      `Avg: ${this.metrics.avgReward.toFixed(3)} | Peak: ${this.metrics.peakReward.toFixed(3)} | ` +
      `Success: ${successRate}% | Elapsed: ${elapsed}s`
    );
  }

  _buildFinalReport() {
    const elapsed = ((Date.now() - this.metrics.startTime) / 1000).toFixed(1);
    const memStats = this.memory.getStats();
    const llmStats = this.optimizer.llm.getStats();

    const report = {
      summary: {
        totalEpisodes: this.currentEpisode,
        successCount: this.metrics.successCount,
        successRate: (this.metrics.successCount / this.currentEpisode).toFixed(3),
        avgReward: this.metrics.avgReward.toFixed(3),
        peakReward: this.metrics.peakReward.toFixed(3),
        optimizationRuns: this.metrics.optimizationCount,
        elapsedSeconds: parseFloat(elapsed),
      },
      memory: {
        totalEpisodesRecorded: memStats.totalEpisodes,
        learnedRules: memStats.ruleCount,
        promptStrategies: memStats.strategyCount,
        taskStats: memStats.taskStats,
      },
      llmUsage: llmStats,
      rewardHistory: this.metrics.episodeRewards,
    };

    logger.separator('FINAL REPORT');
    logger.table(report.summary, 'Summary');
    logger.table(report.memory, 'Memory');

    return report;
  }

  _printConfig() {
    logger.table({
      maxEpisodes: this.maxEpisodes,
      maxStepsPerEpisode: this.maxStepsPerEpisode,
      rewardThreshold: this.rewardThreshold,
      optimizeEvery: this.optimizeEvery,
      curriculum: this.useCurriculum,
    }, 'Configuration');
  }

  _sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // ─── Single-episode API (for external use) ─────────────────────────────────

  async step(task) {
    const episode = await this._runEpisode(task);
    this.memory.recordEpisode(episode);
    this._updateMetrics(episode);
    return episode;
  }

  getState() {
    return {
      episode: this.currentEpisode,
      metrics: this.metrics,
      memoryStats: this.memory.getStats(),
      optimizerStats: this.optimizer.getStats(),
    };
  }
}
