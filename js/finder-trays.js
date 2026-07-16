// finder-trays.js — the Finder's inline picker trays. Saved Birthdays
// and Solar Values unfold under the Finder, with one tray open at a
// time. (A Calendar tray also lived here through 2026-07-15; it was
// retired 2026-07-16 because the 12×31 grid was unreadable on phone
// widths. The extracted fragment lives in dev/retired/calendar/.)
//
//   - Solar Values shows the live formula + a full 52-card + Joker browse
//     grid, and honours the shared You/Partner target.
//   - The deck grid is a plain 7-wide wrap (rank+suit chips), not a
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
    const baseConst = document.getElementById('svBaseConst');
    if (baseConst) baseConst.textContent = _svBase === 12 ? '47' : '55';
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
    if (_svBase === 12) {
      html += '<p class="browse-base12-note">Kings are master numbers; 44 is the Master of Structure in numerology.</p>';
    }
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
    const fEl = document.getElementById('svFormulaResult');
    if (!fEl) return;
    const valid = Number.isInteger(m) && Number.isInteger(d) && m >= 1 && m <= 12 && d >= 1 && d <= 31;
    if (!valid) {
      fEl.innerHTML = '';
      svHighlight(null);
      return;
    }
    const sv = window.solarValue(m, d);
    const idx = sv === 0 ? 52 : sv - 1;
    const name = idx === 52 ? 'The Joker' : `${SPREAD_CARDS[idx].rank} of ${SPREAD_CARDS[idx].suit}`;
    fEl.innerHTML = `&nbsp;=&nbsp; <strong>${fmtBase(sv)}</strong> &nbsp;&rarr;&nbsp; <span class="sv-result-card">${name}</span>`;
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
      const d = (_svBase === 12 ? 47 : 55) - (2 * m) - sv;
      if (d >= 1 && d <= window.DAYS_IN_MONTH[m]) return { month: m, day: d };
    }
    return null;
  }

  // ── Tray accordion ───────────────────────────────────────────────
  const TRAYS = { bday: 'finderBdayBtn', deck: 'finderDeckBtn' };
  function trayBtn(key) { return document.getElementById(TRAYS[key]); }
  function closeTray(key) {
    const t = document.getElementById(key + 'TrayWrap'); if (t) t.classList.remove('open');
    const b = trayBtn(key); if (b) { b.classList.remove('is-active'); b.setAttribute('aria-expanded', 'false'); }
  }
  function closeOtherTrays(except) {
    Object.keys(TRAYS).forEach(k => { if (k !== except) closeTray(k); });
  }

  function wireSvField(input, max, onAfterInput, options) {
    if (!input) return;
    options = options || {};
    input.addEventListener('focus', function () {
      requestAnimationFrame(() => {
        try { input.select(); } catch (e) {}
      });
    });
    input.addEventListener('input', function () {
      input.value = input.value.replace(/\D+/g, '').slice(0, 2);
      const n = parseInt(input.value, 10);
      if (!input.value || !Number.isInteger(n)) {
        onAfterInput();
        return;
      }
      if (options.allowLeadingZero && input.value === '0') {
        onAfterInput();
        return;
      }
      if (n < 1) input.value = '1';
      else if (n > max) input.value = String(max);
      onAfterInput();
    });
    input.addEventListener('blur', function () {
      if (!input.value) {
        onAfterInput();
        return;
      }
      const n = parseInt(input.value, 10);
      if (!Number.isInteger(n)) {
        input.value = '';
        onAfterInput();
        return;
      }
      if (n < 1) input.value = '1';
      else if (n > max) input.value = String(max);
      else if (options.allowLeadingZero) input.value = String(n);
      onAfterInput();
    });
  }
  function openTray(key) {
    closeOtherTrays(key);
    if (key === 'bday') {
      if (typeof window.prepareBirthTray === 'function') window.prepareBirthTray();
    } else buildBrowseGrid();
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
    [['finderBdayBtn', 'bday'], ['finderDeckBtn', 'deck']].forEach(pair => {
      const b = document.getElementById(pair[0]);
      if (b) b.addEventListener('click', () => toggleTray(pair[1]));
    });
    const svDay = document.getElementById('svDay');
    const svMonth = document.getElementById('svMonth');
    wireSvField(svMonth, 12, function () {
      if (svDay) {
        const m = parseInt(svMonth.value, 10);
        const maxDay = Number.isInteger(m) && window.DAYS_IN_MONTH && window.DAYS_IN_MONTH[m] ? window.DAYS_IN_MONTH[m] : 31;
        const d = parseInt(svDay.value, 10);
        if (Number.isInteger(d) && d > maxDay) svDay.value = String(maxDay);
      }
      svCalcUpdate();
    }, { allowLeadingZero: true });
    wireSvField(svDay, 31, svCalcUpdate);
    const baseBtn = document.getElementById('svBaseBtn');
    if (baseBtn) baseBtn.addEventListener('click', () => applySolarBase(_svBase === 12 ? 10 : 12));
    const browseGrid = document.getElementById('browseGrid');
    if (browseGrid) browseGrid.addEventListener('click', ev => {
      const c = ev.target.closest('.browse-cell');
      if (!c) return;
      const idx = parseInt(c.dataset.idx, 10);
      if (Number.isInteger(idx)) deckPickCard(idx);
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
    if (!document.getElementById('finderDeckBtn')) return;
    if (window.CardsStore && typeof window.CardsStore.getSolarBase === 'function') {
      _svBase = window.CardsStore.getSolarBase();
    }
    syncBaseBtn();
    wire();
  });
})();
