#!/usr/bin/env node

/**
 * Milestone 1 Empirical Stress Test Suite
 * Adversarial verification of:
 * 1. Rapid mobile drawer toggling (100+ rapid cycles, mixed triggers, state invariant checks)
 * 2. Scroll thrashing & rAF throttling (boundary oscillation 79px/81px, high-frequency flooding)
 * 3. DOM Anchor resolution & integrity (all hash targets in DOM, skip-link, header links, drawer links)
 * 4. Lifecycle teardown & memory cleanliness (repeated init/destroy cycles)
 */

const path = require('path');
const { ProjectHttpServer } = require('./helpers/http_server');
const { CdpBrowser } = require('./helpers/cdp_browser');
const { Assert, TestSuite } = require('./helpers/test_framework');

const suite = new TestSuite('Milestone 1: Empirical Adversarial Stress Harness');
const ROOT_DIR = path.resolve(__dirname, '..');

// ============================================================================
// 1. RAPID MOBILE DRAWER TOGGLING (100 rapid cycles)
// ============================================================================

suite.test('Stress: Rapid toggling 100x maintains strict state invariants', async ({ browser }) => {
  await browser.setViewport({ width: 375, height: 667, isMobile: true });

  const result = await browser.evaluate(async () => {
    const toggleBtn = document.querySelector('#mobile-nav-toggle');
    const drawer = document.querySelector('#mobile-nav');
    const app = window.__cedirekoApp;

    if (!toggleBtn || !drawer || !app || !app.headerNav) {
      return { ok: false, error: 'Required elements or controller missing' };
    }

    const log = [];
    for (let i = 1; i <= 100; i++) {
      toggleBtn.click();
      const shouldBeOpen = (i % 2 === 1);

      const isOpenState = app.headerNav.isOpen;
      const ariaExpanded = toggleBtn.getAttribute('aria-expanded');
      const drawerOpenClass = drawer.classList.contains('is-open');
      const bodyMenuOpen = document.body.classList.contains('menu-open');
      const inertPresent = drawer.hasAttribute('inert');
      const ariaHidden = drawer.getAttribute('aria-hidden');

      if (shouldBeOpen) {
        if (!isOpenState || ariaExpanded !== 'true' || !drawerOpenClass || !bodyMenuOpen || inertPresent || ariaHidden !== 'false') {
          return {
            ok: false,
            iteration: i,
            expected: 'open',
            state: { isOpenState, ariaExpanded, drawerOpenClass, bodyMenuOpen, inertPresent, ariaHidden }
          };
        }
      } else {
        if (isOpenState || ariaExpanded !== 'false' || drawerOpenClass || bodyMenuOpen || !inertPresent || ariaHidden !== 'true') {
          return {
            ok: false,
            iteration: i,
            expected: 'closed',
            state: { isOpenState, ariaExpanded, drawerOpenClass, bodyMenuOpen, inertPresent, ariaHidden }
          };
        }
      }
    }

    // Ensure final state is closed
    if (app.headerNav.isOpen) {
      app.headerNav.closeMobileMenu();
    }

    return { ok: true, cycles: 100 };
  });

  Assert.isTrue(result.ok, `Rapid toggling failed at iteration ${result.iteration}: ${JSON.stringify(result.state)}`);
});

// ============================================================================
// 2. MIXED ASYNC INTERACTION HARNESS (Toggle -> Backdrop -> CloseBtn -> Escape -> Anchor)
// ============================================================================

