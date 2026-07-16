// in-time.js — the "Cycles" 5-card row (13-Year / 7-Year / Yearly /
// 52-Day / Daily) for the Finder's picked card, plus the
// date-scroll nav that lets you view the row "as of" any date. Added
// 2026-07-10; date-nav added 2026-07-10 (was deferred in the first
// pass).
//
// An earlier pass also had a period-reading popup with its own
// prev/next timeline nav (opened by clicking a Daily/52-Day card),
// backed by five lazy-loaded ~490KB reading data files and the
// compare-card popup chrome. That part is intentionally still
// deferred — it needs infrastructure (openCompareCard + those data
// files) that doesn't exist yet.
// This pass is the date context only: the clickable date label (native
// date picker) and the "Today" reset, all recomputing the 5-card row for
// the chosen date. Period-card ‹ › controls handle most nearby timeline
// navigation.
//
// The card math: for a given birth-card index B and current age A:
//   • 13-Year    → deckAtAge(⌊A/91⌋+1) at position B, offset ⌊(A%91)/13⌋
//   • 7-Year     → deckAtAge(⌊A/49⌋+1) at position B, offset ⌊(A%49)/7⌋
//   • Yearly     → deckAtAge(⌊A/7⌋+1)  at position B, offset A%7
//   • 52-Day     → deckAtAge(A+1)      at position B, offset ⌊daysSinceBday/52⌋
//   • Daily      → deckAtAge(weeksAlive%90+1) at position B, offset weekdayShift
// A (age) is derived from the VIEWED date and Finder's currentAge anchor
// (usually supplied by a saved birthday's birth year). Quadrations has
// its own independent age stepper and does not change this anchor.
//
// Reads deckAtAge / SPREAD_PLANETS / SPREAD_PLANET_SYM / CARDS /
// spreadCardPips via classic-script globals. Loaded after cardsdata.js
// and after spread-grid.js (which owns Finder's `currentAge` anchor).
//
// The five period-reading data files (~500 KB total) are LAZY-loaded on
// first Cycles-tab open via ensureCycleData() — same pattern
// solar-time.js uses for astronomy.js. The panel renders immediately
// with the CARD_READINGS fallback text (which comes from cardsdata.js,
// always loaded); when the promise resolves, renderInTime re-runs and
// the real horizon text swaps in.
//
// PUBLIC on window:
//   window.renderInTime(card) — populates `#fInTime`. Returns TRUE
//     when there's real content; FALSE for the Joker.

