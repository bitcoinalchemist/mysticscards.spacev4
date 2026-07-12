// elements.js — the top "Card Elements" section: four suits (always shown),
// thirteen numbers + seven planets + Crown (revealed on suit-select), Modern
// vs Olney·1893 voice toggle, and the trigram-style expander that fills the
// suit/number/planet reading panels below the rows.
//
// First ES-module extraction from the page's original cardsoflife.js
// monolith.
//
// Contains two coordinated controllers that used to live in two IIFEs at
// different points in cardsoflife.js:
//   • planet expander (was at line ~549) — the planet glyphs row + the
//     #plPop reading panel below it. Owns opening/closing planets.
//   • suit/number expander (was at line ~2869) — the suit + number rows +
//     the #elDetail reading panel, plus the .el-voice toggle. Owns the
//     row-reveal state and the voice choice.
// They cross-call by window.* refs (openPlanet ↔ closeElementsDetail, etc.),
// so keeping them in one module keeps that coordination local while
// preserving the same window API.
//
// Loaded as a classic script AFTER cardsoflife.js in index.html — a
// physical extraction that keeps the same runtime characteristics as
// the old inline IIFEs. Real ES-module conversion (import/export from
// store.js and elsewhere) is planned but deferred: jsdom v29, which
// runs the golden test + interaction sweep, doesn't execute
// type="module" scripts, so switching now would leave the harness
// blind. When the harness moves to Playwright (or jsdom adds support)
// this flips to type="module" plus an `import { store } from
// './store.js'` — and the window.* API below can shrink.
//
// Public API — kept on window.* because cardsoflife.js (still a classic
// script for now) calls into it:
//   window.elementsVoice()          — current voice: 'modern' | 'olney'
//   window.closeElementsDetail()    — close suit/number panel, keep rows
//   window.collapseElements()       — full collapse back to suits-only rest
//   window.elementsHighlight(r, s)  — light the loaded card's suit + rank
//   window.openPlanet(name)         — open/toggle a planet by name
//   window.closePlanetPanel()       — close the planet panel
//   window.rerenderPlanet()         — re-render the open planet (voice swap)
//
// Storage: goes through window.CardsStore (js/store.js). Previously two
// direct localStorage calls at the tail of cardsoflife.js escaped step 3
// (getItem at old line 2895, setItem at 3034) — routed here instead.

