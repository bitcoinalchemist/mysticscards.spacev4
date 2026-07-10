// in-time.js — the "In Time" 6-card row (Birth / 13-Year / 7-Year /
// Yearly / 52-Day / Daily) for the Finder's picked card. Ported from
// v3/js/in-time.js 2026-07-10.
//
// v3 also owned a date-nav bar (view "as of" any date), five lazy-
// loaded ~490KB period-reading data files, and a period-reading
// popup with prev/next timeline nav. This first pass ships the
// visible 6-card row only; the date-nav + period popups can come
// back once we have the popup chrome and are ready to move that data
// into the bundle.
//
// The card math: for a given birth-card index B and current age A:
//   • Birth      → B (fixed for life)
//   • 13-Year    → deckAtAge(⌊A/91⌋+1) at position B, offset ⌊(A%91)/13⌋
//   • 7-Year     → deckAtAge(⌊A/49⌋+1) at position B, offset ⌊(A%49)/7⌋
//   • Yearly     → deckAtAge(⌊A/7⌋+1)  at position B, offset A%7
//   • 52-Day     → deckAtAge(A+1)      at position B, offset ⌊daysSinceBday/52⌋
//   • Daily      → deckAtAge(weeksAlive%90+1) at position B, offset weekdayShift
//
// Reads deckAtAge / SPREAD_PLANETS / SPREAD_PLANET_SYM / CARDS /
// spreadCardPips via classic-script globals. Loaded after cardsdata.js
// and after spread-grid.js (which owns the `currentAge` global that
// tells us the reader's real age).
//
// PUBLIC on window:
//   window.renderInTime(card) — populates `#fInTime`. Returns TRUE
//     when there's real content; FALSE for the Joker or when the age
//     stepper is missing (the row needs an age to compute derived
//     cards).

(function () {
  'use strict';

  const WD_LONG = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

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

    const age = (typeof currentAge === 'number' ? currentAge : 0);
    const viewDate = localMidnight(new Date());
    const realLbYear = lastBdayYearOf(Date.now(), date.m, date.d);
    const birthYear  = realLbYear - age;
    const viewLbYear = lastBdayYearOf(viewDate, date.m, date.d);

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
      { idx: birthIdx, label: 'Birth',   planet: null,                    sub: (CARDS[birthIdx] && CARDS[birthIdx].name) || '' },
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

    // Human-readable "as of" line so readers know the Daily / 52-Day cards
    // are tied to today. When a date-nav bar comes back, this row updates
    // itself.
    const asOfDate = new Date(viewDate);
    const asOf = asOfDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return `<div class="it-header">
      <h3 class="it-title">In Time</h3>
      <p class="it-lede">Your birth card, and the derived cards you're currently ruled by. As of <em>${asOf}</em>, age ${age}.</p>
    </div>
    <div class="it-row">${rowHTML}</div>`;
  }

  function renderInTime(card) {
    const root = document.getElementById('fInTime');
    if (!root) return false;
    const inner = root.querySelector('.it-inner') || root;
    root.classList.remove('is-empty');
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
})();
