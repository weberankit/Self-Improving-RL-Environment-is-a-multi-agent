# 🎨 Dashboard Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      WEB BROWSER (Client)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────┬────────────────────────────────────┐  │
│  │                     │                                    │  │
│  │   LEFT PANEL        │       RIGHT PANEL                  │  │
│  │   (Input)           │       (Visualization)              │  │
│  │                     │                                    │  │
│  │ ┌─────────────────┐ │ ┌────────────────────────────────┐ │  │
│  │ │ Input Form:     │ │ │ Task Info                      │ │  │
│  │ │ • Title         │ │ │ • Title & Description          │ │  │
│  │ │ • Description   │ │ │ • Category & Difficulty        │ │  │
│  │ │ • Category      │ │ └────────────────────────────────┘ │  │
│  │ │ • Difficulty    │ │ ┌────────────────────────────────┐ │  │
│  │ │                 │ │ │ 🤖 SOLVER AGENT                │ │  │
│  │ │ [Submit] [Reset]│ │ │ Status: In Progress...         │ │  │
│  │ └─────────────────┘ │ │ Response: [preview]            │ │  │
│  │                     │ │ Memory Loaded: 5 rules         │ │  │
│  │ ┌─────────────────┐ │ └────────────────────────────────┘ │  │
│  │ │ Memory Stats:   │ │ ┌────────────────────────────────┐ │  │
│  │ │ Episodes: 12    │ │ │ 🏆 GRADER AGENT                │ │  │
│  │ │ Rules: 8        │ │ │ Score: 87%                     │ │  │
│  │ │ Strategies: 3   │ │ │ Feedback: Good structure       │ │  │
│  │ │ Avg Reward: 0.84│ │ └────────────────────────────────┘ │  │
│  │ └─────────────────┘ │ ┌────────────────────────────────┐ │  │
│  │                     │ │ 🧠 CRITIC AGENT                │ │  │
│  │ ┌─────────────────┐ │ │ Severity: Moderate             │ │  │
│  │ │ Recent Rules:   │ │ │ Issue: Missing edge cases      │ │  │
│  │ │ • Show edge     │ │ │ Fix: Add bounds checking       │ │  │
│  │ │   cases         │ │ └────────────────────────────────┘ │  │
│  │ │ • Include test  │ │ ┌────────────────────────────────┐ │  │
│  │ │   examples      │ │ │ 💾 MEMORY & SUMMARY            │ │  │
│  │ │ • Clear methods │ │ │ Episode recorded              │ │  │
│  │ │                 │ │ │ Rules learned: 2              │ │  │
│  │ └─────────────────┘ │ │ Final Score: 87% ✅           │ │  │
│  │                     │ └────────────────────────────────┘ │  │
│  │                     │                                    │  │
│  └─────────────────────┴────────────────────────────────────┘  │
│                                                                   │
│                WebSocket Connection (Live Updates)              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    NODE.JS SERVER (Backend)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Express App                                                     │
│  ├─ GET  /api/memory                                            │
│  ├─ GET  /api/session                                           │
│  ├─ POST /api/task                                              │
│  ├─ POST /api/reset                                             │
│  └─ WebSocket /                                                 │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         SelfImprovingEnv Orchestration                  │   │
│  │                                                          │   │
│  │  When task received:                                    │   │
│  │  1. Load memory                                         │   │
│  │     → Send WebSocket: "Memory loaded"                  │   │
│  │                                                          │   │
│  │  2. Call Solver.solve()                                │   │
│  │     → Send WebSocket: "Solver step_update"            │   │
│  │                                                          │   │
│  │  3. Call Grader.grade()                                │   │
│  │     → Send WebSocket: "Grader step_update"            │   │
│  │                                                          │   │
│  │  4. Call Critic.critique() (if needed)                │   │
│  │     → Send WebSocket: "Critic step_update"            │   │
│  │                                                          │   │
│  │  5. Memory.recordEpisode()                             │   │
│  │     → Send WebSocket: "Episode summary"               │   │
│  │                                                          │   │
│  │  6. Send all updates to connected clients             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Solver  │  │  Grader  │  │  Critic  │  │ Optimizer│        │
│  │ Agent    │  │ Agent    │  │ Agent    │  │ Agent    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│       │              │              │              │            │
│       └──────────────┴──────────────┴──────────────┘            │
│                      │                                           │
│                      ↓                                           │
│             ┌─────────────────┐                                 │
│             │  Memory Store   │                                 │
│             │  JSON File      │                                 │
│             │  ├─ Episodes    │                                 │
│             │  ├─ Rules       │                                 │
│             │  ├─ Strategies  │                                 │
│             │  └─ Task Stats  │                                 │
│             └─────────────────┘                                 │
│                      │                                           │
│                      ↓                                           │
│             ┌─────────────────────┐                             │
│             │ ./memory/            │                             │
│             │ agent_memory.json    │                             │
│             └─────────────────────┘                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Request/Response Flow

