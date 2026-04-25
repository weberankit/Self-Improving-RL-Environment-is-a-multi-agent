# 🚀 Quick Start Guide - Web Dashboard

## Installation & Setup (2 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=sk_your_key_here
```

### 3. Start the Web Dashboard
```bash
npm run web
```

### 4. Open in Browser
Navigate to: **http://localhost:3000**

---

## 🎯 Your First Task (30 seconds)

### Step 1: Fill in the Left Panel

**Task Title:**
```
Write a Fibonacci function
```

**Task Description:**
```
Write a function that generates the first N Fibonacci numbers. 
Handle edge cases like N=0, N=1. Return as array.
```

**Category:** Coding
**Difficulty:** Medium

### Step 2: Click "Submit Task"

### Step 3: Watch the Magic! 🪄

The right panel shows real-time:
- 🤖 **Solver** generating code
- 🏆 **Grader** scoring response (0-100%)
- 🧠 **Critic** giving feedback if needed
- 💾 **Memory** learning from this task

---

## 📊 What You'll See

```
🚀 SOLVER (Attempt 1/3)
Status: In Progress...
↓
Generated 245 character response

🏆 GRADER
Score: 87%
Feedback: "Good structure, handles edge cases well"

💾 MEMORY
Learned Rule: "For coding tasks, always include test cases"
Episode recorded successfully
```

---

## 🧠 Watch Learning Happen

### Task 1: Fibonacci
- Score: ~75% (first attempt, no prior learning)

### Task 2: Binary Search
- Score: ~85% (agent remembers: "add test cases")
- Memory grows!

### Task 3: Merge Sort
- Score: ~92% (agent uses learned patterns)
- Getting smarter!

---

## 💡 Tips & Tricks

### For Best Results:

1. **Be Specific**
   ✅ "Write a function to find duplicate elements with O(n) time complexity"
   ❌ "Duplicates"

2. **Provide Context**
   ✅ "Implement quicksort with 3-way partitioning for arrays with duplicates"
   ❌ "Sort"

3. **Test Different Categories**
   ```
   Task 1: Coding → Agent learns code patterns
   Task 2: Math → Agent learns formula patterns
   Task 3: Reasoning → Agent learns logic patterns
   ```

4. **Watch Memory Grow**
   - Check left panel "Learned Rules"
   - After 5 tasks, see prompt improvements
   - Performance increases over time

---

## 🎨 Dashboard Features

### Left Panel
- ✏️ Submit custom tasks
- 📊 View learned rules
- 📈 Track performance metrics
- 🧠 Monitor memory growth

### Right Panel
- 🤖 Watch Solver work step-by-step
- 🏆 See real-time scores
- 🧠 Read Critic feedback
- 💾 Track what gets learned

### Real-time Visualization
- Blue indicator = Currently working
- Green indicator = Complete
- Red indicator = Issues found
- Live WebSocket updates

---

## 🔧 Common Tasks to Try

### Coding
```
Title: Implement LRU Cache
Description: Build a cache with get/put O(1) operations
Category: Coding | Difficulty: Medium
```

### Math
```
Title: Solve quadratic equation
Description: 2x² + 5x + 3 = 0, show all working
Category: Math | Difficulty: Easy
```

### Reasoning
```
Title: Logic puzzle
Description: 5 people, constraints... (see sample tasks)
Category: Reasoning | Difficulty: Medium
```

### Writing
```
Title: Write product summary
Description: Summarize this feature in 100 words (professional tone)
Category: Writing | Difficulty: Easy
```

### Analysis
```
Title: Analyze dataset
Description: Given these numbers, find patterns and anomalies
Category: Analysis | Difficulty: Hard
```

---

## 📈 Expected Learning Curve

```
Task 1:  Score 60-70%  (Cold start, no learning)
Task 2:  Score 65-75%  (Some learning applied)
Task 3:  Score 70-80%  (Patterns emerging)
Task 4:  Score 75-85%  (Good improvement)
Task 5:  Score 80-85%  (Near threshold)
    ↓ OPTIMIZATION (Prompt gets enhanced)
Task 6:  Score 85-92%  (Significant jump!)
Task 7:  Score 88-95%  (Continued improvement)
Task 8:  Score 90-98%  (Expert level)
```

---

## 🐛 Troubleshooting

### Port Already in Use?
```bash
# Use different port
PORT=3001 npm run web
```

### API Key Error?
```bash
# Check .env file
cat .env | grep OPENAI_API_KEY

# Should show: OPENAI_API_KEY=sk_...
```

### WebSocket Connection Error?
- Refresh browser page (F5)
- Check server is running (`npm run web`)
- Look at terminal for error messages

### Tasks Taking Too Long?
- OpenAI API might be rate-limited
- Wait 1-2 seconds between submissions
- Check your API quota

---

## 📚 Learn More

- **Full Dashboard Guide:** `docs/dashboard-guide.md`
- **Architecture Details:** `docs/architecture.md`
- **Reward System:** `docs/reward-design.md`
- **Main README:** `README.md`

---

## 🎓 What You're Learning

By using this dashboard, you see:

1. **How LLMs Work** - Real prompts injected into solver
2. **How RL Works** - Reward signals driving improvement
3. **How Learning Works** - Rules extracted and applied
4. **How Agents Collaborate** - Solver → Grader → Critic → Memory
5. **How Prompt Engineering Works** - Prompts improve over time

---

## 🚀 Next Steps

After exploring the dashboard:

1. **Try different task categories** - See learning transfer
2. **Monitor memory growth** - Check left panel stats
3. **Track improvements** - Notice scores increasing
4. **Read the code** - Understand how agents work
5. **Build your own** - Extend for your use case

---

## ❓ Questions?

- Check dashboard error messages (look for red indicators)
- Read the Dashboard Guide: `docs/dashboard-guide.md`
- Review agent code in `src/agents/`
- Check memory file: `memory/agent_memory.json`

---

## 🎉 Enjoy!

Submit tasks, watch the system work, and see it get smarter in real-time! 

```
🚀 The future is now
👀 You're watching AI learn
🧠 In real-time
```

Happy experimenting! 🚀
