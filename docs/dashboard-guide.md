# Web Dashboard Guide

## 🎯 Overview

The Self-Improving RL Dashboard provides **real-time visualization** of the entire system working. It shows:

1. **User Input** (left panel)
2. **All Agents Working** (right panel)
3. **Memory State** (left sidebar)

---

## 🎨 UI Layout

### Left Panel - Input & Stats

**Input Section:**
- **Task Title**: Name of the problem
- **Task Description**: Full problem statement
- **Category**: Type of task (coding, math, reasoning, writing, analysis)
- **Difficulty**: Task difficulty (easy, medium, hard)

**Memory Stats:**
- **Total Episodes**: How many tasks have been solved
- **Behavioral Rules**: Patterns learned from past tasks
- **Strategies**: Effective approaches per category
- **Performance**: Average and peak scores

### Right Panel - Real-time Visualization

Shows each agent working sequentially:

1. **🤖 Solver Agent** - Generates response using learned knowledge
   - Shows attempt number (1/3, 2/3, 3/3)
   - Preview of generated response
   - Loaded rules from memory

2. **🏆 Grader Agent** - Evaluates the response
   - Shows score (0-100%)
   - Displays feedback and breakdown
   - Method used (hybrid blend)

3. **🧠 Critic Agent** - Analyzes failures (if score < 0.85)
   - Shows severity level (minor, moderate, major)
   - Priority fix for next attempt
   - Specific actionable feedback

4. **💾 Memory** - Records learning
   - Rules added from this attempt
   - Episode recorded
   - Stats updated

---

## 🔄 Real-time Updates

The dashboard uses **WebSocket** for live updates. Each agent action sends:

```
{
  type: "step_update",
  data: {
    stepNum: 1,           // Attempt number
    agent: "solver",      // Which agent is working
    message: "...",       // What's happening
    status: "in-progress" // current | complete | error
    data: {               // Agent-specific data
      response: "...",
      score: 0.92,
      feedback: "..."
    }
  }
}
```

Colors indicate status:
- 🔵 **Blue** - In Progress
- 🟢 **Green** - Complete
- 🔴 **Red** - Error

---

## 📊 Memory Stats Explained

### Learned Rules
Example learned rules:
- "Always show edge cases for coding tasks"
- "Include formulas for math problems"
- "Explain each logical step"

These are automatically extracted from successful/failed attempts.

### Strategies
Per-category effective approaches:
```json
{
  "coding": "Always include: function signature, edge cases, test examples",
  "math": "Show: formula, step-by-step calculation, final answer",
  "reasoning": "Explain: each constraint, elimination process, logic"
}
```

### Performance
- **Avg Reward**: Average score across all attempts
- **Best Reward**: Highest score achieved
- **Success Rate**: % of tasks that scored ≥ 0.85

---

## 🚀 How to Use

### 1. Start the Server
```bash
npm install  # Install dependencies (first time only)
npm run web
```

### 2. Open Dashboard
Navigate to: http://localhost:3000

### 3. Submit a Task

**Example 1: Coding**
```
Title: "Implement binary search"
Description: "Write a function that implements binary search algorithm. Handle edge cases like empty array."
Category: Coding
Difficulty: Medium
```

**Example 2: Math**
```
Title: "Solve quadratic equation"
Description: "Solve: 2x² + 3x - 5 = 0. Show all working and verify with formulas."
Category: Math
Difficulty: Medium
```

**Example 3: Reasoning**
```
Title: "Logic puzzle"
Description: "5 people sit in a row. Alex is not next to Blake. Blake is in even position. Who sits where?"
Category: Reasoning
Difficulty: Easy
```

### 4. Watch in Real-time

The right panel shows:
1. Task received ✓
2. Solver working...
3. Score displayed
4. Critic feedback (if needed)
5. Episode summary

### 5. Submit Another Task

The agent uses learning from the previous task to solve this one better!

---

## 📈 Memory Growth

### First Task (No Prior Learning)
- Generic system prompt
- Score might be ~0.65
- Creates first memories

### Second Task (Using First Task Learning)
- System prompt enhanced with learned rules
- References previous successful patterns
- Score might be ~0.75 (improved!)

