// src/agents/optimizer.js
import { LLMClient } from '../llm/llmClient.js';
import { logger } from '../utils/logger.js';

const OPTIMIZER_SYSTEM = `You are a meta-learning optimizer. Your job is to analyze agent performance data and improve the system prompts and strategies used by AI agents.

You understand reinforcement learning, prompt engineering, and behavioral optimization.
Return ONLY valid JSON — no markdown, no preamble.`;

/**
 * Optimizer agent: uses reward signals and critic feedback to improve
 * solver prompts, task strategies, and behavioral rules.
 *
 * Core RL loop:
 *   1. Collect reward signal + critic feedback across N episodes
 *   2. Identify what behaviors led to high/low rewards
 *   3. Update solver system prompt (policy improvement)
 *   4. Update per-category strategies (value function update)
 *   5. Inject new learned rules into memory
 */
export class OptimizerAgent {
  constructor(memory) {
    this.llm = new LLMClient({
      model: process.env.OPTIMIZER_MODEL || 'claude-sonnet-4-20250514',
      maxTokens: 2048,
      temperature: 0.4,
    });
    this.memory = memory;
    this.optimizationCount = 0;
    this.updateHistory = [];
  }

  /**
   * Main optimization step — called after each episode batch.
   * Returns updated system prompt and extracted rules.
   */
  async optimize({
    episodes,
    currentPrompt,
    category,
    solverCritiques = [],
    targetScore = 0.85,
  }) {
    this.optimizationCount++;
    logger.optimize(`Optimization #${this.optimizationCount} | category=${category} | episodes=${episodes.length}`);

    const avgReward = episodes.reduce((s, e) => s + e.totalReward, 0) / episodes.length;
    const successRate = episodes.filter(e => e.totalReward >= targetScore).length / episodes.length;

    logger.optimize(`Avg reward: ${avgReward.toFixed(3)} | Success rate: ${(successRate * 100).toFixed(1)}%`);

    // If already performing well, skip heavy optimization
    if (avgReward >= targetScore && successRate >= 0.8) {
      logger.success(`Performance target met — minor tuning only`);
      return await this._minorTune(currentPrompt, episodes, category);
    }

    // Full optimization pass
    return await this._fullOptimize({ episodes, currentPrompt, category, solverCritiques, avgReward, successRate });
  }

