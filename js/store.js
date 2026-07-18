(function () {
  'use strict';

  function _get(k)         { try { return localStorage.getItem(k);       } catch (e) { return null; } }
  function _set(k, v)      { try { localStorage.setItem(k, v);           } catch (e) {} }
  function _getCompat(k) {
    var value = _get(k);
    if (value !== null) return value;
    var legacy = _get(k.replace(/^mysticscards_/, 'cardsoflife_'));
    if (legacy !== null) { _set(k, legacy); return legacy; }
    return null;
  }
  function _flag(k)        { return _getCompat(k) === '1'; }
  function _setFlag(k, on) { _set(k, on ? '1' : '0'); }

  var K_ALT    = 'mysticscards_altCourts';
  var K_DISP   = 'mysticscards_showDisp';
  var K_LTR    = 'mysticscards_quadLtr';
  var K_SCALE  = 'mysticscards_quadScale';
  var K_BIRTHS = 'mysticscards_births';
  var K_SVBASE = 'mysticscards_svBase';
  var K_VOICE  = 'mysticscards_voice';

  window.CardsStore = {
    getQuadAlt:  function ()   { return _flag(K_ALT); },
    setQuadAlt:  function (on) { _setFlag(K_ALT, on); },
    getQuadDisp: function ()   { return _flag(K_DISP); },
    setQuadDisp: function (on) { _setFlag(K_DISP, on); },
    getQuadLtr:  function ()   { return _flag(K_LTR); },
    setQuadLtr:  function (on) { _setFlag(K_LTR, on); },

    getQuadScale: function () {
      var raw = parseInt(_getCompat(K_SCALE), 10);
      return Number.isFinite(raw) ? raw : null;
    },
    setQuadScale: function (v) { _set(K_SCALE, String(v)); },

    getSolarBase: function () {
      var raw = _getCompat(K_SVBASE);
      return raw === '12' ? 12 : 10;
    },
    setSolarBase: function (v) { _set(K_SVBASE, String(v === 12 ? 12 : 10)); },

    // ── Card Elements reading voice ('modern' | 'olney') ─────────
    getVoice: function () { return _getCompat(K_VOICE) === 'olney' ? 'olney' : 'modern'; },
    setVoice: function (v) { _set(K_VOICE, v === 'olney' ? 'olney' : 'modern'); },

    // ── Saved birthdays ──────────────────────────────────────────
    // JSON array of {id, name, day, month, year, time?, place?}, keyed
    // mysticscards_births. Legacy cardsoflife_births values are migrated
    // on first read so saved birthdays survive the rename. Corrupt JSON
    // resolves to an empty list rather than throwing.
    loadBirths: function () {
      try { return JSON.parse(_getCompat(K_BIRTHS)) || []; } catch (e) { return []; }
    },
    saveBirths: function (list) { _set(K_BIRTHS, JSON.stringify(list)); }
  };
})();
