// section-rail.js — the shared horizontal tab-and-swipe rail.
//
// Drives BOTH the homepage (Elements / Finder / Quadrations) and I Ching
// (Trigrams / Inquiry / Hexagrams). Replaced js/home-sections.js and
// js/iching-sections.js, which were ~85% identical and had started to drift.
//
// There is deliberately NO per-page configuration. Everything is derived from
// the markup, which is why the same file serves both pages:
//
//   shell   = [data-section-rail]            (also tells js/site.js that
//                                             collapse is retired inside)
//   tabs    = [role="tab"] within the shell
//   panel   = the element a tab's aria-controls names — which must be a
//             DIRECT CHILD of the track (on index that's the <section>
//             itself, on I Ching the .iching-panel wrapper)
//   track   = the panels' shared parent
//   initial = whichever tab is authored aria-selected="true"
//
// Panels are authored inside the track in the HTML, so with no JS each page
// is a plain vertical stack. This module adds .rail-ready to the shell, which
// is what switches the rail CSS on.
//
// The full contract — including why headings are flattened rather than
// hidden, why the viewports clip on one axis only, and why panel height must
// NOT be managed from JS — is documented in CLAUDE.md § "The section-rail
// contract". Read it before changing this file.
//
// Public API: none — self-initialising, and supports multiple rails per page.
(function () {
  'use strict';

  // A horizontal drag starting on one of these is that element's own gesture,
  // not a panel swipe. Superset across both pages; selectors that don't exist
  // on a given page simply never match.
  var NO_SWIPE = '.spread-wrap, .it-row-wrap, .hex-ref-wrap, .ct-panel, input[type="range"], textarea, [data-no-swipe]';

  // Collapse is retired inside a rail (the tabs replace the toggles), so every
  // .page-section in a panel is forced open and stays open.
  function sectionsIn(panel) {
    var found = Array.prototype.slice.call(panel.querySelectorAll('.page-section'));
    if (panel.classList.contains('page-section')) found.unshift(panel);
    return found;
  }

  function openSections(panel) {
    sectionsIn(panel).forEach(function (section) {
      if (section.classList.contains('section-open')) return;
      section.classList.add('section-open');
      var toggle = section.querySelector(':scope > .section-heading > .section-toggle, :scope > .section-toggle');
      var body = section.querySelector(':scope > .section-bodywrap > .section-bodymin');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
      if (body) body.inert = false;
    });
  }

  // The section toggle is dead inside a rail, so leaving it in the DOM would
  // give keyboard users an invisible focus target. Replace it with its own
  // label text and visually-hide the heading: the <h2> stays in the
  // accessibility tree and the document outline, but nothing focusable
  // survives. Without JS the heading keeps its real, visible toggle.
  function flattenHeadings(panel) {
    sectionsIn(panel).forEach(function (section) {
      var heading = section.querySelector(':scope > .section-heading');
      if (!heading) return;
      var label = heading.querySelector('.section-label');
      if (heading.querySelector('.section-toggle')) {
        heading.textContent = (label ? label.textContent : heading.textContent).trim();
      }
      heading.classList.add('vh');
    });
  }

  function initRail(shell) {
    // The rail's own tablist is the one that is a DIRECT child of the shell.
    // Scoping matters: a panel can contain its own nested tablist (the
    // homepage Finder's About/Astrology/Cycles chips), and a bare
    // querySelectorAll('[role="tab"]') would sweep those up too.
    var nav = shell.querySelector(':scope > [role="tablist"]');
    if (!nav) return;
    var tabs = Array.prototype.slice.call(nav.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    // Each tab names its panel; the panel must be a direct child of the track.
    var panels = tabs.map(function (tab) {
      return document.getElementById(tab.getAttribute('aria-controls'));
    });
    if (panels.indexOf(null) !== -1) return;

    var track = panels[0].parentElement;
    if (!track) return;
    // Bail rather than half-initialise if the markup contract is broken —
    // leaving the page as its no-JS vertical stack, which is still usable.
    var contiguous = panels.every(function (panel) { return panel.parentElement === track; });
    if (!contiguous) return;

    // Track order, not nav order, decides where a panel sits.
    var order = Array.prototype.slice.call(track.children).filter(function (child) {
      return panels.indexOf(child) !== -1;
    });
    var count = order.length;
    var indexOfTab = tabs.map(function (tab, i) { return order.indexOf(panels[i]); });

    var active = 0;
    var startX = null, startY = null;

    // Geometry is derived from the panel count, so adding a fourth panel stays
    // a markup-only change. --rail-count feeds the per-panel flex-basis.
    track.style.width = (count * 100) + '%';
    track.style.setProperty('--rail-count', String(count));

    function show(panelIndex, focusTab) {
      active = (panelIndex + count) % count;
      openSections(order[active]);
      track.style.transform = 'translateX(' + (active * -100 / count) + '%)';
      tabs.forEach(function (tab, i) {
        var selected = indexOfTab[i] === active;
        tab.classList.toggle('is-active', selected);
        tab.setAttribute('aria-selected', selected ? 'true' : 'false');
        tab.tabIndex = selected ? 0 : -1;
      });
      order.forEach(function (panel, i) {
        var selected = i === active;
        panel.setAttribute('aria-hidden', selected ? 'false' : 'true');
        panel.inert = !selected;
      });
      if (focusTab) {
        var current = tabs[indexOfTab.indexOf(active)];
        if (current) current.focus();
      }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { show(indexOfTab[i], false); });
      // Arrow keys walk the tabs in their own order, matching what the eye
      // sees in the nav.
      tab.addEventListener('keydown', function (e) {
        var last = tabs.length - 1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); show(indexOfTab[(i + 1) % tabs.length], true); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); show(indexOfTab[(i + last) % tabs.length], true); }
        if (e.key === 'Home') { e.preventDefault(); show(indexOfTab[0], true); }
        if (e.key === 'End') { e.preventDefault(); show(indexOfTab[last], true); }
      });
    });

    shell.addEventListener('touchstart', function (e) {
      if (e.touches.length > 1 || (e.target.closest && e.target.closest(NO_SWIPE))) {
        startX = startY = null;
        return;
      }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    shell.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      startX = startY = null;
      // Only a decisively horizontal drag switches panels, so vertical page
      // scrolling and nested horizontal scrollers both keep working.
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) show(active + (dx < 0 ? 1 : -1), false);
    }, { passive: true });

    order.forEach(flattenHeadings);
    shell.classList.add('rail-ready');

    // Start on whichever tab the markup authored as selected.
    var initial = tabs.findIndex(function (tab) { return tab.getAttribute('aria-selected') === 'true'; });
    show(indexOfTab[initial < 0 ? 0 : initial], false);
  }

  function init() {
    document.querySelectorAll('[data-section-rail]').forEach(initRail);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
