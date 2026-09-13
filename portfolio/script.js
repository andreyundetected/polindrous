(() => {
  'use strict';

  const reel = document.getElementById('reel');
  const beats = document.querySelectorAll('.beat');
  const progressFill = document.getElementById('progressFill');

  /* ----------------------------------------------------
     1. Mark the active beat (fades its artwork in) and
        drive the progress rail from vertical scroll.
  ---------------------------------------------------- */
  if ('IntersectionObserver' in window) {
    const activeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-active');
        }
      });
    }, { threshold: 0.6 });

    beats.forEach((b) => activeObserver.observe(b));
  } else {
    beats.forEach((b) => b.classList.add('is-active'));
  }

  function updateProgress() {
    const max = reel.scrollHeight - reel.clientHeight;
    const pct = max > 0 ? (reel.scrollTop / max) * 100 : 0;
    progressFill.style.height = pct + '%';
  }
  reel.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ----------------------------------------------------
     2. Colour sampling — the artwork's own average colour,
        used as a flat background plus a glow-spot behind
        the frame. Near-white paper is excluded from the
        average (it would just wash the colour out toward
        grey), and the result gets a saturation boost, since
        a plain pixel average of a watercolor study — mostly
        blank paper with a small painted area — reads much
        paler than the work actually looks.
  ---------------------------------------------------- */
  const BASE = { r: 23, g: 19, b: 15 }; // matches --bg #17130f

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h /= 6;
    }
    return [h, s, l];
  }

  function hslToRgb(h, s, l) {
    if (s === 0) {
      const v = Math.round(l * 255);
      return [v, v, v];
    }
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [
      Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
      Math.round(hue2rgb(p, q, h) * 255),
      Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    ];
  }

  function boostSaturation(r, g, b, factor) {
    const [h, s, l] = rgbToHsl(r, g, b);
    const [nr, ng, nb] = hslToRgb(h, Math.min(1, s * factor), l);
    return { r: nr, g: ng, b: nb };
  }

  function averageColor(img) {
    try {
      const canvas = document.createElement('canvas');
      const w = (canvas.width = 32);
      const h = (canvas.height = 32);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;

      let r = 0, g = 0, b = 0, n = 0;
      let ar = 0, ag = 0, ab = 0; // all-pixel fallback
      for (let i = 0; i < data.length; i += 4) {
        const px = data[i], py = data[i + 1], pz = data[i + 2];
        ar += px; ag += py; ab += pz;
        const luminance = (px + py + pz) / 3 / 255;
        if (luminance > 0.92) continue; // skip blank paper / background
        r += px; g += py; b += pz; n++;
      }
      const total = data.length / 4;
      const base = n > total * 0.05
        ? { r: r / n, g: g / n, b: b / n }
        : { r: ar / total, g: ag / total, b: ab / total }; // near-solid-white image

      return boostSaturation(base.r, base.g, base.b, 1.35);
    } catch (e) {
      return null; // e.g. canvas blocked when opened via file://; flat --bg stays as fallback
    }
  }

  function mix(base, sample, amount) {
    return Math.round(base + (sample - base) * amount);
  }

  function tintCell(cell, img, onColor) {
    const glow = cell.querySelector(':scope > .glow-spot');
    const apply = () => {
      const c = averageColor(img);
      if (!c) return;
      const mixed = `${mix(BASE.r, c.r, 0.46)}, ${mix(BASE.g, c.g, 0.46)}, ${mix(BASE.b, c.b, 0.46)}`;
      cell.style.backgroundColor = `rgb(${mixed})`;
      if (glow) glow.style.backgroundColor = `rgb(${c.r}, ${c.g}, ${c.b})`;
      if (onColor) onColor(mixed);
    };
    if (img.complete) apply();
    else img.addEventListener('load', apply, { once: true });
  }

  // solo beats — one cell, nothing to blend with
  document.querySelectorAll('.beat-solo').forEach((cell) => {
    const img = cell.querySelector('.frame img');
    if (img) tintCell(cell, img);
  });

  /* ----------------------------------------------------
     3. Stacked beats (duo / trio) — each row's background
        is a gradient that already fades toward the midpoint
        colour shared with its neighbour at 0%/100%. Since
        that midpoint is computed the same way from both
        sides, two adjacent rows always meet at an identical
        colour — a true blend, not a separate patched seam.
  ---------------------------------------------------- */
  function mixColorStrings(a, b) {
    const [ar, ag, ab] = a.split(',').map(Number);
    const [br, bg, bb] = b.split(',').map(Number);
    return `${Math.round((ar + br) / 2)}, ${Math.round((ag + bg) / 2)}, ${Math.round((ab + bb) / 2)}`;
  }

  document.querySelectorAll('.beat-duo, .beat-trio').forEach((stack) => {
    const rows = Array.from(stack.querySelectorAll(':scope > .beat-row'));
    const fallback = `${BASE.r}, ${BASE.g}, ${BASE.b}`;
    const rowColor = rows.map(() => fallback);

    function paintRow(i) {
      const mine = rowColor[i];
      const top = i > 0 ? mixColorStrings(rowColor[i - 1], mine) : mine;
      const bottom = i < rowColor.length - 1 ? mixColorStrings(mine, rowColor[i + 1]) : mine;
      rows[i].style.backgroundImage =
        `linear-gradient(to bottom, rgb(${top}) 0%, rgb(${mine}) 18%, rgb(${mine}) 82%, rgb(${bottom}) 100%)`;
    }
    function repaintAll() { rows.forEach((_, i) => paintRow(i)); }
    repaintAll();

    rows.forEach((row, i) => {
      const img = row.querySelector('.frame img');
      if (!img) return;
      tintCell(row, img, (mixed) => {
        rowColor[i] = mixed;
        row.style.backgroundColor = ''; // let the gradient (background-image) show through
        repaintAll();
      });
    });
  });

  /* ----------------------------------------------------
     4. Language — swap all [data-i18n] text and
        [data-i18n-alt] image alts from content.js,
        remember the choice.
  ---------------------------------------------------- */
  function applyLanguage(lang) {
    const dict = (typeof CONTENT !== 'undefined' && CONTENT[lang]) || (typeof CONTENT !== 'undefined' && CONTENT.ru);
    if (!dict) return;

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
    try { localStorage.setItem('lang', lang); } catch (e) { /* ignore */ }
  }

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
  });

  let savedLang = 'ru';
  try { savedLang = localStorage.getItem('lang') || 'ru'; } catch (e) { /* ignore */ }
  applyLanguage(savedLang);

  /* ----------------------------------------------------
     5. Lightbox — click any sharp frame image to enlarge.
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

  document.querySelectorAll('.frame img').forEach((img) => {
    img.addEventListener('click', () => openLightbox(img.src, img.alt));
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
})();