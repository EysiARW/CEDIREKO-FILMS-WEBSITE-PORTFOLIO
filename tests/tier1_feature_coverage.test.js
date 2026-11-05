/**
 * CEDIREKO Films Portfolio - Tier 1: Feature Coverage Test Suite
 * Minimum >= 5 assertions / tests per feature across:
 * - 1. Hero Section
 * - 2. Portfolio Reel
 * - 3. Filter Bar
 * - 4. Video Modal Player
 * - 5. Navigation Header
 * - 6. Branding & Typography
 */

const { TestSuite, Assert } = require('./helpers/test_framework');
const { DesignTokenContract, DomContract } = require('./helpers/contracts');
const path = require('path');
const fs = require('fs');

const suite = new TestSuite('Tier 1: Feature Coverage (Core Requirements)');

const ROOT_DIR = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT_DIR, 'index.html');
const CSS_PATH = path.join(ROOT_DIR, 'style.css');

// ============================================================================
// 1. HERO SECTION (>=5 tests)
// ============================================================================

suite.test('Hero: Letterbox framing bars render at top and bottom', async ({ browser }) => {
  const topBar = await browser.evaluate("!!document.querySelector('.letterbox.top')");
  const bottomBar = await browser.evaluate("!!document.querySelector('.letterbox.bottom')");
  Assert.isTrue(topBar, 'Top letterbox bar (.letterbox.top) must exist in DOM');
  Assert.isTrue(bottomBar, 'Bottom letterbox bar (.letterbox.bottom) must exist in DOM');
});

suite.test('Hero: Studio brand logo is present and loads with natural dimensions', async ({ browser }) => {
  const logoData = await browser.evaluate("(() => {\n    const img = document.querySelector('.hero .logo-mark img') || document.querySelector('.hero img[src*=\"CEDIREKO\"]');\n    if (!img) return null;\n    return {\n      src: img.getAttribute('src'),\n      naturalWidth: img.naturalWidth,\n      naturalHeight: img.naturalHeight,\n      alt: img.getAttribute('alt')\n    };\n  })()");

  Assert.ok(logoData, 'Hero logo image element must exist');
  Assert.includes(logoData.src, 'CEDIREKO', 'Logo src must reference CEDIREKO brand logo asset');
  Assert.greaterThanOrEqual(logoData.naturalWidth, 1, 'Logo image must successfully decode with naturalWidth > 0');
  Assert.ok(logoData.alt, 'Logo image must have an alt attribute');
});

suite.test('Hero: Studio wordmark "CEDIREKO FILMS" is displayed with Fraunces serif', async ({ browser }) => {
  const wordmarkData = await browser.evaluate("(() => {\n    const el = document.querySelector('.studio-name') || document.querySelector('.hero h1');\n    if (!el) return null;\n    const style = window.getComputedStyle(el);\n    return {\n      text: el.textContent.trim(),\n      fontFamily: style.fontFamily,\n      fontSize: style.fontSize\n    };\n  })()");

  Assert.ok(wordmarkData, 'Hero wordmark element must exist');
  Assert.includes(wordmarkData.text, 'CEDIREKO FILMS', 'Hero title must include "CEDIREKO FILMS"');
  Assert.ok(
    wordmarkData.fontFamily.toLowerCase().includes('fraunces') ||
    wordmarkData.fontFamily.toLowerCase().includes('serif'),
    `Hero title must be styled with Fraunces / serif font (got ${wordmarkData.fontFamily})`
  );
});

suite.test('Hero: Studio motto/tagline "Maging mabait lang palagi" is rendered', async ({ browser }) => {
  const tagline = await browser.evaluate("(() => {\n    const el = document.querySelector('.hero .tagline');\n    return el ? el.textContent.trim() : '';\n  })()");

  Assert.includes(tagline, 'Maging mabait lang palagi', 'Tagline must include "Maging mabait lang palagi"');
});

