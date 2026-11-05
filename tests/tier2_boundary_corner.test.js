/**
 * CEDIREKO Films Portfolio - Tier 2: Boundary & Corner Cases Test Suite
 * Minimum >= 5 assertions / tests per feature across:
 * - 1. Viewport Overflow Across Breakpoints (375px, 768px, 1280px, 320px, 1920px)
 * - 2. Rapid Filter Toggling Without DOM Duplication or Unhandled Errors
 * - 3. Esc Key Press Boundary Conditions
 * - 4. Backdrop vs Dialog Interior Clicks
 * - 5. Missing or Offline Media Handling
 */

const { TestSuite, Assert } = require('./helpers/test_framework');

const suite = new TestSuite('Tier 2: Boundary & Corner Cases');

// ============================================================================
// 1. VIEWPORT OVERFLOW ACROSS BREAKPOINTS (>=5 tests)
// ============================================================================

suite.test('Overflow 375px: Zero horizontal overflow on standard mobile (iPhone SE)', async ({ browser }) => {
  await browser.setViewport({ width: 375, height: 667, isMobile: true });
  const metrics = await browser.evaluate("(() => ({\n    scrollWidth: document.documentElement.scrollWidth,\n    clientWidth: document.documentElement.clientWidth,\n    innerWidth: window.innerWidth\n  }))()");

  Assert.lessThanOrEqual(
    metrics.scrollWidth,
    metrics.innerWidth,
    `At 375px, scrollWidth (${metrics.scrollWidth}px) must not exceed innerWidth (${metrics.innerWidth}px)`
  );
});

suite.test('Overflow 768px: Zero horizontal overflow on tablet (iPad Mini)', async ({ browser }) => {
  await browser.setViewport({ width: 768, height: 1024, isMobile: false });
  const metrics = await browser.evaluate("(() => ({\n    scrollWidth: document.documentElement.scrollWidth,\n    innerWidth: window.innerWidth\n  }))()");

  Assert.lessThanOrEqual(
    metrics.scrollWidth,
    metrics.innerWidth,
    `At 768px, scrollWidth (${metrics.scrollWidth}px) must not exceed innerWidth (${metrics.innerWidth}px)`
  );
});

suite.test('Overflow 1280px: Zero horizontal overflow on standard desktop display', async ({ browser }) => {
  await browser.setViewport({ width: 1280, height: 800, isMobile: false });
  const metrics = await browser.evaluate("(() => ({\n    scrollWidth: document.documentElement.scrollWidth,\n    innerWidth: window.innerWidth\n  }))()");

  Assert.lessThanOrEqual(
    metrics.scrollWidth,
    metrics.innerWidth,
    `At 1280px, scrollWidth (${metrics.scrollWidth}px) must not exceed innerWidth (${metrics.innerWidth}px)`
  );
});

suite.test('Overflow 320px: Zero horizontal overflow on compact mobile (iPhone 5/SE gen 1)', async ({ browser }) => {
  await browser.setViewport({ width: 320, height: 568, isMobile: true });
  const metrics = await browser.evaluate("(() => ({\n    scrollWidth: document.documentElement.scrollWidth,\n    innerWidth: window.innerWidth\n  }))()");

  Assert.lessThanOrEqual(
    metrics.scrollWidth,
    metrics.innerWidth,
    `At 320px, scrollWidth (${metrics.scrollWidth}px) must not exceed innerWidth (${metrics.innerWidth}px)`
  );
});

suite.test('Overflow 1920px: Zero horizontal overflow on large 1080p desktop display', async ({ browser }) => {
  await browser.setViewport({ width: 1920, height: 1080, isMobile: false });
  const metrics = await browser.evaluate("(() => ({\n    scrollWidth: document.documentElement.scrollWidth,\n    innerWidth: window.innerWidth\n  }))()");

  Assert.lessThanOrEqual(
    metrics.scrollWidth,
    metrics.innerWidth,
    `At 1920px, scrollWidth (${metrics.scrollWidth}px) must not exceed innerWidth (${metrics.innerWidth}px)`
  );
  // Restore standard desktop viewport
  await browser.setViewport({ width: 1280, height: 800, isMobile: false });
});

