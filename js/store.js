(function () {
  'use strict';

  function _get(k)         { try { return localStorage.getItem(k);       } catch (e) { return null; } }
  function _set(k, v)      { try { localStorage.setItem(k, v);           } catch (e) {} }
  function _flag(k)        { return _get(k) === '1'; }
  function _setFlag(k, on) { _set(k, on ? '1' : '0'); }

  var K_ALT    = 'cardsoflife_altCourts';
  var K_DISP   = 'cardsoflife_showDisp';
  var K_LTR    = 'cardsoflife_quadLtr';
  var K_SCALE  = 'cardsoflife_quadScale';
  var K_BIRTHS = 'cardsoflife_births';
  var K_SVBASE = 'cardsoflife_svBase';

  window.CardsStore = {
    getQuadAlt:  function ()   { return _flag(K_ALT); },
    setQuadAlt:  function (on) { _setFlag(K_ALT, on); },
    getQuadDisp: function ()   { return _flag(K_DISP); },
    setQuadDisp: function (on) { _setFlag(K_DISP, on); },
    getQuadLtr:  function ()   { return _flag(K_LTR); },
    setQuadLtr:  function (on) { _setFlag(K_LTR, on); },

    getQuadScale: function () {
      var raw = parseInt(_get(K_SCALE), 10);
      return Number.isFinite(raw) ? raw : null;
    },
    setQuadScale: function (v) { _set(K_SCALE, String(v)); },

    getSolarBase: function () {
      var raw = _get(K_SVBASE);
      return raw === '12' ? 12 : 10;
    },
    setSolarBase: function (v) { _set(K_SVBASE, String(v === 12 ? 12 : 10)); },

    // ── Saved birthdays ──────────────────────────────────────────
    // JSON array of {id, name, day, month, year}. Same key as v3's store
    // (cardsoflife_births) so a saved list carries over if this page and
    // the root site are ever served from the same origin. Corrupt JSON
    // resolves to an empty list rather than throwing.
    loadBirths: function () {
      try { return JSON.parse(_get(K_BIRTHS)) || []; } catch (e) { return []; }
    },
    saveBirths: function (list) { _set(K_BIRTHS, JSON.stringify(list)); }
  };
})();
