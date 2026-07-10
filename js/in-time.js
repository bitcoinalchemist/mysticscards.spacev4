// in-time.js — the "In Time" 5-card row (13-Year / 7-Year / Yearly /
// 52-Day / Daily) for the Finder's picked card, plus the
// date-scroll nav that lets you view the row "as of" any date. Ported
// from v3/js/in-time.js 2026-07-10; date-nav ported 2026-07-10 (was
// deferred in the first pass).
//
// v3 also had a period-reading popup with its own prev/next timeline
// nav (opened by clicking a Daily/52-Day card), backed by five lazy-
// loaded ~490KB reading data files and the compare-card popup chrome.
// That part is intentionally still deferred — it needs infrastructure
// (openCompareCard + those data files) that doesn't exist in v4 yet.
// This pass is the date-scroll nav only: the ‹ › year/month/day
// steppers, the clickable date label (native date picker), and the
// "Today" reset, all recomputing the 6-card row for the chosen date.
//
// The card math: for a given birth-card index B and current age A:
//   • 13-Year    → deckAtAge(⌊A/91⌋+1) at position B, offset ⌊(A%91)/13⌋
//   • 7-Year     → deckAtAge(⌊A/49⌋+1) at position B, offset ⌊(A%49)/7⌋
//   • Yearly     → deckAtAge(⌊A/7⌋+1)  at position B, offset A%7
//   • 52-Day     → deckAtAge(A+1)      at position B, offset ⌊daysSinceBday/52⌋
//   • Daily      → deckAtAge(weeksAlive%90+1) at position B, offset weekdayShift
// A (age) is now derived from the VIEWED date, not just the Quadrations
// stepper: the stepper anchors the reader's real birth year (today's
// real age minus the stepper value), then age-at-viewDate is that birth
// year measured against the viewed date's last-birthday year — same
// two-step anchor v3 used, so scrolling the date changes which age's
// cards show.
//
// Reads deckAtAge / SPREAD_PLANETS / SPREAD_PLANET_SYM / CARDS /
// spreadCardPips via classic-script globals. Loaded after cardsdata.js
// and after spread-grid.js (which owns the `currentAge` global that
// tells us the reader's real-today age).
//
// PUBLIC on window:
//   window.renderInTime(card) — populates `#fInTime`. Returns TRUE
//     when there's real content; FALSE for the Joker or when the age
//     stepper is missing (the row needs an age to compute derived
//     cards).

