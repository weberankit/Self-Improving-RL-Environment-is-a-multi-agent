// src/tasks/sampleTasks.js

/**
 * Real-world task bank across 5 categories × 3 difficulties.
 * Each task has: id, category, difficulty, prompt, hints, timeLimit
 */

export const TASK_BANK = [
  // ─── CODING ───────────────────────────────────────────────────────────────
  {
    id: 'code_easy_01',
    category: 'coding',
    difficulty: 'easy',
    title: 'FizzBuzz Variant',
    prompt: `Write a JavaScript function \`fizzBuzzPrime(n)\` that returns an array of numbers 1 to n where:
- Multiples of 3 are replaced with "Fizz"
- Multiples of 5 are replaced with "Buzz"  
- Multiples of 15 are replaced with "FizzBuzz"
- Prime numbers (not covered above) are replaced with "Prime"
- All other numbers remain as numbers.
Return the function code only.`,
    hints: ['Check primality before the FizzBuzz rules', 'Use a helper isPrime function'],
    evaluationCriteria: ['correctness', 'handles edge cases (n=0, n=1)', 'clean code'],
    timeLimit: 60,
    tags: ['javascript', 'algorithms'],
  },
  {
    id: 'code_medium_01',
    category: 'coding',
    difficulty: 'medium',
    title: 'LRU Cache Implementation',
    prompt: `Implement an LRU (Least Recently Used) Cache class in JavaScript with:
- \`constructor(capacity)\` — sets max capacity
- \`get(key)\` — returns value or -1 if not found; marks as recently used
- \`put(key, value)\` — inserts/updates; evicts LRU entry when at capacity
- O(1) time complexity for both operations
Provide the complete class implementation with explanation of your data structure choice.`,
    hints: ['Use a Map + doubly linked list', 'JS Map preserves insertion order — exploit this'],
    evaluationCriteria: ['O(1) complexity', 'correct LRU eviction', 'handles capacity=1'],
    timeLimit: 120,
    tags: ['javascript', 'data-structures', 'cache'],
  },
  {
    id: 'code_hard_01',
    category: 'coding',
    difficulty: 'hard',
    title: 'Async Task Queue with Concurrency Control',
    prompt: `Build a \`TaskQueue\` class in JavaScript that:
- Accepts async tasks (functions returning Promises)
- Processes at most \`concurrency\` tasks simultaneously
- Has \`add(task, priority=0)\` — higher priority runs first
- Has \`drain()\` — returns Promise that resolves when all tasks complete
- Tracks: completed count, failed count, avg execution time
- Handles individual task failures without crashing the queue
Include full implementation + a usage example with 10 tasks and concurrency=3.`,
    hints: ['Use a priority queue (min-heap or sorted array)', 'Track active slot count'],
    evaluationCriteria: ['correct concurrency limiting', 'priority ordering', 'error isolation', 'drain() works'],
    timeLimit: 180,
    tags: ['javascript', 'async', 'concurrency', 'queues'],
  },

  // ─── MATH ─────────────────────────────────────────────────────────────────
  {
    id: 'math_easy_01',
    category: 'math',
    difficulty: 'easy',
    title: 'Compound Interest',
    prompt: `A principal of $12,500 is invested at an annual interest rate of 6.4%, compounded quarterly.
(a) Write the formula and calculate the amount after 8 years.
(b) How long (in years, to 2 decimal places) will it take for the investment to triple?
Show all working clearly.`,
    hints: ['A = P(1 + r/n)^(nt)', 'Use logarithms for part (b)'],
    evaluationCriteria: ['correct formula', 'correct final amount', 'correct tripling time'],
    timeLimit: 90,
    tags: ['finance', 'exponentials', 'logarithms'],
  },
  {
    id: 'math_medium_01',
    category: 'math',
    difficulty: 'medium',
    title: 'Probability — Conditional Events',
    prompt: `In a factory, 3 machines (A, B, C) produce 45%, 35%, 20% of output respectively.
Defect rates: A=2%, B=3%, C=5%.
(a) What is the overall probability a randomly selected item is defective?
(b) Given an item IS defective, what is the probability it came from machine B? (Bayes' theorem)
(c) If 10,000 items are produced daily, how many defective items are expected from each machine?
Show all work with formulas.`,
    hints: ['Law of total probability for (a)', 'Bayes: P(B|D) = P(D|B)P(B)/P(D)'],
    evaluationCriteria: ['correct total defect rate', 'correct posterior probability', 'correct daily counts'],
    timeLimit: 120,
    tags: ['probability', 'bayes', 'statistics'],
  },
  {
    id: 'math_hard_01',
    category: 'math',
    difficulty: 'hard',
    title: 'Optimization with Lagrange Multipliers',
    prompt: `Find the maximum value of f(x,y,z) = xyz subject to the constraint x + 2y + 3z = 12, where x,y,z > 0.
(a) Set up the Lagrange multiplier equations.
(b) Solve the system to find the critical point.
(c) Verify this is a maximum (not minimum).
(d) What is the maximum value of f?
(e) Interpret the result: what does the Lagrange multiplier λ represent economically?`,
    hints: ['∇f = λ∇g', 'The AM-GM inequality can verify the result'],
    evaluationCriteria: ['correct Lagrange setup', 'correct critical point', 'correct max value', 'meaningful interpretation'],
    timeLimit: 180,
    tags: ['calculus', 'optimization', 'multivariable'],
  },

  // ─── REASONING ────────────────────────────────────────────────────────────
  {
    id: 'reasoning_easy_01',
    category: 'reasoning',
    difficulty: 'easy',
    title: 'Logical Deduction Puzzle',
    prompt: `Five colleagues — Alex, Blake, Casey, Drew, Emery — sit in a row (positions 1-5, left to right).
Clues:
1. Alex is not adjacent to Casey.
2. Blake sits in an even-numbered position.
3. Drew is to the right of Emery.
4. Casey is not at either end.
5. Blake and Drew are not adjacent.
Determine the exact seating arrangement. Show your logical steps.`,
    hints: ['Start with Blake (even positions: 2 or 4)', 'Use elimination'],
    evaluationCriteria: ['correct arrangement', 'clear logical steps', 'all clues verified'],
    timeLimit: 90,
    tags: ['logic', 'deduction', 'puzzles'],
  },
  {
    id: 'reasoning_medium_01',
    category: 'reasoning',
    difficulty: 'medium',
    title: 'Fermi Estimation',
    prompt: `Estimate how many piano tuners there are in Chicago. 
Break down your estimate step-by-step with clear assumptions for:
(a) Population of Chicago
(b) Fraction of households with pianos
(c) How often pianos need tuning
(d) How many pianos a tuner services per day/year
(e) Final estimate
Then assess: is your estimate likely too high or too low, and why?`,
    hints: ['Chicago pop ≈ 2.7M', 'Think about the full pipeline, not just final answer'],
    evaluationCriteria: ['reasonable assumptions', 'correct chain of logic', 'reasonable final estimate', 'uncertainty analysis'],
    timeLimit: 120,
    tags: ['estimation', 'decomposition', 'quantitative-reasoning'],
  },
  {
    id: 'reasoning_hard_01',
    category: 'reasoning',
    difficulty: 'hard',
    title: 'Multi-Step Strategic Analysis',
    prompt: `A startup has $500K runway, 8 months to profitability target, and 3 choices:
Option A: Double down on current B2B product (50% chance of hitting target, costs $300K)
Option B: Pivot to consumer market (30% chance of hitting target, costs $200K, but if it works, 3x revenue potential)
Option C: Cut burn rate by 40%, extend runway to 14 months, then reassess (delays target but reduces failure risk)

Analyze using:
1. Expected value calculation for A and B
2. Real options theory for C
3. Risk-adjusted recommendation considering team morale, market timing, and investor dynamics
4. Decision tree for the next 6 months
What should the startup do and why?`,
    hints: ['EV = probability × payoff', 'Real options value optionality'],
    evaluationCriteria: ['correct EV math', 'nuanced risk analysis', 'considers non-financial factors', 'clear recommendation'],
    timeLimit: 180,
    tags: ['strategy', 'decision-theory', 'startups', 'risk'],
  },

  // ─── WRITING ──────────────────────────────────────────────────────────────
  {
    id: 'writing_easy_01',
    category: 'writing',
    difficulty: 'easy',
    title: 'Persuasive Email',
    prompt: `Write a professional email (150-200 words) from a junior engineer to their manager requesting approval for a $1,200 conference attendance (PyCon US). 
Requirements:
- Clear subject line
- Business case: 3 specific benefits to the team
- Acknowledge budget constraints proactively  
- Professional but warm tone
- Strong call to action`,
    hints: ['Lead with value, not the request', 'Be specific about ROI'],
    evaluationCriteria: ['within word count', 'strong business case', 'professional tone', 'clear CTA'],
    timeLimit: 60,
    tags: ['professional-writing', 'persuasion', 'email'],
  },
  {
    id: 'writing_medium_01',
    category: 'writing',
    difficulty: 'medium',
    title: 'Technical Blog Post Introduction',
    prompt: `Write a compelling introduction (300-400 words) for a technical blog post titled "Why Your Microservices Are Slower Than Your Monolith (And How to Fix It)".
Requirements:
- Hook: Surprising statistic or counterintuitive claim in first 2 sentences
- Problem setup: What most teams get wrong about microservices performance
- Credibility: Brief mention of real-world context (without fabricating specifics)
- Preview: 3 concrete things readers will learn
- Avoid: Jargon without explanation, vague promises, clickbait`,
    hints: ['Great tech writing starts with a specific, relatable frustration', 'Show the gap between expectation and reality'],
    evaluationCriteria: ['strong hook', 'clear problem statement', 'specific preview', 'appropriate technical depth'],
    timeLimit: 120,
    tags: ['technical-writing', 'blogging', 'software-engineering'],
  },
  {
    id: 'writing_hard_01',
    category: 'writing',
    difficulty: 'hard',
    title: 'Policy Brief',
    prompt: `Write a 500-word policy brief for city council recommending an approach to regulating short-term rentals (Airbnb-style) in a mid-sized city experiencing housing affordability issues.
Structure:
1. Executive Summary (50 words)
2. Problem Statement with data-driven framing (100 words)
3. Three policy options with pros/cons (200 words)
4. Recommended option with implementation steps (100 words)
5. Potential objections and responses (50 words)

Tone: Balanced, evidence-forward, politically neutral. Avoid advocacy language.`,
    hints: ['Good policy writing acknowledges tradeoffs explicitly', 'Numbers build credibility even when estimated'],
    evaluationCriteria: ['correct structure', 'balanced framing', 'concrete recommendations', 'acknowledges tradeoffs', 'appropriate word count'],
    timeLimit: 180,
    tags: ['policy', 'government', 'urban-planning', 'structured-writing'],
  },

  // ─── ANALYSIS ─────────────────────────────────────────────────────────────
  {
    id: 'analysis_easy_01',
    category: 'analysis',
    difficulty: 'easy',
    title: 'Root Cause Analysis',
    prompt: `An e-commerce website's conversion rate dropped from 3.2% to 1.8% after a deployment last Tuesday.
Available data:
- Bounce rate increased by 35% on mobile devices
- Desktop conversion unchanged
- New feature: redesigned checkout flow
- Payment processor: no errors logged
- Page load time on mobile: increased from 2.1s to 4.7s
Perform a structured root cause analysis (5-Whys or Fishbone). Identify the most likely root cause and recommend 3 immediate actions.`,
    hints: ['Mobile-specific + post-deployment = clear signal', 'Prioritize by impact and ease of fix'],
    evaluationCriteria: ['correct root cause identification', 'structured analysis', 'actionable recommendations', 'prioritization'],
    timeLimit: 90,
    tags: ['analytics', 'debugging', 'product', 'root-cause'],
  },
  {
    id: 'analysis_medium_01',
    category: 'analysis',
    difficulty: 'medium',
    title: 'Competitive Analysis Framework',
    prompt: `You are advising a B2B SaaS company (project management tool, $49/seat/month, 200 customers) entering a market dominated by Asana and Monday.com.
Perform a structured competitive analysis:
1. Identify 3 dimensions where incumbents are vulnerable
2. Apply Porter's Five Forces briefly to assess market attractiveness
3. Define a specific ICP (Ideal Customer Profile) that avoids direct competition
4. Recommend a go-to-market wedge strategy with rationale
5. Identify the 2 biggest risks to this strategy
Be specific and opinionated — avoid generic frameworks without application.`,
    hints: ['Look for underserved verticals or company sizes', 'Wedge = specific pain for specific customer segment'],
    evaluationCriteria: ['specific vulnerabilities identified', 'correct Porter analysis', 'clear ICP', 'actionable wedge', 'honest risk assessment'],
    timeLimit: 150,
    tags: ['business-strategy', 'competitive-analysis', 'saas', 'gtm'],
  },
  {
    id: 'analysis_hard_01',
    category: 'analysis',
    difficulty: 'hard',
    title: 'System Design Trade-off Analysis',
    prompt: `Design the data pipeline architecture for a real-time fraud detection system processing 50,000 transactions/second.
Analyze and decide on each trade-off:
1. Stream processing: Kafka+Flink vs Kinesis+Lambda vs Pulsar+Spark — which and why?
2. Feature store: Online vs offline vs unified — for fraud features with <100ms latency requirement
3. ML serving: Model per customer segment vs global model with customer embeddings
4. Storage: Hot path (Redis/DynamoDB) vs cold path (S3+Athena) data split strategy
5. Consistency vs availability: What CAP theorem trade-off is correct for fraud detection?

For each decision: state your choice, the key reason, and what you sacrifice.
Include a simple architecture diagram in ASCII art.`,
    hints: ['Fraud detection is availability-critical but not ACID-critical', 'Feature freshness matters more than feature completeness for real-time fraud'],
    evaluationCriteria: ['justified technology choices', 'latency requirements addressed', 'correct CAP analysis', 'practical architecture', 'ASCII diagram'],
    timeLimit: 240,
    tags: ['system-design', 'data-engineering', 'ml-systems', 'architecture'],
  },
];

/**
 * Get a random task, optionally filtered by category/difficulty.
 */
export function sampleTask({ category, difficulty, exclude = [] } = {}) {
  let pool = TASK_BANK.filter(t => !exclude.includes(t.id));
  if (category) pool = pool.filter(t => t.category === category);
  if (difficulty) pool = pool.filter(t => t.difficulty === difficulty);
  if (!pool.length) pool = TASK_BANK.filter(t => !exclude.includes(t.id));
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get tasks in a round-robin curriculum order (easy → medium → hard cycling).
 */
export function getCurriculumSequence(categories = null) {
  const difficulties = ['easy', 'medium', 'hard'];
  const cats = categories || ['coding', 'math', 'reasoning', 'writing', 'analysis'];
  const sequence = [];

  for (const diff of difficulties) {
    for (const cat of cats) {
      const tasks = TASK_BANK.filter(t => t.category === cat && t.difficulty === diff);
      sequence.push(...tasks);
    }
  }
  return sequence;
}

export const CATEGORIES = ['coding', 'math', 'reasoning', 'writing', 'analysis'];
export const DIFFICULTIES = ['easy', 'medium', 'hard'];
