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

    this.#buttons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.setView(view, btn);
      });

      // Keyboard arrow navigation across tablist (WAI-ARIA compliance)
      btn.addEventListener('keydown', (e) => {
        let targetIndex = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          targetIndex = (index + 1) % this.#buttons.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          targetIndex = (index - 1 + this.#buttons.length) % this.#buttons.length;
        } else if (e.key === 'Home') {
          targetIndex = 0;
        } else if (e.key === 'End') {
          targetIndex = this.#buttons.length - 1;
        }

        if (targetIndex >= 0) {
          e.preventDefault();
          const targetBtn = this.#buttons[targetIndex];
          targetBtn.focus();
          this.setView(targetBtn.dataset.view, targetBtn);
        }
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
 * sequential transport navigation (prev/next), keyboard accessibility,
 * scroll locking, and light dismiss.
 */
class VideoModalPlayerController {
  #dialog;
  #video;
  #title;
  #cat;
  #tc;
  #scene;
  #closeBtn;
  #prevBtn;
  #nextBtn;
  #cards;
  #currentIndex;
  #lastActiveElement;
  #mouseDownInside;

  constructor() {
    this.#dialog = document.getElementById('video-modal');
    if (!this.#dialog) return;

    this.#video = this.#dialog.querySelector('video');
    this.#title = this.#dialog.querySelector('#modal-title');
    this.#cat = this.#dialog.querySelector('#modal-cat');
    this.#tc = this.#dialog.querySelector('#modal-tc');
    this.#scene = this.#dialog.querySelector('#modal-scene');
    this.#closeBtn = this.#dialog.querySelector('.modal-close, button[aria-label*="close" i]');
    this.#prevBtn = this.#dialog.querySelector('#modal-prev-btn, .modal-prev');
    this.#nextBtn = this.#dialog.querySelector('#modal-next-btn, .modal-next');

    this.#cards = Array.from(document.querySelectorAll('.reel-card'));
    this.#currentIndex = -1;
    this.#lastActiveElement = null;
    this.#mouseDownInside = false;

    this.navigate = this.navigate.bind(this);

    this.init();
  }

  init() {
    if (!this.#dialog) return;

    // Close button dismiss
    this.#closeBtn?.addEventListener('click', () => {
      this.close();
    });

    // Transport buttons: previous / next project
    this.#prevBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.navigate(-1);
    });

    this.#nextBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.navigate(1);
    });

    // Native cancel event (e.g. Esc key)
    this.#dialog.addEventListener('cancel', () => {
      this.#cleanupMedia();
    });

    // Keyboard controls when modal is active: Escape, ArrowLeft, ArrowRight
    document.addEventListener('keydown', (e) => {
      if (!this.#dialog || !this.#dialog.open) return;

      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.navigate(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.navigate(1);
      }
    });

    // Modal keyboard focus trap (WCAG 2.1 AA dialog pattern)
    this.#dialog.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !this.#dialog.open) return;
      const focusables = Array.from(
        this.#dialog.querySelectorAll('button, [href], input, select, textarea, video, [tabindex]:not([tabindex="-1"])')
      ).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);

      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
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

  /**
   * Navigates sequentially across the reel items
   * @param {number} delta - (-1 for previous, +1 for next)
   */
  navigate(delta) {
    if (!this.#cards.length || this.#currentIndex < 0) return;
    const total = this.#cards.length;
    const nextIndex = (this.#currentIndex + delta + total) % total;
    this.open(this.#cards[nextIndex]);
  }

  open(cardOrIndex) {
    if (!this.#dialog) return;

    if (!this.#cards.length) {
      this.#cards = Array.from(document.querySelectorAll('.reel-card'));
    }

    let card;
    if (typeof cardOrIndex === 'number') {
      this.#currentIndex = (cardOrIndex + this.#cards.length) % this.#cards.length;
      card = this.#cards[this.#currentIndex];
    } else {
      card = cardOrIndex;
      this.#currentIndex = this.#cards.indexOf(card);
    }

    if (!card) return;

    if (!this.#dialog.open) {
      this.#lastActiveElement = document.activeElement;
    }

    const videoEl = card.querySelector('.reel-video, video');
    const src = videoEl?.dataset.src || videoEl?.src || '';
    const title = card.querySelector('.reel-title, h3')?.textContent?.trim() || 'FEATURED WORK';
    const cat = card.querySelector('.reel-cat')?.textContent?.trim() || 'COMMERCIAL';
    const tc = card.querySelector('.reel-tc span:last-child')?.textContent?.trim() || '00:00';
    const scene = card.dataset.scene || card.querySelector('.reel-scene')?.textContent?.trim() || `SC.0${this.#currentIndex + 1}`;

    if (this.#title) this.#title.textContent = title;
    if (this.#cat) this.#cat.textContent = cat;
    if (this.#tc) this.#tc.textContent = tc;
    if (this.#scene) this.#scene.textContent = scene;

    // Structured metadata synchronization
    const specsContainer = this.#dialog.querySelector('#modal-specs');
    if (specsContainer) {
      specsContainer.innerHTML = '';
      const details = card.querySelectorAll('.reel-detail');
      details.forEach(detail => {
        const span = document.createElement('span');
        span.className = 'modal-spec-item';
        span.innerHTML = detail.innerHTML;
        specsContainer.appendChild(span);
      });
    }

    if (this.#video && src) {
      this.#video.src = src;
      const poster = card.querySelector('.reel-video')?.getAttribute('poster');
      if (poster) {
        this.#video.setAttribute('poster', poster);
      } else {
        this.#video.removeAttribute('poster');
      }
      this.#video.load();
      this.#video.play().catch(() => {});
    }

    document.body.style.overflow = 'hidden';

    if (!this.#dialog.open) {
      if (typeof this.#dialog.showModal === 'function') {
        this.#dialog.showModal();
      } else {
        this.#dialog.setAttribute('open', '');
      }
      this.#closeBtn?.focus();
    }
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
    this.#currentIndex = -1;
  }
}

/**
 * MediaPreviewController
 * Handles viewport lazy-loading and desktop hover preview playback.
 * Enforces single-video active playback across all preview cards.
 */
class MediaPreviewController {
  #cards;
  #videoModal;
  #observer;
  #currentlyPlaying;

  constructor(videoModal) {
    this.#cards = document.querySelectorAll('.reel-card');
    this.#videoModal = videoModal;
    this.#currentlyPlaying = null;

    this.init();
  }

  #pauseCurrent() {
    if (this.#currentlyPlaying && !this.#currentlyPlaying.paused) {
      const card = this.#currentlyPlaying.closest('.reel-card');
      const seekTime = parseFloat(card?.dataset.seekTime || '1.0');
      this.#currentlyPlaying.pause();
      this.#currentlyPlaying.currentTime = seekTime;
      this.#currentlyPlaying = null;
    }
  }

  init() {
    if (!this.#cards.length) return;

    this.#observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const video = entry.target;
          const card = video.closest('.reel-card');
          const src = video.dataset.src;
          if (src && !video.src) {
            video.preload = 'metadata';
            video.src = src;
            video.classList.add('has-src');
            const seekTime = parseFloat(card?.dataset.seekTime || '1.0');
            video.addEventListener('loadedmetadata', () => {
              if (video.currentTime === 0) {
                video.currentTime = seekTime;
              }
            }, { once: true });
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
          if (this.#currentlyPlaying && this.#currentlyPlaying !== video) {
            this.#pauseCurrent();
          }
          this.#currentlyPlaying = video;
          video.play().catch(() => {});
        });

        card.addEventListener('mouseleave', () => {
          video.pause();
          if (this.#currentlyPlaying === video) {
            this.#currentlyPlaying = null;
          }
          const seekTime = parseFloat(card.dataset.seekTime || '1.0');
          setTimeout(() => { video.currentTime = seekTime; }, 200);
        });
      }

      card.addEventListener('click', (e) => {
        e.preventDefault();
        this.#pauseCurrent();
        this.#videoModal?.open(card);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.#pauseCurrent();
          this.#videoModal?.open(card);
        }
      });
    });
  }
}

/**
 * CustomPlayCursorController
 * Manages floating desktop custom "PLAY" badge cursor for reel video cards.
 * Automatically disabled on touch / non-hover viewports.
 */
class CustomPlayCursorController {
  #cursor;
  #cards;
  #isActive;
  #targetX;
  #targetY;
  #rafId;

  constructor(options = {}) {
    this.options = Object.assign({
      cursorSelector: '#custom-play-cursor, .custom-play-cursor',
      cardsSelector: '.reel-card',
      activeClass: 'is-active'
    }, options);

    this.#cursor = document.querySelector(this.options.cursorSelector);
    this.#cards = document.querySelectorAll(this.options.cardsSelector);
    this.#isActive = false;
    this.#targetX = 0;
    this.#targetY = 0;
    this.#rafId = null;

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleCardEnter = this.handleCardEnter.bind(this);
    this.handleCardLeave = this.handleCardLeave.bind(this);
    this.render = this.render.bind(this);

    this.init();
  }

  init() {
    if (!this.#cursor || !this.#cards.length) return;

    // Check if device supports fine hover pointer
    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!supportsHover) return;

    document.addEventListener('mousemove', this.handleMouseMove, { passive: true });

    this.#cards.forEach(card => {
      card.addEventListener('mouseenter', this.handleCardEnter);
      card.addEventListener('mouseleave', this.handleCardLeave);
    });
  }

  handleMouseMove(e) {
    this.#targetX = e.clientX;
    this.#targetY = e.clientY;

    if (!this.#rafId) {
      this.#rafId = window.requestAnimationFrame(this.render);
    }
  }

  render() {
    if (this.#cursor) {
      this.#cursor.style.transform = `translate3d(${this.#targetX}px, ${this.#targetY}px, 0) translate(-50%, -50%) ${this.#isActive ? 'scale(1)' : 'scale(0.3)'}`;
    }
    this.#rafId = null;
  }

  handleCardEnter() {
    this.#isActive = true;
    this.#cursor?.classList.add(this.options.activeClass);
  }

  handleCardLeave() {
    this.#isActive = false;
    this.#cursor?.classList.remove(this.options.activeClass);
  }

  destroy() {
    document.removeEventListener('mousemove', this.handleMouseMove);
    this.#cards.forEach(card => {
      card.removeEventListener('mouseenter', this.handleCardEnter);
      card.removeEventListener('mouseleave', this.handleCardLeave);
    });
    if (this.#rafId) {
      window.cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
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
    this.customCursor = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;

    this.headerNav = new HeaderNavController();
    this.reelFilter = new ReelFilterController();
    this.videoModal = new VideoModalPlayerController();
    this.mediaPreview = new MediaPreviewController(this.videoModal);
    this.customCursor = new CustomPlayCursorController();

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