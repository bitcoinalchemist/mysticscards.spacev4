// iching-store.js — the ONE source of truth for I Ching localStorage.
//
// Same seam pattern as js/store.js (Mystics Cards). Everything on this
// page reads/writes history through window.IChingStore. Search
// js/iching*.js for `localStorage` and there should be zero hits outside
// this file.
//
// Non-module by design: the rest of the site is still classic <script>
// tags, so this attaches to window and the other iching-*.js files read
// it as a global. When the ES-module split lands, this file gets a
// matching `export const store = window.IChingStore` at the foot.
//
// Load order: iching.html must include this BEFORE js/iching-oracle.js
// (which calls window.IChingStore.loadHistory / saveHistory).

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