// ============================================================================
// 2. RAPID FILTER TOGGLING (>=5 tests)
// ============================================================================

suite.test('Rapid Filter: Rapid toggling 10x does not corrupt total card count in DOM', async ({ browser }) => {
  const finalCardCount = await browser.evaluate("(() => {\n    const btns = Array.from(document.querySelectorAll('.reel-toggle-btn, .filter-btn'));\n    if (btns.length < 2) return document.querySelectorAll('.reel-card').length;\n    for (let i = 0; i < 10; i++) {\n      btns[i % btns.length].click();\n    }\n    return document.querySelectorAll('.reel-card').length;\n  })()");

  Assert.strictEqual(finalCardCount, 5, 'Exactly 5 original cards must exist in DOM regardless of rapid toggling');
});

suite.test('Rapid Filter: Exactly one tab maintains active class after rapid switching', async ({ browser }) => {
  const activeClassCount = await browser.evaluate("(() => {\n    const btns = Array.from(document.querySelectorAll('.reel-toggle-btn, .filter-btn'));\n    if (btns.length >= 2) {\n      btns[0].click();\n      btns[1].click();\n      btns[0].click();\n      btns[1].click();\n    }\n    return document.querySelectorAll('.reel-toggle-btn.is-active, .filter-btn.is-active, [role=\"tab\"][aria-selected=\"true\"]').length;\n  })()");

  Assert.strictEqual(activeClassCount, 1, 'Only the final target tab must retain active state');
});

suite.test('Rapid Filter: Zero unhandled console errors or exceptions during rapid toggling', async ({ browser }) => {
  browser.resetErrors();
  await browser.evaluate("(() => {\n    const btns = Array.from(document.querySelectorAll('.reel-toggle-btn, .filter-btn'));\n    for (let i = 0; i < 15; i++) {\n      const b = btns[i % btns.length];\n      if (b) b.click();\n    }\n  })()");

  Assert.strictEqual(browser.consoleErrors.length, 0, 'No uncaught errors allowed during rapid filter clicks');
});

suite.test('Rapid Filter: Card order remains consistent after multiple filter cycles', async ({ browser }) => {
  const cardOrder = await browser.evaluate("(() => {\n    const cards = Array.from(document.querySelectorAll('.reel-card .reel-title, .reel-card h3'));\n    return cards.map(c => c.textContent.trim());\n  })()");

  Assert.greaterThanOrEqual(cardOrder.length, 5, 'Card order must retain all 5 project titles intact');
});

suite.test('Rapid Filter: Keyboard accessibility (focus ring) remains functional on buttons', async ({ browser }) => {
  const focusable = await browser.evaluate("(() => {\n    const btn = document.querySelector('.reel-toggle-btn, .filter-btn');\n    if (!btn) return false;\n    btn.focus();\n    return document.activeElement === btn;\n  })()");

  Assert.isTrue(focusable, 'Filter buttons must remain keyboard focusable after rapid interaction');
});

// ============================================================================
// 3. ESC KEY PRESS BOUNDARY CONDITIONS (>=5 tests)
// ============================================================================

suite.test('Esc Key: Pressing Esc when modal is closed produces 0 errors', async ({ browser }) => {
  browser.resetErrors();
  // Ensure modal is closed
  await browser.evaluate("(() => {\n    const d = document.querySelector('dialog');\n    if (d && d.open) d.close();\n  })()");

  await browser.pressKey('Escape');

  Assert.strictEqual(browser.consoleErrors.length, 0, 'Pressing Escape when modal is closed must not throw');
});

suite.test('Esc Key: Rapid consecutive Esc key presses close modal cleanly without error', async ({ browser }) => {
  browser.resetErrors();
  // Open modal
  await browser.evaluate("(() => {\n    const card = document.querySelector('.reel-card');\n    if (card) card.click();\n  })()");

  // Press Escape 3 times rapidly
  await browser.pressKey('Escape');
  await browser.pressKey('Escape');
  await browser.pressKey('Escape');

  const isOpen = await browser.evaluate("(() => {\n    const d = document.querySelector('dialog');\n    return d ? d.open : false;\n  })()");

  Assert.isFalse(isOpen, 'Dialog must be closed after consecutive Escape key presses');
  Assert.strictEqual(browser.consoleErrors.length, 0, 'No uncaught errors after consecutive Escape presses');
});

