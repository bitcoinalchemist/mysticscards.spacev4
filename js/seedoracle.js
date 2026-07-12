// seedoracle.js — the Seed Oracle's journey shell. After the 2026-07-08
// module split this file owns:
//   • Chapter gating (CHAPTERS array, applyGates, raiseUnlock,
//     renderRail, scrollToChapter)
//   • Chapter I  — the line-by-line first hexagram build
//   • Chapter II — the 22-slot stack (renderStack, hexCastOne/All)
//   • Chapter III — the live bit ribbon (renderWeave, litHex, tamper toy)
//   • Chapter IV — the seal (renderSealFig, tamper output, finalWords)
//   • Chapter V  — the suit-seal chooser (renderSuitSeals, sealWith)
//   • Chapter VI — the proof: entropy readout + SHA instrument
//   • Chapter VII — under-the-hood derived addresses (lazy)
//   • The hexagram detail popup (shared chrome for "read this hexagram")
//   • Copy button, phrase input debouncer, threshold actions,
//     deep-link + init
// (The former 24-word reading path was retired 2026-07-08 — twelve words
// is now the only length this page casts. state.len stays as a variable
// so cs / hexCount / castFree still read cleanly.)
//
// Reads from window (loaded in this order in seedoracle.html):
//   window.BIP39_WORDS    — bip39-words.js  (2048-word list)
//   window.BTC            — bip84.js       (address derivation)
//   window.ICHING_JUDGMENTS — ichingjudgments.js
//   window.SeedStore      — seedoracle-store.js   (unlock persistence)
//   window.SeedOracleBitcoin — seedoracle-bitcoin.js (aliased at IIFE top)
//   window.SeedOracleHex     — seedoracle-hexagrams.js (aliased at IIFE top)

