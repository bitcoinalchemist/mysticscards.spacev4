var CASTFIELD_SUIT_SVG = {
  '♠': '<svg class="pip-svg" viewBox="0 0 100 100" aria-hidden="true"><path d="M50,8 C30,26 6,50 6,66 C6,82 22,90 36,82 C42,78 47,74 50,70 L40,95 L60,95 L50,70 C53,74 58,78 64,82 C78,90 94,82 94,66 C94,50 70,26 50,8 Z"/></svg>',
  '♥': '<svg class="pip-svg" viewBox="0 0 100 100" aria-hidden="true"><path d="M50,86 C45,79 15,58 15,34 C15,22 24,14 35,14 C43,14 48,20 50,27 C52,20 57,14 65,14 C76,14 85,22 85,34 C85,58 55,79 50,86 Z"/></svg>',
  '♦': '<svg class="pip-svg" viewBox="0 0 100 100" aria-hidden="true"><path d="M50,6 L86,50 L50,94 L14,50 Z"/></svg>',
  '♣': '<svg class="pip-svg" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="30" r="20"/><circle cx="27" cy="58" r="20"/><circle cx="73" cy="58" r="20"/><path d="M44,46 L40,96 L60,96 L56,46 Z"/></svg>'
};

(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var field = document.querySelector('.castfield-stage .field');
  if (!field) return;

  var STORE_KEY = 'castfield_state';
  var SCHEMA = 2;
  function readSaved() {
    try {
      var raw = sessionStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || s.v !== SCHEMA || !Array.isArray(s.minis)) return null;
      return s;
    } catch (e) { return null; }
  }
  var saved = readSaved();

  var TUNE = {

    COUNT_DESKTOP: 52,
    COUNT_MOBILE:  52,
    SWAP_INTERVAL: 3.5,
    R_MIN: 230,
    R_SPAN: 380,
    SHELLS: 3,
    W_INNER: 0.30,
    W_FALLOFF: 1.15,
    EASE_RATE: 1.2,
    BREATHE: 0.025,
    SURGE_RATE: 0.045,
    SURGE_LEN: 2.6,
    SURGE_BOOST: 1.9,
    SWOOP_SHARE: 0.12,
    SWOOP_Z: 260,
    FLIP_SPEED_MULT: 1.25,
    MODE: 3,

    MAG_RADIUS: 190,
    MAG_PUSH: 85,
    MAG_ATTACK: 7,
    MAG_RELEASE: 2.5,
    PARALLAX_DEG: 0,

    RIPPLE_SPEED: 520,
    RIPPLE_BAND: 95,
    RIPPLE_PUSH: 90,
    RIPPLE_LIFE: 1.15,
    CAST_PULSE: 1.6,

    BAND_HALF_W: 380,
    BAND_TOP: -130,
    BAND_BOT: 195,
    BAND_DIM: 0.3,
    BAND_RECEDE: 90,

    DEPTH_SCALE: 0.2,
    DEPTH_SAT: 0.25,

    BANK_VEL: 0,
    BANK_MAG: 0,
    BANK_MAX: 12,
    EDGE_DIM: 0.22,
    DISTURB_PUSH: 45,
    DISTURB_DUR: 0.7,
    DISTURB_COOLDOWN: 2.5,
    FRAME_MIN_MS: 1000 / 30,
    FRAME_IDLE_MS: 1000 / 12,
    IDLE_AFTER_MS: 2200,
    FILTER_BRIGHT_STEPS: 8,
    FILTER_SAT_STEPS: 5,
    IDLE_SWAP_MULT: 2
  };

  var SUITS = [
    { n: 'spades',   g: '♠' },
    { n: 'hearts',   g: '♥' },
    { n: 'diamonds', g: '♦' },
    { n: 'clubs',    g: '♣' }
  ];
  var COURTS = ['J', 'Q', 'K'];
  var NUMS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  var SUIT_KEY = { spades: 'S', hearts: 'H', diamonds: 'D', clubs: 'C' };

  var PIP_LAYOUTS = {
    'A':  [[50,50,0]],
    '2':  [[50,8,0],[50,92,1]],
    '3':  [[50,8,0],[50,50,0],[50,92,1]],
    '4':  [[25,8,0],[75,8,0],[25,92,1],[75,92,1]],
    '5':  [[25,8,0],[75,8,0],[50,50,0],[25,92,1],[75,92,1]],
    '6':  [[25,8,0],[75,8,0],[25,50,0],[75,50,0],[25,92,1],[75,92,1]],
    '7':  [[25,8,0],[75,8,0],[50,29,0],[25,50,0],[75,50,0],[25,92,1],[75,92,1]],
    '8':  [[25,8,0],[75,8,0],[50,29,0],[25,50,0],[75,50,0],[50,71,1],[25,92,1],[75,92,1]],
    '9':  [[25,8,0],[75,8,0],[25,36,0],[75,36,0],[50,50,0],[25,64,1],[75,64,1],[25,92,1],[75,92,1]],
    '10': [[25,8,0],[75,8,0],[50,22,0],[25,36,0],[75,36,0],[25,64,1],[75,64,1],[50,78,1],[25,92,1],[75,92,1]]
  };
  var PIP_SVG = CASTFIELD_SUIT_SVG;
  function pipMark(sym) { return PIP_SVG[sym] || sym; }

  function faceHTML(card) {
    var rank = card.rank, suit = card.suit, mark = pipMark(card.sym);
    var corners =
      '<div class="card-corner card-tl"><span class="cc-rank">' + rank + '</span></div>' +
      '<div class="card-corner card-br"><span class="cc-rank">' + rank + '</span></div>';
    if (rank === 'J' || rank === 'Q' || rank === 'K') {
      return corners +
        '<span class="court-pip" style="left:31%;top:23.1%">' + mark + '</span>' +
        '<span class="court-pip" style="left:69%;top:76.9%;transform:translate(-50%,-50%) rotate(180deg)">' + mark + '</span>' +
        '<img class="court-art" src="assets/cards/' + rank + SUIT_KEY[suit] + '.webp" alt="" loading="lazy">';
    }
    var aceLarge = (rank === 'A' && suit === 'spades');
    var pips = (PIP_LAYOUTS[rank] || []).map(function (p) {
      return '<span class="pip' + (p[2] ? ' inv' : '') + (aceLarge ? ' ace' : '') +
             '" style="left:' + p[0] + '%;top:' + p[1] + '%">' + mark + '</span>';
    }).join('');
    return corners + '<div class="card-pips">' + pips + '</div>';
  }

  var ALL_RANKS = NUMS.concat(COURTS);
  function buildDeck() {
    var d = [];
    for (var si = 0; si < SUITS.length; si++)
      for (var ri = 0; ri < ALL_RANKS.length; ri++)
        d.push({ rank: ALL_RANKS[ri], suit: SUITS[si].n, sym: SUITS[si].g });
    for (var i = d.length - 1; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0, t = d[i]; d[i] = d[j]; d[j] = t;
    }
    return d;
  }

  function buildFront(card) {
    var side = document.createElement('div');
    side.className = 'side front';
    var sc = document.createElement('div');
    sc.className = 'spread-card ' + card.suit;
    sc.innerHTML = faceHTML(card);
    side.appendChild(sc);
    return side;
  }
  function buildBack() {
    var side = document.createElement('div');
    side.className = 'side card-back';
    var coin = document.createElement('span');
    coin.className = 'cb-coin';
    side.appendChild(coin);
    return side;
  }

  function shellYaw(shell)  { return [0.0, 0.9, -0.9][shell % 3]; }
  function shellFlat(shell) { return [0.58, 0.66, 0.74][shell % 3]; }
  function shellDir(shell)  { return TUNE.MODE === 3 ? (shell % 2 ? -1 : 1) : 1; }

  var small = window.innerWidth < 640;
  var COUNT = small ? TUNE.COUNT_MOBILE : TUNE.COUNT_DESKTOP;
  var sUnit = small ? 0.66 : 1;

  var deck = buildDeck();
  var minis = [];

  function pick(s, key, fresh) { return s && (key in s) ? s[key] : fresh; }
  for (var i = 0; i < COUNT; i++) {
    var s_i = saved && saved.minis[i] || null;

    var card = s_i && s_i.rank && s_i.suit && s_i.sym
      ? { rank: s_i.rank, suit: s_i.suit, sym: s_i.sym }
      : deck[i % deck.length];

    var el = document.createElement('div');
    el.className = 'mini';
    var fx = document.createElement('div');
    fx.className = 'mini-fx';
    var flip = document.createElement('div');
    flip.className = 'flip';
    var front = buildFront(card), back = buildBack();
    flip.appendChild(front); flip.appendChild(back);
    fx.appendChild(flip);
    el.appendChild(fx);
    field.appendChild(el);

    var frac = i / COUNT;
    var rFresh = (TUNE.R_MIN + (frac + (Math.random() - 0.5) * 0.12) * TUNE.R_SPAN) * sUnit;
    rFresh = Math.max(TUNE.R_MIN * sUnit, rFresh);
    var r = pick(s_i, 'r', rFresh);
    var shell = pick(s_i, 'shell', Math.min(TUNE.SHELLS - 1, Math.floor(frac * TUNE.SHELLS)));
    var wBase = pick(s_i, 'wBase', TUNE.W_INNER / Math.pow(r / (TUNE.R_MIN * sUnit), TUNE.W_FALLOFF));
    minis.push({
      card: card,
      el: el, flip: flip, front: front, back: back,
      r: r, shell: shell, wBase: wBase,
      a: pick(s_i, 'a', Math.random() * Math.PI * 2),
      w: pick(s_i, 'w', 0),
      yaw: pick(s_i, 'yaw', shellYaw(shell)),
      flat: pick(s_i, 'flat', shellFlat(shell)),
      yawJit: pick(s_i, 'yawJit', (Math.random() - 0.5) * 0.25),
      rz: pick(s_i, 'rz', (110 + r * 0.28) * sUnit),
      bob: pick(s_i, 'bob', 4 + Math.random() * 7),
      bobPhase: pick(s_i, 'bobPhase', Math.random() * Math.PI * 2),
      tiltZ: pick(s_i, 'tiltZ', (Math.random() * 2 - 1) * 9),
      breathe: pick(s_i, 'breathe', Math.random() * Math.PI * 2),
      spinRate: pick(s_i, 'spinRate', (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 18)),
      spinPhase: pick(s_i, 'spinPhase', Math.random() * 360),
      ySpinRate: pick(s_i, 'ySpinRate', (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 10)),
      ySpinPhase: pick(s_i, 'ySpinPhase', Math.random() * 360),
      xSpinRate: pick(s_i, 'xSpinRate', (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 8)),
      xSpinPhase: pick(s_i, 'xSpinPhase', Math.random() * 360),

      surgeAt: -1, surgeMul: 1, glow: 0,
      mx: 0, my: 0,
      dim: 1, dimT: 1,
      flickAt: -1, disturbT: -9,
      swooper: pick(s_i, 'swooper', Math.random() < TUNE.SWOOP_SHARE),

      type: pick(s_i, 'type', (Math.random() < 0.52 ? 'rocker' : Math.random() < 0.5 ? 'flip' : 'flick')),

      restBase: pick(s_i, 'restBase', (Math.random() < 0.5 ? 180 : 0)),
      amp: pick(s_i, 'amp', 22 + Math.random() * 30),
      flipSpeed: pick(s_i, 'flipSpeed', (0.6 + Math.random() * 0.7) * TUNE.FLIP_SPEED_MULT),
      flipRate: pick(s_i, 'flipRate', (0.10 + Math.random() * 0.13) * TUNE.FLIP_SPEED_MULT),
      flickRate: pick(s_i, 'flickRate', (0.05 + Math.random() * 0.06) * TUNE.FLIP_SPEED_MULT),
      diag: pick(s_i, 'diag', (Math.random() < 0.5 ? 1 : -1) * (45 + Math.random() * 10)),
      flickSpin: pick(s_i, 'flickSpin', 16 + Math.random() * 26),
      dir: pick(s_i, 'dir', Math.random() < 0.5 ? -1 : 1),
      flipPhase: pick(s_i, 'flipPhase', Math.random()),
      flipX: pick(s_i, 'flipX', Math.random() < 0.22),
      scale: pick(s_i, 'scale', 0.72 + Math.random() * 0.72),
      filterKey: ''
    });
  }

  function setMiniVars(o) {
    o.el.style.setProperty('--cast-bob', o.bob.toFixed(1) + 'px');
    o.el.style.setProperty('--cast-bob-dur', (4.2 + Math.abs(o.bobPhase % Math.PI)).toFixed(2) + 's');
    o.el.style.setProperty('--cast-bob-delay', (-o.bobPhase * 1.7).toFixed(2) + 's');
    o.el.style.setProperty('--cast-tilt-z', o.tiltZ.toFixed(1) + 'deg');
    o.el.style.setProperty('--cast-flip-y-base', (o.restBase + o.ySpinPhase).toFixed(1) + 'deg');
    o.el.style.setProperty('--cast-flip-y-span', Math.max(18, Math.abs(o.ySpinRate) * 18).toFixed(1) + 'deg');
    o.el.style.setProperty('--cast-flip-y-dur', (360 / Math.max(3, Math.abs(o.ySpinRate))).toFixed(2) + 's');
    o.el.style.setProperty('--cast-flip-x-base', o.xSpinPhase.toFixed(1) + 'deg');
    o.el.style.setProperty('--cast-flip-x-span', Math.max(10, Math.abs(o.xSpinRate) * 16).toFixed(1) + 'deg');
    o.el.style.setProperty('--cast-flip-x-dur', (360 / Math.max(2, Math.abs(o.xSpinRate))).toFixed(2) + 's');
    o.el.style.setProperty('--cast-flip-delay', (-(o.flipPhase || 0) * 8).toFixed(2) + 's');
  }
  minis.forEach(setMiniVars);

  var visibleKeys = {};
  for (var mv = 0; mv < minis.length; mv++) {
    var c0 = minis[mv].card;
    visibleKeys[c0.rank + '_' + c0.suit] = 1;
  }
  var reserve = deck.filter(function (c) {
    return !visibleKeys[c.rank + '_' + c.suit];
  });

  function writeSaved() {
    try {
      var dump = minis.map(function (o) {
        return {
          rank: o.card.rank, suit: o.card.suit, sym: o.card.sym,
          r: o.r, shell: o.shell, wBase: o.wBase, w: o.w,
          a: o.a, yaw: o.yaw, yawJit: o.yawJit,
          flat: o.flat, rz: o.rz,
          bob: o.bob, bobPhase: o.bobPhase, tiltZ: o.tiltZ,
          spinRate: o.spinRate, spinPhase: o.spinPhase,
          ySpinRate: o.ySpinRate, ySpinPhase: o.ySpinPhase,
          xSpinRate: o.xSpinRate, xSpinPhase: o.xSpinPhase,
          breathe: o.breathe,
          type: o.type, restBase: o.restBase, amp: o.amp,
          flipSpeed: o.flipSpeed, flipRate: o.flipRate, flickRate: o.flickRate,
          diag: o.diag, flickSpin: o.flickSpin, dir: o.dir,
          flipPhase: o.flipPhase, flipX: o.flipX, scale: o.scale,
          swooper: o.swooper
        };
      });
      sessionStorage.setItem(STORE_KEY, JSON.stringify({ v: SCHEMA, minis: dump }));
    } catch (e) {  }
  }
  window.addEventListener('pagehide', writeSaved);

  function bump(f) { return f <= 0 || f >= 1 ? 0 : Math.sin(f * Math.PI); }

  function step(o, dt, t) {

    var target = o.wBase * shellDir(o.shell);
    o.w += (target - o.w) * Math.min(1, dt * TUNE.EASE_RATE);

    var yawT = shellYaw(o.shell) + o.yawJit;
    o.yaw += (yawT - o.yaw) * Math.min(1, dt * TUNE.EASE_RATE * 0.6);

    var sMul = 1, sBump = 0;
    if (TUNE.MODE === 2) {
      if (o.surgeAt < 0 && Math.random() < TUNE.SURGE_RATE * dt) o.surgeAt = t;
      if (o.surgeAt >= 0) {
        var f = (t - o.surgeAt) / TUNE.SURGE_LEN;
        if (f >= 1) { o.surgeAt = -1; }
        else { sBump = bump(f); sMul = 1 + (TUNE.SURGE_BOOST - 1) * sBump; }
      }
    }
    o.glow += (sBump - o.glow) * Math.min(1, dt * 4);

    o.a += o.w * sMul * dt;

    var tx = 0, ty = 0;
    var breathe = 1 + Math.sin(t * 0.23 + o.breathe) * TUNE.BREATHE;
    var ox = Math.cos(o.a) * o.r * breathe;
    var oy = Math.sin(o.a) * o.r * breathe * o.flat;
    if (pointer.on) {
      var dx = ox - pointer.x, dy = oy - pointer.y;
      var d = Math.hypot(dx, dy);
      if (d < TUNE.MAG_RADIUS * sUnit) {
        var fall = 1 - d / (TUNE.MAG_RADIUS * sUnit);
        var push = TUNE.MAG_PUSH * sUnit * fall * fall;
        if (d > 0.5) { tx += dx / d * push; ty += dy / d * push; }
      }
    }
    for (var ri = 0; ri < ripples.length; ri++) {
      var rp = ripples[ri];
      var age = t - rp.t0;
      var rdx = ox - rp.x, rdy = oy - rp.y;
      var rd = Math.hypot(rdx, rdy);
      var front = age * TUNE.RIPPLE_SPEED * sUnit;
      var band = Math.max(0, 1 - Math.abs(rd - front) / (TUNE.RIPPLE_BAND * sUnit));
      var fade = 1 - age / TUNE.RIPPLE_LIFE;
      if (band > 0 && fade > 0 && rd > 0.5) {
        var rpush = TUNE.RIPPLE_PUSH * sUnit * band * band * fade * (rp.mult || 1);
        tx += rdx / rd * rpush; ty += rdy / rd * rpush;
      }
    }

    if (Math.hypot(tx, ty) > TUNE.DISTURB_PUSH * sUnit &&
        t - o.disturbT > TUNE.DISTURB_COOLDOWN) {
      o.disturbT = t; o.flickAt = t;
    }

    var rate = (Math.abs(tx) + Math.abs(ty) > Math.abs(o.mx) + Math.abs(o.my))
      ? TUNE.MAG_ATTACK : TUNE.MAG_RELEASE;
    o.mx += (tx - o.mx) * Math.min(1, dt * rate);
    o.my += (ty - o.my) * Math.min(1, dt * rate);

    o.dim += (o.dimT - o.dim) * Math.min(1, dt * 3);

    paint(o, t);
  }

  function paint(o, t) {
    var breathe = 1 + Math.sin(t * 0.23 + o.breathe) * TUNE.BREATHE;
    var r = o.r * breathe;
    var x = Math.cos(o.a) * r + o.mx;
    var y = Math.sin(o.a) * r * o.flat + o.my;
    var z = Math.sin(o.a + o.yaw) * o.rz;
    if (o.swooper && o.glow > 0.01) z += o.glow * TUNE.SWOOP_Z * sUnit;
    var depth = (Math.sin(o.a + o.yaw) * o.rz + o.rz) / (2 * o.rz);

    var inBand = Math.abs(x) < TUNE.BAND_HALF_W * sUnit &&
                 y > TUNE.BAND_TOP * sUnit && y < TUNE.BAND_BOT * sUnit;
    o.dimT = inBand ? TUNE.BAND_DIM : 1;
    var dim = reduce ? o.dimT : o.dim;
    z -= (1 - dim) * TUNE.BAND_RECEDE;

    var cos = 1;

    var vx = -Math.sin(o.a) * r * o.w;
    var vy = Math.cos(o.a) * r * o.flat * o.w;
    function clampBank(v) { return Math.max(-TUNE.BANK_MAX, Math.min(TUNE.BANK_MAX, v)); }
    var bankY = clampBank(vx * TUNE.BANK_VEL + o.mx * TUNE.BANK_MAG);
    var bankX = clampBank(-(vy * TUNE.BANK_VEL + o.my * TUNE.BANK_MAG));

    var rotZ = o.spinPhase + t * o.spinRate;
    var scale = o.scale * (1 + (o.swooper ? o.glow * 0.22 : o.glow * 0.06))
              * (1 - TUNE.DEPTH_SCALE / 2 + depth * TUNE.DEPTH_SCALE);
    o.el.style.transform =
      'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px)' +
      ' rotateX(' + bankX.toFixed(1) + 'deg) rotateY(' + bankY.toFixed(1) + 'deg)' +
      ' scale(' + scale.toFixed(3) + ') rotateZ(' + rotZ.toFixed(1) + 'deg)';

    o.el.style.opacity = ((0.14 + depth * 0.22 + o.glow * 0.06) * dim).toFixed(3);

    var edge = 1 - TUNE.EDGE_DIM * (1 - Math.abs(cos));
    var bright = (0.7 + depth * 0.38 + o.glow * 0.25) * edge;
    var sat = 0.9 + depth * TUNE.DEPTH_SAT;
    var brightQ = Math.round(bright * TUNE.FILTER_BRIGHT_STEPS) / TUNE.FILTER_BRIGHT_STEPS;
    var satQ = Math.round(sat * TUNE.FILTER_SAT_STEPS) / TUNE.FILTER_SAT_STEPS;
    var filterKey = brightQ.toFixed(2) + '/' + satQ.toFixed(2);
    if (filterKey !== o.filterKey) {
      o.filterKey = filterKey;
      o.el.style.filter = 'brightness(' + brightQ.toFixed(2) + ') saturate(' + satQ.toFixed(2) + ')';
    }
  }

  if (reduce) { minis.forEach(function (o) { paint(o, 0); }); return; }

  var pointer = { x: 0, y: 0, on: false };
  var ripples = [];
  var lastActiveAt = performance.now();
  var idleState = false;
  function markActive(ts) {
    lastActiveAt = ts || performance.now();
    if (idleState) {
      idleState = false;
      field.classList.remove('is-idle');
    }
  }
  function setIdle(on) {
    if (idleState === on) return;
    idleState = on;
    field.classList.toggle('is-idle', on);
  }
  function toField(cx, cy) {
    return { x: cx - window.innerWidth * 0.5, y: cy - window.innerHeight * 0.47 };
  }
  window.addEventListener('pointermove', function (e) {
    var p = toField(e.clientX, e.clientY);
    pointer.x = p.x; pointer.y = p.y; pointer.on = true;
    markActive();
  }, { passive: true });
  window.addEventListener('pointerdown', function (e) {
    var p = toField(e.clientX, e.clientY);
    pointer.x = p.x; pointer.y = p.y; pointer.on = true;
    markActive();
    if (e.pointerType !== 'mouse') {
      ripples.push({ x: p.x, y: p.y, t0: performance.now() / 1000 });
      if (ripples.length > 4) ripples.shift();
    }
  }, { passive: true });
  window.addEventListener('pointerup', function (e) {
    if (e.pointerType !== 'mouse') pointer.on = false;
  }, { passive: true });
  document.addEventListener('pointerleave', function () { pointer.on = false; });
  window.addEventListener('blur', function () { pointer.on = false; });

  window.CASTING_PULSE = function () {
    markActive();
    ripples.push({ x: 0, y: 0, t0: performance.now() / 1000, mult: TUNE.CAST_PULSE });
    if (ripples.length > 4) ripples.shift();
  };

  var last = null, raf, parX = 0, parY = 0, lastSwap = 0, frameCarry = 0;
  function frame(ts) {
    if (!document.body.classList.contains('bg-enabled')) {
      raf = null;
      return;
    }
    if (last === null) last = ts;
    var hasRipples = ripples.length > 0;
    var idleNow = !pointer.on && !hasRipples && (ts - lastActiveAt >= TUNE.IDLE_AFTER_MS);
    setIdle(idleNow);
    var frameMin = idleNow ? TUNE.FRAME_IDLE_MS : TUNE.FRAME_MIN_MS;
    frameCarry += ts - last;
    last = ts;
    if (frameCarry < frameMin) {
      raf = requestAnimationFrame(frame);
      return;
    }
    var dt = Math.min(0.05, frameCarry / 1000);
    frameCarry = 0;
    var t = ts / 1000;

    for (var k = ripples.length - 1; k >= 0; k--)
      if (t - ripples[k].t0 > TUNE.RIPPLE_LIFE) ripples.splice(k, 1);

    var pxT = pointer.on ? (pointer.x / (window.innerWidth * 0.5)) : 0;
    var pyT = pointer.on ? (pointer.y / (window.innerHeight * 0.47)) : 0;
    parX += ((-pyT * TUNE.PARALLAX_DEG) - parX) * Math.min(1, dt * 2);
    parY += ((pxT * TUNE.PARALLAX_DEG) - parY) * Math.min(1, dt * 2);
    field.style.transform = 'rotateX(' + parX.toFixed(2) + 'deg) rotateY(' + parY.toFixed(2) + 'deg)';
    for (var i = 0; i < minis.length; i++) step(minis[i], dt, t);

    var swapInterval = idleNow ? TUNE.SWAP_INTERVAL * TUNE.IDLE_SWAP_MULT : TUNE.SWAP_INTERVAL;
    if (reserve.length && t - lastSwap >= swapInterval) {
      lastSwap = t;
      var mi = (Math.random() * minis.length) | 0;
      var m = minis[mi];
      var ri = (Math.random() * reserve.length) | 0;
      var incoming = reserve[ri];
      reserve[ri] = m.card;
      m.card = incoming;
      var newFront = buildFront(incoming);
      m.flip.replaceChild(newFront, m.front);
      m.front = newFront;
    }

    raf = requestAnimationFrame(frame);
  }
  if (document.body.classList.contains('bg-enabled')) raf = requestAnimationFrame(frame);
  window.addEventListener('mc-bg-toggle', function (e) {
    var on = !!(e && e.detail && e.detail.enabled);
    if (!on) {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      return;
    }
    if (!reduce && !raf) {
      last = null;
      frameCarry = 0;
      raf = requestAnimationFrame(frame);
    }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = null; }
    else if (document.body.classList.contains('bg-enabled') && !raf) { last = null; frameCarry = 0; raf = requestAnimationFrame(frame); }
  });
})();
