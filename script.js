/**
 * NOIR — Continuous Multi-Layer Horizontal Parallax Showcase Controller
 * Matches the smooth horizontal editorial transitions, negative-direction brand flow,
 * layered image/typography depth glide, and interactive macro/360° behaviors.
 */
(function () {
  'use strict';

  const SLIDE_COUNT = 4;

  const viewport = document.getElementById('viewport');
  const track = document.getElementById('track');
  const homeLeft = document.querySelector('.home-left');
  const homeBrandBlock = document.getElementById('homeBrandBlock');
  const footerContrastBlock = document.querySelector('.footer-contrast-block');

  const paginationDots = document.getElementById('paginationDots');
  const dots = Array.from(document.querySelectorAll('.dot'));
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const findYoursBtn = document.getElementById('findYoursBtn');

  const showcaseSlides = Array.from(document.querySelectorAll('.slide-showcase')).map((el) => ({
    index: Number(el.dataset.slide),
    el,
    pieceCol: el.querySelector('.showcase-piece-col'),
    titleCol: el.querySelector('.showcase-title-col'),
    modelCol: el.querySelector('.showcase-model-col')
  }));

  const modelStages = Array.from(document.querySelectorAll('.model-stage'));
  const viewPills = Array.from(document.querySelectorAll('.view-pill'));

  const bespokeOverlay = document.getElementById('bespokeOverlay');
  const whoOverlay = document.getElementById('whoOverlay');
  const legalOverlay = document.getElementById('legalOverlay');
  const legalEyebrow = document.getElementById('legalEyebrow');
  const legalTitle = document.getElementById('legalTitle');
  const legalBody = document.getElementById('legalBody');
  const bespokeRingFrame = document.getElementById('bespokeRingFrame');
  const bespokeModeBtns = Array.from(document.querySelectorAll('.bespoke-mode-btn'));

  const guildForm = document.getElementById('guildForm');
  const guildEmail = document.getElementById('guildEmail');
  const guildFeedback = document.getElementById('guildFeedback');

  let vw = window.innerWidth;
  let maxScroll = (SLIDE_COUNT - 1) * vw;
  let currentX = 0;
  let targetX = 0;
  let activeSlide = 0;
  let settleTimer = null;

  // Touch drag state
  let touchStartX = 0;
  let touchStartY = 0;
  let touchLastX = 0;
  let isTouching = false;
  let pointerHovering3D = false;

  // Mount interactive WebGL 3D jewelry pieces
  const turntables = {};
  if (window.NoirJewelry3D) {
    turntables[1] = window.NoirJewelry3D.mount(document.getElementById('canvasBracelet'), 'bracelet');
    turntables[2] = window.NoirJewelry3D.mount(document.getElementById('canvasPearl'), 'pearl');
    turntables.ring = window.NoirJewelry3D.mount(document.getElementById('canvasCushionRing'), 'cushionRing');
  }

  document.querySelectorAll('.floating-piece-wrap, .bespoke-ring-frame').forEach((wrap) => {
    wrap.addEventListener('pointerdown', () => { pointerHovering3D = true; });
    window.addEventListener('pointerup', () => { pointerHovering3D = false; });
  });

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function anyOverlayOpen() {
    return (
      bespokeOverlay.classList.contains('is-open') ||
      whoOverlay.classList.contains('is-open') ||
      legalOverlay.classList.contains('is-open')
    );
  }

  function closeAllOverlays() {
    [bespokeOverlay, whoOverlay, legalOverlay].forEach((ov) => {
      ov.classList.remove('is-open');
      ov.setAttribute('aria-hidden', 'true');
    });
    navLinks.forEach((btn) => {
      if (btn.dataset.nav !== 'collection') {
        btn.classList.remove('is-active');
      }
    });
  }

  function openOverlay(overlay, navName) {
    closeAllOverlays();
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    if (navName) {
      navLinks.forEach((btn) => {
        btn.classList.toggle('is-active', btn.dataset.nav === navName);
      });
    }
    if (overlay === bespokeOverlay && window.NoirJewelry3D) {
      requestAnimationFrame(() => window.NoirJewelry3D.resizeAll());
    }
  }

  function goToSlide(index) {
    const clamped = clamp(index, 0, SLIDE_COUNT - 1);
    clearTimeout(settleTimer);
    targetX = clamped * vw;
    updateActiveIndicators(clamped);
  }

  // Gentle edge-alignment only when resting close to a slide boundary, preserving fluid mid-transition glide
  function scheduleGentleEdgeAlign() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      const progress = vw > 0 ? targetX / vw : 0;
      const nearest = Math.round(progress);
      if (Math.abs(progress - nearest) < 0.12) {
        targetX = clamp(nearest, 0, SLIDE_COUNT - 1) * vw;
      }
    }, 320);
  }

  function updateActiveIndicators(slideIdx) {
    activeSlide = slideIdx;
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === slideIdx);
    });
    if (!anyOverlayOpen()) {
      navLinks.forEach((btn) => {
        btn.classList.toggle('is-active', btn.dataset.nav === 'collection' && (slideIdx === 1 || slideIdx === 2));
      });
    }
  }

  /**
   * Multi-layer editorial horizontal parallax engine:
   * - Smooth 60fps velvet inertia (lerp = 0.068)
   * - Slide 1: NOIR flows faster in the negative (-X) direction ahead of the portrait
   * - Slides 2 & 3: Piece, stacked serif title, and model glide at distinct depth velocities
   * - Slide 4: Closing soft contrast footer block settles seamlessly into place
   */
  function animateScroll() {
    const diff = targetX - currentX;
    if (Math.abs(diff) > 0.08) {
      currentX += diff * 0.068;
    } else {
      currentX = targetX;
    }

    track.style.transform = `translate3d(${-currentX}px, 0, 0)`;

    const progress = vw > 0 ? currentX / vw : 0;
    const isDesktop = vw > 820;

    // Slide 1 Parallax: Portrait drifts softly while NOIR brand wordmark flows away smoothly in negative direction
    if (homeLeft) {
      const p0 = clamp(progress, 0, 1.4);
      if (isDesktop) {
        homeLeft.style.transform = `translate3d(${p0 * 9}vw, 0, 0)`;
        homeLeft.style.opacity = clamp(1 - p0 * 0.88, 0.12, 1).toFixed(3);
      } else {
        homeLeft.style.transform = '';
        homeLeft.style.opacity = '1';
      }
    }

    if (homeBrandBlock) {
      const p0 = clamp(progress, 0, 1.4);
      const negativeFlowVw = -p0 * 36;
      const scaleVal = 1 - clamp(p0, 0, 1) * 0.045;
      homeBrandBlock.style.transform = `translate3d(${negativeFlowVw}vw, 0, 0) scale(${scaleVal.toFixed(4)})`;
      homeBrandBlock.style.opacity = clamp(1 - p0 * 1.16, 0, 1).toFixed(3);
    }

    // Slides 2 & 3 Multi-Layer Depth Parallax (matches reference videos 1 & 2)
    for (const s of showcaseSlides) {
      const offset = clamp(progress - s.index, -1.5, 1.5);
      const absOff = Math.abs(offset);

      if (turntables[s.index]) {
        turntables[s.index].scrollOffset = offset;
      }

      if (isDesktop) {
        if (s.pieceCol) {
          const px = -offset * 7.5;
          const sc = 1 - Math.min(absOff, 1) * 0.08;
          s.pieceCol.style.transform = `translate3d(${px}vw, 0, 0) scale(${sc.toFixed(4)})`;
          s.pieceCol.style.opacity = clamp(1 - absOff * 0.85, 0.05, 1).toFixed(3);
        }
        if (s.titleCol) {
          // Center title glides at serene background anchor velocity while piece & portrait sweep smoothly
          const tx = -offset * 1.5;
          s.titleCol.style.transform = `translate3d(${tx}vw, 0, 0)`;
          s.titleCol.style.opacity = clamp(1 - absOff * 0.92, 0.05, 1).toFixed(3);
        }
        if (s.modelCol) {
          const mx = -offset * 14;
          const msc = 1 - Math.min(absOff, 1) * 0.04;
          s.modelCol.style.transform = `translate3d(${mx}vw, 0, 0) scale(${msc.toFixed(4)})`;
          s.modelCol.style.opacity = clamp(1 - absOff * 0.78, 0.08, 1).toFixed(3);
        }
      } else {
        if (s.pieceCol) { s.pieceCol.style.transform = ''; s.pieceCol.style.opacity = '1'; }
        if (s.titleCol) { s.titleCol.style.transform = ''; s.titleCol.style.opacity = '1'; }
        if (s.modelCol) { s.modelCol.style.transform = ''; s.modelCol.style.opacity = '1'; }
      }
    }

    // Slide 4 Footer Soft Contrast Block smooth horizontal glide-in
    if (footerContrastBlock) {
      const p3 = clamp(progress - 3, -1.4, 0.2);
      if (isDesktop) {
        footerContrastBlock.style.transform = `translate3d(${-p3 * 8}vw, 0, 0)`;
        footerContrastBlock.style.opacity = clamp(1 - Math.abs(p3) * 0.65, 0.2, 1).toFixed(3);
      } else {
        footerContrastBlock.style.transform = '';
        footerContrastBlock.style.opacity = '1';
      }
    }

    const nearestSlide = clamp(Math.round(progress), 0, SLIDE_COUNT - 1);
    if (nearestSlide !== activeSlide) {
      updateActiveIndicators(nearestSlide);
    }

    // Adapt 4 minimal bottom dots cleanly over Slide 4's dark bottom bar
    paginationDots.classList.toggle('is-on-dark', progress > 2.52);

    requestAnimationFrame(animateScroll);
  }
  requestAnimationFrame(animateScroll);

  // Smooth continuous wheel & trackpad horizontal scroll
  window.addEventListener(
    'wheel',
    (e) => {
      if (anyOverlayOpen()) return;
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      targetX = clamp(targetX + delta * 1.18, 0, maxScroll);
      scheduleGentleEdgeAlign();
    },
    { passive: false }
  );

  // Touch swipe navigation
  viewport.addEventListener(
    'touchstart',
    (e) => {
      if (anyOverlayOpen() || pointerHovering3D || e.touches.length !== 1) return;
      isTouching = true;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchLastX = touchStartX;
      clearTimeout(settleTimer);
    },
    { passive: true }
  );

  viewport.addEventListener(
    'touchmove',
    (e) => {
      if (!isTouching || anyOverlayOpen() || pointerHovering3D) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      const dx = touchLastX - x;
      const totalDx = Math.abs(x - touchStartX);
      const totalDy = Math.abs(y - touchStartY);
      if (totalDx > totalDy * 0.8) {
        e.preventDefault();
        targetX = clamp(targetX + dx * 1.35, 0, maxScroll);
      }
      touchLastX = x;
    },
    { passive: false }
  );

  viewport.addEventListener('touchend', () => {
    if (!isTouching) return;
    isTouching = false;
    const nearest = Math.round(targetX / vw);
    targetX = clamp(nearest, 0, SLIDE_COUNT - 1) * vw;
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (anyOverlayOpen()) {
        closeAllOverlays();
        return;
      }
      modelStages.forEach((s) => s.classList.remove('is-macro'));
      return;
    }

    if (anyOverlayOpen() || document.activeElement === guildEmail) return;

    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      goToSlide(activeSlide + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      goToSlide(activeSlide - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      goToSlide(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goToSlide(SLIDE_COUNT - 1);
    }
  });

  // Resize handling
  window.addEventListener('resize', () => {
    const prevVw = vw || window.innerWidth;
    const prevProgress = prevVw > 0 ? currentX / prevVw : activeSlide;
    vw = window.innerWidth;
    maxScroll = (SLIDE_COUNT - 1) * vw;
    const snapped = Math.abs(prevProgress - Math.round(prevProgress)) < 0.15 ? Math.round(prevProgress) : prevProgress;
    targetX = clamp(snapped * vw, 0, maxScroll);
    currentX = targetX;
    track.style.transform = `translate3d(${-currentX}px, 0, 0)`;
    if (window.NoirJewelry3D) window.NoirJewelry3D.resizeAll();
  });

  // Four minimal bottom dot clicks
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      closeAllOverlays();
      goToSlide(Number(dot.dataset.index));
    });
  });

  // Home "FIND YOURS ->" click
  if (findYoursBtn) {
    findYoursBtn.addEventListener('click', () => goToSlide(1));
  }

  // Top-right horizontal nav actions
  navLinks.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.nav;
      if (target === 'collection') {
        closeAllOverlays();
        goToSlide(1);
      } else if (target === 'bespoke') {
        openOverlay(bespokeOverlay, 'bespoke');
      } else if (target === 'who') {
        openOverlay(whoOverlay, 'who');
      }
    });
  });

  // Overlay close buttons & cross-navigation
  document.querySelectorAll('[data-close-overlay]').forEach((btn) => {
    btn.addEventListener('click', closeAllOverlays);
  });

  const bespokeToGuild = document.getElementById('bespokeToGuild');
  if (bespokeToGuild) {
    bespokeToGuild.addEventListener('click', () => {
      closeAllOverlays();
      goToSlide(3);
      setTimeout(() => guildEmail?.focus(), 750);
    });
  }

  const whoToCollection = document.getElementById('whoToCollection');
  if (whoToCollection) {
    whoToCollection.addEventListener('click', () => {
      closeAllOverlays();
      goToSlide(1);
    });
  }

  // Bespoke ring mode switcher (Page 11 Macro Photograph <-> 360° 3D Inspection)
  bespokeModeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const is3D = btn.dataset.ringView === '3d';
      bespokeModeBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
      bespokeRingFrame.classList.toggle('is-3d', is3D);
      if (is3D && window.NoirJewelry3D) {
        requestAnimationFrame(() => window.NoirJewelry3D.resizeAll());
      }
    });
  });

  // Click any model image to smoothly zoom in showing jewelry at macro angle (Page 8)
  modelStages.forEach((stage) => {
    const baseImg = stage.querySelector('.model-img--base');
    const origin = stage.dataset.origin || '50% 40%';
    if (baseImg) {
      baseImg.style.transformOrigin = origin;
    }

    const toggleMacro = () => {
      stage.classList.toggle('is-macro');
    };

    stage.addEventListener('click', toggleMacro);
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMacro();
      }
    });
  });

  // Portrait / Signature Ring right-column view toggle (Page 6 & Page 11)
  viewPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const slideIdx = pill.dataset.slideTarget;
      const mode = pill.dataset.mode;
      const slideEl = document.querySelector(`.slide[data-slide="${slideIdx}"]`);
      if (!slideEl) return;

      const siblings = slideEl.querySelectorAll('.view-pill');
      siblings.forEach((s) => s.classList.toggle('is-active', s === pill));

      const showRing = mode === 'macro-ring';
      slideEl.classList.toggle('is-alt-ring', showRing);
      if (showRing) {
        slideEl.querySelector('.model-stage')?.classList.remove('is-macro');
      }
    });
  });

  // Join the Guild form submission
  if (guildForm) {
    guildForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = guildEmail.value.trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (!emailOk) {
        guildFeedback.textContent = 'Please enter a valid email address.';
        guildEmail.focus();
        return;
      }
      guildFeedback.textContent = 'Invitation registered — your private Guild dossier awaits.';
      guildEmail.value = '';
    });
  }

  // Legal sheets
  const legalCopy = {
    terms: {
      eyebrow: 'NOIR ATELIER — LEGAL',
      title: 'Terms & Conditions',
      body: 'All NOIR fine jewellery commissions, surgical-grade 950 platinum settings, and carbonado diamond pieces are crafted to order. Private consultations and Guild releases are extended exclusively to verified medical professionals and invited collectors. Bespoke sizing and custom engraving specifications are confirmed prior to casting.'
    },
    privacy: {
      eyebrow: 'NOIR ATELIER — PRIVACY',
      title: 'Privacy Policy',
      body: 'Email addresses submitted through Join the Guild are held strictly for private exhibition invitations, seasonal atelier previews, and bespoke release notifications. NOIR never sells, trades, or distributes member correspondence to external parties.'
    }
  };

  document.querySelectorAll('.legal-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const data = legalCopy[btn.dataset.legal];
      if (!data) return;
      legalEyebrow.textContent = data.eyebrow;
      legalTitle.textContent = data.title;
      legalBody.textContent = data.body;
      openOverlay(legalOverlay);
    });
  });
})();
