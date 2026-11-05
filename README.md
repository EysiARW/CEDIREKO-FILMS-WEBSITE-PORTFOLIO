# CEDIREKO FILMS — Videography Portfolio (2026)

[![Vanilla Web](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20ES6+-wine?style=flat-square)](https://github.com/EysiARW/CEDIREKO-FILMS-WEBSITE-PORTFOLIO)
[![Accessibility](https://img.shields.io/badge/WCAG%202.1-AA%20Compliant-ember?style=flat-square)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Tests](https://img.shields.io/badge/Tests-70%20Passing-success?style=flat-square)](tests/)
[![GitHub Pages](https://img.shields.io/badge/Host-GitHub%20Pages-black?style=flat-square&logo=github)](https://eysiarw.github.io/CEDIREKO-FILMS-WEBSITE-PORTFOLIO/)

Official videography portfolio for **CEDIREKO Films**, an independent filmmaking practice based in Manila, Philippines. Focused on commercial brand campaigns, live music performance films, and vertical editorial fashion narratives crafted with patient framing, honest available light, and quiet human intimacy.

---

## 📽️ Showcase Projects

| Scene | Title | Category | Format | Ratio | Source |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SC.01` | **VERONIKKA REBRANDING** | Advertisement | Film / Landscape | 16:10 | Commercial campaign |
| `SC.02` | **EA PERFORMANCE** | Music Video | Film / Landscape | 16:10 | Live music performance |
| `SC.03` | **FICO MANA — Cyra** | Vertical Series (01) | Vertical Reel | 9:16 | Editorial fashion narrative |
| `SC.04` | **FICO MANA — Breanna** | Vertical Series (02) | Vertical Reel | 9:16 | Editorial fashion narrative |
| `SC.05` | **FICO MANA — Leigh** | Vertical Series (03) | Vertical Reel | 9:16 | Editorial fashion narrative |

---

## 🏛️ Architectural Principles

* **Zero Dependencies**: Pure HTML5, CSS3 Custom Properties (Design Tokens), and Object-Oriented ES6+ JavaScript. No build step, bundlers, or heavy external frameworks.
* **Cinematic Identity**: Atmospheric burgundy color palette (`--void`, `--wine`, `--bone`, `--ember`), Fraunces serif display typography, and ARRI/RED camera monitor telemetry aesthetics.
* **Intelligent Video Thumbnail Engine**: Pre-rendered, web-optimized JPEG poster frames extracted at non-black footage timestamps (`assets/posters/`) combined with metadata seek queuing to eliminate black preview screens.
* **Accessible by Design**: WCAG 2.1 AA compliant with contrast ratios up to 16:1, visible focus states, full keyboard navigation (including WAI-ARIA tablist arrow keys and modal focus trapping), and `prefers-reduced-motion` compliance.
* **Pure Portfolio Focus**: No transaction funnels, booking widgets, or inquiry forms. Concludes with a curated Instagram archive link and a quiet footer contact line.

---

## 📂 Repository Structure

```text
CEDIREKO-FILMS-WEBSITE-PORTFOLIO/
├── index.html              # Semantic single-page portfolio layout
├── style.css               # 3-tier design tokens, responsive grid, and typography
├── script.js               # Modular OOP controllers (Header, Filter, Modal, Previews)
├── README.md               # Architecture, project catalog, and verification guide
├── TEST_INFRA.md           # Automated test harness documentation
├── TEST_READY.md           # Production readiness and verification notes
├── .gitignore              # macOS artifacts and temporary agent state exclusions
│
├── assets/                 # Ambient assets and imagery
│   ├── CEDIREKO PNG.png    # Studio wordmark and badge logo mark
│   ├── IMG_9987.jpeg       # Director founder portrait (3:4 ratio)
│   ├── topo.png            # Seamless ambient topographic background tile
│   └── posters/            # Lightweight video poster frames (zero black thumbnails)
│       ├── veronikka.jpg
│       ├── ea.jpg
│       ├── ficomana_cyra.jpg
│       ├── ficomana_breanna.jpg
│       └── ficomana_leigh.jpg
│
├── projects/               # Authentic 1080p/4K master portfolio video files
│   ├── VERONIKKA_REVISED_3.mp4
│   ├── EA_FINALCUT.mp4
│   ├── FICOMANA_CYRA_2_1.mp4
│   ├── BREANNA_1.mp4
│   └── FICOMANA_LEIGH.mp4
│
└── tests/                  # Headless Chrome DevTools Protocol (CDP) test suite
    ├── run_tests.js        # Test runner and CLI entry point
    ├── tier1_feature_coverage.test.js
    ├── tier2_boundary_corner.test.js
    ├── tier3_cross_feature.test.js
    ├── tier4_real_world_journey.test.js
    ├── m1_empirical_stress.test.js
    └── helpers/            # HTTP server, CDP browser driver, and contracts
```

---

## 🧪 Automated Test Suite

The project includes an in-repo automated test harness that spins up a local HTTP server and attaches to a headless Chrome instance via Chrome DevTools Protocol (CDP) to verify layout, contrast, accessibility, boundary cases, and full visitor journeys.

### Run All Tests

```bash
node tests/run_tests.js
```

### Test Tiers Covered

* **Tier 1: Feature Coverage (37/37 passed)**: Hero letterboxing, camera HUD indicators, scroll cues, CLS-prevented card aspect ratios, filter tablist ARIA sync, native `<dialog>` video modal lifecycle, typography, and WCAG AA contrast.
* **Tier 2: Boundary & Corner Cases (25/25 passed)**: Zero horizontal overflow across viewports (320px, 375px, 768px, 1280px, 1920px), rapid 10x filter switching, rapid consecutive Escape dismissals, dialog backdrop clicks, and media resilience.
* **Tier 3: Cross-Feature Interactions (5/5 passed)**: Filter changes while modal is active, dynamic viewport resizing during playback, and mobile drawer jump-navigation.
* **Tier 4: Real-World Scenarios (3/3 passed)**: Full desktop visitor discovery journey, mobile touch discovery journey, and commercial client master file inspection.

---

## 🎨 Design Tokens

Defined in [`style.css`](style.css) via `:root`:

| Token | Value | Semantic Role |
| :--- | :--- | :--- |
| `--void` | `#3C0008` | Primary page canvas background |
| `--wine` | `#4C0F19` | Surface cards & hover states |
| `--wine-deep` | `#2A0509` | Elevated containers & modal background |
| `--frame` | `#180307` | Letterbox bars & footer background |
| `--bone` | `#F4E9DE` | Primary display & heading typography |
| `--bone-dim` | `#D9C6BA` | Secondary prose & timecode text |
| `--ash-rose` | `#B08187` | Subtle meta captions & muted labels |
| `--ember` | `#CDA05A` | Interactive accent, badges & focus indicators |

---

## 📜 Motto

> *"Maging mabait lang palagi."*  
> *"Always just be kind."*

&copy; 2026 CEDIREKO FILMS. All Rights Reserved.
