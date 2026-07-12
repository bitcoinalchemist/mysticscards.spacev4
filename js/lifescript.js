// lifescript.js — the Finder Life Script panel (2026-07-10, extracted
// from cardsdata.js's renderLifeScriptInto; dates + displacement
// chips added 2026-07-10).
//
// Reads LIFE_SCRIPTS + SPREAD_PLANETS + SPREAD_PLANET_SYM + spreadCardPips
// + CARDS + CARD_READINGS + SPREAD_CARDS + slDisplaces + slDisplacedBy
// via classic-script globals. Loaded after cardsdata.js.
//
// The picked card has seven "ruling" cards, one for each of the seven
// classical planets in the site's cardology system. Rendered in reverse
// order (Neptune → Mercury) so the wheel reads outward-inward like
// Richmond's plates. The selected birth card's own dates, displacement,
// and planetary correspondences render once in a compact stats block,
// instead of repeating under every ruling card.
//
// PUBLIC on window:
//   window.renderLifeScript(card) — populates `#fLifeScript`. Returns
//     TRUE when there's real content, FALSE when the pick has no
//     Life Script entry (Joker gets a short prose note instead — that
//     still returns TRUE so the chip stays enabled).

(function () {
  'use strict';

  const SUIT_FROM_SYM = { '♥':'hearts', '♦':'diamonds', '♣':'clubs', '♠':'spades' };
  const RANK_NAMES = {
    A: 'Ace',
    '2': 'Two',
    '3': 'Three',
    '4': 'Four',
    '5': 'Five',
    '6': 'Six',
    '7': 'Seven',
    '8': 'Eight',
    '9': 'Nine',
    '10': 'Ten',
    J: 'Jack',
    Q: 'Queen',
    K: 'King'
  };

  function parseCard(str) {
    const sym = str.slice(-1);
    return { rank: str.slice(0, -1), sym, suit: SUIT_FROM_SYM[sym] };
  }

  function fullCardName(card) {
    return `${RANK_NAMES[card.rank] || card.rank} of ${card.suit[0].toUpperCase() + card.suit.slice(1)}`;
  }

  // Displacement ghost chips for one ruling card — mirrors the
  // Quadrations grid's .sl-ghost pair (Displaces / Displaced by).
  // `idx` is the card's position in CARDS/SPREAD_CARDS' shared solar
  // order (what slDisplaces/slDisplacedBy expect). Fixed/semi-fixed
  // cards (where the seat displaces itself) render a hidden self chip,
  // same as the grid's `.sl-ghost-self` treatment.
  function ghostRowHTML(idx) {
    if (typeof slDisplaces !== 'function' || typeof slDisplacedBy !== 'function' ||
        typeof SPREAD_CARDS === 'undefined' || idx < 0) return '';
    const pairs = [
      ['Displaces', slDisplaces(idx)],
      ['Displaced by', slDisplacedBy(idx)]
    ];
    const chips = pairs.map(function (pair) {
      const verb = pair[0], oIdx = pair[1];
      const oc = SPREAD_CARDS[oIdx];
      if (!oc) return '';
      const selfCls = oIdx === idx ? ' ls-ghost-self' : '';
      return `<div class="ls-ghost-pair">
        <div class="ls-ghost-label">${verb}</div>
        <span class="ls-ghost ${oc.suit}${selfCls}" title="${verb} ${oc.rank}${oc.sym}">${oc.rank}${oc.sym}</span>
      </div>`;
    }).join('');
    return `<div class="ls-ghost-row">${chips}</div>`;
  }

  function earthlySeatPlanetsHTML(card) {
    if (typeof deckAtAge !== 'function' || typeof CARDS === 'undefined') return '';
    const idx = CARDS.findIndex(function (x) { return x.rank === card.rank && x.suit === card.suit; });
    if (idx < 0) return '';
    const life = deckAtAge(1);
    const pos = life.indexOf(idx);
    if (pos < 0) return '';
    if (pos >= 49) {
      return `<span class="ls-stat-chip" title="Crown row">${SPREAD_PLANET_SYM.Crown} Crown</span>`;
    }
    const rowPlanet = SPREAD_PLANETS[Math.floor(pos / 7)];
    const colPlanet = SPREAD_PLANETS[pos % 7];
    return [
      `<span class="ls-stat-chip" title="Row">${SPREAD_PLANET_SYM[rowPlanet]} ${rowPlanet}</span>`,
      `<span class="ls-stat-chip" title="Column">${SPREAD_PLANET_SYM[colPlanet]} ${colPlanet}</span>`
    ].join('');
  }

  function birthStatsHTML(card, script) {
    const key = `${card.rank}_${card.suit}`;
    const entry = (window.CARD_READINGS || {})[key];
    const dates = entry && entry.dates ? entry.dates : '';
    const idx = (typeof CARDS !== 'undefined')
      ? CARDS.findIndex(function (x) { return x.rank === card.rank && x.suit === card.suit; })
      : -1;
    const planetsHTML = earthlySeatPlanetsHTML(card);

    return `<div class="ls-stats">
      ${dates ? `<div class="ls-stat-block">
        <div class="ls-stat-label">Dates</div>
        <div class="ls-stat-text">${dates}</div>
      </div>` : ''}
      <div class="ls-stat-block">
        <div class="ls-stat-label">Displacements</div>
        ${ghostRowHTML(idx)}
      </div>
      <div class="ls-stat-block">
        <div class="ls-stat-label">Planets</div>
        <div class="ls-stat-chips">${planetsHTML}</div>
      </div>
    </div>`;
  }

  function scriptRowHTML(card, highlight) {
    const key = `${card.rank}_${card.suit}`;
    const script = (typeof LIFE_SCRIPTS !== 'undefined' ? LIFE_SCRIPTS : {})[key];
    if (!script) return '';
    const displayScript = [...script].reverse();
    const planetOrder = [6,5,4,3,2,1,0];
    return displayScript.map((cardStr, i) => {
      const cc = parseCard(cardStr);
      const planet = SPREAD_PLANETS[planetOrder[i]];
      const label = planet.slice(0, 3).toUpperCase();
      const sym = SPREAD_PLANET_SYM[planet];
      const isPick = highlight && cc.rank === highlight.rank && cc.suit === highlight.suit;
      const face = typeof spreadCardPips === 'function'
        ? spreadCardPips(cc)
        : `<span class="ls-token">${cc.rank}${cc.sym}</span>`;
      const idx = (typeof CARDS !== 'undefined')
        ? CARDS.findIndex(function (x) { return x.rank === cc.rank && x.suit === cc.suit; })
        : -1;
      return `<div class="ls-col" data-planet="${planet}">
        <span class="ls-planet-glyph" title="${planet}">${sym}</span>
        <span class="ls-planet-name" title="${planet}">${label}</span>
        <div class="spread-card ls-card ${cc.suit}${isPick ? ' ls-conn-pick' : ''}" data-idx="${idx}" role="button" tabindex="0" aria-label="Load ${fullCardName(cc)} in finder">${face}</div>
      </div>`;
    }).join('');
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

    const rowHTML = scriptRowHTML(card);

    return `${birthStatsHTML(card, script)}
    <div class="ls-header">
      <h3 class="ls-title">Life Script</h3>
    </div>
    <div class="ls-row">${rowHTML}</div>`;
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
    bindLifeScriptCardClicks(inner);
    return true;
  }

  function bindLifeScriptCardClicks(root) {
    if (!root) return;
    root.querySelectorAll('.ls-card[data-idx]').forEach(function (el) {
      const idx = +el.dataset.idx;
      if (!Number.isInteger(idx) || idx < 0) return;
      const open = function () {
        if (typeof window.loadCardInFinder === 'function') window.loadCardInFinder(idx);
      };
      el.style.cursor = 'pointer';
      el.onclick = open;
      el.onkeydown = function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        open();
      };
    });
  }

  function renderRelationshipConnections(card, partner) {
    const root = document.getElementById('fLifeScript');
    if (!root) return false;
    const inner = root.querySelector('.ls-inner') || root;
    root.classList.remove('is-empty');
    if (!card || !partner || card.suit === 'joker' || partner.suit === 'joker' ||
        typeof window.lifeScriptConnection !== 'function') {
      root.classList.add('is-empty');
      inner.innerHTML = '';
      return false;
    }

    const forward = window.lifeScriptConnection(card, partner);
    const backward = window.lifeScriptConnection(partner, card);
    if (!forward && !backward) {
      root.classList.add('is-empty');
      inner.innerHTML = '';
      return false;
    }

    const sections = [];
    if (forward) {
      sections.push(`<section class="ls-connection">
        <p class="ls-connection-title"><b>${fullCardName(partner)}</b> sits in <b>${fullCardName(card)}</b>'s <b>${forward.planet}</b> seat.</p>
        <div class="ls-row">${scriptRowHTML(card, partner)}</div>
        <p class="ls-connection-gloss">${(window.PLANET_CONN_TEXT || {})[forward.planet] || ''}</p>
      </section>`);
    }
    if (backward) {
      sections.push(`<section class="ls-connection">
        <p class="ls-connection-title"><b>${fullCardName(card)}</b> sits in <b>${fullCardName(partner)}</b>'s <b>${backward.planet}</b> seat.</p>
        <div class="ls-row">${scriptRowHTML(partner, card)}</div>
        <p class="ls-connection-gloss">${(window.PLANET_CONN_TEXT || {})[backward.planet] || ''}</p>
      </section>`);
    }

    inner.innerHTML = `<div class="ls-connections-wrap">
      <div class="ls-connections-head">
        <h3 class="ls-title">Connections</h3>
      </div>
      ${sections.join('')}
    </div>`;
    bindLifeScriptCardClicks(inner);
    return true;
  }

  window.renderLifeScript = renderLifeScript;
  window.renderRelationshipConnections = renderRelationshipConnections;
})();