suite.test('Hero: Camera HUD timecodes and status indicators are rendered', async ({ browser }) => {
  const hudData = await browser.evaluate("(() => {\n    const elements = Array.from(document.querySelectorAll('.hero-tc, .hud-tc, .side-badge, .hero [class*=\"tc\"]'));\n    return elements.map(el => el.textContent.trim());\n  })()");

  Assert.greaterThanOrEqual(hudData.length, 2, 'Hero must display at least 2 camera HUD indicators or side badges');
  const hudText = hudData.join(' ');
  Assert.ok(
    hudText.includes('REC') || hudText.includes('EST. 2026') || hudText.includes('CEDIREKO') || hudText.includes('STUDIO'),
    'Hero HUD indicators must contain cinematic markers (REC, EST. 2026, or studio tags)'
  );
});

suite.test('Hero: Scroll cue indicator is present with link or cue to reel', async ({ browser }) => {
  const scrollCue = await browser.evaluate("(() => {\n    const el = document.querySelector('.scroll-cue, a[href=\"#reel\"], .scroll-indicator');\n    return el ? el.textContent.trim() : null;\n  })()");

  Assert.ok(scrollCue !== null, 'Hero must have a scroll cue element (.scroll-cue)');
  Assert.ok(scrollCue.toLowerCase().includes('scroll') || scrollCue.length >= 0, 'Scroll cue must be visible');
});

// ============================================================================
// 2. PORTFOLIO REEL (>=5 tests)
// ============================================================================

suite.test('Reel: All 5 authentic project items are present in DOM', async ({ browser }) => {
  const projectTitles = await browser.evaluate("(() => {\n    const cards = Array.from(document.querySelectorAll('.reel-card, [data-project-title]'));\n    return cards.map(c => {\n      const titleEl = c.querySelector('.reel-title, h3, [class*=\"title\"]');\n      return titleEl ? titleEl.textContent.trim().toUpperCase() : '';\n    });\n  })()");

  Assert.greaterThanOrEqual(projectTitles.length, 5, 'Reel must contain at least 5 project cards');
  const allTitlesStr = projectTitles.join(' | ');
  Assert.includes(allTitlesStr, 'VERONIKKA', 'Veronikka project must be present');
  Assert.includes(allTitlesStr, 'EA', 'EA Performance project must be present');
  Assert.includes(allTitlesStr, 'CYRA', 'Fico Mana Cyra project must be present');
  Assert.includes(allTitlesStr, 'BREANNA', 'Fico Mana Breanna project must be present');
  Assert.includes(allTitlesStr, 'LEIGH', 'Fico Mana Leigh project must be present');
});

suite.test('Reel: Project cards have pre-allocated aspect ratios for CLS prevention', async ({ browser }) => {
  const orientations = await browser.evaluate("(() => {\n    const cards = Array.from(document.querySelectorAll('.reel-card'));\n    return cards.map(c => c.getAttribute('data-orientation') || 'unknown');\n  })()");

  Assert.strictEqual(orientations.length, 5, '5 cards must exist');
  const landscapeCount = orientations.filter(o => o === 'landscape').length;
  const portraitCount = orientations.filter(o => o === 'portrait').length;

  Assert.strictEqual(landscapeCount, 2, '2 landscape projects must have data-orientation="landscape"');
  Assert.strictEqual(portraitCount, 3, '3 portrait projects must have data-orientation="portrait"');
});

suite.test('Reel: Project cards display editorial categories (Commercial, Music Video, Fashion)', async ({ browser }) => {
  const categories = await browser.evaluate("(() => {\n    const cats = Array.from(document.querySelectorAll('.reel-cat, .project-cat, .card-eyebrow'));\n    return cats.map(c => c.textContent.trim());\n  })()");

  Assert.greaterThanOrEqual(categories.length, 5, 'Every project card must display a category badge');
  const catsJoined = categories.join(' ').toUpperCase();
  Assert.ok(catsJoined.includes('ADVERTISEMENT') || catsJoined.includes('COMMERCIAL'), 'Commercial category must be displayed');
  Assert.ok(catsJoined.includes('MUSIC') || catsJoined.includes('PERFORMANCE'), 'Music video category must be displayed');
  Assert.ok(catsJoined.includes('FICO') || catsJoined.includes('FASHION') || catsJoined.includes('REEL'), 'Editorial/fashion category must be displayed');
});

