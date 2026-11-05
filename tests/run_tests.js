#!/usr/bin/env node

/**
 * CEDIREKO Films Portfolio - 4-Tier Automated Test Runner
 * Executes Tier 1 (Feature Coverage), Tier 2 (Boundary & Corner Cases),
 * Tier 3 (Cross-Feature Interactions), and Tier 4 (Real-World Workload Scenarios).
 * 
 * Usage:
 *   node tests/run_tests.js           # Run all 4 tiers
 *   node tests/run_tests.js --tier=1  # Run specific tier
 */

const path = require('path');
const { ProjectHttpServer } = require('./helpers/http_server');
const { CdpBrowser } = require('./helpers/cdp_browser');
const { TestReporter } = require('./helpers/test_framework');

const tier1Suite = require('./tier1_feature_coverage.test');
const tier2Suite = require('./tier2_boundary_corner.test');
const tier3Suite = require('./tier3_cross_feature.test');
const tier4Suite = require('./tier4_real_world_journey.test');

const ROOT_DIR = path.resolve(__dirname, '..');

async function main() {
  const args = process.argv.slice(2);
  const tierArg = args.find(a => a.startsWith('--tier='));
  const targetTier = tierArg ? parseInt(tierArg.split('=')[1], 10) : null;

  console.log('\n\x1b[1m\x1b[33m======================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[33m   CEDIREKO FILMS PORTFOLIO — 4-TIER AUTOMATED TEST RUNNER           \x1b[0m');
  console.log('\x1b[1m\x1b[33m======================================================================\x1b[0m');
  console.log(`Working Directory: ${ROOT_DIR}`);
  console.log(`Execution Mode:    ${targetTier ? `Tier ${targetTier} only` : 'All Tiers (1-4)'}`);

  // 1. Start built-in HTTP Server
  const server = new ProjectHttpServer(ROOT_DIR);
  const serverUrl = await server.start();
  console.log(`Local Test Server: ${serverUrl}`);

  // 2. Launch Headless Chrome CDP Driver
  const browser = new CdpBrowser();
  console.log('Launching Headless Chrome with Chrome DevTools Protocol...');
  await browser.launch();
  console.log(`Connected to Headless Chrome on CDP port ${browser.port}`);

  // Navigate to portfolio
  await browser.navigate(`${serverUrl}/index.html`);
  console.log('Loaded index.html in headless browser\n');

  const suitesToRun = [];
  if (!targetTier || targetTier === 1) suitesToRun.push(tier1Suite);
  if (!targetTier || targetTier === 2) suitesToRun.push(tier2Suite);
  if (!targetTier || targetTier === 3) suitesToRun.push(tier3Suite);
  if (!targetTier || targetTier === 4) suitesToRun.push(tier4Suite);

  const context = {
    serverUrl,
    browser,
    server
  };

  const suiteResults = [];

  try {
    for (const suite of suitesToRun) {
      const results = await suite.run(context);
      suiteResults.push({
        suiteName: suite.name,
        results
      });
    }
  } finally {
    // Teardown
    console.log('\nCleaning up test environment...');
    await browser.close();
    await server.stop();
  }

  // 3. Summarize and report
  const summary = TestReporter.summarize(suiteResults);

  // Return exit code
  if (summary.failed > 0) {
    console.error(`\x1b[31mTest run completed with ${summary.failed} failures.\x1b[0m\n`);
    process.exit(1);
  } else {
    console.log('\x1b[32mAll tests completed successfully!\x1b[0m\n');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('\x1b[31mFatal test runner error:\x1b[0m', err);
  process.exit(1);
});
