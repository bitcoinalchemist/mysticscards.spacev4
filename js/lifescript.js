// lifescript.js — the Finder Life Script panel (2026-07-10, ported
// from v3's renderLifeScriptInto in cardsdata.js).
//
// Reads LIFE_SCRIPTS + SPREAD_PLANETS + SPREAD_PLANET_SYM + spreadCardPips
// via classic-script globals. Loaded after cardsdata.js.
//
// The picked card has seven "ruling" cards, one for each of the seven
// classical planets in the site's cardology system. Rendered in reverse
// order (Neptune → Mercury) so the wheel reads outward-inward like
// Richmond's plates.
//
// PUBLIC on window:
//   window.renderLifeScript(card) — populates `#fLifeScript`. Returns
//     TRUE when there's real content, FALSE when the pick has no
//     Life Script entry (Joker gets a short prose note instead — that
//     still returns TRUE so the chip stays enabled).

(function () {
  'use strict';

  const SUIT_FROM_SYM = { '♥':'hearts', '♦':'diamonds', '♣':'clubs', '♠':'spades' };

  function parseCard(str) {
    const sym = str.slice(-1);
    return { rank: str.slice(0, -1), sym, suit: SUIT_FROM_SYM[sym] };
  }

  function panelHTML(card) {
    if (card.suit === 'joker') {
      return `<div class="ls-header">
        <h3 class="ls-title">Life Script</h3>
        <p class="ls-lede">The Joker's script</p>
      </div>
      <p class="ls-joker-note">The Joker sits above the Sun Line in every Master Script and belongs to no single planetary influence. The 52 cards account for 52 weeks, leaving 1&frac14; days as remainder. Without a fixed life path, the Joker's work is to consciously choose which card to embody.</p>`;
    }
    const key = `${card.rank}_${card.suit}`;
    const script = (typeof LIFE_SCRIPTS !== 'undefined' ? LIFE_SCRIPTS : {})[key];
    if (!script) return '';

    const displayScript = [...script].reverse();          // Neptune first
    const planetOrder   = [6,5,4,3,2,1,0];                 // Neptune → Mercury
    const rowHTML = displayScript.map((cardStr, i) => {
      const cc     = parseCard(cardStr);
      const planet = SPREAD_PLANETS[planetOrder[i]];
      const label  = planet.slice(0,3).toUpperCase();
      const sym    = SPREAD_PLANET_SYM[planet];
      const face   = typeof spreadCardPips === 'function'
        ? spreadCardPips(cc)
        : `<span class="ls-token">${cc.rank}${cc.sym}</span>`;
      return `<div class="ls-col" data-planet="${planet}">
        <span class="ls-planet-glyph" title="${planet}">${sym}</span>
        <span class="ls-planet-name" title="${planet}">${label}</span>
        <div class="spread-card ls-card ${cc.suit}">${face}</div>
      </div>`;
    }).join('');

    // Planet-connection prose stack — one line per seat, gives readers
    // the meaning of each of the seven planetary influences on this
    // card, in the same Neptune→Mercury display order as the row.
    const connHTML = displayScript.map((cardStr, i) => {
      const cc     = parseCard(cardStr);
      const planet = SPREAD_PLANETS[planetOrder[i]];
      const conn   = (window.PLANET_CONN_TEXT || {})[planet] || '';
      return `<div class="ls-conn">
        <div class="ls-conn-head">
          <span class="ls-conn-glyph">${SPREAD_PLANET_SYM[planet]}</span>
          <span class="ls-conn-planet">${planet}</span>
          <span class="ls-conn-card">${cc.rank}<span class="ls-conn-sym">${cc.sym}</span></span>
        </div>
        <p class="ls-conn-text">${conn}</p>
      </div>`;
    }).join('');

    return `<div class="ls-header">
      <h3 class="ls-title">Life Script</h3>
      <p class="ls-lede">The seven ruling cards of ${card.rank === 'A' ? 'the Ace' : ''}${card.rank !== 'A' ? card.rank : ''} of ${card.suit[0].toUpperCase() + card.suit.slice(1)}, from Neptune to Mercury.</p>
    </div>
    <div class="ls-row">${rowHTML}</div>
    <div class="ls-connections">${connHTML}</div>`;
  }

  function renderLifeScript(card) {
    const root = document.getElementById('fLifeScript');
    if (!root) return false;
    const inner = root.querySelector('.ls-inner') || root;
    root.classList.remove('is-empty');
    if (!card) { root.classList.add('is-empty'); inner.innerHTML = ''; return false; }
    // Joker: has its own prose note but still returns true so the chip
    // stays enabled and the reader can visit the panel for context.
    if (card.suit === 'joker') {
      inner.innerHTML = panelHTML(card);
      return true;
    }
    const key = `${card.rank}_${card.suit}`;
    if (!(typeof LIFE_SCRIPTS !== 'undefined' && LIFE_SCRIPTS[key])) {
      root.classList.add('is-empty');
      inner.innerHTML = '';
      return false;
    }
    inner.innerHTML = panelHTML(card);
    return true;
  }

  window.renderLifeScript = renderLifeScript;
})();