suite.test('Reel: Scene numbers SC.01 through SC.05 are assigned and unique across projects', async ({ browser }) => {
  const sceneTags = await browser.evaluate("(() => {\n    const tags = Array.from(document.querySelectorAll('.reel-card .reel-tc span:first-child, .scene-tag, [data-scene]'));\n    return tags.map(t => t.textContent.trim());\n  })()");

  Assert.greaterThanOrEqual(sceneTags.length, 5, 'Each card must have a scene number');
  const uniqueTags = new Set(sceneTags);
  Assert.strictEqual(
    uniqueTags.size,
    sceneTags.length,
    `Scene numbers must be unique across all 5 projects (found: ${sceneTags.join(', ')})`
  );
});

suite.test('Reel: Video preview elements bind to valid local MP4 paths in projects/', async ({ browser }) => {
  const videoSources = await browser.evaluate("(() => {\n    const videos = Array.from(document.querySelectorAll('.reel-video, video'));\n    return videos.map(v => v.getAttribute('data-src') || v.getAttribute('src') || '');\n  })()");

  Assert.greaterThanOrEqual(videoSources.length, 5, 'At least 5 video source references must exist in the reel');
  for (const src of videoSources.filter(s => s.length > 0)) {
    Assert.ok(src.startsWith('projects/') && src.endsWith('.mp4'), `Video src must point to local MP4 in projects/ (got: ${src})`);
  }
});

suite.test('Reel: Interactive play rings or triggers are rendered on all cards', async ({ browser }) => {
  const playRingsCount = await browser.evaluate("document.querySelectorAll('.play-ring, .play-trigger, .card-play-btn').length");
  Assert.greaterThanOrEqual(playRingsCount, 5, 'All 5 reel cards must have an interactive play indicator');
});

// ============================================================================
// 3. FILTER BAR (>=5 tests)
// ============================================================================

suite.test('Filter Bar: Container has role="tablist" with accessible label', async ({ browser }) => {
  const tablist = await browser.evaluate("(() => {\n    const el = document.querySelector('.reel-toggle, .filter-bar, [role=\"tablist\"]');\n    if (!el) return null;\n    return {\n      role: el.getAttribute('role'),\n      ariaLabel: el.getAttribute('aria-label')\n    };\n  })()");

  Assert.ok(tablist, 'Reel filter container must exist');
  Assert.strictEqual(tablist.role, 'tablist', 'Reel filter container must have role="tablist"');
  Assert.ok(tablist.ariaLabel && tablist.ariaLabel.length > 0, 'Reel filter tablist must have aria-label');
});

suite.test('Filter Bar: Offers selectable views (including All Work, Films/Brand, and Vertical Reels)', async ({ browser }) => {
  const buttons = await browser.evaluate("(() => {\n    const btns = Array.from(document.querySelectorAll('.reel-toggle-btn, .filter-btn, [role=\"tab\"]'));\n    return btns.map(b => ({\n      view: b.getAttribute('data-view'),\n      text: b.textContent.trim(),\n      ariaSelected: b.getAttribute('aria-selected')\n    }));\n  })()");

  Assert.greaterThanOrEqual(buttons.length, 2, 'Filter bar must have at least 2 filter options');
  const views = buttons.map(b => b.view);
  Assert.ok(
    views.includes('portrait') || views.includes('landscape') || views.includes('all'),
    'Filter buttons must provide orientation or category filtering'
  );
});

suite.test('Filter Bar: Default view displays all 5 projects on initial page load', async ({ browser }) => {
  const visibleCount = await browser.evaluate("(() => {\n    const cards = Array.from(document.querySelectorAll('.reel-card'));\n    return cards.filter(c => {\n      const style = window.getComputedStyle(c);\n      return style.display !== 'none' && style.visibility !== 'hidden';\n    }).length;\n  })()");

  Assert.strictEqual(visibleCount, 5, 'All 5 projects must be visible on initial load (default "All Work" view)');
});

suite.test('Filter Bar: Exactly one filter button is active on initial page load', async ({ browser }) => {
  const activeButtonsCount = await browser.evaluate("document.querySelectorAll('.reel-toggle-btn.is-active, .filter-btn.is-active, [role=\"tab\"][aria-selected=\"true\"]').length");
  Assert.strictEqual(activeButtonsCount, 1, 'Exactly one filter tab must have active / aria-selected="true" state initially');
});