(function () {
  'use strict';
  // Bitcoin math (BIP39, SHA-256, PBKDF2 seed) lives in
  // js/seedoracle-bitcoin.js — window.SeedOracleBitcoin. Aliased
  // here so the many call sites downstream read unchanged.
  var _btc = window.SeedOracleBitcoin || {};
  var WL = _btc.WL || (window.BIP39_WORDS || []);
  var IDX = _btc.IDX || {};
  var sha256Bytes = _btc.sha256Bytes;
  var bits = _btc.bits;
  var entropyToMnemonic = _btc.entropyToMnemonic;
  var phraseToBits = _btc.phraseToBits;
  var checkPhrase = _btc.checkPhrase;
  var phraseToVals = _btc.phraseToVals;
  var valsToWords = _btc.valsToWords;
  // deriveSeed keeps its old single-arg shape (writes to #soSeed) so
  // the two callers in this file don't change.
  function deriveSeed(mnemonic) { _btc.deriveSeed(mnemonic, document.getElementById('soSeed')); }

  // Hexagram SVG renderers + suit mapping live in
  // js/seedoracle-hexagrams.js — window.SeedOracleHex. Aliased
  // here so hexagramSVG / slotHexSVG / suitOf / suitPip / VAL_TO_KW
  // / SUITS / SUIT_ORDER etc. read unchanged from every call site.
  var _hex = window.SeedOracleHex || {};
  var VAL_TO_KW = _hex.VAL_TO_KW || [];
  var hexagramSVG = _hex.hexagramSVG;
  var slotHexSVG = _hex.slotHexSVG;
  var SUITS = _hex.SUITS || {};
  var SUIT_ORDER = _hex.SUIT_ORDER || ['hearts','clubs','diamonds','spades'];
  var suitOf = _hex.suitOf;
  var suitPip = _hex.suitPip;

  var JD = window.ICHING_JUDGMENTS || {};   // direct Zhou Yi judgment translations, by King Wen


  // ── SHA-256 + BIP39 + deriveSeed MOVED to js/seedoracle-bitcoin.js
  // and hexagram SVG + suit mapping MOVED to js/seedoracle-hexagrams.js
  // (2026-07-08). Both aliased above so every call site in this file
  // reads unchanged.

  // ══════════════════════════════════════════════════════════════════
  // Journey state
  //   state       — the COMMITTED (sealed) reading, as before.
  //   _lineBits   — chapter I's first hexagram, built line by line (bottom-up).
  //   _hexVals    — the cast in progress (hexagram 1 arrives from chapter I).
  //   _sealed     — a valid phrase is committed (suit chosen / oracle / pasted).
  //   _tamperOn/_tamperIdx — the chapter-IV "test the seal" toy (sandboxed:
  //                 it flips bits at DISPLAY time only, never in the state).
  // ══════════════════════════════════════════════════════════════════
  var state={ len:12, vals:[], focus:0 };
  var _lineBits=[], _hexVals=[], _sealed=false, _tamperOn=false, _tamperIdx=-1;
  var elPhrase=document.getElementById('soPhrase'), elStack=document.getElementById('soStack'),
      elStatus=document.getElementById('soStatus');
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setStatus(ok, msg){ elStatus.className='so-status '+(ok?'valid':'invalid'); elStatus.querySelector('.msg').textContent=msg; }
  function escapeHtml(s){ return String(s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  function hexCount(){ return state.len*11/6; }          // 22 — the reading's own count
  function cardNeed(){ return state.len/3*32; }          // 128 entropy bits
  // How many hexagrams the visitor casts FREELY. The 22nd belongs to the seal
  // (2 free lines + 4 checksum lines — chapters IV–V).
  function castFree(){ return state.len===12 ? hexCount()-1 : hexCount(); }

  // Casts REQUIRE crypto.getRandomValues — no Math.random fallback. This page
  // derives real keys from what it casts; a browser too old to have Web Crypto
  // gets a plain refusal (see init) rather than silently predictable entropy.
  var CRYPTO_OK = !!(window.crypto && window.crypto.getRandomValues);
  function hexRand(){ var u=new Uint8Array(1); window.crypto.getRandomValues(u); return u[0]&63; }   // one hexagram = 6 bits
  function bitRand(){ var u=new Uint8Array(1); window.crypto.getRandomValues(u); return u[0]&1; }    // one line = 1 bit

  // The bits laid down so far (cast surface), and the committed bits (sealed).
  function castBits(){ return _hexVals.map(function(v){ return bits(v,6); }).join(''); }
  function currentWords(){ return elPhrase.value.trim().toLowerCase().split(/\s+/).filter(Boolean); }

  // ══ Gating — the chapters and their unlock tiers ══
  var CHAPTERS=[
    { id:'threshold', label:'Threshold',      lvl:0 },
    { id:'firstline', label:'One line',       lvl:1 },
    { id:'mnemonic',  label:'The cast',       lvl:2 },
    { id:'weave',     label:'The weave',      lvl:3 },
    { id:'seal',      label:'The seal',       lvl:3 },
    { id:'suitseal',  label:'The suit',       lvl:3 },
    { id:'proof',     label:'The proof',      lvl:4 },
    { id:'underhood', label:'Under the hood', lvl:4 },
    { id:'learn',     label:'By hand',        lvl:4 }
  ];
  // Chapter unlock tier (0..4). Persistence lives in js/seedoracle-store.js;
  // this file never touches localStorage directly (search for `localStorage` —
  // it should have zero hits after all the extractions land).
  var _unlock = window.SeedStore ? window.SeedStore.getUnlock() : 0;

  function chapterEl(c){ return document.getElementById(c.id); }
  function announce(msg){ var a=document.getElementById('soAnnounce'); if(a) a.textContent=msg; }

  function applyGates(openNew){
    CHAPTERS.forEach(function(c){
      if(c.lvl===0) return;                          // the threshold is never gated
      var sec=chapterEl(c); if(!sec) return;
      var locked = c.lvl>_unlock;
      var btn=sec.querySelector(':scope > .section-toggle');
      var body=sec.querySelector('.section-bodymin');
      sec.classList.toggle('so-locked', locked);
      if(btn) btn.disabled=locked;
      if(body) body.inert=locked;
      if(locked){
        sec.classList.remove('section-open');
        if(btn) btn.setAttribute('aria-expanded','false');
      } else if(openNew && openNew.indexOf(c.id)>-1 && !sec.classList.contains('section-start-closed')){
        sec.classList.add('section-open');
        if(btn) btn.setAttribute('aria-expanded','true');
      }
    });
    renderRail();
  }
  function raiseUnlock(n, msg){
    if(n<=_unlock) return;
    var fresh=CHAPTERS.filter(function(c){ return c.lvl>_unlock && c.lvl<=n; }).map(function(c){ return c.id; });
    _unlock=n;
    if (window.SeedStore) window.SeedStore.setUnlock(n);
    applyGates(fresh);
    if(msg) announce(msg);
  }
  function scrollToChapter(id){
    var sec=document.getElementById(id); if(!sec) return;
    if(!sec.classList.contains('section-open') && sec.querySelector(':scope > .section-toggle') && !sec.classList.contains('so-locked')){
      window.toggleSection && window.toggleSection(id);
    }
    sec.scrollIntoView({ behavior: RM?'auto':'smooth', block:'start' });
  }
  function renderRail(){
    var rail=document.getElementById('soRail'); if(!rail) return;
    rail.innerHTML=CHAPTERS.map(function(c,i){
      var locked=c.lvl>_unlock;
      return (i?'<span class="so-rail-sep" aria-hidden="true">·</span>':'')+
        '<button type="button" class="so-rail-item" data-ch="'+c.id+'"'+(locked?' disabled':'')+
        ' aria-label="'+c.label+(locked?' — locked':'')+'">'+c.label+'</button>';
    }).join('');
  }
  document.getElementById('soRail').addEventListener('click', function(e){
    var b=e.target.closest('.so-rail-item'); if(!b||b.disabled) return;
    scrollToChapter(b.getAttribute('data-ch'));
  });

  // ══ Chapter I — one line, one coin ══
  var elLineFig=document.getElementById('soLineFig'), elLineBits=document.getElementById('soLineBits'),
      elLineStat=document.getElementById('soLineStat'), elLineDone=document.getElementById('soLineDone'),
      elLineCast=document.getElementById('soLineCast');

  function renderLine(){
    var spec=[];
    for(var i=0;i<6;i++) spec.push({ bit:(i<_lineBits.length?_lineBits[i]:null), cls:'' });
    elLineFig.innerHTML=slotHexSVG(spec, 2);
    elLineBits.innerHTML=Array.apply(null,Array(6)).map(function(_,i){
      var has=i<_lineBits.length;
      return '<span class="so-line-bit'+(has?'':' is-empty')+'">'+(has?_lineBits[i]:'0')+'</span>';
    }).join('');
    if(_lineBits.length===0){ elLineStat.textContent='no lines yet — six to throw'; }
    else if(_lineBits.length<6){
      var last=_lineBits[_lineBits.length-1];
      elLineStat.textContent='line '+_lineBits.length+' of 6 — '+(last?'solid yang · 1':'broken yin · 0');
    }
    var done=_lineBits.length>=6;
    elLineCast.disabled = done || !CRYPTO_OK;
    elLineDone.hidden = !done;
    if(done){
      var val=parseInt(_lineBits.join(''),2), kw=VAL_TO_KW[val], d=JD[kw]||{};
      elLineStat.textContent='six lines — a hexagram';
      document.getElementById('soLineDoneText').innerHTML=
        'Your six throws, read bottom-up, are <span class="so-mono">'+_lineBits.join('')+'</span> — the number '+val+
        ' — and the figure <strong>'+escapeHtml(d.name||'')+'</strong>, hexagram '+kw+' of the King Wen sequence. '+
        'One event, three scripts. It stands first in your reading.';
    }
  }
  elLineCast.addEventListener('click', function(){
    if(_lineBits.length>=6) return;
    _lineBits.push(bitRand());
    if(_lineBits.length>=6){
      var val=parseInt(_lineBits.join(''),2);
      _hexVals[0]=val;
      renderAll();
      raiseUnlock(2, 'Chapter unlocked — the cast of twenty-one');
    }
    renderLine();
  });
  document.getElementById('soLineRead').addEventListener('click', function(){
    if(_lineBits.length>=6) openHexPopup(parseInt(_lineBits.join(''),2));
  });
  document.getElementById('soLineNext').addEventListener('click', function(){ scrollToChapter('mnemonic'); });

  // ══ Chapter II — the cast of twenty-one (stack of 22 slots) ══
  var elHexStat=document.getElementById('soHexStat');

  function renderHexStat(){
    var free=castFree(), n=Math.min(_hexVals.length, free);
    if(_sealed){ elHexStat.textContent=hexCount()+' / '+hexCount()+' hexagrams · sealed — the reading coheres'; return; }
    if(state.len===12 && n>=free){ elHexStat.textContent='twenty-one cast · 126 lines · the twenty-second waits for the seal ↓'; return; }
    elHexStat.textContent='hexagram '+n+' of '+hexCount()+' · line '+(n*6)+' of '+(state.len*11);
    if(n===0 && _lineBits.length>0 && _lineBits.length<6) elHexStat.textContent='finishing hexagram 1 above — line '+_lineBits.length+' of 6';
  }

  function renderStack(){
    var N=hexCount(), free=castFree(), out='';
    for(var i=0;i<N;i++){
      var isSealSlot = (state.len===12 && i===N-1 && !_sealed);
      var cast = _sealed ? (i<state.vals.length) : (i<_hexVals.length && i<free);
      var v = _sealed ? state.vals[i] : _hexVals[i];
      var inner, cls='so-hex', attrs='';
      if(cast){
        var kw=VAL_TO_KW[v], d=JD[kw]||{};
        inner=hexagramSVG(v,0.72)+'<div class="so-hex-kw">'+kw+'</div>';
        if(_sealed && i===N-1 && state.len===12) cls+=' is-sealed';
        var lbl=_sealed
          ? 'Hexagram '+(i+1)+' of '+N+': '+(d.name||'')+', King Wen '+kw+'. Opens its judgment.'
          : 'Hexagram '+(i+1)+', '+(d.name||'')+', King Wen '+kw+'. Re-casts on click.';
        attrs=' role="button" tabindex="0" data-i="'+i+'" data-hex="'+i+'" aria-label="'+lbl+'"';
      } else if(isSealSlot){
        var ready=_hexVals.length>=free;
        cls+=' is-seal-slot'+(ready?' is-ready':'');
        inner=slotHexSVG([{bit:null,cls:'free'},{bit:null,cls:'free'},{bit:null,cls:'cs'},{bit:null,cls:'cs'},{bit:null,cls:'cs'},{bit:null,cls:'cs'}],0.72)+
              '<div class="so-hex-kw">seal</div>';
        attrs=ready
          ? ' role="button" tabindex="0" data-act="to-seal" aria-label="The twenty-second hexagram — the seal. Opens chapter four."'
          : ' aria-label="The twenty-second hexagram — the seal. Cast the first twenty-one to reach it." title="the seal — cast the first twenty-one"';
      } else {
        cls+=' is-slot';
        inner='';
        attrs=' aria-hidden="true"';
      }
      out+='<div class="so-cell"><div class="so-ord">'+(i+1)+'</div><div class="'+cls+'"'+attrs+'>'+inner+'</div></div>';
    }
    elStack.innerHTML=out;
  }

  function stackActivate(el){
    if(el.getAttribute('data-act')==='to-seal'){ scrollToChapter('seal'); return; }
    var i=+el.getAttribute('data-i');
    if(isNaN(i)) return;
    if(_sealed){ openHexPopup(state.vals[i]); return; }
    _hexVals[i]=hexRand();                      // re-throw just this hexagram
    renderAll();
  }
  elStack.addEventListener('click', function(e){
    var el=e.target.closest('.so-hex[role="button"]'); if(el) stackActivate(el);
  });
  elStack.addEventListener('keydown', function(e){
    if(e.key!=='Enter' && e.key!==' ') return;
    var el=e.target.closest('.so-hex[role="button"]'); if(!el) return;
    e.preventDefault(); stackActivate(el);
  });

  function hexCastOne(){
    if(_sealed || _hexVals.length>=castFree()) return;
    _hexVals.push(hexRand());
    afterCastProgress();
  }
  function hexCastAll(){
    if(_sealed) return;
    while(_hexVals.length<castFree()) _hexVals.push(hexRand());
    afterCastProgress();
  }
  function afterCastProgress(){
    renderAll();
    if(_hexVals.length>=castFree()){
      raiseUnlock(3, 'Chapters unlocked — the weave, the seal, and the suit');
    }
  }
  document.getElementById('soHexOne').addEventListener('click', hexCastOne);
  document.getElementById('soHexAll').addEventListener('click', hexCastAll);

  // ══ Chapter III — the weave (live ribbon, partial while casting) ══
  function tamperView(bstr){
    // returns { bits, req, claim, ok } for the CURRENT display bits with the
    // tampered cell flipped — display-only, never touches the state.
    var ENT=cardNeed();
    var b=bstr.split(''); b[_tamperIdx]=(b[_tamperIdx]==='1'?'0':'1'); b=b.join('');
    var entBits=b.slice(0,ENT), claim=b.slice(ENT), bytes=[];
    for(var i=0;i<ENT;i+=8) bytes.push(parseInt(entBits.slice(i,i+8),2));
    var req=bits(sha256Bytes(new Uint8Array(bytes))[0],8).slice(0,claim.length);
    return { bits:b, req:req, claim:claim, ok:req===claim };
  }
  function renderWeave(){
    var box=document.getElementById('soRibbon'); if(!box) return;
    var total=state.len*11, ENT=cardNeed(), isTwelve=state.len===12;
    var have = _sealed ? phraseToBits(currentWords()) : castBits().slice(0, castFree()*6);
    var tampered=null;
    if(_sealed && _tamperOn && _tamperIdx>=0){ tampered=tamperView(have); have=tampered.bits; }
    var html='';
    for(var w=0; w<total/11; w++){
      var cells='', complete=true;
      for(var i=0;i<11;i++){
        var idx=w*11+i;
        var hexIdx=Math.floor(idx/6);
        var isCS=idx>=ENT;
        var isFree=isTwelve && (idx===ENT-2 || idx===ENT-1);
        var has=idx<have.length;
        if(!has) complete=false;
        var cls='so-bit'+(hexIdx%2?' alt':'')+(isCS?' is-cs':'')+(isFree?' is-free':'')+(has?'':' is-empty');
        if(tampered && idx===_tamperIdx) cls+=' is-flip';
        if(tampered && isCS && tampered.req[idx-ENT]!==tampered.claim[idx-ENT]) cls+=' is-bad';
        cells+='<span class="'+cls+'" data-idx="'+idx+'" data-hex="'+hexIdx+'" title="hexagram '+(hexIdx+1)+', line '+((idx%6)+1)+(isCS?' · checksum':isFree?' · your suit':'')+'">'+(has?have[idx]:'')+'</span>';
      }
      var label;
      if(complete){ label=(w+1)+' · '+WL[parseInt(have.slice(w*11,w*11+11),2)]; }
      else if(have.length>w*11){ label='<span class="is-starving">'+(w+1)+' · starving — '+(11-(have.length-w*11))+' short</span>'; }
      else { label=(w+1)+' · —'; }
      html+='<span class="so-word-group"><span class="so-word-label">'+label+'</span><span class="so-bit-row">'+cells+'</span></span>';
    }
    html+='<p class="so-note so-ribbon-key">'+
      (isTwelve
        ? 'Each band of shading is one hexagram. The <span class="so-key-free">gold-edged cells</span> are the two free lines you seal with a suit; the <span class="so-key-cs">amber tail</span> is the checksum'+(_sealed?'.':' — both still waiting.')
        : 'Each band of shading is one hexagram. The <span class="so-key-cs">amber tail</span> is the checksum — at this length it claims the final hexagram whole, so there is no element seal.')+
      '</p>';
    box.innerHTML=html;
    box.classList.toggle('is-tamper', _sealed && _tamperOn);
  }

  // ribbon ↔ stack linkage: hovering/focusing one lights the other
  function litHex(n, on){
    document.querySelectorAll('#soRibbon .so-bit[data-hex="'+n+'"]').forEach(function(c){ c.classList.toggle('is-lit', on); });
    var t=document.querySelector('#soStack .so-hex[data-hex="'+n+'"]'); if(t) t.classList.toggle('is-lit', on);
  }
  (function(){
    var ribbon=document.getElementById('soRibbon');
    function from(e){ var c=e.target.closest('[data-hex]'); return c ? +c.getAttribute('data-hex') : -1; }
    [['mouseover',true],['mouseout',false],['focusin',true],['focusout',false]].forEach(function(p){
      ribbon.addEventListener(p[0], function(e){ var n=from(e); if(n>=0) litHex(n,p[1]); });
      elStack.addEventListener(p[0], function(e){ var n=from(e); if(n>=0) litHex(n,p[1]); });
    });
    // the tamper toy: in test mode, tapping a cell flips it (display-only)
    ribbon.addEventListener('click', function(e){
      if(!(_sealed && _tamperOn)) return;
      var c=e.target.closest('.so-bit'); if(!c || c.classList.contains('is-empty')) return;
      var idx=+c.getAttribute('data-idx');
      _tamperIdx = (_tamperIdx===idx ? -1 : idx);
      renderWeave(); renderTamperOut();
    });
  })();

  // ══ Chapter IV — the seal ══
  function renderSealFig(){
    var box=document.getElementById('soSealFig'), cap=document.getElementById('soSealFigCap');
    if(!box) return;
    if(_sealed && state.len===12){
      var v=state.vals[state.vals.length-1], kw=VAL_TO_KW[v], d=JD[kw]||{};
      var spec=[];
      for(var i=0;i<6;i++) spec.push({ bit:(v>>(5-i))&1, cls:(i<2?'free':'cs') });
      box.innerHTML=slotHexSVG(spec, 2);
      cap.innerHTML='Your final hexagram — <strong>'+escapeHtml(d.name||'')+'</strong>, King Wen '+kw+'. The '+
        '<span class="so-key-free">two gold lines</span> are yours ('+SUITS[suitOf(v)].name+'); the '+
        '<span class="so-key-cs">four amber</span> are the mathematics’ — the first four bits of SHA-256 over everything you cast.';
    } else {
      box.innerHTML=slotHexSVG([{bit:null,cls:'free'},{bit:null,cls:'free'},{bit:null,cls:'cs'},{bit:null,cls:'cs'},{bit:null,cls:'cs'},{bit:null,cls:'cs'}], 2);
      cap.innerHTML='The twenty-second hexagram: its <span class="so-key-cs">top four lines</span> are the seal — the mathematics’ hand. Its <span class="so-key-free">bottom two</span> are the last free lines. They are covered next.';
    }
  }
  function updateTamperVis(){
    var wrap=document.getElementById('soTamperWrap');
    if(wrap) wrap.hidden = !(_sealed && state.len===12);
    if(!_sealed){ _tamperOn=false; _tamperIdx=-1; var b=document.getElementById('soTamper'); if(b) b.setAttribute('aria-pressed','false'); }
  }
  function renderTamperOut(){
    var out=document.getElementById('soTamperOut'); if(!out) return;
    if(!(_sealed && _tamperOn)){ out.textContent=''; return; }
    if(_tamperIdx<0){ out.textContent='the true cast — valid · tap any cell to flip one line'; return; }
    var t=tamperView(phraseToBits(currentWords()));
    out.textContent = t.ok
      ? 'still coheres — you flipped a checksum-and-entropy pair that happens to agree (rare — 1 in 16)'
      : 'does not cohere — the seal demands '+t.req+' but the reading claims '+t.claim;
  }
  document.getElementById('soTamper').addEventListener('click', function(){
    if(!_sealed) return;
    _tamperOn=!_tamperOn; _tamperIdx=-1;
    this.setAttribute('aria-pressed', _tamperOn?'true':'false');
    this.textContent=_tamperOn?'Leave the test — restore the true cast':'Test the seal — flip a line';
    renderWeave(); renderTamperOut();
  });

  // ── final-word (checksum) calculator — the seal chapter's word-tongue twin ──
  // The last word of a BIP39 12-word seed is partly free entropy, partly
  // checksum, so only 128 of the 2048 words validly complete any given
  // 11-word prefix (7 free + 4 checksum bits).
  function finalWords(prefix){
    var n = prefix.length + 1;
    if (n !== 12) return { error: 'Enter exactly ' + (state.len-1) + ' words (all but the final one) — for a ' + state.len + '-word seed.' };
    var bad = prefix.filter(function(w){ return !(w in IDX); });
    if (bad.length) return { error: 'Not in the BIP39 word list: ' + bad.slice(0,4).join(', ') + (bad.length>4?'…':'') };
    var pbits = prefix.map(function(w){ return bits(IDX[w],11); }).join('');
    var ENT = n*11*32/33, CS = ENT/32, kFree = ENT - pbits.length;
    var out = [];
    for (var x=0; x < (1<<kFree); x++){
      var entBits = pbits + bits(x, kFree), bytes = [];
      for (var i=0; i<ENT; i+=8) bytes.push(parseInt(entBits.slice(i, i+8), 2));
      var h = sha256Bytes(new Uint8Array(bytes));
      out.push(WL[parseInt(bits(x, kFree) + bits(h[0],8).slice(0, CS), 2)]);
    }
    return { words: out };
  }
  var elFwIn=document.getElementById('soFwIn'), elFwOut=document.getElementById('soFwOut'), elFwN=document.getElementById('soFwN');
  function seedFinalWordDemo(){            // prefill the demo with the current cast's first n-1 words
    if(!elFwIn) return;
    var ws=elPhrase.value.trim().split(/\s+/).filter(Boolean);
    if(ws.length>=2){ elFwIn.value=ws.slice(0, ws.length-1).join(' '); elFwN.textContent=(ws.length-1); }
    elFwOut.innerHTML='';
  }
  function runFinalWords(){
    var prefix=elFwIn.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    var r=finalWords(prefix);
    if(r.error){ elFwOut.innerHTML='<p class="so-fw-count warn">'+r.error+'</p>'; return; }
    var chips=r.words.map(function(w){ return '<button type="button" class="so-fw-chip">'+w+'</button>'; }).join('');
    elFwOut.innerHTML='<p class="so-fw-count">'+r.words.length+' words complete this into a valid '+(prefix.length+1)+'-word seed — choose one:</p>'+
      '<div class="so-fw-chips">'+chips+'</div>';
  }
  if(elFwIn){
    document.getElementById('soFwGo').addEventListener('click', runFinalWords);
    elFwOut.addEventListener('click', function(e){
      var chip=e.target.closest('.so-fw-chip'); if(!chip) return;
      var prefix=elFwIn.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      elPhrase.value=prefix.concat(chip.textContent).join(' ');
      state.focus=0; syncFromPhrase(); seedFinalWordDemo();
      elPhrase.scrollIntoView({ behavior:RM?'auto':'smooth', block:'center' });
    });
  }

  // ── final-hexagram (checksum) calculator — the hexagram-native sibling ──
  // Brute-force all 64 possible last hexagrams; keep those whose full bit-string
  // (prefix + this hexagram) carries a valid BIP39 checksum. Twelve-word
  // reading only.
  function finalHexagrams(prefixVals){
    var totalHex = prefixVals.length + 1, n = totalHex*6/11;
    if (n !== 12) return { error: 'Need the first ' + (state.len*11/6 - 1) + ' hexagrams.' };
    var ENT = n*11*32/33, CS = ENT/32;
    var pbits = prefixVals.map(function(v){ return bits(v,6); }).join('');
    var out = [];
    for (var v=0; v<64; v++){
      var full = pbits + bits(v,6), entBits = full.slice(0,ENT), csBits = full.slice(ENT), bytes = [];
      for (var i=0; i<ENT; i+=8) bytes.push(parseInt(entBits.slice(i,i+8),2));
      var h = sha256Bytes(new Uint8Array(bytes));
      if (bits(h[0],8).slice(0,CS) === csBits) out.push(v);
    }
    return { vals: out };
  }

  // ══ Chapter V — the suit seal (the climax) ══
  var elFhOut=document.getElementById('soFhOut');
  function suitLinesHTML(v){
    // the two lines this seal sets, drawn as the hexagram will carry them:
    // line 2 above line 1 (bottom). yang = one bar, yin = two segments.
    function row(bit){ return '<span class="so-sl-row">'+(bit?'<i class="so-sl-yang"></i>':'<i class="so-sl-yin"></i><i class="so-sl-yin"></i>')+'</span>'; }
    var bottom=(v>>5)&1, second=(v>>4)&1;
    return '<span class="so-suit-lines" aria-hidden="true">'+row(second)+row(bottom)+'</span>';
  }
  function renderSuitSeals(){
    if(!elFhOut) return;
    if(state.len!==12){
      elFhOut.innerHTML='<p class="so-fw-count">At this length the seal claims the final hexagram whole — the oracle casts and seals all forty-four itself. No suit to choose; switch back to 12 · 22 for the choice.</p>';
      document.getElementById('soOracle').hidden=true;
      return;
    }
    document.getElementById('soOracle').hidden=false;
    if(_hexVals.length<castFree()){
      elFhOut.innerHTML='<p class="so-fw-count">Cast the first twenty-one hexagrams (chapter II) and the four seals appear here.</p>';
      return;
    }
    var r=finalHexagrams(_hexVals.slice(0,castFree()));
    if(r.error || !r.vals || r.vals.length!==4){
      elFhOut.innerHTML='<p class="so-fw-count warn">'+(r.error||'The cast does not resolve to four seals — re-cast and try again.')+'</p>';
      return;
    }
    var cur=_sealed ? state.vals[state.vals.length-1] : null;
    var vals=r.vals.slice().sort(function(a,b){ return SUIT_ORDER.indexOf(suitOf(a)) - SUIT_ORDER.indexOf(suitOf(b)); });
    var opts=vals.map(function(v){
      var kw=VAL_TO_KW[v], d=JD[kw]||{}, key=suitOf(v), s=SUITS[key];
      return '<button type="button" class="so-hex so-fh-opt '+s.cls+(v===cur?' is-cur':'')+'" data-v="'+v+'" '+
        'aria-label="Seal with '+s.name+' — '+(d.name||'')+', hexagram '+kw+(v===cur?', your chosen seal':'')+'">'+
        '<div class="so-suit">'+suitLinesHTML(v)+'<span class="so-suit-pip">'+suitPip(s.sym)+'</span><span class="so-suit-name">'+s.name+'</span></div>'+
        hexagramSVG(v,1.25)+'<div class="so-hex-name">'+(d.name||'—')+'</div>'+
        '<div class="so-hex-kw">'+kw+'</div></button>';
    }).join('');
    elFhOut.innerHTML='<div class="so-fh-opts">'+opts+'</div>';
  }
  if(elFhOut){
    elFhOut.addEventListener('click', function(e){
      var b=e.target.closest('.so-fh-opt'); if(!b) return;
      sealWith(+b.getAttribute('data-v'));
    });
  }
  document.getElementById('soOracle').addEventListener('click', function(){
    if(state.len!==12 || _hexVals.length<castFree()) return;
    var r=finalHexagrams(_hexVals.slice(0,castFree()));
    if(!r.vals || r.vals.length!==4) return;
    var toss=hexRand()&3;   // the oracle throws the two free lines
    var pick=r.vals.filter(function(v){ return ((v>>4)&3)===toss; })[0];
    if(pick!=null) sealWith(pick, true);
  });

  function sealWith(v, byOracle){
    state.vals=_hexVals.slice(0,castFree()).concat(v);
    _sealed=true;
    syncFromVals();
    raiseUnlock(4, 'Sealed — the reading coheres. The proof and the machinery are open.');
    // the payoff cascade: 22nd hexagram assembles → seal cells fill → twelfth
    // word resolves → the phrase breathes in (pure CSS, skipped under reduced motion)
    if(!RM){
      document.body.classList.add('so-just-sealed');
      setTimeout(function(){ document.body.classList.remove('so-just-sealed'); }, 1600);
    }
    announce(byOracle
      ? 'The oracle threw '+SUITS[suitOf(v)].name+' — the reading is sealed.'
      : 'Sealed with '+SUITS[suitOf(v)].name+' — the reading coheres.');
    elPhrase.scrollIntoView({ behavior:RM?'auto':'smooth', block:'center' });
  }

  // (commitOracle + hexBitsToSeed retired 2026-07-08 alongside the
  // 24-word path — the twelve-word reading always leaves the seal to
  // sealWith() via the suit chooser.)

  // ══ Sync (words ↔ hexagrams) ══
  function syncFromVals(){          // hexagrams → words (reverse direction)
    var words=valsToWords(state.vals);
    elPhrase.value=words.join(' ');
    var r=checkPhrase(words);
    setStatus(r.ok, r.ok?'Valid checksum — a coherent reading':'Lines do not yet cohere (checksum) — keep adjusting');
    refreshDisplays(r);
  }
  function syncFromPhrase(){        // words → hexagrams (forward direction)
    var words=currentWords();
    var r=checkPhrase(words);
    if(words.length===12 && !words.some(function(w){return !(w in IDX);})){
      state.len=words.length; state.vals=phraseToVals(words); syncLenButtons();
      // sync the cast surface to the phrase either way: a VALID phrase is a
      // sealed reading (open the journey); an invalid one becomes a cast in
      // progress — the suit chooser then offers the seals that would repair it.
      _hexVals=state.vals.slice(0, castFree());
      _lineBits=state.vals.length ? bits(state.vals[0],6).split('').map(Number) : [];
      _sealed=r.ok;
      if(r.ok) raiseUnlock(4, 'A coherent reading — every chapter is open.');
    } else if(words.length){ _sealed=false; }
    setStatus(r.ok, r.ok?'Valid checksum — a coherent reading':('Invalid: '+r.reason));
    refreshDisplays(r);
  }
  function refreshDisplays(r){
    renderLine(); renderStack(); renderHexStat(); renderWeave(); renderSealFig(); renderSuitSeals();
    updateTamperVis(); renderTamperOut(); renderEntropy(); renderAddresses();
    if(r && r.ok){ deriveSeed(elPhrase.value.trim()); seedFinalWordDemo(); }
    else document.getElementById('soSeed').textContent='—';
  }
  function renderAll(){ renderStack(); renderHexStat(); renderWeave(); renderSealFig(); renderSuitSeals(); updateTamperVis(); }

  // ══ Chapter VI — the proof ══
  // The bits under the words: raw entropy (hex + binary) and the checksum,
  // split so entropy + checksum = words × 11. Mirrors iancoleman's entropy view.
  function renderEntropy(){
    var box=document.getElementById('soEntOut'); if(!box) return;
    var words=currentWords();
    var r=checkPhrase(words);
    if(!(r.ok && r.entBytes)){ box.innerHTML='<p class="so-note">Seal a reading above to see its entropy.</p>'; return; }
    var eb=r.entBytes, hex=''; for(var i=0;i<eb.length;i++) hex+=('0'+eb[i].toString(16)).slice(-2);
    var all=phraseToBits(words), entLen=eb.length*8, entBin=all.slice(0,entLen), csBin=all.slice(entLen);
    function grp(s,n){ return s.replace(new RegExp('(.{'+n+'})','g'),'$1 ').trim(); }
    var geo=''; // geomancy row retired 2026-07-08 — see dev/retired/geomancy/
    box.innerHTML=
      '<div class="so-ent-row"><span class="so-ent-k">Entropy · hex</span><span class="so-ent-v">'+hex+'</span></div>'+
      '<div class="so-ent-row"><span class="so-ent-k">Entropy · '+entLen+' bits</span><span class="so-ent-v">'+grp(entBin,8)+'</span></div>'+
      '<div class="so-ent-row"><span class="so-ent-k">Checksum · '+csBin.length+' bits</span><span class="so-ent-v so-ent-cs">'+csBin+'</span></div>'+
      '<p class="so-note" style="margin-top:var(--space-2)">'+entLen+' entropy + '+csBin.length+' checksum = '+(entLen+csBin.length)+' bits = '+words.length+' words × 11. The checksum is the leading '+csBin.length+' bits of SHA-256(entropy).</p>'+
      geo;
  }

  // The SHA instrument — hash any hex bytes; highlight the first CS bits so the
  // seal can be checked by hand against the final hexagram's amber lines.
  (function(){
    var inp=document.getElementById('soShaIn'), err=document.getElementById('soShaErr'),
        out=document.getElementById('soShaOut');
    if(!inp) return;
    function entropyHex(){
      var r=checkPhrase(currentWords());
      if(!(r.ok&&r.entBytes)) return '';
      var h=''; for(var i=0;i<r.entBytes.length;i++) h+=('0'+r.entBytes[i].toString(16)).slice(-2);
      return h;
    }
    document.getElementById('soShaFrom').addEventListener('click', function(){
      var h=entropyHex();
      if(h){ inp.value=h; err.textContent=''; } else err.textContent='seal a reading first — then its entropy lands here';
    });
    document.getElementById('soShaGo').addEventListener('click', function(){
      var v=inp.value.trim().toLowerCase().replace(/\s+/g,'');
      if(!v || !/^[0-9a-f]+$/.test(v) || v.length%2){ err.textContent='hex bytes only — an even count of 0-9 a-f'; out.hidden=true; return; }
      err.textContent='';
      var bytes=new Uint8Array(v.length/2);
      for(var i=0;i<v.length;i+=2) bytes[i/2]=parseInt(v.slice(i,i+2),16);
      var h=sha256Bytes(bytes), hex='';
      for(i=0;i<h.length;i++) hex+=('0'+h[i].toString(16)).slice(-2);
      var cs=state.len/3;   // 4 seal bits for the twelve-word reading
      var b8=bits(h[0],8);
      document.getElementById('soShaHex').textContent=hex;
      document.getElementById('soShaBits').innerHTML='<span class="so-sha-hl">'+b8.slice(0,cs)+'</span>'+b8.slice(cs);
      var match=document.getElementById('soShaMatch');
      if(_sealed && v===entropyHex()){
        match.innerHTML='And <span class="so-sha-hl">'+b8.slice(0,cs)+'</span> is exactly your seal — the top four lines of hexagram twenty-two. You made both halves of that match.';
      } else {
        match.textContent='The highlighted bits are the seal any 128-bit entropy demands of its final lines.';
      }
      out.hidden=false;
    });
  })();

  // ══ Chapter VII — under the hood: derived addresses (lazy) ══
  // Progressive: show the first receiving address; "See more" lists the first 10
  // (index + truncated address); selecting one loads its full keys into the detail
  // panel. The 64-byte seed is PBKDF2'd once and cached, so the 10 children are
  // cheap to derive and re-derive.
  var _addrToken = 0;
  var _addr = { key:'', buf:null, sel:0, shown:false, off:0 };   // key = phrase|scheme; off = list start index
  var ADDR_COUNT = 10;
  var ADDR_MAX = 2147483647 - ADDR_COUNT;   // BIP32 non-hardened index ceiling
  function addrRow(k,v){ return '<div class="so-addr-row"><span class="so-addr-k">'+k+'</span><span class="so-addr-v">'+v+'</span></div>'; }
  function addrTrunc(s){ return s.length > 30 ? s.slice(0,16)+'…'+s.slice(-8) : s; }
  function addrDetailHTML(a, idx){
    return '<p class="so-note">Receiving address #'+idx+' · '+a.label+' — <code>'+a.path+'</code>. The private key is shown in full; this is a toy, never fund it.</p>'+
      addrRow('Address', a.address)+addrRow('Public key', a.pubkey)+addrRow('Private key (WIF)', a.wif);
  }
  function paintAddr(box){
    if(!_addr.buf) return;
    var scheme=(document.getElementById('soAddrType')||{}).value || 'bip84';
    var a=window.BTC.derive(scheme, _addr.buf, 0, _addr.sel);
    var html=addrDetailHTML(a, _addr.sel);
    html+='<button type="button" class="so-addr-more" data-act="'+(_addr.shown?'less':'more')+'">'+
          (_addr.shown?'Show less ↑':'See more addresses ↓')+'</button>';
    if(_addr.shown){
      var off=_addr.off, rows='';
      for(var i=off;i<off+ADDR_COUNT;i++){
        var ai=window.BTC.derive(scheme, _addr.buf, 0, i);
        rows+='<button type="button" class="so-addr-item'+(i===_addr.sel?' is-sel':'')+'" data-i="'+i+'" aria-pressed="'+(i===_addr.sel?'true':'false')+'">'+
          '<span class="so-addr-idx">'+i+'</span><span class="so-addr-mono">'+addrTrunc(ai.address)+'</span></button>';
      }
      html+='<div class="so-addr-listhead">Receiving addresses — select one to load its keys</div>'+
            '<div class="so-addr-list">'+rows+'</div>'+
            '<div class="so-addr-nav">'+
              '<button type="button" class="so-addr-pg" data-d="-10" aria-label="Previous 10"'+(off<=0?' disabled':'')+'>‹ 10</button>'+
              '<span class="so-addr-range">#'+off+'–#'+(off+ADDR_COUNT-1)+'</span>'+
              '<button type="button" class="so-addr-pg" data-d="10" aria-label="Next 10"'+(off>=ADDR_MAX?' disabled':'')+'>10 ›</button>'+
              '<label class="so-addr-jump">go to #<input type="number" id="soAddrJump" min="0" max="'+ADDR_MAX+'" value="'+off+'" inputmode="numeric" aria-label="Jump to address index"></label>'+
            '</div>';
    }
    box.innerHTML=html;
  }
  function renderAddresses(){
    var det=document.getElementById('soAddrFold'), box=document.getElementById('soAddrOut');
    if(!det || !box || !det.open) return;            // derive only when expanded
    var words=currentWords();
    if(!checkPhrase(words).ok){ box.innerHTML='<p class="so-note">Seal or paste a valid seed to derive its addresses.</p>'; return; }
    if(!window.BTC){ box.innerHTML='<p class="so-note">Derivation module not loaded.</p>'; return; }
    if(!(window.crypto && crypto.subtle)){ box.innerHTML='<p class="so-note">Address derivation needs a secure context (https or localhost).</p>'; return; }
    var scheme=(document.getElementById('soAddrType')||{}).value || 'bip84';
    var phrase=words.join(' '), key=phrase+'|'+scheme;
    if(_addr.key!==key){ _addr.key=key; _addr.sel=0; _addr.shown=false; _addr.buf=null; _addr.off=0; }   // reset on phrase/type change
    if(_addr.buf){ paintAddr(box); return; }                                                  // seed cached → repaint sync
    box.innerHTML='<p class="so-note">Deriving…</p>';
    var token=++_addrToken, enc=new TextEncoder();
    crypto.subtle.importKey('raw', enc.encode(phrase.normalize('NFKD')), {name:'PBKDF2'}, false, ['deriveBits'])
      .then(function(k){ return crypto.subtle.deriveBits({name:'PBKDF2', salt:enc.encode('mnemonic'), iterations:2048, hash:'SHA-512'}, k, 512); })
      .then(function(buf){ if(token!==_addrToken) return; _addr.buf=new Uint8Array(buf); paintAddr(box); })
      .catch(function(){ box.innerHTML='<p class="so-note">Couldn’t derive addresses here.</p>'; });
  }
  (function(){
    var det=document.getElementById('soAddrFold'); if(det) det.addEventListener('toggle', function(){ if(det.open) renderAddresses(); });
    var sel=document.getElementById('soAddrType'); if(sel) sel.addEventListener('change', renderAddresses);
    var box=document.getElementById('soAddrOut');
    function clampOff(n){ return Math.max(0, Math.min(ADDR_MAX, n)); }
    if(box){
      box.addEventListener('click', function(e){
        var act=e.target.closest('[data-act]');
        if(act){ var a=act.getAttribute('data-act'); if(a==='more'){ _addr.shown=true; _addr.off=0; } else { _addr.shown=false; } paintAddr(box); return; }
        var pg=e.target.closest('.so-addr-pg');
        if(pg && !pg.disabled){ _addr.off=clampOff(_addr.off + (+pg.getAttribute('data-d'))); paintAddr(box); return; }
        var item=e.target.closest('.so-addr-item');
        if(item){ _addr.sel=+item.getAttribute('data-i'); paintAddr(box); }
      });
      box.addEventListener('change', function(e){
        var jump=e.target.closest('#soAddrJump'); if(!jump) return;
        var n=parseInt(jump.value,10); if(isNaN(n)) n=0;
        n=clampOff(n); _addr.off=n; _addr.sel=n; paintAddr(box);
      });
    }
  })();

  // ══ hexagram detail popup (shared chrome; shows the judgment) ══
  var _hxLast=null;
  function openHexPopup(val){
    var kw=VAL_TO_KW[val], d=JD[kw]||{};
    document.getElementById('hxFig').innerHTML=hexagramSVG(val,1.75);
    document.getElementById('hxFigNum').textContent=val+' · '+bits(val,6);
    document.getElementById('hxKw').textContent='King Wen '+kw;
    document.getElementById('hxName').innerHTML=escapeHtml(d.name||'')+(d.pinyin?' <span class="hx-pin">'+escapeHtml(d.pinyin)+'</span>':'');
    document.getElementById('hxTrig').textContent=d.trig||'';
    document.getElementById('hxContent').innerHTML='<p class="hx-judgment">'+escapeHtml(d.judgment||'')+'</p>';
    document.getElementById('hxContent').scrollTop=0;
    var ov=document.getElementById('hxOverlay');
    if(!ov.classList.contains('open')){ _hxLast=document.activeElement; ov.classList.add('open'); document.getElementById('hxPopup').focus(); }
  }
  function closeHexPopup(){ document.getElementById('hxOverlay').classList.remove('open'); if(_hxLast&&document.contains(_hxLast))_hxLast.focus(); _hxLast=null; }
  document.getElementById('hxClose').addEventListener('click', closeHexPopup);
  document.getElementById('hxOverlay').addEventListener('click', function(e){ if(e.target===this) closeHexPopup(); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape' && document.getElementById('hxOverlay').classList.contains('open')) closeHexPopup(); });

  // ══ controls ══
  // (Length switcher retired 2026-07-08 — twelve words is the only reading now.
  // syncLenButtons kept as a no-op so the sync-from-phrase path still calls
  // through cleanly; it also lets any future length-toggle drop back in with
  // no other call-site changes.)
  function syncLenButtons(){}
  document.getElementById('soCopy').addEventListener('click', function(){ if(navigator.clipboard) navigator.clipboard.writeText(elPhrase.value); });
  var t; elPhrase.addEventListener('input', function(){ clearTimeout(t); t=setTimeout(syncFromPhrase, 250); });

  // threshold actions
  document.getElementById('soBegin').addEventListener('click', function(){
    raiseUnlock(1, 'Chapter unlocked — one line, one coin');
    scrollToChapter('firstline');
  });
  document.getElementById('soSkip').addEventListener('click', function(){
    raiseUnlock(4, 'Every chapter is open.');
  });
  document.getElementById('soHavePhrase').addEventListener('click', function(){
    raiseUnlock(4, 'Every chapter is open — paste your phrase.');
    scrollToChapter('suitseal');
    setTimeout(function(){ elPhrase.focus(); }, RM?0:450);
  });
  document.getElementById('soCaveatLink').addEventListener('click', function(e){
    e.preventDefault();
    raiseUnlock(4);   // the caution must always be reachable — safety outranks ceremony
    var sec=document.getElementById('learn');
    if(sec && !sec.classList.contains('section-open')) window.toggleSection && window.toggleSection('learn');
    scrollToChapter('learn');
  });

  // ══ init ══
  function init(){
    // deep link / shared state: a #chapter hash opens the journey through there
    var hash=(location.hash||'').replace('#','');
    var target=CHAPTERS.filter(function(c){ return c.id===hash; })[0];
    if(target && target.lvl>_unlock){ _unlock=target.lvl; if(window.SeedStore) window.SeedStore.setUnlock(_unlock); }
    applyGates();
    renderLine(); renderAll();
    if(WL.length!==2048){ setStatus(false,'word list failed to load'); }
    else if(!CRYPTO_OK){
      setStatus(false,'Casting needs secure randomness (crypto.getRandomValues) — please use a current browser');
      ['soLineCast','soHexOne','soHexAll','soOracle'].forEach(function(id){ var b=document.getElementById(id); if(b) b.disabled=true; });
    }
  }
  // Run AFTER site.js's _restoreSections (registered earlier, so it fires first):
  // the gates must win over any saved open/closed section state.
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

// Geomancy (data + row + popup) retired 2026-07-08 — see
// dev/retired/geomancy/ for the module, CSS/HTML fragments, and hook
// stubs if we ever want it back.

