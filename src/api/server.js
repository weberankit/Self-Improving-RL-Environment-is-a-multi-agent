// src/api/server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { SelfImprovingEnv } from '../env/SelfImprovingEnv.js';
import { MemoryStore } from '../memory/memoryStore.js';
import { sampleTask } from '../tasks/sampleTasks.js';
import { logger } from '../utils/logger.js';
import { LLMClient } from '../llm/llmClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.API_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// Store active sessions for SSE
const activeSessions = new Map();

// ─── Auto-Detect Category & Difficulty ──────────────────────────────────────

async function detectCategoryAndDifficulty(userQuery) {
  const detector = new LLMClient({
    model: process.env.OPTIMIZER_MODEL || 'gpt-4o-mini',
    maxTokens: 100,
    temperature: 0.3,
  });

  const prompt = `Analyze this user query and determine the best category and difficulty level.

User Query: "${userQuery}"

Return ONLY JSON:
{
  "category": "coding|math|reasoning|writing|analysis",
  "difficulty": "easy|medium|hard",
  "reason": "brief explanation"
}

Categories:
- coding: Programming, software development, algorithms, APIs
- math: Mathematical problems, calculations, formulas
- reasoning: Logic puzzles, strategic thinking, problem analysis
- writing: Content creation, emails, essays, professional writing
- analysis: Business analysis, competitive analysis, root cause analysis

Difficulty:
- easy: Simple, straightforward tasks
- medium: Moderate complexity, requires some expertise
- hard: Complex, multi-step, requires deep expertise`;

  try {
    const result = await detector.prompt(prompt, { jsonMode: true });
    logger.info(`Auto-detected: category=${result.category}, difficulty=${result.difficulty}`);
    return {
      category: result.category || 'coding',
      difficulty: result.difficulty || 'medium',
      reason: result.reason || ''
    };
  } catch (error) {
    logger.warn(`Auto-detection failed: ${error.message}, using defaults`);
    return { category: 'coding', difficulty: 'medium', reason: 'Default (detection failed)' };
  }
}

// ─── SSE (Server-Sent Events) for Real-time Updates ─────────────────────────