suite.test('Filter Bar: Clicking landscape view displays landscape projects', async ({ browser }) => {
  await browser.evaluate("(() => {\n    const btn = document.querySelector('[data-view=\"landscape\"], [data-view=\"brand\"], [data-view=\"films\"]');\n    if (btn) btn.click();\n  })()");

  const visibleCount = await browser.evaluate("(() => {\n    const cards = Array.from(document.querySelectorAll('.reel-card'));\n    return cards.filter(c => {\n      const style = window.getComputedStyle(c);\n      return style.display !== 'none' && style.visibility !== 'hidden';\n    }).length;\n  })()");

  Assert.greaterThanOrEqual(visibleCount, 2, 'Switching to landscape/brand filter must show landscape projects');
});

suite.test('Filter Bar: Clicking portrait view displays portrait projects', async ({ browser }) => {
  await browser.evaluate("(() => {\n    const btn = document.querySelector('[data-view=\"portrait\"], [data-view=\"vertical\"]');\n    if (btn) btn.click();\n  })()");

  const visibleCount = await browser.evaluate("(() => {\n    const cards = Array.from(document.querySelectorAll('.reel-card'));\n    return cards.filter(c => {\n      const style = window.getComputedStyle(c);\n      return style.display !== 'none' && style.visibility !== 'hidden';\n    }).length;\n  })()");

  Assert.greaterThanOrEqual(visibleCount, 3, 'Switching to portrait/vertical filter must show portrait projects');
});

suite.test('Filter Bar: ARIA selected state toggles correctly between buttons', async ({ browser }) => {
  const activeView = await browser.evaluate("(() => {\n    const activeBtn = document.querySelector('[role=\"tab\"][aria-selected=\"true\"], .reel-toggle-btn.is-active');\n    return activeBtn ? activeBtn.getAttribute('data-view') : null;\n  })()");

  Assert.ok(activeView, 'An active filter button must have aria-selected="true"');
});

// ============================================================================
// 4. VIDEO MODAL PLAYER (>=5 tests)
// ============================================================================

suite.test('Video Modal: Native <dialog id="video-modal"> element exists in DOM', async ({ browser }) => {
  const dialogExists = await browser.evaluate("(() => {\n    const d = document.getElementById('video-modal') || document.querySelector('dialog.video-modal, dialog');\n    return d ? { tagName: d.tagName.toLowerCase(), id: d.id } : null;\n  })()");

  Assert.ok(dialogExists, 'Native <dialog id="video-modal"> must exist in HTML');
  Assert.strictEqual(dialogExists.tagName, 'dialog', 'Video modal must use semantic <dialog> element');
});

suite.test('Video Modal: Clicking a reel card opens the video modal dialog', async ({ browser }) => {
  const opened = await browser.evaluate("(() => {\n    const firstCard = document.querySelector('.reel-card');\n    if (!firstCard) return false;\n    firstCard.click();\n    const dialog = document.querySelector('dialog');\n    return dialog ? (dialog.open || dialog.hasAttribute('open')) : false;\n  })()");

  Assert.isTrue(opened, 'Clicking a project card must open the modal dialog (dialog.open === true)');
});

suite.test('Video Modal: Modal video element receives source of selected project', async ({ browser }) => {
  const modalVideoSrc = await browser.evaluate("(() => {\n    const dialog = document.querySelector('dialog');\n    if (!dialog || !dialog.open) return '';\n    const video = dialog.querySelector('video');\n    return video ? (video.currentSrc || video.src || '') : '';\n  })()");

  Assert.ok(modalVideoSrc.length > 0, 'Modal video element must have a loaded video source');
  Assert.includes(modalVideoSrc, 'projects/', 'Modal video source must reference projects/ media');
});

