/**
 * ============================================================================
 * CEDIREKO FILMS — Client Application Controllers
 * Architecture: Object-Oriented JavaScript (ES6+)
 * Milestone: M1 (Navigation, Scaffolding & Design Tokens)
 * ============================================================================
 */

/**
 * HeaderNavController
 * Encapsulates sticky header scroll observation, mobile drawer state machine,
 * ARIA synchronization, inert isolation, and smooth anchor navigation.
 */
class HeaderNavController {
  constructor(options = {}) {
    this.options = Object.assign({
      headerSelector: '.site-header',
      toggleSelector: '#mobile-nav-toggle, .site-header__burger, .menu-toggle',
      closeSelector: '#mobile-nav-close, .mobile-nav__close',
      navSelector: '#mobile-nav, .mobile-nav',
      panelSelector: '.mobile-nav__panel',
      backdropSelector: '.mobile-nav__backdrop',
      linksSelector: '.site-header__nav-link, .mobile-nav__link, .site-nav a, .mobile-nav a',
      scrollThreshold: 80,
      scrolledClass: 'site-header--scrolled',
      openClass: 'is-open',
      bodyLockClass: 'menu-open'
    }, options);

    this.header = document.querySelector(this.options.headerSelector);
    this.toggleBtn = document.querySelector(this.options.toggleSelector);
    this.closeBtn = document.querySelector(this.options.closeSelector);
    this.mobileNav = document.querySelector(this.options.navSelector);
    this.panel = document.querySelector(this.options.panelSelector);
    this.backdrop = document.querySelector(this.options.backdropSelector);
    this.navLinks = document.querySelectorAll(this.options.linksSelector);

    this.isOpen = false;
    this.isTicking = false;

    // Bind event handlers to maintain instance execution context
    this.handleScroll = this.handleScroll.bind(this);
    this.handleToggleClick = this.handleToggleClick.bind(this);
    this.handleCloseClick = this.handleCloseClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleLinkClick = this.handleLinkClick.bind(this);
    this.handleResize = this.handleResize.bind(this);

    this.init();
  }

  /**
   * Initializes event bindings and sets initial state
   */
  init() {
    if (!this.header) return;

    // Initialize toggle button ARIA attributes
    if (this.toggleBtn) {
      this.toggleBtn.setAttribute('aria-expanded', 'false');
      this.toggleBtn.setAttribute('aria-label', 'Open navigation menu');
      this.toggleBtn.addEventListener('click', this.handleToggleClick);
    }

    // Initialize mobile drawer accessibility attributes
    if (this.mobileNav) {
      this.mobileNav.setAttribute('aria-hidden', 'true');
      if ('inert' in HTMLElement.prototype) {
        this.mobileNav.setAttribute('inert', '');
      }
    }

    // Bind dedicated close button inside drawer
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', this.handleCloseClick);
    }

    // Bind backdrop click to dismiss
    if (this.backdrop) {
      this.backdrop.addEventListener('click', this.handleCloseClick);
    }

    // Passive scroll listener for 60/120fps execution
    window.addEventListener('scroll', this.handleScroll, { passive: true });

    // Global document interaction listeners
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('click', this.handleDocumentClick);
    window.addEventListener('resize', this.handleResize, { passive: true });

    // Auto-close drawer on internal link clicks
    this.navLinks.forEach(link => {
      link.addEventListener('click', this.handleLinkClick);
    });