suite.test('Stress: Mixed trigger dismissals (Backdrop, Close Button, Escape, Nav Links) over 40 cycles', async ({ browser }) => {
  await browser.setViewport({ width: 375, height: 667, isMobile: true });

  const result = await browser.evaluate(async () => {
    const toggleBtn = document.querySelector('#mobile-nav-toggle');
    const closeBtn = document.querySelector('#mobile-nav-close');
    const backdrop = document.querySelector('.mobile-nav__backdrop');
    const navLink = document.querySelector('.mobile-nav__link');
    const drawer = document.querySelector('#mobile-nav');
    const app = window.__cedirekoApp;

    const verifyClosed = () => {
      return !app.headerNav.isOpen &&
             toggleBtn.getAttribute('aria-expanded') === 'false' &&
             !drawer.classList.contains('is-open') &&
             !document.body.classList.contains('menu-open') &&
             drawer.hasAttribute('inert');
    };

    const verifyOpen = () => {
      return app.headerNav.isOpen &&
             toggleBtn.getAttribute('aria-expanded') === 'true' &&
             drawer.classList.contains('is-open') &&
             document.body.classList.contains('menu-open') &&
             !drawer.hasAttribute('inert');
    };

    for (let c = 0; c < 10; c++) {
      // 1. Open via toggle, close via closeBtn
      toggleBtn.click();
      if (!verifyOpen()) return { ok: false, error: 'Failed opening in cycle ' + c + ' step 1' };
      closeBtn.click();
      if (!verifyClosed()) return { ok: false, error: 'Failed closing via closeBtn in cycle ' + c };

      // 2. Open via toggle, close via backdrop
      toggleBtn.click();
      if (!verifyOpen()) return { ok: false, error: 'Failed opening in cycle ' + c + ' step 2' };
      backdrop.click();
      if (!verifyClosed()) return { ok: false, error: 'Failed closing via backdrop in cycle ' + c };

      // 3. Open via toggle, close via Escape key
      toggleBtn.click();
      if (!verifyOpen()) return { ok: false, error: 'Failed opening in cycle ' + c + ' step 3' };
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      if (!verifyClosed()) return { ok: false, error: 'Failed closing via Escape in cycle ' + c };

      // 4. Open via toggle, close via internal nav link click
      toggleBtn.click();
      if (!verifyOpen()) return { ok: false, error: 'Failed opening in cycle ' + c + ' step 4' };
      navLink.click();
      if (!verifyClosed()) return { ok: false, error: 'Failed closing via navLink in cycle ' + c };
    }

    return { ok: true, totalOperations: 40 };
  });

  Assert.isTrue(result.ok, `Mixed trigger stress failed: ${result.error}`);
});

// ============================================================================
// 3. VIEWPORT EXPANSION AUTO-CLOSE RESILIENCE
// ============================================================================

suite.test('Stress: Viewport resize across 768px threshold cleanly closes drawer and resets state', async ({ browser }) => {
  await browser.setViewport({ width: 375, height: 667, isMobile: true });

  // Open drawer
  await browser.evaluate(() => {
    document.querySelector('#mobile-nav-toggle').click();
  });

  const isOpenBefore = await browser.evaluate(() => window.__cedirekoApp.headerNav.isOpen);
  Assert.isTrue(isOpenBefore, 'Drawer must be open on mobile');

  // Resize across breakpoint to desktop
  await browser.setViewport({ width: 1024, height: 768, isMobile: false });
  // Trigger window resize event inside evaluate
  await browser.evaluate(() => {
    window.dispatchEvent(new Event('resize'));
  });

  const isClosedAfter = await browser.evaluate(() => {
    const app = window.__cedirekoApp;
    const drawer = document.querySelector('#mobile-nav');
    const toggle = document.querySelector('#mobile-nav-toggle');
    return !app.headerNav.isOpen &&
           !drawer.classList.contains('is-open') &&
           toggle.getAttribute('aria-expanded') === 'false' &&
           !document.body.classList.contains('menu-open') &&
           drawer.hasAttribute('inert');
  });

  Assert.isTrue(isClosedAfter, 'Expanding viewport beyond 768px must immediately close drawer and restore inert');
});

// ============================================================================
// 4. SCROLL THRASHING & rAF THROTTLING STRESS (Boundary Oscillation & Flood)
// ============================================================================

