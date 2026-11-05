# CEDIREKO Films Portfolio — Test Infrastructure Specification

**Document**: Test Infrastructure, Architecture, 4-Tier Test Matrix & Invocation Guide  
**Project**: CEDIREKO Films Personal Portfolio Showcase (`cedireko-film-website-portfolio2026.great-site.net`)  
**Suite Location**: `tests/`  
**Test Runner**: `node tests/run_tests.js`  
**Test Author**: `teamwork_test_writer_e2e`  
**Date**: 2026-11-05  

---

## 1. Overview & Architecture

This testing infrastructure provides an automated, opaque-box end-to-end verification harness for the CEDIREKO Films personal portfolio revamp. The test suite operates without external npm dependencies by using Node.js built-in standard libraries (native HTTP range server, native `WebSocket`, `child_process`, `fs`) combined with Google Chrome's headless DevTools Protocol (CDP).

### Architectural Components

```
tests/
├── run_tests.js                    # CLI test runner & orchestrator
├── tier1_feature_coverage.test.js  # Tier 1: Functional coverage (>=5 per feature)
├── tier2_boundary_corner.test.js   # Tier 2: Boundary, viewport & resilience (>=5 per feature)
├── tier3_cross_feature.test.js     # Tier 3: Cross-subsystem interactions
├── tier4_real_world_journey.test.js# Tier 4: End-to-end authentic visitor workflows
└── helpers/
    ├── test_framework.js           # OOP test runner, assertion library & reporter
    ├── http_server.js              # Ephemeral static HTTP server with byte-range & 404 tracking
    ├── cdp_browser.js              # Native Chrome DevTools Protocol (CDP) headless driver
    └── contracts.js                # Design token, contrast ratio & DOM verifier
```

1. **`ProjectHttpServer` (`tests/helpers/http_server.js`)**:
   - Binds to an ephemeral local port (`127.0.0.1:0`).
   - Serves workspace assets with correct MIME types (`.html`, `.css`, `.js`, `.mp4`, `.png`, `.jpeg`).
   - Supports HTTP 206 Partial Content byte ranges for `.mp4` video streaming.
   - Monitors and logs all 404 requests (e.g. detecting un-namespaced `topo.png`).
   - Implements socket tracking and `closeAllConnections()` for instant, clean teardown.

2. **`CdpBrowser` (`tests/helpers/cdp_browser.js`)**:
   - Launches Google Chrome (`--headless=new`) with isolated temporary user profiles.
   - Connects directly to Chrome DevTools Protocol over native WebSocket (`ws://`).
   - Automatically detects and targets web page targets (`type: "page"`), avoiding internal browser UI.
   - Provides viewport emulation (`Emulation.setDeviceMetricsOverride`), runtime evaluation (`Runtime.evaluate`), click simulation, key dispatch (`Input.dispatchKeyEvent`), and real-time console/network error trapping.

3. **`Assert` & `TestSuite` (`tests/helpers/test_framework.js`)**:
   - Object-Oriented assertion library (`ok`, `strictEqual`, `greaterThanOrEqual`, `lessThanOrEqual`, `includes`, `isTrue`, `isFalse`, `throws`).
   - Isolated per-suite lifecycle hooks (`beforeAll`, `afterAll`, `beforeEach`, `afterEach`).
   - Structured colorized reporter with pass/fail counts and duration tracking.

4. **`DesignTokenContract` & `DomContract` (`tests/helpers/contracts.js`)**:
   - Parses CSS `:root` declarations to verify token definitions.
   - Calculates relative luminance and mathematical WCAG 2.1 AA contrast ratios ($L_1/L_2 \ge 4.5:1$).

---

## 2. Invocation Instructions

Run tests using Node.js (v18, v20, v22, v24, v26+):

### Execute Complete Test Suite (All Tiers)
```bash
node tests/run_tests.js
```

### Execute Specific Tiers
```bash
# Tier 1 only (Feature Coverage)
node tests/run_tests.js --tier=1

# Tier 2 only (Boundary & Corner Cases)
node tests/run_tests.js --tier=2

# Tier 3 only (Cross-Feature Interactions)
node tests/run_tests.js --tier=3

# Tier 4 only (Real-World Workload Scenarios)
node tests/run_tests.js --tier=4
```

