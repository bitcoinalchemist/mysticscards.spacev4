(function () {
  'use strict';

  // Chromium can reject an in-progress native document view transition when
  // another navigation interrupts it. It is harmless, but otherwise appears
  // as an unhandled rejection during rapid navigation.
  window.addEventListener('unhandledrejection', function (e) {
    var reason = e.reason;
    if (reason && reason.name === 'AbortError' && /transition was skipped/i.test(String(reason.message || ''))) {
      e.preventDefault();
    }
  });

  var page = window.location.pathname.split('/').pop() || 'index.html';
  var isCardsPage = page === 'index.html' || page === '';
  var BG_KEY = 'mc-castfield-enabled';
  var VOICE_KEY = 'mysticscards_voice';
  var LEGACY_VOICE_KEY = 'cardsoflife_voice';

  var ICHING_MARK =
    '<svg viewBox="0 0 18 20" aria-hidden="true">' +
      '<g fill="#c79a54">' +
        '<rect x="0" y="0"    width="18" height="2" rx="1"/>' +
        '<rect x="0" y="3.6"  width="7"  height="2" rx="1"/><rect x="11" y="3.6"  width="7"  height="2" rx="1"/>' +
        '<rect x="0" y="7.2"  width="18" height="2" rx="1"/>' +
        '<rect x="0" y="10.8" width="7"  height="2" rx="1"/><rect x="11" y="10.8" width="7"  height="2" rx="1"/>' +
        '<rect x="0" y="14.4" width="18" height="2" rx="1"/>' +
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

  var menuPageLinks =
    '<a class="sh-menu-link sh-menu-link--titled' + (isCardsPage ? ' is-current' : '') + '" href="index.html" aria-label="Mystics Cards" title="Mystics Cards"' + (isCardsPage ? ' aria-current="page"' : '') + '>' +
      '<span class="sh-menu-link-mark sh-menu-link-mark--cards" aria-hidden="true">' + CARDS_MARK + '</span><span>Mystics Cards</span>' +
    '</a>' +
    '<a class="sh-menu-link sh-menu-link--titled' + (page === 'iching.html' ? ' is-current' : '') + '" href="iching.html" aria-label="I Ching Oracle" title="I Ching Oracle"' + (page === 'iching.html' ? ' aria-current="page"' : '') + '>' +
      '<span class="sh-menu-link-mark" aria-hidden="true">' + ICHING_MARK + '</span><span>I Ching Oracle</span>' +
    '</a>';

  var headerPageLinks =
    '<a class="sh-page-link' + (isCardsPage ? ' is-current' : '') + '" href="index.html" aria-label="Mystics Cards" title="Mystics Cards"' + (isCardsPage ? ' aria-current="page"' : '') + '>' +
      '<span class="sh-page-link-mark sh-page-link-mark--cards" aria-hidden="true">' + CARDS_MARK + '</span>' +
    '</a>' +
    '<a class="sh-page-link' + (page === 'iching.html' ? ' is-current' : '') + '" href="iching.html" aria-label="I Ching Oracle" title="I Ching Oracle"' + (page === 'iching.html' ? ' aria-current="page"' : '') + '>' +
      '<span class="sh-page-link-mark" aria-hidden="true">' + ICHING_MARK + '</span>' +
    '</a>';

  var settingsRows =
    '<div class="sh-setting-row">' +
      '<span class="sh-setting-label">Floating cards</span>' +
      '<button type="button" class="q-switch" id="bgToggle" role="switch" aria-checked="false" aria-label="Floating cards"><span class="q-switch-knob"></span></button>' +
    '</div>';
  if (isCardsPage) {
    settingsRows +=
      '<div class="sh-setting-row">' +
        '<span class="sh-setting-label">Olney mode</span>' +
        '<button type="button" class="q-switch" id="voiceToggle" role="switch" aria-checked="false" aria-label="Olney mode"><span class="q-switch-knob"></span></button>' +
      '</div>' +
      '<div class="sh-setting-row">' +
        '<span class="sh-setting-label">Alternate court cards</span>' +
        '<button type="button" class="q-switch" id="qAlt" role="switch" aria-checked="false" aria-label="Alternate court cards"><span class="q-switch-knob"></span></button>' +
      '</div>' +
      '<div class="sh-setting-row">' +
        '<span class="sh-setting-label">Read left to right</span>' +
        '<button type="button" class="q-switch" id="qLtr" role="switch" aria-checked="false" aria-label="Read left to right"><span class="q-switch-knob"></span></button>' +
      '</div>' +
      '<div class="sh-setting-divider" aria-hidden="true"></div>' +
      '<div class="sh-setting-group">' +
        '<div class="sh-setting-head">Quadrations</div>' +
        '<div class="sh-setting-row">' +
          '<span class="sh-setting-label">Show displacements</span>' +
          '<button type="button" class="q-switch" id="qDisp" role="switch" aria-checked="false" aria-label="Show displacements"><span class="q-switch-knob"></span></button>' +
        '</div>' +
        '<div class="sh-setting-row sh-setting-row--size">' +
          '<span class="sh-setting-label">Card size</span>' +
          '<div class="q-size-row" role="group" aria-label="Card size">' +
            '<span class="q-size-ico q-size-ico--sm" aria-hidden="true">A</span>' +
            '<input type="range" id="qSizeSlider" class="q-size-slider" min="60" max="150" step="5" value="100" aria-label="Card size" title="Card size">' +
            '<span class="q-size-ico q-size-ico--lg" aria-hidden="true">A</span>' +
            '<span class="q-size-val" id="qSizeVal">100%</span>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  var contactLink =
    '<a class="sh-menu-contact" href="mailto:mysticscards@proton.me" aria-label="Email mysticscards@proton.me" title="Email mysticscards@proton.me">' +
      '<span aria-hidden="true">Email</span><span>mysticscards@proton.me</span>' +
    '</a>';
  var legalLink =
    '<a class="sh-menu-contact sh-menu-legal" href="legal.html">Legal &amp; credits</a>';

  var headerHtml =
    '<header class="site-header" id="siteHeader">' +
      '<div class="sh-inner">' +
        '<div class="sh-menu">' +
          '<button type="button" class="sh-menu-btn" id="shMenuBtn" aria-haspopup="true" aria-expanded="false" aria-controls="shMenuPanel" aria-label="Open site menu" title="Menu">' +
            '<svg class="sh-menu-bars" viewBox="0 0 22 22" aria-hidden="true">' +
              '<path d="M3 5.5h16M3 11h16M3 16.5h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />' +
            '</svg>' +
          '</button>' +
          '<div class="sh-menu-panel" id="shMenuPanel">' +
            '<nav class="sh-menu-nav" aria-label="Site pages">' + menuPageLinks + '</nav>' +
            '<div class="sh-menu-divider" aria-hidden="true"></div>' +
            '<div class="sh-menu-head">Settings</div>' +
            '<div class="sh-menu-settings">' + settingsRows + '</div>' +
            '<div class="sh-menu-divider" aria-hidden="true"></div>' +
            legalLink + contactLink +
          '</div>' +
        '</div>' +
        '<a href="index.html" class="sh-logo">mysticscards<span class="suit">.space</span></a>' +
        '<nav class="sh-page-nav" aria-label="Site pages">' + headerPageLinks + '</nav>' +
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

  function readBgPref() {
    try {
      var saved = localStorage.getItem(BG_KEY);
      return saved === null ? true : saved === '1';
    } catch (e) { return true; }
  }
  function applyBgPref(on) {
    document.body.classList.toggle('bg-enabled', !!on);
    var input = document.getElementById('bgToggle');
    if (input) {
      input.classList.toggle('on', !!on);
      input.setAttribute('aria-checked', on ? 'true' : 'false');
    }
    try { localStorage.setItem(BG_KEY, on ? '1' : '0'); } catch (e) {}
    window.dispatchEvent(new CustomEvent('mc-bg-toggle', { detail: { enabled: !!on } }));
  }
  function readVoicePref() {
    try {
      var value = localStorage.getItem(VOICE_KEY);
      if (value === null) {
        value = localStorage.getItem(LEGACY_VOICE_KEY);
        if (value !== null) localStorage.setItem(VOICE_KEY, value);
      }
      return value === 'olney' ? 'olney' : 'modern';
    } catch (e) { return 'modern'; }
  }
  function applyVoicePref(voice) {
    var next = voice === 'olney' ? 'olney' : 'modern';
    var btn = document.getElementById('voiceToggle');
    if (btn) {
      var isOlney = next === 'olney';
      btn.classList.toggle('on', isOlney);
      btn.setAttribute('aria-checked', isOlney ? 'true' : 'false');
      btn.title = 'Olney mode: ' + (isOlney ? 'on' : 'off');
      btn.setAttribute('aria-label', 'Olney mode: ' + (isOlney ? 'on' : 'off') + '. Activate to switch.');
    }
    try { localStorage.setItem(VOICE_KEY, next); } catch (e) {}
    window.dispatchEvent(new CustomEvent('mc-voice-toggle', { detail: { voice: next } }));
  }
  function togglePanel(force) {
    var btn = document.getElementById('shMenuBtn');
    var panel = document.getElementById('shMenuPanel');
    if (!btn || !panel) return;
    var open = typeof force === 'boolean' ? force : !panel.classList.contains('open');
    panel.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close site menu' : 'Open site menu');
  }
  function initBgToggle() {
    var input = document.getElementById('bgToggle');
    var voiceBtn = document.getElementById('voiceToggle');
    var settingsBtn = document.getElementById('shMenuBtn');
    var panel = document.getElementById('shMenuPanel');
    applyBgPref(readBgPref());
    if (voiceBtn) applyVoicePref(readVoicePref());
    if (input) {
      input.addEventListener('click', function () {
        applyBgPref(input.getAttribute('aria-checked') !== 'true');
      });
    }
    if (voiceBtn) {
      voiceBtn.addEventListener('click', function () {
        applyVoicePref(readVoicePref() === 'olney' ? 'modern' : 'olney');
      });
    }
    if (settingsBtn) {
      settingsBtn.addEventListener('click', function () {
        togglePanel();
      });
    }
    document.addEventListener('click', function (e) {
      if (!panel || !panel.classList.contains('open')) return;
      if (e.target.closest('#shMenuBtn') || e.target.closest('#shMenuPanel')) return;
      togglePanel(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') togglePanel(false);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBgToggle);
  else initBgToggle();

  // Offline support + PWA install.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* no-op */ });
    });
  }

  window.toggleSection = function (id) {
    var section = document.getElementById(id);
    if (!section) return;
    // Rail sections don't collapse — see _restoreSections below.
    if (section.closest('[data-section-rail]')) return;
    var open = section.classList.toggle('section-open');
    var b = section.querySelector(':scope > .section-heading > .section-toggle, :scope > .section-toggle');
    var body = section.querySelector(':scope > .section-bodywrap > .section-bodymin');
    if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (body) body.inert = !open;
    try { localStorage.setItem('mc-section-' + id, open ? '1' : '0'); } catch (e) {}
  };
  document.addEventListener('click', function (e) {
    var toggle = e.target && e.target.closest && e.target.closest('.section-toggle[data-section]');
    if (toggle) window.toggleSection(toggle.getAttribute('data-section'));
  });
  function _restoreSections() {
    document.querySelectorAll('.page-section').forEach(function (section) {
      // Sections inside a section rail ([data-section-rail], see
      // js/home-sections.js / js/iching-sections.js) are driven by tabs, not
      // by collapse toggles. Their toggles are hidden, so a restored closed
      // state would be unrecoverable — force them open and drop any key left
      // over from before the rail landed.
      if (section.closest('[data-section-rail]')) {
        section.classList.add('section-open');
        var railToggle = section.querySelector(':scope > .section-heading > .section-toggle, :scope > .section-toggle');
        if (railToggle) railToggle.setAttribute('aria-expanded', 'true');
        var railBody = section.querySelector(':scope > .section-bodywrap > .section-bodymin');
        if (railBody) railBody.inert = false;
        try { localStorage.removeItem('mc-section-' + section.id); } catch (e) {}
        return;
      }
      var b = section.querySelector(':scope > .section-heading > .section-toggle, :scope > .section-toggle');
      if (!b) return;
      var saved = null;
      try { saved = localStorage.getItem('mc-section-' + section.id); } catch (e) {}
      var startClosed = section.classList.contains('section-start-closed');
      var open = saved !== null ? (saved !== '0') : !startClosed;
      section.classList.toggle('section-open', open);
      if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
      var body = section.querySelector(':scope > .section-bodywrap > .section-bodymin');
      if (body) body.inert = !open;
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
