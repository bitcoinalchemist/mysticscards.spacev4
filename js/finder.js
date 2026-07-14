(function () {
  'use strict';

  const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAYS_IN_MONTH = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Populate CARDS[i].dates (mirrors the old buildDates helper) —
  // the CARDS array shipped with every entry's `dates` field as a stray
  // literal '', so nothing downstream (About header, Life Script) ever
  // had a birth-date list to show. Every real calendar date maps to
  // exactly one card via the solar-value formula, so walk the whole
  // year once and collect each card's dates. `solarValue` is a function
  // declaration below — hoisted, so it's already callable here.
  (function buildCardDates() {
    if (typeof CARDS === 'undefined' || !CARDS.length) return;
    const lists = Array.from({ length: 52 }, () => []);
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= DAYS_IN_MONTH[m]; d++) {
        const sv = solarValue(m, d);
        if (sv >= 1 && sv <= 52) lists[sv - 1].push(`${MONTH_NAMES[m]} ${d}`);
      }
    }
    CARDS.forEach((c, i) => { if (i < 52) c.dates = lists[i].join(', '); });
  })();

  const RANK_NAMES = {
    A: 'Ace',
    '2': 'Two',
    '3': 'Three',
    '4': 'Four',
    '5': 'Five',
    '6': 'Six',
    '7': 'Seven',
    '8': 'Eight',
    '9': 'Nine',
    '10': 'Ten',
    J: 'Jack',
    Q: 'Queen',
    K: 'King'
  };

  let _renderMode = 'empty';
  let dom = null;
  let _selectedCard = null;
  let _selectedPartner = null;
  let _selectedComposite = null;
  let _finderOverride = null;
  let _finderSnapshot = null;
  let _finderBirthLabel = '';
  let _transitionSource = null;
  // When a snapshot is restored (reset button), this remembers which side
  // the overridden card came from so the solo→triptych entrance sends that
  // card back to its own slot instead of always replaying the left-card
  // entrance. Consumed + cleared on the next captureAnimationContext call.
  let _pendingEnterOrigin = null;

  const finderSnapshot = {
    has() {
      return !!_finderSnapshot;
    },
    clear() {
      _finderSnapshot = null;
    },
    capture() {
      if (!dom) return null;
      _finderSnapshot = {
        relOn: !!(dom.root && dom.root.classList.contains('rel-on')),
        you: {
          month: dom.you && dom.you.month ? dom.you.month.value : '',
          day: dom.you && dom.you.day ? dom.you.day.value : ''
        },
        partner: {
          month: dom.partner && dom.partner.month ? dom.partner.month.value : '',
          day: dom.partner && dom.partner.day ? dom.partner.day.value : ''
        }
      };
      return _finderSnapshot;
    },
    restore() {
      if (!dom || !_finderSnapshot) return false;
      const snap = _finderSnapshot;
      if (dom.you.month) dom.you.month.value = snap.you.month || '';
      if (dom.you.day) dom.you.day.value = snap.you.day || '';
      if (dom.partner.month) dom.partner.month.value = snap.partner.month || '';
      if (dom.partner.day) dom.partner.day.value = snap.partner.day || '';
      if (dom.you.month) syncMonthInput(dom.you.month);
      if (dom.you.day) syncDayInput(dom.you.day, +dom.you.month.value || null);
      if (dom.partner.month) syncMonthInput(dom.partner.month);
      if (dom.partner.day) syncDayInput(dom.partner.day, +dom.partner.month.value || null);
      setRelationshipMode(!!snap.relOn);
      _finderSnapshot = null;
      return true;
    }
  };

  function getFinderUiState() {
    const relOn = !!(dom && dom.root && dom.root.classList.contains('rel-on'));
    return {
      relOn,
      override: _finderOverride,
      snapshot: finderSnapshot.has()
    };
  }

  function cacheDom() {
    const root = document.getElementById('finder');
    if (!root) return null;
    return {
      root,
      results: root.querySelector('.finder-results'),
      relBtn: document.getElementById('fRelToggle'),
      resetBtn: document.getElementById('fDateReset'),
      shareBtn: document.getElementById('finderShareBtn'),
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
        modern:      document.getElementById('fAboutModern'),
        olney:       document.getElementById('fAboutOlney'),
        bond:        document.getElementById('fAboutBond'),
        kws:         document.getElementById('fAboutKws'),
        personality: document.getElementById('fAboutPersonality'),
        vow:         document.getElementById('fAboutVow'),
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
  function setFinderPanelCollapsed(collapsed) {
    if (!dom || !dom.panels.wrap || !dom.panels.body) return;
    dom.panels.wrap.classList.toggle('is-collapsed', !!collapsed);
    dom.panels.body.setAttribute('aria-hidden', collapsed ? 'true' : 'false');
  }

  function setFinderPanel(name, options) {
    if (!dom || !dom.panels.body) return;
    options = options || {};
    dom.panels.body.dataset.panelActive = name;
    setFinderPanelCollapsed(!!options.collapsed ? true : false);
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
  function wireSelectAllOnFocus(input) {
    if (!input) return;

    function selectAll() {
      if (document.activeElement !== input) return;
      requestAnimationFrame(function () {
        input.select();
      });
    }

    input.addEventListener('focus', selectAll);
    input.addEventListener('click', selectAll);
    input.addEventListener('pointerup', function (e) {
      if (document.activeElement !== input) return;
      e.preventDefault();
      selectAll();
    });
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

  // Scroll/swipe stepping — hovering the mouse/trackpad wheel over either
  // field steps it by one, no click/focus needed first; on touch, a
  // vertical drag over the field steps it (one step per STEP_PX of
  // travel, so a short flick moves several units — the wheel's
  // one-notch-per-step feel). Both fields clamp the same way typed input
  // does (1..12 for month, 1..daysInMonth for day) rather than wrapping.
  // onCommit runs after every step — pass the same clear-override + find()
  // pipeline the 'change' listeners already use for that field pair.
  function wireScrollStep(dayInput, monthInput, onCommit) {
    if (!dayInput || !monthInput || typeof onCommit !== 'function') return;

    function step(input, isMonth, delta) {
      const monthVal = parseInt(monthInput.value, 10) || 0;
      const max = isMonth ? 12 : (DAYS_IN_MONTH[monthVal] || 31);
      const cur = parseInt(input.value, 10);
      let next = Number.isInteger(cur) ? cur + delta : (delta > 0 ? 1 : max);
      next = Math.min(max, Math.max(1, next));
      input.value = String(next).padStart(2, '0');
      if (isMonth) syncDayInput(dayInput, next);
      onCommit();
    }

    [dayInput, monthInput].forEach(function (input) {
      const isMonth = input === monthInput;

      let wheelAccum = 0;
      const WHEEL_STEP = 80;
      input.addEventListener('wheel', function (e) {
        if (!e.deltaY) return;
        e.preventDefault();
        wheelAccum += e.deltaY;
        while (Math.abs(wheelAccum) >= WHEEL_STEP) {
          step(input, isMonth, wheelAccum < 0 ? 1 : -1);
          wheelAccum += wheelAccum < 0 ? WHEEL_STEP : -WHEEL_STEP;
        }
      }, { passive: false });

      // Touch has no hover, so a vertical drag over the field stands in
      // for the wheel. Only claims the gesture (and blocks page scroll)
      // once the drag reads as more than incidental jitter.
      let touchY = null;
      let touchAccum = 0;
      const STEP_PX = 14;
      input.addEventListener('touchstart', function (e) {
        touchY = e.touches[0].clientY;
        touchAccum = 0;
        wheelAccum = 0;
      }, { passive: true });
      input.addEventListener('touchmove', function (e) {
        if (touchY === null) return;
        const y = e.touches[0].clientY;
        const dy = touchY - y;
        touchY = y;
        if (!dy) return;
        touchAccum += dy;
        if (Math.abs(touchAccum) < STEP_PX) return;
        e.preventDefault();
        while (Math.abs(touchAccum) >= STEP_PX) {
          step(input, isMonth, touchAccum > 0 ? 1 : -1);
          touchAccum += touchAccum > 0 ? -STEP_PX : STEP_PX;
        }
      }, { passive: false });
      input.addEventListener('touchend', function () { touchY = null; touchAccum = 0; wheelAccum = 0; });
      input.addEventListener('touchcancel', function () { touchY = null; touchAccum = 0; wheelAccum = 0; });
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
  function discardFinderSnapshot() {
    finderSnapshot.clear();
  }
  function restoreFinderSnapshot() {
    return finderSnapshot.restore();
  }
  function updateResetButton() {
    if (!dom || !dom.resetBtn) return;
    const hasDate = !!readPerson(dom.you);
    const show = !!_finderOverride && hasDate;
    dom.resetBtn.hidden = !show;
    dom.resetBtn.classList.toggle('on', show);
  }

  function updateShareButton() {
    if (!dom || !dom.shareBtn) return;
    const show = !!(
      (dom.you.result && dom.you.result.classList.contains('has-card')) ||
      (dom.partner.result && dom.partner.result.classList.contains('has-card')) ||
      (dom.composite.result && dom.composite.result.classList.contains('has-card'))
    );
    dom.shareBtn.hidden = !show;
    dom.shareBtn.classList.toggle('is-active', false);
  }

  function finderShareUrl() {
    if (!dom) dom = cacheDom();
    const url = new URL(window.location.href);
    url.hash = '';
    ['m', 'd', 'rel', 'pm', 'pd', 'card'].forEach(function (key) {
      url.searchParams.delete(key);
    });
    const m = dom && dom.you.month ? parseInt(dom.you.month.value, 10) : 0;
    const d = dom && dom.you.day ? parseInt(dom.you.day.value, 10) : 0;
    if (m && d) {
      url.searchParams.set('m', String(m));
      url.searchParams.set('d', String(d));
    }
    if (_finderOverride && _finderOverride.sv) {
      url.searchParams.set('card', String(_finderOverride.sv));
    }
    const relOn = !!(dom && dom.root && dom.root.classList.contains('rel-on'));
    const pm = dom && dom.partner.month ? parseInt(dom.partner.month.value, 10) : 0;
    const pd = dom && dom.partner.day ? parseInt(dom.partner.day.value, 10) : 0;
    if (relOn && pm && pd) {
      url.searchParams.set('rel', '1');
      url.searchParams.set('pm', String(pm));
      url.searchParams.set('pd', String(pd));
    }
    return url.toString();
  }

  function showShareCopied() {
    if (!dom || !dom.shareBtn) return;
    const old = dom.shareBtn.getAttribute('title') || 'Share Finder link';
    dom.shareBtn.setAttribute('title', 'Link copied');
    dom.shareBtn.classList.add('is-active');
    window.setTimeout(function () {
      if (!dom || !dom.shareBtn) return;
      dom.shareBtn.setAttribute('title', old);
      dom.shareBtn.classList.remove('is-active');
    }, 1400);
  }

  function shareFinderLink() {
    const url = finderShareUrl();
    const title = 'Cards of Life Finder';
    const text = _selectedCard && _selectedCard.name
      ? `${_selectedCard.name} on mysticscards.space`
      : 'Cards of Life Finder on mysticscards.space';
    if (navigator.share) {
      navigator.share({ title, text, url }).catch(function () {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(showShareCopied).catch(function () {
        window.prompt('Copy this Finder link:', url);
      });
      return;
    }
    window.prompt('Copy this Finder link:', url);
  }

  function applySharedFinderState() {
    if (!dom) dom = cacheDom();
    if (!dom || !dom.you.month || !dom.you.day) return;
    const params = new URLSearchParams(window.location.search);
    const m = parseInt(params.get('m') || '', 10);
    const d = parseInt(params.get('d') || '', 10);
    const pm = parseInt(params.get('pm') || '', 10);
    const pd = parseInt(params.get('pd') || '', 10);
    const card = parseInt(params.get('card') || '', 10);
    if (m && d && m >= 1 && m <= 12 && d >= 1 && d <= DAYS_IN_MONTH[m]) {
      syncSlotDate(dom.you, m, d);
    }
    if (params.get('rel') === '1' && pm && pd && pm >= 1 && pm <= 12 && pd >= 1 && pd <= DAYS_IN_MONTH[pm]) {
      setRelationshipMode(true);
      syncSlotDate(dom.partner, pm, pd);
    }
    if (card >= 1 && card <= 53) {
      const c = SPREAD_CARDS[card - 1];
      if (c) setFinderOverride({ rank: c.rank, suit: c.suit, sym: c.sym, sv: card });
    }
  }

  function cardName(card) {
    return card.suit === 'joker'
      ? 'The Joker'
      : `${RANK_NAMES[card.rank] || card.rank} of ${suitName(card.suit)}`;
  }

  function cardFaceHTML(card) {
    return `<div class="spread-card ${card.suit}">${spreadCardPips(card)}</div>`;
  }

  function cardSubtitle(card) {
    const key = `${card.rank}_${card.suit === 'joker' ? 'joker' : card.suit}`;
    const jokerKey = card.suit === 'joker' ? '✦_joker' : null;
    return (window.SUBTITLES || {})[jokerKey || key] || '';
  }

  function cardVow(card) {
    const key = `${card.rank}_${card.suit === 'joker' ? 'joker' : card.suit}`;
    const jokerKey = card.suit === 'joker' ? '✦_joker' : null;
    return (window.VOWS || {})[jokerKey || key] || '';
  }

  function resultHTML(card) {
    const subtitle = cardSubtitle(card);
    return [
      cardFaceHTML(card),
      `<div class="finder-result-name">${cardName(card)}</div>`,
      `<div class="finder-result-sub">${subtitle}</div>`
    ].join('');
  }

  function renderResult(result, card) {
    if (!result) return;
    result.onclick = null;
    result.onkeydown = null;
    result.onmousedown = null;
    if (!card) {
      result.innerHTML = '';
      result.classList.remove('has-card');
      result.style.cursor = '';
      return;
    }
    result.classList.add('has-card');
    result.innerHTML = resultHTML(card);
    const face = result.querySelector('.spread-card');
    const isSideRelationshipCard = result.id === 'fResult' || result.id === 'fpResult';
    if (face && typeof window.loadCardInFinder === 'function' && card.suit !== 'joker' && isSideRelationshipCard) {
      const open = function (e) {
        if (e) e.preventDefault();
        window.loadCardInFinder(card.sv - 1, result);
      };
      face.style.cursor = 'pointer';
      result.style.cursor = 'pointer';
      face.onmousedown = function (e) { e.preventDefault(); };
      face.onclick = open;
    } else {
      result.style.cursor = '';
      if (face) {
        face.style.cursor = '';
        face.onclick = null;
        face.onmousedown = null;
      }
    }
  }

  // About panel — the card reading. Content populated whenever a
  // card is picked (solo or triptych); panel visibility is controlled
  // by the tab wrapper #fPanels. The Joker has a full reading entry
  // (CARD_READINGS['✦_joker']) so it renders kws /
  // personality / strengths+challenges same as any other card.
  //
  // Returns true if the panel has renderable content, false if it
  // should be marked empty (used by the picker to grey out its chip).
  function renderAbout(card, rel) {
    const box = dom.about;
    if (!box || !box.root) return false;
    box.root.classList.remove('is-joker', 'is-empty', 'is-relationship', 'is-olney-empty');
    if (!card) { box.root.classList.add('is-empty'); return false; }
    const key       = `${card.rank}_${card.suit === 'joker' ? 'joker' : card.suit}`;
    const jokerKey  = card.suit === 'joker' ? '✦_joker' : null;
    const reading   = (window.CARD_READINGS || {})[jokerKey || key] || null;
    const vow       = !rel ? cardVow(card) : '';
    const bondEntry = rel && rel.comp ? (window.REL_TEXT || {})[`${rel.comp.rank}_${rel.comp.suit}`] : null;
    const olneyOk   = !rel && typeof window.renderOlney === 'function'
      ? window.renderOlney(card, box.olney)
      : false;
    const voice = window.CardsStore ? window.CardsStore.getVoice() : 'modern';
    const showOlney = voice === 'olney' && olneyOk && !rel;
    if (!reading && !bondEntry && card.suit !== 'joker') { box.root.classList.add('is-empty'); return false; }

    if (box.bond) {
      if (bondEntry) {
        box.bond.innerHTML =
          `<p class="finder-about-bond-syn">${bondEntry.syn}</p>` +
          `<p class="finder-about-bond-text">${bondEntry.text}</p>`;
        box.root.classList.add('is-relationship');
      } else {
        box.bond.innerHTML = '';
      }
    }

    const kwsHTML = reading && reading.kws
      ? reading.kws.map(k => `<span class="finder-kw"><span class="finder-kw-mark" aria-hidden="true"></span><span class="finder-kw-text">${k}</span></span>`).join('')
      : '';
    if (box.kws) box.kws.innerHTML = kwsHTML;

    const paras = reading && reading.personality
      ? reading.personality.split(/\n\n+/).map(p => `<p>${p}</p>`).join('')
      : '';
    if (box.personality) box.personality.innerHTML = paras;
    if (box.vow) box.vow.textContent = vow ? `“${vow}”` : '';

    const listHTML = arr => (arr || []).map(x => `<li>${x}</li>`).join('');
    if (box.strengths)  box.strengths.innerHTML  = reading ? listHTML(reading.strengths)  : '';
    if (box.challenges) box.challenges.innerHTML = reading ? listHTML(reading.challenges) : '';

    box.root.classList.toggle('is-joker', !reading);
    box.root.classList.toggle('is-relationship', !!bondEntry);
    box.root.classList.toggle('is-olney-empty', !olneyOk);
    if (box.modern) box.modern.classList.toggle('is-active', !showOlney);
    if (box.olney) box.olney.classList.toggle('is-active', showOlney);
    return true;
  }

  function readPerson(personDom) {
    if (!personDom || !personDom.month || !personDom.day) return null;
    const m = +personDom.month.value;
    const d = +personDom.day.value;
    if (!m || !d || d < 1 || d > DAYS_IN_MONTH[m]) return null;
    return findCard(m, d);
  }

  function updateGridPick(card, mode, extraCard) {
    if (typeof ensureSpreadCtl !== 'function') return;
    const ctl = ensureSpreadCtl();
    const ok = card && card.suit !== 'joker';
    if (mode === 'secondary') {
      const extraOk = extraCard && extraCard.suit !== 'joker';
      ctl.setPickPartner(
        ok ? card.rank : null,
        ok ? card.suit : null,
        extraOk ? extraCard.rank : null,
        extraOk ? extraCard.suit : null
      );
    } else {
      ctl.setPick(ok ? card.rank : null, ok ? card.suit : null);
      if (typeof ctl.setScript === 'function') ctl.setScript(ok ? card.rank : null, ok ? card.suit : null);
    }
  }

  function refreshFinderGridHighlights() {
    if (_selectedComposite) {
      updateGridPick(_selectedComposite, 'primary');
      updateGridPick(_selectedCard, 'secondary', _selectedPartner);
      return;
    }
    updateGridPick(_selectedCard, 'primary');
    updateGridPick(_selectedPartner, 'secondary');
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
    const ui = getFinderUiState();
    const relOn = ui.relOn;
    const youDate = readPerson(dom.you);
    const you = ui.override || youDate;
    const partner = relOn ? readPerson(dom.partner) : null;
    const comp = relOn ? compositeCard(you, partner) : null;
    const targetMode = computeMode(relOn, you, partner, comp);
    return { you, partner, comp, targetMode };
  }

  function setRelationshipMode(on) {
    if (!dom || !dom.root || !dom.relBtn) return;
    dom.root.classList.toggle('rel-on', !!on);
    dom.relBtn.classList.toggle('on', !!on);
    dom.relBtn.textContent = on ? '−' : '+';
    dom.relBtn.setAttribute('aria-label', on ? 'Remove partner' : 'Add partner');
    dom.relBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (typeof window.refreshFinderTrayTargets === 'function') window.refreshFinderTrayTargets();
  }

  function clearPartnerInputs() {
    if (!dom || !dom.partner) return;
    if (dom.partner.month) dom.partner.month.value = '';
    if (dom.partner.day) dom.partner.day.value = '';
  }

  function clearYouTransientState() {
    clearFinderOverride();
    finderSnapshot.clear();
  }

  function syncSlotDate(slot, month, day) {
    if (!slot || !slot.month || !slot.day) return;
    slot.month.value = String(month);
    syncMonthInput(slot.month);
    syncDayInput(slot.day, month);
    slot.day.value = String(day);
  }

  function runFinderUpdate(options) {
    options = options || {};
    const state = readFinderState();
    const animation = options.animate === false ? null : captureAnimationContext(state.targetMode);
    renderFinderState(state);
    if (animation) playFinderAnimation(animation);
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

  function markTransitionSource(slotName, anchorEl) {
    if (!anchorEl || _renderMode !== 'triptych') {
      _transitionSource = null;
      return;
    }
    // Clone the CARD for the exit ghost, never its .finder-result wrapper.
    // The wrapper is a fixed-width column (inline-size clamp ~140px) that's
    // far wider than the 5:7 card it centers, so cloning it produced a
    // landscape, squashed ghost that scaled DOWN toward center. Resolve to
    // the inner .spread-card so the ghost keeps the card's aspect ratio and
    // grows into the solo slot like the other transition ghosts do.
    const cardEl = anchorEl.classList && anchorEl.classList.contains('spread-card')
      ? anchorEl
      : (anchorEl.querySelector && anchorEl.querySelector('.spread-card')) || anchorEl;
    const rect = cardEl.getBoundingClientRect();
    _transitionSource = rect && rect.width ? { slot: slotName, rect, el: cardEl } : null;
  }

  function flipEnterRel(soloRect, origin) {
    if (reduceMotion() || !soloRect || !soloRect.width) return;
    origin = origin === 'partner' ? 'partner' : 'you';
    const slots = {
      you:       resultCard(dom.you),
      composite: resultCard(dom.composite),
      partner:   resultCard(dom.partner)
    };
    // The card that was solo emanates from the centre back to its own
    // slot; the other two fade + scale in. `origin` tracks which side the
    // solo came from — a reset after clicking the RIGHT card sends it back
    // to the right rather than replaying the left-card entrance.
    const lead   = slots[origin];
    const others = [slots.composite, slots[origin === 'partner' ? 'you' : 'partner']];
    if (!lead) return;
    const leadRect = lead.getBoundingClientRect();
    if (!leadRect.width) return;
    const dx = Math.round((soloRect.left + soloRect.width  / 2) - (leadRect.left + leadRect.width  / 2));
    const dy = Math.round((soloRect.top  + soloRect.height / 2) - (leadRect.top  + leadRect.height / 2));
    const scaleUp = soloRect.width / leadRect.width;

    lead.style.zIndex     = '5';
    lead.style.transition = 'none';
    lead.style.transform  = `translate(${dx}px, ${dy}px) scale(${scaleUp})`;

    others.forEach((el) => {
      if (!el) return;
      el.style.transition = 'none';
      el.style.opacity    = '0';
      el.style.transform  = 'scale(.85)';
    });
    lead.getBoundingClientRect();
    requestAnimationFrame(() => {
      lead.style.transition = 'transform .55s cubic-bezier(.4,0,.2,1)';
      lead.style.transform  = '';
      others.forEach((el, i) => {
        if (!el) return;
        const delay = 0.15 + i * 0.08;
        el.style.transition =
          `opacity .5s ease ${delay}s, transform .5s cubic-bezier(.4,0,.2,1) ${delay}s`;
        el.style.opacity   = '';
        el.style.transform = '';
      });
    });
    setTimeout(() => {
      [lead].concat(others).forEach((el) => {
        if (!el) return;
        el.style.removeProperty('transition');
        el.style.removeProperty('transform');
        el.style.removeProperty('opacity');
        el.style.removeProperty('z-index');
      });
    }, 800);
  }

  function flipExitRel(sourceEl, sourceRect) {
    if (reduceMotion() || !sourceEl || !sourceRect || !sourceRect.width) return;
    const solo = resultCard(dom.you);
    if (!solo) return;
    const soloRect = solo.getBoundingClientRect();
    if (!soloRect.width) return;
    const dx = Math.round((soloRect.left + soloRect.width  / 2) - (sourceRect.left + sourceRect.width  / 2));
    const dy = Math.round((soloRect.top  + soloRect.height / 2) - (sourceRect.top  + sourceRect.height / 2));
    const scaleUp = soloRect.width / sourceRect.width;
    const ghost = ghostAt(sourceEl, sourceRect);

    solo.style.opacity = '0';
    solo.style.transition = 'none';
    ghost.style.transform = 'translate(0, 0) scale(1)';
    ghost.getBoundingClientRect();
    requestAnimationFrame(() => {
      ghost.style.transition = 'transform .55s cubic-bezier(.4,0,.2,1), opacity .2s ease .35s';
      ghost.style.transform  = `translate(${dx}px, ${dy}px) scale(${scaleUp})`;
      solo.style.transition = 'opacity .18s ease .38s';
      solo.style.opacity = '';
    });
    setTimeout(() => {
      ghost.remove();
      solo.style.removeProperty('transition');
      solo.style.removeProperty('opacity');
    }, 700);
  }

  function captureAnimationContext(targetMode) {
    const solo2trip = _renderMode === 'solo' && targetMode === 'triptych';
    const trip2solo = _renderMode === 'triptych' && targetMode === 'solo';
    const enterOrigin = _pendingEnterOrigin || 'you';
    _pendingEnterOrigin = null;
    const ctx = { solo2trip, trip2solo, enterOrigin, soloRect: null, sourceRect: null, sourceEl: null, ghosts: [] };

    if (solo2trip) {
      const soloEl = resultCard(dom.you);
      ctx.soloRect = soloEl ? soloEl.getBoundingClientRect() : null;
      return ctx;
    }

    if (!trip2solo) return ctx;

    const slotEls = {
      you: resultCard(dom.you),
      composite: resultCard(dom.composite),
      partner: resultCard(dom.partner)
    };
    const sourceSlot = _transitionSource && _transitionSource.slot ? _transitionSource.slot : 'you';
    const sourceEl = slotEls[sourceSlot] || slotEls.you;
    ctx.sourceEl = _transitionSource && _transitionSource.el ? _transitionSource.el : sourceEl;
    ctx.sourceRect = _transitionSource && _transitionSource.rect
      ? _transitionSource.rect
      : (sourceEl ? sourceEl.getBoundingClientRect() : null);

    if (!reduceMotion()) {
      Object.keys(slotEls).forEach(function (slot) {
        if (slot === sourceSlot) return;
        const el = slotEls[slot];
        const rect = el ? el.getBoundingClientRect() : null;
        if (!el || !rect || !rect.width) return;
        ctx.ghosts.push(ghostAt(el, rect));
      });
    }
    _transitionSource = null;
    return ctx;
  }

  function animateGhostExit(ghosts) {
    if (!ghosts || !ghosts.length) return;
    requestAnimationFrame(() => {
      ghosts.forEach((ghost, i) => {
        const delay = i * 0.06;
        ghost.style.transition = `transform .58s cubic-bezier(.4,0,.2,1) ${delay}s, opacity .48s ease ${delay}s`;
        ghost.style.transform  = i === 0
          ? 'scale(.5) translateY(-10px)'
          : 'translateX(56px) scale(.78) rotate(8deg)';
        ghost.style.opacity    = '0';
      });
    });
    setTimeout(() => { ghosts.forEach(g => g.remove()); }, 800);
  }

  function playFinderAnimation(ctx) {
    if (ctx.solo2trip && ctx.soloRect) {
      flipEnterRel(ctx.soloRect, ctx.enterOrigin);
      return;
    }
    if (ctx.trip2solo && ctx.sourceEl && ctx.sourceRect) {
      flipExitRel(ctx.sourceEl, ctx.sourceRect);
      animateGhostExit(ctx.ghosts);
    }
  }

  function renderFinderState(state) {
    renderResult(dom.you.result, state.you);
    renderResult(dom.composite.result, state.comp);
    renderResult(dom.partner.result, state.partner);
    if (dom.results) dom.results.classList.toggle('triptych', state.targetMode === 'triptych');
    _selectedCard = state.you;
    _selectedPartner = state.partner;
    _selectedComposite = state.targetMode === 'triptych' ? state.comp : null;
    updateShareButton();
    if (_selectedComposite) {
      updateGridPick(_selectedComposite, 'primary');
      updateGridPick(state.you, 'secondary', state.partner);
    } else {
      updateGridPick(state.you, 'primary');
      updateGridPick(state.partner, 'secondary');
    }
    _renderMode = state.targetMode;
    updateResetButton();
    // Result tabs (About / Life Script / Cycles). The whole
    // wrapper is hidden in triptych mode and when no card is picked.
    // Each panel's own render function decides whether it has content
    // for THIS card; empty panels get `.is-empty` so the placeholder
    // note shows and the chip is styled disabled.
    const isSolo = state.targetMode === 'solo';
    const isRelationship = state.targetMode === 'triptych' && !!state.comp;
    if (dom.panels.wrap) {
      const showPanels = !!state.you && (isSolo || isRelationship);
      dom.panels.wrap.hidden = !showPanels;
      dom.panels.wrap.classList.toggle('is-relationship', isRelationship);
      if (showPanels) {
        const flags = {
          about:      renderAbout(isRelationship ? state.comp : state.you, isRelationship ? state : null),
          lifescript: isRelationship
            ? (typeof window.renderRelationshipConnections === 'function' ? window.renderRelationshipConnections(state.you, state.partner) : false)
            : (typeof window.renderLifeScript === 'function' ? window.renderLifeScript(state.you) : false),
          intime:     !isRelationship && typeof window.renderInTime     === 'function' ? window.renderInTime(state.you)     : false
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
        if (isRelationship) {
          setFinderPanel('about', { collapsed: false });
        } else if (!active || flags[active] === false) {
          setFinderPanel('about');
        } else {
          setFinderPanelCollapsed(false);
        }
      }
    }
  }

  function find() {
    runFinderUpdate();
  }
  window.refreshFinderFromSettings = find;

  function toggleRel() {
    const willBeOn = !getFinderUiState().relOn;
    setRelationshipMode(willBeOn);
    find();
  }

  function loadCardInFinder(idx, anchorEl) {
    if (!dom) dom = cacheDom();
    if (!dom || !dom.you.month || !dom.you.day) return;
    const c = SPREAD_CARDS[idx];
    if (!c) return;
    const anchor = anchorEl || document.querySelector(`#annualGrid .spread-card[data-idx="${idx}"]`);
    const sourceSlot = anchorEl === dom.partner.result ? 'partner'
      : anchorEl === dom.composite.result ? 'composite'
      : 'you';
    markTransitionSource(sourceSlot, anchor);
    preserveAnchorPosition(anchor, function () {
      if (!getFinderUiState().override) {
        finderSnapshot.capture();
        if (_finderSnapshot) _finderSnapshot.sourceSlot = sourceSlot;
      }
      clearPartnerInputs();
      setRelationshipMode(false);
      setFinderOverride({ rank: c.rank, suit: c.suit, sym: c.sym, sv: idx + 1 });
      runFinderUpdate();
    });
  }

  // Mirror of loadCardInFinder for a specific day/month rather than a card
  // index — used by js/birthdays.js (saved birthdays + manual add) and
  // js/finder-trays.js (Calendar). target 'partner' fills the partner slot
  // (opening it via toggleRel() first if relationship mode is off);
  // anything else fills "you".
  function loadDateInFinder(month, day, target, options) {
    if (!dom) dom = cacheDom();
    if (!dom) return;
    options = options || {};
    const isPartner = target === 'partner';
    const slot = isPartner ? dom.partner : dom.you;
    if (!slot.month || !slot.day) return;
    if (isPartner && !getFinderUiState().relOn) setRelationshipMode(true);
    if (!isPartner) {
      _finderBirthLabel = options.name ? String(options.name).trim() : '';
      window.finderBirthLabel = _finderBirthLabel;
      clearYouTransientState();
    }
    syncSlotDate(slot, month, day);
    runFinderUpdate();
  }

  window.loadCardInFinder = loadCardInFinder;
  window.refreshFinderGridHighlights = refreshFinderGridHighlights;
  window.loadDateInFinder = loadDateInFinder;
  window.finderBirthLabel = _finderBirthLabel;
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
    applySharedFinderState();
    runFinderUpdate({ animate: false });

    dom.you.month.addEventListener('input', function () { clearFinderOverride(); discardFinderSnapshot(); syncDayInput(dom.you.day, +this.value); find(); });
    dom.you.month.addEventListener('change', function () { clearFinderOverride(); discardFinderSnapshot(); normalizeMonthInput(this); syncDayInput(dom.you.day, +this.value); find(); });
    dom.you.day.addEventListener('input', function () { clearFinderOverride(); discardFinderSnapshot(); syncDayInput(this, +dom.you.month.value); find(); });
    dom.you.day.addEventListener('change', function () { clearFinderOverride(); discardFinderSnapshot(); normalizeDayInput(this, +dom.you.month.value); find(); });
    wireSelectAllOnFocus(dom.you.day);
    wireSelectAllOnFocus(dom.you.month);
    wireDatePair(dom.you.day, dom.you.month);
    wireScrollStep(dom.you.day, dom.you.month, function () { clearFinderOverride(); discardFinderSnapshot(); find(); });
    if (dom.partner.month && dom.partner.day) {
      dom.partner.month.addEventListener('input', function () { syncDayInput(dom.partner.day, +this.value); find(); });
      dom.partner.month.addEventListener('change', function () { normalizeMonthInput(this); syncDayInput(dom.partner.day, +this.value); find(); });
      wireSelectAllOnFocus(dom.partner.day);
      wireSelectAllOnFocus(dom.partner.month);
      wireDatePair(dom.partner.day, dom.partner.month);
      wireScrollStep(dom.partner.day, dom.partner.month, find);
    }
    if (dom.partner.day) {
      dom.partner.day.addEventListener('input', function () { syncDayInput(this, +dom.partner.month.value); find(); });
      dom.partner.day.addEventListener('change', function () { normalizeDayInput(this, +dom.partner.month.value); find(); });
    }
    if (dom.resetBtn) {
      dom.resetBtn.addEventListener('click', function () {
        _pendingEnterOrigin = (_finderSnapshot && _finderSnapshot.relOn && _finderSnapshot.sourceSlot) || null;
        clearFinderOverride();
        restoreFinderSnapshot();
        find();
      });
    }
    if (dom.relBtn) dom.relBtn.addEventListener('click', toggleRel);
    if (dom.shareBtn) dom.shareBtn.addEventListener('click', shareFinderLink);

    // Chip picker — click switches the active panel.
    if (dom.panels.picker) {
      dom.panels.picker.addEventListener('click', function (e) {
        const btn = e.target.closest('.ns-chip[data-panel]');
        if (!btn || btn.classList.contains('is-disabled')) return;
        const active = dom.panels.body && dom.panels.body.dataset.panelActive;
        const collapsed = !!(dom.panels.wrap && dom.panels.wrap.classList.contains('is-collapsed'));
        if (btn.dataset.panel === active) {
          setFinderPanel(btn.dataset.panel, { collapsed: !collapsed });
          return;
        }
        setFinderPanel(btn.dataset.panel, { collapsed: false });
      });
    }
    window.addEventListener('mc-voice-toggle', function () {
      runFinderUpdate();
    });
    window.addEventListener('mc-read-dir-toggle', function () {
      runFinderUpdate();
    });
  });
})();