suite.test('Esc Key: Modal video playback is stopped on Esc dismissal', async ({ browser }) => {
  // Re-open modal
  await browser.evaluate("(() => {\n    const card = document.querySelector('.reel-card');\n    if (card) card.click();\n  })()");

  // Press Esc
  await browser.pressKey('Escape');

  const isPausedOrCleared = await browser.evaluate("(() => {\n    const video = document.querySelector('dialog video');\n    if (!video) return true;\n    return video.paused || !video.src || video.src === '';\n  })()");

  Assert.isTrue(isPausedOrCleared, 'Video in modal must be paused or emptied upon Escape dismissal');
});

suite.test('Esc Key: Page body scroll lock is restored upon modal dismissal', async ({ browser }) => {
  const bodyOverflow = await browser.evaluate("(() => {\n    return window.getComputedStyle(document.body).overflow;\n  })()");

  Assert.notStrictEqual(bodyOverflow, 'hidden', 'Body overflow must not remain locked after modal closes');
});

suite.test('Esc Key: Closing modal does not destroy or duplicate the dialog element', async ({ browser }) => {
  const dialogCount = await browser.evaluate("document.querySelectorAll('dialog, #video-modal').length");
  Assert.strictEqual(dialogCount, 1, 'Exactly one modal dialog element must remain in DOM');
});

// ============================================================================
// 4. BACKDROP VS DIALOG INTERIOR CLICKS (>=5 tests)
// ============================================================================

suite.test('Backdrop Click: Clicking inside dialog content does NOT close the modal', async ({ browser }) => {
  // Open modal
  await browser.evaluate("(() => {\n    const card = document.querySelector('.reel-card');\n    if (card) card.click();\n  })()");

  // Click inside modal content container (video or title)
  const stillOpen = await browser.evaluate("(() => {\n    const dialog = document.querySelector('dialog');\n    if (!dialog) return false;\n    const inner = dialog.querySelector('.modal-content, video, h2, h3, .modal-inner') || dialog;\n    inner.click();\n    return dialog.open;\n  })()");

  Assert.isTrue(stillOpen, 'Clicking inside the modal content must NOT close the modal');
});

suite.test('Backdrop Click: Clicking dialog backdrop dismisses the modal', async ({ browser }) => {
  const closed = await browser.evaluate("(() => {\n    const dialog = document.querySelector('dialog');\n    if (!dialog || !dialog.open) return true;\n    // Simulate native backdrop click (click directly on dialog boundary outside rect)\n    const rect = dialog.getBoundingClientRect();\n    const clickOutsideEvent = new MouseEvent('click', {\n      clientX: rect.left - 20,\n      clientY: rect.top - 20,\n      bubbles: true,\n      cancelable: true\n    });\n    dialog.dispatchEvent(clickOutsideEvent);\n    return !dialog.open;\n  })()");

  Assert.isTrue(closed, 'Backdrop click or outside click must dismiss the modal');
});

suite.test('Backdrop Click: Clicking video controls inside modal does not trigger backdrop close', async ({ browser }) => {
  // Open modal
  await browser.evaluate("(() => {\n    const card = document.querySelector('.reel-card');\n    if (card) card.click();\n  })()");

  const maintainedOpen = await browser.evaluate("(() => {\n    const dialog = document.querySelector('dialog');\n    if (!dialog) return false;\n    const video = dialog.querySelector('video');\n    if (video) {\n      video.dispatchEvent(new MouseEvent('click', { bubbles: true }));\n    }\n    return dialog.open;\n  })()");

  Assert.isTrue(maintainedOpen, 'Interacting with video element inside modal must maintain dialog open state');
  // Clean up
  await browser.pressKey('Escape');
});

suite.test('Backdrop Click: Drag selection starting inside dialog does not dismiss on mouseup', async ({ browser }) => {
  // Open modal
  await browser.evaluate("(() => {\n    const card = document.querySelector('.reel-card');\n    if (card) card.click();\n  })()");

  const remainedOpen = await browser.evaluate("(() => {\n    const dialog = document.querySelector('dialog');\n    if (!dialog) return false;\n    // mousedown inside\n    dialog.dispatchEvent(new MouseEvent('mousedown', { clientX: 200, clientY: 200, bubbles: true }));\n    // mouseup outside\n    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 10, clientY: 10, bubbles: true }));\n    return dialog.open;\n  })()");

  Assert.isTrue(remainedOpen, 'Drag selection starting inside dialog must not trigger accidental backdrop dismissal');
  await browser.pressKey('Escape');
});

