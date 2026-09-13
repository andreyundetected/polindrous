(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------
     1. Hero → carousel reveal. One state machine, one
        transition, triggered once by the first real
        scroll/swipe/keyboard/click "next" gesture.
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
  }

  function onWheelIntent(e) {
    if (e.deltaY > 4) reveal();
  }
  let touchStartY = 0;
  function onTouchStart(e) { touchStartY = e.touches[0].clientY; }
  function onTouchMove(e) {
    if (touchStartY - e.touches[0].clientY > 12) reveal();
  }
  function onKeyIntent(e) {
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) reveal();
  }

  window.addEventListener('wheel', onWheelIntent, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('keydown', onKeyIntent);
  scrollCue.addEventListener('click', reveal);

  /* ----------------------------------------------------
     2. Language — swap [data-i18n] text / [data-i18n-alt]
        alts from content.js, refresh the visible caption.
  ---------------------------------------------------- */
  let currentLang = 'ru';
  let refreshCaption = () => {};

  function applyLanguage(lang) {
    const dict = (typeof CONTENT !== 'undefined' && CONTENT[lang]) || (typeof CONTENT !== 'undefined' && CONTENT.ru);
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

    refreshCaption();
    try { localStorage.setItem('lang', lang); } catch (e) { /* ignore */ }
  }

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
  });

  /* ----------------------------------------------------
     3. The carousel — one track, all 17 works. Real 3D:
        each card's distance from centre (in card-slots,
        not pixels) drives rotateY + translateZ inside a
        perspective container, so the browser's own 3D
        projection shrinks and dims side cards — no manual
        scale hack. Landing on a card shows its caption for
        about a second, then it fades on its own.
  ---------------------------------------------------- */
  const track = document.getElementById('track');
  const caption = document.getElementById('caption');
  const items = Array.from(track.querySelectorAll('.carousel-item'));

  function buildCaption(item) {
    const dict = (typeof CONTENT !== 'undefined' && CONTENT[currentLang]) || {};
    const chapter = dict[item.dataset.chapterKey] || '';
    const alt = (dict.alts && dict.alts[item.dataset.altKey]) || '';
    return chapter && alt ? `${chapter} — ${alt}` : (chapter || alt);
  }

  let active = null;
  let ticking = false;
  let captionHideTimer = null;

  function showCaptionThenFade() {
    if (!caption) return;
    caption.classList.add('is-visible');
    clearTimeout(captionHideTimer);
    captionHideTimer = setTimeout(() => caption.classList.remove('is-visible'), 1000);
  }

  refreshCaption = () => {
    if (caption && active) caption.textContent = buildCaption(active);
  };

  function update() {
    ticking = false;
    if (!items.length) return;

    const pitch = items[0].getBoundingClientRect().width - (parseFloat(getComputedStyle(items[0]).marginRight) || 0);
    const rect = track.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;

    let closest = null, closestAbs = Infinity;

    items.forEach((item) => {
      const r = item.getBoundingClientRect();
      const itemCenter = r.left + r.width / 2;
      const slot = pitch > 0 ? (itemCenter - centerX) / pitch : 0;
      const abs = Math.min(Math.abs(slot), 3);

      if (!reduceMotion) {
        const rotate = Math.max(-46, Math.min(46, slot * -46));
        const z = -abs * 130;
        const opacity = Math.max(0.32, 1 - abs * 0.28);
        const blur = Math.min(3, abs * 1.6);
        item.style.transform = `translateZ(${z}px) rotateY(${rotate}deg)`;
        item.style.opacity = String(opacity);
        item.style.filter = blur > 0.05 ? `blur(${blur}px)` : 'none';
        item.style.zIndex = String(1000 - Math.round(abs * 100));
      }
      if (abs < closestAbs) { closestAbs = abs; closest = item; }
    });

    if (closest !== active) {
      active = closest;
      if (caption) caption.textContent = buildCaption(active);
      showCaptionThenFade();
    }
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  track.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', update);

  // Desktop convenience: map vertical wheel to horizontal travel
  // once the carousel is showing (mouse users have no drag axis).
  track.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      track.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });

  update();
  captionHideTimer = setTimeout(() => { if (caption) caption.classList.add('is-visible'); }, 400);
  setTimeout(showCaptionThenFade, 500);

  let savedLang = 'ru';
  try { savedLang = localStorage.getItem('lang') || 'ru'; } catch (e) { /* ignore */ }
  applyLanguage(savedLang);

  /* ----------------------------------------------------
     4. Lightbox — click any sharp image to enlarge.
  ---------------------------------------------------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
  }
  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
  }

  items.forEach((item) => {
    const img = item.querySelector('img');
    img.addEventListener('click', () => openLightbox(img.src, img.alt));
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
})();