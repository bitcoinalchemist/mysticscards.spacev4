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
  const ZODIAC = [
    { name: 'Capricorn', glyph: '♑', ruler: 'Saturn', start: [12, 22], end: [1, 19] },
    { name: 'Aquarius', glyph: '♒', ruler: 'Saturn', start: [1, 20], end: [2, 18] },
    { name: 'Pisces', glyph: '♓', ruler: 'Jupiter', start: [2, 19], end: [3, 20] },
    { name: 'Aries', glyph: '♈', ruler: 'Mars', start: [3, 21], end: [4, 19] },
    { name: 'Taurus', glyph: '♉', ruler: 'Venus', start: [4, 20], end: [5, 20] },
    { name: 'Gemini', glyph: '♊', ruler: 'Mercury', start: [5, 21], end: [6, 20] },
    { name: 'Cancer', glyph: '♋', ruler: 'Moon', start: [6, 21], end: [7, 22] },
    { name: 'Leo', glyph: '♌', ruler: 'Sun', start: [7, 23], end: [8, 22] },
    { name: 'Virgo', glyph: '♍', ruler: 'Mercury', start: [8, 23], end: [9, 22] },
    { name: 'Libra', glyph: '♎', ruler: 'Venus', start: [9, 23], end: [10, 22] },
    { name: 'Scorpio', glyph: '♏', ruler: 'Mars', start: [10, 23], end: [11, 21] },
    { name: 'Sagittarius', glyph: '♐', ruler: 'Jupiter', start: [11, 22], end: [12, 21] }
  ];
  const SIDEREAL_LAHIRI_DAY_SHIFT = -24;
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

  function readsLeftToRight() {
    return !!(window.CardsStore && window.CardsStore.getQuadLtr && window.CardsStore.getQuadLtr());
  }

  function dateNumber(month, day) {
    return (month * 100) + day;
  }

  function zodiacForDate(month, day) {
    const value = dateNumber(month, day);
    return ZODIAC.find(function (sign) {
      const start = dateNumber(sign.start[0], sign.start[1]);
      const end = dateNumber(sign.end[0], sign.end[1]);
      return start <= end
        ? value >= start && value <= end
        : value >= start || value <= end;
    }) || null;
  }

  function shiftedDate(month, day, shiftDays) {
    const dt = new Date(Date.UTC(2001, month - 1, day + shiftDays));
    return { month: dt.getUTCMonth() + 1, day: dt.getUTCDate() };
  }

  function selectedBirthDateForCard(card) {
    const mEl = document.getElementById('fMonth');
    const dEl = document.getElementById('fDay');
    const month = mEl ? parseInt(mEl.value, 10) : NaN;
    const day = dEl ? parseInt(dEl.value, 10) : NaN;
    if (!month || !day || typeof window.solarValue !== 'function') return null;
    if (window.solarValue(month, day) !== card.sv) return null;
    return { month, day };
  }

  function rulingCardChipHTML(sign, script) {
    if (!sign) return '';
    const planetIdx = SPREAD_PLANETS.indexOf(sign.ruler);
    const cardStr = planetIdx >= 0 ? script[planetIdx] : '';
    return cardStr ? (function () {
      const c = parseCard(cardStr);
      return `<span class="ls-stat-chip ls-zodiac-card ${c.suit}" title="${sign.ruler} ruling card">${c.rank}${c.sym}</span>`;
    })() : '<span class="ls-stat-note">No seven-planet card seat</span>';
  }

  function zodiacStatsHTML(card, script) {
    const date = selectedBirthDateForCard(card);
    if (!date) return '';
    const sign = zodiacForDate(date.month, date.day);
    if (!sign) return '';
    const siderealDate = shiftedDate(date.month, date.day, SIDEREAL_LAHIRI_DAY_SHIFT);
    const siderealSign = zodiacForDate(siderealDate.month, siderealDate.day);
    const rulingCardHTML = rulingCardChipHTML(sign, script);
    const signText = `${sign.glyph} ${sign.name}`;
    const rulerGlyph = SPREAD_PLANET_SYM[sign.ruler] || '';
    const rulerText = rulerGlyph ? `${rulerGlyph} ${sign.ruler}` : sign.ruler;
    const siderealRulerGlyph = siderealSign && SPREAD_PLANET_SYM[siderealSign.ruler] || '';
    const siderealRulerText = siderealSign
      ? (siderealRulerGlyph ? `${siderealRulerGlyph} ${siderealSign.ruler}` : siderealSign.ruler)
      : '';
    const siderealHTML = siderealSign ? `<div class="ls-zodiac-line">
        <span class="ls-zodiac-kind">Sidereal</span>
        <span class="ls-stat-chip" title="Sidereal sign, Lahiri-style birthday approximation">${siderealSign.glyph} ${siderealSign.name}</span>
        <span class="ls-stat-chip" title="Sidereal classical sign ruler">${siderealRulerText}</span>
        ${rulingCardChipHTML(siderealSign, script)}
      </div>` : '';
    return `<div class="ls-stat-block">
      <div class="ls-stat-label">Zodiac</div>
      <div class="ls-zodiac-stack">
        <div class="ls-zodiac-line">
          <span class="ls-zodiac-kind">Tropical</span>
          <span class="ls-stat-chip" title="Tropical sun sign">${signText}</span>
          <span class="ls-stat-chip" title="Classical sign ruler">${rulerText}</span>
          ${rulingCardHTML}
        </div>
        ${siderealHTML}
      </div>
    </div>`;
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
        <span class="ls-stat-chip ls-zodiac-card ls-ghost ${oc.suit}${selfCls}" title="${verb} ${oc.rank}${oc.sym}">${oc.rank}${oc.sym}</span>
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
      ${zodiacStatsHTML(card, script)}
    </div>`;
  }

  function scriptRowHTML(card, highlight) {
    const key = `${card.rank}_${card.suit}`;
    const script = (typeof LIFE_SCRIPTS !== 'undefined' ? LIFE_SCRIPTS : {})[key];
    if (!script) return '';
    const ltr = readsLeftToRight();
    const displayScript = ltr ? [...script] : [...script].reverse();
    const planetOrder = ltr ? [0,1,2,3,4,5,6] : [6,5,4,3,2,1,0];
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

  function parkSolarPanel(root) {
    const panel = document.getElementById('fSolar');
    if (panel && root && panel.parentNode !== root) root.appendChild(panel);
  }

  function mountSolarPanel(root) {
    const panel = document.getElementById('fSolar');
    const stats = root && root.querySelector('.ls-stats');
    if (!panel || !stats) return;
    const datesBlock = stats.querySelector('.ls-stat-block');
    if (datesBlock && datesBlock.nextSibling) stats.insertBefore(panel, datesBlock.nextSibling);
    else stats.appendChild(panel);
    if (window.SolarTime && typeof window.SolarTime.refresh === 'function') window.SolarTime.refresh();
  }

  function renderLifeScript(card) {
    const root = document.getElementById('fLifeScript');
    if (!root) return false;
    const inner = root.querySelector('.ls-inner') || root;
    parkSolarPanel(root);
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
    mountSolarPanel(inner);
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
    parkSolarPanel(root);
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
