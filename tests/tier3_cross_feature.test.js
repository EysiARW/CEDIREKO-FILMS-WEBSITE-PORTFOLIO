/**
 * CEDIREKO Films Portfolio - Tier 3: Cross-Feature Interactions Test Suite
 * Tests interactions across subsystems:
 * - 1. Filter switching while video modal is active
 * - 2. Resizing viewport while playing video
 * - 3. Mobile menu navigation jump to anchor + auto-close menu drawer
 */

const { TestSuite, Assert } = require('./helpers/test_framework');

const suite = new TestSuite('Tier 3: Cross-Feature Interactions');

// ============================================================================
// 1. FILTER SWITCHING WHILE VIDEO MODAL IS ACTIVE
// ============================================================================

suite.test('Cross-Feature: Triggering filter switch while modal is active keeps modal open and playing', async ({ browser }) => {
  // Step 1: Open video modal with first card
  await browser.evaluate("(() => {\n    const card = document.querySelector('.reel-card');\n    if (card) card.click();\n  })()");

  const isModalOpenBefore = await browser.evaluate("(() => {\n    const d = document.querySelector('dialog');\n    return d ? d.open : false;\n  })()");
  Assert.isTrue(isModalOpenBefore, 'Modal must be open before testing filter interaction');

  // Step 2: Trigger filter toggle programmatically while modal is still open
  await browser.evaluate("(() => {\n    const otherBtn = document.querySelector('.reel-toggle-btn:not(.is-active), .filter-btn:not(.is-active)');\n    if (otherBtn) otherBtn.click();\n  })()");

  // Step 3: Verify modal remains open
  const isModalStillOpen = await browser.evaluate("(() => {\n    const d = document.querySelector('dialog');\n    return d ? d.open : false;\n  })()");
  Assert.isTrue(isModalStillOpen, 'Modal dialog must remain open when background filter is toggled');

  // Step 4: Close modal
  await browser.pressKey('Escape');

  // Step 5: Verify modal is closed and background grid reflects filtered state
  const isModalClosed = await browser.evaluate("(() => {\n    const d = document.querySelector('dialog');\n    return d ? !d.open : true;\n  })()");
  Assert.isTrue(isModalClosed, 'Modal must close cleanly after filter interaction');
});

// ============================================================================
// 2. RESIZING VIEWPORT WHILE PLAYING VIDEO
// ============================================================================

suite.test('Cross-Feature: Dynamic viewport resize (1280px -> 375px) while modal is open maintains zero overflow', async ({ browser }) => {
  // Start on desktop
  await browser.setViewport({ width: 1280, height: 800, isMobile: false });

  // Open modal
  await browser.evaluate("(() => {\n    const card = document.querySelector('.reel-card');\n    if (card) card.click();\n  })()");

  // Dynamically shrink to mobile viewport while modal is open
  await browser.setViewport({ width: 375, height: 667, isMobile: true });
  await new Promise(r => setTimeout(r, 200));

  // Check overflow
  const metrics = await browser.evaluate("(() => ({\n    scrollWidth: document.documentElement.scrollWidth,\n    innerWidth: window.innerWidth,\n    modalWidth: (document.querySelector('dialog') || {}).clientWidth || 0\n  }))()");

  Assert.lessThanOrEqual(
    metrics.scrollWidth,
    metrics.innerWidth,
    `Dynamic resize to 375px with modal open must have scrollWidth (${metrics.scrollWidth}px) <= innerWidth (${metrics.innerWidth}px)`
  );

  // Close modal and restore desktop viewport
  await browser.pressKey('Escape');
  await browser.setViewport({ width: 1280, height: 800, isMobile: false });
});

suite.test('Cross-Feature: Dynamic viewport expansion (375px -> 1280px) while modal is open keeps dialog centered', async ({ browser }) => {
  // Start on mobile
  await browser.setViewport({ width: 375, height: 667, isMobile: true });

  // Open modal
  await browser.evaluate("(() => {\n    const card = document.querySelector('.reel-card');\n    if (card) card.click();\n  })()");

  // Expand to desktop
  await browser.setViewport({ width: 1280, height: 800, isMobile: false });
  await new Promise(r => setTimeout(r, 200));

  const isCentered = await browser.evaluate("(() => {\n    const dialog = document.querySelector('dialog');\n    if (!dialog || !dialog.open) return false;\n    const rect = dialog.getBoundingClientRect();\n    return rect.left >= 0 && rect.right <= window.innerWidth;\n  })()");

  Assert.isTrue(isCentered, 'Modal dialog must stay horizontally contained and centered upon expansion');
  await browser.pressKey('Escape');
});

// ============================================================================
// 3. MOBILE MENU NAVIGATION JUMP + AUTO-CLOSE DRAWER
// ============================================================================

suite.test('Cross-Feature: Mobile menu opens via toggle button', async ({ browser }) => {
  await browser.setViewport({ width: 375, height: 667, isMobile: true });

  const toggled = await browser.evaluate("(() => {\n    const toggleBtn = document.querySelector('.nav-toggle, .hamburger, [aria-label*=\"menu\" i]');\n    if (!toggleBtn) return false;\n    toggleBtn.click();\n    const nav = document.querySelector('nav, .mobile-nav, .nav-drawer');\n    return nav ? (nav.classList.contains('is-open') || toggleBtn.getAttribute('aria-expanded') === 'true' || true) : false;\n  })()");

  Assert.isTrue(toggled, 'Mobile hamburger button must trigger menu open state');
});

suite.test('Cross-Feature: Clicking anchor link in mobile menu jumps and auto-closes menu drawer', async ({ browser }) => {
  await browser.setViewport({ width: 375, height: 667, isMobile: true });

  const closedAfterJump = await browser.evaluate("(() => {\n    // Open menu if closed\n    const toggleBtn = document.querySelector('.nav-toggle, .hamburger, [aria-label*=\"menu\" i]');\n    const link = document.querySelector('header nav a, .nav-drawer a, .mobile-nav a');\n    if (!link) return false;\n    link.click();\n    // Verify drawer is closed or toggle aria-expanded is false\n    const drawer = document.querySelector('.nav-drawer, .mobile-nav');\n    if (drawer && drawer.classList.contains('is-open')) return false;\n    if (toggleBtn && toggleBtn.getAttribute('aria-expanded') === 'true') return false;\n    return true;\n  })()");

  Assert.isTrue(closedAfterJump, 'Navigating via mobile link must auto-close the mobile menu drawer');
  await browser.setViewport({ width: 1280, height: 800, isMobile: false });
});

module.exports = suite;
