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
    { name: 'Scorpio', glyph: '♏', ruler: 'Pluto', start: [10, 23], end: [11, 21] },
    { name: 'Sagittarius', glyph: '♐', ruler: 'Jupiter', start: [11, 22], end: [12, 21] }
  ];
  const SIDEREAL_LAHIRI_DAY_SHIFT = -24;

  // Decan tables — 3 decans per sign, 36 total.
  //
  // Chaldean / Egyptian decans: a fixed 7-planet rotation starting at
  // Aries 0–10° = Mars. Order = Mars, Sun, Venus, Mercury, Moon, Saturn,
  // Jupiter (the Chaldean weekday order). Each global decan (0..35) picks
  // CHALDEAN_ORDER[globalDecan % 7].
  const CHALDEAN_ORDER = ['Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter'];

  // Ptolemaic / triplicity decans: 1st decan = sign's own classical
  // ruler, 2nd = next sign of same element's ruler, 3rd = third sign of
  // same element's ruler. Uses only classical rulers (so Scorpio stays
  // Mars-Jupiter-Moon here even though its Zodiac-line ruler is set to
  // Pluto/modern). Indexed in astrological sign order (0 = Aries).
  const PTOLEMAIC_DECANS = [
    ['Mars',    'Sun',     'Jupiter'],   // Aries       — Fire (Mars, Sun, Jupiter)
    ['Venus',   'Mercury', 'Saturn'],    // Taurus      — Earth (Venus, Mercury, Saturn)
    ['Mercury', 'Venus',   'Saturn'],    // Gemini      — Air (Mercury, Venus, Saturn)
    ['Moon',    'Mars',    'Jupiter'],   // Cancer      — Water (Moon, Mars, Jupiter)
    ['Sun',     'Jupiter', 'Mars'],      // Leo         — Fire
    ['Mercury', 'Saturn',  'Venus'],     // Virgo       — Earth
    ['Venus',   'Saturn',  'Mercury'],   // Libra       — Air
    ['Mars',    'Jupiter', 'Moon'],      // Scorpio     — Water
    ['Jupiter', 'Mars',    'Sun'],       // Sagittarius — Fire
    ['Saturn',  'Venus',   'Mercury'],   // Capricorn   — Earth
    ['Saturn',  'Mercury', 'Venus'],     // Aquarius    — Air
    ['Jupiter', 'Moon',    'Mars']       // Pisces      — Water
  ];

  // Sign name → astrological index (0 = Aries … 11 = Pisces).
  const SIGN_ASTRO_IDX = {
    Aries: 0, Taurus: 1, Gemini: 2, Cancer: 3, Leo: 4, Virgo: 5,
    Libra: 6, Scorpio: 7, Sagittarius: 8, Capricorn: 9, Aquarius: 10, Pisces: 11
  };
  const DECAN_ORDINAL = ['1st', '2nd', '3rd'];
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

  // Moon / Sun / Pluto cards, derived from the Life Spread (not in the
  // hand-authored LIFE_SCRIPTS table).
  //
  // For a given birth card, LIFE_SCRIPTS[i] happens to line up with the
  // seven consecutive Life-Spread positions RIGHT AFTER the birth card
  // (birth_pos+1 … birth_pos+7 in deckAtAge(1)'s linear order). Reading
  // Neptune → Mercury for display puts Mercury adjacent to the birth
  // card on one side. Moon and Pluto extend that consecutive slice by
  // one card on each end:
  //   Sun    = the birth card itself (Leo's classical ruler is the Sun).
  //   Moon   = the card at (birth pos − 1) mod 52 — the seat on the
  //            birth card's opposite side from Mercury (visually to the
  //            right of the birth card in the default Neptune → Mercury
  //            display direction).
  //   Pluto  = the card at (Neptune-card pos + 1) mod 52, equivalently
  //            (birth pos + 8) mod 52 — the seat immediately after
  //            Neptune (used as the modern Scorpio ruler).
  function derivedCardFor(planet, card, script) {
    if (typeof deckAtAge !== 'function' || typeof SPREAD_CARDS === 'undefined' ||
        typeof CARDS === 'undefined') return null;
    const life = deckAtAge(1);
    const birthIdx = CARDS.findIndex(function (x) { return x.rank === card.rank && x.suit === card.suit; });
    if (birthIdx < 0) return null;
    if (planet === 'Sun') {
      const sc = SPREAD_CARDS[birthIdx];
      return sc ? { rank: sc.rank, suit: sc.suit, sym: sc.sym } : null;
    }
    let anchorIdx = -1, step = 0;
    if (planet === 'Moon') { anchorIdx = birthIdx; step = -1; }
    else if (planet === 'Pluto') {
      const nep = script && script[6] ? parseCard(script[6]) : null;
      if (!nep) return null;
      anchorIdx = CARDS.findIndex(function (x) { return x.rank === nep.rank && x.suit === nep.suit; });
      step = 1;
    }
    if (anchorIdx < 0) return null;
    const anchorPos = life.indexOf(anchorIdx);
    if (anchorPos < 0) return null;
    const targetPos = (anchorPos + step + 52) % 52;
    const targetIdx = life[targetPos];
    const sc = SPREAD_CARDS[targetIdx];
    return sc ? { rank: sc.rank, suit: sc.suit, sym: sc.sym } : null;
  }

  // Days in a zodiac sign's date range, handling the year-wrap for
  // Capricorn (Dec 22 → Jan 19).
  function signDayCount(sign) {
    // Base year 2001 (non-leap) so Feb has 28 days consistently.
    const start = Date.UTC(2001, sign.start[0] - 1, sign.start[1]);
    const endMonth = sign.end[0];
    const endYear  = (endMonth < sign.start[0]) ? 2002 : 2001;
    const end   = Date.UTC(endYear, endMonth - 1, sign.end[1]);
    return Math.round((end - start) / 86400000) + 1;
  }

  // Which decan (0 / 1 / 2) contains (month, day) inside `sign`?
  // Uses an even day-split within the sign's date range. This is the
  // fallback when astronomy.js isn't loaded — accurate to within a day
  // or so, which is fine for 10°-wide buckets.
  function decanIdxForDate(sign, month, day) {
    if (!sign) return -1;
    const total = signDayCount(sign);
    const baseYear = 2001;
    const startMs = Date.UTC(baseYear, sign.start[0] - 1, sign.start[1]);
    const wrap = (sign.end[0] < sign.start[0]);
    const dayYear = (wrap && month <= sign.end[0]) ? baseYear + 1 : baseYear;
    const dayMs   = Date.UTC(dayYear, month - 1, day);
    const daysIn  = Math.round((dayMs - startMs) / 86400000);
    if (daysIn < 0) return -1;
    return Math.min(2, Math.floor(daysIn * 3 / total));
  }

  // Try to use Astronomy Engine (already lazy-loaded by Solar Time when
  // the user has computed a solar birth card). Returns tropical Sun
  // ecliptic longitude in degrees, or null if unavailable.
  function sunLonAt(year, month, day, hourUT) {
    if (!window.Astronomy) return null;
    try {
      const t = window.Astronomy.MakeTime(new Date(Date.UTC(year, month - 1, day, hourUT || 12)));
      return window.Astronomy.Ecliptic(window.Astronomy.GeoVector(window.Astronomy.Body.Sun, t, true)).elon;
    } catch (e) { return null; }
  }
  // Precise decan from tropical longitude — 0..2.
  function decanIdxForLon(lon) {
    return Math.floor(((lon % 30) + 30) % 30 / 10);
  }

  // Sign name (per ZODIAC.name) → planet chip HTML for the given ruler.
  // Returns "" if the ruler doesn't resolve to a card seat.
  function planetChip(ruler, script, birthCard, title) {
    const glyph = SPREAD_PLANET_SYM[ruler] || '';
    const rulerText = glyph ? `${glyph} ${ruler}` : ruler;
    const planetIdx = SPREAD_PLANETS.indexOf(ruler);
    let cc = null;
    if (planetIdx >= 0 && script && script[planetIdx]) cc = parseCard(script[planetIdx]);
    else if (ruler === 'Moon' || ruler === 'Sun' || ruler === 'Pluto') cc = derivedCardFor(ruler, birthCard, script);
    const cardChip = cc
      ? `<span class="ls-stat-chip ls-zodiac-card ${cc.suit}" title="${ruler} ruling card">${cc.rank}${cc.sym}</span>`
      : '';
    return `<span class="ls-stat-chip" title="${title}">${rulerText}</span>${cardChip}`;
  }

  // Build the decan sub-row for one zodiac line. Both systems are shown;
  // when Chaldean and Ptolemaic agree, they're merged into one chip pair
  // to avoid noise.
  function decanSubrowHTML(sign, decanIdx, script, birthCard) {
    if (!sign || decanIdx < 0) return '';
    const signIdx = SIGN_ASTRO_IDX[sign.name];
    if (signIdx === undefined) return '';
    const globalDecan = signIdx * 3 + decanIdx;
    const chaldean  = CHALDEAN_ORDER[globalDecan % 7];
    const ptolemaic = PTOLEMAIC_DECANS[signIdx][decanIdx];
    const label = `${DECAN_ORDINAL[decanIdx]} decan`;
    const systems = `<div class="ls-decan-system-row">
      <span class="ls-decan-system">Chaldean</span>
      ${planetChip(chaldean, script, birthCard, `${chaldean} — Chaldean/Egyptian decan ruler`)}
    </div>
    <div class="ls-decan-system-row">
      <span class="ls-decan-system">Ptolemaic</span>
      ${planetChip(ptolemaic, script, birthCard, `${ptolemaic} — Ptolemaic/triplicity decan ruler`)}
    </div>`;
    return `<div class="ls-decan-line">
      <span class="ls-decan-label" title="${sign.name} decan by 10° arc">${label}</span>
      ${systems}
    </div>`;
  }

  function rulingCardChipHTML(sign, script, birthCard) {
    if (!sign) return '';
    const ruler = sign.ruler;
    // Extended ruler set: the 7 cardology planets + Moon (Cancer) +
    // Sun (Leo) + Pluto (modern Scorpio).
    const planetIdx = SPREAD_PLANETS.indexOf(ruler);
    let cc = null;
    if (planetIdx >= 0 && script && script[planetIdx]) {
      cc = parseCard(script[planetIdx]);
    } else if (ruler === 'Moon' || ruler === 'Sun' || ruler === 'Pluto') {
      cc = derivedCardFor(ruler, birthCard, script);
    }
    if (!cc) return '<span class="ls-stat-note">No seven-planet card seat</span>';
    return `<span class="ls-stat-chip ls-zodiac-card ${cc.suit}" title="${ruler} ruling card">${cc.rank}${cc.sym}</span>`;
  }

  function zodiacStatsHTML(card, script) {
    const date = selectedBirthDateForCard(card);
    if (!date) return '';
    const sign = zodiacForDate(date.month, date.day);
    if (!sign) return '';
    const siderealDate = shiftedDate(date.month, date.day, SIDEREAL_LAHIRI_DAY_SHIFT);
    const siderealSign = zodiacForDate(siderealDate.month, siderealDate.day);

    // Precise decans via astronomy.js when it's already loaded (Solar
    // Time lazy-loads it); otherwise fall back to the even day-split.
    // Sun longitude on the same month/day varies by < 1° across recent
    // years, so a reference year is plenty for 10°-wide decan buckets
    // when we don't have the birth year.
    const refYear = (typeof currentAge !== 'undefined' && Number.isFinite(currentAge))
      ? (new Date().getUTCFullYear() - currentAge) : 2000;
    const tropLon = sunLonAt(refYear, date.month, date.day, 12);
    const tropDecan = (tropLon !== null)
      ? decanIdxForLon(tropLon)
      : decanIdxForDate(sign, date.month, date.day);
    let sidDecan = -1;
    if (siderealSign) {
      // Lahiri ayanamsa ≈ 24° in the current era. Astronomy path uses
      // the precise ayanamsa formula from sun-gate.js; the fallback
      // reuses the day-shift approximation on siderealDate.
      if (tropLon !== null) {
        const AYAN_LAHIRI_J2000 = 23.85320;
        const t = window.Astronomy.MakeTime(new Date(Date.UTC(refYear, date.month - 1, date.day, 12)));
        const T = t.tt / 36525;
        const ayan = AYAN_LAHIRI_J2000 + (5028.796195 * T + 1.1054348 * T * T) / 3600;
        const sidLon = ((tropLon - ayan) % 360 + 360) % 360;
        sidDecan = decanIdxForLon(sidLon);
      } else {
        sidDecan = decanIdxForDate(siderealSign, siderealDate.month, siderealDate.day);
      }
    }

    const rulingCardHTML = rulingCardChipHTML(sign, script, card);
    const signText = `${sign.glyph} ${sign.name}`;
    const rulerGlyph = SPREAD_PLANET_SYM[sign.ruler] || '';
    const rulerText = rulerGlyph ? `${rulerGlyph} ${sign.ruler}` : sign.ruler;
    const siderealRulerGlyph = siderealSign && SPREAD_PLANET_SYM[siderealSign.ruler] || '';
    const siderealRulerText = siderealSign
      ? (siderealRulerGlyph ? `${siderealRulerGlyph} ${siderealSign.ruler}` : siderealSign.ruler)
      : '';
    const siderealHTML = siderealSign ? `<div class="ls-zodiac-cardlet">
        <div class="ls-zodiac-kind">Sidereal</div>
        <div class="ls-zodiac-line">
          <span class="ls-stat-chip" title="Sidereal sign, Lahiri-style birthday approximation">${siderealSign.glyph} ${siderealSign.name}</span>
          <span class="ls-stat-chip" title="Sidereal classical sign ruler">${siderealRulerText}</span>
          ${rulingCardChipHTML(siderealSign, script, card)}
        </div>
        ${decanSubrowHTML(siderealSign, sidDecan, script, card)}
      </div>` : '';
    return `<div class="ls-stat-block">
      <div class="ls-stat-label">Zodiac</div>
      <div class="ls-zodiac-stack">
        <div class="ls-zodiac-cardlet">
          <div class="ls-zodiac-kind">Tropical</div>
          <div class="ls-zodiac-line">
            <span class="ls-stat-chip" title="Tropical sun sign">${signText}</span>
            <span class="ls-stat-chip" title="Classical sign ruler">${rulerText}</span>
            ${rulingCardHTML}
          </div>
          ${decanSubrowHTML(sign, tropDecan, script, card)}
        </div>
        ${siderealHTML}
      </div>
    </div>`;
  }

  // Displacement ghost chips for one ruling card — mirrors the
  // Quadrations grid's .sl-ghost pair (Displaces / Displaced by).
  // `idx` is the card's position in CARDS/SPREAD_CARDS' shared solar
  // order (what slDisplaces/slDisplacedBy expect). Fixed/semi-fixed
  // cards (where the seat displaces itself) render a note instead of an
  // empty-looking pair.
  function ghostRowHTML(idx) {
    if (typeof slDisplaces !== 'function' || typeof slDisplacedBy !== 'function' ||
        typeof SPREAD_CARDS === 'undefined' || idx < 0) return '';
    const displacesIdx = slDisplaces(idx);
    const displacedByIdx = slDisplacedBy(idx);
    if (displacesIdx === idx && displacedByIdx === idx) {
      return '<p class="ls-displacement-note">No displacement pair. This card holds its own seat in the Life Spread.</p>';
    }
    const isMutualPair = displacesIdx === displacedByIdx;
    const pairs = [
      ['Displaces', displacesIdx],
      ['Displaced by', displacedByIdx]
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
    const mutualNote = isMutualPair
      ? '<p class="ls-displacement-note ls-displacement-note--pair">Semi-fixed pair. These two cards exchange places with each other in the Life Spread.</p>'
      : '';
    return `<div class="ls-ghost-row">${chips}</div>${mutualNote}`;
  }

  function earthlySeatPlanetsHTML(card) {
    if (typeof deckAtAge !== 'function' || typeof CARDS === 'undefined') return '';
    const idx = CARDS.findIndex(function (x) { return x.rank === card.rank && x.suit === card.suit; });
    if (idx < 0) return '';
    const life = deckAtAge(1);
    const pos = life.indexOf(idx);
    if (pos < 0) return '';
    if (pos >= 49) {
      return planetButtonHTML('Crown', 'Crown row');
    }
    const rowPlanet = SPREAD_PLANETS[Math.floor(pos / 7)];
    const colPlanet = SPREAD_PLANETS[pos % 7];
    return [
      planetButtonHTML(rowPlanet, 'Row'),
      planetButtonHTML(colPlanet, 'Column')
    ].join('');
  }

  function planetButtonHTML(planet, title) {
    const glyph = SPREAD_PLANET_SYM[planet] || '';
    return `<button type="button" class="ls-stat-chip ls-planet-link" data-planet="${planet}" title="${title}: ${planet}" aria-label="Open ${planet} in Card Elements">${glyph ? glyph + ' ' : ''}${planet}</button>`;
  }

  function openPlanetFromStats(planet) {
    if (!planet || (typeof window.showPlanet !== 'function' && typeof window.openPlanet !== 'function')) return;
    const elements = document.getElementById('elements');
    if (elements) {
      elements.classList.add('section-open');
      const toggle = elements.querySelector(':scope > .section-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
    }
    if (typeof window.showPlanet === 'function') window.showPlanet(planet);
    else window.openPlanet(planet);
    const target = document.getElementById('plPop') || elements;
    if (target && target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function datesHTML(dates) {
    if (!dates) return '';
    const items = String(dates).split(/\s*,\s*/).filter(Boolean);
    const rows = [];
    for (let i = 0; i < items.length; i += 6) rows.push(items.slice(i, i + 6));
    return `<div class="ls-date-grid">${rows.map(function (row) {
      return `<div class="ls-date-row">${row.map(function (date) {
        return `<span class="ls-date-item">${date}</span>`;
      }).join('')}</div>`;
    }).join('')}</div>`;
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
        ${datesHTML(dates)}
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
    root.querySelectorAll('.ls-planet-link[data-planet]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openPlanetFromStats(btn.dataset.planet);
      });
    });
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
