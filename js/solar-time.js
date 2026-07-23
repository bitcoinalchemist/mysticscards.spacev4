// solar-time.js — Solar-day birth-card correction for the Life Script stats.
//
// Added 2026-07-11, adapting the earlier "Super" astrology.html "Solar
// Day" feature. Given a birth date + clock time + birthplace, it uses the
// Astronomy Engine to find the Sun's lower transits (solar midnights) at
// the birth longitude; the solar day is named by the LOCAL DATE AT SOLAR
// NOON, and THAT date gives the birth card. A birth close to midnight can
// belong to the previous/next calendar day by the sun, which flips the
// card — this surfaces the correct one.
//
// The heavy engine (js/astronomy.js, ~116 KB) is LAZY-loaded on first use
// so it never touches page startup. Longitude comes from window.TZ_COORDS
// (js/tzcoords.js) keyed by the IANA zone the birthplace picker resolves
// to; the DST-aware UTC offset comes from the browser's own tz database.
//
// Reads SPREAD_CARDS + spreadCardPips + Finder's currentAge anchor as
// classic-script globals (loaded earlier), and window.TZ_COORDS from
// tzcoords.js. Quadrations keeps a separate quadAge.
//
// PUBLIC on window.SolarTime:
//   solarDate({year,month,day,hour,minute}, tz) -> Promise<{
//     civil:{y,m,d}, solar:{y,m,d}, differs, solarFrac, offMin, lon,
//     prevMs, nextMs }>
//   zoneFor(text) -> canonical IANA zone (or null)
//   lonFor(tz)    -> longitude east (or null)
//   refresh()     -> re-render the Solar Time stats sub-panel