```
USER SUBMITS TASK
       │
       ↓
┌──────────────────────────────────────┐
│ POST /api/task                       │
│ {                                    │
│   title: "FizzBuzz",                 │
│   prompt: "Write function...",       │
│   category: "coding",                │
│   difficulty: "medium",              │
│   evaluationCriteria: [...]          │
│ }                                    │
└──────────────────────────────────────┘
       │
       ↓
   ┌───────────────────────────────────────────────────┐
   │ BACKEND: solveTaskWithUpdates(task)               │
   │                                                   │
   │ Step 1: Load Memory                              │
   │ ├─ Query: getRelevantMemories(task)             │
   │ ├─ Result: [5 rules, 1 strategy, examples]      │
   │ └─ Send WS: {type: "step_update", agent: "mem" }│
   │                                                   │
   │ Step 2: Solver.solve()                           │
   │ ├─ Input: task + memories + attempt=1           │
   │ ├─ Process: LLM with enhanced prompt            │
   │ ├─ Output: response text                        │
   │ └─ Send WS: {type: "step_update", agent: "solv"}│
   │                                                   │
   │ Step 3: Grader.grade()                           │
   │ ├─ Input: response + task                       │
   │ ├─ Process: Programmatic (40%) + LLM (60%)     │
   │ ├─ Output: score, feedback, breakdown           │
   │ └─ Send WS: {type: "step_update", agent: "grad"}│
   │                                                   │
   │ Step 4: Check Score                              │
   │ ├─ if score ≥ 0.85 → SUCCESS (skip critic)      │
   │ └─ else → Continue to Critic                     │
   │                                                   │
   │ Step 5: Critic.critique()                        │
   │ ├─ Input: response + task + grade              │
   │ ├─ Process: LLM analysis                        │
   │ ├─ Output: feedback, severity, priority         │
   │ └─ Send WS: {type: "step_update", agent: "crit"}│
   │                                                   │
   │ Step 6: Memory.recordEpisode()                   │
   │ ├─ Save episode record                          │
   │ ├─ Update statistics                            │
   │ ├─ Store in JSON file                           │
   │ └─ Send WS: {type: "episode_summary", ...}      │
   │                                                   │
   └───────────────────────────────────────────────────┘
       │
       ↓
   WebSocket Messages to Client
   ├─ {type: "task_received", data: {task}}
   ├─ {type: "step_update", agent: "memory", ...}
   ├─ {type: "step_update", agent: "solver", ...}
   ├─ {type: "step_update", agent: "grader", ...}
   ├─ {type: "step_update", agent: "critic", ...} (optional)
   └─ {type: "episode_summary", reward: 0.87, success: true}
       │
       ↓
   FRONTEND UPDATES (in real-time)
   ├─ Clear right panel
   ├─ Add task display
   ├─ Add solver card (in-progress)
   ├─ Add solver card (complete + response)
   ├─ Add grader card (in-progress)
   ├─ Add grader card (complete + score)
   ├─ Add critic card (if needed)
   └─ Add summary card (final results)
```

## Episode Lifecycle

```
EPISODE START
     │
     ├─→ Load Memories from JSON
     │   └─ Learned rules
     │   └─ Strategies
     │   └─ Past examples
     │
     ├─→ STEP 1 (Attempt 1/3)
     │   │
     │   ├─→ SOLVER
     │   │   └─ Prompt = BASE + RULES + STRATEGY
     │   │   └─ Generates response
     │   │   └─ Send: WS update to UI
     │   │
     │   ├─→ GRADER
     │   │   ├─ Programmatic check: +0.4 score
     │   │   ├─ LLM evaluation: +0.6 score
     │   │   └─ Final: 0.85 threshold check
     │   │   └─ Send: WS update to UI
     │   │
     │   └─→ IF score < 0.85:
     │       ├─→ CRITIC
     │       │   └─ Analysis of response
     │       │   └─ Generate feedback
     │       │   └─ Send: WS update to UI
     │       │
     │       └─→ STEP 2 (Attempt 2/3)
     │           └─ Same as Step 1
     │           └─ Use critic feedback
     │           └─ Usually higher score
     │
     ├─→ IF still < 0.85:
     │   └─→ STEP 3 (Attempt 3/3)
     │       └─ Final attempt
     │       └─ Use accumulated feedback
     │
     ├─→ BEST RESPONSE SELECTED
     │   └─ Highest score from all attempts
     │   └─ Success = best_score >= 0.85
     │
     ├─→ RECORD EPISODE
     │   ├─ Save to memory.state.episodes
     │   ├─ Update task statistics
     │   ├─ Update global statistics
     │   └─ Trigger compression if needed
     │
     ├─→ EVERY 5 EPISODES: OPTIMIZATION
     │   ├─ Analyze 5 episodes
     │   ├─ Find patterns in failures
     │   ├─ Generate improved prompt
     │   ├─ Extract behavioral rules
     │   ├─ Update learned rules
     │   └─ Next 5 episodes use better prompt
     │
     ├─→ SEND SUMMARY TO UI
     │   └─ Final reward
     │   └─ Success status
     │   └─ Steps used
     │
     └─→ EPISODE END
         └─ Memory persists to JSON
         └─ Ready for next episode
```