    // Check scroll position immediately on page load / refresh
    this.updateScrollState();
  }

  /**
   * Throttles scroll evaluation using requestAnimationFrame
   */
  handleScroll() {
    if (!this.isTicking) {
      this.isTicking = true;
      window.requestAnimationFrame(() => {
        this.updateScrollState();
        this.isTicking = false;
      });
    }
  }

  /**
   * Synchronizes scrolled class with window scroll position
   */
  updateScrollState() {
    if (!this.header) return;
    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    const shouldBeScrolled = currentScrollY > this.options.scrollThreshold;

    if (this.header.classList.contains(this.options.scrolledClass) !== shouldBeScrolled) {
      this.header.classList.toggle(this.options.scrolledClass, shouldBeScrolled);
    }
  }

  /**
   * Handles toggle button interactions
   */
  handleToggleClick(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.toggleMobileMenu();
  }

  /**
   * Handles explicit close button or backdrop clicks
   */
  handleCloseClick(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.closeMobileMenu();
  }

  /**
   * Inverts drawer state
   */
  toggleMobileMenu() {
    if (this.isOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  /**
   * Returns background elements that must be isolated with inert when drawer is open
   * @returns {HTMLElement[]}
   */
  getBackgroundElements() {
    if (!this.backgroundElements) {
      this.backgroundElements = [
        document.querySelector('.site-header__container'),
        document.getElementById('main-content'),
        document.querySelector('.skip-link'),
        document.querySelector('footer')
      ].filter(Boolean);
    }
    return this.backgroundElements;
  }

  /**
   * Opens drawer, locks scroll, and configures accessibility
   */
  openMobileMenu() {
    if (this.isOpen || !this.mobileNav) return;

    this.isOpen = true;

    if (this.toggleBtn) {
      this.toggleBtn.classList.add('is-active');
      this.toggleBtn.setAttribute('aria-expanded', 'true');
      this.toggleBtn.setAttribute('aria-label', 'Close navigation menu');
    }

    this.mobileNav.classList.add(this.options.openClass);
    this.mobileNav.setAttribute('aria-hidden', 'false');
    if ('inert' in HTMLElement.prototype) {
      this.mobileNav.removeAttribute('inert');
      this.getBackgroundElements().forEach(el => el.setAttribute('inert', ''));
    }

    document.body.classList.add(this.options.bodyLockClass);

    // Direct focus to close button or panel
    if (this.closeBtn) {
      this.closeBtn.focus();
    } else if (this.panel) {
      this.panel.focus();
    }
  }

  /**
   * Closes drawer, releases scroll lock, and restores focus
   */
  closeMobileMenu() {
    if (!this.isOpen) return;

    this.isOpen = false;

    if (this.toggleBtn) {
      this.toggleBtn.classList.remove('is-active');
      this.toggleBtn.setAttribute('aria-expanded', 'false');
      this.toggleBtn.setAttribute('aria-label', 'Open navigation menu');
    }

    if (this.mobileNav) {
      this.mobileNav.classList.remove(this.options.openClass);
      this.mobileNav.setAttribute('aria-hidden', 'true');
      if ('inert' in HTMLElement.prototype) {
        this.mobileNav.setAttribute('inert', '');
        this.getBackgroundElements().forEach(el => el.removeAttribute('inert'));
      }
    }

    document.body.classList.remove(this.options.bodyLockClass);

    // Return focus to toggle button for keyboard navigation continuity
    if (this.toggleBtn) {
      this.toggleBtn.focus();
    }
  }

  /**
   * Captures Escape key to dismiss drawer (WCAG 2.1 AA)
   */
  handleKeyDown(event) {
    if (event.key === 'Escape' && this.isOpen) {
      event.preventDefault();
      this.closeMobileMenu();
    }
  }

  /**
   * Dismisses menu when clicking outside panel and toggle
   */
  handleDocumentClick(event) {
    if (!this.isOpen) return;

    const clickedInsidePanel = this.panel && this.panel.contains(event.target);
    const clickedToggle = this.toggleBtn && this.toggleBtn.contains(event.target);

    if (!clickedInsidePanel && !clickedToggle) {
      this.closeMobileMenu();
    }
  }

  /**
   * Automatically closes drawer upon clicking destination anchors
   */
  handleLinkClick(event) {
    const href = event.currentTarget.getAttribute('href');
    if (href && href.startsWith('#')) {
      if (this.isOpen) {
        this.closeMobileMenu();
      }
    }
  }

  /**
   * Closes mobile drawer if viewport exceeds mobile breakpoint
   */
  handleResize() {
    if (this.isOpen && window.innerWidth >= 768) {
      this.closeMobileMenu();
    }
  }

  /**
   * Cleanly tears down all event listeners and state
   */
  destroy() {
    window.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('click', this.handleDocumentClick);
    window.removeEventListener('resize', this.handleResize);

    if (this.toggleBtn) {
      this.toggleBtn.removeEventListener('click', this.handleToggleClick);
    }
    if (this.closeBtn) {
      this.closeBtn.removeEventListener('click', this.handleCloseClick);
    }
    if (this.backdrop) {
      this.backdrop.removeEventListener('click', this.handleCloseClick);
    }

    this.navLinks.forEach(link => {
      link.removeEventListener('click', this.handleLinkClick);
    });

    if ('inert' in HTMLElement.prototype) {
      this.getBackgroundElements().forEach(el => el.removeAttribute('inert'));
    }

    this.backgroundElements = null;
    document.body.classList.remove(this.options.bodyLockClass);
    this.isOpen = false;
  }
}

/**
 * ReelFilterController
 * Encapsulates multi-format filter bar state, tablist ARIA synchronization,
 * and responsive grid view switching.
 */
class ReelFilterController {
  #grid;
  #buttons;

  constructor(options = {}) {
    this.options = Object.assign({
      gridSelector: '.reel-grid',
      buttonsSelector: '.reel-toggle-btn, .filter-btn',
      activeClass: 'is-active'
    }, options);

    this.#grid = document.querySelector(this.options.gridSelector);
    this.#buttons = document.querySelectorAll(this.options.buttonsSelector);

    this.init();
  }

  init() {
    if (!this.#grid || !this.#buttons.length) return;

    this.#buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.setView(view, btn);
      });
    });
  }

  setView(view, activeBtn) {
    if (!this.#grid) return;
    this.#grid.dataset.view = view;

    this.#buttons.forEach(btn => {
      const isSelected = btn === activeBtn || (!activeBtn && btn.dataset.view === view);
      btn.classList.toggle(this.options.activeClass, isSelected);
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  }
}