suite.test('Stress: Boundary oscillation around 80px (79px vs 81px) produces correct scrolled class with no stuck ticking', async ({ browser }) => {
  const result = await browser.evaluate(async () => {
    const app = window.__cedirekoApp;
    const header = document.querySelector('#site-header');

    if (!header || !app) return { ok: false, error: 'Missing header or app' };

    // Oscillate 50 times across 79px / 81px using instant behavior to isolate threshold logic
    for (let i = 0; i < 50; i++) {
      window.scrollTo({ top: 79, behavior: 'instant' });
      window.dispatchEvent(new Event('scroll'));
      window.scrollTo({ top: 81, behavior: 'instant' });
      window.dispatchEvent(new Event('scroll'));
    }

    // Wait 2 animation frames for rAF to settle
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    const hasScrolledClassAt81 = header.classList.contains('site-header--scrolled');
    const isTickingAfter81 = app.headerNav.isTicking;

    // Now scroll back to 50px
    window.scrollTo({ top: 50, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));

    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });

    const hasScrolledClassAt50 = header.classList.contains('site-header--scrolled');
    const isTickingAfter50 = app.headerNav.isTicking;

    return {
      ok: true,
      hasScrolledClassAt81,
      isTickingAfter81,
      hasScrolledClassAt50,
      isTickingAfter50
    };
  });

  Assert.isTrue(result.ok, 'Boundary oscillation failed');
  Assert.isTrue(result.hasScrolledClassAt81, 'Header must have .site-header--scrolled when settled at 81px');
  Assert.isFalse(result.isTickingAfter81, 'isTicking flag must reset to false after rAF executes');
  Assert.isFalse(result.hasScrolledClassAt50, 'Header must not have .site-header--scrolled when settled at 50px');
  Assert.isFalse(result.isTickingAfter50, 'isTicking flag must reset to false after rAF executes');
});

suite.test('Stress: High-frequency scroll flood (500 events) does not drop final state or crash', async ({ browser }) => {
  const result = await browser.evaluate(async () => {
    const header = document.querySelector('#site-header');
    const app = window.__cedirekoApp;

    // Rapidly fire 500 scroll events with coordinates between 0 and 500
    for (let i = 0; i < 500; i++) {
      const y = Math.floor(Math.random() * 500);
      window.scrollTo({ top: y, behavior: 'instant' });
      window.dispatchEvent(new Event('scroll'));
    }

    // Final definitive scroll to 300px
    window.scrollTo({ top: 300, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));

    // Wait 3 frames
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))));

    const scrolledAt300 = header.classList.contains('site-header--scrolled');
    const tickingAt300 = app.headerNav.isTicking;

    // Final definitive scroll back to 0px
    window.scrollTo({ top: 0, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));

    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))));

    const scrolledAt0 = header.classList.contains('site-header--scrolled');
    const tickingAt0 = app.headerNav.isTicking;

    return {
      scrolledAt300,
      tickingAt300,
      scrolledAt0,
      tickingAt0
    };
  });

  Assert.isTrue(result.scrolledAt300, 'Header must be scrolled at 300px');
  Assert.isFalse(result.tickingAt300, 'rAF ticking flag must not be stuck at 300px');
  Assert.isFalse(result.scrolledAt0, 'Header must not be scrolled at 0px');
  Assert.isFalse(result.tickingAt0, 'rAF ticking flag must not be stuck at 0px');
});

// ============================================================================
// 5. DOM ANCHOR RESOLUTION & TARGET VALIDITY
// ============================================================================

suite.test('Integrity: All internal anchor hrefs (#...) resolve to existing DOM elements with valid IDs', async ({ browser }) => {
  const check = await browser.evaluate(() => {
    const allLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
    const missing = [];
    const valid = [];

    allLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === '#' || href === '') return;
      const targetId = href.substring(1);
      const targetEl = document.getElementById(targetId);
      if (!targetEl) {
        missing.push({ href, text: link.textContent.trim(), html: link.outerHTML });
      } else {
        valid.push({ href, targetTag: targetEl.tagName.toLowerCase(), targetId });
      }
    });

    return {
      totalInternalLinks: allLinks.length,
      validCount: valid.length,
      missing
    };
  });

  Assert.strictEqual(check.missing.length, 0, `Found broken internal anchor links: ${JSON.stringify(check.missing)}`);
  Assert.greaterThanOrEqual(check.validCount, 5, 'Must have at least 5 verified internal anchor links');
});

suite.test('Integrity: Skip-to-content link points directly to main landmark (#main-content)', async ({ browser }) => {
  const skipLinkCheck = await browser.evaluate(() => {
    const skipLink = document.querySelector('a.skip-link, a[href="#main-content"]');
    if (!skipLink) return { ok: false, error: 'Skip link not found' };

    const target = document.getElementById('main-content');
    return {
      ok: !!target,
      href: skipLink.getAttribute('href'),
      targetTag: target ? target.tagName.toLowerCase() : null
    };
  });

  Assert.isTrue(skipLinkCheck.ok, 'Skip-to-content target #main-content must exist in DOM');
  Assert.strictEqual(skipLinkCheck.href, '#main-content', 'Skip link href must be #main-content');
});

