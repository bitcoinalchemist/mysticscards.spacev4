(function () {
  'use strict';

  var page = window.location.pathname.split('/').pop() || 'index.html';

  var ICHING_MARK =
    '<svg viewBox="0 0 18 20" aria-hidden="true">' +
      '<g fill="#c79a54">' +
        '<rect x="0" y="0"    width="18" height="2" rx="1"/>' +
        '<rect x="0" y="3.6"  width="18" height="2" rx="1"/>' +
        '<rect x="0" y="7.2"  width="7"  height="2" rx="1"/><rect x="11" y="7.2"  width="7"  height="2" rx="1"/>' +
        '<rect x="0" y="10.8" width="7"  height="2" rx="1"/><rect x="11" y="10.8" width="7"  height="2" rx="1"/>' +
        '<rect x="0" y="14.4" width="7"  height="2" rx="1"/><rect x="11" y="14.4" width="7"  height="2" rx="1"/>' +
        '<rect x="0" y="18"   width="7"  height="2" rx="1"/><rect x="11" y="18"   width="7"  height="2" rx="1"/>' +
      '</g>' +
    '</svg>';

  var CARDS_MARK =
    '<svg viewBox="0 0 18 20" aria-hidden="true">' +
      '<g fill="none" stroke="#c79a54" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="3.86" y="4.43" width="7.29" height="10.29" rx="1.07" transform="rotate(-9 7.5 9.57)" opacity=".55"/>' +
        '<rect x="6.86" y="5.29" width="7.29" height="10.29" rx="1.07" transform="rotate(7 10.5 10.43)"/>' +
        '<path d="M11.14 8.71 Q11.49 9.87 12.64 10.21 Q11.49 10.55 11.14 11.71 Q10.79 10.55 9.64 10.21 Q10.79 9.87 11.14 8.71 Z" fill="#c79a54" stroke="none" transform="rotate(7 10.5 10.43)"/>' +
      '</g>' +
    '</svg>';

  var rightSlot = '';
  if (page === 'index.html' || page === '') {
    rightSlot = '<a class="sh-hex" href="iching.html" aria-label="I Ching Oracle" title="I Ching Oracle">' + ICHING_MARK + '</a>';
  } else if (page === 'iching.html') {
    rightSlot = '<a class="sh-hex" href="index.html" aria-label="Cards of Life" title="Cards of Life">' + CARDS_MARK + '</a>';
  }

  var headerHtml =
    '<header class="site-header" id="siteHeader">' +
      '<div class="sh-inner">' +
        '<label class="bg-toggle" for="bgToggle" title="Floating cards">' +
          '<input type="checkbox" id="bgToggle" class="bg-toggle-input" aria-label="Floating cards">' +
          '<span class="bg-toggle-track" aria-hidden="true"><span class="bg-toggle-knob"></span></span>' +
        '</label>' +
        '<a href="index.html" class="sh-logo">mysticscards<span class="suit">.space</span></a>' +
        rightSlot +
      '</div>' +
    '</header>';

  var skipHtml = '<a href="#main" class="skip-link">Skip to content</a>';
  document.currentScript.insertAdjacentHTML('beforebegin', skipHtml + headerHtml);

  var header = document.getElementById('siteHeader');
  if (header && !document.getElementById('main')) {
    header.insertAdjacentHTML('afterend', '<div id="main" tabindex="-1" class="main-anchor"></div>');
  }

  window.addEventListener('scroll', function () {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  var BG_KEY = 'mc-castfield-enabled';
  function readBgPref() {
    try { return localStorage.getItem(BG_KEY) === '1'; } catch (e) { return false; }
  }
  function applyBgPref(on) {
    document.body.classList.toggle('bg-enabled', !!on);
    var input = document.getElementById('bgToggle');
    if (input) input.checked = !!on;
    try { localStorage.setItem(BG_KEY, on ? '1' : '0'); } catch (e) {}
    window.dispatchEvent(new CustomEvent('mc-bg-toggle', { detail: { enabled: !!on } }));
  }
  function initBgToggle() {
    var input = document.getElementById('bgToggle');
    applyBgPref(readBgPref());
    if (!input) return;
    input.addEventListener('change', function () {
      applyBgPref(!!input.checked);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBgToggle);
  else initBgToggle();

  // Offline support + PWA install for the standalone v4 slice.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* no-op */ });
    });
  }

  var FAN = '<img src="assets/footer-fan.svg" alt="" width="48" height="48">';
  var MAIL_MARK =
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>' +
    '</svg>';

  // Discreet "hidden" hexagram mark on the left of the I Ching footer —
  // a small I Ching figure linking to the Seed Oracle (unlisted in NAV,
  // reachable via this glyph). Hex 63 ䷾ Chi Chi — Fire under Water
  // (After Completion). SVG: 6 rows at y=0/3.6/7.2/10.8/14.4/18, each 2
  // high. SOLID = full width; BROKEN = two halves. Top row = line 6.
  var SEED_MARK =
    '<svg viewBox="0 0 18 20" aria-hidden="true">' +
      '<g fill="#c79a54">' +
        '<rect x="0" y="0"    width="7"  height="2" rx="1"/><rect x="11" y="0"    width="7"  height="2" rx="1"/>' +
        '<rect x="0" y="3.6"  width="18" height="2" rx="1"/>' +
        '<rect x="0" y="7.2"  width="7"  height="2" rx="1"/><rect x="11" y="7.2"  width="7"  height="2" rx="1"/>' +
        '<rect x="0" y="10.8" width="18" height="2" rx="1"/>' +
        '<rect x="0" y="14.4" width="7"  height="2" rx="1"/><rect x="11" y="14.4" width="7"  height="2" rx="1"/>' +
        '<rect x="0" y="18"   width="18" height="2" rx="1"/>' +
      '</g>' +
    '</svg>';

  function buildFooter() {
    var inner = document.querySelector('.site-footer .sf-inner');
    if (!inner) return;
    if (inner.children.length || inner.textContent.trim()) return;

    inner.classList.add('sf-rich');
    // I Ching page carries the small hexagram glyph to the Seed Oracle
    // on the left of its footer; other pages get a matched spacer so
    // the fan mark stays truly centred.
    var leftSlot = (page === 'iching.html')
      ? '<span class="sf-seeds">' +
          '<a class="sf-seed" href="seedoracle.html" aria-label="Seed Oracle" title="Seed Oracle">' + SEED_MARK + '</a>' +
        '</span>'
      : '<span class="sf-spacer" aria-hidden="true"></span>';
    var emailSlot =
      '<a class="sf-email" href="mailto:mysticscards@proton.me" aria-label="Email mysticscards@proton.me" title="mysticscards@proton.me">' + MAIL_MARK + '</a>';
    inner.innerHTML =
      leftSlot +
      '<a class="sf-mark" href="index.html" aria-label="mysticscards.space home">' + FAN + '</a>' +
      emailSlot;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildFooter);
  else buildFooter();

  window.toggleSection = function (id) {
    var section = document.getElementById(id);
    if (!section) return;
    var open = section.classList.toggle('section-open');
    var b = section.querySelector(':scope > .section-toggle');
    if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
    try { localStorage.setItem('mc-section-' + id, open ? '1' : '0'); } catch (e) {}
  };
  function _restoreSections() {
    document.querySelectorAll('.page-section').forEach(function (section) {
      if (!section.querySelector(':scope > .section-toggle')) return;
      var saved = null;
      try { saved = localStorage.getItem('mc-section-' + section.id); } catch (e) {}
      var startClosed = section.classList.contains('section-start-closed');
      var open = saved !== null ? (saved !== '0') : !startClosed;
      section.classList.toggle('section-open', open);
      var b = section.querySelector(':scope > .section-toggle');
      if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _restoreSections);
  else _restoreSections();
})();

(function () {
  'use strict';
  var mm = window.matchMedia;
  var reduce = mm && mm('(prefers-reduced-motion: reduce)').matches;
  var nativeVT = ('onpagereveal' in window);

  function external(a) {
    if (!a) return true;
    if (a.target && a.target !== '_self') return true;
    if (a.hasAttribute('download')) return true;
    var raw = a.getAttribute('href') || '';
    if (!raw || raw.charAt(0) === '#') return true;
    if (/^(mailto:|tel:|sms:|javascript:|data:)/i.test(raw)) return true;
    var url;
    try { url = new URL(a.href, location.href); } catch (e) { return true; }
    if (url.origin !== location.origin) return true;
    if (url.href.split('#')[0] === location.href.split('#')[0]) return true;
    return false;
  }

  var seen = {};
  function prefetch(a) {
    if (external(a) || seen[a.href]) return;
    seen[a.href] = true;
    var l = document.createElement('link'); l.rel = 'prefetch'; l.href = a.href;
    document.head.appendChild(l);
  }
  ['pointerover', 'focusin'].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      var a = e.target && e.target.closest && e.target.closest('a[href]');
      if (a) prefetch(a);
    }, { passive: true });
  });

  if (reduce || nativeVT) return;

  var veil;
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    if (external(a)) return;
    var href = a.href;
    e.preventDefault();
    if (!veil) {
      veil = document.createElement('div');
      veil.className = 'pg-veil'; veil.setAttribute('aria-hidden', 'true');
      (document.body || document.documentElement).appendChild(veil);
    }
    requestAnimationFrame(function () { veil.classList.add('show'); });
    var done = false;
    function go() { if (done) return; done = true; location.href = href; }
    veil.addEventListener('transitionend', go, { once: true });
    setTimeout(go, 480);
  });
  window.addEventListener('pageshow', function () { if (veil) veil.classList.remove('show'); });
})();