---

## 3. 4-Tier Test Matrix & Feature Checklist

The suite comprises **70 automated test cases** systematically testing all requirements:

### Tier 1: Feature Coverage (Core Requirements)
| Feature | Test Case Name | Objective / Assertion |
|---|---|---|
| **Hero Section** | `Hero: Letterbox framing bars render at top and bottom` | Confirms `.letterbox.top` and `.letterbox.bottom` are rendered |
| | `Hero: Studio brand logo is present and loads with natural dimensions` | Confirms logo image decodes with `naturalWidth > 0` |
| | `Hero: Studio wordmark "CEDIREKO FILMS" is displayed with Fraunces serif` | Verifies title typography uses Fraunces / serif |
| | `Hero: Studio motto/tagline "Maging mabait lang palagi" is rendered` | Verifies studio motto copy is present |
| | `Hero: Camera HUD timecodes and status indicators are rendered` | Confirms camera HUD markers (`REC ●`, `EST. 2026`) |
| | `Hero: Scroll cue indicator is present with link or cue to reel` | Verifies scroll cue indicator leading to portfolio |
| **Portfolio Reel** | `Reel: All 5 authentic project items are present in DOM` | Verifies Veronikka, EA, Cyra, Breanna, and Leigh cards |
| | `Reel: Project cards have pre-allocated aspect ratios for CLS prevention` | Verifies landscape (16:9) and portrait (9:16) aspect ratios |
| | `Reel: Project cards display editorial categories` | Confirms Commercial, Music Video, Fashion category tags |
| | `Reel: Scene numbers SC.01 through SC.05 are assigned and unique across projects` | Verifies SC numbers are unique across all 5 projects |
| | `Reel: Video preview elements bind to valid local MP4 paths in projects/` | Verifies local video file references |
| | `Reel: Interactive play rings or triggers are rendered on all cards` | Confirms play trigger indicators on cards |
| **Filter Bar** | `Filter Bar: Container has role="tablist" with accessible label` | Validates semantic ARIA tablist structure |
| | `Filter Bar: Offers selectable views (All Work, Films/Brand, Vertical Reels)` | Verifies category/orientation filter buttons |
| | `Filter Bar: Default view displays all 5 projects on initial page load` | Verifies all 5 projects are visible by default |
| | `Filter Bar: Exactly one filter button is active on initial page load` | Verifies initial active button state |
| | `Filter Bar: Clicking landscape view displays landscape projects` | Verifies filtering to landscape projects |
| | `Filter Bar: Clicking portrait view displays portrait projects` | Verifies filtering to portrait reels |
| | `Filter Bar: ARIA selected state toggles correctly between buttons` | Validates `aria-selected` dynamic state updates |
| **Video Modal Player** | `Video Modal: Native <dialog id="video-modal"> element exists in DOM` | Validates native HTML5 `<dialog>` element presence |
| | `Video Modal: Clicking a reel card opens the video modal dialog` | Confirms card click triggers `dialog.showModal()` |
| | `Video Modal: Modal video element receives source of selected project` | Verifies active project video source binding |
| | `Video Modal: Close button dismisses dialog` | Confirms close button dismisses dialog |
| | `Video Modal: Escape key dismisses open dialog` | Confirms native Escape key dismisses dialog |
| | `Video Modal: External Google Drive master link is removed` | Confirms removal of external Drive fallback links |
| **Navigation Header** | `Navigation: Semantic <header> element exists with <nav>` | Validates `<header>` and `<nav>` semantic landmarks |
| | `Navigation: Wordmark/logo link links back to hero/top` | Verifies studio branding link in header |
| | `Navigation: Contains section anchor links to Reel, About, and Inquiry` | Verifies anchor links (`#reel`, `#about`, `#inquiry`) |
| | `Navigation: Sticky / fixed positioning on page scroll` | Verifies header stickiness or scrolled state |
| | `Navigation: Mobile hamburger toggle button is accessible` | Validates mobile navigation toggle affordance |
| **Branding & Typography** | `Branding: CSS variables define core burgundy palette` | Confirms `--void`, `--wine`, `--bone`, `--ember` |
| | `Branding: Text-primary (--bone) on Canvas achieves WCAG AA contrast >= 4.5:1` | Mathematically verifies contrast ratio (13.4:1) |
| | `Branding: Accent (--ember) on Canvas achieves WCAG AA contrast >= 4.5:1` | Mathematically verifies accent contrast ratio (7.1:1) |
| | `Typography: Google Fonts link loads Fraunces, Manrope, and Space Mono` | Confirms typography triad imports |
| | `Assets: style.css references assets/topo.png and produces zero asset 404s` | Verifies fix for `topo.png` 404 bug |
| | `Assets: Topographic ambient asset (assets/topo.png) returns HTTP 200 OK` | Verifies asset file exists on server |
| | `Assets: Logo and Director portrait return HTTP 200 OK` | Verifies brand imagery returns HTTP 200 |