// ── Planet expander ────────────────────────────────────────────────
// A planets row beneath the suits + numbers: click a glyph to drop that
// planet's reading from PLANET_DATA. 7 planets + the Crown = 8, stepped
// with ‹ › / ← → / swipe, mirroring the suit/number rows above.
(function () {
  function init() {
  const pop = document.getElementById('plPop');
  const row = document.getElementById('planetRow');
  if (!pop || !row) return;
  // Row order, left → right: the seven planets (inner → outer), then the Crown.
  const ORDER = (window.PLANET_ORDER || ['Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune']).concat(['Crown']);
  const detail = document.getElementById('plDetail');
  const dwrap  = pop.querySelector('.pl-detailwrap');
  if (dwrap) dwrap.inert = true;
  let cur = -1;
  const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  // Render the glyph row once from PLANET_DATA (the Quadration grid no longer
  // hosts the triggers — these buttons do).
  row.innerHTML = ORDER.map(function (name) {
    const d = (window.PLANET_DATA && window.PLANET_DATA[name]) || {};
    return '<button type="button" class="el-planet" role="listitem" data-planet="' + name +
      '" aria-pressed="false" aria-label="' + name + (d.epithet ? ' — ' + d.epithet : '') + '">' +
      (d.glyph || name) + '</button>';
  }).join('');

  // Centralise active-label updates so EVERY code path that changes the
  // current planet (click, swipe, keyboard) goes through the same code.
  // Defensive: re-queries the DOM each call (so a re-rendered grid still
  // gets the right label highlighted) and explicitly clears + sets — no
  // assumption that the prior state was correct.
  function setActiveLabel(name) {
    row.querySelectorAll('[data-planet]').forEach((el) => {
      const on = el.dataset.planet === name;
      el.classList.toggle('sel', on);
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function show(name) {
    const d = window.PLANET_DATA && window.PLANET_DATA[name];
    if (!d) return;
    // Opening a planet closes any open suit/number detail (mutually exclusive).
    if (window.closeElementsDetail) window.closeElementsDetail();
    cur = ORDER.indexOf(name);
    // Olney voice swap: when the Card Elements toggle is on 'olney', render
    // Richmond's 1893 reading (his epithet / keywords / synopsis / stone+force
    // attrs / text) in place of the modern Sage one. Missing → falls back.
    var voice = (window.elementsVoice ? window.elementsVoice() : 'modern');
    var o = (voice === 'olney' && d.olney) ? d.olney : null;
    document.getElementById('plFig').textContent  = d.glyph || '';
    document.getElementById('plName').textContent = name;
    document.getElementById('plSub').textContent  = (o ? o.epithet : d.epithet) || '';
    // Keywords render as gold pills, mirroring the suit/number detail's .el-kws.
    document.getElementById('plKws').innerHTML =
      ((o ? o.keywords : d.keywords) || []).map((k) => '<span class="kw-tag">' + esc(k) + '</span>').join('');
    document.getElementById('plSyn').textContent  = (o ? o.synopsis : d.synopsis) || '';
    // Modern: Light / Shadow. Olney: his own attrs (Stone / Head force / etc).
    document.getElementById('plAttrs').innerHTML = o
      ? (o.attrs || []).map((a) => '<dt>' + esc(a[0]) + '</dt><dd>' + esc(a[1]) + '</dd>').join('')
      : ((d.light  ? '<dt>Light</dt><dd>'  + esc(d.light.join(', '))  + '</dd>' : '') +
         (d.shadow ? '<dt>Shadow</dt><dd>' + esc(d.shadow.join(', ')) + '</dd>' : ''));
    document.getElementById('plPara').innerHTML = ((o ? o.text : d.text) || []).map((p) => '<p>' + esc(p) + '</p>').join('');
    // Force a layout flush now that the content is in place, so the panel's
    // grid-template-rows 0fr→1fr open transition always animates from a committed
    // starting frame. Without this, the very first open after page load can
    // intermittently stay collapsed (a transition-start race when the element's
    // content changed in the same frame as the class toggle).
    void pop.offsetHeight;
    pop.classList.add('open');
    if (dwrap) dwrap.inert = false;
    setActiveLabel(name);
  }
  // Re-render the currently-open planet in place (used by the Modern/Olney toggle).
  window.rerenderPlanet = function () { if (cur >= 0) show(ORDER[cur]); };
  function step(dir) { if (cur < 0) return; show(ORDER[(cur + dir + ORDER.length) % ORDER.length]); }
  function hide() {
    pop.classList.remove('open');
    if (dwrap) dwrap.inert = true;
    setActiveLabel(null);   // null = no match → clears the selection from every glyph
    cur = -1;
  }
  // Fold the whole section up (hide the rows too) when the active glyph is
  // re-clicked — matches clicking the active suit / number.
  function foldUp() { if (window.collapseElements) window.collapseElements(); else hide(); }
  // Toggle: clicking the active planet folds the section up.
  window.openPlanet = function (name) { if (cur >= 0 && ORDER[cur] === name) foldUp(); else show(name); };
  // Exposed so the suit/number expander can close JUST this panel (keeping the
  // rows open) when a suit/number is selected.
  window.closePlanetPanel = hide;

  // Move focus to the active glyph so the gold ring follows as you step (mirrors
  // the suit/number rows).
  function focusActive() {
    if (cur < 0) return;
    const btn = row.querySelector('[data-planet="' + ORDER[cur] + '"]');
    if (btn) btn.focus({ preventScroll: true });
  }

  // Click a glyph to open / toggle that planet.
  row.addEventListener('click', (e) => {
    const b = e.target.closest('[data-planet]');
    if (b) window.openPlanet(b.dataset.planet);
  });

  // Swipe on the detail panel steps between planets.
  let sx = null;
  detail.addEventListener('touchstart', (e) => { sx = e.changedTouches[0].clientX; }, { passive: true });
  detail.addEventListener('touchend', (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
  }, { passive: true });
  // ← / → step between planets (and Escape closes) while the panel is open.
  // Bound on document so it works regardless of focus; typing fields are ignored.
  document.addEventListener('keydown', (e) => {
    if (!pop.classList.contains('open') || cur < 0) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); step(-1); focusActive(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); focusActive(); }
    else if (e.key === 'Escape') { e.preventDefault(); foldUp(); }
  });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();


// ── Card Elements row: four suits (always) + thirteen numbers ──────
// Selecting a suit reveals both the number row and the planet row (plus the
// voice toggle). Clicking a glyph fills the reading panel below. Sources:
// SUIT_MEANINGS + NUMEROLOGY (from cardsdata.js); a loaded card lights its
// suit (+ rank) via window.elementsHighlight.
(function () {
  var SUIT_ORDER = ['hearts', 'clubs', 'diamonds', 'spades'];
  var RANK_ORDER = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  // Render all four suits as uniform SVG so they're the same size — the deck's
  // ♥/♦ are unicode and ♠/♣ are SVG, which render at different sizes. ♠/♣ reuse
  // the deck's own pip paths; ♥/♦ get matching paths filling the same 100×100 box.
  var EL_SUIT_SVG = {
    '♥': '<svg class="pip-svg" viewBox="0 0 100 100" aria-hidden="true"><path d="M50,94 C14,66 5,50 5,32 C5,16 16,7 29,7 C40,7 47,15 50,25 C53,15 60,7 71,7 C84,7 95,16 95,32 C95,50 86,66 50,94 Z"/></svg>',
    '♦': '<svg class="pip-svg" viewBox="0 0 100 100" aria-hidden="true"><path d="M50,6 L80,50 L50,94 L20,50 Z"/></svg>'
  };
  function elSuitGlyph(sym) {
    if ((sym === '♠' || sym === '♣') && window.SUIT_PIP_SVG && window.SUIT_PIP_SVG[sym]) return window.SUIT_PIP_SVG[sym];
    return EL_SUIT_SVG[sym] || sym;
  }
  var mode = null;   // 'suit' | 'num' | null
  var idx  = -1;     // index within the active list

  // Reading-voice state ('modern' | 'olney'), shared with the planet controller
  // via window.elementsVoice and persisted per-browser through CardsStore.
  // Toggled by the compact .el-voice switch (wired in init → initVoiceToggle).
  var voice = window.CardsStore ? window.CardsStore.getVoice() : 'modern';
  window.elementsVoice = function () { return voice; };

  function $(id) { return document.getElementById(id); }
  function els() {
    return {
      pop: $('elements'), detail: $('elDetail'),
      suitRow: $('suitRow'), numRow: $('numRow'), planetRow: $('planetRow'),
      fig: $('elFig'), name: $('elName'), kws: $('elKws'),
      text: $('elText'), keynote: $('elKeynote')
    };
  }

  function renderRows() {
    var e = els(); if (!e.suitRow) return;
    if (typeof window.SUIT_MEANINGS !== 'undefined') {
      e.suitRow.innerHTML = SUIT_ORDER.map(function (s, i) {
        var m = window.SUIT_MEANINGS[s];
        var glyph = elSuitGlyph(m.sym);
        return '<button type="button" class="el-suit" role="listitem" data-suit="' + s +
          '" data-i="' + i + '" aria-label="' + m.label + '">' + glyph + '</button>';
      }).join('');
    }
    if (typeof window.NUMEROLOGY !== 'undefined') {
      e.numRow.innerHTML = RANK_ORDER.map(function (r, i) {
        return '<button type="button" class="el-num" role="listitem" data-rank="' + r +
          '" data-i="' + i + '" aria-label="' + (window.NUMEROLOGY[r] ? window.NUMEROLOGY[r].label : r) + '">' + r + '</button>';
      }).join('');
    }
  }

  function fill(kind, key) {
    var e = els();
    var d = kind === 'suit' ? window.SUIT_MEANINGS[key] : window.NUMEROLOGY[key];
    if (!d) return;
    // Olney voice: swap the reading (glyph + name stay from the base entry).
    var src = (voice === 'olney' && d.olney) ? d.olney : d;
    e.fig.textContent = kind === 'suit' ? d.sym : d.n;
    e.name.textContent = d.label;
    e.kws.innerHTML = (src.keywords || []).map(function (k) { return '<span class="kw-tag">' + k + '</span>'; }).join('');
    e.text.innerHTML = String(src.text || '').split('\n\n').map(function (p) { return '<p>' + p + '</p>'; }).join('');
    e.keynote.textContent = src.keynote || '';
  }

  function mark() {
    var e = els();
    e.suitRow.querySelectorAll('.el-suit').forEach(function (b) {
      b.classList.toggle('sel', mode === 'suit' && +b.dataset.i === idx);
    });
    e.numRow.querySelectorAll('.el-num').forEach(function (b) {
      b.classList.toggle('sel', mode === 'num' && +b.dataset.i === idx);
    });
  }

  // Selecting a suit reveals BOTH the number row and the planet row (the
  // planets behave like the A–K numbers — hidden until a suit is chosen).
  function revealRows(on) {
    var e = els();
    e.numRow.hidden = !on;
    if (e.planetRow) e.planetRow.hidden = !on;
  // The Modern | Olney voice toggle rides with the suits row — hidden in the
  // suits-only resting state, shown once a suit is picked.
  var v = document.getElementById('elVoice'); if (v) v.hidden = !on;
  }

  function open(m, i) {
    var e = els();
    // Opening a suit/number closes any open planet panel (mutually exclusive).
    if (window.closePlanetPanel) window.closePlanetPanel();
    mode = m; idx = i;
    if (m === 'suit') { fill('suit', SUIT_ORDER[i]); revealRows(true); }
    else { fill('num', RANK_ORDER[i]); }
    e.pop.classList.add('el-open');
    mark();
  }

  // Close just the suit/number detail card, leaving the revealed rows in place.
  // Used when a planet opens — the planet panel becomes the visible detail but
  // the number + planet rows stay open so you can keep browsing.
  function closePanelOnly() {
    var e = els();
    mode = null; idx = -1;
    e.pop.classList.remove('el-open');
    mark();
  }
  // Full reset: close the detail card AND the planet panel, and hide the number
  // + planet rows back to the suits-only resting state.
  function collapse() {
    closePanelOnly();
    revealRows(false);
    if (window.closePlanetPanel) window.closePlanetPanel();
  }
  // Exposed so the planet expander can coordinate with this controller:
  //   • opening a planet keeps the rows open (closePanelOnly)
  //   • Escape / clicking the active glyph folds everything up (collapse)
  window.closeElementsDetail = closePanelOnly;
  window.collapseElements    = collapse;

  function nav(dir) {
    if (mode == null) return;
    var len = mode === 'suit' ? SUIT_ORDER.length : RANK_ORDER.length;
    open(mode, (idx + dir + len) % len);
  }

  // Move focus to the active glyph so the gold focus-ring follows the selection
  // as you cycle (mirrors the I Ching trigrams, which focus each cell in turn).
  function focusActive() {
    var e = els();
    var btn = (mode === 'suit')
      ? e.suitRow.querySelector('.el-suit[data-i="' + idx + '"]')
      : e.numRow.querySelector('.el-num[data-i="' + idx + '"]');
    if (btn) btn.focus({ preventScroll: true });
  }

  // Public: light the loaded card's suit (and rank) in the rows, without opening.
  window.elementsHighlight = function (rank, suit) {
    var e = els(); if (!e.suitRow) return;
    e.suitRow.querySelectorAll('.el-suit').forEach(function (b) { b.classList.toggle('lit', b.dataset.suit === suit); });
    e.numRow.querySelectorAll('.el-num').forEach(function (b) { b.classList.toggle('lit', b.dataset.rank === rank); });
  };

  // Wire the Modern | Olney toggle: reflect the persisted voice,
  // and on change persist + re-render whatever detail is open (suit / number via
  // fill, planet via window.rerenderPlanet).
  function initVoiceToggle() {
    var btn = document.getElementById('elVoiceToggle');
    if (!btn) return;
    function reflect() {
      var isOlney = voice === 'olney';
      btn.setAttribute('aria-pressed', isOlney ? 'true' : 'false');
      btn.textContent = isOlney ? 'olney' : 'modern';
      btn.title = 'Reading voice: ' + (isOlney ? 'Olney' : 'Modern');
      btn.setAttribute('aria-label', 'Reading voice: ' + (isOlney ? 'Olney' : 'Modern') + '. Activate to switch.');
    }
    reflect();
    btn.addEventListener('click', function () {
      voice = voice === 'modern' ? 'olney' : 'modern';
      if (window.CardsStore) window.CardsStore.setVoice(voice);
      reflect();
      if (mode === 'suit') fill('suit', SUIT_ORDER[idx]);
      else if (mode === 'num') fill('num', RANK_ORDER[idx]);
      if (window.rerenderPlanet) window.rerenderPlanet();
    });
  }

  function init() {
    var e = els(); if (!e.suitRow) return;
    renderRows();
    initVoiceToggle();
    e.suitRow.addEventListener('click', function (ev) {
      var b = ev.target.closest('.el-suit'); if (!b) return;
      var i = +b.dataset.i;
      if (mode === 'suit' && idx === i) collapse(); else open('suit', i);
    });
    e.numRow.addEventListener('click', function (ev) {
      var b = ev.target.closest('.el-num'); if (!b) return;
      var i = +b.dataset.i;
      if (mode === 'num' && idx === i) collapse(); else open('num', i);
    });
    var prev = e.pop.querySelector('.el-prev'), next = e.pop.querySelector('.el-next');
    if (prev) prev.addEventListener('click', function () { nav(-1); });
    if (next) next.addEventListener('click', function () { nav(1); });
    document.addEventListener('keydown', function (ev) {
      if (mode == null) return;
      var t = ev.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
        ev.preventDefault();
        nav(ev.key === 'ArrowRight' ? 1 : -1);
        focusActive();
      } else if (ev.key === 'Escape') { collapse(); }
    });
    var tx = null;
    e.detail.addEventListener('touchstart', function (ev) { tx = ev.touches[0].clientX; }, { passive: true });
    e.detail.addEventListener('touchend', function (ev) {
      if (tx == null) return;
      var dx = ev.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 45) nav(dx < 0 ? 1 : -1);
    });
  }

  // As a module, this file is deferred by the browser — so DOM is always
  // ready by the time we run. Kept the loading-branch fallback for parity
  // with the original IIFE, which ran mid-body via a classic <script>.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
