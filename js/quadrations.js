(function () {
  'use strict';

  let _qDisp = false;

  function setButtonState(btn, on) {
    if (!btn) return;
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
  }

  function qSyncDispBtn() {
    setButtonState(document.getElementById('qDisp'), _qDisp);
  }

  function syncSwitchAndLabel(id, on) {
    setButtonState(document.getElementById(id), on);
  }

  function syncSpreadLabel(age) {
    const el = document.getElementById('qModeCurrent');
    if (!el) return;
    if (age === 1) el.textContent = 'Earthly\nSpread';
    else if (age === 90) el.textContent = 'Spiritual\nSpread';
    else el.textContent = '';
  }

  // Put the endpoint label in the empty two-column crown-side immediately
  // before the first top-row card (the KS anchor), so it stays beside the
  // spread when the card size or viewport changes.
  function alignSpreadLabel() {
    const el = document.getElementById('qModeCurrent');
    const home = document.querySelector('#annualGrid .crown-joker');
    if (el && home && el.parentElement !== home) home.appendChild(el);
  }

  function alignQuadControls() {
    alignSpreadLabel();
    const controls = document.querySelector('.age-controls-wrap');
    const home = document.querySelector('#annualGrid .crown-controls');
    if (controls && home && controls.parentElement !== home) home.appendChild(controls);
  }

  function captureCardRects(ctl) {
    const rects = {};
    for (let i = 0; i < 52; i++) {
      const el = ctl.cardEl(i);
      if (el) rects[i] = el.getBoundingClientRect();
    }
    return rects;
  }

  function animateCardSettle(ctl, firstRects) {
    for (let i = 0; i < 52; i++) {
      const el = ctl.cardEl(i);
      const first = firstRects[i];
      if (!el || !first) continue;
      const last = el.getBoundingClientRect();
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (!dx && !dy) continue;
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      for (let i = 0; i < 52; i++) {
        const el = ctl.cardEl(i);
        if (!el || !el.style.transform) continue;
        el.style.transition = 'transform .65s cubic-bezier(.22,1,.36,1)';
        el.style.transform = '';
        el.addEventListener('transitionend', function te() {
          el.style.transition = '';
          el.removeEventListener('transitionend', te);
        });
      }
    }));
  }

  function qToggleDisplace() {
    _qDisp = !_qDisp;
    qSyncDispBtn();
    ensureSpreadCtl().showGhosts(_qDisp ? 'both' : null);
    CardsStore.setQuadDisp(_qDisp);
  }
  function qToggleAltCourts() {
    const on = document.body.classList.toggle('pips-only');
    syncSwitchAndLabel('qAlt', on);
    CardsStore.setQuadAlt(on);
  }
  function qToggleReadDir() {
    const grid = document.getElementById('annualGrid');
    if (!grid) return;
    const ctl = ensureSpreadCtl();
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const first = reduce ? null : captureCardRects(ctl);
    const on = grid.classList.toggle('q-ltr');
    syncSwitchAndLabel('qLtr', on);
    CardsStore.setQuadLtr(on);
    window.dispatchEvent(new CustomEvent('mc-read-dir-toggle', { detail: { enabled: on } }));
    if (reduce) return;
    animateCardSettle(ctl, first);
  }

  const QUAD_SCALE_MIN = 60, QUAD_SCALE_MAX = 150;
  function qSetCardSize(v) {
    v = Math.max(QUAD_SCALE_MIN, Math.min(QUAD_SCALE_MAX, Math.round(+v) || 100));
    const grid = document.getElementById('annualGrid');
    if (grid) grid.style.setProperty('--quad-scale', (v / 100).toFixed(2));
    document.documentElement.style.setProperty('--quad-card-w', 'calc((' + (560 * v / 100).toFixed(2) + 'px - (6 * .35rem)) / 7)');
    const val = document.getElementById('qSizeVal');
    if (val) val.textContent = v + '%';
    const slider = document.getElementById('qSizeSlider');
    if (slider && +slider.value !== v) slider.value = v;
    CardsStore.setQuadScale(v);
    alignQuadControls();
  }
  function _initQuadCardSize() {
    const raw = CardsStore.getQuadScale();
    let saved = 100;
    if (raw != null && raw >= QUAD_SCALE_MIN && raw <= QUAD_SCALE_MAX) saved = raw;
    qSetCardSize(saved);
  }

  function restoreQuadToggles() {
    if (CardsStore.getQuadAlt()) {
      document.body.classList.add('pips-only');
      syncSwitchAndLabel('qAlt', true);
    }
    if (CardsStore.getQuadDisp()) {
      _qDisp = true;
      qSyncDispBtn();
      ensureSpreadCtl().showGhosts('both');
    }
    if (CardsStore.getQuadLtr()) {
      const g = document.getElementById('annualGrid');
      if (g) g.classList.add('q-ltr');
      syncSwitchAndLabel('qLtr', true);
    }
  }

  function wireDelegatedControls() {
    const alt  = document.getElementById('qAlt');
    if (alt)  alt.addEventListener('click', qToggleAltCourts);
    const disp = document.getElementById('qDisp');
    if (disp) disp.addEventListener('click', qToggleDisplace);
    const ltr  = document.getElementById('qLtr');
    if (ltr)  ltr.addEventListener('click', qToggleReadDir);
    const slider = document.getElementById('qSizeSlider');
    if (slider) slider.addEventListener('input', (ev) => qSetCardSize(ev.target.value));
  }

  window.qSetCardSize      = qSetCardSize;
  window.syncSpreadLabel   = syncSpreadLabel;
  window.alignSpreadLabel  = alignSpreadLabel;
  window.alignQuadControls = alignQuadControls;

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('annualGrid')) return;
    wireDelegatedControls();
    _initQuadCardSize();
    restoreQuadToggles();
    // Sync the endpoint label to whatever spread the spread-grid boot rendered.
    syncSpreadLabel((typeof quadAge === 'number' ? quadAge : 0) + 1);
    alignQuadControls();
    window.addEventListener('resize', alignQuadControls);
  });
})();
