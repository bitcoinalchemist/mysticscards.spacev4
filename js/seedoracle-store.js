// seedoracle-store.js — the ONE source of truth for Seed Oracle
// localStorage. Currently holds only the unlock level (0-4), which
// gates which chapters the reader can open.
//
// Same seam pattern as v3/js/store.js (Cards of Life) and
// v3/js/iching-store.js (I Ching). Everything else in the Seed Oracle
// reconstruction reads/writes through window.SeedStore.
//
// Load order: v3/seedoracle.html must include this BEFORE
// js/seedoracle.js (which calls window.SeedStore.getUnlock() at boot).

(function () {
  'use strict';

  function _get(k)    { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function _set(k, v) { try { localStorage.setItem(k, v); }    catch (e) {} }

  var K_UNLOCK = 'seedoracle_unlock';

  window.SeedStore = {
    // Chapter unlock level: 0..4. Level rises as the reader completes
    // each chapter's proof, and never falls (raiseUnlock in the journey
    // module only writes when the new value is HIGHER).
    // Clamped to 0..4 in case a corrupted key returns something weird.
    getUnlock: function () {
      var raw = parseInt(_get(K_UNLOCK), 10);
      if (!Number.isFinite(raw)) return 0;
      return Math.max(0, Math.min(4, raw));
    },
    setUnlock: function (n) {
      _set(K_UNLOCK, String(Math.max(0, Math.min(4, n | 0))));
    },
  };
})();
