

// src/llm/llmClient.js
import { logger } from '../utils/logger.js';

const BASE_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini'; // or gpt-4.1 / gpt-5 if you have access

export class LLMClient {
  constructor({ model = DEFAULT_MODEL, maxTokens = 2048, temperature = 0.7 } = {}) {
    this.model = model;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
    this.totalTokensUsed = 0;
    this.totalCalls = 0;

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables.');
    }
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  async complete({ system, messages, maxTokens, temperature, jsonMode = false }) {
    const retries = 3;
    const backoff = [1000, 3000, 7000];

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const finalMessages = [];

        if (system) {
          finalMessages.push({ role: 'system', content: system });
        }

        finalMessages.push(...messages);

        const body = {
          model: this.model,
          messages: finalMessages,
          max_tokens: maxTokens ?? this.maxTokens,
          temperature: temperature ?? this.temperature,
        };

        // JSON mode (structured output)
        if (jsonMode) {
          body.response_format = { type: "json_object" };
        }

        const res = await fetch(BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
          const msg = err?.error?.message || res.statusText;

          if (res.status === 429 || res.status >= 500) {
            if (attempt < retries) {
              logger.warn(`LLM API error (${res.status}), retrying in ${backoff[attempt]}ms... ${msg}`);
              await this._sleep(backoff[attempt]);
              continue;
            }
          }
          throw new Error(`LLM API Error ${res.status}: ${msg}`);
        }

        const data = await res.json();

        const usage = data.usage || {};
        this.totalTokensUsed += (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);
        this.totalCalls++;

        const rawText = data.choices?.[0]?.message?.content || '';

        if (jsonMode) {
          return this._parseJSON(rawText);
        }

        return rawText;

      } catch (err) {
        if (attempt === retries) throw err;
        logger.warn(`LLM call failed, retrying... ${err.message}`);
        await this._sleep(backoff[attempt]);
      }
    }
  }

  async prompt(userMsg, opts = {}) {
    return this.complete({
      ...opts,
      messages: [{ role: 'user', content: userMsg }],
    });
  }

  async chat(messages, opts = {}) {
    return this.complete({ ...opts, messages });
  }

  _parseJSON(text) {
    let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    try {
      return JSON.parse(cleaned);
    } catch (_) {}

    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (_) {}
    }

    logger.warn('Failed to parse JSON, returning raw');
    return { raw: text };
  }

  _sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  getStats() {
    return {
      totalCalls: this.totalCalls,
      totalTokensUsed: this.totalTokensUsed,
      model: this.model,
    };
  }
}


// based on Anthropic client, adapted for OpenAI's API and response format.
// import { logger } from '../utils/logger.js';

// const BASE_URL = 'https://api.anthropic.com/v1/messages';
// const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
// const ANTHROPIC_VERSION = '2023-06-01';

// /**
//  * Robust LLM client with retry logic, token tracking, and structured output support.
//  */
// export class LLMClient {
//   constructor({ model = DEFAULT_MODEL, maxTokens = 2048, temperature = 0.7 } = {}) {
//     this.model = model;
//     this.maxTokens = maxTokens;
//     this.temperature = temperature;
//     this.totalTokensUsed = 0;
//     this.totalCalls = 0;

//     if (!process.env.ANTHROPIC_API_KEY) {
//       throw new Error('ANTHROPIC_API_KEY is not set in environment variables.');
//     }
//     this.apiKey = process.env.ANTHROPIC_API_KEY;
//   }

//   /**
//    * Core message call with retry and exponential backoff.
//    */
//   async complete({ system, messages, maxTokens, temperature, jsonMode = false }) {
//     const retries = 3;
//     const backoff = [1000, 3000, 7000];

//     for (let attempt = 0; attempt <= retries; attempt++) {
//       try {
//         const body = {
//           model: this.model,
//           max_tokens: maxTokens ?? this.maxTokens,
//           temperature: temperature ?? this.temperature,
//           messages,
//         };

//         if (system) body.system = system;

//         const res = await fetch(BASE_URL, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'x-api-key': this.apiKey,
//             'anthropic-version': ANTHROPIC_VERSION,
//           },
//           body: JSON.stringify(body),
//         });

//         if (!res.ok) {
//           const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
//           const msg = err?.error?.message || res.statusText;

//           if (res.status === 429 || res.status >= 500) {
//             if (attempt < retries) {
//               logger.warn(`LLM API error (${res.status}), retrying in ${backoff[attempt]}ms... ${msg}`);
//               await this._sleep(backoff[attempt]);
//               continue;
//             }
//           }
//           throw new Error(`LLM API Error ${res.status}: ${msg}`);
//         }

//         const data = await res.json();
//         const usage = data.usage || {};
//         this.totalTokensUsed += (usage.input_tokens || 0) + (usage.output_tokens || 0);
//         this.totalCalls++;

//         const rawText = data.content?.[0]?.text || '';

//         if (jsonMode) {
//           return this._parseJSON(rawText);
//         }
//         return rawText;

//       } catch (err) {
//         if (attempt === retries) throw err;
//         logger.warn(`LLM call failed, retrying... ${err.message}`);
//         await this._sleep(backoff[attempt]);
//       }
//     }
//   }

//   /**
//    * Single-turn prompt with optional system prompt.
//    */
//   async prompt(userMsg, { system, maxTokens, temperature, jsonMode = false } = {}) {
//     return this.complete({
//       system,
//       messages: [{ role: 'user', content: userMsg }],
//       maxTokens,
//       temperature,
//       jsonMode,
//     });
//   }

//   /**
//    * Multi-turn conversation.
//    */
//   async chat(messages, { system, maxTokens, temperature, jsonMode = false } = {}) {
//     return this.complete({ system, messages, maxTokens, temperature, jsonMode });
//   }

//   /**
//    * Safely parse JSON from LLM output — strips markdown fences, extracts first JSON block.
//    */
//   _parseJSON(text) {
//     // Strip markdown code fences
//     let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

//     // Try direct parse
//     try {
//       return JSON.parse(cleaned);
//     } catch (_) {}

//     // Try extracting first {...} or [...]
//     const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
//     if (jsonMatch) {
//       try {
//         return JSON.parse(jsonMatch[0]);
//       } catch (_) {}
//     }

//     logger.warn('Failed to parse JSON from LLM, returning raw text');
//     return { raw: text };
//   }

//   _sleep(ms) {
//     return new Promise(r => setTimeout(r, ms));
//   }

//   getStats() {
//     return {
//       totalCalls: this.totalCalls,
//       totalTokensUsed: this.totalTokensUsed,
//       model: this.model,
//     };
//   }
// }




///////-------------////////////----------------////////////////----------///////