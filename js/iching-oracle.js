// iching-oracle.js — the casting engine + result display for the
// I Ching page. Renamed from iching.js on 2026-07-07 after the
// reference-grid + popup + trigram-row + card-face renderer + history-
// storage seams were extracted into their own files:
//   iching-hexagrams.js — hexagramSVG, trigramSVG, VAL_TO_KW,
//                          KW_TO_VAL, the reference grid, the popup
//                          lifecycle, applyGlow, hexAnswerHTML
//   iching-trigrams.js  — 8-trigram reference row + detail popup
//   iching-cards.js     — cardFaceHTML + SUIT_CLASS + IC_PIP_LAYOUTS
//   iching-store.js     — reading-history localStorage
//   ichingdata.js       — HEX_DATA + TRIGRAMS_DATA
//   linedata.js         — LINE_DATA
//
// What's LEFT here — the Oracle IIFE (six-card cast → hexagram →
// moving lines → ace pulls → reading history + share URL). Public
// window API used from other files: none in this direction; the
// oracle CALLS window.openHexPopup / setCastGlow / hexAnswerHTML from
// iching-hexagrams.js, and reads cardFaceHTML / SUIT_CLASS from
// iching-cards.js as bare classic-script globals.

// ── Oracle ──────────────────────────────────────────────
(function () {
  var SUITS = ['♠','♣','♥','♦'];
  var RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  var COURTS = ['J','Q','K'];

  // v3 assumed `escapeHtml` was a classic-script global — it's actually
  // IIFE-scoped inside iching-hexagrams.js and never reached here.
  // Missing helper crashed movingLinesHTML / renderGoverningLine
  // whenever a cast produced changing lines, which halted the animation
  // and stopped the next cast from starting. Local copy fixes both.
  function escapeHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  var RED_SUITS = ['♥','♦'];
  var SYM_TO_SUIT = {'♥':'hearts','♦':'diamonds','♣':'clubs','♠':'spades'};
  function findCardIdx(castCard) {
    var suit = SYM_TO_SUIT[castCard.suit];
    return CARDS.findIndex(function(c) { return c.rank === castCard.rank && c.suit === suit; });
  }

  function buildDeck() {
    var deck = [];
    SUITS.forEach(function(s) {
      RANKS.forEach(function(r) {
        deck.push({ suit: s, rank: r, red: RED_SUITS.includes(s), court: COURTS.includes(r) });
      });
    });
    return deck;
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  // Returns { yang: bool, changing: bool }
  function lineType(card) {
    if (card.court && !card.red) return { yang: false, changing: true };  // black court = old yin
    if (card.court && card.red)  return { yang: true,  changing: true };  // red court  = old yang
    if (!card.red)               return { yang: false, changing: false }; // black pip  = young yin
    return                              { yang: true,  changing: false }; // red pip    = young yang
  }

  // Build 6-bit hexagram value from 6 lines (index 0 = line 1 / bottom)
  // bit5=line1(bottom) … bit0=line6(top) matching hexagramSVG convention
  function hexVal(lines) {
    var v = 0;
    lines.forEach(function(l, i) {
      if (l.yang) v |= (1 << (5 - i));
    });
    return v;
  }

  function renderHexResult(el, val, role, changingLines) {
    var kw = (typeof VAL_TO_KW !== 'undefined') ? VAL_TO_KW[val] : '?';
    el.className = 'hex-result hex-tile';
    el.innerHTML =
      '<div class="kw">' + kw + '</div>' +
      hexagramSVG(val, 0.5, changingLines);
  }

  // The middle "Changing" tile: the cast hexagram with its still lines ghosted
  // (via .hex-changing) so the moving lines read in gold; captioned with the count.
  function renderChangingTile(el, val, changingLines) {
    var n = changingLines.length;
    el.className = 'hex-result hex-tile hex-changing';
    el.innerHTML =
      '<div class="kw">' + n + (n === 1 ? ' line' : ' lines') + '</div>' +
      hexagramSVG(val, 0.5, changingLines);
  }

  // ── Cast state ──
  var deck = null;
  var draws = [];   // line cards drawn this round, index 0 = line 1 (bottom)
  var lines = [];
  var pulls = [];   // aces set aside during the cast (suit-pulls)
  var deckPos = 0;  // next card in the shuffled deck (aces advance it too)
  var _question = '';
  var _lastPrimary = null, _lastSecondary = null, _lastChanging = null;

  function showAsked() {
    var a = document.getElementById('askedLine');
    if (_question) {
      a.innerHTML = '<span>You asked</span>';
      a.appendChild(document.createTextNode(_question));
      a.style.display = 'block';
    } else { a.style.display = 'none'; }
  }

  // ── Reading history ─────────────────────────────────────
  // Backing storage moved to v3/js/iching-store.js (window.IChingStore).
  // Thin aliases keep the many local call sites unchanged for this step.
  function loadHistory() { return IChingStore.loadHistory(); }
  function saveHistory(list) { IChingStore.saveHistory(list); }

  function formatHistDate(ts) {
    var d = new Date(ts);
    var now = new Date();
    var diffMs = now - d;
    var diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return 'Today · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
           ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function hexLabel(drawsArr) {
    var ls = drawsArr.map(lineType);
    var primary = hexVal(ls);
    var kwP = (typeof VAL_TO_KW !== 'undefined') ? VAL_TO_KW[primary] : '?';
    var changingIdx = ls.reduce(function(a,l,i){ if(l.changing) a.push(i); return a; }, []);
    if (!changingIdx.length) return 'KW ' + kwP;
    var changedLs = ls.map(function(l){ return l.changing ? {yang:!l.yang,changing:false} : l; });
    var secondary = hexVal(changedLs);
    var kwS = (typeof VAL_TO_KW !== 'undefined') ? VAL_TO_KW[secondary] : '?';
    return 'KW ' + kwP + ' → ' + kwS;
  }

  function renderHistPanel(msg) {
    var panel = document.getElementById('histPanel');
    var list = loadHistory();
    var items = list.length
      ? list.slice().reverse().map(function(r) {
          var q = r.question ? r.question : '(no question)';
          var qShort = q.length > 55 ? q.slice(0, 52) + '…' : q;
          return '<div class="hist-item" data-id="' + r.id + '">' +
            '<div class="hist-item-body">' +
              '<div class="hist-date">' + formatHistDate(r.ts) + '</div>' +
              '<div class="hist-q">' + escapeHtml(qShort) + '</div>' +
              '<div class="hist-hex">' + hexLabel(r.draws) +
                (r.pulls && r.pulls.length
                  ? ' · ' + r.pulls.map(function(L){ return 'A' + LETTER_SUIT[L.charAt(0)]; }).join(' ')
                  : '') + '</div>' +
            '</div>' +
            '<button class="hist-del" data-del="' + r.id + '" title="Delete">✕</button>' +
          '</div>';
        }).join('')
      : '<div class="hist-empty">No saved readings yet.</div>';

    // Backup footer — present even when empty (importing on a fresh device
    // is exactly the empty case). MCBackup covered every saved store site-
    // wide in v3 (readings, birthdays, prefs, scores, progress); v4 hasn't
    // shipped it yet, so the Export / Import buttons are hidden when it's
    // not on window. Restore once MCBackup is ported.
    var hasBackup = !!window.MCBackup;
    panel.innerHTML = items +
      '<div class="hist-foot">' +
        (hasBackup ? '<button type="button" id="ihExport">Export</button>' : '') +
        (hasBackup ? '<button type="button" id="ihImport">Import</button>' : '') +
        (hasBackup ? '<input type="file" id="ihImportFile" accept=".json,application/json" style="display:none">' : '') +
        '<span class="hist-foot-msg">' + (msg || '') + '</span>' +
      '</div>';

    if (hasBackup) {
      document.getElementById('ihExport').addEventListener('click', function(e) {
        e.stopPropagation();
        window.MCBackup.export();
      });
      document.getElementById('ihImport').addEventListener('click', function(e) {
        e.stopPropagation();
        document.getElementById('ihImportFile').click();
      });
      document.getElementById('ihImportFile').addEventListener('change', function() {
        var f = this.files[0];
        if (!f) return;
        window.MCBackup.import(f, function(added) {
          renderHistPanel(added < 0 ? 'could not read that file' :
            added === 0 ? 'nothing new to add' : '✓ ' + added + ' added');
        });
      });
    }

    panel.querySelectorAll('.hist-item').forEach(function(item) {
      item.addEventListener('click', function(e) {
        if (e.target.closest('[data-del]')) return; // handled below
        var id = parseInt(item.getAttribute('data-id'));
        var entry = loadHistory().find(function(r){ return r.id === id; });
        if (entry) { restoreReading(entry); closeHistPanel(); }
      });
    });
    panel.querySelectorAll('[data-del]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = parseInt(btn.getAttribute('data-del'));
        saveHistory(loadHistory().filter(function(r){ return r.id !== id; }));
        renderHistPanel();
      });
    });
  }

  function closeHistPanel() {
    document.getElementById('histPanel').classList.remove('open');
  }

  function saveReading() {
    // (called internally after each cast — does NOT save to history)
    // History saving is explicit via Save button.
  }

  function persistCurrentReading() {
    if (draws.length < 6) return;
    var list = loadHistory();
    var entry = { id: Date.now(), ts: Date.now(), question: _question, draws: draws };
    if (pulls.length) entry.pulls = pulls.map(function(c){
      return SUIT_LETTER[c.suit] + (c.pos != null ? (c.pos + 1) : '');
    });
    list.push(entry);
    saveHistory(list);
    var btn = document.getElementById('saveReadingBtn');
    btn.innerHTML = '✓';
    btn.disabled = true;
    setTimeout(function(){ btn.style.visibility = 'hidden'; btn.innerHTML = FLOPPY_SVG; btn.disabled = false; }, 1400);
  }

  // ── Shareable reading links ──────────────────────────────
  // A reading is fully defined by its 6 cards + question, encoded in the
  // URL hash: iching.html#r=JH.10S.3D.QC.7H.2S&q=encoded%20question
  // (card token = rank + suit letter, index 0 = line 1 / bottom)
  var SUIT_LETTER = { '♥':'H', '♦':'D', '♣':'C', '♠':'S' };
  var LETTER_SUIT = { 'H':'♥', 'D':'♦', 'C':'♣', 'S':'♠' };

  function readingURL() {
    if (draws.length < 6) return null;
    var r = draws.map(function(c){ return c.rank + SUIT_LETTER[c.suit]; }).join('.');
    var hash = '#r=' + r +
      (pulls.length ? '&a=' + pulls.map(function(c){
        return SUIT_LETTER[c.suit] + (c.pos != null ? (c.pos + 1) : '');
      }).join('.') : '') +
      (_question ? '&q=' + encodeURIComponent(_question) : '');
    return location.origin + location.pathname + hash;
  }

  function decodeHashReading() {
    var h = location.hash.replace(/^#/, '');
    if (!h) return null;
    var params = {};
    h.split('&').forEach(function(p) {
      var i = p.indexOf('=');
      if (i > 0) params[p.slice(0, i)] = p.slice(i + 1);
    });
    if (!params.r) return null;
    var toks = params.r.split('.');
    if (toks.length !== 6) return null;
    var ds = [];
    for (var i = 0; i < 6; i++) {
      var m = /^(A|[2-9]|10|J|Q|K)([HDCS])$/.exec(toks[i]);
      if (!m) return null;
      var suit = LETTER_SUIT[m[2]];
      ds.push({ suit: suit, rank: m[1], red: RED_SUITS.includes(suit), court: COURTS.includes(m[1]) });
    }
    var q = '';
    try { q = params.q ? decodeURIComponent(params.q) : ''; } catch(e) {}
    var ps = [];
    if (params.a) {
      params.a.split('.').forEach(function(L) {
        if (/^[HDCS][1-6]?$/.test(L)) ps.push(L);
      });
      if (ps.length > 4) ps = ps.slice(0, 4);
    }
    return { question: q, draws: ds, pulls: ps };
  }

  function copyShareLink() {
    var url = readingURL();
    if (!url) return;
    var done = function() {
      var btn = document.getElementById('shareBtn');
      var prev = btn.innerHTML;
      btn.innerHTML = '✓';
      btn.disabled = true;
      setTimeout(function(){ btn.innerHTML = prev; btn.disabled = false; }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function(){ legacyCopy(url); done(); });
    } else {
      legacyCopy(url); done();
    }
  }

  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
  }

  var _isRestoring = false;

  function restoreReading(saved) {
    _isRestoring = true;
    draws = saved.draws.slice();
    lines = draws.map(lineType);
    pulls = (saved.pulls || []).map(function(L) {
      var suit = LETTER_SUIT[L.charAt(0)];
      var pos = /^[1-6]$/.test(L.charAt(1)) ? parseInt(L.charAt(1), 10) - 1 : null;
      return { suit: suit, rank: 'A', red: RED_SUITS.includes(suit), court: false, pos: pos };
    });
    _question = saved.question || '';

    document.getElementById('questionInput').value = _question;
    showAsked();

    buildSlots();
    draws.forEach(function(card, idx) { fillSlot(idx, card, false); });

    document.getElementById('resultWrap').style.display = 'none';
    document.getElementById('governingLine').innerHTML = '';

    showResult();
    _isRestoring = false;

    // Hide save btn (already saved)
    document.getElementById('saveReadingBtn').style.visibility = 'hidden';
    window.scrollTo({ top: document.getElementById('oracle').offsetTop - 80, behavior: 'smooth' });
  }

  function startRound() {
    deck = shuffle(buildDeck());
    draws = [];
    lines = [];
    pulls = [];
    deckPos = 0;
    _question = document.getElementById('questionInput').value.trim();
    showAsked();
    buildSlots();
    document.getElementById('pullBanner').style.display = 'none';
    document.getElementById('pullBanner').innerHTML = '';
    document.getElementById('resultWrap').style.display = 'none';
    document.getElementById('governingLine').innerHTML = '';
    document.getElementById('saveReadingBtn').style.visibility = 'hidden';
    document.getElementById('shareBtn').style.visibility = 'hidden';
    // Drop any stale shared-reading hash so the URL matches the new cast
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  }

  // ── Ruling / governing line (Alfred Huang – Wilhelm system) ──────────────
  // changingIdx: sorted indices 0–5, where 0 = bottom (line 1) … 5 = top (line 6).
  // Returns which single line governs and in which hexagram its text is read.
  // For 1–3 moving lines the text is read in the Cast hexagram; for 4–5 in the
  // “Becomes” hexagram. 0 or 6 moving lines fall back to the Judgment.
  function governingLine(changingIdx, primary, secondary) {
    var n = changingIdx.length;
    var parity = function (i) { return (primary >> (5 - i)) & 1; }; // 1 = yang, 0 = yin
    var still = [0,1,2,3,4,5].filter(function (i) { return changingIdx.indexOf(i) === -1; });
    if (n === 0) return { mode: 'judgment', src: 'primary' };
    if (n === 1) return { mode: 'line', line: changingIdx[0], src: 'primary' };
    if (n === 2) {
      var a = changingIdx[0], b = changingIdx[1], line;
      if (parity(a) !== parity(b)) line = (parity(a) === 0) ? a : b; // the yin line
      else line = a;                                                 // both alike → lower
      return { mode: 'line', line: line, src: 'primary' };
    }
    if (n === 3) return { mode: 'line', line: changingIdx[1], src: 'primary' };       // middle
    if (n === 4) return { mode: 'line', line: still[still.length - 1], src: 'relating' }; // upper still line
    if (n === 5) return { mode: 'line', line: still[0], src: 'relating' };            // sole still line
    // n === 6
    if (primary === 63) return { mode: 'special', text: 'Use Nine', src: 'primary' }; // Qian
    if (primary === 0)  return { mode: 'special', text: 'Use Six',  src: 'primary' }; // Kun
    return { mode: 'judgment', src: 'relating' };
  }

  function lineName(val, i) {
    var bit = (val >> (5 - i)) & 1;
    var pos = ['at the beginning','in the second place','in the third place',
               'in the fourth place','in the fifth place','at the top'][i];
    return (bit ? 'Nine' : 'Six') + ' ' + pos;
  }

  // Moving-line text for a hexagram value + line index (0 = bottom / line 1).
  function lineText(val, i) {
    var kw = (typeof VAL_TO_KW !== 'undefined') ? VAL_TO_KW[val] : null;
    var arr = (kw && typeof LINE_DATA !== 'undefined') ? LINE_DATA[kw] : null;
    return (arr && arr[i]) ? arr[i] : '';
  }

  // Expandable list of every moving line, read in the cast (primary) hexagram.
  // rulingIdx = the line that governs, if it is one of these primary lines (else -1).
  function movingLinesHTML(changingIdx, primary, rulingIdx) {
    var items = [5,4,3,2,1,0].map(function(i) {
      var isChanging = changingIdx.indexOf(i) !== -1;
      var isRuling = (i === rulingIdx);
      var cls = 'ml-item ' + (isChanging ? 'changing' : 'still') + (isRuling ? ' ruling' : '');
      var txt = lineText(primary, i) ? '<div class="ml-text">' + escapeHtml(lineText(primary, i)) + '</div>' : '';
      return '<div class="' + cls + '">' +
        '<div class="ml-label">' + lineName(primary, i) +
          (isRuling ? '<span class="ml-tag">rules</span>' : '') + '</div>' +
        txt +
      '</div>';
    }).join('');
    return '<div class="gl-more">' +
      '<button type="button" class="gl-toggle" aria-expanded="false">Show all lines</button>' +
      '<div class="gl-lineswrap"><div class="gl-linesmin">' +
        '<div class="gl-lines">' + items + '</div>' +
      '</div></div>' +
    '</div>';
  }

  function wireGlToggle(el) {
    var btn = el.querySelector('.gl-toggle');
    if (!btn) return;
    var more = el.querySelector('.gl-more');
    if (!more) return;
    btn.addEventListener('click', function () {
      var open = more.classList.toggle('open');   // CSS unfurls .gl-lineswrap 0fr→1fr
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Hide all lines' : 'Show all lines';
    });
  }

  var GL_RULE = {
    1: 'One moving line — it speaks directly.',
    2: 'Two moving lines — the yin line leads; if both are alike, the lower leads.',
    3: 'Three moving lines — the middle one rules.',
    4: 'Four moving lines — the upper of the two still lines rules, read in the “Becomes” hexagram.',
    5: 'Five moving lines — the single still line rules, read in the “Becomes” hexagram.'
  };

  function renderGoverningLine(changingIdx, primary, secondary) {
    var el = document.getElementById('governingLine');
    var n = changingIdx.length;
    var g = governingLine(changingIdx, primary, secondary);

    // Index (0-5) of the governing line within the cast hexagram, or -1 when it
    // is read in the relating hexagram (n=4,5) or is not a single line.
    var rulingIdx = (g.mode === 'line' && g.src === 'primary') ? g.line : -1;
    var moreHTML = movingLinesHTML(changingIdx, primary, rulingIdx);

    if (g.mode === 'judgment') {
      var msg = (g.src === 'primary')
        ? 'No moving lines — the reading rests on the hexagram’s Judgment as a whole.'
        : 'All six lines moving — the reading passes to the Judgment of the “Becomes” hexagram.';
      el.innerHTML = '<div class="gl-label">Ruling Line</div><div class="gl-note">' + msg + '</div>' + moreHTML;
      wireGlToggle(el);
      return;
    }
    if (g.mode === 'special') {
      el.innerHTML =
        '<div class="gl-label">Ruling Line</div>' +
        '<div class="gl-name">' + g.text + '</div>' +
        '<div class="gl-src">All lines moving · ' + (primary === 63 ? 'The Creative' : 'The Receptive') + '</div>' +
        '<div class="gl-note">Every line is moving, so the whole figure turns over; read it in the Judgment, then in what it becomes. The six lines below speak in turn.</div>' +
        moreHTML;
      wireGlToggle(el);
      return;
    }
    var srcVal = (g.src === 'relating') ? secondary : primary;
    var txt = lineText(srcVal, g.line);
    el.innerHTML =
      '<div class="gl-label">Ruling Line</div>' +
      '<div class="gl-name">' + lineName(srcVal, g.line) + '</div>' +
      '<div class="gl-src">Line ' + (g.line + 1) + ' · ' +
        (g.src === 'relating' ? '“Becomes” hexagram' : 'Cast hexagram') +
        ' · King Wen ' + VAL_TO_KW[srcVal] + '</div>' +
      '<div class="gl-desc' + (txt ? '' : ' placeholder') + '">' +
        (txt ? escapeHtml(txt) : 'Line text unavailable.') + '</div>' +
      '<div class="gl-rule">' + (GL_RULE[n] || '') + '</div>' +
      moreHTML;
    wireGlToggle(el);
  }

  // Card face rendering — SUIT_CLASS, PIP_LAYOUTS, COURT_PIP_*, and
  // cardFaceHTML MOVED to v3/js/iching-cards.js (2026-07-07). The
  // Oracle IIFE below reads SUIT_CLASS + cardFaceHTML as bare classic-
  // script globals via shared lexical scope.

  // Six line slots, built up front so the cast layout is visible before any
  // draw and each card simply reveals into its place.
  var slotEls = [], slotNoEls = [], slotTypeEls = [];
  function buildSlots() {
    var row = document.getElementById('cardsRow');
    row.innerHTML = '';
    slotEls = []; slotNoEls = []; slotTypeEls = [];
    for (var i = 0; i < 6; i++) {
      var wrap = document.createElement('div');
      wrap.className = 'card-line';
      var no = document.createElement('div');
      no.className = 'cl-no';
      no.textContent = '';
      var el = document.createElement('div');
      el.className = 'spread-card slot';
      el.setAttribute('aria-hidden', 'true');
      var tp = document.createElement('div');
      tp.className = 'cl-type';
      tp.textContent = '';
      wrap.appendChild(no);
      wrap.appendChild(el);
      wrap.appendChild(tp);
      row.appendChild(wrap);
      slotEls.push(el); slotNoEls.push(no); slotTypeEls.push(tp);
    }
  }

  // Reveal a drawn card into its slot. The label above becomes the line's bit
  // (1 = yang, 0 = yin) so the row reads as the hexagram's binary lookup key.
  function fillSlot(idx, card, animate) {
    var el = slotEls[idx], no = slotNoEls[idx], tp = slotTypeEls[idx];
    if (!el) return;
    var lt = lineType(card);
    no.textContent = lt.yang ? '1' : '0';
    if (tp) {
      tp.innerHTML = lt.yang
        ? '<svg width="26" height="4" aria-hidden="true"><rect width="26" height="4" rx="1.5" fill="currentColor"/></svg>'
        : '<svg width="26" height="4" aria-hidden="true"><rect x="0" width="11" height="4" rx="1.5" fill="currentColor"/><rect x="15" width="11" height="4" rx="1.5" fill="currentColor"/></svg>';
      tp.className = 'cl-type' + (lt.changing ? ' changing' : '');
    }
    // No 'clickable' class and no handler — the cast cards are display-only
    // (the cast-card popup was removed 2026-07-06; the hexagram popup on the
    // sequence chart is the reading's detail view). Keeping 'clickable' off
    // also keeps site.js's a11y tagger from re-marking them as buttons.
    el.className = 'spread-card ck-host ' + SUIT_CLASS[card.suit] +
      (card.court ? ' changing' : '');
    el.title = 'Line ' + (idx + 1) + ' · ' + card.rank + card.suit;
    // 3D flip: card lands face-down (shared .card-back) and turns to reveal its
    // face. Without .dealing (restored readings) the flip rests front-up.
    el.innerHTML =
      '<div class="ck-flip' + (animate ? ' dealing' : '') + '">' +
        '<div class="ck-side ck-front">' + cardFaceHTML(card) + '</div>' +
        '<div class="ck-side ck-back"><div class="card-back"><span class="cb-coin"></span></div></div>' +
      '</div>';
  }

  // Aces: currently KEPT in the pack — a red ace reads as young yang, a black
  // ace as young yin, like any other pip. Flip KEEP_ACES to false to restore
  // the old behaviour where an ace steps aside as a "suit-pull" and the next
  // card fills the line. That version keeps the exact 3-coin line odds
  // (3/8, 3/8, 1/8, 1/8); keeping aces shifts young:changing slightly (40:12
  // instead of 36:12). TODO: revisit whether to pull aces again in future.
  var KEEP_ACES = true;
  function drawOne() {
    var card = deck[deckPos++];
    if (!KEEP_ACES) {
      while (card && card.rank === 'A') {
        card.pos = draws.length;   // 0-based line index the ace was drawn for
        pulls.push(card);
        card = deck[deckPos++];
      }
    }
    draws.push(card);
    lines.push(lineType(card));
    fillSlot(draws.length - 1, card, true);
  }

  // ── Ace suit-pulls ───────────────────────────────────────
  var SUIT_NAME = { '♥':'Hearts', '♦':'Diamonds', '♣':'Clubs', '♠':'Spades' };
  var PULL_TEXT = {
    '♥': 'The reading leans toward the heart. Feeling and the bonds between people carry weight here.',
    '♣': 'The reading leans toward the mind. Thought, speech, and what is being learned carry weight here.',
    '♦': 'The reading leans toward value. What things are worth, and what they cost, carries weight here.',
    '♠': 'The reading leans toward work and will. The body and its labor carry weight here.'
  };

  function renderPulls() {
    var el = document.getElementById('pullBanner');
    if (!pulls.length) { el.innerHTML = ''; el.style.display = 'none'; return; }
    el.innerHTML = pulls.map(function (c) {
      var pos = (c.pos != null && c.pos >= 0 && c.pos <= 5)
        ? '<span class="pull-pos">· drawn at line ' + (c.pos + 1) + '</span>' : '';
      return '<div class="pull-row">' +
        '<div class="spread-card pull-card visible ' + SUIT_CLASS[c.suit] + '">' + cardFaceHTML(c) + '</div>' +
        '<div class="pull-body">' +
          '<div class="pull-name">Ace of ' + SUIT_NAME[c.suit] + pos + '</div>' +
          '<div class="pull-desc">' + PULL_TEXT[c.suit] + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
    el.style.display = 'flex';
  }

  function showResult() {
    var primary = hexVal(lines);
    var changingIdx = lines.reduce(function(a, l, i){ if(l.changing) a.push(i); return a; }, []);
    var hasChanging = changingIdx.length > 0;
    var changedLines = lines.map(function(l) {
      return l.changing ? { yang: !l.yang, changing: false } : l;
    });
    var secondary = hexVal(changedLines);

    _lastPrimary = primary; _lastSecondary = secondary; _lastChanging = changingIdx;

    var _rw = document.getElementById('resultWrap');
    _rw.style.display = 'flex';
    // Guarded fadeUp entrance so the result stage breathes in as one beat after
    // the last card lands (see castOne/castAll). .cast-figs.fade is reduced-motion-guarded.
    _rw.classList.remove('fade'); void _rw.offsetWidth; _rw.classList.add('fade');
    renderPulls();
    renderHexResult(document.getElementById('hexPrimary'), primary, 'Cast', changingIdx);

    var prim = document.getElementById('hexPrimary');
    prim.onclick = function () { selectReading('primary'); };

    var chg = document.getElementById('hexChanging');
    var sec = document.getElementById('hexSecondary');
    if (hasChanging) {
      // Middle tile = the changing lines (its own view); right tile = Becomes.
      document.getElementById('changingCol').style.display = 'flex';
      renderChangingTile(chg, primary, changingIdx);
      chg.onclick = function () { selectReading('lines'); };

      document.getElementById('becomesCol').style.display = 'flex';
      renderHexResult(sec, secondary, 'Becomes', null);
      sec.onclick = function () { selectReading('secondary'); };

      renderGoverningLine(changingIdx, primary, secondary);
    } else {
      document.getElementById('changingCol').style.display = 'none';
      chg.onclick = null;
      document.getElementById('becomesCol').style.display = 'none';
      sec.onclick = null;
      document.getElementById('governingLine').innerHTML = '';
    }

    selectReading('primary');   // default to the Cast hexagram

    if (window.setCastGlow) window.setCastGlow(hasChanging ? [primary, secondary] : [primary]);
    if (!_isRestoring) {
      var sBtn = document.getElementById('saveReadingBtn');
      sBtn.innerHTML = FLOPPY_SVG;
      sBtn.disabled = false;
      sBtn.style.visibility = 'visible';
    }
    // Share is available for any complete reading, fresh or restored
    document.getElementById('shareBtn').style.visibility = 'visible';
  }

  // Both tiles are clickable; clicking one loads its reading below and marks it active
  // Three mutually-exclusive views: the Cast hexagram, the changing lines (the →
  // button), and the Becomes hexagram. Only one is shown at a time.
  function selectReading(which) {
    var ot = document.getElementById('oracleText');
    var gl = document.getElementById('governingLine');
    if (which === 'lines') {
      ot.style.display = 'none';
      gl.classList.remove('gl-collapsed');
      gl.classList.remove('fade'); void gl.offsetWidth; gl.classList.add('fade');
    } else {
      var val = (which === 'secondary') ? _lastSecondary : _lastPrimary;
      if (val == null) return;
      gl.classList.add('gl-collapsed');
      ot.style.display = '';
      ot.innerHTML = (window.hexAnswerHTML ? window.hexAnswerHTML(val) : '');
      ot.classList.remove('fade'); void ot.offsetWidth; ot.classList.add('fade');
    }
    document.getElementById('hexPrimary').classList.toggle('active', which === 'primary');
    document.getElementById('hexSecondary').classList.toggle('active', which === 'secondary');
    var chg = document.getElementById('hexChanging');
    chg.classList.toggle('active', which === 'lines');
    chg.setAttribute('aria-pressed', which === 'lines' ? 'true' : 'false');
  }

  function updateButtons() {
    var label = (!deck || draws.length >= 6 || draws.length === 0) ? 'Cast a line' : 'Cast the next line';
    var b = document.getElementById('castOneBtn');
    b.title = label;
    b.setAttribute('aria-label', label);
  }

  // Run cb once the sixth card has finished dealing in, so the result reveals
  // as a deliberate beat AFTER the last card lands (the old fixed 360/390ms
  // timers could fire while the sixth card was still mid-flip). dealIn is .42s
  // (dealFade .25s under reduced motion) — both fire animationend; the timeout
  // is a belt-and-braces fallback so the result never stays hidden.
  function afterSixthDeal(cb) {
    var el = slotEls[5];
    var done = false;
    var fire = function () { if (done) return; done = true; cb(); };
    if (el) el.addEventListener('animationend', fire, { once: true });
    setTimeout(fire, 520);
  }

  // A touch of ceremony: shimmer the cast-icon sparkle in time with the press
  // (reuses castPulse's glow language; guarded for reduced motion in CSS).
  function sparkCast() {
    var s = document.querySelector('#castOneBtn .cast-spark');
    if (!s) return;
    s.classList.remove('spark'); s.getBoundingClientRect(); s.classList.add('spark');
  }

  function castOne() {
    if (!deck || draws.length >= 6) startRound();
    sparkCast();
    drawOne();
    if (draws.length === 6) { afterSixthDeal(showResult); }
    updateButtons();
  }

  function castAll() {
    if (!deck || draws.length >= 6) startRound();
    var oneBtn = document.getElementById('castOneBtn');
    var allBtn = document.getElementById('castAllBtn');
    oneBtn.disabled = true; allBtn.disabled = true;
    (function next(){
      if (draws.length >= 6) {
        afterSixthDeal(function(){
          showResult();
          oneBtn.disabled = false; allBtn.disabled = false;
          updateButtons();
        });
        return;
      }
      drawOne();
      setTimeout(next, 150);
    })();
  }

  var FLOPPY_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" style="display:block;pointer-events:none"><path fill="currentColor" fill-rule="evenodd" d="M1 1H10L14 5V15H1ZM3 2H8V6.5H3ZM3 10.5H13V14H3Z"/></svg>';

  document.getElementById('castOneBtn').addEventListener('click', castOne);
  document.getElementById('castAllBtn').addEventListener('click', castAll);
  document.getElementById('saveReadingBtn').addEventListener('click', persistCurrentReading);
  document.getElementById('shareBtn').addEventListener('click', copyShareLink);
  document.getElementById('historyBtn').addEventListener('click', function(e) {
    e.stopPropagation();
    var panel = document.getElementById('histPanel');
    var opening = !panel.classList.contains('open');
    if (opening) renderHistPanel();
    panel.classList.toggle('open', opening);
  });
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.hist-wrap')) closeHistPanel();
  });
  document.getElementById('questionInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); castAll(); }
  });

  // (The cast-card popup — click a dealt card for its suit/rank reading — was
  // removed 2026-07-06; the cards are display-only. The hexagram popup opened
  // from the sequence chart is untouched.)

  // Show the six empty line slots up front (a shared reading below fills them).
  buildSlots();

  // ── Restore a shared reading from the URL hash, if present ──
  // (Explicitly shared links only — normal page loads still start clean.)
  (function() {
    var shared = decodeHashReading();
    if (!shared) return;
    restoreReading(shared);
    // A shared reading isn't in this visitor's history yet — allow saving it
    var sBtn = document.getElementById('saveReadingBtn');
    sBtn.innerHTML = FLOPPY_SVG;
    sBtn.disabled = false;
    sBtn.style.visibility = 'visible';
  })();

  // ── Pure-function surface for the golden test + sweeps ─────────
  // buildDeck / lineType / hexVal / governingLine are the deterministic
  // engine primitives. Exposing them on window lets dev/v3-tests/
  // iching-golden.mjs lock their outputs across refactors, and lets
  // iching-oracle-sweep.mjs exercise them without needing to fake
  // an entire cast. They stay module-private otherwise — no other file
  // on the page reads them directly.
  window.buildDeck     = buildDeck;
  window.lineType      = lineType;
  window.hexVal        = hexVal;
  window.governingLine = governingLine;

})();

// The 8-trigram reference row (bottom of the page) MOVED to
// v3/js/iching-trigrams.js (2026-07-07). Its TRIGRAMS data moved to
// ichingdata.js as window.TRIGRAMS_DATA.

