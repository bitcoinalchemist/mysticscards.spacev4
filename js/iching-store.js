// iching-store.js — the ONE source of truth for I Ching localStorage.
//
// Same seam pattern as v3/js/store.js (Cards of Life). Everything else
// in the I Ching reconstruction reads/writes history through
// window.IChingStore. Search v3/js/iching*.js for `localStorage` and
// there should be zero hits after the extractions land.
//
// Non-module by design: the rest of v3 is still classic <script> tags,
// so this attaches to window and the other iching-*.js files read it
// as a global. When the ES-module split lands, this file gets a
// matching `export const store = window.IChingStore` at the foot.
//
// Load order: v3/iching.html must include this BEFORE js/iching.js
// (which now calls window.IChingStore.loadHistory / saveHistory).

(function () {
  'use strict';

  // Every call try/caught because localStorage throws in private-mode
  // Safari, on quota exceeded, or when disabled by policy. Callers all
  // treat "storage unavailable" as "no saved value" — same behaviour
  // the previous inline calls in iching.js had.
  function _get(k)    { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function _set(k, v) { try { localStorage.setItem(k, v); }    catch (e) {} }

  var K_HISTORY = 'iching_readings';

  window.IChingStore = {
    // Saved-reading history — an array of { id, ts, question, draws, pulls? }.
    // Corrupt JSON → empty list (matches the pre-extraction inline
    // implementation).
    loadHistory: function () {
      try { return JSON.parse(_get(K_HISTORY)) || []; } catch (e) { return []; }
    },
    saveHistory: function (list) { _set(K_HISTORY, JSON.stringify(list)); },
  };
})();
