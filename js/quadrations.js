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

  // Pins #qModeCurrent's left edge to #annualGrid's left edge (the Neptune
  // column — SPREAD_PLANETS[6], the first seat rendered in each row) instead
  // of letting it hug the age stepper. .spreads-top's rail width (720px on
  // desktop) and the grid's own width (560px * --quad-scale, clamped by
  // viewport) are centred independently, so the gap between their left
  // edges isn't a fixed number — it shifts with viewport width and the
  // card-size slider. Recomputed on resize and whenever the card size
  // changes; a static CSS offset would only be correct at one scale.
  function alignSpreadLabel() {
    const el   = document.getElementById('qModeCurrent');
    const top  = document.querySelector('.spreads-top');
    const grid = document.getElementById('annualGrid');
    if (!el || !top || !grid) return;
    const gridRect = grid.getBoundingClientRect();
    const topRect  = top.getBoundingClientRect();
    el.style.left = Math.round(gridRect.left - topRect.left) + 'px';
  }

  // Mirror of alignSpreadLabel for the settings gear: pins its right edge
  // to #annualGrid's right edge (the Mercury column — SPREAD_PLANETS[0],
  // the last seat rendered in each row) instead of the rail's right edge.
  // .q-settings-panel repositions itself off the gear's live rect already
  // (see positionPanel in wireQuadSettingsPanel), so it follows for free.
  function alignSettingsGear() {
    const el   = document.getElementById('qSettingsBtn');
    const top  = document.querySelector('.spreads-top');
    const grid = document.getElementById('annualGrid');
    if (!el || !top || !grid) return;
    const gridRect = grid.getBoundingClientRect();
    const topRect  = top.getBoundingClientRect();
    el.style.right = Math.round(topRect.right - gridRect.right) + 'px';
  }

  function alignQuadControls() {
    alignSpreadLabel();
    alignSettingsGear();
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
    if (reduce) return;
    animateCardSettle(ctl, first);
  }

  const QUAD_SCALE_MIN = 60, QUAD_SCALE_MAX = 150;
  function qSetCardSize(v) {
    v = Math.max(QUAD_SCALE_MIN, Math.min(QUAD_SCALE_MAX, Math.round(+v) || 100));
    const grid = document.getElementById('annualGrid');
    if (grid) grid.style.setProperty('--quad-scale', (v / 100).toFixed(2));
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

  function wireQuadSettingsPanel() {
    const btn = document.getElementById('qSettingsBtn');
    const panel = document.getElementById('qSettingsPanel');
    if (!btn || !panel) return;
    document.body.appendChild(panel);
    function positionPanel() {
      const r = btn.getBoundingClientRect();
      const w = panel.offsetWidth || 300;
      const vw = document.documentElement.clientWidth;
      let left = r.right - w;
      left = Math.max(8, Math.min(left, vw - w - 8));
      panel.style.left = (left + window.scrollX) + 'px';
      panel.style.top  = (r.bottom + window.scrollY + 6) + 'px';
    }
    function openPanel()  { positionPanel(); panel.classList.add('open');    btn.setAttribute('aria-expanded', 'true'); }
    function closePanel() { panel.classList.remove('open');                  btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.contains('open') ? closePanel() : openPanel();
    });
    document.addEventListener('click', (e) => {
      if (!panel.classList.contains('open')) return;
      if (panel.contains(e.target) || btn.contains(e.target)) return;
      closePanel();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !panel.classList.contains('open')) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      closePanel();
    });
    window.addEventListener('resize', () => { if (panel.classList.contains('open')) positionPanel(); });
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
  window.alignSettingsGear = alignSettingsGear;
  window.alignQuadControls = alignQuadControls;

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('annualGrid')) return;
    wireQuadSettingsPanel();
    wireDelegatedControls();
    _initQuadCardSize();
    restoreQuadToggles();
    // Sync the endpoint label to whatever spread the spread-grid boot rendered.
    syncSpreadLabel(currentAge + 1);
    alignQuadControls();
    window.addEventListener('resize', alignQuadControls);
  });
})();
