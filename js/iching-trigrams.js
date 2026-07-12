// iching-trigrams.js — the 8-trigram reference row at the foot of
// iching.html: eight 3-line figures (Fu Xi binary 0-7), with a
// detail popup that shows the English/pinyin/hanzi names + attributes
// + full paragraph text when a cell is clicked.
//
// Extracted from an earlier iching.js monolith as its own physical
// module. Data (window.TRIGRAMS_DATA) moved into ichingdata.js; this
// file is pure logic + wiring.
//
// Loaded as a classic script AFTER iching-hexagrams.js (needs
// trigramSVG) and AFTER ichingdata.js (needs window.TRIGRAMS_DATA).
//
// No public window API — the row and its detail popup are entirely
// self-contained; nothing else in the page calls in.

(function () {
  'use strict';

  var ft = document.getElementById('trigram-row');
  if (!ft || typeof trigramSVG !== 'function') return;

  var TRIGRAMS = window.TRIGRAMS_DATA || {};
  var detail = document.getElementById('tgDetail');
  var pop = document.getElementById('tgPop');
  var dwrap = pop ? pop.querySelector('.tg-detailwrap') : null;
  if (dwrap) dwrap.inert = true;   // collapsed panel is out of tab order / interaction
  var cur = -1, cells = [];
  var esc = function (s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };

  // Route every active-cell update through one helper that explicitly
  // clears ALL cells first, then sets the active one — defensive against
  // any stale .active state that a toggle pattern could miss (the same
  // fix applied to the cardsoflife planet popup).
  function setActiveCell(idx) {
    cells.forEach(function (c) {
      c.classList.remove('active');
      c.setAttribute('aria-pressed', 'false');
    });
    if (idx >= 0 && cells[idx]) {
      cells[idx].classList.add('active');
      cells[idx].setAttribute('aria-pressed', 'true');
    }
  }

  function show(v, scroll) {
    var d = TRIGRAMS[v]; if (!d) return;
    var wasOpen = pop.classList.contains('open');  // open already → ‹ › step, not a first open
    cur = v;
    document.getElementById('tgFig').innerHTML  = trigramSVG(v, 2);
    document.getElementById('tgName').textContent = d.en;
    // Subtitle: pinyin · hanzi · yin/yang composition (bottom-up). Solid
    // lines = yang, broken = yin — replaces the old "broken · broken ·
    // broken (bottom-up)" wording with the I Ching-native pair.
    var yy = d.lines.replace(/broken/g, 'yin').replace(/solid/g, 'yang');
    document.getElementById('tgSub').textContent  = d.py + ' · ' + d.han + '  ·  ' + yy;
    document.getElementById('tgLine').textContent = d.line;
    document.getElementById('tgAttrs').innerHTML =
      '<dt>Image</dt><dd>' + esc(d.image) + '</dd>' +
      '<dt>Attribute</dt><dd>' + esc(d.attribute) + '</dd>' +
      '<dt>Family</dt><dd>' + esc(d.family) + '</dd>' +
      '<dt>Direction</dt><dd>' + esc(d.direction) + '</dd>' +
      '<dt>Season</dt><dd>' + esc(d.season) + '</dd>' +
      '<dt>Element</dt><dd>' + esc(d.element) + '</dd>';
    document.getElementById('tgPara').textContent = d.text;
    pop.classList.add('open');
    if (dwrap) dwrap.inert = false;
    setActiveCell(v);
    // First open unfurls the panel (grid-rows 0fr→1fr + the detail
    // slide); a step has already unfurled, so cross-fade the detail
    // card instead of jump-cutting. .step-fade is guarded for reduced
    // motion in site.css.
    if (wasOpen) {
      var card = pop.querySelector('.tg-card');
      if (card) { card.classList.remove('step-fade'); void card.offsetWidth; card.classList.add('step-fade'); }
    }
    if (scroll) {
      var _red = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      pop.scrollIntoView({ behavior: _red ? 'auto' : 'smooth', block: 'nearest' });
    }
  }
  function step(dir) { if (cur < 0) return; show((cur + dir + 8) % 8, false); }
  function hide() {
    pop.classList.remove('open');
    if (dwrap) dwrap.inert = true;
    setActiveCell(-1);
    cur = -1;
  }
  // Clicking a trigram toggles: open it, or minimise the panel if it's
  // already active.
  function pick(val) { if (cur === val) hide(); else show(val, true); }

  for (var v = 0; v < 8; v++) {
    (function (val) {
      var wrap = document.createElement('div');
      wrap.className = 'tg-cell';
      wrap.style.cssText = 'display:flex; flex-direction:column; align-items:center; gap:4px; opacity:0.8;';
      wrap.innerHTML = trigramSVG(val, 1);
      wrap.setAttribute('role', 'button'); wrap.setAttribute('tabindex', '0');
      wrap.setAttribute('aria-pressed', 'false');
      wrap.setAttribute('aria-label', (TRIGRAMS[val] ? TRIGRAMS[val].en : 'Trigram') + ' — show meaning');
      wrap.addEventListener('click', function () { pick(val); });
      wrap.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(val); return; }
        // Left/Right step between trigrams (Up/Down left alone so the
        // page can scroll). While the panel is open they mirror the ‹ ›
        // buttons; closed, they just rove focus.
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          var dir = e.key === 'ArrowRight' ? 1 : -1;
          var t = ((cur >= 0 ? cur : val) + dir + 8) % 8;
          if (cur >= 0) show(t, false);
          cells[t].focus();
        }
      });
      cells.push(wrap); ft.appendChild(wrap);
    })(v);
  }

  var prev = document.getElementById('tgPrev'), next = document.getElementById('tgNext');
  if (prev) prev.addEventListener('click', function () { step(-1); });
  if (next) next.addEventListener('click', function () { step(1); });

  // Swipe left/right on the detail panel (mobile).
  if (detail) {
    var sx = null;
    detail.addEventListener('touchstart', function (e) { sx = e.changedTouches[0].clientX; }, { passive: true });
    detail.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
    }, { passive: true });
  }
})();