// ============================================================================
// 6. LIFECYCLE TEARDOWN & RE-INITIALIZATION (Zero Memory Leaks / Duplicate Bindings)
// ============================================================================

suite.test('Lifecycle: HeaderNavController destroy() and re-init cleanly tears down and recreates listeners', async ({ browser }) => {
  const result = await browser.evaluate(() => {
    const app = window.__cedirekoApp;
    const header = document.querySelector('#site-header');
    const toggle = document.querySelector('#mobile-nav-toggle');

    if (!app || !app.headerNav) return { ok: false, error: 'App not initialized' };

    // 1. Destroy active instance
    app.headerNav.destroy();

    // 2. Click toggle while destroyed: state must NOT change
    toggle.click();
    const destroyedIgnoredClick = toggle.getAttribute('aria-expanded') === 'false';

    // 3. Re-instantiate HeaderNavController
    const newController = new HeaderNavController();
    app.headerNav = newController;

    // 4. Click toggle on new controller: must open cleanly
    toggle.click();
    const reInitWorks = newController.isOpen && toggle.getAttribute('aria-expanded') === 'true';

    // 5. Close it cleanly
    newController.closeMobileMenu();
    const cleanlyClosed = !newController.isOpen && toggle.getAttribute('aria-expanded') === 'false';

    return {
      destroyedIgnoredClick,
      reInitWorks,
      cleanlyClosed
    };
  });

  Assert.isTrue(result.destroyedIgnoredClick, 'Destroyed controller must not respond to toggle click');
  Assert.isTrue(result.reInitWorks, 'Re-instantiated controller must handle toggle click normally');
  Assert.isTrue(result.cleanlyClosed, 'Re-instantiated controller must close cleanly');
});

// ============================================================================
// 7. MEMORY STABILITY ACROSS 500 RAPID TOGGLES
// ============================================================================

suite.test('Stress: 500 rapid drawer toggles produce zero unbounded heap growth', async ({ browser }) => {
  await browser.setViewport({ width: 375, height: 667, isMobile: true });

  const memResult = await browser.evaluate(async () => {
    const toggle = document.querySelector('#mobile-nav-toggle');
    const heapBefore = window.performance?.memory?.usedJSHeapSize || 0;

    for (let i = 0; i < 500; i++) {
      toggle.click();
    }

    if (window.__cedirekoApp.headerNav.isOpen) {
      window.__cedirekoApp.headerNav.closeMobileMenu();
    }

    const heapAfter = window.performance?.memory?.usedJSHeapSize || 0;
    const diff = heapAfter - heapBefore;
    return { heapBefore, heapAfter, diffBytes: diff };
  });

  Assert.lessThanOrEqual(memResult.diffBytes, 65536, `Heap growth must be <= 64KB after 500 toggles (grew: ${memResult.diffBytes} bytes)`);
});

// ============================================================================
// 8. CLICK DISCRIMINATION (Inside Panel vs Outside Backdrop)
// ============================================================================

suite.test('Stress: Clicking inside panel preserves open state; clicking backdrop dismisses', async ({ browser }) => {
  await browser.setViewport({ width: 375, height: 667, isMobile: true });

  const result = await browser.evaluate(() => {
    const toggle = document.querySelector('#mobile-nav-toggle');
    const panel = document.querySelector('.mobile-nav__panel');
    const backdrop = document.querySelector('.mobile-nav__backdrop');
    const app = window.__cedirekoApp;

    // 1. Open drawer
    toggle.click();
    const opened = app.headerNav.isOpen;

    // 2. Click directly on panel (not a link, just the panel body)
    panel.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    const stillOpenAfterPanelClick = app.headerNav.isOpen;

    // 3. Click backdrop
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    const closedAfterBackdropClick = !app.headerNav.isOpen;

    return { opened, stillOpenAfterPanelClick, closedAfterBackdropClick };
  });

  Assert.isTrue(result.opened, 'Drawer must open');
  Assert.isTrue(result.stillOpenAfterPanelClick, 'Drawer must remain open when clicking inside panel');
  Assert.isTrue(result.closedAfterBackdropClick, 'Drawer must close when clicking backdrop');
});

