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
# Edit .env and add your OPENAI_API_KEY

# 3. Run web dashboard (interactive visualization!)
npm run web
# Open http://localhost:3000 in browser

# 4. Run demo (6 episodes, full RL loop)
npm run demo

# 5. Full training run (20 episodes, curriculum)
npm start

# 6. Evaluation only (tests learned behaviors)
npm run eval
```

## Web Dashboard 🎨

The interactive dashboard lets you see the entire system in action:

```
Left Panel (Input):            Right Panel (Visualization):
├─ Task Title                 ├─ 🤖 Solver Agent
├─ Task Description           │  └─ Response generation in progress
├─ Category                   ├─ 🏆 Grader Agent
├─ Difficulty                 │  └─ Score & feedback
└─ Memory Stats               ├─ 🧠 Critic Agent
   ├─ Learned Rules           │  └─ Failure analysis
   ├─ Strategies              ├─ 💾 Memory
   └─ Performance             │  └─ Rules learned & stored
                              └─ ⚡ Optimization
                                 └─ Prompt improvements
```

**Features:**
- **Real-time updates** via WebSocket
- **Step-by-step visualization** of all agents
- **Memory inspection** showing learned rules
- **Score tracking** and episode summaries
- **Live agent workflow** from input to output
- **Learning visualization** showing how system improves

**See it in action:**
```bash
npm run web
# Open http://localhost:3000
# Submit tasks and watch agents work in real-time!
```

For detailed dashboard guide, see [docs/dashboard-guide.md](docs/dashboard-guide.md)

## Project Structure

```
self-improving-rl-env/
├── server.js                         # Express + WebSocket server for dashboard
├── public/
│   └── index.html                    # Interactive web dashboard UI
├── src/
│   ├── env/SelfImprovingEnv.js       # Main orchestrator, episode loop
│   ├── agents/
│   │   ├── solver.js                 # Task-solving agent
│   │   ├── critic.js                 # Failure analysis agent
│   │   └── optimizer.js              # Policy improvement agent
│   ├── llm/llmClient.js              # OpenAI API client (retry, JSON mode)
│   ├── grader/
│   │   ├── programmatic.js           # Fast category-specific scoring
│   │   └── llmGrader.js              # Deep LLM evaluation + hybrid blend
│   ├── memory/memoryStore.js         # Persistent JSON memory + rule distillation
│   ├── tasks/sampleTasks.js          # 15 real-world tasks (5 categories × 3 difficulties)
│   └── utils/logger.js               # Colorized logger with icons
├── demo/runDemo.js                   # Interactive demo with progress display
├── docs/
│   ├── architecture.md               # System design & RL formulation
│   ├── reward-design.md              # Reward shaping & scoring rubrics
│   └── dashboard-guide.md            # Web dashboard user guide
├── memory/
│   └── agent_memory.json             # Persistent learning state
└── logs/                             # Experiment logs
```

│   │   ├── solver.js             # Task-solving agent
│   │   ├── critic.js             # Failure analysis agent
│   │   └── optimizer.js          # Policy improvement agent
│   ├── llm/llmClient.js          # openai API client (retry, JSON mode)
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

## FAQ — How the System Works

### Q: Does the system pick random tasks from the task bank?

**A:** Not exactly. Task selection depends on the `useCurriculum` setting:

- **With Curriculum (default, training mode)**: Uses a predefined sequence that progresses easy → medium → hard across all 5 categories. Not random — structured learning.
- **Without Curriculum (eval/random mode)**: Picks random tasks with a no-repeat preference to avoid the same task twice in a row.

For **user-provided tasks**, the system uses whatever task you give it and learns from it.

### Q: Does the agent pick one task and work on it? Why sequence tasks?

**A:** Each episode handles **one task at a time** with up to 3 retry steps:
- Episode 1: Task A (with retries if needed)
- Episode 2: Task B (with retries if needed)
- Episode 3: Task C (with retries if needed)

**Why multiple tasks in sequence?**
1. **Learning Diversity** — Agent learns patterns from different problem types (coding vs. math vs. reasoning)
2. **Memory Building** — Distills general rules like "Always show formulas for math" or "Always include edge cases for coding"
3. **Curriculum** — Starts with easy tasks to build foundation, then progresses to harder tasks

Without diverse tasks, the agent would only learn one specific problem, not generalizable skills.

### Q: If a user provides a new task after the agent learned from 5 taskbank tasks, how does it respond?

**A:** The agent uses all accumulated learning to solve the new task better:

1. **Loads learned knowledge**: Rules, strategies, and optimized prompt from previous 5 tasks
2. **Injects context**: System prompt is enhanced with learned rules (e.g., "Always show edge cases")
3. **Generates response**: Uses this enriched prompt to solve the user task
4. **Gets graded**: Receives score and feedback
5. **Records learning**: Saves this as new knowledge for future tasks

**Result**: Each user task improves because the agent already learned from the taskbank + previous user tasks.

### Q: Does the system learn from taskbank tasks AND user tasks?

**A:** Yes! Exactly. The learning cycle is:

```
PHASE 1: TRAINING (Learn from Taskbank)
  Episodes 1-5: Solve taskbank tasks
  → Learns general rules (math needs formulas, code needs edge cases, etc.)
  → Memory saved: learned rules + strategies