(function () {
  'use strict';

  var ZMAP = {};            // lowercased zone/city text -> canonical IANA zone
  var _enginePromise = null;

  // Lazy-load the Astronomy Engine on first use. No cache-buster query so
  // the sw.js precache entry (exact 'js/astronomy.js') still matches offline.
  function ensureEngine() {
    if (window.Astronomy) return Promise.resolve(window.Astronomy);
    if (_enginePromise) return _enginePromise;
    _enginePromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'js/astronomy.js';
      s.async = true;
      s.onload = function () {
        window.Astronomy ? resolve(window.Astronomy) : reject(new Error('engine unavailable'));
      };
      s.onerror = function () { reject(new Error('engine failed to load')); };
      document.head.appendChild(s);
    });
    return _enginePromise;
  }

  // Minutes east of UTC in zone tz at the given instant (DST-aware, via the
  // browser IANA database). Ported verbatim from the astrology page.
  function zoneOffsetMin(tz, date) {
    var dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    var p = {};
    dtf.formatToParts(date).forEach(function (x) { p[x.type] = x.value; });
    return (Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second) - date.getTime()) / 60000;
  }

  function localDateParts(ms) {
    var dd = new Date(ms);
    return { y: dd.getUTCFullYear(), m: dd.getUTCMonth() + 1, d: dd.getUTCDate() };
  }

  // Solar midnight = the Sun's lower transit (hour angle 12) at lonDeg.
  // Latitude does not affect transit times; 0 is safe. Returns the midnight
  // before + after the instant, and the solar noon of that solar day.
  function solarMidnights(A, t, lonDeg) {
    var obs = new A.Observer(0, lonDeg, 0);
    var search = t.AddDays(-1.6);
    var prev = null, next = null;
    for (var i = 0; i < 5; i++) {
      var ev = A.SearchHourAngle(A.Body.Sun, obs, 12, search);
      if (ev.time.ut <= t.ut) { prev = ev.time; search = ev.time.AddDays(0.2); }
      else { next = ev.time; break; }
    }
    var noon = A.SearchHourAngle(A.Body.Sun, obs, 0, prev).time;
    return { prev: prev, next: next, noon: noon };
  }

  function zoneFor(text) {
    if (!text) return null;
    return ZMAP[String(text).trim().toLowerCase()] || null;
  }
  function lonFor(tz) {
    return (tz && window.TZ_COORDS && window.TZ_COORDS[tz]) ? window.TZ_COORDS[tz][1] : null;
  }

  // Core: the solar-adjusted date for a birth.
  function solarDate(birth, tz) {
    return ensureEngine().then(function (A) {
      var lon = lonFor(tz);
      if (lon === null) throw new Error('no longitude for that place');
      var localGuess = Date.UTC(birth.year, birth.month - 1, birth.day, birth.hour, birth.minute);
      // Two-pass offset: the offset depends on the instant, which depends on
      // the offset — one refinement pass is plenty away from a DST boundary.
      var offMin = zoneOffsetMin(tz, new Date(localGuess));
      offMin = zoneOffsetMin(tz, new Date(localGuess - offMin * 60000));
      var utcMs = localGuess - offMin * 60000;
      var t = A.MakeTime(new Date(utcMs));
      var sm = solarMidnights(A, t, lon);
      var solarFrac = (t.ut - sm.prev.ut) / (sm.next.ut - sm.prev.ut);
      var solar = localDateParts(sm.noon.date.getTime() + offMin * 60000);
      var civil = { y: birth.year, m: birth.month, d: birth.day };
      var differs = !(solar.y === civil.y && solar.m === civil.m && solar.d === civil.d);
      return {
        civil: civil, solar: solar, differs: differs, solarFrac: solarFrac,
        offMin: offMin, lon: lon, t: t,
        prevMs: sm.prev.date.getTime() + offMin * 60000,
        nextMs: sm.next.date.getTime() + offMin * 60000
      };
    });
  }

  // ── Solar Time stats sub-panel (#fSolar) ─────────────────────────
  var RANK_NAMES = { A: 'Ace', '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five',
    '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine', '10': 'Ten',
    J: 'Jack', Q: 'Queen', K: 'King' };
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function cardForDate(m, d) {
    var sv = 55 - (2 * m + d);
    if (sv >= 1 && sv <= 52) {
      var c = SPREAD_CARDS[sv - 1];
      return { rank: c.rank, suit: c.suit, sym: c.sym };
    }
    return { rank: '✦', suit: 'joker', sym: '✦' };
  }
  function cardName(card) {
    if (card.suit === 'joker') return 'The Joker';
    var suit = card.suit.charAt(0).toUpperCase() + card.suit.slice(1);
    return (RANK_NAMES[card.rank] || card.rank) + ' of ' + suit;
  }
  function cardTile(card, label, dimmed) {
    // Full-size stats card face — same visual language as Life Script's
    // Ruling-card row. Joker uses spreadCardPips' built-in joker corners.
    var face = (typeof window.spreadCardPips === 'function')
      ? window.spreadCardPips(card)
      : (card.rank + card.sym);
    var idx = -1;
    if (typeof SPREAD_CARDS !== 'undefined' && card.suit !== 'joker') {
      for (var i = 0; i < SPREAD_CARDS.length; i++) {
        if (SPREAD_CARDS[i].rank === card.rank && SPREAD_CARDS[i].suit === card.suit) { idx = i; break; }
      }
    }
    var idxAttr = idx >= 0 ? ' data-idx="' + idx + '"' : '';
    var role = idx >= 0 ? ' role="button" tabindex="0"' : '';
    return '<div class="sol-card' + (dimmed ? ' dimmed' : '') + '">' +
      '<div class="sol-card-label">' + label + '</div>' +
      '<div class="spread-card ls-card ls-stat-card sol-card-face ' + card.suit + '"' + idxAttr + role +
        ' aria-label="Load ' + cardName(card) + ' in finder">' + face + '</div>' +
      '<div class="sol-card-name">' + cardName(card) + '</div></div>';
  }

  function bindSolCards(root) {
    if (!root) return;
    root.querySelectorAll('.ls-stat-card[data-idx]').forEach(function (el) {
      var idx = parseInt(el.dataset.idx, 10);
      if (!Number.isInteger(idx) || idx < 0) return;
      var open = function () {
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
  function fmtD(p) { return p.d + ' ' + MON[p.m - 1] + ' ' + p.y; }

  // Birth date from the Finder (month/day) + the age anchor (birth year).
  function activeBirth() {
    var mEl = document.getElementById('fMonth'), dEl = document.getElementById('fDay');
    if (!mEl || !dEl) return null;
    var m = parseInt(mEl.value, 10), d = parseInt(dEl.value, 10);
    if (!m || !d) return null;
    var anchorAge = (typeof currentAge === 'number' ? currentAge : 0);
    var now = new Date();
    var refUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    var realLbYear = (Date.UTC(now.getFullYear(), m - 1, d) > refUTC) ? now.getFullYear() - 1 : now.getFullYear();
    return { year: realLbYear - anchorAge, month: m, day: d };
  }

  function el(id) { return document.getElementById(id); }

  function render() {
    var out = el('solOut');
    if (!out) return;
    var birth = activeBirth();
    if (!birth) {
      out.innerHTML = '<p class="sol-hint">Set a birth date first — a DD/MM plus an age, or a saved birthday.</p>';
      return;
    }
    var placeEl = el('solPlace'), timeEl = el('solTime');
    var tz = zoneFor(placeEl ? placeEl.value : '');
    var time = timeEl ? timeEl.value : '';
    if (!time || !tz) {
      out.innerHTML = '';
      return;
    }
    var hm = time.split(':');
    var b = { year: birth.year, month: birth.month, day: birth.day, hour: +hm[0] || 0, minute: +hm[1] || 0 };
    out.innerHTML = '<p class="sol-hint">Consulting the sun…</p>';
    solarDate(b, tz).then(function (res) {
      var solarCard = cardForDate(res.solar.m, res.solar.d);
      var verdictHTML, cardsHTML;
      if (res.differs) {
        var clockCard = cardForDate(res.civil.m, res.civil.d);
        verdictHTML = '<p class="sol-verdict">By the clock this birth is <strong>' + fmtD(res.civil) +
          '</strong>, but by the sun it belongs to <strong>' + fmtD(res.solar) +
          '</strong> — the solar day had not yet turned.</p>';
        cardsHTML = '<div class="sol-cards">' + cardTile(clockCard, 'Clock date', true) +
          cardTile(solarCard, 'Solar day', false) + '</div>';
      } else {
        verdictHTML = '<p class="sol-verdict">Clock and sun agree: this birth belongs to <strong>' + fmtD(res.civil) + '</strong>.</p>';
        cardsHTML = '<div class="sol-cards">' + cardTile(solarCard, 'Birth card', false) + '</div>';
      }
      // Personality Sun hexagram (gate) — hexagram only, computed from the
      // same birth instant. Owned by js/sun-gate.js; no-op if not loaded.
      var gatesBlock = (window.SunGate && typeof window.SunGate.html === 'function') ? window.SunGate.html(res.t, cardsHTML) : '';
      // Full natal chart table (Body/Mind/Planet/Card/Sign/Degree), owned by
      // js/chart-table.js. Only reachable from here, which is the point: it
      // needs a real birth instant (date + clock time + birthplace), and the
      // Moon's gate is meaningless without one. No-op if not loaded.
      var chartBlock = (window.ChartTable && typeof window.ChartTable.html === 'function')
        ? window.ChartTable.html(res.t, solarCard) : '';
      out.innerHTML = verdictHTML + (gatesBlock || cardsHTML) + chartBlock;
      bindSolCards(out);
      if (chartBlock && window.bindZodiacTabs) window.bindZodiacTabs(out);
    }).catch(function (e) {
      out.innerHTML = '<p class="sol-hint">Could not compute solar time (' + (e && e.message ? e.message : 'error') + ').</p>';
    });
  }

  function populateZones() {
    var dl = el('solZoneList');
    try {
      Intl.supportedValuesOf('timeZone').forEach(function (z) {
        ZMAP[z.toLowerCase()] = z;
        if (dl) { var o = document.createElement('option'); o.value = z; dl.appendChild(o); }
      });
    } catch (e) {
      // Older browser without supportedValuesOf — hide the birthplace field.
      var f = el('solPlace');
      if (f && f.closest('.it-solar-field')) f.closest('.it-solar-field').style.display = 'none';
    }
  }

  function wire() {
    var panel = el('fSolar'), body = el('solBody');
    if (!panel) return;
    populateZones();
    panel.classList.add('open');
    if (body) body.hidden = false;
    render();
    var t = el('solTime'), p = el('solPlace');
    if (t) t.addEventListener('input', render);
    if (p) p.addEventListener('input', render);
  }

  window.SolarTime = { solarDate: solarDate, zoneFor: zoneFor, lonFor: lonFor, refresh: render };
  document.addEventListener('DOMContentLoaded', wire);
})();
