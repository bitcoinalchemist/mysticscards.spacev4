// iching-cards.js — the I Ching page's own playing-card face renderer.
// Distinct from cardsdata.js's copies of PIP_LAYOUTS/COURT_PIP_DEFAULT/
// spreadCardPips because this page needs its own sizing + court-pip
// positioning + card-face markup (which then feeds the 3D flip-deal
// animation defined in css/iching.css). CLAUDE.md flags the duplication
// as intentional (comment: "It has its own card renderer and its own
// PIP_LAYOUTS ... the deal animations are its own").
//
// v3 reconstruction step 4 — fourth physical extraction from
// v3/js/iching.js. Loaded as a classic script BEFORE iching.js so the
// oracle IIFE can read cardFaceHTML + SUIT_CLASS as bare classic-script
// globals via shared lexical scope.
//
// Public "surface" — these are read by other files as bare globals:
//   SUIT_CLASS     — '♥' → 'hearts' etc., used to attach the suit class
//                    to card-slot wrappers
//   cardFaceHTML   — renders the full card face HTML for a deck card
//                    {rank, suit, red, court}
// Also on window (for callers outside classic scope): both mirror.

// Suit-symbol → CSS class name mapping. Used by cardFaceHTML AND by
// the oracle for slot / pull-card class assignment (`ck-host ${SUIT_CLASS[c.suit]}`).
const SUIT_CLASS = { '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs', '♠': 'spades' };
window.SUIT_CLASS = SUIT_CLASS;

// Standardised pip layouts — top pip at 8%, bottom at 92% for every
// card, with rows spaced evenly by count so same-type columns line up
// across the deck. Each entry is [xPct, yPct, invertedFlag]. Prefixed
// with IC_ to avoid collision with cardsdata.js's `PIP_LAYOUTS` — both
// files coexist because cardsdata.js is loaded for CARDS + spreadCardPips.
const IC_PIP_LAYOUTS = {
  'A':  [[50,50,0]],
  '2':  [[50,8,0],[50,92,1]],
  '3':  [[50,8,0],[50,50,0],[50,92,1]],
  '4':  [[25,8,0],[75,8,0],[25,92,1],[75,92,1]],
  '5':  [[25,8,0],[75,8,0],[50,50,0],[25,92,1],[75,92,1]],
  '6':  [[25,8,0],[75,8,0],[25,50,0],[75,50,0],[25,92,1],[75,92,1]],
  '7':  [[25,8,0],[75,8,0],[50,29,0],[25,50,0],[75,50,0],[25,92,1],[75,92,1]],
  '8':  [[25,8,0],[75,8,0],[50,29,0],[25,50,0],[75,50,0],[50,71,1],[25,92,1],[75,92,1]],
  '9':  [[25,8,0],[75,8,0],[25,36,0],[75,36,0],[50,50,0],[25,64,1],[75,64,1],[25,92,1],[75,92,1]],
  '10': [[25,8,0],[75,8,0],[50,22,0],[25,36,0],[75,36,0],[25,64,1],[75,64,1],[50,78,1],[25,92,1],[75,92,1]]
};

// Per-court pip placement [x%, y%] (mirror rotated). Listed cards put
// the pip beside the head; the rest use the default corner triangles.
// Same IC_ prefix rationale as PIP_LAYOUTS above.
const IC_COURT_PIP_DEFAULT = [31, 23.1];   // on the number-card grid: left column, top row; size from CSS (.court-pip)
const IC_COURT_PIP_POS = {};               // e.g. QS: [33,22] to nudge one card

function cardFaceHTML(card) {
  var rank = card.rank, sym = card.suit;
  var corners =
    '<div class="card-corner card-tl"><span class="cc-rank">' + rank + '</span></div>' +
    '<div class="card-corner card-br"><span class="cc-rank">' + rank + '</span></div>';
  if (['J', 'Q', 'K'].indexOf(rank) !== -1) {
    var suitLetter = sym === '♥' ? 'H' : sym === '♦' ? 'D' : sym === '♣' ? 'C' : 'S';
    var mark = (window.pipMark ? window.pipMark(sym) : sym);
    var pos = IC_COURT_PIP_POS[rank + suitLetter] || IC_COURT_PIP_DEFAULT;
    var courtPips =
      '<span class="court-pip" style="left:' + pos[0] + '%;top:' + pos[1] + '%">' + mark + '</span>' +
      '<span class="court-pip" style="left:' + (100 - pos[0]) + '%;top:' + (100 - pos[1]) + '%;transform:translate(-50%,-50%) rotate(180deg)">' + mark + '</span>';
    return corners + courtPips + '<img class="court-art" src="assets/cards/' + rank + suitLetter + '.webp" alt="' + rank + ' of ' + SUIT_CLASS[sym] + '">';
  }
  var layout = IC_PIP_LAYOUTS[rank];
  if (!layout) return corners;
  var ace = rank === 'A';
  var mark = (window.pipMark ? window.pipMark(sym) : sym);
  return corners + '<div class="card-pips">' +
    layout.map(function (p) {
      return '<span class="pip' + (p[2] ? ' inv' : '') + (ace ? ' ace' : '') +
             '" style="left:' + p[0] + '%;top:' + p[1] + '%">' + mark + '</span>';
    }).join('') + '</div>';
}
window.cardFaceHTML = cardFaceHTML;
