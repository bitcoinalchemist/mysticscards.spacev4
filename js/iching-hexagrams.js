// iching-hexagrams.js — the "Hexagrams" reference section: the 64-cell
// grid (Fu Xi + King Wen sequences), the SVG renderers for hexagrams
// and trigrams, and the hexagram-detail popup that opens when a cell
// is clicked (or when the cast result calls window.openHexPopup).
//
// Extracted from an earlier iching.js monolith as its own physical
// module. Loaded as a classic script BEFORE js/iching-cards.js and
// js/iching-oracle.js in iching.html.
//
// Two categories of declarations here:
//
//   1. TOP-LEVEL classic-script globals (needed by other modules —
//      iching-trigrams.js reads trigramSVG, iching-oracle.js reads
//      hexagramSVG + VAL_TO_KW):
//        VAL_TO_KW, KW_TO_VAL, hexagramSVG, trigramSVG
//
//   2. IIFE-internals (the reference grid + popup lifecycle + wiring):
//        buildGrid, applyGlow, openHexPopup / closeHexPopup / stepHex,
//        the sequence + codes toggles, backdrop click, touch swipe,
//        keyboard nav + tab-trap.
//
// Public window API (called by iching.js's oracle IIFE):
//   window.openHexPopup(val)   — open the popup on a hexagram
//   window.setCastGlow(vals)   — glow specified hexagram(s) in the grid
//   window.hexAnswerHTML(val)  — inline HTML for the cast result panel
//   window.applyGlow()         — re-apply glow after external rebuilds

// NOTE: Hexagrams are identified strictly by their 6-bit binary value
// (0-63), which is the value the encoding actually uses. This is NOT
// the same as the traditional King Wen number — that's a separate
// philosophical ordering. We avoid labelling by King Wen NAME to
// prevent conflating the two. VAL_TO_KW is the verified bijection.

// Render a hexagram as SVG given a 6-bit value (0-63).
// Bit order: bit5 = line 6 (top), bit 0 = line 1 (bottom).
function hexagramSVG(val, size = 1, changing) {
  const lineH = 5 * size;
  const gap = 4 * size;
  const totalH = 6 * lineH + 5 * gap;
  const w = 36 * size;
  const segW = 14 * size;
  const svgH = totalH;
  let paths = [];
  for (let i = 0; i < 6; i++) {
    // i=0 = bottom (line 1), i=5 = top (line 6)
    // bits string read left→right = lines 1→6, so bit0(LSB) = top, bit5(MSB) = bottom
    const bit = (val >> (5 - i)) & 1;
    const y = svgH - lineH - i * (lineH + gap);
    const isChanging = changing && changing.indexOf(i) !== -1;
    const fill = isChanging ? 'var(--gold)' : 'var(--yang)';
    if (bit === 1) {
      // Yang: solid bar
      paths.push(`<rect x="0" y="${y}" width="${w}" height="${lineH}" rx="${1.5*size}" fill="${fill}"/>`);
    } else {
      // Yin: broken bar
      paths.push(`<rect x="0" y="${y}" width="${segW}" height="${lineH}" rx="${1.5*size}" fill="${fill}"/>`);
      paths.push(`<rect x="${w - segW}" y="${y}" width="${segW}" height="${lineH}" rx="${1.5*size}" fill="${fill}"/>`);
    }
  }
  return `<svg width="${w}" height="${svgH}" viewBox="0 0 ${w} ${svgH}">${paths.join('')}</svg>`;
}

// Binary value (0-63, bit5=line1/bottom … bit0=line6/top) → King Wen
// number (1-64). Derived from the trigram pairs of all 64 hexagrams;
// verified to be a bijection over 0-63.
const VAL_TO_KW = [2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56, 31, 33,
                   7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50, 28, 44,
                   24, 27, 3, 42, 51, 21, 17, 25, 36, 22, 63, 37, 55, 30, 49, 13,
                   19, 41, 60, 61, 54, 38, 58, 10, 11, 26, 5, 9, 34, 14, 43, 1];

// King Wen number → binary value (inverse of the above).
const KW_TO_VAL = [];
VAL_TO_KW.forEach(function (kw, v) { KW_TO_VAL[kw] = v; });

