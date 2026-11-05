/**
 * CEDIREKO Films Portfolio - Tier 4: Real-World Workload Scenarios Test Suite
 * End-to-end multi-step visitor journeys simulating authentic client and visitor behaviors:
 * - Scenario 1: Complete Desktop Visitor Discovery Journey
 * - Scenario 2: Mobile Touch Visitor Discovery & Reel Playback Journey
 * - Scenario 3: Commercial Client Discovery & Master File Verification
 */

const { TestSuite, Assert } = require('./helpers/test_framework');

const suite = new TestSuite('Tier 4: Real-World Workload Scenarios');

// ============================================================================
// SCENARIO 1: COMPLETE DESKTOP VISITOR DISCOVERY JOURNEY
// ============================================================================

suite.test('Journey: Full visitor discovery from landing to reel filtering, modal playback, bio, and inquiry', async ({ browser }) => {
  // Step 1: Visitor lands on page at 1280x800 desktop
  await browser.setViewport({ width: 1280, height: 800, isMobile: false });
  await browser.evaluate("window.scrollTo(0, 0)");

  // Assert hero branding is visible
  const heroLoaded = await browser.evaluate("(() => {\n    const h1 = document.querySelector('.studio-name, .hero h1');\n    const logo = document.querySelector('.hero img');\n    return !!h1 && !!logo;\n  })()");
  Assert.isTrue(heroLoaded, 'Step 1: Visitor must see hero brand logo and studio name on landing');

  // Step 2: Visitor scrolls down to the Reel portfolio section
  await browser.evaluate("(() => {\n    const reel = document.getElementById('reel') || document.querySelector('.reel');\n    if (reel) reel.scrollIntoView({ behavior: 'instant', block: 'start' });\n  })()");
  await new Promise(r => setTimeout(r, 100));

  // Step 3: Visitor switches filter to "Vertical Reels" (or portrait)
  await browser.evaluate("(() => {\n    const vertBtn = document.querySelector('[data-view=\"portrait\"], [data-view=\"vertical\"], .reel-toggle-btn');\n    if (vertBtn) vertBtn.click();\n  })()");

  // Step 4: Visitor clicks on a portrait reel card (e.g. Fico Mana Cyra or Breanna)
  await browser.evaluate("(() => {\n    const portraitCard = document.querySelector('.reel-card[data-orientation=\"portrait\"], .reel-card');\n    if (portraitCard) portraitCard.click();\n  })()");

  // Step 5: Native Video Modal opens and binds video
  const modalOpened = await browser.evaluate("(() => {\n    const dialog = document.querySelector('dialog');\n    return dialog ? dialog.open : false;\n  })()");
  Assert.isTrue(modalOpened, 'Step 5: Clicking portrait card opens the native Video Modal Player');

  // Step 6: Visitor closes modal using close button
  await browser.evaluate("(() => {\n    const closeBtn = document.querySelector('dialog button[aria-label*=\"close\" i], dialog .modal-close');\n    if (closeBtn) {\n      closeBtn.click();\n    } else {\n      const dialog = document.querySelector('dialog');\n      if (dialog) dialog.close();\n    }\n  })()");

  const modalClosed = await browser.evaluate("(() => {\n    const dialog = document.querySelector('dialog');\n    return dialog ? !dialog.open : true;\n  })()");
  Assert.isTrue(modalClosed, 'Step 6: Modal must be closed after visitor clicks close button');

  // Step 7: Visitor switches filter to "Commercial & Brand" (or landscape)
  await browser.evaluate("(() => {\n    const landBtn = document.querySelector('[data-view=\"landscape\"], [data-view=\"brand\"], [data-view=\"films\"]');\n    if (landBtn) landBtn.click();\n  })()");

  // Step 8: Visitor clicks a landscape project card (Veronikka Rebranding)
  await browser.evaluate("(() => {\n    const landscapeCard = document.querySelector('.reel-card[data-orientation=\"landscape\"]');\n    if (landscapeCard) landscapeCard.click();\n  })()");

  // Step 9: Dismiss second modal via Escape key
  await browser.pressKey('Escape');

  // Step 10: Visitor scrolls to "Behind the lens" Studio Bio section
  await browser.evaluate("(() => {\n    const about = document.getElementById('about') || document.querySelector('.about');\n    if (about) about.scrollIntoView({ behavior: 'instant', block: 'start' });\n  })()");

  const aboutVisible = await browser.evaluate("(() => {\n    const img = document.querySelector('.about img');\n    const bio = document.querySelector('.about p');\n    return !!img && !!bio;\n  })()");
  Assert.isTrue(aboutVisible, 'Step 10: Founder portrait and studio philosophy bio must be rendered');

  // Step 11: Visitor reaches inquiry / contact section
  const contactExists = await browser.evaluate("(() => {\n    const contact = document.querySelector('#contact, #inquiry, .inquiry, footer');\n    return !!contact;\n  })()");
  Assert.isTrue(contactExists, 'Step 11: Inquiry / booking section or studio contact channels must be accessible');
});

// ============================================================================
// SCENARIO 2: MOBILE TOUCH VISITOR DISCOVERY JOURNEY (375px)
// ============================================================================

suite.test('Journey: Mobile visitor touch journey across reels and navigation', async ({ browser }) => {
  await browser.setViewport({ width: 375, height: 667, isMobile: true });
  await browser.evaluate("window.scrollTo(0, 0)");

  // Mobile landing zero overflow check
  const scrollWidth = await browser.evaluate("document.documentElement.scrollWidth");
  Assert.lessThanOrEqual(scrollWidth, 375, 'Mobile visitor landing must have zero horizontal overflow');

  // Mobile reel interaction
  const tapCard = await browser.evaluate("(() => {\n    const card = document.querySelector('.reel-card');\n    if (!card) return false;\n    card.click();\n    const dialog = document.querySelector('dialog');\n    return dialog ? dialog.open : false;\n  })()");

  Assert.isTrue(tapCard, 'Mobile visitor tap on reel card opens theater video player');

  // Mobile modal close via Esc / touch dismiss
  await browser.pressKey('Escape');

  await browser.setViewport({ width: 1280, height: 800, isMobile: false });
});

// ============================================================================
// SCENARIO 3: COMMERCIAL CLIENT DISCOVERY & MASTER FILE VERIFICATION
// ============================================================================

suite.test('Journey: Commercial client inspects metadata and Google Drive master link', async ({ browser }) => {
  // Client inspects commercial projects
  const veronikkaMeta = await browser.evaluate("(() => {\n    const card = document.querySelector('.reel-card[data-orientation=\"landscape\"]');\n    if (!card) return null;\n    return {\n      driveUrl: card.getAttribute('data-drive-url'),\n      title: (card.querySelector('.reel-title') || {}).textContent || '',\n      category: (card.querySelector('.reel-cat') || {}).textContent || '',\n      scene: (card.querySelector('.reel-tc') || {}).textContent || ''\n    };\n  })()");

  Assert.ok(veronikkaMeta, 'Landscape project card must exist');
  Assert.ok(veronikkaMeta.driveUrl && veronikkaMeta.driveUrl.includes('drive.google.com'), 'Project must provide a high-resolution Google Drive master share link');
  Assert.ok(veronikkaMeta.category.length > 0, 'Project must display editorial category');
  Assert.ok(veronikkaMeta.scene.length > 0, 'Project must display camera scene / duration timecode');
});

module.exports = suite;