### Tier 2: Boundary & Corner Cases
| Category | Test Case Name | Objective / Assertion |
|---|---|---|
| **Viewport Overflow** | `Overflow 375px: Zero horizontal overflow on standard mobile (iPhone SE)` | `scrollWidth <= innerWidth` at 375x667 |
| | `Overflow 768px: Zero horizontal overflow on tablet (iPad Mini)` | `scrollWidth <= innerWidth` at 768x1024 |
| | `Overflow 1280px: Zero horizontal overflow on standard desktop display` | `scrollWidth <= innerWidth` at 1280x800 |
| | `Overflow 320px: Zero horizontal overflow on compact mobile (iPhone 5/SE gen 1)` | `scrollWidth <= innerWidth` at 320x568 |
| | `Overflow 1920px: Zero horizontal overflow on large 1080p desktop display` | `scrollWidth <= innerWidth` at 1920x1080 |
| **Rapid Filter Toggling** | `Rapid Filter: Rapid toggling 10x does not corrupt total card count in DOM` | Confirms exactly 5 cards remain in DOM |
| | `Rapid Filter: Exactly one tab maintains active class after rapid switching` | Confirms single active tab invariant |
| | `Rapid Filter: Zero unhandled console errors or exceptions during rapid toggling` | Verifies 0 uncaught JS exceptions |
| | `Rapid Filter: Card order remains consistent after multiple filter cycles` | Confirms card sequence is preserved |
| | `Rapid Filter: Keyboard accessibility (focus ring) remains functional on buttons` | Verifies keyboard focus retention |
| **Esc Key Press** | `Esc Key: Pressing Esc when modal is closed produces 0 errors` | Verifies graceful handling when already closed |
| | `Esc Key: Rapid consecutive Esc key presses close modal cleanly without error` | Verifies robustness under rapid Esc keypresses |
| | `Esc Key: Modal video playback is stopped on Esc dismissal` | Verifies video pause / unload on Esc close |
| | `Esc Key: Page body scroll lock is restored upon modal dismissal` | Confirms scrollability after modal dismissal |
| | `Esc Key: Closing modal does not destroy or duplicate the dialog element` | Confirms dialog singleton invariant |
| **Backdrop Clicks** | `Backdrop Click: Clicking inside dialog content does NOT close the modal` | Verifies inner click does not trigger dismissal |
| | `Backdrop Click: Clicking dialog backdrop dismisses the modal` | Verifies backdrop click dismisses modal |
| | `Backdrop Click: Clicking video controls inside modal does not trigger backdrop close` | Verifies controls interaction isolation |
| | `Backdrop Click: Drag selection starting inside dialog does not dismiss on mouseup` | Verifies drag dismiss false-positive prevention |
| | `Backdrop Click: Mobile touch tap outside dialog dismisses on small viewport` | Verifies mobile outside tap dismiss |
| **Media Resilience** | `Media Resilience: Poster gradient fallback renders on every card` | Verifies gradient fallbacks on cards |
| | `Media Resilience: Zero external Google Drive master links exist in DOM` | Confirms zero external Drive links exist |
| | `Media Resilience: Empty or malformed data-src does not crash page controllers` | Verifies controller resilience against invalid data |
| | `Media Resilience: Director founder portrait includes descriptive alt text` | Verifies screen reader accessibility on portrait |
| | `Media Resilience: Video error events on preview elements do not halt page operation` | Verifies preview error event containment |

