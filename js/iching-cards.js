// iching-cards.js — the I Ching page's playing-card face renderer.
//
// As of 2026-07-11 this no longer carries its own copy of the pip
// layouts / court positioning. It now DELEGATES to cardsdata.js's
// `spreadCardPips` so the I Ching faces are byte-identical to the Cards
// of Life page and can never drift again. (The old fork was an earlier,
// separately-maintained copy that had gone stale — e.g. it enlarged the
// pip on every ace instead of only the Ace of Spades.) cardsdata.js is
// loaded before this file, so `spreadCardPips` + `pipMark` are available
// as classic-script globals. The card face internals (corners, pips,
// court art + court pips) still come from css/site.css — the same cqw-
// based layout Cards of Life uses — and the 3D flip-deal wrapper stays
// in css/iching.css.
//
// Loaded as a classic script BEFORE iching-oracle.js so the oracle IIFE
// can read cardFaceHTML + SUIT_CLASS as bare classic-script globals via
// shared lexical scope.
//
// Public "surface" — read by other files as bare globals (also mirrored
// on window for callers outside classic scope):
//   SUIT_CLASS     — '♥' → 'hearts' etc., used to attach the suit class
//                    to card-slot wrappers
//   cardFaceHTML   — renders the full card face HTML for a deck card
//                    {rank, suit:'♥'|'♦'|'♣'|'♠', red, court}

// Suit-symbol → CSS class name mapping. Used by cardFaceHTML AND by the
// oracle for slot / pull-card class assignment (`ck-host ${SUIT_CLASS[c.suit]}`).
const SUIT_CLASS = { '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs', '♠': 'spades' };
window.SUIT_CLASS = SUIT_CLASS;

// The oracle's deck cards carry the suit SYMBOL in `card.suit` ('♥'),
// whereas spreadCardPips expects the class name in `suit` plus the
// symbol in `sym`. Translate, then hand off to the shared renderer.
function cardFaceHTML(card) {
  return spreadCardPips({ rank: card.rank, suit: SUIT_CLASS[card.suit], sym: card.suit });
}
window.cardFaceHTML = cardFaceHTML;
