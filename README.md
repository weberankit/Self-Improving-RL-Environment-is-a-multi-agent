# Self-Improving RL Environment

A multi-agent reinforcement learning system powered by openai LLMs. Agents solve real-world tasks, receive graded rewards, get critic feedback, and **persistently learn** behavioral rules and prompt strategies across runs.

## Key Features

- **Persistent Memory** — Agents remember past failures/successes and apply learned rules to new tasks
- **Real-World Tasks** — 15 tasks across coding, math, reasoning, writing, and analysis (easy/medium/hard)
- **Hybrid Grading** — Programmatic signals + LLM deep evaluation for robust, calibrated rewards
- **Self-Optimization** — Optimizer agent rewrites solver prompts based on RL signal
- **Curriculum Learning** — Tasks progress easy → medium → hard automatically
- **Memory Compression** — Episodic memory auto-compresses into behavioral rules via LLM distillation

## Architecture

```
Task → Solver → Grader → Critic → [Retry] → Memory
                                               ↓
                          Optimizer ←── Episode batch
                               ↓
                        Solver prompt update
```

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 3. Run demo (6 episodes, full RL loop)
npm run demo

# 4. Full training run (20 episodes, curriculum)
npm start

# 5. Evaluation only (tests learned behaviors)
npm run eval
```

## Project Structure

```
self-improving-rl-env/
├── src/
│   ├── env/SelfImprovingEnv.js   # Main orchestrator, episode loop
│   ├── agents/
│   │   ├── solver.js             # Task-solving agent
│   │   ├── critic.js             # Failure analysis agent
│   │   └── optimizer.js          # Policy improvement agent
│   ├── llm/llmClient.js          # Anthropic API client (retry, JSON mode)
│   ├── grader/
│   │   ├── programmatic.js       # Fast category-specific scoring
│   │   └── llmGrader.js          # Deep LLM evaluation + hybrid blend
│   ├── memory/memoryStore.js     # Persistent JSON memory + rule distillation
│   ├── tasks/sampleTasks.js      # 15 real-world tasks (5 categories × 3 difficulties)
│   └── utils/logger.js           # Colorized logger with icons
├── demo/runDemo.js               # Interactive demo with progress display
└── docs/
    ├── architecture.md           # System design & RL formulation
    └── reward-design.md          # Reward shaping & scoring rubrics
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OpenAI_API_KEY` | — | Required |
| `MAX_EPISODES` | `20` | Training episodes per run |
| `MAX_STEPS_PER_EPISODE` | `3` | Max solver retries per task |
| `REWARD_THRESHOLD` | `0.85` | Score for "success" |
| `MEMORY_FILE` | `./memory/agent_memory.json` | Persistent memory location |
| `LOG_LEVEL` | `info` | `debug|info|warn|error` |

## How Memory Works

Memory persists in `./memory/agent_memory.json` between runs:

1. **Episodes** — Raw trajectories (compressed after 300 entries)
2. **Learned Rules** — Distilled behavioral rules (e.g., "Always show formulas for math tasks")
3. **Prompt Strategies** — Per-category effective prompting approaches
4. **Task Stats** — Success rates per category/difficulty

On each run, the solver receives relevant memories as context, and the optimizer updates strategies based on what worked.

## Programmatic API

```javascript
import { SelfImprovingEnv } from './src/env/SelfImprovingEnv.js';
import { sampleTask } from './src/tasks/sampleTasks.js';

const env = new SelfImprovingEnv({ maxEpisodes: 10 });

// Full training loop
const report = await env.run();

// Or: single episode
const task = sampleTask({ category: 'coding', difficulty: 'medium' });
const episode = await env.step(task);
console.log(episode.totalReward, episode.success);
```

## Reward Design

- **Programmatic (40%)**: Fast category-specific heuristics (code blocks, formula presence, word count, etc.)
- **LLM (60%)**: Deep rubric-based evaluation with strengths/improvements
- **Blended**: Robust against both pattern gaming and LLM inconsistency

See `docs/reward-design.md` for full breakdown.

## Requirements

- Node.js 18+
- Openai API key with Claude Sonnet access

