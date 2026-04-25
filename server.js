// server.js
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { SelfImprovingEnv } from './src/env/SelfImprovingEnv.js';
import { sampleTask } from './src/tasks/sampleTasks.js';
import { logger } from './src/utils/logger.js';
import { MemoryStore } from './src/memory/memoryStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Global state for live updates
let liveEnv = null;
let currentSession = null;
const clients = new Set();

// Broadcast to all connected clients
function broadcast(type, data) {
  const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

// ─── WebSocket Connection ─────────────────────────────────────────────────

wss.on('connection', (ws) => {
  logger.info('Client connected to WebSocket');
  clients.add(ws);

  // Send current state to new client
  if (currentSession) {
    ws.send(JSON.stringify({
      type: 'session_state',
      data: currentSession,
      timestamp: new Date().toISOString(),
    }));
  }

  ws.on('close', () => {
    clients.delete(ws);
    logger.info('Client disconnected');
  });
});

// ─── REST API Endpoints ───────────────────────────────────────────────────

/**
 * POST /api/task
 * Submit a new task to solve
 */
app.post('/api/task', async (req, res) => {
  try {
    const { title, prompt, category = 'coding', difficulty = 'medium', evaluationCriteria = [] } = req.body;

    if (!title || !prompt) {
      return res.status(400).json({ error: 'title and prompt required' });
    }

    // Create custom task
    const task = {
      id: `user_${Date.now()}`,
      title,
      prompt,
      category,
      difficulty,
      evaluationCriteria,
      hints: [],
    };

    logger.info(`Received task: "${title}" [${category}/${difficulty}]`);

    // Initialize environment if needed
    if (!liveEnv) {
      liveEnv = new SelfImprovingEnv({
        maxEpisodes: 1,
        maxStepsPerEpisode: 3,
        rewardThreshold: 0.85,
      });
    }

    // Start solving in background
    currentSession = {
      task,
      status: 'starting',
      episode: null,
      steps: [],
      memory: null,
      optimization: null,
    };

    broadcast('task_received', { task });

    // Run episode with step-by-step updates
    const episode = await solveTaskWithUpdates(task);

    currentSession.episode = episode;
    currentSession.status = 'completed';
    broadcast('episode_complete', { episode });

    res.json({ success: true, episode, sessionId: Date.now() });
  } catch (err) {
    logger.error(`Task endpoint error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/memory
 * Get current memory state
 */
app.get('/api/memory', (req, res) => {
  try {
    const memory = new MemoryStore();
    const stats = memory.getStats();

    res.json({
      episodes: memory.state.episodes.slice(-20), // Last 20
      learnedRules: memory.state.learnedRules,
      promptStrategies: memory.state.promptStrategies,
      taskStats: memory.state.taskStats,
      globalStats: memory.state.globalStats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/session
 * Get current session state
 */
app.get('/api/session', (req, res) => {
  res.json(currentSession || { status: 'idle' });
});

/**
 * POST /api/reset
 * Reset session
 */
app.post('/api/reset', (req, res) => {
  liveEnv = null;
  currentSession = null;
  broadcast('session_reset', {});
  res.json({ success: true });
});

// ─── Solving with Live Updates ─────────────────────────────────────────────

async function solveTaskWithUpdates(task) {
  if (!liveEnv) {
    liveEnv = new SelfImprovingEnv({
      maxEpisodes: 1,
      maxStepsPerEpisode: 3,
      rewardThreshold: 0.85,
    });
  }

  const episode = {
    id: `ep_${Date.now()}`,
    task,
    steps: [],
    totalReward: 0,
    success: false,
  };

  // Load memory
  const memory = new MemoryStore();
  const memories = memory.getRelevantMemories(task);

  broadcast('step_update', {
    stepNum: 'init',
    agent: 'memory',
    message: `Loaded ${memories.learnedRules?.length || 0} rules from memory`,
    data: { learnedRules: memories.learnedRules },
  });

  let bestReward = 0;
  let bestResponse = null;

  // Steps
  for (let step = 1; step <= 3; step++) {
    // Step 1: Solver
    broadcast('step_update', {
      stepNum: step,
      agent: 'solver',
      message: `Solver generating response (attempt ${step}/3)...`,
      status: 'in-progress',
    });

    const solverResponse = await liveEnv.solver.solve(task, {
      memories,
      attempt: step,
      optimizedPrompt: memory.getPromptStrategy(task.category)?.strategy || null,
    });

    broadcast('step_update', {
      stepNum: step,
      agent: 'solver',
      message: `Solver response generated (${solverResponse.length} chars)`,
      status: 'complete',
      data: { response: solverResponse.slice(0, 500) }, // Preview
    });

    // Step 2: Grader
    broadcast('step_update', {
      stepNum: step,
      agent: 'grader',
      message: 'Grader evaluating response...',
      status: 'in-progress',
    });

    const gradeResult = await liveEnv.grader.grade(solverResponse, task);

    broadcast('step_update', {
      stepNum: step,
      agent: 'grader',
      message: `Score: ${gradeResult.score.toFixed(3)} — ${gradeResult.feedback?.slice(0, 100)}`,
      status: 'complete',
      data: {
        score: gradeResult.score,
        feedback: gradeResult.feedback,
        breakdown: gradeResult.breakdown,
      },
    });

    // Step 3: Critic (if below threshold)
    if (gradeResult.score < 0.85 && step < 3) {
      broadcast('step_update', {
        stepNum: step,
        agent: 'critic',
        message: 'Critic analyzing failure...',
        status: 'in-progress',
      });

      const critique = await liveEnv.critic.critique(solverResponse, task, gradeResult);

      broadcast('step_update', {
        stepNum: step,
        agent: 'critic',
        message: `Critique: ${critique.priorityFix}`,
        status: 'complete',
        data: {
          severity: critique.severity,
          priorityFix: critique.priorityFix,
          specificFeedback: critique.specificFeedback,
        },
      });
    }

    // Track best
    if (gradeResult.score > bestReward) {
      bestReward = gradeResult.score;
      bestResponse = solverResponse;
    }

    episode.steps.push({
      step,
      response: solverResponse,
      score: gradeResult.score,
      feedback: gradeResult.feedback,
    });

    // Early exit if success
    if (gradeResult.score >= 0.85) {
      broadcast('step_update', {
        stepNum: step,
        agent: 'system',
        message: `✅ Success! Threshold reached.`,
        status: 'complete',
      });
      break;
    }
  }

  episode.totalReward = bestReward;
  episode.success = bestReward >= 0.85;
  episode.bestResponse = bestResponse;

  // Record to memory
  memory.recordEpisode(episode);

  broadcast('episode_summary', {
    reward: bestReward,
    success: episode.success,
    stepsUsed: episode.steps.length,
  });

  return episode;
}

// ─── Server Start ─────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.separator('WEB DASHBOARD STARTING');
  logger.info(`Server running at http://localhost:${PORT}`);
  logger.info(`WebSocket ready at ws://localhost:${PORT}`);
});
