// src/agents/critic.js
import { LLMClient } from '../llm/llmClient.js';
import { logger } from '../utils/logger.js';

const CRITIC_SYSTEM = `You are a rigorous critic reviewing AI-generated responses. Your role is to identify specific, actionable failures and provide targeted feedback that will help the solver improve.

Be honest, precise, and constructive. Focus on what matters most for the task.
Return ONLY valid JSON — no markdown, no preamble.`;

/**
 * Critic agent: analyzes solver responses, identifies failures, provides
 * structured feedback for the next attempt and the optimizer.
 */
export class CriticAgent {
  constructor() {
    this.llm = new LLMClient({
      model: process.env.CRITIC_MODEL || 'gpt-4o-mini',
      maxTokens: 1024,
      temperature: 0.2,
    });
  }

  /**
   * Critique a solver response and return structured feedback.
   */
  async critique(response, task, gradeResult) {
    logger.agent(`Critic analyzing response (score=${gradeResult.score.toFixed(2)})`);

    const prompt = `Critique this response to the task below.

TASK: ${task.title}
CATEGORY: ${task.category} | DIFFICULTY: ${task.difficulty}

TASK PROMPT:
${task.prompt}

EVALUATION CRITERIA:
${(task.evaluationCriteria || []).map((c, i) => `${i + 1}. ${c}`).join('\n')}

SOLVER RESPONSE:
---
${response.slice(0, 2500)}
---

CURRENT SCORE: ${gradeResult.score.toFixed(2)}/1.0
GRADER FEEDBACK: ${gradeResult.feedback || 'N/A'}

Provide a structured critique. Return ONLY this JSON:
{
  "overallAssessment": "<1 sentence summary of main issue>",
  "criticalFailures": ["<specific failure 1>", "<specific failure 2>"],
  "missingElements": ["<what's missing>"],
  "specificFeedback": "<3-5 sentences of actionable feedback for the solver>",
  "improvedApproach": "<what a better answer would look like in 2-3 sentences>",
  "priorityFix": "<the single most important thing to fix next attempt>",
  "severity": "minor|moderate|major",
  "estimatedGapToFull": <0.0-1.0, how much score could be gained with fixes>
}`;

    try {
      const result = await this.llm.prompt(prompt, {
        system: CRITIC_SYSTEM,
        jsonMode: true,
      });

      logger.agent(`Critic: severity=${result.severity}, priority="${result.priorityFix}"`);
      return result;
    } catch (err) {
      logger.warn(`Critic failed: ${err.message}`);
      return {
        overallAssessment: 'Critique unavailable',
        criticalFailures: [],
        missingElements: gradeResult.breakdown?.llm?.missingElements || [],
        specificFeedback: gradeResult.feedback || 'Improve the response.',
        improvedApproach: 'Address the evaluation criteria more explicitly.',
        priorityFix: 'Follow all evaluation criteria',
        severity: gradeResult.score < 0.5 ? 'major' : 'moderate',
        estimatedGapToFull: 1 - gradeResult.score,
      };
    }
  }

  /**
   * Synthesize critiques across multiple episodes to find systemic failures.
   * Used by the optimizer to decide where to focus improvements.
   */
  async synthesizeCritiques(critiques, category) {
    if (!critiques?.length) return null;

    const prompt = `Analyze these critiques from multiple failed attempts on ${category} tasks.
Find SYSTEMIC patterns — issues that appear repeatedly.

CRITIQUES:
${critiques.slice(0, 10).map((c, i) => `[${i + 1}] ${c.overallAssessment || c}`).join('\n')}

Return ONLY JSON:
{
  "systemicIssues": ["<recurring issue 1>", "<recurring issue 2>"],
  "rootCause": "<what is fundamentally causing these failures>",
  "promptFix": "<how to update the system prompt to address root cause>",
  "exampleGoodApproach": "<what a correct approach looks like for this category>"
}`;

    try {
      return await this.llm.prompt(prompt, { system: CRITIC_SYSTEM, jsonMode: true });
    } catch (err) {
      logger.warn(`Critique synthesis failed: ${err.message}`);
      return null;
    }
  }
}
