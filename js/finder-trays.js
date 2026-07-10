// finder-trays.js — the Finder's inline picker trays for v4. Saved
// Birthdays, Calendar, and Solar Values all unfold under the Finder, with
// one tray open at a time.
//
// v4 first pass (2026-07-09), then inline Saved Birthdays / flatter tray
// polish:
//   - Calendar picks a specific date and honours the You/Partner target
//     from js/birthdays.js (window.bdayTarget).
//   - Solar Values shows the live formula + a full 52-card + Joker browse
//     grid, and now honours the shared You/Partner target too.
//   - The deck grid is a plain 7-wide wrap (rank+suit chips), not v3's
//     planetary crown-row layout — visual polish to reconsider later,
//     not required to be usable now.
//
// Loaded as a classic script AFTER birthdays.js (window.setBdayTarget /
// bdayTarget / defaultTarget) and finder.js (window.loadDateInFinder,
// window.loadCardInFinder, window.solarValue, window.MONTH_NAMES,
// window.DAYS_IN_MONTH). Reads the bare `SPREAD_CARDS` global from
// cardsdata.js.
(function () {
  'use strict';

  const SUIT_SYM = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
  const SUIT_COLS = ['hearts', 'clubs', 'diamonds', 'spades'];
  let _svFoundIdx = null;
  let _svBase = 10;

  function relOn() {
    const f = document.getElementById('finder');
    return !!(f && f.classList.contains('rel-on'));
  }

  function dozenal(n) {
    return String(n);
  }

  function fmtBase(n) {
    if (_svBase === 12) {
      return dozenal(Number(n).toString(12).toUpperCase());
    }
    return String(n);
  }

  function syncBaseBtn() {
    const btn = document.getElementById('svBaseBtn');
    if (!btn) return;
    btn.textContent = _svBase === 12 ? 'base12' : 'base10';
    btn.setAttribute('aria-pressed', _svBase === 12 ? 'true' : 'false');
    btn.setAttribute('title', _svBase === 12 ? 'Solar Values in base 12' : 'Solar Values in base 10');
  }

  function applySolarBase(base) {
    _svBase = base === 12 ? 12 : 10;
    if (window.CardsStore && typeof window.CardsStore.setSolarBase === 'function') {
      window.CardsStore.setSolarBase(_svBase);
    }
    syncBaseBtn();
    buildBrowseGrid();
    svCalcUpdate();
  }

  // ── Solar Values: deck browse grid ──────────────────────────────
  function cell(idx) {
    const isJoker = idx === 52;
    const c = isJoker ? null : SPREAD_CARDS[idx];
    const sv = isJoker ? 0 : idx + 1;
    const suitCls = isJoker ? 'joker' : c.suit;
    const found = idx === _svFoundIdx ? ' sv-found' : '';
    const tok = isJoker
      ? '<span class="cal-token cal-token-joker">JOKER</span>'
      : `<span class="cal-token">${c.rank}${SUIT_SYM[c.suit]}</span>`;
    const title = isJoker ? 'Load the Joker' : `Load ${c.rank} of ${c.suit}`;
    return `<button type="button" class="browse-cell${found}" data-idx="${idx}" title="${title}">`
         + `<span class="browse-sv">${fmtBase(sv)}</span><span class="cal-chip ${suitCls}">${tok}</span></button>`;
  }

  function cardIdx(rank, suit) {
    for (let i = 0; i < SPREAD_CARDS.length; i++) {
      const c = SPREAD_CARDS[i];
      if (c.rank === rank && c.suit === suit) return i;
    }
    return -1;
  }

  function buildBrowseGrid() {
    const grid = document.getElementById('browseGrid');
    if (!grid) return;
    let html = '';
    SUIT_COLS.forEach(suit => {
      html += `<div class="browse-head browse-head--${suit}">${suit}</div>`;
    });
    ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].forEach((rank) => {
      SUIT_COLS.forEach(suit => {
        const idx = cardIdx(rank, suit);
        html += idx >= 0 ? cell(idx) : '<div class="browse-gap" aria-hidden="true"></div>';
      });
    });
    html += '<div class="browse-joker-row"><div class="browse-joker-wrap">';
    html += '<div class="browse-head browse-head--joker">joker</div>';
    html += cell(52);
    html += '</div></div>';
    grid.innerHTML = html;
  }

  function svHighlight(idx) {
    _svFoundIdx = idx;
    buildBrowseGrid();
    if (idx != null) {
      const el = document.getElementById('browseGrid').querySelector(`[data-idx="${idx}"]`);
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }

  function svCalcUpdate() {
    const d = parseInt(document.getElementById('svDay').value, 10);
    const m = parseInt(document.getElementById('svMonth').value, 10);
    const fEl = document.getElementById('svFormula');
    const valid = Number.isInteger(m) && Number.isInteger(d) && m >= 1 && m <= 12 && d >= 1 && d <= 31;
    if (!valid) {
      const fiftyFive = fmtBase(55);
      const two = fmtBase(2);
      fEl.innerHTML = `Solar Value &nbsp;=&nbsp; <strong>${fiftyFive}</strong> &nbsp;&minus;&nbsp; (${two} &times; month &nbsp;+&nbsp; day)`;
      svHighlight(null);
      return;
    }
    const sv = window.solarValue(m, d);
    const idx = sv === 0 ? 52 : sv - 1;
    const name = idx === 52 ? 'The Joker' : `${SPREAD_CARDS[idx].rank} of ${SPREAD_CARDS[idx].suit}`;
    const fiftyFive = fmtBase(55);
    const two = fmtBase(2);
    fEl.innerHTML = `Solar Value &nbsp;=&nbsp; ${fiftyFive} &minus; (${two} &times; ${fmtBase(m)} + ${fmtBase(d)}) &nbsp;=&nbsp; <strong>${fmtBase(sv)}</strong> &nbsp;&rarr;&nbsp; <span class="sv-result-card">${name}</span>`;
    svHighlight(idx);
  }

  function deckPickCard(idx) {
    const target = typeof window.bdayTarget === 'function' ? window.bdayTarget() : 'self';
    if (idx === 52) {
      if (typeof window.loadDateInFinder === 'function') window.loadDateInFinder(12, 31, target);
      return;
    }
    const date = firstDateForSvLocal(idx + 1);
    if (date && typeof window.loadDateInFinder === 'function') {
      window.loadDateInFinder(date.month, date.day, target);
      return;
    }
    if (typeof window.loadCardInFinder === 'function') window.loadCardInFinder(idx);
  }

  function firstDateForSvLocal(sv) {
    for (let m = 1; m <= 12; m++) {
      const d = 55 - (2 * m) - sv;
      if (d >= 1 && d <= window.DAYS_IN_MONTH[m]) return { month: m, day: d };
    }
    return null;
  }

  // ── Calendar ─────────────────────────────────────────────────────
  function buildCalendar() {
    const gridEl = document.getElementById('calGrid');
    if (!gridEl) return;
    const MN = window.MONTH_NAMES, DIM = window.DAYS_IN_MONTH;
    const now = new Date();
    const tM = now.getMonth() + 1, tD = now.getDate();
    let html = '<div class="cal-desktop-grid"><div class="cal-col-header"></div>';
    for (let m = 1; m <= 12; m++) html += `<div class="cal-col-header">${MN[m]}</div>`;
    for (let d = 1; d <= 31; d++) {
      html += `<div class="cal-row-label">${d}</div>`;
      for (let m = 1; m <= 12; m++) {
        if (d > DIM[m]) { html += '<div class="cal-cell-empty"></div>'; continue; }
        const sv = window.solarValue(m, d);
        const idx = sv === 0 ? 52 : sv - 1;
        const isJoker = idx === 52;
        const c = isJoker ? null : SPREAD_CARDS[idx];
        const isToday = m === tM && d === tD;
        const tok = isJoker
          ? '<span class="cal-token cal-token-joker">JOKER</span>'
          : `<span class="cal-token">${c.rank}${SUIT_SYM[c.suit]}</span>`;
        const title = isJoker ? 'Load the Joker' : `Load ${c.rank} of ${c.suit}`;
        html += `<button type="button" class="cal-day${isToday ? ' cal-today' : ''}" data-m="${m}" data-d="${d}" title="${title}">`
             + `<span class="cal-chip ${isJoker ? 'joker' : c.suit}">${tok}</span></button>`;
      }
    }
    html += '</div>';
    gridEl.innerHTML = html;
  }

  function calPickDate(m, d) {
    const target = typeof window.bdayTarget === 'function' ? window.bdayTarget() : 'self';
    if (typeof window.loadDateInFinder === 'function') window.loadDateInFinder(m, d, target);
    // Tray stays open — the result updates above; keep exploring.
  }

  // ── Tray accordion ───────────────────────────────────────────────
  const TRAYS = { bday: 'finderBdayBtn', cal: 'finderCalBtn', deck: 'finderDeckBtn' };
  function trayBtn(key) { return document.getElementById(TRAYS[key]); }
  function closeTray(key) {
    const t = document.getElementById(key + 'TrayWrap'); if (t) t.classList.remove('open');
    const b = trayBtn(key); if (b) { b.classList.remove('is-active'); b.setAttribute('aria-expanded', 'false'); }
  }
  function closeOtherTrays(except) {
    Object.keys(TRAYS).forEach(k => { if (k !== except) closeTray(k); });
  }
  function openTray(key) {
    closeOtherTrays(key);
    if (key === 'bday') {
      if (typeof window.prepareBirthTray === 'function') window.prepareBirthTray();
    } else if (key === 'cal') buildCalendar();
    else buildBrowseGrid();
    const tgt = document.getElementById(key + 'Target');
    if (tgt) tgt.hidden = !relOn();
    if (typeof window.setBdayTarget === 'function') {
      window.setBdayTarget(relOn() && typeof window.defaultTarget === 'function' ? window.defaultTarget() : 'self');
    }
    const t = document.getElementById(key + 'TrayWrap'); if (t) t.classList.add('open');
    const b = trayBtn(key); if (b) { b.classList.add('is-active'); b.setAttribute('aria-expanded', 'true'); }
  }
  function toggleTray(key) {
    const t = document.getElementById(key + 'TrayWrap');
    if (!t) return;
    t.classList.contains('open') ? closeTray(key) : openTray(key);
  }
  window.toggleFinderTray = toggleTray;
  window.openFinderTray = openTray;
  window.closeFinderTray = closeTray;
  window.refreshFinderTrayTargets = function refreshFinderTrayTargets() {
    Object.keys(TRAYS).forEach(key => {
      const tray = document.getElementById(key + 'TrayWrap');
      const target = document.getElementById(key + 'Target');
      if (!tray || !target || !tray.classList.contains('open')) return;
      target.hidden = !relOn();
      if (typeof window.setBdayTarget === 'function') {
        window.setBdayTarget(relOn() && typeof window.defaultTarget === 'function' ? window.defaultTarget() : 'self');
      }
    });
  };

  function wire() {
    [['finderBdayBtn', 'bday'], ['finderCalBtn', 'cal'], ['finderDeckBtn', 'deck']].forEach(pair => {
      const b = document.getElementById(pair[0]);
      if (b) b.addEventListener('click', () => toggleTray(pair[1]));
    });
    ['svDay', 'svMonth'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', svCalcUpdate);
    });
    const baseBtn = document.getElementById('svBaseBtn');
    if (baseBtn) baseBtn.addEventListener('click', () => applySolarBase(_svBase === 12 ? 10 : 12));
    const browseGrid = document.getElementById('browseGrid');
    if (browseGrid) browseGrid.addEventListener('click', ev => {
      const c = ev.target.closest('.browse-cell');
      if (!c) return;
      const idx = parseInt(c.dataset.idx, 10);
      if (Number.isInteger(idx)) deckPickCard(idx);
    });
    const calGrid = document.getElementById('calGrid');
    if (calGrid) calGrid.addEventListener('click', ev => {
      const day = ev.target.closest('.cal-day');
      if (!day) return;
      const m = parseInt(day.dataset.m, 10), d = parseInt(day.dataset.d, 10);
      if (Number.isInteger(m) && Number.isInteger(d)) calPickDate(m, d);
    });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      Object.keys(TRAYS).forEach(k => {
        const t = document.getElementById(k + 'TrayWrap');
        if (t && t.classList.contains('open')) closeTray(k);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('finderCalBtn')) return;
    if (window.CardsStore && typeof window.CardsStore.getSolarBase === 'function') {
      _svBase = window.CardsStore.getSolarBase();
    }
    syncBaseBtn();
    wire();
  });
})();