/**
 * VideoModalPlayerController
 * Manages native HTML5 <dialog> modal player lifecycle, video buffering,
 * keyboard accessibility, scroll locking, and light dismiss.
 */
class VideoModalPlayerController {
  #dialog;
  #video;
  #title;
  #cat;
  #tc;
  #driveLink;
  #closeBtn;
  #lastActiveElement;
  #mouseDownInside;

  constructor() {
    this.#dialog = document.getElementById('video-modal');
    if (!this.#dialog) return;

    this.#video = this.#dialog.querySelector('video');
    this.#title = this.#dialog.querySelector('#modal-title');
    this.#cat = this.#dialog.querySelector('#modal-cat');
    this.#tc = this.#dialog.querySelector('#modal-tc');
    this.#driveLink = this.#dialog.querySelector('#modal-drive-link');
    this.#closeBtn = this.#dialog.querySelector('.modal-close, button[aria-label*="close" i]');
    this.#lastActiveElement = null;
    this.#mouseDownInside = false;

    this.init();
  }

  init() {
    if (!this.#dialog) return;

    // Close button dismiss
    this.#closeBtn?.addEventListener('click', () => {
      this.close();
    });

    // Native cancel event (e.g. Esc key)
    this.#dialog.addEventListener('cancel', () => {
      this.#cleanupMedia();
    });

    // Explicit Escape key fallback for headless and standard browsers
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.#dialog && this.#dialog.open) {
        this.close();
      }
    });

    // Native close event
    this.#dialog.addEventListener('close', () => {
      this.#cleanupMedia();
    });

    // Backdrop dismissal tracking
    this.#dialog.addEventListener('mousedown', (e) => {
      const rect = this.#dialog.getBoundingClientRect();
      this.#mouseDownInside = (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      );
    });

    this.#dialog.addEventListener('click', (e) => {
      if (e.target === this.#dialog) {
        const rect = this.#dialog.getBoundingClientRect();
        const isClickOutside = (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        );
        // Dismiss only when click is outside AND mousedown did not start inside
        if (isClickOutside && !this.#mouseDownInside) {
          this.close();
        }
      }
      this.#mouseDownInside = false;
    });

    // Stop click events inside modal content from reaching dialog backdrop
    const modalContent = this.#dialog.querySelector('.modal-dialog-content, .modal-inner');
    modalContent?.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  open(card) {
    if (!this.#dialog) return;

    this.#lastActiveElement = document.activeElement;

    const videoEl = card.querySelector('.reel-video, video');
    const src = videoEl?.dataset.src || videoEl?.src || '';
    const title = card.querySelector('.reel-title, h3')?.textContent?.trim() || 'FEATURED WORK';
    const cat = card.querySelector('.reel-cat')?.textContent?.trim() || 'COMMERCIAL';
    const tc = card.querySelector('.reel-tc span:last-child')?.textContent?.trim() || '00:00';
    const driveUrl = card.dataset.driveUrl || '#';

    if (this.#title) this.#title.textContent = title;
    if (this.#cat) this.#cat.textContent = cat;
    if (this.#tc) this.#tc.textContent = tc;
    if (this.#driveLink) {
      this.#driveLink.href = driveUrl;
      this.#driveLink.setAttribute('data-drive-url', driveUrl);
    }

    if (this.#video && src) {
      this.#video.src = src;
      this.#video.load();
      this.#video.play().catch(() => {});
    }

    document.body.style.overflow = 'hidden';

    if (typeof this.#dialog.showModal === 'function') {
      this.#dialog.showModal();
    } else {
      this.#dialog.setAttribute('open', '');
    }

    this.#closeBtn?.focus();
  }

  close() {
    if (!this.#dialog || !this.#dialog.open) return;

    if (typeof this.#dialog.close === 'function') {
      this.#dialog.close();
    } else {
      this.#dialog.removeAttribute('open');
    }

    this.#cleanupMedia();
  }

  #cleanupMedia() {
    if (this.#video) {
      this.#video.pause();
      this.#video.removeAttribute('src');
      this.#video.load();
    }

    document.body.style.overflow = '';

    if (this.#lastActiveElement && typeof this.#lastActiveElement.focus === 'function') {
      this.#lastActiveElement.focus();
    }
    this.#lastActiveElement = null;
  }
}

/**
 * MediaPreviewController
 * Handles viewport lazy-loading and desktop hover preview playback.
 */
class MediaPreviewController {
  #cards;
  #videoModal;
  #observer;

  constructor(videoModal) {
    this.#cards = document.querySelectorAll('.reel-card');
    this.#videoModal = videoModal;

    this.init();
  }

  init() {
    if (!this.#cards.length) return;

    this.#observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const video = entry.target;
          const src = video.dataset.src;
          if (src && !video.src) {
            video.preload = 'auto';
            video.src = src;
            video.classList.add('has-src');
          }
          this.#observer.unobserve(video);
        }
      });
    }, {
      threshold: 0,
      rootMargin: '400px 0px 400px 0px'
    });

    this.#cards.forEach(card => {
      const video = card.querySelector('.reel-video');
      const dataSrc = video?.dataset.src;

      if (video && dataSrc) {
        this.#observer.observe(video);

        card.addEventListener('mouseenter', () => {
          video.play().catch(() => {});
        });
        card.addEventListener('mouseleave', () => {
          video.pause();
          setTimeout(() => { video.currentTime = 0; }, 500);
        });
      }

      card.addEventListener('click', (e) => {
        e.preventDefault();
        this.#videoModal?.open(card);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.#videoModal?.open(card);
        }
      });
    });
  }
}