PHASE 2: USER TASKS (Apply + Learn)
  User asks: "Write a sorting algorithm"
  → Agent uses Phase 1 learning
  → Solves with high quality
  → Gets graded + feedback
  → ADDS to memory
  
  User asks: "Another sorting problem"
  → Agent uses Phase 1 + Phase 2 learning
  → Even better response
  → Adds MORE to memory
```

**Result**: Over 100 user tasks, the agent becomes an expert in solving those specific types of problems.

### Q: When does the system prompt get updated? After each task or after 5-6 tasks?

**A:** System prompt updates happen on a **batch schedule**, not per-episode:

```
Episodes 1-5:   Use ORIGINAL prompt
After Episode 5: ⚡ OPTIMIZATION PASS
                • Analyze all 5 episodes
                • Find patterns in failures
                • Generate IMPROVED prompt
                • Update solver

Episodes 6-10:  Use UPDATED prompt (better!)
After Episode 10: ⚡ SECOND OPTIMIZATION
                • Further refinement
                • New prompt version

Episodes 11-15: Use FURTHER IMPROVED prompt
```

**Configuration:**
```javascript
const env = new SelfImprovingEnv({
  optimizeEvery: 5  // Can change to 3, 10, etc.
});
```

**Example Flow:**
- Episode 1-5 avg score: 0.67 (below 0.85 threshold) ❌
- Optimizer analyzes: "Missing edge cases, formulas not shown, vague reasoning"
- Updates prompt with rules: "ALWAYS show edge cases", "ALWAYS include formulas"
- Episode 6-10 avg score: 0.83 (improving!) ✓
- Optimizer refines further: "Analysis tasks need more detail"
- Episode 11-15 avg score: 0.87+ (approaching target) ✅

**For User Tasks:**
- Solves with current best prompt (accumulated learning)
- After enough user tasks (e.g., 5), optimization runs again
- Prompt updates to include user-task-specific learning
- Next user task benefits from improved prompt

### Q: Can I use this for my own questions/tasks?

**A:** Yes! Two approaches:

```javascript
// Approach 1: Run full training, then ask custom task
const env = new SelfImprovingEnv({ maxEpisodes: 20 });
await env.run();  // Train on taskbank

// Then solve your custom task
const myTask = {
  title: "Your Problem",
  category: "coding",
  prompt: "Your problem description...",
  evaluationCriteria: ["criterion 1", "criterion 2"]
};
const episode = await env.step(myTask);
console.log(episode.bestResponse);

// Approach 2: Build a REST API wrapper
// POST /solve { task: {...} }
// Returns: { response: "...", score: 0.92, reasoning: "..." }
```

The agent will apply all learned knowledge to your custom tasks and get smarter with each one.

### Q: How does the memory actually improve performance?

**A:** Through three mechanisms:

1. **Behavioral Rules**: "DO: Show edge cases for coding", "AVOID: Missing formulas for math"
2. **Prompt Strategies**: Per-category effective approaches injected into system prompt
3. **Episode Patterns**: Successful responses stored as reference examples

When solving a new task:
- Gets relevant rules injected into system prompt
- References effective strategies for that category
- Sees examples of similar successful solutions
- Result: Better informed responses

### Q: What's the difference between training and eval modes?

**A:** 
- **Training** (`npm start`): Curriculum learning with optimization. Agent improves progressively.
- **Eval** (`npm run eval`): Tests learned behaviors on new tasks without optimization. Shows if learning transferred.
- **Demo** (`npm run demo`): 6 episodes with full RL loop visible for understanding.