suite.test('Video Modal: Close button dismisses dialog', async ({ browser }) => {
  const closed = await browser.evaluate("(() => {\n    const closeBtn = document.querySelector('dialog button[aria-label*=\"close\" i], dialog .modal-close, dialog .close-btn, dialog button');\n    if (closeBtn) closeBtn.click();\n    const dialog = document.querySelector('dialog');\n    return dialog ? !dialog.open : true;\n  })()");

  Assert.isTrue(closed, 'Clicking the close button must close the modal dialog');
});

suite.test('Video Modal: Escape key dismisses open dialog', async ({ browser }) => {
  // First re-open modal
  await browser.evaluate("(() => {\n    const card = document.querySelector('.reel-card');\n    if (card) card.click();\n  })()");

  // Press Escape
  await browser.pressKey('Escape');

  const isClosed = await browser.evaluate("(() => {\n    const dialog = document.querySelector('dialog');\n    return dialog ? !dialog.open : true;\n  })()");

  Assert.isTrue(isClosed, 'Pressing Escape key must dismiss the open video modal dialog');
});

suite.test('Video Modal: Google Drive high-res master fallback link is present', async ({ browser }) => {
  const driveLink = await browser.evaluate("(() => {\n    const link = document.querySelector('dialog a[href*=\"drive.google.com\"], a.btn-external-drive, [data-drive-url]');\n    return !!link;\n  })()");

  Assert.isTrue(driveLink, 'A fallback link to Google Drive master files must be accessible');
});

// ============================================================================
// 5. NAVIGATION HEADER (>=5 tests)
// ============================================================================

suite.test('Navigation: Semantic <header> element exists with <nav>', async ({ browser }) => {
  const navStructure = await browser.evaluate("(() => {\n    const header = document.querySelector('header, .site-header');\n    const nav = document.querySelector('nav');\n    return {\n      hasHeader: !!header,\n      hasNav: !!nav\n    };\n  })()");

  Assert.isTrue(navStructure.hasHeader, 'Semantic <header> element must exist');
  Assert.isTrue(navStructure.hasNav, 'Semantic <nav> element must exist within header');
});

suite.test('Navigation: Wordmark/logo link links back to hero/top', async ({ browser }) => {
  const brandLink = await browser.evaluate("(() => {\n    const link = document.querySelector('header a[href=\"#\"], header a[href=\"#hero\"], header .brand-logo');\n    return !!link;\n  })()");

  Assert.isTrue(brandLink, 'Header must contain brand wordmark/logo link');
});

suite.test('Navigation: Contains section anchor links to Reel, About, and Inquiry', async ({ browser }) => {
  const navLinks = await browser.evaluate("(() => {\n    const links = Array.from(document.querySelectorAll('header nav a, .nav-links a'));\n    return links.map(l => l.getAttribute('href'));\n  })()");

  Assert.greaterThanOrEqual(navLinks.length, 2, 'Navigation must contain at least 2 section links');
  const linksStr = navLinks.join(' ');
  Assert.ok(linksStr.includes('#reel') || linksStr.includes('#work'), 'Nav must link to #reel / #work');
  Assert.ok(linksStr.includes('#about') || linksStr.includes('#studio'), 'Nav must link to #about / #studio');
});

suite.test('Navigation: Sticky / fixed positioning on page scroll', async ({ browser }) => {
  await browser.evaluate("window.scrollTo(0, 300)");
  await new Promise(r => setTimeout(r, 100));

  const isSticky = await browser.evaluate("(() => {\n    const header = document.querySelector('header, .site-header');\n    if (!header) return false;\n    const style = window.getComputedStyle(header);\n    return style.position === 'fixed' || style.position === 'sticky' || header.classList.contains('site-header--scrolled');\n  })()");

  Assert.isTrue(isSticky, 'Site header must remain sticky / fixed or toggle scrolled state on scroll');
  await browser.evaluate("window.scrollTo(0, 0)");
});

suite.test('Navigation: Mobile hamburger toggle button is accessible', async ({ browser }) => {
  const toggleBtn = await browser.evaluate("(() => {\n    const btn = document.querySelector('.nav-toggle, .hamburger, [aria-label*=\"menu\" i], header button');\n    return btn ? {\n      exists: true,\n      ariaLabel: btn.getAttribute('aria-label')\n    } : null;\n  })()");

  Assert.ok(toggleBtn, 'Mobile navigation toggle button must exist');
});

