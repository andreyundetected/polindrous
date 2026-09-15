(() => {
  'use strict';

  let currentLang = 'en';

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

    refreshPlaques();
    if (lightbox.classList.contains('is-open') && currentLightboxItem) {
      lightboxCaption.textContent = buildCaption(currentLightboxItem);
    }
    try { localStorage.setItem('lang', lang); } catch (e) { /* ignore */ }
  }
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
  });

  const items = Array.from(document.querySelectorAll('.wall-item'));

  function buildCaption(item) {
    const dict = (typeof CONTENT !== 'undefined' && CONTENT[currentLang]) || {};
    const chapter = dict[item.dataset.chapterKey] || '';
    const alt = (dict.alts && dict.alts[item.dataset.altKey]) || '';
    return chapter && alt ? `${chapter} — ${alt}` : (chapter || alt);
  }
  function refreshPlaques() {
    items.forEach((item) => {
      const p = item.querySelector('.plaque');
      if (p) p.textContent = buildCaption(item);
    });
  }

  const track = document.getElementById('wallTrack');

  let velocity = 0;
  let rafId = null;

  function momentumStep() {
    track.scrollLeft += velocity;
    velocity *= 0.92;
    if (Math.abs(velocity) > 0.4) {
      rafId = requestAnimationFrame(momentumStep);
    } else {
      velocity = 0;
      rafId = null;
    }
  }
  function kick(v) {
    velocity += v;
    if (!rafId) rafId = requestAnimationFrame(momentumStep);
  }

  track.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      kick(e.deltaY * 0.45);
      e.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') kick(320);
    if (e.key === 'ArrowLeft') kick(-320);
  });

  let dragging = false, dragStartX = 0, dragStartScroll = 0, dragMoved = 0;
  let lastX = 0, lastT = 0, releaseVelocity = 0;
  let downTarget = null;

  track.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a') || e.target.closest('button')) return;
    
    dragging = true;
    dragMoved = 0;
    downTarget = e.target;
    velocity = 0;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    dragStartX = e.clientX;
    dragStartScroll = track.scrollLeft;
    lastX = e.clientX;
    lastT = performance.now();
    releaseVelocity = 0;
  });

  track.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStartX;
    dragMoved = Math.max(dragMoved, Math.abs(dx));

    // Включаем захват pointerCapture только при фактическом драге (> 4px)
    if (dragMoved > 4 && !track.hasPointerCapture(e.pointerId)) {
      track.classList.add('is-grabbing');
      try { track.setPointerCapture(e.pointerId); } catch (err) {}
    }

    if (dragMoved > 4) {
      track.scrollLeft = dragStartScroll - dx;
    }

    const now = performance.now();
    const dt = now - lastT;
    if (dt > 0) releaseVelocity = -((e.clientX - lastX) / dt) * 16;
    lastX = e.clientX;
    lastT = now;
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('is-grabbing');
    if (e && e.pointerId && track.hasPointerCapture(e.pointerId)) {
      try { track.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    if (Math.abs(releaseVelocity) > 0.4) kick(releaseVelocity);
  }
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);

  track.addEventListener('click', (e) => {
    if (dragMoved > 8) return;
    
    const target = downTarget || e.target;
    const item = target.closest('.wall-item') || (e.target !== track ? e.target.closest('.wall-item') : null);
    
    if (item) {
      openLightbox(item);
    }
  });

  const cols = Array.from(document.querySelectorAll('.wall-col'));
  if ('IntersectionObserver' in window) {
    const spotObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('in-view', entry.isIntersecting);
      });
    }, { root: track, threshold: 0.15 });

    cols.forEach((col) => spotObserver.observe(col));
  } else {
    cols.forEach((col) => col.classList.add('in-view'));
  }

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');
  let currentLightboxItem = null;

  function openLightbox(item) {
    const img = item.querySelector('img');
    if (!img) return;
    currentLightboxItem = item;
    lightboxImg.src = img.src;
    lightboxCaption.textContent = buildCaption(item);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
  }
  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    setTimeout(() => { if (!lightbox.classList.contains('is-open')) lightboxImg.src = ''; }, 400);
    currentLightboxItem = null;
  }
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
  });

  try {
    const saved = localStorage.getItem('lang');
    if (saved && (saved === 'ru' || saved === 'en' || saved === 'sr')) applyLanguage(saved);
    else applyLanguage(navigator.language.startsWith('ru') ? 'ru' : (navigator.language.startsWith('sr') ? 'sr' : 'en'));
  } catch (e) { applyLanguage('en'); }

})();