// 8-trigram (3-line figures) SVG renderer, Fu Xi binary order 0-7.
// Kept top-level because iching-trigrams.js reads it.
function trigramSVG(val, size = 1) {
  const lineH = 5 * size, gap = 4 * size, w = 30 * size, segW = 11 * size;
  const totalH = 3 * lineH + 2 * gap;
  let paths = [];
  for (let i = 0; i < 3; i++) {
    const bit = (val >> (2 - i)) & 1;
    const y = totalH - lineH - i * (lineH + gap);
    if (bit === 1) {
      paths.push(`<rect x="0" y="${y}" width="${w}" height="${lineH}" rx="${1.5*size}" fill="var(--yang)"/>`);
    } else {
      paths.push(`<rect x="0" y="${y}" width="${segW}" height="${lineH}" rx="${1.5*size}" fill="var(--yang)"/>`);
      paths.push(`<rect x="${w - segW}" y="${y}" width="${segW}" height="${lineH}" rx="${1.5*size}" fill="var(--yang)"/>`);
    }
  }
  return `<svg width="${w}" height="${totalH}" viewBox="0 0 ${w} ${totalH}">${paths.join('')}</svg>`;
}

// ── Reference grid + popup (IIFE) ──────────────────────────────
(function () {
  'use strict';

  // Build the 64-hexagram reference grid in the chosen sequence.
  const grid = document.getElementById('hex-grid');
  if (!grid) return;

  function buildGrid(seq, options) {
    options = options || {};
    grid.innerHTML = '';
    const order = [];
    if (seq === 'kingwen') {
      for (let kw = 1; kw <= 64; kw++) order.push(KW_TO_VAL[kw]);
    } else {
      for (let v = 0; v < 64; v++) order.push(v);
    }
    order.forEach(function (v, i) {
      const bits = v.toString(2).padStart(6, '0');
      const kw = VAL_TO_KW[v];
      const cell = document.createElement('div');
      cell.className = 'hex-ref-cell' + (options.skipEntrance ? '' : ' cell-in');
      cell.style.setProperty('--i', i);   // per-cell stagger delay for cellIn
      cell.title = `King Wen ${kw} · Decimal ${v} · Binary ${bits}`;
      cell.dataset.val = v;
      cell.dataset.bits = bits;
      cell.setAttribute('role', 'button');
      cell.tabIndex = 0;
      cell.setAttribute('aria-label', 'Hexagram, King Wen ' + kw);
      cell.innerHTML = `
        <div class="hex-ref-kw">${kw}</div>
        ${hexagramSVG(v, 0.5)}
        <div class="hex-ref-num" style="margin-top:4px">${v}</div>
        <div class="hex-ref-bits">${bits}</div>
      `;
      cell.addEventListener('click', function () { openHexPopup(v); });
      cell.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openHexPopup(v); }
      });
      grid.appendChild(cell);
    });
    applyGlow();
  }
  buildGrid('fuxi');

  function reduceMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function switchSequence(seq) {
    if (reduceMotion()) {
      buildGrid(seq, { skipEntrance: true });
      grid.classList.add('open');
      return;
    }
    const first = {};
    grid.querySelectorAll('.hex-ref-cell[data-val]').forEach(function (cell) {
      first[cell.dataset.val] = cell.getBoundingClientRect();
    });
    buildGrid(seq, { skipEntrance: true });
    grid.classList.add('open');
    const cells = Array.from(grid.querySelectorAll('.hex-ref-cell[data-val]'));
    cells.forEach(function (cell) {
      const from = first[cell.dataset.val];
      if (!from) return;
      const to = cell.getBoundingClientRect();
      const dx = from.left - to.left;
      const dy = from.top - to.top;
      if (!dx && !dy) return;
      cell.style.transition = 'none';
      cell.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      cells.forEach(function (cell) {
        if (!cell.style.transform) return;
        cell.style.transition = 'transform .65s cubic-bezier(.22,1,.36,1)';
        cell.style.transform = '';
        cell.addEventListener('transitionend', function te() {
          cell.style.transition = '';
          cell.removeEventListener('transitionend', te);
        });
      });
    }); });
  }

  // Sequence toggle — clicking switches the grid order. The Hexagrams
  // section itself owns collapse/expand, so the active sequence button
  // stays stable instead of minimising the grid.
  const seqToggle = document.getElementById('seqToggle');
  if (seqToggle) seqToggle.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    if (btn.classList.contains('active')) return;
    seqToggle.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    switchSequence(btn.dataset.seq);
  });

  // Codes toggle — reveals the 0–63 value and binary on every cell
  // (King Wen number is always shown). Off by default.
  const codesToggle = document.getElementById('codesToggle');
  if (codesToggle) codesToggle.addEventListener('click', function () {
    var on = document.getElementById('hex-grid').classList.toggle('show-codes');
    this.classList.toggle('active', on);
    this.setAttribute('aria-pressed', on ? 'true' : 'false');
  });

  // ── Hexagram popup ──────────────────────────────────────
  var _hxKw = null;
  function escapeHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  // Split an image line into two balanced lines: prefer a clause break
  // (comma/period/semicolon/em-dash) closest to the middle; otherwise
  // the space closest to the middle. Punctuation stays at the end of
  // the first line; words after it begin the second.
  function splitImageLine(text) {
    text = String(text).trim();
    var mid = text.length / 2, best = -1, bestDist = Infinity, i, d;
    for (i = 0; i < text.length; i++) {
      if (',.;—'.indexOf(text[i]) !== -1) {
        var at = i + 1;
        if (at < 6 || at > text.length - 4) continue; // skip trivial end splits
        d = Math.abs(at - mid);
        if (d < bestDist) { bestDist = d; best = at; }
      }
    }
    if (best === -1) {
      for (i = 0; i < text.length; i++) {
        if (text[i] === ' ') { d = Math.abs(i - mid); if (d < bestDist) { bestDist = d; best = i; } }
      }
    }
    if (best === -1) return [text, ''];
    return [text.slice(0, best).trim(), text.slice(best).trim()];
  }
  function imageLineHTML(text) {
    var p = splitImageLine(text);
    return '<span class="il-1">' + escapeHtml(p[0]) + '</span>' +
           (p[1] ? '<span class="il-2">' + escapeHtml(p[1]) + '</span>' : '');
  }
  // Cross-fade a popup's content region on step (‹ ›). Retriggered
  // via the codebase idiom (remove → reflow → add); .step-fade is
  // opacity-only and guarded for reduced motion in site.css. Accepts
  // any number of elements.
  function stepFade() {
    for (var i = 0; i < arguments.length; i++) {
      var el = arguments[i];
      if (!el) continue;
      el.classList.remove('step-fade'); void el.offsetWidth; el.classList.add('step-fade');
    }
  }
  function openHexPopup(val) {
    var kw = VAL_TO_KW[val];
    var d = (typeof HEX_DATA !== 'undefined') ? HEX_DATA[kw] : null;
    if (!d) return;
    _hxKw = kw;
    // Already open → this is a ‹ › step; captured before we add .open below.
    var _hxStepping = document.getElementById('hxOverlay').classList.contains('open');
    document.getElementById('hxFig').innerHTML = hexagramSVG(val, 1.1);
    document.getElementById('hxFigNum').textContent = val + ' · ' + val.toString(2).padStart(6, '0');
    document.getElementById('hxKw').textContent = 'King Wen ' + kw;
    document.getElementById('hxName').textContent = d.name;
    document.getElementById('hxTrig').textContent = d.trig;
    document.getElementById('hxImage').innerHTML = imageLineHTML(d.image);
    var html = d.paras.map(function (p) { return '<p>' + escapeHtml(p) + '</p>'; }).join('') +
      '<div class="hx-shadow">' + escapeHtml(d.shadow) + '</div>' +
      '<div class="hx-keynote">' + escapeHtml(d.keynote) + '</div>';
    document.getElementById('hxContent').innerHTML = html;
    document.getElementById('hxContent').scrollTop = 0;
    var overlay = document.getElementById('hxOverlay');
    // Focus management: on first open (not when stepping prev/next)
    // remember the trigger and move focus into the dialog; close restores it.
    if (!overlay.classList.contains('open')) {
      _hxLastFocus = document.activeElement;
      overlay.classList.add('open');
      document.getElementById('hxPopup').focus();
    }
    // On step, blink the content region over (header + image + body);
    // the popup shell + its hxIn open animation stay put.
    if (_hxStepping) {
      stepFade(document.querySelector('.hx-header'),
               document.getElementById('hxImage'),
               document.getElementById('hxContent'));
    }
  }
  var _hxLastFocus = null;
  function closeHexPopup() {
    document.getElementById('hxOverlay').classList.remove('open');
    if (_hxLastFocus && document.contains(_hxLastFocus)) _hxLastFocus.focus();
    _hxLastFocus = null;
  }
  function stepHex(delta) {
    if (_hxKw == null) return;
    // Step in whichever sequence the grid is currently showing, so
    // prev/next matches the order the reader sees (Fu Xi = by binary
    // value, King Wen = 1..64).
    var activeBtn = document.querySelector('#seqToggle button.active');
    var seq = activeBtn ? activeBtn.dataset.seq : 'kingwen';
    if (seq === 'fuxi') {
      var v = ((KW_TO_VAL[_hxKw] + delta) % 64 + 64) % 64;
      openHexPopup(v);
    } else {
      var nk = ((_hxKw - 1 + delta + 64) % 64) + 1; // wrap 1..64
      openHexPopup(KW_TO_VAL[nk]);
    }
  }

  // Glow the cast hexagram(s) in the reference grid (re-applied after
  // each rebuild).
  var _castGlow = [];
  function applyGlow() {
    document.querySelectorAll('.hex-ref-cell.cast-glow').forEach(function (c) { c.classList.remove('cast-glow'); });
    (_castGlow || []).forEach(function (v) {
      var c = document.querySelector('.hex-ref-cell[data-val="' + v + '"]');
      if (c) { void c.offsetWidth; c.classList.add('cast-glow'); }
    });
  }

  // Inline answer HTML for the cast result panel (no popup).
  function hexAnswerHTML(val) {
    var kw = VAL_TO_KW[val];
    var d = (typeof HEX_DATA !== 'undefined') ? HEX_DATA[kw] : null;
    if (!d) return '';
    return '<div class="cast-kw">King Wen ' + kw + '</div>' +
      '<div class="cast-name">' + escapeHtml(d.name) + '</div>' +
      '<div class="cast-trig">' + escapeHtml(d.trig) + '</div>' +
      '<div class="cast-image">' + imageLineHTML(d.image) + '</div>' +
      d.paras.map(function (p) { return '<p>' + escapeHtml(p) + '</p>'; }).join('') +
      '<div class="hx-shadow">' + escapeHtml(d.shadow) + '</div>' +
      '<div class="hx-keynote">' + escapeHtml(d.keynote) + '</div>';
  }

  // Public API — exposed on window because the oracle module calls into it.
  window.openHexPopup  = openHexPopup;
  window.setCastGlow   = function (vals) { _castGlow = vals || []; applyGlow(); };
  window.hexAnswerHTML = hexAnswerHTML;
  window.applyGlow     = applyGlow;   // in case anything external wants to force a re-glow

  // Backdrop click + × button close; the popup body itself stays put.
  // (Tap-anywhere-to-close was easy to trigger by accident on mobile —
  // the swipe-up gesture below + the × button replace it.)
  var hxPopupEl = document.getElementById('hxPopup');
  if (hxPopupEl) {
    var _hxTx = null, _hxTy = null, _hxStartScroll = 0;
    // Swipe left/right steps hexagrams; swipe up dismisses. Vertical-
    // close fires only when .hx-body didn't scroll across the gesture,
    // so reading scrolls never accidentally close the popup.
    var _hxBody = document.querySelector('.hx-body');
    hxPopupEl.addEventListener('touchstart', function (e) {
      _hxTx = e.touches[0].clientX;
      _hxTy = e.touches[0].clientY;
      _hxStartScroll = _hxBody ? _hxBody.scrollTop : 0;
    }, { passive: true });
    hxPopupEl.addEventListener('touchend', function (e) {
      if (_hxTx === null) return;
      var dx = e.changedTouches[0].clientX - _hxTx;
      var dy = e.changedTouches[0].clientY - _hxTy;
      var dScroll = (_hxBody ? _hxBody.scrollTop : 0) - _hxStartScroll;
      _hxTx = null; _hxTy = null;
      if (-dy > 60 && Math.abs(dy) > Math.abs(dx) && dScroll === 0) {
        closeHexPopup(); return;
      }
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        stepHex(dx < 0 ? 1 : -1);
      }
    });
  }
  const hxClose = document.getElementById('hxClose');
  if (hxClose) hxClose.addEventListener('click', function (e) { e.stopPropagation(); closeHexPopup(); });
  const hxPrev = document.getElementById('hxPrev');
  if (hxPrev) hxPrev.addEventListener('click', function (e) { e.stopPropagation(); stepHex(-1); });
  const hxNext = document.getElementById('hxNext');
  if (hxNext) hxNext.addEventListener('click', function (e) { e.stopPropagation(); stepHex(1); });
  const hxOverlay = document.getElementById('hxOverlay');
  if (hxOverlay) hxOverlay.addEventListener('click', function (e) {
    if (e.target === this) closeHexPopup();
  });
  document.addEventListener('keydown', function (e) {
    if (!document.getElementById('hxOverlay').classList.contains('open')) return;
    if (e.key === 'Escape') closeHexPopup();
    else if (e.key === 'ArrowLeft') stepHex(-1);
    else if (e.key === 'ArrowRight') stepHex(1);
    else if (e.key === 'Tab') {
      // Focus trap: keep Tab cycling inside the dialog
      var popup = document.getElementById('hxPopup');
      var f = Array.prototype.filter.call(
        popup.querySelectorAll('button, [tabindex]:not([tabindex="-1"])'),
        function (el) { return !el.hidden && !el.disabled; });
      if (!f.length) { e.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1], a = document.activeElement;
      if (!popup.contains(a))                              { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && (a === first || a === popup)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && a === last)                  { e.preventDefault(); first.focus(); }
    }
  });
})();
