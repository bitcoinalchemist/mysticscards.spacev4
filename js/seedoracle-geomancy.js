// seedoracle-geomancy.js — the sixteen geomantic figures: their data,
// the two SVG glyph renderers (compact dot-and-ring for the reference
// row; classical dot-pair for the detail popup), and the reference row
// itself with its click-to-open detail popup.
//
// v3 reconstruction — extracted from seedoracle.js on 2026-07-08. The
// IIFE was already fully self-contained at the tail of the file, so
// this is a clean lift: no signature changes, no aliasing needed. Its
// public API on window (GEO_FIGURES + GEO_FIG_SVG) and its callback to
// the journey IIFE (window._soGeoReady) are unchanged.
//
// Load order: after js/seedoracle.js in v3/seedoracle.html — the
// journey IIFE registers window._soGeoReady before this file runs, and
// GEO_FIGURES/GEO_FIG_SVG are only read inside the journey's
// renderEntropy() (a post-boot event handler), so being LATER is fine.
//
// (Comment block below carries the original notes on the encoding
// convention + why the compact glyphs use fill/stroke instead of two
// dots — historical context that shouldn't be lost.)

// ── Geomancy — the sixteen figures. In v2.0 the row lives in the PROOF chapter
// (it is the legend for the entropy readout: four lines, four bits, one hex
// digit per figure) rather than at the top of the page — same markup, same
// behaviour, relocated to where it is used.
// Each figure is 4 lines read Fire·Air·Water·Earth top to bottom (the
// classical top-down reading order); a single point is active (1), a double
// point is passive (0) — the classical Agrippa/Golden Dawn table. hex = the
// 4 bits read Earth-high..Fire-low as one nibble (bottom line = the biggest
// bit), so the row doubles as this page's entropy alphabet (each figure =
// one hex digit of raw seed entropy) without saying "hex" anywhere in the UI
// itself — that correspondence surfaces only in the detail panel once a
// figure is picked. Bottom-line-is-high deliberately MATCHES this site's own
// I Ching convention (js/iching.js: "bit0(LSB) = top, bit5(MSB) = bottom") —
// an earlier pass had this backwards (Fire/top = high bit), which put every
// figure at a different hex value than it has now; flipped 2026-07-01 once
// that mismatch was flagged. None of this numbering is historical geomancy —
// the figures themselves, their line patterns, and their planetary rulers
// are the traditional Agrippa/Golden Dawn table; assigning them a 0-15 order
// at all is a bridge this project built for the entropy-alphabet framing.
(function () {
  'use strict';
  var GEO_FIGURES = [
    { name: 'Populus',       epithet: 'the People',        lines: [0,0,0,0], ruler: 'Moon',
      keywords: ['Gathering','Reflection','Waiting','the Crowd'],
      text: "A field of people stands before you, each face turned toward whatever moves nearest. You have no shape of your own here, only what surrounds you, so choose the ground with care before you settle into it.\n\nWait before you decide. What looks like emptiness is a gathering, and a gathering takes on the color of its center. Let the right voice reach you before you agree to anything.\n\nLeft alone too long, the crowd forgets what it came for.",
      keynote: 'You take the shape of what surrounds you. Choose the ground well.' },
    { name: 'Laetitia',      epithet: 'Joy',               lines: [1,0,0,0], ruler: 'Jupiter',
      keywords: ['Gladness','Health','Rising','Laughter'],
      text: "Something in you lifts, unforced, the way laughter arrives before you decide to laugh. This favors health returning and spirits rising after a hard stretch.\n\nLet the good mood be evidence, not decoration. When things lighten this easily, take it as a sign the ground beneath you has actually changed for the better.\n\nBrush past it too quickly and you miss what it's telling you about the ground itself.",
      keynote: 'When it lifts this easily, believe the ground has changed.' },
    { name: 'Rubeus',        epithet: 'Red',               lines: [0,1,0,0], ruler: 'Mars',
      keywords: ['Passion','Heat','Conflict','Raw Want'],
      text: "Blood runs hot here, and whatever you feel, you feel it without a filter between you and it. Desire and anger are cut from the same cloth in this figure.\n\nName what you want plainly, then decide with a clear head whether to act on it. Heat serves you when you aim it.\n\nLet it aim itself instead, and it burns whoever stands closest, including you.",
      keynote: 'Name the want before you act on it. Aimed heat serves you.' },
    { name: 'Fortuna Minor', epithet: 'Lesser Fortune',    lines: [1,1,0,0], ruler: 'Sun',
      keywords: ['Swift Change','Fleeting Gain','Departure','the Quick Door'],
      text: "You come through the gate from the outside this time, carrying something that will not stay in your hands for long. This fortune is already moving toward the door.\n\nTake what is offered, use it while it is useful, and don't build your whole plan on it lasting. Swift fortune is still fortune. Spend it well before it spends itself.\n\nHold it too tight, waiting for it to become permanent, and you'll lose the use of it while it's still yours.",
      keynote: 'It is already moving toward the door. Use it before it goes.' },
    { name: 'Albus',         epithet: 'White',             lines: [0,0,1,0], ruler: 'Mercury',
      keywords: ['Calm','Clarity','Peace','Settling Water'],
      text: "The storm has passed and the water stands still enough to show your own face in it. Nothing here needs to move yet.\n\nThink before you act. This figure clears the mind, it does not decide for it, so use the quiet to see plainly rather than to leap. What you plan now in stillness will hold later.\n\nMistake this calm for the whole answer and you'll drift instead of choosing.",
      keynote: 'The water is calm enough to plan by, not yet to act by.' },
    { name: 'Amissio',       epithet: 'Loss',              lines: [1,0,1,0], ruler: 'Venus',
      keywords: ['Letting Go','Outflow','Parting','the Open Palm'],
      text: "What was in your hand is already moving away from it, like water through open fingers. Some things here are not meant to be held.\n\nDon't chase what is leaving. Chasing only speeds the loss and tires you besides. Let it go cleanly and keep your palm open, because this figure empties to make room.\n\nClose the fist around it anyway and you'll bruise your own hand for nothing.",
      keynote: 'It empties to make room. Keep the palm open for what comes next.' },
    { name: 'Conjunctio',    epithet: 'Union',             lines: [0,1,1,0], ruler: 'Mercury',
      keywords: ['Meeting','Joining','Exchange','the Crossroads'],
      text: "Two roads meet here and for a moment they run as one. Whatever you carry, you are about to set it down beside someone else's.\n\nThis favors partnership, negotiation, any place where two things must agree to move together. Speak plainly about what you bring and what you need, and the joining will hold.\n\nStay vague about either one and the roads only look joined, they never actually meet.",
      keynote: "Say plainly what you bring. A joining only holds if both sides know." },
    { name: 'Caput Draconis',epithet: 'Head of the Dragon',lines: [1,1,1,0], ruler: 'North Node',
      keywords: ['Beginning','Threshold','Arrival','the Open Door'],
      text: "A door swings open ahead of you and light comes through it before you've even reached the frame. Something new is arriving, and it arrives well.\n\nStep through while it stands open. This favors fresh starts, arrivals, and the first move in a longer sequence, so treat the moment as an invitation.\n\nStand at the frame testing the floorboards and the door has time to swing shut again.",
      keynote: "The door stands open and arrives well. Step through, don't test it." },
    { name: 'Tristitia',     epithet: 'Sorrow',            lines: [0,0,0,1], ruler: 'Saturn',
      keywords: ['Contraction','Grief','Depth','the Seed Buried'],
      text: "Everything here draws inward and down, the way a hand closes or a door shuts against the cold.\n\nLet what must fall away go. A seed buried works in the dark before it ever shows on the surface. Grieve what needs grieving, then wait for the ground to answer in its own season.\n\nHeld onto too long, this sorrow hardens into a wall instead of a season.",
      keynote: 'What closes now works in the dark. Let it, and wait for the season to turn.' },
    { name: 'Carcer',        epithet: 'Prison',            lines: [1,0,0,1], ruler: 'Saturn',
      keywords: ['Delay','Structure','Confinement','the Walls'],
      text: "Walls stand on every side, and for now they are not moving no matter how hard you push. This figure marks a season of limits, not a life sentence.\n\nUse the confinement instead of fighting it. A cell teaches patience that open ground never will, and every wall in this old system opens on its own schedule.\n\nFight the walls instead of the schedule and you only wear yourself out against stone.",
      keynote: 'The walls keep their own schedule. Learn patience while you wait.' },
    { name: 'Acquisitio',    epithet: 'Gain',              lines: [0,1,0,1], ruler: 'Jupiter',
      keywords: ['Increase','Growth','Reward','the Open Hand'],
      text: "Your hand is out and something is coming to fill it, slowly, the way weight settles into a scale. This favors patient accumulation over the sudden windfall.\n\nSay yes to the offer in front of you, and keep working while it arrives. What grows here grows because you kept tending it, not because you asked once and stopped.\n\nStop tending too soon and the growth stalls before it ever reaches your hand.",
      keynote: 'Keep the hand open and keep tending. This grows slowly and stays.' },
    { name: 'Puer',          epithet: 'the Boy',           lines: [1,1,0,1], ruler: 'Mars',
      keywords: ['Courage','Impulse','Action','Raw Youth'],
      text: "Energy moves fast here, ahead of thought, the way a hand reaches before the mind decides to reach. This favors boldness and quick decisive action.\n\nMove while the nerve is with you, but check your aim first. What this figure gives in courage it can take back in carelessness.\n\nSwing before you look and the same speed that could have served you does the damage instead.",
      keynote: 'Move while the nerve is with you, but look before you swing.' },
    { name: 'Fortuna Major', epithet: 'Greater Fortune',   lines: [0,0,1,1], ruler: 'Sun',
      keywords: ['Triumph','Favor','Entering','Earned Success'],
      text: "You come through the gate from the inside, carrying strength you already built before anyone was watching. What meets you outside only confirms it.\n\nThis fortune is the return on work already done. Walk forward, the door stands open to you. Only remember what let you arrive here, and keep doing it.\n\nForget the work behind it and the fortune reads as luck, then vanishes like luck does.",
      keynote: 'You built this before anyone was watching. Now walk through.' },
    { name: 'Puella',        epithet: 'the Girl',          lines: [1,0,1,1], ruler: 'Venus',
      keywords: ['Grace','Harmony','Gentleness','Beauty'],
      text: "Something here moves soft and unhurried, the way a hand smooths a crease from cloth. This favors charm, affection, and quiet diplomacy over force.\n\nChoose the gentle approach. What force cannot move, grace usually can, and this is a season where softness reads as strength.\n\nMistake the softness for weakness and push harder anyway, and you'll crease the cloth you meant to smooth.",
      keynote: 'Grace moves what force cannot. Choose the soft approach here.' },
    { name: 'Cauda Draconis',epithet: 'Tail of the Dragon',lines: [0,1,1,1], ruler: 'South Node',
      keywords: ['Release','Ending','Closing','Letting Go'],
      text: "A door swings shut behind you, and the room on the other side goes dark. You do not need to see it anymore to know it is finished.\n\nLet this end cleanly. Reaching back for what has already closed only drags a weight you no longer need to carry. Whatever comes next needs both your hands free.\n\nKeep one hand on the closed door and the new thing arrives to find you only half ready.",
      keynote: 'Both hands free. What is finished does not need carrying.' },
    { name: 'Via',           epithet: 'the Way',           lines: [1,1,1,1], ruler: 'Moon',
      keywords: ['Movement','Change','Travel','Restlessness'],
      text: "Nothing here sits still, the ground itself keeps shifting under your feet like a road with no end in sight. This figure marks travel, transition, and change for its own sake.\n\nWalk with the motion instead of fighting it. Whatever this touches will not stay as it is, so plan for change rather than permanence.\n\nDig in and root yourself here anyway, and the moving ground will simply carry you regardless.",
      keynote: 'The ground keeps moving. Plan for change rather than permanence.' }
  ];
  // index in GEO_FIGURES already equals its hex value (0-f); keep a hex string per entry.
  // (order above is bottom-line-is-high binary counting: Earth=bit3, Water=bit2, Air=bit1, Fire=bit0 — see the comment block above this IIFE.)
  GEO_FIGURES.forEach(function (f, i) { f.hex = i.toString(16); });
  window.GEO_FIGURES = GEO_FIGURES;
  // Exposed for the proof chapter's entropy readout (each hex digit drawn as its
  // figure); tell the main IIFE we're ready so it can re-render that row.
  window.GEO_FIG_SVG = geoFigureSVG;
  if (window._soGeoReady) window._soGeoReady();

  // Each figure drawn as 4 stacked rows, one dot per row: a single point
  // reads as a SOLID dot, a double point (passive line) reads as a HOLLOW
  // ring at the same spot — the classical geomantic single-vs-double point
  // distinction, kept legible at any size. An earlier version drew passive
  // lines as two dots spaced side by side (closer to the historical mark),
  // but that needs real width to read; once compressed to fit all sixteen
  // figures on one line on a phone (~12-15px per glyph) the two dots blur
  // into a smear. Fill-vs-stroke on a single dot resolves fine down to a
  // handful of px (like a radio button), so the glyph now needs only ONE
  // dot's worth of width per row instead of two, and the whole row fits at
  // full, uncompressed size even on a 375px-wide phone (verified via the
  // page's live gap/padding values — spare room at every common breakpoint,
  // no shrinking needed). Distinct from the trigram/hexagram solid-vs-broken
  // BAR language used elsewhere on the site, so this still reads as its own
  // system at a glance.
  function geoFigureSVG(lines, size) {
    size = size || 1;
    var r = 3 * size;                    // dot radius
    var sw = Math.max(1, 1.3 * size);    // ring stroke width (passive lines)
    var rowGap = 3 * size;               // vertical gap between the 4 rows
    var d = r * 2;                       // dot diameter
    var totalH = 4 * d + 3 * rowGap;
    var w = d + sw * 2 + size;           // just enough width for one dot + its ring
    var cx = w / 2;
    var dots = [];
    for (var i = 0; i < 4; i++) {
      var cy = i * (d + rowGap) + r;
      if (lines[i] === 1) {
        dots.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="var(--gold)"/>');
      } else {
        dots.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - sw / 2) + '" fill="none" stroke="var(--gold)" stroke-width="' + sw + '"/>');
      }
    }
    return '<svg width="' + w + '" height="' + totalH + '" viewBox="0 0 ' + w + ' ' + totalH + '" aria-hidden="true">' + dots.join('') + '</svg>';
  }

  // The original glyph: a single point drawn as one centred dot, a double
  // point as two dots side by side — the traditional geomantic mark, spatial
  // rather than fill/stroke. Only used for the large detail-panel figure,
  // which is a single glyph with plenty of room, not sixteen packed into a
  // row, so the width this needs is never a constraint there.
  function geoFigureSVGClassic(lines, size) {
    size = size || 1;
    var rowH = 7 * size, gap = 5 * size, w = 15 * size, r = 2.3 * size;
    var totalH = 4 * rowH + 3 * gap;
    var cx = w / 2, offset = w / 4;
    var dots = [];
    for (var i = 0; i < 4; i++) {
      var cy = i * (rowH + gap) + rowH / 2;
      if (lines[i] === 1) {
        dots.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="var(--gold)"/>');
      } else {
        dots.push('<circle cx="' + (cx - offset) + '" cy="' + cy + '" r="' + r + '" fill="var(--gold)"/>');
        dots.push('<circle cx="' + (cx + offset) + '" cy="' + cy + '" r="' + r + '" fill="var(--gold)"/>');
      }
    }
    return '<svg width="' + w + '" height="' + totalH + '" viewBox="0 0 ' + w + ' ' + totalH + '" aria-hidden="true">' + dots.join('') + '</svg>';
  }

  var row = document.getElementById('geo-row');
  if (!row) return;   // row markup not on this build yet

  var pop = document.getElementById('geoPop');
  var dwrap = pop ? pop.querySelector('.so-geo-detailwrap') : null;
  if (dwrap) dwrap.inert = true;
  var cur = -1, cells = [];

  function setActiveCell(idx) {
    cells.forEach(function (c) {
      c.classList.remove('active');
      c.setAttribute('aria-pressed', 'false');
    });
    if (idx >= 0 && cells[idx]) {
      cells[idx].classList.add('active');
      cells[idx].setAttribute('aria-pressed', 'true');
    }
  }

  function show(idx) {
    var f = GEO_FIGURES[idx];
    if (!f) return;
    cur = idx;
    document.getElementById('geoFig').innerHTML = geoFigureSVGClassic(f.lines, 2.2);
    document.getElementById('geoName').textContent = f.name;
    document.getElementById('geoSub').textContent = f.epithet + '  ·  ruled by ' + f.ruler + '  ·  hex ' + f.hex;
    document.getElementById('geoKws').innerHTML = f.keywords.map(function (k) { return '<span class="so-geo-kw">' + k + '</span>'; }).join('');
    document.getElementById('geoText').innerHTML = f.text.split('\n\n').map(function (p) { return '<p>' + p + '</p>'; }).join('');
    document.getElementById('geoKeynote').textContent = f.keynote;
    pop.classList.add('open');
    if (dwrap) dwrap.inert = false;
    setActiveCell(idx);
  }
  function hide() {
    pop.classList.remove('open');
    if (dwrap) dwrap.inert = true;
    setActiveCell(-1);
    cur = -1;
  }
  function pick(idx) { if (cur === idx) hide(); else show(idx); }

  GEO_FIGURES.forEach(function (f, idx) {
    var cell = document.createElement('div');
    cell.className = 'so-geo-cell';
    cell.innerHTML = geoFigureSVG(f.lines, 1);
    cell.setAttribute('role', 'button');
    cell.setAttribute('tabindex', '0');
    cell.setAttribute('aria-pressed', 'false');
    cell.setAttribute('aria-label', f.name + ' — show meaning');
    cell.addEventListener('click', function () { pick(idx); });
    cell.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(idx); return; }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        var dir = e.key === 'ArrowRight' ? 1 : -1;
        var t = ((cur >= 0 ? cur : idx) + dir + 16) % 16;
        if (cur >= 0) show(t);
        cells[t].focus();
      }
    });
    cells.push(cell); row.appendChild(cell);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && cur >= 0) hide();
  });
})();
