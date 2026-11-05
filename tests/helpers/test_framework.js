/**
 * CEDIREKO Films Portfolio - Test Framework & Assertion Library
 * Object-Oriented, zero-dependency test runner with structured reporting.
 */

class Assert {
  static ok(value, message = 'Expected value to be truthy') {
    if (!value) {
      throw new Error(`AssertionError: ${message} (Received: ${JSON.stringify(value)})`);
    }
  }

  static strictEqual(actual, expected, message = '') {
    if (actual !== expected) {
      const msg = message ? `${message} - ` : '';
      throw new Error(`AssertionError: ${msg}Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
    }
  }

  static notStrictEqual(actual, expected, message = '') {
    if (actual === expected) {
      const msg = message ? `${message} - ` : '';
      throw new Error(`AssertionError: ${msg}Expected values to differ, but both were ${JSON.stringify(actual)}`);
    }
  }

  static isTrue(value, message = 'Expected true') {
    Assert.strictEqual(value, true, message);
  }

  static isFalse(value, message = 'Expected false') {
    Assert.strictEqual(value, false, message);
  }

  static greaterThanOrEqual(actual, expected, message = '') {
    if (actual < expected) {
      const msg = message ? `${message} - ` : '';
      throw new Error(`AssertionError: ${msg}Expected ${actual} >= ${expected}`);
    }
  }

  static lessThanOrEqual(actual, expected, message = '') {
    if (actual > expected) {
      const msg = message ? `${message} - ` : '';
      throw new Error(`AssertionError: ${msg}Expected ${actual} <= ${expected}`);
    }
  }

  static includes(haystack, needle, message = '') {
    if (typeof haystack === 'string') {
      if (!haystack.includes(needle)) {
        const msg = message ? `${message} - ` : '';
        throw new Error(`AssertionError: ${msg}Expected string to include "${needle}"`);
      }
    } else if (Array.isArray(haystack)) {
      if (!haystack.includes(needle)) {
        const msg = message ? `${message} - ` : '';
        throw new Error(`AssertionError: ${msg}Expected array to include ${JSON.stringify(needle)}`);
      }
    } else {
      throw new Error(`AssertionError: Unsupported haystack type: ${typeof haystack}`);
    }
  }

  static match(actual, regex, message = '') {
    if (!regex.test(actual)) {
      const msg = message ? `${message} - ` : '';
      throw new Error(`AssertionError: ${msg}Expected "${actual}" to match ${regex}`);
    }
  }

  static throws(fn, message = 'Expected function to throw') {
    let threw = false;
    try {
      fn();
    } catch (e) {
      threw = true;
    }
    if (!threw) {
      throw new Error(`AssertionError: ${message}`);
    }
  }

  static async throwsAsync(fn, message = 'Expected async function to reject') {
    let threw = false;
    try {
      await fn();
    } catch (e) {
      threw = true;
    }
    if (!threw) {
      throw new Error(`AssertionError: ${message}`);
    }
  }
}

class TestCase {
  constructor(name, fn, options = {}) {
    this.name = name;
    this.fn = fn;
    this.timeoutMs = options.timeoutMs || 15000;
    this.status = 'PENDING';
    this.error = null;
    this.durationMs = 0;
  }

  async run(context = {}) {
    const start = Date.now();
    try {
      const resultPromise = this.fn(context);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Test timed out after ${this.timeoutMs}ms`)), this.timeoutMs);
      });
      await Promise.race([resultPromise, timeoutPromise]);
      this.status = 'PASSED';
    } catch (err) {
      this.status = 'FAILED';
      this.error = err;
    } finally {
      this.durationMs = Date.now() - start;
    }
    return this;
  }
}

class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.beforeAllHooks = [];
    this.afterAllHooks = [];
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
  }

  test(name, fn, options = {}) {
    const testCase = new TestCase(name, fn, options);
    this.tests.push(testCase);
    return testCase;
  }

  beforeAll(fn) {
    this.beforeAllHooks.push(fn);
  }

  afterAll(fn) {
    this.afterAllHooks.push(fn);
  }

  beforeEach(fn) {
    this.beforeEachHooks.push(fn);
  }

  afterEach(fn) {
    this.afterEachHooks.push(fn);
  }

  async run(globalContext = {}) {
    console.log(`\n\x1b[1m\x1b[36m▶ Running Suite: ${this.name}\x1b[0m`);
    const suiteContext = { ...globalContext };

    for (const hook of this.beforeAllHooks) {
      await hook(suiteContext);
    }

    const results = [];
    for (const testCase of this.tests) {
      for (const hook of this.beforeEachHooks) {
        await hook(suiteContext);
      }

      await testCase.run(suiteContext);

      for (const hook of this.afterEachHooks) {
        await hook(suiteContext);
      }

      results.push(testCase);
      if (testCase.status === 'PASSED') {
        console.log(`  \x1b[32m✔\x1b[0m ${testCase.name} \x1b[90m(${testCase.durationMs}ms)\x1b[0m`);
      } else {
        console.log(`  \x1b[31m✖\x1b[0m ${testCase.name} \x1b[90m(${testCase.durationMs}ms)\x1b[0m`);
        console.log(`    \x1b[31m${testCase.error?.message || testCase.error}\x1b[0m`);
        if (testCase.error?.stack) {
          const stackLines = testCase.error.stack.split('\n').slice(1, 4).join('\n');
          console.log(`    \x1b[90m${stackLines}\x1b[0m`);
        }
      }
    }

    for (const hook of this.afterAllHooks) {
      try {
        await hook(suiteContext);
      } catch (e) {
        console.error(`Error in afterAll hook of ${this.name}:`, e.message);
      }
    }

    return results;
  }
}

class TestReporter {
  static summarize(suitesResults) {
    let total = 0;
    let passed = 0;
    let failed = 0;
    let totalDuration = 0;

    console.log('\n' + '='.repeat(70));
    console.log('\x1b[1m\x1b[35m=== TEST EXECUTION SUMMARY ===\x1b[0m');
    console.log('='.repeat(70));

    for (const { suiteName, results } of suitesResults) {
      let suitePassed = 0;
      let suiteFailed = 0;
      for (const r of results) {
        total++;
        totalDuration += r.durationMs;
        if (r.status === 'PASSED') {
          passed++;
          suitePassed++;
        } else {
          failed++;
          suiteFailed++;
        }
      }
      const statusColor = suiteFailed === 0 ? '\x1b[32m' : '\x1b[31m';
      console.log(`${statusColor}${suiteFailed === 0 ? '✔' : '✖'} ${suiteName}: ${suitePassed}/${results.length} passed\x1b[0m`);
    }

    console.log('-'.repeat(70));
    console.log(`Total Tests:    ${total}`);
    console.log(`\x1b[32mPassed:         ${passed}\x1b[0m`);
    console.log(`\x1b[31mFailed:         ${failed}\x1b[0m`);
    console.log(`Duration:       ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('='.repeat(70) + '\n');

    return { total, passed, failed, totalDuration };
  }
}

module.exports = { Assert, TestCase, TestSuite, TestReporter };