/**
 * PortfolioApp
 * Global coordinator and entry point initialized on DOMContentLoaded.
 */
class PortfolioApp {
  constructor() {
    this.headerNav = null;
    this.reelFilter = null;
    this.videoModal = null;
    this.mediaPreview = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;

    this.headerNav = new HeaderNavController();
    this.reelFilter = new ReelFilterController();
    this.videoModal = new VideoModalPlayerController();
    this.mediaPreview = new MediaPreviewController(this.videoModal);

    this.isInitialized = true;
  }
}

// Self-bootstrapping entry point
const bootstrapApp = () => {
  const app = new PortfolioApp();
  app.init();
  window.__cedirekoApp = app;
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}

// ---------- Hero load-in (Resilient Multi-Event Trigger) ----------
const revealHero = () => {
  const hero = document.getElementById('hero');
  if (hero && !hero.classList.contains('revealed')) {
    hero.classList.add('revealed');
  }
};

if (document.readyState === 'complete') {
  revealHero();
} else {
  window.addEventListener('load', revealHero);
  // Guarantee hero reveals smoothly within 250ms even if external media delays 'load'
  setTimeout(revealHero, 250);
}

// ---------- Uniform scroll-reveal for every section ----------
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.18,
  rootMargin: '0px 0px -8% 0px'
});

document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => {
  revealObserver.observe(el);
});