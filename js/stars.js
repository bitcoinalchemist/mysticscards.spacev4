(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initStars() {
    var canvas = document.querySelector('.stars-bg');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var stars = [], shooters = [], dpr = 1, W = 0, H = 0, raf = null, t = 0;
    var lastFrame = null, FRAME_INTERVAL = 1000 / 60, nextShooter = 0;

    function rand(a, b) { return a + Math.random() * (b - a); }

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.round(Math.min(170, (W * H) / 7000));
      stars = [];
      for (var i = 0; i < count; i++) {
        var roll = Math.random();
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: rand(0.35, roll < 0.18 ? 1.45 : 1.2),
          base: rand(0.12, 0.6),
          amp: rand(0.08, 0.4),
          spd: rand(0.5, 1.7),
          ph: rand(0, Math.PI * 2),
          drift: rand(0.008, 0.04),
          tone: roll < 0.12 ? 'violet' : (roll < 0.3 ? 'gold' : 'white')
        });
      }
    }

    function paintStar(s, a) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      var color = s.tone === 'violet' ? '196,183,238'
        : (s.tone === 'gold' ? '231,192,116' : '238,236,250');
      ctx.fillStyle = 'rgba(' + color + ',' + a + ')';
      ctx.fill();
    }

    function frame(ts) {
      if (typeof ts !== 'number') ts = performance.now();
      if (lastFrame !== null && ts - lastFrame < FRAME_INTERVAL) {
        raf = requestAnimationFrame(frame);
        return;
      }
      lastFrame = ts;
      t += 1 / 60;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.y -= s.drift;
        if (s.y < -2) { s.y = H + 2; s.x = Math.random() * W; }
        var a = s.base + s.amp * Math.sin(t * s.spd + s.ph);
        if (a < 0.04) a = 0.04;
        paintStar(s, a);
      }

      if (ts >= nextShooter && shooters.length < 1) {
        shooters.push({ x: rand(W * 0.08, W * 0.7), y: rand(H * 0.06, H * 0.5),
                        vx: rand(3.2, 4.8), vy: rand(1, 1.8), life: 1 });
        nextShooter = ts + rand(12000, 28000);
      }
      for (var j = shooters.length - 1; j >= 0; j--) {
        var sh = shooters[j];
        sh.x += sh.vx; sh.y += sh.vy; sh.life -= 0.02;
        if (sh.life <= 0) { shooters.splice(j, 1); continue; }
        var g = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 7, sh.y - sh.vy * 7);
        g.addColorStop(0, 'rgba(231,192,116,' + (0.5 * sh.life) + ')');
        g.addColorStop(1, 'rgba(231,192,116,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(sh.x - sh.vx * 7, sh.y - sh.vy * 7); ctx.stroke();
        ctx.beginPath(); ctx.arc(sh.x, sh.y, 1.15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,244,205,' + (0.75 * sh.life) + ')';
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    function staticFrame() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++) paintStar(stars[i], stars[i].base);
    }

    function start() {
      build();
      if (reduce) { staticFrame(); }
      else { if (raf) cancelAnimationFrame(raf); frame(); }
    }

    start();
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(start, 200);
    }, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initStars);
  else initStars();
})();