### Tier 3: Cross-Feature Interactions
| Interaction | Test Case Name | Objective / Assertion |
|---|---|---|
| **Filter + Modal** | `Cross-Feature: Triggering filter switch while modal is active keeps modal open and playing` | Modal playback is uninterrupted; background updates cleanly |
| **Resize + Video** | `Cross-Feature: Dynamic viewport resize (1280px -> 375px) while modal is open maintains zero overflow` | `scrollWidth <= innerWidth` with active modal during resize |
| | `Cross-Feature: Dynamic viewport expansion (375px -> 1280px) while modal is open keeps dialog centered` | Modal dialog remains centered and contained on expansion |
| **Nav Drawer + Jump** | `Cross-Feature: Mobile menu opens via toggle button` | Mobile hamburger opens navigation drawer |
| | `Cross-Feature: Clicking anchor link in mobile menu jumps and auto-closes menu drawer` | Drawer automatically closes upon section anchor jump |

### Tier 4: Real-World Workload Scenarios
| Scenario | Test Case Name | Workflow Exercised |
|---|---|---|
| **Full Desktop Journey** | `Journey: Full visitor discovery from landing to reel filtering, modal playback, bio, and inquiry` | 11-step journey: Landing -> Hero verification -> Scroll to Reel -> Filter Vertical -> Play Cyra -> Close modal -> Filter Commercial -> Play Veronikka -> Close via Esc -> View Director Bio -> Access Inquiry CTA |
| **Mobile Touch Journey** | `Journey: Mobile visitor touch journey across reels and navigation` | 375px mobile landing -> zero overflow -> tap-to-play reel card in modal theater -> dismiss via touch/Esc |
| **Client Commercial Discovery** | `Journey: Commercial client inspects project metadata and media specs` | Commercial project metadata verification (SC.01, duration, category) and media specs integrity |

---

## 4. Current Test Baseline & Milestone Mapping

Execution of the full test suite against the initial codebase yields:
- **Total Tests**: 70
- **Passing**: 48
- **Failing (Pending Milestone Implementation)**: 22

The 22 failing tests represent the exact features scheduled across the implementation milestones:

| Milestone | Target Defect / Feature | Associated Test Failures |
|---|---|---|
| **M1** | Scaffolding, Design Tokens & Top Nav | `Assets: style.css references assets/topo.png and produces zero asset 404s`<br>`Navigation: Semantic <header> element exists with <nav>`<br>`Navigation: Wordmark/logo link links back to hero/top`<br>`Navigation: Contains section anchor links`<br>`Navigation: Sticky / fixed positioning on page scroll`<br>`Navigation: Mobile hamburger toggle button is accessible` |
| **M2** | Cinematic Hero & Editorial Presentation | Associated HUD text badges / letterbox animation timing |
| **M3** | Portfolio Reel & Native Video Modal | `Reel: Scene numbers SC.01 through SC.05 are assigned and unique across projects`<br>`Filter Bar: Default view displays all 5 projects on initial page load`<br>`Video Modal: Native <dialog id="video-modal"> element exists in DOM`<br>`Video Modal: Clicking a reel card opens the video modal dialog`<br>`Video Modal: Modal video element receives source of selected project`<br>`Backdrop Click: Clicking inside dialog content does NOT close the modal`<br>`Backdrop Click: Clicking video controls inside modal does not trigger backdrop close`<br>`Backdrop Click: Drag selection starting inside dialog does not dismiss on mouseup` |
| **M4** | Studio Bio, Inquiries & Polish | Tier 3 Mobile menu anchor auto-close & Tier 4 full visitor journey inquiry reach |
| **M5** | E2E Suite 100% Pass & Adversarial Hardening | Target: 70 / 70 tests pass (100% pass rate) |