  async _fullOptimize({ episodes, currentPrompt, category, solverCritiques, avgReward, successRate }) {
    // Prepare episode summaries
    const highReward = episodes.filter(e => e.totalReward >= 0.75).slice(0, 3);
    const lowReward = episodes.filter(e => e.totalReward < 0.5).slice(0, 3);

    const episodeSummary = [
      ...highReward.map(e => `[SUCCESS r=${e.totalReward.toFixed(2)}] ${this._summarizeEpisode(e)}`),
      ...lowReward.map(e => `[FAILURE r=${e.totalReward.toFixed(2)}] ${this._summarizeEpisode(e)}`),
    ].join('\n');

    const critiquesSummary = solverCritiques.slice(0, 5)
      .map(c => c.priorityFix || c.overallAssessment || '')
      .filter(Boolean)
      .join('\n• ');

    const prompt = `You are optimizing an AI solver agent's system prompt for the "${category}" task category.

CURRENT PERFORMANCE:
- Average reward: ${avgReward.toFixed(3)} / 1.0
- Success rate: ${(successRate * 100).toFixed(1)}%
- Target: ${(0.85 * 100).toFixed(0)}% success rate

CURRENT SYSTEM PROMPT:
---
${currentPrompt.slice(0, 1500)}
---

RECENT EPISODE PATTERNS:
${episodeSummary || 'No episodes yet'}

RECURRING CRITIC FEEDBACK:
• ${critiquesSummary || 'No critiques yet'}

MEMORY: Learned rules so far: ${this.memory.getRelevantRules(category, 3).map(r => r.rule).join('; ') || 'none'}

Your task:
1. Identify the root cause of failures
2. Rewrite the system prompt to be more effective for ${category} tasks
3. Extract 3-5 behavioral rules (positive + negative)
4. Suggest a category-specific strategy

Return ONLY this JSON:
{
  "analysis": "<2-3 sentences: root cause of low performance>",
  "updatedPrompt": "<complete updated system prompt, 150-300 words>",
  "behavioralRules": [
    {
      "pattern": "<when this situation occurs>",
      "rule": "<do/avoid this>",
      "polarity": "positive|negative",
      "category": "${category}",
      "confidence": 0.7
    }
  ],
  "categoryStrategy": "<concrete strategy for ${category} tasks in 2-3 sentences>",
  "expectedImprovement": "<what improvement you expect and why>"
}`;

    try {
      const result = await this.llm.prompt(prompt, {
        system: OPTIMIZER_SYSTEM,
        jsonMode: true,
      });

      // Store learned rules in memory
      if (result.behavioralRules?.length) {
        result.behavioralRules.forEach(r => this.memory.addLearnedRule(r));
        logger.memory(`Stored ${result.behavioralRules.length} new behavioral rules`);
      }

      // Store category strategy
      if (result.categoryStrategy) {
        this.memory.updatePromptStrategy(category, {
          strategy: result.categoryStrategy,
          performance: { avgReward, successRate },
        });
      }

      // Track update history
      this.updateHistory.push({
        timestamp: new Date().toISOString(),
        optimizationNum: this.optimizationCount,
        category,
        avgRewardBefore: avgReward,
        promptChanged: result.updatedPrompt !== currentPrompt,
        rulesAdded: result.behavioralRules?.length || 0,
      });

      logger.optimize(`Optimization complete: ${result.analysis?.slice(0, 100)}`);
      logger.optimize(`Expected: ${result.expectedImprovement?.slice(0, 100)}`);

      return {
        updatedPrompt: result.updatedPrompt || currentPrompt,
        behavioralRules: result.behavioralRules || [],
        categoryStrategy: result.categoryStrategy || '',
        analysis: result.analysis || '',
        changed: true,
      };
    } catch (err) {
      logger.error(`Optimizer failed: ${err.message}`);
      return { updatedPrompt: currentPrompt, behavioralRules: [], changed: false };
    }
  }

  async _minorTune(currentPrompt, episodes, category) {
    // Quick reinforcement of what's working
    const topEpisode = episodes.sort((a, b) => b.totalReward - a.totalReward)[0];
    if (!topEpisode) return { updatedPrompt: currentPrompt, changed: false };

    const prompt = `This prompt is performing well. Extract 1-2 positive rules from the best episode and reinforce them.

PROMPT: ${currentPrompt.slice(0, 500)}
BEST EPISODE: reward=${topEpisode.totalReward.toFixed(2)}, feedback="${topEpisode.feedback?.slice(0, 200)}"

Return ONLY JSON:
{
  "behavioralRules": [{ "pattern": "<pattern>", "rule": "<rule>", "polarity": "positive", "category": "${category}", "confidence": 0.8 }],
  "updatedPrompt": "<same prompt with minor reinforcement, max 5 word change>"
}`;

    try {
      const result = await this.llm.prompt(prompt, { system: OPTIMIZER_SYSTEM, jsonMode: true });
      if (result.behavioralRules) result.behavioralRules.forEach(r => this.memory.addLearnedRule(r));
      return { updatedPrompt: result.updatedPrompt || currentPrompt, changed: false, behavioralRules: result.behavioralRules || [] };
    } catch (_) {
      return { updatedPrompt: currentPrompt, changed: false, behavioralRules: [] };
    }
  }

  _summarizeEpisode(episode) {
    const steps = episode.steps || episode.actions || [];
    const feedback = steps.map(s => s.feedback || s.criticFeedback).filter(Boolean).slice(0, 2).join(' | ');
    return `Task="${episode.task?.title || episode.taskId}" Steps=${steps.length} Feedback="${feedback?.slice(0, 150)}"`;
  }

  getUpdateHistory() {
    return this.updateHistory;
  }

  getStats() {
    return {
      optimizationCount: this.optimizationCount,
      updates: this.updateHistory.length,
      lastUpdate: this.updateHistory.at(-1) || null,
    };
  }
}