### Third+ Tasks
- Agent becomes more specialized
- Scores continue improving
- Memory builds comprehensive knowledge

---

## 🔍 What Happens Behind the Scenes

### When You Submit a Task:

```
1. Backend receives task
   ↓
2. Solver loads memory
   - Retrieves relevant learned rules
   - Loads category-specific strategy
   - References past successful attempts
   ↓
3. Solver generates response
   - Uses enhanced prompt with learned knowledge
   - Adapts to task category/difficulty
   ↓
4. Grader evaluates
   - Programmatic check (40%)
   - LLM deep evaluation (60%)
   - Blended score
   ↓
5. Critic analyzes (if score < 0.85)
   - Identifies specific issues
   - Provides actionable feedback
   - Suggests improvements
   ↓
6. Solver retries (if needed)
   - Uses critic feedback
   - Generates improved response
   - Re-evaluates
   ↓
7. Memory records everything
   - Stores episode
   - Extracts learned rules
   - Updates statistics
```

### Optimization Happens Every 5 Tasks:

After 5 tasks are completed:
1. Optimizer analyzes patterns
2. Identifies what worked/failed
3. Refines system prompt
4. Updates learned rules
5. Next tasks use better prompt!

---

## 💡 Tips for Best Results

1. **Be Specific**: Detailed task descriptions help agents understand requirements
2. **Provide Criteria**: List evaluation criteria when possible
3. **Start Simple**: Easy tasks first help agent learn foundations
4. **Check Memory**: Monitor left panel to see what agent learned
5. **Experiment**: Try different categories to see learning transfer

---

## 🐛 Troubleshooting

### WebSocket not connecting?
- Ensure server is running: `npm run web`
- Check http://localhost:3000 loads
- Check browser console for errors

### Slow responses?
- LLM API might be rate-limited
- Wait a few seconds between submissions
- Check your OpenAI API key is valid

### Memory not growing?
- Need at least 1 successful episode first
- Watch the memory stats update in real-time
- Rules appear after optimization (every 5 tasks)

### Can't submit task?
- Title and description required
- Check API is reachable: `curl http://localhost:3000/api/memory`

---

## 🎯 Example Workflow

```
Start Dashboard
     ↓
Submit: "Write FizzBuzz in JavaScript"
     ↓
Watch Solver, Grader, Critic work
     ↓
Score: 0.72 (needs improvement)
     ↓
Memory learns: "Need edge cases"
     ↓
Submit: "Write LRU Cache"
     ↓
Score: 0.85 (better! Rules helped)
     ↓
Memory learns: "This approach works for coding"
     ↓
Submit: "Write priority queue"
     ↓
Score: 0.90 (excellent! Agent specialized)
```

After 3-5 tasks, you'll see significant improvement!

---

## 📝 API Reference

### REST Endpoints

**POST /api/task**
Submit a new task to solve
```json
{
  "title": "Task name",
  "prompt": "Full description",
  "category": "coding|math|reasoning|writing|analysis",
  "difficulty": "easy|medium|hard",
  "evaluationCriteria": ["criterion 1", "criterion 2"]
}
```

**GET /api/memory**
Get current memory state
```json
{
  "episodes": [...],
  "learnedRules": [...],
  "promptStrategies": {...},
  "taskStats": {...},
  "globalStats": {...}
}
```

**GET /api/session**
Get current session state
```json
{
  "task": {...},
  "status": "starting|in-progress|completed",
  "steps": [...],
  "episode": {...}
}
```

**POST /api/reset**
Reset all state and memory
```json
{ "success": true }
```

### WebSocket Messages

Listen for these message types:

- `task_received` - Task submitted
- `step_update` - Agent update
- `episode_complete` - Episode finished
- `episode_summary` - Final results
- `session_reset` - State reset

---

## 🎓 Learning from the Dashboard

The dashboard shows you:

1. **How prompts work** - See instructions injected into solver
2. **How grading works** - See score breakdown (programmatic + LLM)
3. **How learning works** - See memory rules applied
4. **How optimization works** - See prompt improve after 5 tasks
5. **How agents interact** - See full pipeline in sequence

Use this to understand your own AI systems better!
