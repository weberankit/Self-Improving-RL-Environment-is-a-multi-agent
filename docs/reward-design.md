# Reward Design

## Philosophy

The reward signal must be:
1. **Dense** — feedback at every step (not just terminal)
2. **Calibrated** — scores that meaningfully distinguish quality levels
3. **Robust** — not easily gamed by pattern matching
4. **Fast** — programmatic checks provide instant signal without burning API tokens

## Hybrid Reward Architecture

```
Final Score = 0.4 × Programmatic + 0.6 × LLM
```

### Why 40/60 split?
- Pure programmatic: gameable, misses semantic quality
- Pure LLM: expensive, inconsistent across calls
- Hybrid: cheap signal + semantic depth = best of both

## Programmatic Scoring (per category)

### Coding (max 1.0)
| Check | Weight |
|-------|--------|
| Has code block | +0.25 |
| Function/class declaration | +0.15 |
| Return statement | +0.10 |
| Edge cases mentioned | +0.10 |
| Explanation present | +0.10 |
| Task keyword coverage | up to +0.30 |

### Math (max 1.0)
| Check | Weight |
|-------|--------|
| Formulas present | +0.15 |
| Multiple numbers (working) | +0.15 |
| Multi-part answers (a,b,c) | +0.15 |
| Math terminology | up to +0.20 |
| Sufficient length | +0.25 |
| Final answer stated | +0.10 |

### Writing (max 1.0)
| Check | Weight |
|-------|--------|
| Word count compliance | +0.30 |
| Structural formatting | +0.20 |
| Persuasive language | +0.10 |
| CTA / closing | +0.10 |
| Professional tone | +0.10 |
| Avoids clichés | +0.10 |
| Other signals | +0.10 |

## LLM Scoring Rubric

```
0.00–0.30  Poor     — Major gaps, incorrect, or off-topic
0.30–0.50  Partial  — Some correct elements but significant issues
0.50–0.70  Adequate — Mostly correct with notable gaps
0.70–0.85  Good     — Correct with minor issues
0.85–0.95  Excellent — Comprehensive and accurate
0.95–1.00  Perfect  — Exceptional, exceeds all criteria
```

## Reward Shaping

### Step-level rewards
Each retry step gets its own score. The episode reward = max score achieved across all steps (not cumulative). This prevents the solver from being rewarded for padding.

### Threshold-based early stopping
If score ≥ `REWARD_THRESHOLD` (default 0.85), the episode ends successfully. This:
- Prevents over-generation on easy tasks
- Focuses retry budget on genuinely hard cases

### Critic-augmented shaping
When a step scores poorly, the critic provides a `priorityFix` — a targeted intervention for the next attempt. This acts as a shaped reward signal, directing the solver toward what matters most.

## Memory as Value Function

After multiple episodes, `taskStats` accumulates:
```json
{
  "coding_hard": {
    "attempts": 12,
    "successes": 7,
    "avgReward": 0.74,
    "successRate": 0.583
  }
}
```

This acts as an approximate value function V(s) for each (category, difficulty) state. The Optimizer uses this to prioritize which categories need prompt improvement.

## Anti-Gaming Properties

1. **Keyword checks use task-specific criteria** — not static patterns
2. **LLM grader uses rubric + full task context** — hard to fool with formatting tricks
3. **Critic explicitly looks for missing elements** — detects length padding
4. **Word count checks are bidirectional** — too long also penalized for writing tasks
5. **Critic synthesizes systemic patterns** — catches consistent gaming strategies

## Optimization Objective

The Optimizer maximizes:
```
E[R] = Σ (episode_reward × discount) over trajectory
```

In practice, it maximizes average reward over a rolling window of N episodes, adjusting the solver's policy (system prompt) to reduce the gap between current performance and the `REWARD_THRESHOLD`.