(function () {
  'use strict';

  const WD_LONG = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const IT_DEFAULT_FOCUS = 'daily';

  // Live accessor for the horizon-specific reading data. Reads
  // window.* at call time so the lookup works both before the lazy
  // load resolves (returns null → fallback text) and after (returns
  // the populated object → real horizon text).
  function readingSourceFor(label) {
    switch ((label || '').toLowerCase()) {
      case '13-year': return window.THIRTEEN_YEAR_CARDS || null;
      case '7-year':  return window.SEVEN_YEAR_CARDS   || null;
      case 'yearly':  return window.YEAR_CARDS         || null;
      case '52-day':  return window.PERIOD_CARDS       || null;
      case 'daily':   return window.DAILY_CARDS        || null;
    }
    return null;
  }

  // Lazy-load the five period-reading data files (~500 KB total). All
  // five ship as classic-script `window.*_CARDS = { ... }` assignments,
  // so injecting them as async <script> tags is enough — no cache-
  // buster query so the sw.js write-through cache-key stays clean.
  var _cyclePromise = null;
  function cyclesLoaded() {
    return !!(window.DAILY_CARDS && window.PERIOD_CARDS && window.YEAR_CARDS
      && window.SEVEN_YEAR_CARDS && window.THIRTEEN_YEAR_CARDS);
  }
  function ensureCycleData() {
    if (cyclesLoaded()) return Promise.resolve();
    if (_cyclePromise) return _cyclePromise;
    var files = [
      'js/dailycarddata.js',
      'js/periodcarddata.js',
      'js/yearcarddata.js',
      'js/sevenyearcarddata.js',
      'js/thirteenyearcarddata.js'
    ];
    _cyclePromise = Promise.all(files.map(function (src) {
      return new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = function () { resolve(); };
        s.onerror = function () { reject(new Error(src + ' failed to load')); };
        document.head.appendChild(s);
      });
    })).catch(function (err) {
      // Reset the cached promise so a later Cycles-tab open can retry.
      _cyclePromise = null;
      throw err;
    });
    return _cyclePromise;
  }

  // ── Date-scroll state ────────────────────────────────────────────
  // viewDate is a local-midnight epoch (ms). renderInTime always shows
  // the row "as of" this date; the date input/Today button
  // shift it and re-render. _lastCard remembers the last card passed to
  // renderInTime so the date controls (which don't get a card reference
  // themselves) can trigger a re-render.
  let viewDate = localMidnight(new Date());
  let _lastCard = null;
  let _activeLabel = IT_DEFAULT_FOCUS;
  let _activeCards = [];

  function isViewingToday() {
    return viewDate === localMidnight(new Date());
  }
  function formatViewDate(ms) {
    const d = new Date(ms);
    const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
    return `${d.getDate()} ${mo} ${d.getFullYear()}`;
  }
  function isoFromMs(ms) {
    const d = new Date(ms);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function setViewDate(ms) {
    viewDate = localMidnight(new Date(ms));
    renderInTime(_lastCard);
  }
  function setActiveFocus(label, options) {
    options = options || {};
    _activeLabel = label || IT_DEFAULT_FOCUS;
    if (options.syncToStart) {
      const target = (_activeCards || []).find(function (pc) { return pc.slug === _activeLabel; });
      if (target && typeof target.startMs === 'number') {
        setViewDate(target.startMs);
        return;
      }
    }
    renderInTime(_lastCard);
  }
  function shiftActiveHorizon(dir) {
    if (!dir) return;
    const active = (_activeCards || []).find(function (pc) { return pc.slug === _activeLabel; });
    if (!active) return;
    const startMs = typeof active.startMs === 'number' ? active.startMs : viewDate;
    if (_activeLabel === 'daily') {
      setViewDate(startMs + (dir * 86400000));
      return;
    }
    if (_activeLabel === '52-day') {
      const birth = readFinderDate();
      const match = /period\s+(\d+)\/7/i.exec(active.sub || '');
      const periodNum = match ? parseInt(match[1], 10) : 0;
      if (!birth || !periodNum) {
        setViewDate(startMs + (dir * 52 * 86400000));
        return;
      }
      const cycleYear = lastBdayYearOf(startMs, birth.m, birth.d);
      const cycleStart = localMidnight(new Date(cycleYear, birth.m - 1, birth.d));
      if (dir > 0) {
        if (periodNum >= 7) {
          setViewDate(localMidnight(new Date(cycleYear + 1, birth.m - 1, birth.d)));
        } else {
          setViewDate(startMs + (52 * 86400000));
        }
        return;
      }
      if (periodNum <= 1) {
        setViewDate(localMidnight(new Date(cycleStart + (6 * 52 * 86400000))));
      } else {
        setViewDate(startMs - (52 * 86400000));
      }
      return;
    }
    if (_activeLabel === 'yearly' || _activeLabel === '7-year' || _activeLabel === '13-year') {
      const years = _activeLabel === 'yearly' ? 1 : (_activeLabel === '7-year' ? 7 : 13);
      const d = new Date(startMs);
      d.setFullYear(d.getFullYear() + (dir * years));
      d.setHours(0, 0, 0, 0);
      setViewDate(d.getTime());
    }
  }
  function dateNavHTML(age) {
    const ageText = typeof age === 'number' && age >= 0 ? `Age ${age}` : 'Pick a date';
    return `<div class="it-date-shell">
      <div class="it-date-head">
        <button class="it-date-label" type="button" title="Pick a date" aria-label="Pick a date">
          <span class="it-date-age">${ageText}</span>
          <span class="it-date-value">${formatViewDate(viewDate)}</span>
        </button>
        <button class="it-date-today${isViewingToday() ? '' : ' visible'}" type="button" title="Reset to today">↻ Today</button>
      </div>
      <input class="it-date-input" type="date" tabindex="-1" aria-hidden="true" value="${isoFromMs(viewDate)}" />
    </div>`;
  }
  function wireDateNav() {
    const root = document.getElementById('fInTime');
    if (!root) return;
    let swipeStart = null;
    root.addEventListener('click', function (ev) {
      const focusBtn = ev.target.closest('[data-it-focus]');
      if (focusBtn) {
        setActiveFocus(focusBtn.getAttribute('data-it-focus') || IT_DEFAULT_FOCUS, { syncToStart: true });
        return;
      }
      const cycleBtn = ev.target.closest('[data-it-cycle]');
      if (cycleBtn) {
        const dir = parseInt(cycleBtn.getAttribute('data-it-cycle') || '0', 10);
        if (!dir) return;
        shiftActiveHorizon(dir);
        return;
      }
      const todayBtn = ev.target.closest('.it-date-today');
      if (todayBtn) { setViewDate(Date.now()); return; }
      const label = ev.target.closest('.it-date-label');
      if (label) {
        const input = root.querySelector('.it-date-input');
        if (!input) return;
        if (typeof input.showPicker === 'function') {
          try { input.showPicker(); return; } catch (e) { /* fall through */ }
        }
        input.focus();
        input.click();
      }
    });
    root.addEventListener('touchstart', function (ev) {
      const reading = ev.target.closest('.it-reading');
      if (!reading || !ev.touches || ev.touches.length !== 1) return;
      const t = ev.touches[0];
      swipeStart = { x: t.clientX, y: t.clientY };
    }, { passive: true });
    root.addEventListener('touchend', function (ev) {
      if (!swipeStart) return;
      const reading = ev.target.closest('.it-reading');
      const t = ev.changedTouches && ev.changedTouches[0];
      if (!reading || !t) { swipeStart = null; return; }
      const dx = t.clientX - swipeStart.x;
      const dy = t.clientY - swipeStart.y;
      swipeStart = null;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
      shiftActiveHorizon(dx < 0 ? 1 : -1);
    }, { passive: true });
    root.addEventListener('change', function (ev) {
      const input = ev.target.closest('.it-date-input');
      if (!input || !input.value) return;
      const [y, m, d] = input.value.split('-').map(Number);
      setViewDate(new Date(y, m - 1, d).getTime());
    });
  }

  function pcReadCard(spreadIdx, birthCardIdx, posIdx) {
    const deck = deckAtAge(spreadIdx + 1);
    const p = deck.indexOf(birthCardIdx);
    return deck[(p + 1 + posIdx) % 52];
  }

  // Local-midnight epoch (ms) — keeps viewDate math stable so day
  // counts survive DST + timezone drift.
  function localMidnight(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }

  // The birthday of the calendar year `refMs` falls in, or the year
  // before if the birthday hasn't happened yet.
  function lastBdayYearOf(refMs, m, d) {
    const t = new Date(refMs);
    const ty = t.getFullYear();
    const refUTC = Date.UTC(ty, t.getMonth(), t.getDate());
    return (Date.UTC(ty, m - 1, d) > refUTC) ? ty - 1 : ty;
  }

  // Read the reader's month/day from the Finder controls. Returns
  // { m, d } or null when either is missing/invalid.
  function readFinderDate() {
    const monEl = document.getElementById('fMonth');
    const dayEl = document.getElementById('fDay');
    if (!monEl || !dayEl) return null;
    const m = parseInt(monEl.value, 10);
    const d = parseInt(dayEl.value, 10);
    if (!m || !d) return null;
    return { m, d };
  }

  function missingDateHTML() {
    return `<div class="it-header">
      <h3 class="it-title">Cycles</h3>
      <p class="it-lede">This section needs a birthday context.</p>
    </div>
    <p class="it-empty-note">Add a <b>DD/MM</b>, load a saved birthday, or pick a calendar date to see the age-based cycle cards for this selection.</p>`;
  }

  function readingKey(card) {
    return card ? `${card.rank}_${card.suit}` : '';
  }

  function fallbackReadingHTML(card, label) {
    const body = fallbackReadingBodyHTML(card);
    return `<div class="it-reading-head">
      <div class="it-reading-kicker">${label}</div>
      <h4 class="it-reading-title">${card ? card.name : 'Card reading'}</h4>
    </div>
    <div class="it-reading-copy">${body}</div>`;
  }

  function fallbackReadingBodyHTML(card) {
    const key = readingKey(card);
    const reading = key && typeof CARD_READINGS !== 'undefined' ? CARD_READINGS[key] : null;
    return reading && reading.personality
      ? reading.personality.split(/\n\n+/).map(p => `<p>${p}</p>`).join('')
      : '<p>This card has no saved Cycles text for this horizon yet.</p>';
  }

  function inTimeReadingHTML(pc) {
    const c = CARDS[pc.idx];
    if (!c) return '';
    const src = readingSourceFor(pc.label);
    const key = readingKey(c);
    const entry = src && key ? src[key] : null;
    const text = entry && entry.planets && pc.planet ? entry.planets[pc.planet] : '';
    const headStart = `<div class="it-reading-head">
      <button type="button" class="it-reading-shift" data-it-cycle="-1" aria-label="Previous ${pc.label} card" title="Previous ${pc.label} card">‹</button>
      <div class="it-reading-head-copy">
      <div class="it-reading-kicker">${pc.label}</div>
      <h4 class="it-reading-title">${c.name}</h4>
      <div class="it-reading-meta">${pc.planet} · ${pc.sub}</div>
      </div>
      <button type="button" class="it-reading-shift" data-it-cycle="1" aria-label="Next ${pc.label} card" title="Next ${pc.label} card">›</button>
    </div>
    `;
    if (!text) return headStart + `<div class="it-reading-copy">${fallbackReadingBodyHTML(c)}</div>`;
    return headStart + `<div class="it-reading-copy"><p>${text}</p></div>`;
  }

  function panelHTML(card) {
    const date = readFinderDate();
    if (!date) return missingDateHTML();
    const birthSv = 55 - (2 * date.m + date.d);
    if (birthSv < 1 || birthSv > 52) return '';   // Joker guard (also handled by isEmpty in renderInTime)
    const birthIdx = birthSv - 1;

    // Finder's currentAge anchors the reader's REAL birth year (their
    // real-today age against real-today's last birthday). Age-at-viewDate
    // is then that fixed birth year measured against the VIEWED date's
    // last-birthday year, so scrolling the date changes which age's cards
    // show. Quadrations keeps a separate quadAge for its spread browsing.
    const anchorAge  = (typeof currentAge === 'number' ? currentAge : 0);
    const realLbYear = lastBdayYearOf(Date.now(), date.m, date.d);
    const birthYear  = realLbYear - anchorAge;
    const viewLbYear = lastBdayYearOf(viewDate, date.m, date.d);
    const age = Math.max(0, viewLbYear - birthYear);

    if (viewLbYear - birthYear < 0) {
      // Scrolled to before this birth date — nothing to compute, but keep
      // the nav bar live so the reader can scroll back into range.
      return `<div class="it-header">
        <h3 class="it-title">Cycles</h3>
        <p class="it-lede">That date is before this birthday.</p>
      </div>
      ${dateNavHTML(null)}`;
    }

    // Date math (UTC to avoid DST drift on day counts)
    const now = new Date(viewDate);
    const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const lastBdayUTC   = Date.UTC(viewLbYear, date.m - 1, date.d);
    const daysSinceBday = Math.floor((todayUTC - lastBdayUTC) / 86400000);
    const birthUTC  = Date.UTC(birthYear, date.m - 1, date.d);
    const daysAlive = Math.floor((todayUTC - birthUTC) / 86400000);
    const weeksAlive = Math.floor(daysAlive / 7);
    const bornWD  = new Date(birthUTC).getUTCDay();
    const todayWD = new Date(todayUTC).getUTCDay();

    // Spread + position for each card type
    const tSpread = Math.floor(age / 91),           tPos = Math.floor((age % 91) / 13);
    const cSpread = Math.floor(age / 49),           cPos = Math.floor((age % 49) / 7);
    const ySpread = Math.floor(age / 7),            yPos = age % 7;
    const fSpread = age,                            fPos = Math.min(Math.floor(daysSinceBday / 52), 6);
    const dSpread = ((weeksAlive % 90) + 90) % 90,  dPos = (todayWD - bornWD + 7) % 7;

    const tIdx = pcReadCard(tSpread, birthIdx, tPos);
    const cIdx = pcReadCard(cSpread, birthIdx, cPos);
    const yIdx = pcReadCard(ySpread, birthIdx, yPos);
    const fIdx = pcReadCard(fSpread, birthIdx, fPos);
    const dIdx = pcReadCard(dSpread, birthIdx, dPos);

    const tStart = Math.floor(age / 13) * 13, tEnd = tStart + 12;
    const cStart = Math.floor(age / 7)  * 7,  cEnd = cStart + 6;
    const tStartMs = localMidnight(new Date(birthYear + tStart, date.m - 1, date.d));
    const cStartMs = localMidnight(new Date(birthYear + cStart, date.m - 1, date.d));
    const yStartMs = localMidnight(new Date(viewLbYear, date.m - 1, date.d));
    const fStartMs = localMidnight(new Date(lastBdayUTC + (fPos * 52 * 86400000)));
    const dStartMs = viewDate;

    const cards = [
      { idx: tIdx,     label: '13-Year', planet: SPREAD_PLANETS[tPos],    sub: 'age ' + tStart + '–' + tEnd, slug: '13-year', startMs: tStartMs },
      { idx: cIdx,     label: '7-Year',  planet: SPREAD_PLANETS[cPos],    sub: 'age ' + cStart + '–' + cEnd, slug: '7-year',  startMs: cStartMs },
      { idx: yIdx,     label: 'Yearly',  planet: SPREAD_PLANETS[yPos],    sub: 'age ' + age,                  slug: 'yearly',  startMs: yStartMs },
      { idx: fIdx,     label: '52-Day',  planet: SPREAD_PLANETS[fPos],    sub: 'period ' + (fPos + 1) + '/7', slug: '52-day', startMs: fStartMs },
      { idx: dIdx,     label: 'Daily',   planet: SPREAD_PLANETS[dPos],    sub: WD_LONG[todayWD],              slug: 'daily',   startMs: dStartMs }
    ];

    _activeCards = cards;
    const availableLabels = cards.map(function (pc) { return pc.slug; });
    if (!availableLabels.includes(_activeLabel)) _activeLabel = IT_DEFAULT_FOCUS;
    const active = cards.find(function (pc) { return pc.slug === _activeLabel; }) || cards[cards.length - 1];

    const rowHTML = cards.map(pc => {
      const c = CARDS[pc.idx];
      const face = c ? spreadCardPips(c) : '';
      const glyph = pc.planet ? `<span class="it-planet-glyph" title="${pc.planet}">${SPREAD_PLANET_SYM[pc.planet]}</span>` : '<span class="it-planet-glyph it-planet-glyph-empty" aria-hidden="true">&#9679;</span>';
      const planetLine = pc.planet ? `<div class="it-planet-name" title="${pc.planet}">${pc.planet}</div>` : '';
      const slug = pc.slug;
      return `<div class="it-col" data-label="${slug}">
        ${glyph}
        <div class="it-label">${pc.label}</div>
        <button type="button" class="spread-card it-card ${c ? c.suit : ''}${slug === _activeLabel ? ' is-active' : ''}" data-it-focus="${slug}" title="${c ? c.name : ''}" aria-pressed="${slug === _activeLabel ? 'true' : 'false'}">${face}</button>
        ${planetLine}
        <div class="it-sub">${pc.sub}</div>
      </div>`;
    }).join('');

    return `${dateNavHTML(age)}
    <div class="it-row-wrap">
      <div class="it-row">${rowHTML}</div>
    </div>
    <div class="it-reading">${inTimeReadingHTML(active)}</div>
    `;
  }

  function renderInTime(card) {
    const root = document.getElementById('fInTime');
    if (!root) return false;
    const inner = root.querySelector('.it-inner') || root;
    root.classList.remove('is-empty');
    _lastCard = card || null;
    if (!card || card.suit === 'joker' || !readFinderDate()) {
      _activeCards = [];
      root.classList.add('is-empty');
      inner.innerHTML = '';
      return false;
    }
    const html = panelHTML(card);
    if (!html) { _activeCards = []; root.classList.add('is-empty'); inner.innerHTML = ''; return false; }
    inner.innerHTML = html;
    // First open triggers the lazy load of the 5 horizon-reading data
    // files (~500 KB). Fallback text renders immediately; re-render
    // when the data lands so real horizon text swaps in. Guarded so
    // subsequent renders (post-load) don't spin — cyclesLoaded() is
    // true then and the outer `if` skips this block.
    if (!cyclesLoaded()) {
      ensureCycleData().then(function () {
        if (_lastCard === card) renderInTime(card);
      }).catch(function () { /* fallback text stays */ });
    }
    return true;
  }

  window.renderInTime = renderInTime;
  window.refreshInTime = function () { renderInTime(_lastCard); };
  document.addEventListener('DOMContentLoaded', wireDateNav);
})();