## Memory Growth Timeline

```
COLD START
├─ Task 1: Score 0.65 (No learning)
│  └─ Episode recorded
│  └─ No rules yet
│
INITIAL LEARNING
├─ Task 2: Score 0.72 (First rule applied)
│  └─ Learned: "Show your work"
│
├─ Task 3: Score 0.68 (Learning compounds)
│  └─ Learned: "Handle edge cases"
│
├─ Task 4: Score 0.75
│  └─ Learned: "Clear structure"
│
├─ Task 5: Score 0.70
│  ├─ Learned: "Include examples"
│  └─ → OPTIMIZATION #1 TRIGGERED
│     └─ Prompt enhanced with all 4 rules
│     └─ New prompt = more specific instructions
│
IMPROVEMENT PHASE
├─ Task 6: Score 0.88 ↑ (Better prompt!)
│  └─ Uses optimized prompt
│
├─ Task 7: Score 0.85 ✓
│  └─ Threshold reached
│
├─ Task 8: Score 0.82
│
├─ Task 9: Score 0.90 ↑
│
├─ Task 10: Score 0.87
│  └─ → OPTIMIZATION #2 TRIGGERED
│     └─ Further refinements
│
EXPERT PHASE
├─ Task 11: Score 0.92 ↑↑ (Highly optimized)
│
├─ Task 12: Score 0.95 ↑↑↑ (Expert level)
│
└─ Task 13+: Score 0.90+ (Consistent excellence)

Memory Growth:
Initial: 0 rules, 0 strategies
After 5: 4 rules, 1 strategy
After 10: 8 rules, 2 strategies
After 20: 15+ rules, 3 strategies
```

## Data Structure

```
MEMORY FILE: memory/agent_memory.json
│
├─ episodes (array)
│  └─ [{id, timestamp, taskId, category, difficulty, 
│       totalReward, steps, success, actions, finalAnswer}]
│  └─ Stores full trajectory of each episode
│  └─ Auto-compresses to recent 300 entries
│
├─ learnedRules (array)
│  └─ [{id, pattern, rule, polarity, category, confidence, 
│       reinforcements, lastSeen, created}]
│  └─ Behavioral patterns extracted from episodes
│  └─ Examples: "Always show edge cases", "Include tests"
│
├─ promptStrategies (object)
│  └─ {
│       "coding": {strategy: "...", performance: {}},
│       "math": {strategy: "...", performance: {}},
│       ...
│     }
│  └─ Per-category effective approaches
│  └─ Injected into solver prompt
│
├─ taskStats (object)
│  └─ {
│       "coding_easy": {attempts, successes, avgReward, rewards[]},
│       "math_medium": {...},
│       ...
│     }
│  └─ Success rates per category/difficulty
│
└─ globalStats
   └─ {totalEpisodes, totalSteps, avgReward, bestReward, improvementRate}
   └─ System-wide metrics
```

## WebSocket Message Types

```
FROM SERVER TO CLIENT:

1. task_received
   {type: "task_received", data: {task}}
   └─ User submitted task, system starts

2. step_update
   {
     type: "step_update",
     data: {
       stepNum: 1,
       agent: "solver|grader|critic|memory|system",
       message: "Human-readable description",
       status: "in-progress|complete|error",
       data: {agent-specific data}
     }
   }
   └─ Agent working or complete

3. episode_complete
   {type: "episode_complete", data: {episode}}
   └─ Full episode object

4. episode_summary
   {
     type: "episode_summary",
     data: {
       reward: 0.87,
       success: true,
       stepsUsed: 2
     }
   }
   └─ Summary of results

5. session_reset
   {type: "session_reset", data: {}}
   └─ Session cleared
```

## Deployment Architecture

```
Production Ready:
├─ Frontend: public/index.html (static)
├─ Backend: server.js (Express)
├─ Storage: memory/agent_memory.json (persistent)
└─ LLM API: OpenAI API (external)

Scalability Options:
├─ Redis for session management (optional)
├─ Database for memory (PostgreSQL/MongoDB)
├─ Load balancer for multiple instances
└─ Container deployment (Docker)
```

---

## Summary

The dashboard visualizes:
✅ Real-time agent interactions
✅ Memory learning and growth
✅ Prompt optimization cycles
✅ Reward signals and feedback
✅ Full episode lifecycle
✅ System performance metrics

All happening live in the browser! 🎉
