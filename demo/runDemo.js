// demo/runDemo.js
import 'dotenv/config';
import { SelfImprovingEnv } from '../src/env/SelfImprovingEnv.js';
import { MemoryStore } from '../src/memory/memoryStore.js';
import { sampleTask } from '../src/tasks/sampleTasks.js';
import { logger } from '../src/utils/logger.js';

/**
 * Interactive demo showing the full RL loop with live feedback.
 * Runs 3 episodes per category (easy → medium → hard) and shows
 * how the agent improves using memory.
 */
async function runDemo() {
  logger.separator('SELF-IMPROVING RL DEMO');
  console.log(`
  🤖  Self-Improving RL Environment Demo
  ───────────────────────────────────────
  This demo runs the full RL loop:
    Episode → Solve → Grade → Critique → Retry → Optimize → Repeat

  Watch how the agent:
  • Uses memory from past attempts
  • Gets critic feedback and retries
  • Improves its prompt strategy over time
  `);

  const env = new SelfImprovingEnv({
    maxEpisodes: 6,
    maxStepsPerEpisode: 2,
    rewardThreshold: 0.80,
    optimizeEvery: 3,
    useCurriculum: true,
  });

  logger.info('Starting demo with 6 episodes across categories...\n');

  // Run the full environment
  const report = await env.run();

  // Show final memory state
  logger.separator('MEMORY SNAPSHOT');
  const memory = new MemoryStore();
  const stats = memory.getStats();

  console.log('\n📊 FINAL METRICS:');
  console.log(`  Episodes run:     ${report.summary.totalEpisodes}`);
  console.log(`  Success rate:     ${(parseFloat(report.summary.successRate) * 100).toFixed(1)}%`);
  console.log(`  Avg reward:       ${report.summary.avgReward}`);
  console.log(`  Peak reward:      ${report.summary.peakReward}`);
  console.log(`  Optimizations:    ${report.summary.optimizationRuns}`);

  console.log('\n🧠 MEMORY STATE:');
  console.log(`  Total episodes:   ${stats.totalEpisodes}`);
  console.log(`  Learned rules:    ${stats.ruleCount}`);
  console.log(`  Strategies:       ${stats.strategyCount}`);

  if (Object.keys(stats.taskStats || {}).length > 0) {
    console.log('\n📈 PERFORMANCE BY CATEGORY:');
    Object.entries(stats.taskStats).forEach(([key, s]) => {
      const bar = '█'.repeat(Math.round((s.successRate || 0) * 10)) + '░'.repeat(10 - Math.round((s.successRate || 0) * 10));
      console.log(`  ${key.padEnd(20)} ${bar} ${((s.successRate || 0) * 100).toFixed(0)}% (${s.attempts} attempts)`);
    });
  }

  console.log('\n✅ Demo complete! Memory saved to ./memory/agent_memory.json');
  console.log('   Run again to see improvement from prior memory.\n');
}

runDemo().catch(err => {
  logger.error('Demo failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
