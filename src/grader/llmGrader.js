// src/grader/llmGrader.js
import { LLMClient } from '../llm/llmClient.js';
import { programmaticGrade } from './programmatic.js';
import { logger } from '../utils/logger.js';

const GRADER_SYSTEM = `You are an expert evaluator and grader for AI agent responses. Your job is to score responses on a scale of 0.0 to 1.0 based on quality, accuracy, and completeness.

You must return ONLY valid JSON — no markdown, no explanation outside the JSON.`;

/**
 * Hybrid grader: programmatic fast pass + LLM deep evaluation.
 * Blends both scores for robustness.
 */
export class LLMGrader {
  constructor() {
    this.llm = new LLMClient({
      model: process.env.GRADER_MODEL || 'gpt-4o-mini',
      maxTokens: 1024,
      temperature: 0.1, // Low temp for consistent grading
    });
    this.programmaticWeight = 0.4;
    this.llmWeight = 0.6;
  }

  async grade(response, task, context = {}) {
    if (!response || response.trim().length < 10) {
      return { score: 0.0, feedback: 'Response too short or empty.', breakdown: {}, method: 'hybrid' };
    }

    // Fast programmatic grade (always runs)
    const progResult = programmaticGrade(response, task);
    logger.debug(`Programmatic score: ${progResult.score.toFixed(2)} | ${progResult.details.join(', ')}`);

    // LLM grade (may fail gracefully)
    let llmResult = null;
    try {
      llmResult = await this._llmGrade(response, task, context);
    } catch (err) {
      logger.warn(`LLM grader failed, falling back to programmatic only: ${err.message}`);
    }

    // Combine scores
    let finalScore, feedback, breakdown;
    if (llmResult) {
      finalScore = (this.programmaticWeight * progResult.score) + (this.llmWeight * llmResult.score);
      feedback = llmResult.feedback;
      breakdown = {
        programmatic: { score: progResult.score, details: progResult.details },
        llm: { score: llmResult.score, dimensions: llmResult.dimensions },
        weights: { programmatic: this.programmaticWeight, llm: this.llmWeight },
      };
    } else {
      finalScore = progResult.score;
      feedback = `Programmatic evaluation: ${progResult.details.join('; ')}`;
      breakdown = { programmatic: { score: progResult.score, details: progResult.details } };
    }

    const result = {
      score: parseFloat(Math.min(finalScore, 1.0).toFixed(3)),
      feedback,
      breakdown,
      method: llmResult ? 'hybrid' : 'programmatic',
      taskId: task.id,
      category: task.category,
    };

    logger.reward(`Grade: ${result.score.toFixed(2)} [${result.method}] — ${feedback?.slice(0, 100)}`);
    return result;
  }

  async _llmGrade(response, task, context) {
    const recentFeedback = context.recentFeedback
      ? `\nPrevious attempt feedback: ${context.recentFeedback}`
      : '';

    const prompt = `Grade this response to the following task.

TASK TITLE: ${task.title}
TASK CATEGORY: ${task.category} (${task.difficulty})
TASK PROMPT:
${task.prompt}

EVALUATION CRITERIA:
${(task.evaluationCriteria || []).map((c, i) => `${i + 1}. ${c}`).join('\n')}
${recentFeedback}

RESPONSE TO GRADE:
---
${response.slice(0, 3000)}
---

Grade this response. Return ONLY this JSON (no markdown):
{
  "score": <0.0 to 1.0>,
  "dimensions": {
    "accuracy": <0.0-1.0>,
    "completeness": <0.0-1.0>,
    "clarity": <0.0-1.0>,
    "correctness": <0.0-1.0>
  },
  "feedback": "<2-3 sentences: what was done well, what was missed, most important fix>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "missingElements": ["<missing element>"]
}

Scoring guide:
- 0.0-0.3: Poor — major gaps, incorrect, off-topic
- 0.3-0.5: Partial — some correct elements but significant issues  
- 0.5-0.7: Adequate — mostly correct with notable gaps
- 0.7-0.85: Good — correct with minor issues
- 0.85-0.95: Excellent — comprehensive and accurate
- 0.95-1.0: Perfect — exceptional, exceeds criteria`;

    const result = await this.llm.prompt(prompt, {
      system: GRADER_SYSTEM,
      temperature: 0.1,
      jsonMode: true,
    });

    if (!result?.score && result?.score !== 0) {
      throw new Error('LLM grader returned invalid structure');
    }

    return {
      score: Math.max(0, Math.min(1, parseFloat(result.score) || 0)),
      feedback: result.feedback || '',
      dimensions: result.dimensions || {},
      strengths: result.strengths || [],
      improvements: result.improvements || [],
      missingElements: result.missingElements || [],
    };
  }

  /**
   * Batch-grade multiple responses (e.g., for optimizer training).
   */
  async batchGrade(pairs, concurrency = 3) {
    const results = [];
    for (let i = 0; i < pairs.length; i += concurrency) {
      const batch = pairs.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(({ response, task, context }) => this.grade(response, task, context))
      );
      results.push(...batchResults);
    }
    return results;
  }
}
