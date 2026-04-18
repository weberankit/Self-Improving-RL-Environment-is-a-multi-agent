# Architecture

## Overview

The Self-Improving RL Environment is a multi-agent system where LLM agents learn from experience through a reinforcement learning loop. The key innovation is **persistent memory** — the system learns behavioral rules, prompt strategies, and task-specific patterns that carry over across runs.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    SelfImprovingEnv (Orchestrator)              │
│                                                                 │
│  ┌─────────┐    ┌────────┐    ┌─────────┐    ┌──────────────┐ │
│  │  Task   │───▶│ Solver │───▶│ Grader  │───▶│   Critic     │ │
│  │Selector │    │ Agent  │    │(Hybrid) │    │   Agent      │ │
│  └─────────┘    └────────┘    └─────────┘    └──────────────┘ │
│       ▲              ▲              │                │          │
│       │              │              ▼                ▼          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                  Memory Store                           │    │
│  │  - Episode history    - Learned rules                   │    │
│  │  - Prompt strategies  - Task stats                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                         ▲                                       │
│                         │                                       │
│                   ┌──────────┐                                  │
│                   │Optimizer │ (runs every N episodes)          │
│                   │  Agent   │                                  │
│                   └──────────┘                                  │
└─────────────────────────────────────────────────────────────────┘
```

## RL Formulation

| Concept | Implementation |
|---------|----------------|
| **State** | Task + Memory context + Attempt number |
| **Action** | Solver agent's text response |
| **Reward** | Hybrid grade score (0.0–1.0) |
| **Policy** | Solver's system prompt |
| **Value function** | Per-category success rate in Memory |
| **Policy update** | Optimizer rewrites Solver's system prompt |

## Episode Loop

```
for each episode:
  1. Select task (curriculum or random)
  2. Load relevant memories (rules, strategy, past episodes)
  3. for step in 1..maxSteps:
      a. Solver generates response (conditioned on memories + feedback)
      b. Grader scores response (programmatic + LLM)
      c. if score >= threshold: break (success)
      d. Critic analyzes failure, generates feedback
      e. Solver retries with feedback injected
  4. Record best response + reward in Memory
  5. if episode % optimizeEvery == 0: run Optimizer
```

## Agent Roles

### Solver Agent
- Primary task executor
- Receives: task prompt + memory context + critic feedback
- Produces: task solution
- Adapts: temperature by difficulty, token budget by task size
- Updated by: Optimizer (system prompt rewrite)

### Critic Agent
- Analyzes failures specifically
- Produces: structured JSON critique with priority fix
- Also synthesizes systemic patterns across episodes

### Optimizer Agent
- Meta-level policy improver
- Reads: episode batch + critiques + memory stats
- Produces: updated system prompt + behavioral rules + category strategy
- Triggers: every N episodes or when performance drops

### Grader (Hybrid)
- Programmatic grader: fast, deterministic, category-specific signals
- LLM grader: deep semantic evaluation with rubric
- Blends 40% programmatic + 60% LLM for robustness

## Memory System

```
agent_memory.json
├── episodes[]         Raw episode records (compressed after 300)
├── learnedRules[]     Distilled behavioral rules (sorted by reinforcement count)
├── promptStrategies{} Per-category effective strategies
├── taskStats{}        Success rates per category/difficulty combo
└── globalStats        Cumulative performance metrics
```

Memory **persists across runs** — each new run starts with prior knowledge baked in.

## Task Categories

| Category | Key Grading Signals |
|----------|---------------------|
| `coding` | Code blocks, function declarations, edge case handling |
| `math` | Formulas, step-by-step working, numerical answers |
| `reasoning` | Numbered steps, logical connectives, clear conclusion |
| `writing` | Word count compliance, structure, professional tone |
| `analysis` | Trade-offs, frameworks, specific recommendations |
