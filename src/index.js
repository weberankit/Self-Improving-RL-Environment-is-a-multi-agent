// src/index.js
import 'dotenv/config';
import { SelfImprovingEnv } from './env/SelfImprovingEnv.js';
import { logger } from './utils/logger.js';
import { sampleTask } from './tasks/sampleTasks.js';

const args = process.argv.slice(2);
const mode = args.find(a => a.startsWith('--mode='))?.split('=')[1] || 'train';
const episodes = parseInt(args.find(a => a.startsWith('--episodes='))?.split('=')[1] || process.env.MAX_EPISODES || '20');
const category = args.find(a => a.startsWith('--category='))?.split('=')[1] || null;

async function main() {
  logger.separator('SELF-IMPROVING RL ENVIRONMENT v2.0');
  logger.info(`Mode: ${mode} | Episodes: ${episodes}${category ? ` | Category: ${category}` : ''}`);

  const env = new SelfImprovingEnv({
    maxEpisodes: episodes,
    maxStepsPerEpisode: parseInt(process.env.MAX_STEPS_PER_EPISODE || '3'),
    rewardThreshold: parseFloat(process.env.REWARD_THRESHOLD || '0.85'),
    optimizeEvery: 5,
    useCurriculum: mode === 'train',
  });

  if (mode === 'eval') {
    // Evaluation mode: run a single episode per category/difficulty combo
    logger.info('Evaluation mode: testing learned behaviors...');
    const results = [];
    const testTasks = [
      sampleTask({ category: 'coding', difficulty: 'medium' }),
      sampleTask({ category: 'math', difficulty: 'medium' }),
      sampleTask({ category: 'reasoning', difficulty: 'medium' }),
      sampleTask({ category: 'writing', difficulty: 'medium' }),
      sampleTask({ category: 'analysis', difficulty: 'medium' }),
    ];

    for (const task of testTasks) {
      logger.episode(`Evaluating: ${task.title} [${task.category}]`);
      const episode = await env.step(task);
      results.push({
        task: task.title,
        category: task.category,
        reward: episode.totalReward,
        success: episode.success,
        steps: episode.steps.length,
      });
    }

    logger.separator('EVALUATION RESULTS');
    logger.table(results, 'Per-Task Results');
    const avgReward = results.reduce((s, r) => s + r.reward, 0) / results.length;
    const successRate = results.filter(r => r.success).length / results.length;
    logger.success(`Overall: avg=${avgReward.toFixed(3)} success=${(successRate*100).toFixed(0)}%`);
    return { results, avgReward, successRate };
  }

  // Training mode
  const report = await env.run();

  logger.separator('RUN COMPLETE');
  logger.success(`Final avg reward: ${report.summary.avgReward}`);
  logger.success(`Final success rate: ${(parseFloat(report.summary.successRate) * 100).toFixed(1)}%`);
  logger.memory(`Memory: ${report.memory.learnedRules} rules, ${report.memory.promptStrategies} strategies`);

  return report;
}

main().catch(err => {
  logger.error('Fatal error:', err.message);
  logger.error(err.stack);
  process.exit(1);
});
