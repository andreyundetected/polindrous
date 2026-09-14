(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------
     1. Hero → carousel reveal.
  ---------------------------------------------------- */
  const heroView = document.getElementById('heroView');
  const carouselView = document.getElementById('carouselView');
  const scrollCue = document.getElementById('scrollCue');

  let revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    heroView.classList.add('is-leaving');
    carouselView.classList.add('is-active');
    window.removeEventListener('wheel', onWheelIntent);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('keydown', onKeyIntent);
    setTimeout(() => { render(); showCaptionThenFade(); }, 260); // stage is now laid out
  }
  function onWheelIntent(e) { if (e.deltaY > 4) reveal(); }
  let touchStartY = 0;
  function onTouchStart(e) { touchStartY = e.touches[0].clientY; }
  function onTouchMove(e) { if (touchStartY - e.touches[0].clientY > 12) reveal(); }
  function onKeyIntent(e) { if (['ArrowDown', 'PageDown', ' '].includes(e.key)) reveal(); }

  window.addEventListener('wheel', onWheelIntent, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('keydown', onKeyIntent);
  scrollCue.addEventListener('click', reveal);

  /* ----------------------------------------------------
     2. Language.
  ---------------------------------------------------- */
  let currentLang = 'ru';

  function applyLanguage(lang) {
    const dict = (typeof CONTENT !== 'undefined' && CONTENT[lang]) || (typeof CONTENT !== 'undefined' && CONTENT.en);
    if (!dict) return;
    currentLang = lang;
    document.documentElement.lang = lang === 'sr' ? 'sr-Latn' : lang;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      if (dict[key] != null) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
      const key = el.dataset.i18nAlt;
      if (dict.alts && dict.alts[key] != null) el.setAttribute('alt', dict.alts[key]);
    });
    document.querySelectorAll('.lang-btn').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.lang === lang);
    });

    if (typeof refreshTexts === 'function') refreshTexts();
    try { localStorage.setItem('lang', lang); } catch (e) { /* ignore */ }
  }
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
  });

  /* ----------------------------------------------------
     3. The carousel.
     Layout: every item's on-screen x-offset (in vw) and
     scale come from a "chain" — starting at the active
     item's own edge, each next item is placed at
     (previous item's far edge + GAP + this item's own
     half-width). That guarantees a real gap between any
     two neighbours no matter how different their widths
     are (portrait vs. landscape covers), instead of a
     fixed pixel step that would only work for one case.
  ---------------------------------------------------- */
  const stage = document.getElementById('carouselStage');
  const track = document.getElementById('track');
  const caption = document.getElementById('caption');
  const items = Array.from(track.querySelectorAll('.carousel-item'));
  const N = items.length;

  const PORTRAIT_HALF = 31;   // vw — half of --portrait-w
  const LANDSCAPE_HALF = 42;  // vw — half of --landscape-w
  const GAP_VW = 4;
  const MAX_CHAIN = 8;

  function halfWidthVW(i) {
    return items[i].dataset.orientation === 'landscape' ? LANDSCAPE_HALF : PORTRAIT_HALF;
  }
  function scaleForSlot(absD) {
    if (absD === 0) return 1;
    if (absD === 1) return 0.62;
    if (absD === 2) return 0.46;
    if (absD === 3) return 0.35;
    return 0.28;
  }
  function styleForSlot(absD) {
    if (absD === 0) return { filter: 'none', opacity: 1, z: 100 };
    if (absD === 1) return { filter: 'brightness(0.72) blur(1.5px)', opacity: 0.95, z: 90 };
    if (absD === 2) return { filter: 'brightness(0.55) blur(2.5px)', opacity: 0.85, z: 80 };
    if (absD === 3) return { filter: 'brightness(0.42) blur(3.5px)', opacity: 0.68, z: 70 };
    return { filter: 'brightness(0.35) blur(4px)', opacity: 0.4, z: 60 };
  }

  let activeIndex = 0;

  function circularOffsets(active) {
    return items.map((_, i) => {
      let d = i - active;
      d = ((d % N) + N) % N;
      if (d > N / 2) d -= N;
      return d;
    });
  }

  function computeLayout(active) {
    const offsets = circularOffsets(active);
    const positions = new Array(N);
    positions[active] = { x: 0, scale: 1, absD: 0 };

    let cursor = halfWidthVW(active);
    for (let d = 1; d <= MAX_CHAIN; d++) {
      const idx = offsets.indexOf(d);
      if (idx === -1) continue;
      const s = scaleForSlot(d);
      const hw = halfWidthVW(idx) * s;
      cursor += GAP_VW;
      const cx = cursor + hw;
      cursor = cx + hw;
      positions[idx] = { x: cx, scale: s, absD: d };
    }

    let cursorL = -halfWidthVW(active);
    for (let d = -1; d >= -MAX_CHAIN; d--) {
      const idx = offsets.indexOf(d);
      if (idx === -1) continue;
      const s = scaleForSlot(-d);
      const hw = halfWidthVW(idx) * s;
      cursorL -= GAP_VW;
      const cx = cursorL - hw;
      cursorL = cx - hw;
      positions[idx] = { x: cx, scale: s, absD: -d };
    }

    items.forEach((_, i) => {
      if (!positions[i]) {
        const sign = offsets[i] > 0 ? 1 : -1;
        positions[i] = { x: sign * 160, scale: 0.24, absD: 9 };
      }
    });
    return positions;
  }

  function applyLayout(positions, extraVW) {
    items.forEach((item, i) => {
      const p = positions[i];
      const x = p.x + (extraVW || 0);
      const st = styleForSlot(p.absD);
      item.style.transform = `translate(-50%, -50%) translateX(${x}vw) scale(${p.scale})`;
      item.style.filter = st.filter;
      item.style.opacity = String(st.opacity);
      item.style.zIndex = String(st.z);
    });
  }

  function render() {
    applyLayout(computeLayout(activeIndex));
    positionCaption();
  }

  // ---- analytic caption placement: computed from the
  // active item's known final size, not measured mid-
  // transition, so it's correct even while animating.
  function positionCaption() {
    const item = items[activeIndex];
    const img = item.querySelector('img');
    const w = parseFloat(img.getAttribute('width'));
    const h = parseFloat(img.getAttribute('height'));
    const stageH = stage.getBoundingClientRect().height;
    const viewportW = window.innerWidth;

    const isLandscape = item.dataset.orientation === 'landscape';
    const boxWpx = (isLandscape ? LANDSCAPE_HALF : PORTRAIT_HALF) * 2 / 100 * viewportW;
    const finalHpx = boxWpx * (h / w);

    const centerY = stageH * 0.42;
    const bottomY = centerY + finalHpx / 2;
    caption.style.top = Math.min(bottomY + 14, stageH - 58) + 'px';
  }

  function buildCaption(item) {
    const dict = (typeof CONTENT !== 'undefined' && CONTENT[currentLang]) || {};
    const chapter = dict[item.dataset.chapterKey] || '';
    const alt = (dict.alts && dict.alts[item.dataset.altKey]) || '';
    return chapter && alt ? `${chapter} — ${alt}` : (chapter || alt);
  }

  let captionHideTimer = null;
  function showCaptionThenFade() {
    caption.textContent = buildCaption(items[activeIndex]);
    caption.classList.add('is-visible');
    clearTimeout(captionHideTimer);
    captionHideTimer = setTimeout(() => caption.classList.remove('is-visible'), 5000);
  }

  window.refreshTexts = function refreshTexts() {
    if (revealed) {
      showCaptionThenFade();
    }
    if (lightbox && lightbox.classList.contains('is-open')) {
      lightboxCaption.textContent = buildCaption(items[activeIndex]);
    }
  };

  function goTo(index) {
    activeIndex = ((index % N) + N) % N;
    render();
    showCaptionThenFade();
  }
  function next() { goTo(activeIndex + 1); }
  function prev() { goTo(activeIndex - 1); }

  // ---- drag: live 1:1 follow while dragging (transitions
  // off), release either commits one step, springs back,
  // or — on a downward swipe — returns to the hero screen.
  let dragging = false, dragStartX = 0, dragStartY = 0;
  let dragCurrentVW = 0, dragCurrentPxX = 0, dragCurrentPxY = 0;

  function returnToHero() {
    if (!revealed) return;
    revealed = false;
    heroView.classList.remove('is-leaving');
    carouselView.classList.remove('is-active');
    caption.classList.remove('is-visible');
    clearTimeout(captionHideTimer);
    window.addEventListener('wheel', onWheelIntent, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('keydown', onKeyIntent);
  }

  track.addEventListener('pointerdown', (e) => {
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragCurrentVW = 0;
    dragCurrentPxX = 0;
    dragCurrentPxY = 0;
    track.classList.add('is-dragging');
    track.setPointerCapture(e.pointerId);
  });

  track.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    dragCurrentPxX = e.clientX - dragStartX;
    dragCurrentPxY = e.clientY - dragStartY;
    dragCurrentVW = (dragCurrentPxX / window.innerWidth) * 100;
    if (Math.abs(dragCurrentPxY) <= Math.abs(dragCurrentPxX)) {
      applyLayout(computeLayout(activeIndex), dragCurrentVW);
    }
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('is-dragging');
    const moved = dragCurrentVW;
    const movedX = dragCurrentPxX;
    const movedY = dragCurrentPxY;
    dragCurrentVW = 0;
    dragCurrentPxX = 0;
    dragCurrentPxY = 0;

    if (movedY > 70 && Math.abs(movedY) > Math.abs(movedX)) {
      render();
      returnToHero();
      return;
    }
    if (moved < -13) next();
    else if (moved > 13) prev();
    else render();
  }
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);

  // tap vs. drag: a pointerup with barely any movement is a tap
  track.addEventListener('click', (e) => {
    const item = e.target.closest('.carousel-item');
    if (!item) return;
    const idx = items.indexOf(item);
    if (idx === activeIndex) openLightbox(idx);
    else goTo(idx);
  });

  window.addEventListener('resize', () => { render(); });

  /* ----------------------------------------------------
     4. Lightbox — animated open/close, caption stays
        until closed.
  ---------------------------------------------------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');

  function openLightbox(idx) {
    const item = items[idx];
    const img = item.querySelector('img');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = buildCaption(item);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
  }
  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
  }
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  /* ---- boot ---- */
  let savedLang = 'en';
  try { savedLang = localStorage.getItem('lang') || 'en'; } catch (e) { /* ignore */ }
  applyLanguage(savedLang);
  render();
})();