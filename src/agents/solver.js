// src/agents/solver.js
import { LLMClient } from '../llm/llmClient.js';
import { logger } from '../utils/logger.js';

const BASE_SYSTEM = `You are an expert problem-solving agent. You solve tasks accurately, thoroughly, and clearly.

Your approach:
1. Read the task carefully — understand ALL requirements before writing
2. Structure your response logically with clear sections
3. Show your work (for math/coding/reasoning tasks)
4. Meet all specified constraints (word count, format, etc.)
5. Double-check your answer before submitting

Be direct and specific. Avoid unnecessary preamble.`;

/**
 * The Solver agent attempts to solve tasks using:
 * - Memory-informed prompt injection (learned rules, past strategies)
 * - Step-by-step chain-of-thought
 * - Adaptive prompt based on difficulty
 */
export class SolverAgent {
  constructor() {
    this.llm = new LLMClient({
      model: process.env.SOLVER_MODEL || 'gpt-4o',
      maxTokens: 2048,
    });
    this.baseSystem = BASE_SYSTEM;
  }

  /**
   * Solve a task with optional memory context and critic feedback.
   */
  async solve(task, { memories = null, criticFeedback = null, attempt = 1, optimizedPrompt = null } = {}) {
    const system = this._buildSystem(memories, optimizedPrompt);
    const userMsg = this._buildPrompt(task, criticFeedback, attempt);

    logger.agent(`Solver attempt ${attempt} for [${task.category}/${task.difficulty}] "${task.title}"`);

    const response = await this.llm.prompt(userMsg, {
      system,
      temperature: this._temperatureForDifficulty(task.difficulty, attempt),
      maxTokens: this._tokensForDifficulty(task.difficulty),
    });

    logger.debug(`Solver response length: ${response.length} chars`);
    return response;
  }

  _buildSystem(memories, optimizedPrompt) {
    let system = optimizedPrompt || this.baseSystem;

    if (!memories) return system;

    const parts = [];

    // Inject learned rules
    if (memories.learnedRules?.length) {
      const rules = memories.learnedRules
        .slice(0, 5)
        .map(r => `• [${r.polarity === 'negative' ? 'AVOID' : 'DO'}] ${r.rule}`)
        .join('\n');
      parts.push(`LEARNED RULES FROM PAST EXPERIENCE:\n${rules}`);
    }

    // Inject prompt strategy
    if (memories.promptStrategy) {
      parts.push(`EFFECTIVE STRATEGY FOR THIS TASK TYPE:\n${memories.promptStrategy.strategy}`);
    }

    // Inject past success pattern
    if (memories.recentEpisodes?.length) {
      const successes = memories.recentEpisodes.filter(e => e.success).slice(0, 2);
      if (successes.length) {
        const ex = successes
          .map(e => `- Approach that scored ${e.totalReward.toFixed(2)}: "${e.finalAnswer?.slice(0, 150)}"`)
          .join('\n');
        parts.push(`SUCCESSFUL APPROACHES FROM MEMORY:\n${ex}`);
      }
    }

    if (parts.length) {
      system += '\n\n' + parts.join('\n\n');
    }

    return system;
  }

  _buildPrompt(task, criticFeedback, attempt) {
    let prompt = `TASK: ${task.title}
CATEGORY: ${task.category.toUpperCase()} | DIFFICULTY: ${task.difficulty.toUpperCase()}

${task.prompt}`;

    // Add hints for hard tasks or retry attempts
    if (task.hints?.length && (task.difficulty === 'hard' || attempt > 1)) {
      prompt += `\n\nHINTS:\n${task.hints.map(h => `• ${h}`).join('\n')}`;
    }

    // Inject critic feedback for retry attempts
    if (criticFeedback && attempt > 1) {
      prompt += `\n\n⚠️ PREVIOUS ATTEMPT FEEDBACK (attempt ${attempt - 1}):\n${criticFeedback}\n\nAddress ALL issues above in this attempt.`;
    }

    // Add evaluation criteria reminder for high-stakes tasks
    if (task.evaluationCriteria?.length) {
      prompt += `\n\nEVALUATION CRITERIA (ensure you address each):\n${task.evaluationCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}`;
    }

    return prompt;
  }

  _temperatureForDifficulty(difficulty, attempt) {
    const base = { easy: 0.5, medium: 0.7, hard: 0.8 }[difficulty] || 0.7;
    // Slightly more creative on retries
    return Math.min(base + (attempt - 1) * 0.05, 0.95);
  }

  _tokensForDifficulty(difficulty) {
    return { easy: 1024, medium: 1536, hard: 2048 }[difficulty] || 1536;
  }

  /**
   * Update the base system prompt (called by optimizer).
   */
  updateSystemPrompt(newPrompt) {
    this.baseSystem = newPrompt;
    logger.optimize(`Solver system prompt updated (${newPrompt.length} chars)`);
  }

  getSystemPrompt() {
    return this.baseSystem;
  }
}