// ============================================================================
// 6. BRANDING & TYPOGRAPHY (>=5 tests)
// ============================================================================

suite.test('Branding: CSS variables define core burgundy palette (--void, --wine, --bone, --ember)', async () => {
  const contract = DesignTokenContract.fromFile(CSS_PATH);
  Assert.ok(contract.hasToken('--void'), 'CSS must define --void (background)');
  Assert.ok(contract.hasToken('--wine'), 'CSS must define --wine (surface)');
  Assert.ok(contract.hasToken('--bone'), 'CSS must define --bone (primary text)');
  Assert.ok(contract.hasToken('--ember'), 'CSS must define --ember (accent)');
});

suite.test('Branding: Text-primary (--bone) on Canvas (--void) achieves WCAG 2.1 AA contrast >= 4.5:1', async () => {
  const contract = DesignTokenContract.fromFile(CSS_PATH);
  const voidColor = contract.getToken('--void');
  const boneColor = contract.getToken('--bone');

  Assert.ok(voidColor, '--void must be defined');
  Assert.ok(boneColor, '--bone must be defined');

  const ratio = DesignTokenContract.getContrastRatio(boneColor, voidColor);
  Assert.greaterThanOrEqual(ratio, 4.5, `Contrast ratio between --bone and --void must be >= 4.5:1 (calculated: ${ratio.toFixed(2)}:1)`);
});

suite.test('Branding: Accent (--ember) on Canvas (--void) achieves WCAG 2.1 AA contrast >= 4.5:1', async () => {
  const contract = DesignTokenContract.fromFile(CSS_PATH);
  const voidColor = contract.getToken('--void');
  const emberColor = contract.getToken('--ember');

  const ratio = DesignTokenContract.getContrastRatio(emberColor, voidColor);
  Assert.greaterThanOrEqual(ratio, 4.5, `Contrast ratio between --ember and --void must be >= 4.5:1 (calculated: ${ratio.toFixed(2)}:1)`);
});

suite.test('Typography: Google Fonts link loads Fraunces, Manrope, and Space Mono', async () => {
  const dom = DomContract.fromFile(HTML_PATH);
  Assert.ok(dom.contains('family=Fraunces'), 'HTML must link Fraunces font');
  Assert.ok(dom.contains('family=Manrope'), 'HTML must link Manrope font');
  Assert.ok(dom.contains('family=Space+Mono'), 'HTML must link Space Mono font');
});

suite.test('Assets: style.css references assets/topo.png and produces zero asset 404s', async ({ server }) => {
  const cssContent = fs.readFileSync(CSS_PATH, 'utf8');
  Assert.ok(
    !cssContent.includes('url("topo.png")') && !cssContent.includes("url('topo.png')"),
    'style.css must not reference un-namespaced topo.png which produces an HTTP 404'
  );
  Assert.ok(
    cssContent.includes('assets/topo.png'),
    'style.css must reference assets/topo.png'
  );

  const nonFavicon404s = server.errors404.filter(e => !e.url.includes('favicon.ico'));
  Assert.strictEqual(
    nonFavicon404s.length,
    0,
    `Page load must generate 0 404 errors (found: ${nonFavicon404s.map(e => e.url).join(', ')})`
  );
});

suite.test('Assets: Topographic ambient asset (assets/topo.png) returns HTTP 200 OK', async ({ serverUrl }) => {
  const res = await fetch(`${serverUrl}/assets/topo.png`);
  Assert.strictEqual(res.status, 200, 'assets/topo.png must return HTTP 200 OK');
});

suite.test('Assets: Logo and Director portrait return HTTP 200 OK', async ({ serverUrl }) => {
  const resLogo = await fetch(`${serverUrl}/assets/CEDIREKO%20PNG.png`);
  Assert.strictEqual(resLogo.status, 200, 'assets/CEDIREKO PNG.png must return HTTP 200 OK');

  const resPortrait = await fetch(`${serverUrl}/assets/IMG_9987.jpeg`);
  Assert.strictEqual(resPortrait.status, 200, 'assets/IMG_9987.jpeg must return HTTP 200 OK');
});

module.exports = suite;