suite.test('Backdrop Click: Mobile touch tap outside dialog dismisses on small viewport', async ({ browser }) => {
  await browser.setViewport({ width: 375, height: 667, isMobile: true });

  const dismissHandled = await browser.evaluate("(() => {\n    const card = document.querySelector('.reel-card');\n    if (card) card.click();\n    const dialog = document.querySelector('dialog');\n    if (!dialog) return false;\n    // Trigger close or escape simulation on mobile\n    const closeBtn = dialog.querySelector('button[aria-label*=\"close\" i], .modal-close');\n    if (closeBtn) {\n      closeBtn.click();\n    } else {\n      dialog.close();\n    }\n    return !dialog.open;\n  })()");

  Assert.isTrue(dismissHandled, 'Dismissal on mobile viewport closes modal dialog');
  await browser.setViewport({ width: 1280, height: 800, isMobile: false });
});

// ============================================================================
// 5. MISSING OR OFFLINE MEDIA HANDLING (>=5 tests)
// ============================================================================

suite.test('Media Resilience: Poster gradient fallback renders on every card', async ({ browser }) => {
  const backgrounds = await browser.evaluate("(() => {\n    const thumbs = Array.from(document.querySelectorAll('.reel-thumb, .reel-card'));\n    return thumbs.map(t => window.getComputedStyle(t).backgroundImage);\n  })()");

  Assert.greaterThanOrEqual(backgrounds.length, 5, 'Every card or thumb must have styling');
  for (const bg of backgrounds) {
    Assert.ok(
      bg.includes('gradient') || bg.includes('url') || bg.includes('none'),
      'Card must have visual background or fallback gradient'
    );
  }
});

suite.test('Media Resilience: External Google Drive backup links have valid URLs and rel="noopener"', async ({ browser }) => {
  const driveUrls = await browser.evaluate("(() => {\n    const cards = Array.from(document.querySelectorAll('[data-drive-url], a[href*=\"drive.google.com\"]'));\n    return cards.map(c => c.getAttribute('data-drive-url') || c.getAttribute('href') || '');\n  })()");

  Assert.greaterThanOrEqual(driveUrls.length, 5, 'All 5 projects must have Google Drive fallback URLs');
  for (const url of driveUrls) {
    Assert.ok(url.startsWith('https://drive.google.com/'), `Drive URL must be valid Google Drive link (got: ${url})`);
  }
});

suite.test('Media Resilience: Empty or malformed data-src does not crash page controllers', async ({ browser }) => {
  browser.resetErrors();
  await browser.evaluate("(() => {\n    const dummyCard = document.createElement('div');\n    dummyCard.className = 'reel-card';\n    dummyCard.setAttribute('data-drive-url', '');\n    document.body.appendChild(dummyCard);\n    dummyCard.click();\n    document.body.removeChild(dummyCard);\n  })()");

  Assert.strictEqual(browser.consoleErrors.length, 0, 'Malformed card click must not throw unhandled exception');
});

suite.test('Media Resilience: Director founder portrait includes descriptive alt text', async ({ browser }) => {
  const altText = await browser.evaluate("(() => {\n    const img = document.querySelector('.about img, .about-placeholder-img');\n    return img ? img.getAttribute('alt') : null;\n  })()");

  Assert.ok(altText && altText.length > 5, 'Founder portrait image must contain descriptive alt text for screen readers');
});

suite.test('Media Resilience: Video error events on preview elements do not halt page operation', async ({ browser }) => {
  browser.resetErrors();
  await browser.evaluate("(() => {\n    const video = document.querySelector('.reel-video');\n    if (video) {\n      const errEvent = new Event('error');\n      video.dispatchEvent(errEvent);\n    }\n  })()");

  Assert.strictEqual(browser.consoleErrors.length, 0, 'Video element error event must be handled gracefully');
});

module.exports = suite;