// ============================================================================
// 9. EXTREME OVERSCROLL RESILIENCE (Negative scrollY & Deep scrollY)
// ============================================================================

suite.test('Stress: Extreme overscroll (-100px and +50000px) does not crash or corrupt state', async ({ browser }) => {
  const result = await browser.evaluate(async () => {
    const header = document.querySelector('#site-header');
    const app = window.__cedirekoApp;

    // Simulate iOS rubber-band negative scroll
    window.scrollTo({ top: -100, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    const scrolledAtNegative = header.classList.contains('site-header--scrolled');
    const tickingAtNegative = app.headerNav.isTicking;

    // Simulate extreme scroll down
    window.scrollTo({ top: 50000, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    const scrolledAtExtreme = header.classList.contains('site-header--scrolled');
    const tickingAtExtreme = app.headerNav.isTicking;

    // Settle back at 0
    window.scrollTo({ top: 0, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    return {
      scrolledAtNegative,
      tickingAtNegative,
      scrolledAtExtreme,
      tickingAtExtreme
    };
  });

  Assert.isFalse(result.scrolledAtNegative, 'Header must not have scrolled class on negative scroll');
  Assert.isFalse(result.tickingAtNegative, 'rAF ticking flag must not be stuck on negative scroll');
  Assert.isTrue(result.scrolledAtExtreme, 'Header must have scrolled class on extreme scroll');
  Assert.isFalse(result.tickingAtExtreme, 'rAF ticking flag must not be stuck on extreme scroll');
});

// ============================================================================
// 10. ADVERSARIAL FOCUS TIMING: CSS Visibility Transition Concurrency
// ============================================================================

suite.test('Timing: Mobile drawer achieves immediate visibility:visible at t=0 and synchronous focus on close button', async ({ browser }) => {
  await browser.setViewport({ width: 375, height: 667, isMobile: true });

  const timingResult = await browser.evaluate(async () => {
    const toggle = document.querySelector('#mobile-nav-toggle');
    const drawer = document.querySelector('#mobile-nav');

    // Trigger open
    toggle.click();

    // At t=0, visibility must be immediately visible and focus must be on close button
    const visibilityAtT0 = window.getComputedStyle(drawer).visibility;
    const activeElementImmediate = document.activeElement ? document.activeElement.id : null;

    // Wait 350ms for CSS transition to settle
    await new Promise(r => setTimeout(r, 350));
    const visibilityAfterTransition = window.getComputedStyle(drawer).visibility;

    // Close drawer
    document.querySelector('#mobile-nav-close').click();

    return {
      visibilityAtT0,
      activeElementImmediate,
      visibilityAfterTransition
    };
  });

  Assert.strictEqual(timingResult.visibilityAtT0, 'visible', 'CSS visibility is immediately visible at t=0');
  Assert.strictEqual(timingResult.activeElementImmediate, 'mobile-nav-close', 'Focus cleanly transfers to mobile-nav-close synchronously upon open');
  Assert.strictEqual(timingResult.visibilityAfterTransition, 'visible', 'CSS visibility remains visible after transition completes');
});

// Run standalone if invoked directly
if (require.main === module) {
  (async () => {
    const server = new ProjectHttpServer(ROOT_DIR);
    const serverUrl = await server.start();
    const browser = new CdpBrowser();
    await browser.launch();
    await browser.navigate(`${serverUrl}/index.html`);

    console.log(`\nStarting Milestone 1 Adversarial Stress Suite on ${serverUrl}...\n`);
    const results = await suite.run({ serverUrl, browser, server });
    await browser.close();
    await server.stop();

    const summary = {
      passed: results.filter(r => r.status === 'PASSED').length,
      failed: results.filter(r => r.status === 'FAILED').length
    };

    console.log(`\n======================================================================`);
    console.log(`Milestone 1 Stress Harness Results: ${summary.passed} Passed, ${summary.failed} Failed`);
    console.log(`======================================================================\n`);

    if (summary.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  })().catch(err => {
    console.error('Fatal error in stress runner:', err);
    process.exit(1);
  });
}

module.exports = suite;
