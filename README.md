

Self-Improving RL Environment

A multi-agent reinforcement learning system powered by LLMs where agents solve tasks, get graded, receive feedback, and continuously improve over time.

Unlike traditional RL, this system learns by rewriting its own prompt + building persistent memory.

🧠 Core Idea (LLM as RL Policy)

Instead of numeric actions, this system uses language as the action space:

State = Task + Memory Context + Attempt Number
Action = Solver's generated response
Reward = Score (0.0 → 1.0)
Policy = Solver’s system prompt (continuously optimized)
🔁 Full Learning Loop
Task → Solver → Grader → Critic → [Retry with feedback]
                                      ↓
                                Memory stores
                                      ↓
                         Optimizer updates prompt
⚙️ Step-by-Step Example (How It Actually Works)

Let’s say the task is:

“Write a function fizzBuzzPrime(n)”

1. Memory Injection

Before solving:

Loads past rules (e.g., “always handle edge cases”)
Loads prompt strategy for coding
Loads similar past episodes
2. Solver Attempt (Step 1)

Solver generates a response using:

Base prompt
learned rules
memory context
3. Hybrid Grading

Two layers:

Programmatic (40%)
Code present
Function exists
Return statement
LLM Evaluation (60%)
Correctness
Completeness
Clarity

Final score → 0.0 – 1.0

4. Critic Feedback (if failed)

If score < threshold:

Critic analyzes failure:

Missing edge cases
Incorrect logic
Weak explanation
5. Retry (Improvement Loop)

Solver retries with:

Previous feedback injected

→ Produces improved answer

6. Memory Update

Stores:

Episode summary
Reward
Success/failure
Feedback patterns

Also updates:

Task stats (per category/difficulty)
Global stats
7. Optimization (Every N Episodes)

After N episodes (default = 5):

Optimizer:

Analyzes failures + successes
Extracts patterns
Rewrites solver system prompt

Example improvement:

OLD:
"You are a helpful assistant"

NEW:
"For coding tasks:
 - Always handle edge cases
 - Include input validation
 - Explain logic briefly"
8. Memory Compression (Advanced)

After many episodes:

Raw history → compressed into rules

## Architecture

```
Task → Solver → Grader → Critic → [Retry] → Memory
                                               ↓
                          Optimizer ←── Episode batch
                               ↓
                        Solver prompt update
```


Example:

"Always check n <= 0"
"Include helper functions for prime logic"
🧠 Two Modes of Learning (IMPORTANT)
1. Training Mode (Taskbank)

System learns from predefined tasks:

Coding
Math
Reasoning
Writing
Analysis

Uses:

Curriculum (easy → hard)
Optimization cycles
Memory building
2. User Task Mode (Real Usage)

User provides task:

env.step(customTask)

System:

Uses learned memory + optimized prompt
Solves task
Gets graded
Learns from user task too

👉 So learning is continuous, not limited to training.

🔥 Key Insight

The system improves from BOTH:

Taskbank (training data)
User inputs (real-world tasks)
🧩 Multi-Agent System
🤖 Solver
Generates solution
🧠 Critic
Finds mistakes
Suggests fixes
🏆 Grader
Scores response (0–1)
⚡ Optimizer
Rewrites system prompt using experience
💾 Memory System (Persistent Learning)

Stored in:

memory/agent_memory.json

Tracks:

Episodes (history)
Learned Rules
Prompt Strategies
Task Performance Stats
📊 Why Stats Matter
Task Stats
coding_easy → success rate, avg reward

Helps:

Understand weak areas
Guide optimizer
Global Stats
totalEpisodes
avgReward
bestReward

Helps:

Track improvement over time
Evaluate system performance
🧠 Prompt Evolution (Very Important)

Prompt is NOT static.

It evolves like this:

Episodes 1–5   → Base Prompt
Episode 5      → Optimization → New Prompt
Episodes 6–10  → Improved Prompt
Episode 10     → Optimization again

👉 Prompt becomes smarter over time.

👥 Multi-User Behavior
By Default:
Shared memory file
Shared learned rules
Same optimized prompt

👉 All users benefit from each other’s learning

If Needed:

You can isolate users by:

Separate memory files
Separate env instances
✨ Standout Features
✅ Persistent learning across runs
🧠 Self-rewriting prompts (meta-learning)
🔁 Retry loop with critic feedback
📊 Hybrid reward system
📦 Memory compression into rules
🎯 Works on real-world tasks
⚡ Learns from users dynamically
🚀 Quick Start
npm install
npm run demo
npm start
npm run web
🌐 Web Dashboard

Run:

npm run web

Open:

http://localhost:3000

See:

Solver thinking
Grader scoring
Critic feedback
Memory updates
Optimization in real-time
🏗️ Architecture
Task → Solver → Grader → Critic → [Retry] → Memory
                                               ↓
                          Optimizer ←── Episode batch
                               ↓
                        Solver prompt update
📁 Project Structure
src/
├── env/            # RL loop
├── agents/         # Solver, Critic, Optimizer
├── memory/         # Persistent learning system
├── grader/         # Reward system
├── tasks/          # Taskbank
🧪 Usage
const env = new SelfImprovingEnv();

// Training
await env.run();

// Custom task
const episode = await env.step(customTask);
⚙️ Requirements
Node.js 18+
OpenAI / Claude API key
🧠 Final Understanding

This is NOT just:

“LLM answering questions”

This is:

“LLM that improves itself based on experience”