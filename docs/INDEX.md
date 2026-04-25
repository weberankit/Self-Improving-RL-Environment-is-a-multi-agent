# 📖 Documentation Index

## Quick Navigation

### 🚀 Getting Started (Start Here!)
1. **[QUICKSTART.md](QUICKSTART.md)** - 2-minute setup guide
   - Installation steps
   - First task example
   - Expected learning curve
   - Tips & tricks

2. **[README.md](README.md)** - Project overview
   - Features overview
   - Architecture diagram
   - Configuration options
   - FAQ section

### 🎨 Web Dashboard
1. **[docs/dashboard-guide.md](docs/dashboard-guide.md)** - Complete user guide
   - UI layout explanation
   - Feature walkthrough
   - Real-time updates explanation
   - Memory stats interpretation
   - API reference
   - Troubleshooting

2. **[docs/dashboard-architecture.md](docs/dashboard-architecture.md)** - System design
   - Architecture diagrams
   - Data flow diagrams
   - Episode lifecycle
   - WebSocket messages
   - Memory structure

3. **[DASHBOARD_SUMMARY.md](DASHBOARD_SUMMARY.md)** - Implementation details
   - What was built
   - New files created
   - Feature list
   - Technical stack
   - File structure

### 🏗️ System Architecture & Design
1. **[docs/architecture.md](docs/architecture.md)** - RL system design
   - Multi-agent architecture
   - Episode loop details
   - Optimization process
   - Memory management
   - Curriculum learning

2. **[docs/reward-design.md](docs/reward-design.md)** - Scoring system
   - Programmatic grading (40%)
   - LLM grading (60%)
   - Hybrid blend approach
   - Scoring rubrics
   - Category-specific criteria

---

## Reading Recommendations

### For First-Time Users
```
Start with QUICKSTART.md
    ↓
Then open dashboard and try first task
    ↓
Read docs/dashboard-guide.md while using it
    ↓
Check docs/dashboard-architecture.md for deeper understanding
```

### For Developers
```
Read README.md for overview
    ↓
Study docs/architecture.md for system design
    ↓
Review server.js for backend implementation
    ↓
Review public/index.html for frontend
    ↓
Explore src/ directory for agent implementations
```

### For System Architects
```
docs/architecture.md - High-level design
    ↓
docs/dashboard-architecture.md - Full system flow
    ↓
docs/reward-design.md - Scoring methodology
    ↓
Review all agent code in src/agents/
```

---

## File Reference

### Root Level
- **README.md** - Main project documentation
- **QUICKSTART.md** - Quick start guide
- **DASHBOARD_SUMMARY.md** - Dashboard implementation summary
- **package.json** - Dependencies & scripts
- **.env.example** - Configuration template

### Backend
- **server.js** - Express + WebSocket server

### Frontend
- **public/index.html** - Interactive web dashboard

### Documentation
- **docs/architecture.md** - RL system architecture
- **docs/reward-design.md** - Reward/grading system
- **docs/dashboard-guide.md** - Dashboard user guide
- **docs/dashboard-architecture.md** - Dashboard technical design

### Source Code
- **src/index.js** - CLI entry point
- **src/env/SelfImprovingEnv.js** - Main orchestrator
- **src/agents/solver.js** - Task solver agent
- **src/agents/critic.js** - Failure analysis agent
- **src/agents/optimizer.js** - Policy optimizer agent
- **src/grader/llmGrader.js** - Hybrid grader
- **src/grader/programmatic.js** - Fast grading
- **src/memory/memoryStore.js** - Persistent memory
- **src/llm/llmClient.js** - LLM API client
- **src/tasks/sampleTasks.js** - Task bank
- **src/utils/logger.js** - Logging utility

### Demo & Memory
- **demo/runDemo.js** - Interactive demo
- **memory/agent_memory.json** - Persistent learning state

---

## Key Concepts

### What is the Dashboard?
The web dashboard visualizes the Self-Improving RL system in real-time:
- Left panel: User task input
- Right panel: All agents working
- Live updates via WebSocket
- Memory statistics

### How Does Learning Work?
1. Agent solves tasks
2. Gets graded (hybrid: 40% programmatic + 60% LLM)
3. Gets critic feedback
4. Records to memory
5. Every 5 tasks: system prompt improves
6. Next tasks benefit from learned knowledge

### Why Real-time Visualization?
To show:
- How agents collaborate
- How prompts are enhanced
- How learning accumulates
- How scores improve over time
- What rules are learned

### What Can I Learn?
- How LLMs work with prompts
- How reinforcement learning works
- How agents collaborate
- How memory persists
- How systems improve over time

---

## Common Questions

**Q: Where do I start?**
A: Read QUICKSTART.md, then run `npm run web`

**Q: How do I understand the code?**
A: Start with docs/architecture.md, then explore src/

**Q: What do the different colors mean?**
A: Blue = working, Green = complete, Red = error

**Q: How long until the agent learns?**
A: After 5-10 tasks, you'll see significant improvement

**Q: Can I modify the tasks?**
A: Yes! Use the web dashboard input form with custom tasks

**Q: Where is my learning saved?**
A: In `memory/agent_memory.json`

---

## Troubleshooting

### Can't start the server?
1. Check Node.js is installed: `node --version`
2. Check dependencies: `npm install`
3. Check port 3000 is free: `lsof -i :3000`
4. Set OPENAI_API_KEY in .env

### Dashboard not loading?
1. Check server is running: terminal output
2. Try hard refresh: `Ctrl+Shift+R`
3. Check WebSocket connection: browser console
4. Check firewall: might block WebSocket

### Tasks taking too long?
1. OpenAI API might be rate-limited
2. Wait between submissions
3. Check your API quota
4. Monitor token usage in terminal

### Memory not growing?
1. Need at least 1 successful episode
2. Rules appear after optimization (every 5 tasks)
3. Check `memory/agent_memory.json` file exists

---

## Next Steps

1. **Explore the Dashboard**
   - Submit 5-10 different tasks
   - Watch learning happen
   - Monitor memory growth

2. **Understand the Code**
   - Read src/agents/ files
   - Study src/env/SelfImprovingEnv.js
   - Review src/memory/memoryStore.js

3. **Customize for Your Use**
   - Add custom task types
   - Modify scoring rubrics
   - Extend agent capabilities

4. **Share Your Results**
   - Screenshot your learning curves
   - Document your tasks
   - Share what you learned

---

## Resources

### Documentation Files
- 5 main documentation files
- 2000+ lines of documentation
- Detailed guides and references
- Architecture diagrams

### Code Files
- 330 lines: server.js
- 800 lines: index.html
- 3000+ lines: core RL system
- Well-commented and organized

### Examples
- 15 sample tasks in taskbank
- Multiple agent implementations
- Real working dashboard
- Complete workflow

---

## Document Status

✅ QUICKSTART.md - Ready
✅ README.md - Updated
✅ docs/architecture.md - Ready
✅ docs/reward-design.md - Ready
✅ docs/dashboard-guide.md - Ready
✅ docs/dashboard-architecture.md - Ready
✅ DASHBOARD_SUMMARY.md - Ready
✅ This file (INDEX.md) - Ready

---

## Support

For issues or questions:
1. Check relevant documentation file
2. Search code comments
3. Review example tasks
4. Check memory/agent_memory.json for state

---

**Last Updated:** April 24, 2026
**Version:** 2.0 with Web Dashboard
**Status:** Ready to Use 🚀