function sendSSE(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// ─── API Routes ──────────────────────────────────────────────────────────────

/**
 * POST /api/solve-stream
 * Solve a task with real-time SSE updates
 */
app.post('/api/solve-stream', async (req, res) => {
  const { task } = req.body;
  
  if (!task) {
    return res.status(400).json({ error: 'Task description is required' });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sessionId = `session_${Date.now()}`;
  logger.info(`Session ${sessionId}: Starting task "${task.slice(0, 50)}..."`);

  try {
    // Step 1: Auto-detect category and difficulty
    sendSSE(res, 'status', {
      phase: 'detecting',
      message: 'Analyzing request',
      detail: 'Determining category and difficulty level'
    });

    const detection = await detectCategoryAndDifficulty(task);
    
    sendSSE(res, 'detection', {
      category: detection.category,
      difficulty: detection.difficulty,
      reason: detection.reason
    });

    // Step 2: Create custom task
    const customTask = {
      id: `user_task_${sessionId}`,
      category: detection.category,
      difficulty: detection.difficulty,
      title: task.slice(0, 50) + (task.length > 50 ? '...' : ''),
      prompt: task,
      hints: [],
      evaluationCriteria: [
        'correctness',
        'completeness',
        'follows requirements',
        'clean implementation'
      ],
      timeLimit: 300,
      tags: ['user-request']
    };

    // Step 3: Create environment
    const env = new SelfImprovingEnv({
      maxEpisodes: 1,
      maxStepsPerEpisode: parseInt(process.env.MAX_STEPS_PER_EPISODE) || 5,
      rewardThreshold: parseFloat(process.env.REWARD_THRESHOLD) || 0.85,
      optimizeEvery: 999,
      useCurriculum: false,
      memoryFile: process.env.MEMORY_FILE || './memory/agent_memory.json',
    });

    // Step 4: Run with live updates
    sendSSE(res, 'status', {
      phase: 'solving',
      message: 'Solver agent is working',
      detail: `Category: ${detection.category} | Difficulty: ${detection.difficulty}`
    });

    const episode = await runEpisodeWithUpdates(env, customTask, res, sessionId);

    // Step 5: Send final result
    const memoryStats = env.memory.getStats();
    
    sendSSE(res, 'complete', {
      sessionId,
      task: customTask.title,
      category: detection.category,
      difficulty: detection.difficulty,
      success: episode.success,
      totalReward: episode.totalReward,
      steps: episode.steps.length,
      solution: episode.bestResponse,
      steps_detail: episode.steps.map(step => ({
        step: step.step,
        score: step.reward,
        feedback: step.feedback,
        criticFeedback: step.criticFeedback,
        timestamp: step.timestamp,
      })),
      memory: {
        totalEpisodes: memoryStats.totalEpisodes,
        learnedRules: memoryStats.ruleCount,
        strategies: memoryStats.strategyCount,
      },
      duration: episode.duration,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error(`Session ${sessionId} failed: ${error.message}`);
    sendSSE(res, 'error', {
      error: 'Task solving failed',
      message: error.message
    });
  } finally {
    res.end();
  }
});

// Helper: Run episode with SSE updates
async function runEpisodeWithUpdates(env, task, res, sessionId) {
  const memories = env.memory.getRelevantMemories(task);
  let criticFeedback = null;
  let bestResponse = null;
  let bestReward = 0;

  const episode = {
    id: sessionId,
    task,
    steps: [],
    totalReward: 0,
    success: false,
    startTime: Date.now(),
  };

  for (let step = 1; step <= env.maxStepsPerEpisode; step++) {
    // Send agent thinking update
    sendSSE(res, 'agent', {
      agent: 'solver',
      attempt: step,
      status: 'thinking',
      message: `Solver agent - Attempt ${step}/${env.maxStepsPerEpisode}`,
      detail: 'Generating solution...'
    });

    // Solver generates
    const response = await env.solver.solve(task, {
      memories,
      criticFeedback,
      attempt: step,
      optimizedPrompt: env.memory.getPromptStrategy(task.category)?.strategy
    });

    sendSSE(res, 'agent', {
      agent: 'grader',
      status: 'evaluating',
      message: 'Grader agent - Evaluating solution',
      detail: 'Scoring response'
    });

    // Grade response
    const gradeResult = await env.grader.grade(response, task, {
      recentFeedback: criticFeedback
    });

    sendSSE(res, 'step_result', {
      step,
      score: gradeResult.score,
      feedback: gradeResult.feedback,
      success: gradeResult.score >= env.rewardThreshold
    });

    // Check if good enough
    if (gradeResult.score >= env.rewardThreshold) {
      sendSSE(res, 'agent', {
        agent: 'system',
        status: 'success',
        message: 'Solution meets quality threshold',
        detail: `Score: ${gradeResult.score.toFixed(3)} >= ${env.rewardThreshold}`
      });

      if (gradeResult.score > bestReward) {
        bestReward = gradeResult.score;
        bestResponse = response;
      }

      const stepRecord = {
        step,
        action: response,
        reward: gradeResult.score,
        feedback: gradeResult.feedback,
        criticFeedback: null,
        gradeBreakdown: gradeResult.breakdown,
        timestamp: new Date().toISOString(),
      };
      episode.steps.push(stepRecord);
      break;
    }

    // Critic analyzes if failed
    if (step < env.maxStepsPerEpisode) {
      sendSSE(res, 'agent', {
        agent: 'critic',
        status: 'analyzing',
        message: 'Critic agent - Analyzing issues',
        detail: 'Identifying what went wrong'
      });

      const critique = await env.critic.critique(response, task, gradeResult);
      criticFeedback = critique.specificFeedback;

      sendSSE(res, 'critic', {
        step,
        feedback: critique.specificFeedback,
        severity: critique.severity,
        priorityFix: critique.priorityFix
      });
    }

    // Track best
    if (gradeResult.score > bestReward) {
      bestReward = gradeResult.score;
      bestResponse = response;
    }

    const stepRecord = {
      step,
      action: response,
      reward: gradeResult.score,
      feedback: gradeResult.feedback,
      criticFeedback: criticFeedback,
      gradeBreakdown: gradeResult.breakdown,
      timestamp: new Date().toISOString(),
    };
    episode.steps.push(stepRecord);

    await env._sleep(100); // Small delay for UX
  }

  episode.totalReward = bestReward;
  episode.success = bestReward >= env.rewardThreshold;
  episode.bestResponse = bestResponse;
  episode.duration = Date.now() - episode.startTime;

  // Save to memory
  env.memory.recordEpisode(episode);

  return episode;
}

/**
 * GET /api/memory
 * Get current memory state
 */
app.get('/api/memory', (req, res) => {
  try {
    const memory = new MemoryStore({
      memoryFile: process.env.MEMORY_FILE || './memory/agent_memory.json'
    });
    
    const stats = memory.getStats();
    const rules = memory.state.learnedRules;
    const strategies = memory.state.promptStrategies;
    
    res.json({
      stats,
      rules,
      strategies,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/stats
 * Get system statistics
 */
app.get('/api/stats', (req, res) => {
  try {
    const memory = new MemoryStore({
      memoryFile: process.env.MEMORY_FILE || './memory/agent_memory.json'
    });
    
    const stats = memory.getStats();
    
    res.json({
      totalEpisodes: stats.totalEpisodes,
      totalSteps: stats.totalSteps,
      avgReward: stats.avgReward,
      bestReward: stats.bestReward,
      learnedRules: stats.ruleCount,
      strategies: stats.strategyCount,
      taskStats: stats.taskStats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Start Server ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  logger.info(`Web Interface running on http://localhost:${PORT}`);
});

export default app;
