(function () {
  'use strict';

  const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAYS_IN_MONTH = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  let _renderMode = 'empty';
  let dom = null;
  let _selectedCard = null;
  let _selectedPartner = null;
  let _finderOverride = null;

  function cacheDom() {
    const root = document.getElementById('finder');
    if (!root) return null;
    return {
      root,
      results: root.querySelector('.finder-results'),
      relBtn: document.getElementById('fRelToggle'),
      resetBtn: document.getElementById('fDateReset'),
      you: {
        month: document.getElementById('fMonth'),
        day: document.getElementById('fDay'),
        result: document.getElementById('fResult')
      },
      partner: {
        month: document.getElementById('fpMonth'),
        day: document.getElementById('fpDay'),
        result: document.getElementById('fpResult')
      },
      composite: {
        result: document.getElementById('frResult')
      },
      about: {
        root:        document.getElementById('fAbout'),
        subtitle:    document.getElementById('fAboutSubtitle'),
        vow:         document.getElementById('fAboutVow'),
        kws:         document.getElementById('fAboutKws'),
        personality: document.getElementById('fAboutPersonality'),
        strengths:   document.getElementById('fAboutStrengths'),
        challenges:  document.getElementById('fAboutChallenges')
      },
      panels: {
        wrap:   document.getElementById('fPanels'),
        body:   document.getElementById('fPanelBody'),
        picker: document.getElementById('fPanelPicker')
      }
    };
  }

  // Flip the visible panel + the active-chip state. Public so
  // openCompareCard-style external callers can jump straight to a
  // panel (currently just wired from the chip picker itself).
  function setFinderPanel(name) {
    if (!dom || !dom.panels.body) return;
    dom.panels.body.dataset.panelActive = name;
    if (!dom.panels.picker) return;
    dom.panels.picker.querySelectorAll('.ns-chip').forEach(function (b) {
      const on = b.dataset.panel === name;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }
  window.setFinderPanel = setFinderPanel;

  function resultCard(slot) {
    return slot.result ? slot.result.querySelector('.spread-card') : null;
  }

  function solarValue(month, day) {
    return 55 - (2 * month + day);
  }

  function findCardFromSv(sv) {
    if (sv === 0) return { rank: 'Joker', suit: 'joker', sym: '✦', sv: 0 };
    if (sv < 1 || sv > 52) return null;
    const c = SPREAD_CARDS[sv - 1];
    return { rank: c.rank, suit: c.suit, sym: c.sym, sv: sv };
  }
  function findCard(month, day) { return findCardFromSv(solarValue(month, day)); }

  function firstDateForSv(sv) {
    for (let m = 1; m <= 12; m++) {
      const d = 55 - (2 * m) - sv;
      if (d >= 1 && d <= DAYS_IN_MONTH[m]) return { month: m, day: d };
    }
    return null;
  }

  function compositeCard(a, b) {
    if (!a || !b || a.sv === 0 || b.sv === 0) return null;
    let sv = a.sv + b.sv;
    while (sv > 52) sv -= 52;
    return findCardFromSv(sv);
  }

  function suitName(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function populateMonth(sel) {
    if (!sel) return;
    sel.value = '';
    sel.placeholder = 'MM';
  }
  function syncMonthInput(input) {
    if (!input) return;
    input.value = input.value.replace(/\D+/g, '').slice(0, 2);
    const value = parseInt(input.value, 10);
    if (!Number.isInteger(value)) return;
    if (input.value.length < 2 && input.value === '0') return;
    if (value < 1) input.value = '1';
    else if (value > 12) input.value = '12';
  }
  function normalizeMonthInput(input) {
    if (!input) return;
    const digits = input.value.replace(/\D+/g, '').slice(0, 2);
    if (!digits) {
      input.value = '';
      return;
    }
    const value = parseInt(digits, 10);
    if (!Number.isInteger(value)) {
      input.value = '';
      return;
    }
    if (digits.length === 1) {
      if (digits === '0') return;
      input.value = value > 9 ? '9' : String(value);
      return;
    }
    if (value < 1) input.value = '01';
    else if (value > 12) input.value = '12';
    else input.value = digits.padStart(2, '0');
  }
  function normalizeDayInput(input, month) {
    if (!input) return;
    const digits = input.value.replace(/\D+/g, '').slice(0, 2);
    const days = month ? DAYS_IN_MONTH[month] : 31;
    input.max = String(days);
    if (!digits) {
      input.value = '';
      return;
    }
    const value = parseInt(digits, 10);
    if (!Number.isInteger(value)) {
      input.value = '';
      return;
    }
    if (digits.length === 1) {
      if (digits === '0') return;
      input.value = value > 9 ? '9' : String(value);
      return;
    }
    if (value < 1) input.value = '01';
    else if (value > days) input.value = String(days).padStart(2, '0');
    else input.value = digits.padStart(2, '0');
  }
  function focusEnd(input) {
    if (!input || typeof input.setSelectionRange !== 'function') return;
    const len = input.value.length;
    input.setSelectionRange(len, len);
  }
  function wireDatePair(dayInput, monthInput) {
    if (!dayInput || !monthInput) return;

    dayInput.addEventListener('input', function () {
      const digits = this.value.replace(/\D+/g, '');
      if (digits.length >= 2) {
        monthInput.focus();
        focusEnd(monthInput);
      }
    });

    monthInput.addEventListener('keydown', function (e) {
      const start = this.selectionStart;
      const end = this.selectionEnd;
      const empty = !this.value;
      const atStart = start === 0 && end === 0;
      if (e.key === 'Backspace' && (empty || atStart)) {
        dayInput.focus();
        focusEnd(dayInput);
      }
    });
  }
  function syncDayInput(input, month) {
    if (!input) return;
    input.value = input.value.replace(/\D+/g, '').slice(0, 2);
    const days = month ? DAYS_IN_MONTH[month] : 31;
    const value = parseInt(input.value, 10);
    if (!Number.isInteger(value)) return;
    if (input.value.length < 2 && input.value === '0') return;
    if (value < 1) input.value = '1';
    else if (value > days) input.value = String(days);
  }
  function setFinderOverride(card) {
    _finderOverride = card || null;
    updateResetButton();
  }
  function clearFinderOverride() {
    _finderOverride = null;
    updateResetButton();
  }
  function updateResetButton() {
    if (!dom || !dom.resetBtn) return;
    const hasDate = !!readPerson(dom.you);
    const show = !!_finderOverride && hasDate;
    dom.resetBtn.hidden = !show;
    dom.resetBtn.classList.toggle('on', show);
  }

  function cardName(card) {
    return card.suit === 'joker'
      ? 'The Joker'
      : `${card.rank} of ${suitName(card.suit)}`;
  }

  function cardFaceHTML(card) {
    if (card.suit === 'joker') {
      return '<div class="spread-card joker finder-joker-card">Joker</div>';
    }
    return `<div class="spread-card ${card.suit}">${spreadCardPips(card)}</div>`;
  }

  function resultHTML(card) {
    return [
      cardFaceHTML(card),
      `<div class="finder-result-name">${cardName(card)}</div>`,
      `<div class="finder-result-sub">Solar Value · ${card.sv}</div>`
    ].join('');
  }

  function renderResult(result, card) {
    if (!result) return;
    if (!card) {
      result.innerHTML = '';
      result.classList.remove('has-card');
      return;
    }
    result.classList.add('has-card');
    result.innerHTML = resultHTML(card);
  }

  // About panel — the ported v3 reading. Content populated whenever a
  // card is picked (solo or triptych); panel visibility is controlled
  // by the tab wrapper #fPanels. Joker keeps the head-only render
  // (subtitle + vow, no reading body).
  //
  // Returns true if the panel has renderable content, false if it
  // should be marked empty (used by the picker to grey out its chip).
  function renderAbout(card) {
    const box = dom.about;
    if (!box || !box.root) return false;
    box.root.classList.remove('is-joker', 'is-empty');
    if (!card) { box.root.classList.add('is-empty'); return false; }
    const key       = `${card.rank}_${card.suit === 'joker' ? 'joker' : card.suit}`;
    const jokerKey  = card.suit === 'joker' ? '✦_joker' : null;
    const lookupKey = jokerKey || key;
    const subtitle  = (window.SUBTITLES || {})[lookupKey] || '';
    const vow       = (window.VOWS      || {})[lookupKey] || '';
    const reading   = (window.CARD_READINGS || {})[key] || null;
    if (!subtitle && !vow && !reading) { box.root.classList.add('is-empty'); return false; }

    if (box.subtitle) box.subtitle.textContent = subtitle;
    if (box.vow)      box.vow.textContent = vow ? `“${vow}”` : '';

    const kwsHTML = reading && reading.kws
      ? reading.kws.map(k => `<span class="finder-kw">${k}</span>`).join('')
      : '';
    if (box.kws) box.kws.innerHTML = kwsHTML;

    const paras = reading && reading.personality
      ? reading.personality.split(/\n\n+/).map(p => `<p>${p}</p>`).join('')
      : '';
    if (box.personality) box.personality.innerHTML = paras;

    const listHTML = arr => (arr || []).map(x => `<li>${x}</li>`).join('');
    if (box.strengths)  box.strengths.innerHTML  = reading ? listHTML(reading.strengths)  : '';
    if (box.challenges) box.challenges.innerHTML = reading ? listHTML(reading.challenges) : '';

    box.root.classList.toggle('is-joker', !reading);
    return true;
  }

  function readPerson(personDom) {
    if (!personDom || !personDom.month || !personDom.day) return null;
    const m = +personDom.month.value;
    const d = +personDom.day.value;
    if (!m || !d || d < 1 || d > DAYS_IN_MONTH[m]) return null;
    return findCard(m, d);
  }

  function updateGridPick(card, isPartner) {
    if (typeof ensureSpreadCtl !== 'function') return;
    const ctl = ensureSpreadCtl();
    const ok = card && card.suit !== 'joker';
    if (isPartner) ctl.setPickPartner(ok ? card.rank : null, ok ? card.suit : null);
    else {
      ctl.setPick(ok ? card.rank : null, ok ? card.suit : null);
      if (typeof ctl.setScript === 'function') ctl.setScript(ok ? card.rank : null, ok ? card.suit : null);
    }
  }

  function refreshFinderGridHighlights() {
    updateGridPick(_selectedCard, false);
    updateGridPick(_selectedPartner, true);
  }

  function preserveAnchorPosition(anchor, work) {
    const before = anchor ? anchor.getBoundingClientRect() : null;
    const root = document.documentElement;
    const prevAnchor = root.style.overflowAnchor;
    root.style.overflowAnchor = 'none';
    work();
    if (!before || !before.width) {
      root.style.overflowAnchor = prevAnchor;
      return;
    }
    requestAnimationFrame(function () {
      const after = anchor.getBoundingClientRect();
      const delta = after.top - before.top;
      if (Math.abs(delta) >= 1) {
        window.scrollTo({ top: window.scrollY + delta, left: window.scrollX, behavior: 'instant' });
      }
      root.style.overflowAnchor = prevAnchor;
    });
  }

  function reduceMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function computeMode(relOn, you, partner, comp) {
    if (relOn && you && partner && comp) return 'triptych';
    if (you) return 'solo';
    return 'empty';
  }

  function readFinderState() {
    const relOn = dom.root.classList.contains('rel-on');
    const youDate = readPerson(dom.you);
    const you = _finderOverride || youDate;
    const partner = relOn ? readPerson(dom.partner) : null;
    const comp = relOn ? compositeCard(you, partner) : null;
    const targetMode = computeMode(relOn, you, partner, comp);
    return { you, partner, comp, targetMode };
  }

  function ghostAt(src, rect) {
    const g = src.cloneNode(true);
    g.style.cssText =
      'position:fixed;' +
      `left:${rect.left}px;top:${rect.top}px;` +
      `width:${rect.width}px;height:${rect.height}px;` +
      'margin:0;z-index:100;pointer-events:none;will-change:transform,opacity;';
    document.body.appendChild(g);
    return g;
  }

  function flipEnterRel(soloRect) {
    if (reduceMotion() || !soloRect || !soloRect.width) return;
    const p1 = resultCard(dom.you);
    const mid = resultCard(dom.composite);
    const rgt = resultCard(dom.partner);
    if (!p1) return;
    const p1Rect = p1.getBoundingClientRect();
    if (!p1Rect.width) return;
    const dx = Math.round((soloRect.left + soloRect.width  / 2) - (p1Rect.left + p1Rect.width  / 2));
    const dy = Math.round((soloRect.top  + soloRect.height / 2) - (p1Rect.top  + p1Rect.height / 2));
    const scaleUp = soloRect.width / p1Rect.width;

    p1.style.zIndex     = '5';
    p1.style.transition = 'none';
    p1.style.transform  = `translate(${dx}px, ${dy}px) scale(${scaleUp})`;

    [mid, rgt].forEach((el) => {
      if (!el) return;
      el.style.transition = 'none';
      el.style.opacity    = '0';
      el.style.transform  = 'scale(.85)';
    });
    p1.getBoundingClientRect();
    requestAnimationFrame(() => {
      p1.style.transition = 'transform .55s cubic-bezier(.4,0,.2,1)';
      p1.style.transform  = '';
      [mid, rgt].forEach((el, i) => {
        if (!el) return;
        const delay = 0.15 + i * 0.08;
        el.style.transition =
          `opacity .5s ease ${delay}s, transform .5s cubic-bezier(.4,0,.2,1) ${delay}s`;
        el.style.opacity   = '';
        el.style.transform = '';
      });
    });
    setTimeout(() => {
      [p1, mid, rgt].forEach((el) => {
        if (!el) return;
        el.style.removeProperty('transition');
        el.style.removeProperty('transform');
        el.style.removeProperty('opacity');
        el.style.removeProperty('z-index');
      });
    }, 800);
  }

  function flipExitRel(p1Rect) {
    if (reduceMotion() || !p1Rect || !p1Rect.width) return;
    const solo = resultCard(dom.you);
    if (!solo) return;
    const soloRect = solo.getBoundingClientRect();
    if (!soloRect.width) return;
    const dx = Math.round((p1Rect.left + p1Rect.width  / 2) - (soloRect.left + soloRect.width  / 2));
    const dy = Math.round((p1Rect.top  + p1Rect.height / 2) - (soloRect.top  + soloRect.height / 2));
    const scaleDown = p1Rect.width / soloRect.width;
    solo.style.zIndex     = '5';
    solo.style.transition = 'none';
    solo.style.transform  = `translate(${dx}px, ${dy}px) scale(${scaleDown})`;
    solo.getBoundingClientRect();
    requestAnimationFrame(() => {
      solo.style.transition = 'transform .55s cubic-bezier(.4,0,.2,1)';
      solo.style.transform  = '';
    });
    setTimeout(() => {
      solo.style.removeProperty('transition');
      solo.style.removeProperty('transform');
      solo.style.removeProperty('z-index');
    }, 700);
  }

  function captureAnimationContext(targetMode) {
    const solo2trip = _renderMode === 'solo' && targetMode === 'triptych';
    const trip2solo = _renderMode === 'triptych' && targetMode === 'solo';
    const ctx = { solo2trip, trip2solo, soloRect: null, p1Rect: null, gMid: null, gRgt: null };

    if (solo2trip) {
      const soloEl = resultCard(dom.you);
      ctx.soloRect = soloEl ? soloEl.getBoundingClientRect() : null;
      return ctx;
    }

    if (!trip2solo) return ctx;

    const p1El = resultCard(dom.you);
    const midEl = resultCard(dom.composite);
    const rgtEl = resultCard(dom.partner);
    const midRect = midEl ? midEl.getBoundingClientRect() : null;
    const rgtRect = rgtEl ? rgtEl.getBoundingClientRect() : null;
    ctx.p1Rect = p1El ? p1El.getBoundingClientRect() : null;

    if (!reduceMotion() && midEl && rgtEl && midRect && rgtRect) {
      ctx.gMid = ghostAt(midEl, midRect);
      ctx.gRgt = ghostAt(rgtEl, rgtRect);
    }
    return ctx;
  }

  function animateGhostExit(gMid, gRgt) {
    if (!gMid || !gRgt) return;
    requestAnimationFrame(() => {
      gMid.style.transition = 'transform .55s cubic-bezier(.4,0,.2,1), opacity .45s ease';
      gMid.style.transform  = 'scale(.5) translateY(-10px)';
      gMid.style.opacity    = '0';
      gRgt.style.transition = 'transform .6s cubic-bezier(.4,0,.2,1) .06s, opacity .5s ease .06s';
      gRgt.style.transform  = 'translateX(56px) scale(.78) rotate(8deg)';
      gRgt.style.opacity    = '0';
    });
    setTimeout(() => { gMid.remove(); gRgt.remove(); }, 750);
  }

  function playFinderAnimation(ctx) {
    if (ctx.solo2trip && ctx.soloRect) {
      flipEnterRel(ctx.soloRect);
      return;
    }
    if (ctx.trip2solo && ctx.p1Rect) {
      flipExitRel(ctx.p1Rect);
      animateGhostExit(ctx.gMid, ctx.gRgt);
    }
  }

  function renderFinderState(state) {
    renderResult(dom.you.result, state.you);
    renderResult(dom.composite.result, state.comp);
    renderResult(dom.partner.result, state.partner);
    if (dom.results) dom.results.classList.toggle('triptych', state.targetMode === 'triptych');
    _selectedCard = state.you;
    _selectedPartner = state.partner;
    updateGridPick(state.you, false);
    updateGridPick(state.partner, true);
    _renderMode = state.targetMode;
    updateResetButton();
    // Result tabs (About / Olney / Life Script / In Time). The whole
    // wrapper is hidden in triptych mode and when no card is picked.
    // Each panel's own render function decides whether it has content
    // for THIS card; empty panels get `.is-empty` so the placeholder
    // note shows and the chip is styled disabled.
    const isSolo = state.targetMode === 'solo';
    if (dom.panels.wrap) {
      const showPanels = !!state.you && isSolo;
      dom.panels.wrap.hidden = !showPanels;
      if (showPanels) {
        const flags = {
          about:      renderAbout(state.you),
          olney:      typeof window.renderOlney      === 'function' ? window.renderOlney(state.you)      : false,
          lifescript: typeof window.renderLifeScript === 'function' ? window.renderLifeScript(state.you) : false,
          intime:     typeof window.renderInTime     === 'function' ? window.renderInTime(state.you)     : false
        };
        // Toggle chip disabled state from each renderer's return value.
        if (dom.panels.picker) {
          dom.panels.picker.querySelectorAll('.ns-chip[data-panel]').forEach(function (b) {
            const empty = flags[b.dataset.panel] === false;
            b.classList.toggle('is-disabled', empty);
            b.setAttribute('aria-disabled', empty ? 'true' : 'false');
          });
        }
        // On every fresh card pick, reset to the About panel — unless
        // the currently active panel is still valid for this card.
        const active = dom.panels.body && dom.panels.body.dataset.panelActive;
        if (!active || flags[active] === false) setFinderPanel('about');
      }
    }
  }

  function find() {
    const state = readFinderState();
    const animation = captureAnimationContext(state.targetMode);
    renderFinderState(state);
    playFinderAnimation(animation);
  }

  function toggleRel() {
    const btn = dom.relBtn;
    const willBeOn = !dom.root.classList.contains('rel-on');
    dom.root.classList.toggle('rel-on', willBeOn);
    btn.classList.toggle('on', willBeOn);
    btn.textContent = willBeOn ? '−' : '+';
    btn.setAttribute('aria-label', willBeOn ? 'Remove partner' : 'Add partner');
    btn.setAttribute('aria-pressed', willBeOn ? 'true' : 'false');
    find();
    if (typeof window.refreshFinderTrayTargets === 'function') window.refreshFinderTrayTargets();
  }

  function loadCardInFinder(idx) {
    if (!dom) dom = cacheDom();
    if (!dom || !dom.you.month || !dom.you.day) return;
    const c = SPREAD_CARDS[idx];
    if (!c) return;
    const anchor = document.querySelector(`#annualGrid .spread-card[data-idx="${idx}"]`);
    preserveAnchorPosition(anchor, function () {
      setFinderOverride({ rank: c.rank, suit: c.suit, sym: c.sym, sv: idx + 1 });
      find();
    });
  }

  // Mirror of loadCardInFinder for a specific day/month rather than a card
  // index — used by js/birthdays.js (saved birthdays + manual add) and
  // js/finder-trays.js (Calendar). target 'partner' fills the partner slot
  // (opening it via toggleRel() first if relationship mode is off);
  // anything else fills "you".
  function loadDateInFinder(month, day, target) {
    if (!dom) dom = cacheDom();
    if (!dom) return;
    const isPartner = target === 'partner';
    const slot = isPartner ? dom.partner : dom.you;
    if (!slot.month || !slot.day) return;
    if (isPartner && !dom.root.classList.contains('rel-on')) toggleRel();
    if (!isPartner) clearFinderOverride();
    slot.month.value = String(month);
    syncMonthInput(slot.month);
    syncDayInput(slot.day, month);
    slot.day.value = String(day);
    find();
  }

  window.loadCardInFinder = loadCardInFinder;
  window.refreshFinderGridHighlights = refreshFinderGridHighlights;
  window.loadDateInFinder = loadDateInFinder;
  // Small read-only helpers the new finder-adjacent modules (birthdays,
  // calendar, solar-value calculator) need but that otherwise live only in
  // this file's closure.
  window.solarValue    = solarValue;
  window.MONTH_NAMES   = MONTH_NAMES;
  window.DAYS_IN_MONTH = DAYS_IN_MONTH;

  document.addEventListener('DOMContentLoaded', function () {
    dom = cacheDom();
    if (!dom || !dom.you.month || !dom.you.day) return;

    populateMonth(dom.you.month);
    syncMonthInput(dom.you.month);
    syncDayInput(dom.you.day, null);
    if (dom.partner.month && dom.partner.day) {
      populateMonth(dom.partner.month);
      syncMonthInput(dom.partner.month);
      syncDayInput(dom.partner.day, null);
    }

    dom.you.month.addEventListener('input', function () { clearFinderOverride(); syncDayInput(dom.you.day, +this.value); find(); });
    dom.you.month.addEventListener('change', function () { clearFinderOverride(); normalizeMonthInput(this); syncDayInput(dom.you.day, +this.value); find(); });
    dom.you.day.addEventListener('input', function () { clearFinderOverride(); syncDayInput(this, +dom.you.month.value); find(); });
    dom.you.day.addEventListener('change', function () { clearFinderOverride(); normalizeDayInput(this, +dom.you.month.value); find(); });
    wireDatePair(dom.you.day, dom.you.month);
    if (dom.partner.month && dom.partner.day) {
      dom.partner.month.addEventListener('input', function () { syncDayInput(dom.partner.day, +this.value); find(); });
      dom.partner.month.addEventListener('change', function () { normalizeMonthInput(this); syncDayInput(dom.partner.day, +this.value); find(); });
      wireDatePair(dom.partner.day, dom.partner.month);
    }
    if (dom.partner.day) {
      dom.partner.day.addEventListener('input', function () { syncDayInput(this, +dom.partner.month.value); find(); });
      dom.partner.day.addEventListener('change', function () { normalizeDayInput(this, +dom.partner.month.value); find(); });
    }
    if (dom.resetBtn) {
      dom.resetBtn.addEventListener('click', function () {
        clearFinderOverride();
        find();
      });
    }
    if (dom.relBtn) dom.relBtn.addEventListener('click', toggleRel);

    // Chip picker — click switches the active panel.
    if (dom.panels.picker) {
      dom.panels.picker.addEventListener('click', function (e) {
        const btn = e.target.closest('.ns-chip[data-panel]');
        if (!btn || btn.classList.contains('is-disabled')) return;
        setFinderPanel(btn.dataset.panel);
      });
    }
  });
})();