(function () {
  'use strict';

  const WD_LONG = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  // ── Date-scroll state ────────────────────────────────────────────
  // viewDate is a local-midnight epoch (ms). renderInTime always shows
  // the row "as of" this date; the nav buttons/date input/Today button
  // shift it and re-render. _lastCard remembers the last card passed to
  // renderInTime so the nav controls (which don't get a card reference
  // themselves) can trigger a re-render.
  let viewDate = localMidnight(new Date());
  let _lastCard = null;

  function isViewingToday() {
    return viewDate === localMidnight(new Date());
  }
  function formatViewDate(ms) {
    const d = new Date(ms);
    const wd = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
    const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
    return `${wd}, ${d.getDate()} ${mo} ${d.getFullYear()}`;
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
  function shiftViewDays(n) {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + n);
    d.setHours(0, 0, 0, 0); // normalize across DST
    setViewDate(d.getTime());
  }
  function shiftViewYears(n) {
    const d = new Date(viewDate);
    d.setFullYear(d.getFullYear() + n);
    d.setHours(0, 0, 0, 0);
    setViewDate(d.getTime());
  }
  function shiftViewMonths(n) {
    // Step by whole months — clamp the day to the target month's last day so
    // e.g. Mar 31 → −1 month lands on Feb 28 (or 29), not the JS-default Mar 3.
    const d = new Date(viewDate);
    const targetDay = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(targetDay, lastDay));
    d.setHours(0, 0, 0, 0);
    setViewDate(d.getTime());
  }
  function dateNavHTML() {
    return `<div class="it-date-bar">
      <button class="it-date-nav" type="button" data-shift-year="-1"  title="−1 year"  aria-label="Back one year">«</button>
      <button class="it-date-nav" type="button" data-shift-month="-1" title="−1 month" aria-label="Back one month">‹‹</button>
      <button class="it-date-nav" type="button" data-shift-day="-1"   title="Previous day" aria-label="Previous day">‹</button>
      <button class="it-date-label" type="button" title="Pick a date" aria-label="Pick a date">${formatViewDate(viewDate)}</button>
      <input class="it-date-input" type="date" tabindex="-1" aria-hidden="true" value="${isoFromMs(viewDate)}" />
      <button class="it-date-nav" type="button" data-shift-day="1"    title="Next day"    aria-label="Next day">›</button>
      <button class="it-date-nav" type="button" data-shift-month="1"  title="+1 month"    aria-label="Forward one month">››</button>
      <button class="it-date-nav" type="button" data-shift-year="1"   title="+1 year"     aria-label="Forward one year">»</button>
    </div>
    <button class="it-date-today${isViewingToday() ? '' : ' visible'}" type="button" title="Reset to today">↻ Today</button>`;
  }
  function wireDateNav() {
    const root = document.getElementById('fInTime');
    if (!root) return;
    root.addEventListener('click', function (ev) {
      const navBtn = ev.target.closest('.it-date-nav');
      if (navBtn) {
        const dy = parseInt(navBtn.dataset.shiftYear  || '0', 10);
        const dm = parseInt(navBtn.dataset.shiftMonth || '0', 10);
        const dd = parseInt(navBtn.dataset.shiftDay   || '0', 10);
        if (dy) shiftViewYears(dy);
        if (dm) shiftViewMonths(dm);
        if (dd) shiftViewDays(dd);
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

  // Local-midnight epoch (ms) — matches v3's viewDate math so day
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

  function panelHTML(card) {
    const date = readFinderDate();
    if (!date) return '';
    const birthSv = 55 - (2 * date.m + date.d);
    if (birthSv < 1 || birthSv > 52) return '';   // Joker guard (also handled by isEmpty in renderInTime)
    const birthIdx = birthSv - 1;

    // The Quadrations stepper anchors the reader's REAL birth year (their
    // real-today age against real-today's last birthday). Age-at-viewDate
    // is then that fixed birth year measured against the VIEWED date's
    // last-birthday year, so scrolling the date changes which age's cards
    // show — same two-step anchor v3 used.
    const anchorAge  = (typeof currentAge === 'number' ? currentAge : 0);
    const realLbYear = lastBdayYearOf(Date.now(), date.m, date.d);
    const birthYear  = realLbYear - anchorAge;
    const viewLbYear = lastBdayYearOf(viewDate, date.m, date.d);
    const age = Math.max(0, viewLbYear - birthYear);

    if (viewLbYear - birthYear < 0) {
      // Scrolled to before this birth date — nothing to compute, but keep
      // the nav bar live so the reader can scroll back into range.
      return `<div class="it-header">
        <h3 class="it-title">In Time</h3>
        <p class="it-lede">That date is before this birthday.</p>
      </div>
      ${dateNavHTML()}`;
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

    const cards = [
      { idx: tIdx,     label: '13-Year', planet: SPREAD_PLANETS[tPos],    sub: 'age ' + tStart + '–' + tEnd },
      { idx: cIdx,     label: '7-Year',  planet: SPREAD_PLANETS[cPos],    sub: 'age ' + cStart + '–' + cEnd },
      { idx: yIdx,     label: 'Yearly',  planet: SPREAD_PLANETS[yPos],    sub: 'age ' + age },
      { idx: fIdx,     label: '52-Day',  planet: SPREAD_PLANETS[fPos],    sub: 'period ' + (fPos + 1) + '/7' },
      { idx: dIdx,     label: 'Daily',   planet: SPREAD_PLANETS[dPos],    sub: WD_LONG[todayWD] }
    ];

    const rowHTML = cards.map(pc => {
      const c = CARDS[pc.idx];
      const face = c ? spreadCardPips(c) : '';
      const glyph = pc.planet ? `<span class="it-planet-glyph" title="${pc.planet}">${SPREAD_PLANET_SYM[pc.planet]}</span>` : '<span class="it-planet-glyph it-planet-glyph-empty" aria-hidden="true">&#9679;</span>';
      const planetLine = pc.planet ? `<div class="it-planet-name" title="${pc.planet}">${pc.planet}</div>` : '';
      return `<div class="it-col" data-label="${pc.label.toLowerCase()}">
        ${glyph}
        <div class="it-label">${pc.label}</div>
        <div class="spread-card it-card ${c ? c.suit : ''}" title="${c ? c.name : ''}">${face}</div>
        ${planetLine}
        <div class="it-sub">${pc.sub}</div>
      </div>`;
    }).join('');

    // Human-readable "as of" line — tracks the date-nav bar's viewDate,
    // so scrolling to another day updates this line too.
    const asOfDate = new Date(viewDate);
    const asOf = asOfDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return `<div class="it-header">
      <h3 class="it-title">In Time</h3>
      <p class="it-lede">The cards you're ruled by as of <em>${asOf}</em>, age ${age}.</p>
    </div>
    <div class="it-row">${rowHTML}</div>
    ${dateNavHTML()}`;
  }

  function renderInTime(card) {
    const root = document.getElementById('fInTime');
    if (!root) return false;
    const inner = root.querySelector('.it-inner') || root;
    root.classList.remove('is-empty');
    _lastCard = card || null;
    if (!card || card.suit === 'joker') {
      root.classList.add('is-empty');
      inner.innerHTML = '';
      return false;
    }
    const html = panelHTML(card);
    if (!html) { root.classList.add('is-empty'); inner.innerHTML = ''; return false; }
    inner.innerHTML = html;
    return true;
  }

  window.renderInTime = renderInTime;
  document.addEventListener('DOMContentLoaded', wireDateNav);
})();
