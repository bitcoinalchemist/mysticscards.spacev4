// chart-table.js — the natal chart table shown under the Solar Time birth
// card in the Finder's Astrology panel.
//
// One row per body: Body · Mind · Planet · Card · Sign · Degree.
//
//   Body   — the Human Design "Design" gate, read at the moment the Sun was
//            exactly 88° of ecliptic longitude before its birth position
//            (≈88 days earlier, the prenatal half of the BodyGraph).
//   Mind   — the "Personality" gate, read at the birth instant itself.
//   Card   — cardology: the Sun carries the birth card, and Mercury→Neptune
//            carry that card's Life Script seats. Bodies with no cardology
//            seat (Moon, Pluto, the nodes, Chiron, Earth) show a dot.
//   Sign / Degree — position in the selected zodiac.
//
// Adapted from the earlier standalone astrology page (kept in
// dev/astrology_code/) — this is the "unified chart table" from it, minus the
// House column, which needs an exact birth time AND place to mean anything.
//
// GATED ON A REAL BIRTH MOMENT. js/solar-time.js only calls in once it has
// resolved a birth instant from a date + clock time + birthplace, so there is
// no "approximate" mode: without a birth time the Moon alone can drift ~6°,
// which is wider than a whole gate (5.625°), and the table would be quietly
// wrong rather than obviously absent.
//
// Gates are DISPLAY ONLY here — figure + gate.line, not clickable. The
// hexagram reading text lives in js/ichingdata.js + js/linedata.js (~113 KB),
// which iching.html loads and index.html deliberately does not.
//
// Reads: window.Astronomy (lazy-loaded by solar-time.js before we're called),
// window.SunGate (gateOf / ayanamsa / hexFigSVG / KW_TO_VAL), and the
// classic-script globals CARDS, LIFE_SCRIPTS, SPREAD_PLANETS from cardsdata.js.
//
// PUBLIC on window.ChartTable:
//   html(t, birthCard) -> HTML string for the whole block, or '' if the
//                         engine or its inputs aren't available.
(function () {
  'use strict';

  var SIGNS = [
    ['Aries', '♈'], ['Taurus', '♉'], ['Gemini', '♊'], ['Cancer', '♋'],
    ['Leo', '♌'], ['Virgo', '♍'], ['Libra', '♎'], ['Scorpio', '♏'],
    ['Sagittarius', '♐'], ['Capricorn', '♑'], ['Aquarius', '♒'], ['Pisces', '♓']
  ];

  // Astronomy Engine bodies, in the order the table lists them. Earth is
  // derived from the Sun below and inserted between Moon and Sun.
  var PLANETS = [
    ['Mercury', '☿'], ['Venus', '♀'], ['Mars', '♂'], ['Jupiter', '♃'],
    ['Saturn', '♄'], ['Uranus', '♅'], ['Neptune', '♆'], ['Moon', '☽'],
    ['Sun', '☉'], ['Pluto', '♇']
  ];

  var D2R = Math.PI / 180;
  var EPS0 = 23.4392911 * D2R;

  // Chiron is not in Astronomy Engine, so it comes from JPL osculating
  // elements (epoch JD 2461200.5, J2000 ecliptic) by two-body Kepler, rotated
  // to a geocentric EQJ vector and run through the same Astronomy.Ecliptic()
  // the planets use — so it shares their exact frame. Good to ~an arcminute
  // near our era; drifts for dates far from the present.
  var CHIRON = {
    a: 13.68426760850124, e: 0.3797656311453571, iDeg: 6.930574468846328,
    omDeg: 209.2961258613147, wDeg: 339.2878326589729, M0: 216.7198966018106,
    nDeg: 0.0194702593257484, epoch: 2461200.5
  };

  function A() { return window.Astronomy; }

  function lonAt(name, t) {
    return A().Ecliptic(A().GeoVector(A().Body[name], t, true)).elon;
  }

  function chironHelioEcl(jdTT) {
    var M = (CHIRON.M0 + CHIRON.nDeg * (jdTT - CHIRON.epoch)) * D2R;
    var E = M;
    for (var k = 0; k < 60; k++) {
      var dE = (E - CHIRON.e * Math.sin(E) - M) / (1 - CHIRON.e * Math.cos(E));
      E -= dE;
      if (Math.abs(dE) < 1e-13) break;
    }
    var nu = 2 * Math.atan2(Math.sqrt(1 + CHIRON.e) * Math.sin(E / 2), Math.sqrt(1 - CHIRON.e) * Math.cos(E / 2));
    var r = CHIRON.a * (1 - CHIRON.e * Math.cos(E));
    var om = CHIRON.omDeg * D2R, w = CHIRON.wDeg * D2R, inc = CHIRON.iDeg * D2R, u = w + nu;
    return {
      x: r * (Math.cos(om) * Math.cos(u) - Math.sin(om) * Math.sin(u) * Math.cos(inc)),
      y: r * (Math.sin(om) * Math.cos(u) + Math.cos(om) * Math.sin(u) * Math.cos(inc)),
      z: r * (Math.sin(u) * Math.sin(inc))
    };
  }

  function chironLon(t) {
    var jdTT = 2451545.0 + t.tt;
    var earth = A().HelioVector(A().Body.Earth, t);
    var ce = Math.cos(EPS0), se = Math.sin(EPS0), lt = 0, gx, gy, gz;
    for (var it = 0; it < 3; it++) {
      var h = chironHelioEcl(jdTT - lt);
      var ex = h.x, ey = h.y * ce - h.z * se, ez = h.y * se + h.z * ce;
      gx = ex - earth.x; gy = ey - earth.y; gz = ez - earth.z;
      lt = Math.sqrt(gx * gx + gy * gy + gz * gz) * 0.0057755183;
    }
    var vec = (typeof A().Vector === 'function') ? new (A().Vector)(gx, gy, gz, t) : { x: gx, y: gy, z: gz, t: t };
    return A().Ecliptic(vec).elon;
  }

  // Mean lunar node — the same series the Vedic charts use for Rahu/Ketu.
  function meanNode(t) {
    var T = t.tt / 36525;
    return (((125.04452 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000) % 360) + 360) % 360;
  }

  // The Design instant: Sun exactly 88° of longitude before its birth
  // position. Newton-step on the Sun's longitude (mean motion ≈0.9856°/day);
  // the signed shortest difference handles the 0°/360° wrap.
  function findDesignTime(t) {
    var target = ((lonAt('Sun', t) - 88) % 360 + 360) % 360;
    var tt = t.AddDays(-88.5);
    for (var i = 0; i < 12; i++) {
      var diff = ((lonAt('Sun', tt) - target + 540) % 360) - 180;
      if (Math.abs(diff) < 1e-6) break;
      tt = tt.AddDays(-diff / 0.9856473);
    }
    return tt;
  }

  function retroOf(name, t, lon) {
    if (name === 'Sun' || name === 'Moon') return false;
    var d = lonAt(name, t.AddDays(0.5)) - lon;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d < 0;
  }

  function computeChart(t) {
    var chart = PLANETS.map(function (p) {
      var lon = lonAt(p[0], t);
      return { name: p[0], glyph: p[1], lon: lon, retro: retroOf(p[0], t, lon) };
    });
    // Earth sits opposite the Sun, between Moon and Sun in the table.
    var sun = chart.find(function (p) { return p.name === 'Sun'; });
    chart.splice(8, 0, { name: 'Earth', glyph: '⊕', lon: (sun.lon + 180) % 360, retro: false });
    var chLon = chironLon(t);
    var chD = chironLon(t.AddDays(0.5)) - chLon;
    if (chD > 180) chD -= 360;
    if (chD < -180) chD += 360;
    chart.push({ name: 'Chiron', glyph: '⚷', lon: chLon, retro: chD < 0 });
    var nn = meanNode(t);
    chart.push({ name: 'NN', glyph: '☊', lon: nn, retro: false });
    chart.push({ name: 'SN', glyph: '☋', lon: (nn + 180) % 360, retro: false });
    return chart;
  }

  function signOf(lon) {
    var x = ((lon % 360) + 360) % 360;
    var i = Math.floor(x / 30);
    var within = x - i * 30;
    var deg = Math.floor(within);
    var min = Math.round((within - deg) * 60);
    if (min === 60) { min = 0; deg++; }
    return { name: SIGNS[i][0], glyph: SIGNS[i][1], deg: deg, min: min };
  }

  // Earth = the birth card; Mercury→Neptune = that card's Life Script seats.
  // Seats are stored as 'A♦' style strings; lsParseCard (cardsdata.js) is the
  // one place that knows how to read them.
  function indexOfCard(c) {
    if (!c || typeof CARDS === 'undefined') return -1;
    // Match on rank+suit, not identity — callers hand us cards built by
    // cardForDate() and friends, which aren't the same objects as CARDS'.
    return CARDS.findIndex(function (x) { return x.rank === c.rank && x.suit === c.suit; });
  }

  function cardMap(birthCard) {
    var map = {};
    if (!birthCard || typeof CARDS === 'undefined') return map;
    map.Earth = indexOfCard(birthCard);
    var ls = (typeof LIFE_SCRIPTS !== 'undefined') && LIFE_SCRIPTS[birthCard.rank + '_' + birthCard.suit];
    if (!ls || typeof SPREAD_PLANETS === 'undefined' || typeof lsParseCard !== 'function') return map;
    for (var j = 0; j < 7 && j < SPREAD_PLANETS.length; j++) {
      var cc = lsParseCard(ls[j]);
      if (!cc) continue;
      map[SPREAD_PLANETS[j]] = indexOfCard(cc);
    }
    return map;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function gateCell(cls, gate, hexFig, kwToVal) {
    var fig = (typeof hexFig === 'function' && kwToVal) ? hexFig(kwToVal[gate.gate], 0.5) : '';
    return '<td class="ct-gate ' + cls + '">' +
      '<span class="ct-fig">' + fig + '</span>' +
      '<span class="ct-gl">' + gate.gate + '.' + gate.line + '</span></td>';
  }

  function rowsHTML(chart, design, ay, cards, SG) {
    return chart.map(function (p, i) {
      var pShift = ((p.lon - ay) % 360 + 360) % 360;
      var dShift = ((design[i].lon - ay) % 360 + 360) % 360;
      var pos = signOf(pShift);
      var ci = cards[p.name];
      var cardCell = '<span class="ct-nocard" aria-label="no card for this body">·</span>';
      if (ci != null && ci >= 0 && typeof CARDS !== 'undefined' && CARDS[ci]) {
        var c = CARDS[ci];
        cardCell = '<span class="ct-cardchip ' + c.suit + '">' + c.rank + c.sym + '</span>';
      }
      var groupGap = p.name === 'Sun'
        ? '<tr class="ct-group-gap" aria-hidden="true"><td colspan="6"></td></tr>'
        : '';
      return groupGap + '<tr>' +
        gateCell('ct-d', SG.gateOf(dShift), SG.hexFigSVG, SG.KW_TO_VAL) +
        gateCell('ct-p', SG.gateOf(pShift), SG.hexFigSVG, SG.KW_TO_VAL) +
        '<td class="ct-planet"><span class="ct-pg" aria-hidden="true">' + p.glyph + '</span>' + esc(p.name) + '</td>' +
        '<td class="ct-card">' + cardCell + '</td>' +
        '<td class="ct-sign"><span aria-hidden="true">' + pos.glyph + '</span> ' + esc(pos.name.slice(0, 3)) + '</td>' +
        '<td class="ct-deg">' + pos.deg + '° ' + String(pos.min).padStart(2, '0') + '′' +
          (p.retro ? '<span class="ct-retro" title="retrograde">℞</span>' : '') + '</td>' +
      '</tr>';
    }).join('');
  }

  function tableHTML(chart, design, ay, cards, SG, kind) {
    return '<table class="ct-table" data-zodiac-panel="' + kind + '">' +
      '<caption class="vh">Natal chart, ' + kind + ' zodiac</caption>' +
      '<thead><tr>' +
        '<th scope="col">Body</th><th scope="col">Mind</th><th scope="col">Planet</th>' +
        '<th scope="col">Card</th><th scope="col">Sign</th>' +
        '<th scope="col" class="ct-deg">Degree</th>' +
      '</tr></thead>' +
      '<tbody>' + rowsHTML(chart, design, ay, cards, SG) + '</tbody></table>';
  }

  // t is the birth AstroTime that solar-time.js already computed.
  function html(t, birthCard) {
    var SG = window.SunGate;
    if (!window.Astronomy || !t || !SG || typeof SG.gateOf !== 'function' || typeof SG.ayanamsa !== 'function') return '';
    var chart, design;
    try {
      chart = computeChart(t);
      design = computeChart(findDesignTime(t));
    } catch (e) {
      return '';
    }
    var cards = cardMap(birthCard);
    var trop = tableHTML(chart, design, 0, cards, SG, 'tropical');
    var sid = tableHTML(chart, design, SG.ayanamsa('lahiri', t), cards, SG, 'sidereal');
    return '<div class="ct-block" data-zodiac-group="astrology" data-zodiac-active="tropical">' +
      '<div class="ct-head">' +
        '<span class="ls-stat-label">Natal Chart</span>' +
      '</div>' +
      '<div class="ct-panel" id="ctPanelTropical" role="tabpanel" tabindex="0" aria-labelledby="lsZodiacTabTropical" data-zodiac-panel="tropical">' + trop + '</div>' +
      '<div class="ct-panel" id="ctPanelSidereal" role="tabpanel" tabindex="0" aria-labelledby="lsZodiacTabSidereal" data-zodiac-panel="sidereal">' + sid + '</div>' +
      '<p class="ct-note">Body is the Design gate, 88° of solar arc before birth; Mind is the Personality gate at the birth moment. Sidereal uses the Lahiri ayanamsa.</p>' +
    '</div>';
  }

  window.ChartTable = { html: html, computeChart: computeChart, findDesignTime: findDesignTime, signOf: signOf };
})();
