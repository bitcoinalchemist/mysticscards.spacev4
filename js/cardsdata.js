window.SUIT_PIP_SVG = {
  '♠': '<svg class="pip-svg" viewBox="0 0 100 100" aria-hidden="true"><path d="M50,8 C30,26 6,50 6,66 C6,82 22,90 36,82 C42,78 47,74 50,70 L40,95 L60,95 L50,70 C53,74 58,78 64,82 C78,90 94,82 94,66 C94,50 70,26 50,8 Z"/></svg>',
  '♥': '<svg class="pip-svg" viewBox="0 0 100 100" aria-hidden="true"><path d="M50,86 C45,79 15,58 15,34 C15,22 24,14 35,14 C43,14 48,20 50,27 C52,20 57,14 65,14 C76,14 85,22 85,34 C85,58 55,79 50,86 Z"/></svg>',
  '♦': '<svg class="pip-svg" viewBox="0 0 100 100" aria-hidden="true"><path d="M50,6 L86,50 L50,94 L14,50 Z"/></svg>',
  '♣': '<svg class="pip-svg" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="30" r="20"/><circle cx="27" cy="58" r="20"/><circle cx="73" cy="58" r="20"/><path d="M44,46 L40,96 L60,96 L56,46 Z"/></svg>'
};
window.pipMark = function (sym) { return window.SUIT_PIP_SVG[sym] || sym; };

// ── Life Scripts ─────────────────────────────────────────────────
// Script order in array: [Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune]
// Display order in modal: Neptune → Mercury (left → right), matching the Quadration grid.
const LIFE_SCRIPTS = {
  'A_hearts':  ['A♦','Q♦','5♥','3♣','3♠','9♥','7♣'],
  '2_hearts':  ['K♥','K♦','6♥','4♣','2♦','J♠','8♣'],
  '3_hearts':  ['A♣','Q♣','10♠','5♣','3♦','A♠','7♥'],
  '4_hearts':  ['4♦','2♠','8♥','6♣','6♠','Q♥','10♣'],
  '5_hearts':  ['3♣','3♠','9♥','7♣','5♦','Q♠','J♣'],
  '6_hearts':  ['4♣','2♦','J♠','8♣','6♦','4♠','10♥'],
  '7_hearts':  ['7♦','5♠','J♥','9♣','9♠','2♥','K♥'],
  '8_hearts':  ['6♣','6♠','Q♥','10♣','8♦','K♠','3♥'],
  '9_hearts':  ['7♣','5♦','Q♠','J♣','9♦','7♠','2♣'],
  '10_hearts': ['10♦','8♠','A♥','A♦','Q♦','5♥','3♣'],
  'J_hearts':  ['9♣','9♠','2♥','K♥','K♦','6♥','4♣'],
  'Q_hearts':  ['10♣','8♦','K♠','3♥','A♣','Q♣','10♠'],
  'K_hearts':  ['K♦','6♥','4♣','2♦','J♠','8♣','6♦'],

  'A_clubs':   ['Q♣','10♠','5♣','3♦','A♠','7♥','7♦'],
  '2_clubs':   ['K♣','J♦','4♥','4♦','2♠','8♥','6♣'],
  '3_clubs':   ['3♠','9♥','7♣','5♦','Q♠','J♣','9♦'],
  '4_clubs':   ['2♦','J♠','8♣','6♦','4♠','10♥','10♦'],
  '5_clubs':   ['3♦','A♠','7♥','7♦','5♠','J♥','9♣'],
  '6_clubs':   ['6♠','Q♥','10♣','8♦','K♠','3♥','A♣'],
  '7_clubs':   ['5♦','Q♠','J♣','9♦','7♠','2♣','K♣'],
  '8_clubs':   ['6♦','4♠','10♥','10♦','8♠','A♥','A♦'],
  '9_clubs':   ['9♠','2♥','K♥','K♦','6♥','4♣','2♦'],
  '10_clubs':  ['8♦','K♠','3♥','A♣','Q♣','10♠','5♣'],
  'J_clubs':   ['9♦','7♠','2♣','K♣','J♦','4♥','4♦'],
  'Q_clubs':   ['10♠','5♣','3♦','A♠','7♥','7♦','5♠'],
  'K_clubs':   ['J♦','4♥','4♦','2♠','8♥','6♣','6♠'],

  'A_diamonds':  ['Q♦','5♥','3♣','3♠','9♥','7♣','5♦'],
  '2_diamonds':  ['J♠','8♣','6♦','4♠','10♥','10♦','8♠'],
  '3_diamonds':  ['A♠','7♥','7♦','5♠','J♥','9♣','9♠'],
  '4_diamonds':  ['2♠','8♥','6♣','6♠','Q♥','10♣','8♦'],
  '5_diamonds':  ['Q♠','J♣','9♦','7♠','2♣','K♣','J♦'],
  '6_diamonds':  ['4♠','10♥','10♦','8♠','A♥','A♦','Q♦'],
  '7_diamonds':  ['5♠','J♥','9♣','9♠','2♥','K♥','K♦'],
  '8_diamonds':  ['K♠','3♥','A♣','Q♣','10♠','5♣','3♦'],
  '9_diamonds':  ['7♠','2♣','K♣','J♦','4♥','4♦','2♠'],
  '10_diamonds': ['8♠','A♥','A♦','Q♦','5♥','3♣','3♠'],
  'J_diamonds':  ['4♥','4♦','2♠','8♥','6♣','6♠','Q♥'],
  'Q_diamonds':  ['5♥','3♣','3♠','9♥','7♣','5♦','Q♠'],
  'K_diamonds':  ['6♥','4♣','2♦','J♠','8♣','6♦','4♠'],

  'A_spades':  ['7♥','7♦','5♠','J♥','9♣','9♠','2♥'],
  '2_spades':  ['8♥','6♣','6♠','Q♥','10♣','8♦','K♠'],
  '3_spades':  ['9♥','7♣','5♦','Q♠','J♣','9♦','7♠'],
  '4_spades':  ['10♥','10♦','8♠','A♥','A♦','Q♦','5♥'],
  '5_spades':  ['J♥','9♣','9♠','2♥','K♥','K♦','6♥'],
  '6_spades':  ['Q♥','10♣','8♦','K♠','3♥','A♣','Q♣'],
  '7_spades':  ['2♣','K♣','J♦','4♥','4♦','2♠','8♥'],
  '8_spades':  ['A♥','A♦','Q♦','5♥','3♣','3♠','9♥'],
  '9_spades':  ['2♥','K♥','K♦','6♥','4♣','2♦','J♠'],
  '10_spades': ['5♣','3♦','A♠','7♥','7♦','5♠','J♥'],
  'J_spades':  ['8♣','6♦','4♠','10♥','10♦','8♠','A♥'],
  'Q_spades':  ['J♣','9♦','7♠','2♣','K♣','J♦','4♥'],
  'K_spades':  ['3♥','A♣','Q♣','10♠','5♣','3♦','A♠'],
};

const LS_SUIT_FROM_SYM = { '♥':'hearts', '♦':'diamonds', '♣':'clubs', '♠':'spades' };

function lsParseCard(str) {
  const sym = str.slice(-1);
  return { rank: str.slice(0, -1), sym, suit: LS_SUIT_FROM_SYM[sym] };
}

const SPREAD_SUITS  = ['hearts','clubs','diamonds','spades'];
const SPREAD_SYMS   = { hearts:'♥', clubs:'♣', diamonds:'♦', spades:'♠' };
const SPREAD_RANKS  = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const SPREAD_PLANETS = ['Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune'];
const SPREAD_PLANET_SYM = { Mercury:'☿', Venus:'♀', Mars:'♂', Jupiter:'♃', Saturn:'♄', Uranus:'♅', Neptune:'♆', Crown:'♛' };

const SPREAD_CARDS = [];
SPREAD_SUITS.forEach(suit => {
  SPREAD_RANKS.forEach(rank => {
    SPREAD_CARDS.push({ suit, rank, sym: SPREAD_SYMS[suit] });
  });
});

const QUADRATION_P = [
  26,13, 0,42,29,16, 7,45,32,23,10,48,14, 1,
  39,30,17, 4,46,33,20,11,49,36, 2,40,27,18,
   5,43,34,21, 8,50,37,24,41,28,15, 6,44,31,
  22, 9,47,38,25,12, 3,19,35,51
];

const _spreadCache = {};
function deckAtAge(age) {
  age = ((age % 90) + 90) % 90;
  if (_spreadCache[age]) return _spreadCache[age];
  let perm = Array.from({length: 52}, (_, i) => i);
  let power = QUADRATION_P.slice();
  let n = age;
  while (n > 0) {
    if (n & 1) perm = perm.map(i => power[i]);
    power = power.map(i => power[i]);
    n >>= 1;
  }
  const deck = new Array(52);
  for (let i = 0; i < 52; i++) deck[perm[i]] = i;
  _spreadCache[age] = deck;
  return deck;
}

function slDisplaces(idx)   { const s = deckAtAge(90), l = deckAtAge(1); return s[l.indexOf(idx)]; }
function slDisplacedBy(idx) { const s = deckAtAge(90), l = deckAtAge(1); return l[s.indexOf(idx)]; }

const PIP_LAYOUTS = {
  'A':  [[50,50,0]],
  '2':  [[50,8,0],[50,92,1]],
  '3':  [[50,8,0],[50,50,0],[50,92,1]],
  '4':  [[25,8,0],[75,8,0],[25,92,1],[75,92,1]],
  '5':  [[25,8,0],[75,8,0],[50,50,0],[25,92,1],[75,92,1]],
  '6':  [[25,8,0],[75,8,0],[25,50,0],[75,50,0],[25,92,1],[75,92,1]],
  '7':  [[25,8,0],[75,8,0],[50,29,0],[25,50,0],[75,50,0],[25,92,1],[75,92,1]],
  '8':  [[25,8,0],[75,8,0],[50,29,0],[25,50,0],[75,50,0],[50,71,1],[25,92,1],[75,92,1]],
  '9':  [[25,8,0],[75,8,0],[25,36,0],[75,36,0],[50,50,0],[25,64,1],[75,64,1],[25,92,1],[75,92,1]],
  '10': [[25,8,0],[75,8,0],[50,22,0],[25,36,0],[75,36,0],[25,64,1],[75,64,1],[50,78,1],[25,92,1],[75,92,1]],
  'J':  [[25,8,0],[75,8,0],[50,22,0],[25,36,0],[75,36,0],[50,50,0],[25,64,1],[75,64,1],[50,78,1],[25,92,1],[75,92,1]],
  'Q':  [[25,8,0],[50,8,0],[75,8,0],[25,36,0],[50,36,0],[75,36,0],[25,64,1],[50,64,1],[75,64,1],[25,92,1],[50,92,1],[75,92,1]],
  'K':  [[25,8,0],[75,8,0],[50,-5,0],[50,22.5,0],[25,36,0],[75,36,0],[50,50,0],[25,64,1],[75,64,1],[50,77.5,1],[25,92,1],[75,92,1],[50,105,1]]
};

const COURT_PIP_DEFAULT = [31, 23.1];
const COURT_PIP_POS = {};

function spreadCardPips(c) {
  const { rank, sym } = c;
  const corners =
    `<div class="card-corner card-tl"><span class="cc-rank">${rank}</span></div>` +
    `<div class="card-corner card-br"><span class="cc-rank">${rank}</span></div>`;
  if (['J','Q','K'].includes(rank)) {
    const courtKey = rank + (c.suit === 'hearts' ? 'H' : c.suit === 'diamonds' ? 'D' : c.suit === 'clubs' ? 'C' : 'S');
    const mark = window.pipMark(sym);
    const pos = COURT_PIP_POS[courtKey] || COURT_PIP_DEFAULT;
    const courtPips =
      `<span class="court-pip" style="left:${pos[0]}%;top:${pos[1]}%">${mark}</span>` +
      `<span class="court-pip" style="left:${100 - pos[0]}%;top:${100 - pos[1]}%;transform:translate(-50%,-50%) rotate(180deg)">${mark}</span>`;
    const altPips = '<div class="card-pips court-only">' +
      (PIP_LAYOUTS[rank] || []).map(([x,y,inv]) =>
        `<span class="pip${inv ? ' inv' : ''}" style="left:${x}%;top:${y}%">${mark}</span>`
      ).join('') + '</div>';
    return corners + courtPips + `<img class="court-art" src="assets/cards/${courtKey}.webp" alt="${rank} of ${c.suit}">` + altPips;
  }
  const layout = PIP_LAYOUTS[rank];
  const aceLarge = rank === 'A' && c.suit === 'spades';
  const mark = window.pipMark(sym);
  return corners + '<div class="card-pips">' +
    layout.map(([x,y,inv]) =>
      `<span class="pip${inv?' inv':''}${aceLarge?' ace':''}" style="left:${x}%;top:${y}%">${mark}</span>`
    ).join('') + '</div>';
}

// ── About / Reading data (ported from v3 cardsdata.js) ─────────────
// 52 card readings — one entry per Ace..King × Hearts/Clubs/Diamonds/
// Spades. Locked Sage voice. The Joker is not in this list; it has its
// own subtitle and vow via the SUBTITLES / VOWS maps below.
//
// Shape per entry: { rank, suit, sym, name, dates, teaser, kws[],
// personality, strengths[], challenges[] }. Data intentionally
// duplicated across CARDS (array in solar order, matching SPREAD_CARDS
// indexing) and CARD_READINGS (map keyed by `${rank}_${suit}` for O(1)
// lookup from the Finder's rendered pick).
const CARDS = [
  // HEARTS
  { rank:'A',  suit:'hearts',   sym:'♥', name:'Ace of Hearts',    dates:'Dec 30',
    teaser:'The very first beat of the deck, and its oldest hunger: the need to love and to be loved in return. Magnetic and quick to read the true worth of things, you spend a lifetime learning whether the heart and worldly success can ever be held at once.',
    kws:['Desire','New beginnings','Emotional depth','Self-discovery'],
    personality:'The desire for love sits at the very root of this card, the first beat of the Hearts suit and of the deck itself. A soul of intense longing and magnetic warmth, you are driven by a deep need to love and to be loved in return, and you instinctively want to know the true value and worth of everything before you. You carry a rare emotional intelligence, a quick and ambitious mind, and a real gift for both people and business; many born to this card thrive in the arts or in competitive arenas. The tension between the love of the heart and the love of worldly success is your great teacher, and the quiet truth of this card is that you can have both.',
    strengths:['Intense, devoted love','Magnetic and emotionally intelligent','Ambitious and quick-minded','Sees potential in people before others do'],
    challenges:['The longing to be loved can tip into dependency','Emotional overwhelm','Difficulty detaching from people or outcomes','Balancing the pull between love and material success'] },
  { rank:'2',  suit:'hearts',   sym:'♥', name:'Two of Hearts',    dates:'Dec 29',
    teaser:'The Lovers of the deck, a soul wired for deep connection and almost spiritual about what partnership could be. Your ideals of love run so high they become the very thing you struggle to live up to.',
    kws:['Union','Partnership','Devotion','Idealism'],
    personality:'Union is the whole story of this card, the Lovers of the deck. A soul wired for deep connection, you carry an almost spiritual vision of what love and partnership can be, drawn to union not just romantically but philosophically, and seeking harmony in every relationship you touch. You are sensitive and profoundly affected by your surroundings and by how others treat you, with a genuine need for support and acknowledgment, and you nearly always prefer partnership to going it alone. Your desire for a true soul mate is one of the strongest motivators behind the choices you make. Your greatest gift is also your greatest tension: your ideals of love run so high they can be difficult to live up to, even for yourself.',
    strengths:['Deep loyalty and devoted love','Natural peacemaker with a gift for harmony','Powerful intuition about people and relationships','Ability to nurture and sustain bonds over time'],
    challenges:['Unrealistic ideals leading to repeated disappointment','Fear of being alone driving compromised choices','Can feel profoundly misunderstood by others'] },
  { rank:'3',  suit:'hearts',   sym:'♥', name:'Three of Hearts',  dates:'Nov 30, Dec 28',
    teaser:'Love and imagination running on the same current, an expressive heart paired with a restless, brilliant mind. The gift is real feeling poured into art and words; the catch is scattering it across too many beginnings that never find an ending.',
    kws:['Creativity','Expression','Versatility','Restlessness'],
    personality:'Love and imagination are the twin engines of this card. A naturally gifted communicator and creator, you move through the world with an expressive heart and a restless, brilliant mind, blessed with the ability to channel deep feeling into art, words, or performance. You are imaginative, optimistic and social, and at your best you inspire others simply by sharing your inner life openly and honestly. Your feelings run deeper than those around you often realise. The shadow is a tendency to scatter that creative force across too many directions at once, leaving inspired beginnings without satisfying endings; moodiness, worry and indecision are usually signs that your creativity needs a productive channel to flow into.',
    strengths:['Artistic and richly expressive','Persistent and self-motivated when passion is engaged','Warm, entertaining social presence','Wide range of creative talents'],
    challenges:['Scattered energy and creative indecision','Emotional restlessness in relationships','Persistent worry and mental chatter'] },
  { rank:'4',  suit:'hearts',   sym:'♥', name:'Four of Hearts',   dates:'Oct 31, Nov 29, Dec 27',
    teaser:'The builder of the Hearts suit, quietly devoted to creating a home and a love that others can lean on. The same steadiness that makes you safe to love can harden into a resistance to the changes you actually need.',
    kws:['Stability','Security','Loyalty','Home'],
    personality:'This is the card of foundations, the builder of the Hearts suit. You seek to create lasting emotional security and a home life others can depend on, and being deeply loyal and consistent, you offer the people you love a rare sense of groundedness and safety. Harmony in your relationships is essential to your happiness, and you do your best work alongside others who share your values. Many born to this card are natural healers and find real success in business, education, the arts, medicine, or metaphysics once they are happy in themselves. The challenge lies in rigidity; the very stability you instinctively build can harden into resistance to the changes that are not only inevitable but necessary.',
    strengths:['Unwavering loyalty and reliability','Natural protector and homemaker','Emotional consistency others can trust','Practical and grounded in relationships'],
    challenges:['Stubbornness and resistance to change','Fear of instability leading to controlling behaviour','Difficulty adapting when circumstances shift unexpectedly'] },
  { rank:'5',  suit:'hearts',   sym:'♥', name:'Five of Hearts',   dates:'Oct 30, Nov 28, Dec 26',
    teaser:'The restless heart that wants all of it at once, love, security, variety, and a horizon to chase. Your whole reward in life is hidden in one hard thing: finding something you love and staying long enough to watch it bloom.',
    kws:['Freedom','Change','Adventure','Restlessness'],
    personality:'The restless heart wants it all, love, money, security and variety, and this is the card of emotional adventure. A seeker by nature, you are drawn to new experiences, new people, and new emotional horizons, carrying an infectious energy and curiosity that makes life feel alive wherever you go. You are highly sociable, have a good head for business, and thrive in work that offers travel, variety, and the chance to advise or be among people. The shadow is a restlessness that can make commitment feel like a cage and pull your focus before depth is reached. The great work of your life, and its greatest reward, is finding something you truly love and staying with it long enough to see it bloom.',
    strengths:['Adventurous and enthusiastically open-hearted','Highly adaptable and energetic','Magnetic and engaging social presence','Able to reinvent yourself across many stages of life'],
    challenges:['Emotional restlessness and inconsistency in love','Difficulty sustaining long-term commitment','Tendency to move on before depth is reached'] },
  { rank:'6',  suit:'hearts',   sym:'♥', name:'Six of Hearts',    dates:'Oct 29, Nov 27, Dec 25',
    teaser:'The card of karmic love, forever smoothing conflict and healing the people around you, often at your own expense. Love returned is love earned here, and the one key you keep circling back to is simply taking action.',
    kws:['Karma','Responsibility','Compassion','Peace'],
    personality:'Balance and harmony are this card\'s whole pursuit, the energy of karmic love. You understand at a deep level that relationships are the great classroom of life, and being naturally kind, affectionate and sensitive to the feelings of others, you are forever drawn to smooth conflict and heal wounds, often sacrificing your own needs for the happiness of those you love. You have genuine mental balance and good judgment to draw on, alongside high intelligence and a real gift for communication. The lesson of this card is accountability: love returned is love earned, and what you receive mirrors what you give. The single key to your success is action, the conscious choice to move past a natural tendency to procrastinate.',
    strengths:['Deep compassion and genuine empathy','Natural peacemaker and skilled mediator','Strong sense of responsibility toward those you love','Emotionally wise beyond your years'],
    challenges:['Taking on others\' emotional burdens as your own','Avoiding necessary conflict in the name of peace','Resistance to accepting karmic lessons on their own terms'] },
  { rank:'7',  suit:'hearts',   sym:'♥', name:'Seven of Hearts',  dates:'Sep 30, Oct 28, Nov 26, Dec 24',
    teaser:'The Mystic Heart, tuned to a high frequency and able to read the inner worlds of others with rare accuracy. Beauty keeps you well and giving keeps you alive, but the quiet danger is the martyrdom that grows when you give without ever being filled back up.',
    kws:['Spirituality','Intuition','Forgiveness','Inner life'],
    personality:'Known as the Mystic Heart, the card of truth and beauty, this is one of the most spiritually charged cards in the deck. You operate on a high emotional frequency, gifted with deep intuition and a rare ability to understand the inner worlds of others, which is why so many born to this card become counsellors, healers, and teachers. Your path is one of spiritual love and forgiveness: learning to give freely and forgive fully, while guarding against the martyrdom that quietly grows from over-giving without replenishment. Beauty and harmony are the keys to your peace of mind, so surround yourself with them, and find the balance between giving and receiving that lets your own needs be met too.',
    strengths:['Profound emotional and spiritual intelligence','Natural healer, counsellor, or teacher','Magnetic and charismatic presence','Deep and genuine capacity for forgiveness'],
    challenges:['Over-sensitivity and emotional overwhelm','Risk of self-sacrifice tipping into martyrdom','Suspicion or jealousy in close relationships when depleted'] },
  { rank:'8',  suit:'hearts',   sym:'♥', name:'Eight of Hearts',  dates:'Aug 31, Sep 29, Oct 27, Nov 25, Dec 23',
    teaser:'Here love stops being soft and becomes a force, healing, magnetic, and asking to be used with real integrity. Your deepest work is self-love, because everything you draw toward you rests on that one foundation.',
    kws:['Self-love','Emotional power','Healing','Transformation'],
    personality:'Here love is a force, not merely romantic but healing and transformative, expressed through magnetic charm and a real strength of character. You have been blessed with the kind of emotional power that asks to be used with integrity, and you can attain genuine mastery in almost any field you choose, particularly the arts, music, healing, or work as a counsellor or teacher. Your greatest work is the cultivation of deep self-love, and through that inner foundation you naturally draw powerful, meaningful connections toward you. The shadow is the misuse of that emotional power: when love tips into possessiveness, or strength becomes a refusal to be vulnerable. A tendency to worry is the quiet tax this card asks you to manage.',
    strengths:['Magnetic personal warmth and emotional authority','Deep capacity for emotional healing and renewal','Self-aware and genuinely introspective','Resilient and steady through relational challenges'],
    challenges:['Power struggles within intimate relationships','Possessiveness or need for emotional control','Difficulty allowing true vulnerability'] },
  { rank:'9',  suit:'hearts',   sym:'♥', name:'Nine of Hearts',   dates:'Aug 30, Sep 28, Oct 26, Nov 24, Dec 22',
    teaser:'One of the most emotionally profound cards in the deck, the place where love is learned by giving more than most know how to receive. They call it the wish card, and its whole lesson is the hardest one: learning to let go, of people, of outcomes, of the need to hold love to prove it is real.',
    kws:['Completion','Universal love','Generosity','Release'],
    personality:'Universal love and the completion of the emotional cycle live in this card, one of the most emotionally profound in the deck and known as the card of learning through love. You love deeply and give generously, often more than others know how to match or receive, and the bulk of your lessons arrive through your relationships, where cultivating discernment becomes the work of a lifetime. This is also the \'wish\' card; you can spend years wishing for love or for money, and the life lesson is learning to release, people, outcomes, and the idea that love must be held to be real. What you give to the world returns magnified, but only once you stop gripping it. Note: the 9 of Hearts is a semi-fixed card and Spiritual Twin to the 7 of Diamonds.',
    strengths:['Immense and genuine capacity for love and generosity','Deeply empathetic and emotionally wise','Naturally inspiring and magnetic','Called toward service in a meaningful and lasting way'],
    challenges:['Emotional depletion from chronic over-giving','Idealism cycling into disillusionment','Difficulty with endings, loss, and letting go'] },
  { rank:'10', suit:'hearts',   sym:'♥', name:'Ten of Hearts',    dates:'Jul 31, Aug 29, Sep 27, Oct 25, Nov 23, Dec 21',
    teaser:'Love turned outward and lit up for a crowd, warmth that can move a whole room at once. The shadow is subtle: magnificent in public, you can quietly withdraw from the real intimacy that happens in private.',
    kws:['Abundance','Social love','Ambition','Success'],
    personality:'The highest-value card in the Hearts suit carries the energy of love expressed outwardly and abundantly, with a strong, independent spirit that instinctively knows every obstacle can be met through love and understanding. You thrive in social settings, on a stage, or in any role where your warmth and emotional intelligence can move many people at once, and your powers of reason and logic, once applied, are formidable. Living the fullness of this card brings success romantically, spiritually and materially; living below it invites doubt, confusion, and a slide toward the domineering. The shadow is a tendency to withdraw from genuine intimacy while remaining magnificent in the crowd. Real vulnerability, offered in private, is your growing edge.',
    strengths:['Naturally charismatic and emotionally generous','Gifted at connecting with and inspiring large groups','Ambitious with penetrating emotional focus','Warm, magnanimous spirit'],
    challenges:['Emotional distance or guardedness in intimate relationships','Risk of isolation behind a polished public persona','Need for recognition can overshadow authentic connection'] },
  { rank:'J',  suit:'hearts',   sym:'♥', name:'Jack of Hearts',   dates:'Jul 30, Aug 28, Sep 26, Oct 24, Nov 22, Dec 20',
    teaser:'Eternal youth and a giving heart, the natural teacher who shows the way of love by example, often from somewhere behind the scenes. Beloved almost everywhere you go, your secret task is to give some of that devotion back to yourself.',
    kws:['Charm','Service','Youthfulness','Idealism'],
    personality:'Eternal youth and sacrificial love meet in this card, the natural-born teacher who came to show the way of love and compassion, often by example and frequently from behind the scenes. Charismatic, warm, and beloved in nearly every room you enter, you carry a rare combination of personal magnetism and genuine care, and you understand instinctively that the greatest gift is the giving of oneself. The shadow is the classic resistance of the Knave: charm and good intentions are no substitute for showing up fully, and carelessness or denial can shade into escapism. The secret, easily missed by so giving a soul, is to give to yourself too, honouring your own dreams and keeping clear boundaries. Note: the Jack of Hearts is a fixed card in the Life Spread.',
    strengths:['Irresistible personal magnetism and natural warmth','Genuine compassion and desire to be of service','Creative, playful, and energising to others','Natural leader who inspires through love rather than authority'],
    challenges:['Avoiding responsibility or emotional depth','Charm used as deflection from difficult truths','Inconsistency or restlessness in committed relationships'] },
  { rank:'Q',  suit:'hearts',   sym:'♥', name:'Queen of Hearts',  dates:'Jul 29, Aug 27, Sep 25, Oct 23, Nov 21, Dec 19',
    teaser:'The promoter of dreams and the deck\'s image of unconditional love, holding a vision of harmony wide enough to take in people, animals, art, and spirit alike. The trouble is the one direction the love rarely flows: inward, toward the Queen herself.',
    kws:['Nurturing','Unconditional love','Artistry','Devotion'],
    personality:'The promoter of dreams and the archetype of unconditional love, this Queen holds a vision of love and harmony for the whole world. Nurturing, devoted, and deeply invested in the flourishing of those around her, you are inviting, warm, optimistic and artistically gifted, with an emotional capacity broad enough to extend beyond people to animals, art, nature, and the spiritual life. Your remarkable communication skills and magnetic personality suit you to teaching, management, or any role rich in contact with people; many born to this card are natural psychics and mediums. The challenge is ensuring all this love flows inward as well, for the Queen who perpetually gives without ever receiving cannot sustain the very love that defines her.',
    strengths:['Vast and genuine capacity for unconditional love','Naturally gifted in the arts and creative expression','Emotionally steady and sustaining in relationships','Devoted, consistent, and deeply caring'],
    challenges:['Neglecting self-care in service of others','Attempting to sustain relationships that have run their course','Taking on emotional weight that belongs to someone else'] },
  { rank:'K',  suit:'hearts',   sym:'♥', name:'King of Hearts',   dates:'Jul 28, Aug 26, Sep 24, Oct 22, Nov 20, Dec 18',
    teaser:'The master of love, ruling by warmth rather than force and most himself when his actions bless the people around him. Watch for the quiet pile of disappointment that gathers when others fall short of you, because left alone it hardens into the very distance you stand against.',
    kws:['Wisdom','Mastery','Authority','Love'],
    personality:'The master of love rules his kingdom by love rather than dominance, and is most himself when his deeds bring blessing to others. You carry a rare, hard-won combination of emotional wisdom and practical intelligence, gravitating naturally toward leadership, teaching, or guidance; others sense your authority without your ever needing to announce it, for you hold your power in the silence of your knowing and are happy to let others take the glory. Within you lives a real source of inspiration and creative expression. The shadow is the quiet accumulation of disappointment when others fail to meet your expectations, which, left unexamined, can harden into guardedness and an emotional distance that contradicts everything you stand for.',
    strengths:['Emotionally wise and naturally authoritative','Gifted teacher, leader, or counsellor','Intellectually sharp with deep intuitive read of people','Loyal, principled, and magnetically trustworthy'],
    challenges:['Disappointment in others leading to emotional guardedness','Difficulty showing genuine vulnerability','Setting expectations that become impossible standards'] },

  // CLUBS
  { rank:'A',  suit:'clubs',    sym:'♣', name:'Ace of Clubs',     dates:'Dec 17',
    teaser:'The brightest, most restless mind in the deck, a pioneer in thought driven by a hunger to know that never quite switches off. You were the child who asked why ten thousand times, and the work of a lifetime is grounding all that brilliance in real human connection.',
    kws:['Knowledge','Curiosity','Independence','Pioneering'],
    personality:'Curiosity here meets a deep desire for love, and the result is the brightest, most restlessly inquisitive mind in the deck, a pioneer in thought driven by an insatiable need to know, understand, and explore. You were almost certainly the child who asked \'why?\' ten million times, and that hunger never really stops, which is part of why you stay young your whole life. Multi-talented and quick-witted, you are at your best building something genuinely new, and you long, at heart, to leave the world a better place. The shadow is the Ace\'s characteristic self-focus; intellectual drive this strong needs grounding in real human connection to truly flourish. Note: the Ace of Clubs is a semi-fixed card and Spiritual Twin to the 2 of Hearts.',
    strengths:['Brilliant, wide-ranging mind with genuine pioneering instincts','Natural ability to inspire confidence and curiosity in others','Multi-talented across many creative and intellectual fields','Driven by authentic desire to understand and improve the world around them'],
    challenges:['Tendency to neglect practical or financial details in pursuit of ideas','Independence that can shade into self-absorption','Scattering energy across too many interests without completion'] },
  { rank:'2',  suit:'clubs',    sym:'♣', name:'Two of Clubs',     dates:'Dec 16',
    teaser:'A natural diplomat living in the space between minds, happiest one to one and quietly brilliant at building bridges between people who disagree. Seeing every side so clearly has a cost, the indecision and avoidance that can quietly stand in for an honest hard truth.',
    kws:['Communication','Partnership','Diplomacy','Duality'],
    personality:'Cooperation and communication define this card, which lives in the space between ideas and people, a natural diplomat and connector of minds. Gifted, clever and quick-witted, you enjoy good conversation and relate best one-to-one, and you nearly always prefer partnership, personally and professionally. A finely tuned, creative mind gives birth to marvellous ideas you love to share, and you can be genuinely charming with a quick sense of humour. You also enjoy a little mental sparring, which is simply gymnastics for a mind like yours. The shadow is the Clubs tendency toward restlessness: too many perspectives without resolution, or diplomacy that quietly avoids the hard truths. You need real privacy too, without which stress can tip into mental and emotional chaos.',
    strengths:['Natural communicator and skilled diplomatic thinker','Able to hold and synthesise multiple perspectives at once','Warm, cooperative, and intellectually generous','Gifted at building bridges between opposing minds'],
    challenges:['Indecision from seeing every side with equal clarity','Avoiding necessary confrontation in the name of harmony','Mental restlessness when not anchored to a clear purpose'] },
  { rank:'3',  suit:'clubs',    sym:'♣', name:'Three of Clubs',   dates:'Dec 15',
    teaser:'The Writer\'s Card, a prolific mind that turns feeling into words and ideas faster than it can ever finish them. All that indecision you feel is really creative energy looking for somewhere to land.',
    kws:['Creativity','Expression','Ideas','Versatility'],
    personality:'Known as the Writer\'s Card, this is a prolific and restless mind with an extraordinary ability to generate ideas and bring them to life through words, art, or communication. You are most alive when creating, blessed with many natural talents and a rare gift for finding value and meaning in unexpected places, and your giving nature makes you a treasured partner and friend. The challenge is the sheer abundance of that creative output: scattered projects and inspired beginnings without satisfying endings can become a pattern. The indecision you feel is really creative energy looking for somewhere to land, so the work is to learn to govern your own mind and pour it into the things you genuinely love.',
    strengths:['Prolific creative thinker with a gift for expression','Natural ability to find and create value in new ways','Versatile and effective across many fields','Warm, engaging, and genuinely inspiring to others'],
    challenges:['Creative energy scattered across too many unfinished projects','Mental worry and chronic indecision','Risk of generating value for others while neglecting their own direction'] },
  { rank:'4',  suit:'clubs',    sym:'♣', name:'Four of Clubs',    dates:'Dec 14',
    teaser:'Mental structure made into a gift, the natural teacher whose counsel others trust because it has been earned. Two things test you: certainty that hardens into stubbornness, and a streak of self-doubt that can quietly become your worst enemy.',
    kws:['Knowledge','Stability','Teaching','Reliability'],
    personality:'Mental structure is this card\'s gift, one of the most stable and secure energies in the deck: a natural teacher, thinker, and builder of reliable knowledge, known for sound judgment, sharp intuition, and progressive thinking. You are detailed, hard-working, and blessed with real endurance, with a special love of language that draws many to writing, communication, or even acting. Social by nature, you gather interesting people around you and prize developed intelligence and education. Others trust your counsel because it is earned. The challenge is twofold: a tendency toward intellectual rigidity, where certainty hardens into stubbornness, and a streak of self-doubt that can become your worst enemy. Believing in yourself is what secures your considerable success.',
    strengths:['Deeply reliable and practically intelligent','Natural teacher with well-organised, grounded knowledge','Persevering and methodical in all intellectual pursuits','Instinctive sense of the right course of action'],
    challenges:['Intellectual rigidity and resistance to perspectives outside their own','Overcritical of those who think differently','Can become fixed in established ways of knowing long past their usefulness'] },
  { rank:'5',  suit:'clubs',    sym:'♣', name:'Five of Clubs',    dates:'Dec 13',
    teaser:'The Adventurer, a born explorer of ideas and places who is never quite satisfied with what is already known. The catch is depth, because a mind always moving on to the next thing rarely tastes the reward of staying.',
    kws:['Curiosity','Change','Adventure','Restlessness'],
    personality:'The Adventurer is a born explorer of ideas, places, and perspectives, one of the most mentally restless cards in the deck, and for you variety truly is the spice of life. Warm, friendly and playful, you are never quite satisfied with what you already know, which keeps you forever seeking new learning and fresh experiences. Your laser-quick mind generates ideas at speed, and good fortune has a way of finding its way to your door. The shadow is the difficulty of going deep: a mind always moving on to the next thing rarely tastes the rewards of patient, sustained inquiry. Following through on your ideas, and slowing down enough not to act before you have thought, is the secret to your success.',
    strengths:['Insatiably curious and highly adaptable thinker','Thrives on intellectual variety and new horizons','Quick-witted, engaging, and energising communicator','Natural adventurer across both ideas and the physical world'],
    challenges:['Difficulty sustaining focus or long-term commitment','Restlessness that undermines consistency in work and relationships','Can mistake constant motion and novelty for genuine progress'] },
  { rank:'6',  suit:'clubs',    sym:'♣', name:'Six of Clubs',     dates:'Dec 12',
    teaser:'The Messenger, carrying a karmic responsibility in how truth is spoken and a powerful instinct for honest words. Many born here quietly fear their own gifts, and the worry and restlessness that follow are simply the price of that avoidance.',
    kws:['Intuition','Responsibility','Communication','Karma'],
    personality:'Known as the Messenger, this card carries intuitive intelligence and a karmic responsibility in speech and communication, gifted with a powerful attunement to truth and a duty to use language with honesty and care. There are real artistic talents here too, and once you find a belief system that rings true for you, you become genuinely unstoppable, for this is one of the most fortunate cards in the deck and dreaming big can bring you spiritual and material success at once. The shadow lies in avoidance: many born to this card fear their own psychic gifts, and worry, procrastination and restlessness are the price of that evasion. Action, and a disciplined practice of some kind, is the key that unlocks it all.',
    strengths:['Powerful and often psychic intuition','Deeply attuned to truth in speech and communication','Principled, reliable, and innately trustworthy','Strong natural sense of justice and responsibility'],
    challenges:['Fear of or resistance to their own psychic abilities','Chronic restlessness when avoiding their core mission','Karmic patterns connected to the misuse of power or words'] },
  { rank:'7',  suit:'clubs',    sym:'♣', name:'Seven of Clubs',   dates:'Dec 11',
    teaser:'One of the most intellectually gifted minds in the deck, sharpest where cool analysis meets genuine intuition. The same discernment can curdle into chronic worry and a demand for proof that blocks the very knowing that is your gift.',
    kws:['Analysis','Intuition','Spiritual inquiry','Perfectionism'],
    personality:'Mental refinement is the keynote of this eclectic, spontaneous, and spiritually complex card, one of the most intellectually gifted in the deck and deeply aware of what the world needs to become better. Charming, sociable and kind, you are at your most powerful when you combine sharp analytical thinking with genuine intuition, and your enthusiasm for sharing what you know has a way of inspiring others into action; you network, organise, and create on a large scale. The challenge is the 7\'s characteristic tension: a mind this discerning can tip into chronic worry, scepticism, or a demand for logical proof that blocks the very intuition that is your greatest gift. Trading fear for trust, faith and integrity is the work.',
    strengths:['Brilliant analytical mind with genuine creative originality','Highly intuitive and spiritually perceptive','Keenly aware of both human nature and broader social need','Natural ability to take ideas and bring them into the world'],
    challenges:['Chronic mental worry and inner tension','Demand for logical proof that blocks intuitive knowing','Tendency toward agnosticism or scepticism as a form of self-protection'] },
  { rank:'8',  suit:'clubs',    sym:'♣', name:'Eight of Clubs',   dates:'Dec 10',
    teaser:'Mental power and material mastery converging in one of the most fortunate cards in the deck, able to aim the mind at a goal and simply arrive. Undirected, that same force turns domineering and closed; its richest rewards come when it stays open and works alongside others.',
    kws:['Mental power','Success','Focus','Psychic strength'],
    personality:'Mental power and material mastery converge here in one of the most naturally gifted and fortunate cards in the deck, born into success and carrying a rare blend of mental clarity, psychological strength, and psychic sensitivity. You have an extraordinary ability to focus your mind with intention and move powerfully toward whatever you set out to achieve. Being highly sensitive to your environment, you need beauty and harmony around you to stay well. The shadow is the sheer intensity of that power: undirected, the same force that builds success can turn domineering or rigidly closed to outside views. The richest rewards come when you stay receptive and harness that will in partnership with others of like mind. Note: the 8 of Clubs is a fixed card in the Life Spread and a member of the Mystical Family of Seven.',
    strengths:['Extraordinary mental focus and clarity of intention','Naturally gifted at manifestation and achieving success','Psychic sensitivity combined with psychological depth','Highly capable and effective in virtually any field chosen'],
    challenges:['Rigidity in mental structures and deeply fixed ideas','Stubbornness in relationships when challenged intellectually','The intensity of this mind can be overwhelming to others'] },
  { rank:'9',  suit:'clubs',    sym:'♣', name:'Nine of Clubs',    dates:'Dec 9',
    teaser:'Universal wisdom and the close of the mental cycle, where every ending quietly opens onto something new. The great work is learning when to let go, of old beliefs, familiar patterns, and the need to always have the answer.',
    kws:['Completion','Wisdom','Letting go','Universal mind'],
    personality:'Universal wisdom and the completion of the mental cycle define this card, where every ending opens onto new beginnings and fresh possibility. Your life will always be filled with revelations and new learning, for you are a great thinker walking a path of creative mental development, carrying a vast intellectual range and a genuine calling to serve others through the sharing of knowledge. You are fond of pleasure too, sensuous and romantic by nature, and must guard against over-indulgence and the disappointment that unconscious action brings. The great work is learning when to let go, of outdated beliefs, familiar mental patterns, and the need to always have the answer, opening yourself instead to entirely new ways of seeing.',
    strengths:['Broad intellectual range and genuine, hard-won wisdom','Naturally drawn to education and the service of knowledge','Generous and inspiring in sharing insight and experience','Philosophical mind that grasps the largest possible picture'],
    challenges:['Difficulty releasing mental patterns that have run their course','Chaos or instability when out of alignment with their path','Tendency to connect with people or ideas that no longer serve growth'] },
  { rank:'10', suit:'clubs',    sym:'♣', name:'Ten of Clubs',     dates:'Dec 8',
    teaser:'The first of the Crown line and one of the most powerful minds in the deck, able to work circles around almost anyone. The danger is that when talent comes this easily it can be coasted on, and the full measure of what you could do goes unmet.',
    kws:['Achievement','Leadership','Discipline','Mental power'],
    personality:'The first card in the Crown line and one of the most intellectually powerful in the deck, this is the healer and teacher, blessed with a powerful, driving mind and fierce independence. You can accomplish almost anything you set out to do, contributing dependably to family and community and capable of working circles around everyone around you. So active a mind can make it genuinely hard to relax, and practices like meditation or yoga repay you richly. Relationships are a place of learning, since your strong will likes to be in control and career can feel more satisfying than partnership. The shadow is that without real self-discipline, abundant talent can be coasted upon, and the full measure of what you could achieve goes unmet.',
    strengths:['Exceptional intellectual potential and breadth of capability','Natural leader and authority in their chosen field','Generous and inspiring in sharing knowledge','Capable of achieving genuine world-class mastery'],
    challenges:['Self-discipline challenges that arise from things coming too easily','Can exceed traditional structures in ways that create isolation','Must learn to work within the limits of emotional connection, not above it'] },
  { rank:'J',  suit:'clubs',    sym:'♣', name:'Jack of Clubs',    dates:'Dec 7',
    teaser:'A mental genius and the deck\'s perpetual student, here to drag the future into the present and improve almost any system it touches. The brilliance is real, but without honesty and commitment it stays a stack of bright beginnings that never quite land.',
    kws:['Wit','Curiosity','Creative mind','Authentic self'],
    personality:'A mental genius and the perpetual student of the deck, quick-witted, creative, and intellectually playful, with an innovative, progressive mind and a natural entrepreneurial spirit. You are here to bring the future into the present, gifted at seeing how to improve the quality of life and the workings of almost any system, and able to dive deeply into whatever captures you, analyse it thoroughly, and present it with real clarity. You love to debate, and your mind runs so much faster than everyone else\'s that patience becomes a genuine discipline. The shadow is the Jack\'s avoidance of full maturity: the brilliance is real, but without honesty and commitment it becomes bright beginnings that never quite land. Living with authenticity is what lets the gifts take root.',
    strengths:['Quick-witted, creative, and mentally engaging','Authentically individual and difficult to put in a box','Emotionally and psychologically more resilient than they appear','Natural ability to connect ideas and people in fresh ways'],
    challenges:['Avoiding the responsibility that comes with genuine intellectual gifts','Tendency to deflect with humour or cleverness when depth is called for','Choosing depth over novelty remains the ongoing work'] },
  { rank:'Q',  suit:'clubs',    sym:'♣', name:'Queen of Clubs',   dates:'Dec 6',
    teaser:'The administrator of knowledge, pairing genuine intellectual mastery with a rare spiritual sensitivity, gifted less at knowing than at passing what she knows to others. Stretched too thin, that strong will can tip into stress and drama, so a solid inner base is what keeps her balanced.',
    kws:['Intuition','Knowledge','Wisdom','Balance'],
    personality:'The administrator of knowledge, this is one of the most intuitively intelligent cards in the whole deck, combining genuine intellectual mastery with rare spiritual sensitivity. Masterful at whatever you choose, you are destined for success through a brilliant mind, generous intuitive gifts, and a gracious personality, and your real talent is not merely knowing but transmitting: inspiring, counselling, and guiding others toward truth with warmth and precision. You carry tremendous pride and a need to let the world see what you are capable of. The challenges are real: a tendency to over-extend into stress, and a strong will that, when uncertain or stretched too thin, can turn dramatic or neurotic. A solid spiritual base and honest self-expression are what keep you balanced. Remember, you are the Queen.',
    strengths:['Exceptional intuitive intelligence and mental clarity','Natural counsellor, teacher, and guide','Balances intellectual rigour with genuine spiritual openness','Nurturing and generous in the sharing of knowledge and insight'],
    challenges:['Can carry the mental and emotional weight of others as her own','Sacrifice patterns that need to be managed consciously','Difficulty maintaining clear boundaries around energy and time'] },
  { rank:'K',  suit:'clubs',    sym:'♣', name:'King of Clubs',    dates:'Dec 5',
    teaser:'This King rules by what he knows, a specialist and authority who rarely bends to anyone else\'s doctrine. The crown he wears is authenticity, and keeping it asks for constant self-transformation, the willingness to question and rebuild himself again and again.',
    kws:['Mental mastery','Authority','Wisdom','Self-transformation'],
    personality:'This King rules the mental realm of intelligence, knowledge, and intuition, holding power through what he knows: a specialist, a thinker, and an authority in whatever field he chooses to master. Blessed with a great mind and an innate wisdom, you communicate what you know with ease and can become an authority in business, the arts, science, or politics. You are the master of your own thinking, rarely bound by the doctrines of others, and you wear what might be called the crown of authenticity, carrying a commanding presence, natural grace, and a good sense of humour. The inner work of this card is constant self-transformation: real authority is earned not only through knowledge but through the ongoing willingness to question, shed, and rebuild yourself.',
    strengths:['Mastery-level intellectual authority in their chosen field','Natural leader and specialist who earns deep, lasting respect','Driven by ideas, knowledge, and the ongoing pursuit of growth','Excellent at building powerful and purposeful professional networks'],
    challenges:['Argumentativeness or mental rigidity when their authority is challenged','Spiritually minded but can be practically demanding and exacting','True growth requires releasing as much as acquiring, a hard lesson for a King'] },

  // DIAMONDS
  { rank:'A',  suit:'diamonds', sym:'♦', name:'Ace of Diamonds',  dates:'',
    teaser:'Imagination put straight into action, a visionary and natural pioneer in the making of value. The lifelong tension sits between the drive to achieve and the longing for real love, because fierce independence can quietly crowd out the very intimacy you want.',
    kws:['Ambition','Independence','Value','Pioneering'],
    personality:'Imagination in action drives this card, a true visionary and natural pioneer in commerce, enterprise, and the creation of value. Brilliant, charming, and endlessly resourceful, you have amazing perceptual skills, an extraordinary capacity to influence others, and a goodhearted love of play; travel and change of any kind suit the restless side of your nature. You are ambitious, independent and energetic, motivated by both money and love, and quietly driven by a wish to improve the quality of life for others. The great tension of this card lies between professional ambition and the longing for genuine love: the relentless pursuit of achievement can quietly eclipse the hunger for connection, and your fierce independence can complicate intimacy until the two are brought into honest reckoning.',
    strengths:['Brilliant, resourceful, and naturally entrepreneurial','Powerful charm and rare ability to inspire confidence in others','Quick mind with an innate instinct for where value lies','Pioneer energy that drives genuine originality and innovation'],
    challenges:['Independence that can shade into isolation or avoidance of real intimacy','Love and personal life can suffer in the relentless pursuit of achievement','Fear of negotiation or compromise must be overcome to fully thrive'] },
  { rank:'2',  suit:'diamonds', sym:'♦', name:'Two of Diamonds',  dates:'',
    teaser:'Where logic meets intuition, a natural negotiator who builds arrangements that genuinely work for everyone involved. The shadow is bringing that same transactional eye home, into relationships where worth was never meant to be measured.',
    kws:['Partnership','Values','Balance','Negotiation'],
    personality:'Where logic meets intuition, this card lives at the intersection of relationship and value: a natural negotiator, collaborator, and builder of mutually beneficial arrangements. Blessed with sound logic and excellent intuition, you find that following your instincts reliably leads to success while ignoring them does the opposite. You are spurred into action by a sense of mission, have real organisational gifts, and delight in the wheeling and dealing that makes this one of the most successful cards in the deck; you are happiest when productive and seem to know instinctively how to make money. The shadow is a tendency to bring that same transactional lens to personal relationships, where worth is not always something that can, or should, be measured.',
    strengths:['Natural negotiator and skilled architect of strong partnerships','Deeply attuned to the value of people, agreements, and situations','Cooperative and strategically thoughtful','Exceptional ability to find common ground and create mutual benefit'],
    challenges:['Unconsciously measuring relationships in terms of return or fairness','Indecision when two paths appear equally valuable','Fear of being undervalued or taken advantage of in agreements'] },
  { rank:'3',  suit:'diamonds', sym:'♦', name:'Three of Diamonds', dates:'',
    teaser:'A colourful, inventive mind that finds worth in the places other people overlook and refuses to be like everyone else. The familiar pull between freedom and security can spin into worry-driven circles until that restless creativity finally gets a channel.',
    kws:['Creativity','Versatility','Expression','Uncertainty'],
    personality:'A colourful character with a bright, inventive mind, artistic and romantic by nature and forever drawn to the unusual, you have a real flair for creative value-making, finding worth and meaning in places others overlook. Your agile mind needs to be challenged and entertained, and you will always look for innovative ways to express who you truly are; you are not here to be like everyone else. The challenge, common to all Threes, is the pull between freedom and security, and a worry-driven indecision that can have you going in circles. Left unapplied, that restless creativity curdles into confusion. The discipline of sustained commitment is what grounds you, and love, where your greatest learning happens, is where it matters most.',
    strengths:['Bright, inventive, and creatively original mind','Natural talent for finding, making, and promoting value','Versatile and effective across many fields and ventures','Expressive, socially engaging, and genuinely inspiring'],
    challenges:['Uncertainty and restlessness as a recurring life pattern','Difficulty committing to one path or project long enough to master it','Can move between ventures, jobs, or relationships before depth is fully reached'] },
  { rank:'4',  suit:'diamonds', sym:'♦', name:'Four of Diamonds', dates:'',
    teaser:'One of the most financially grounded cards in the deck, a steady builder of lasting value and the dependable backbone of any enterprise. The paradox is the restlessness hidden inside all that stability, and the rigidity that can quietly close you off from the growth only change brings.',
    kws:['Security','Stability','Material foundation','Discipline'],
    personality:'Stability in values is this card\'s whole nature, one of the most financially grounded and materially secure in the deck, a natural builder of lasting value and practical abundance. You carry a responsibility to integrity and find genuine contentment in being diligent with what you value; you are happiest when working, naturally suited to business, and well cast as the dependable backbone of any enterprise. The paradox is that for all your love of stability, there is an innate restlessness in you that can surface as insecurity, uncertainty, or self-doubt about your choices. The deeper challenge is the rigidity that often accompanies such groundedness: the security you build so carefully can harden into stubbornness, closing you off from the growth that only change can bring.',
    strengths:['Exceptional capacity for building lasting financial security','Detailed, organised, and practically gifted in material matters','Deeply reliable in commitments, agreements, and partnerships','Intellectually motivated with a continuously evolving career'],
    challenges:['Rigidity or stubbornness in financial and material thinking','Can become so focused on security that joy and flexibility are squeezed out','Physical and psychological self-development requires sustained, deliberate effort'] },
  { rank:'5',  suit:'diamonds', sym:'♦', name:'Five of Diamonds', dates:'',
    teaser:'A seeker of truth and one of the most adaptable cards in the deck, turning setbacks into stepping stones through sheer trial and error. The risk is spending all that energy forever moving on, rather than building something that lasts.',
    kws:['Change','Resourcefulness','Values','Freedom'],
    personality:'A seeker of truth, one of the most resourceful and adaptable cards in the deck, forever looking for the deeper value and worth of whatever stands before you. Adventurous and gifted with good intuition, you love change and the freedom to explore, and you have a rare ability to make progress through trial and error, turning setbacks into stepping stones. You are a natural salesperson who can sell anything you truly believe in, highly relatable, and trusted by others because you share your wisdom with compassion rather than expectation. The shadow is an instability in values and resources, and a restlessness in both work and love; without deliberate grounding, you can spend your energy perpetually moving on rather than building something that endures.',
    strengths:['Highly resourceful and skilled at improving difficult situations','Adapts quickly and thrives when problem-solving is required','Practically useful, energetic, and committed in their work','Natural ability to reach and communicate with many different people'],
    challenges:['Instability in finances or material resources as a recurring life pattern','Difficulty settling on one path of value long enough to reach mastery','Must consciously shed unhealthy patterns rather than simply moving on from them'] },
  { rank:'6',  suit:'diamonds', sym:'♦', name:'Six of Diamonds',  dates:'',
    teaser:'A card of karmic return, where abundance arrives in exact proportion to what you put in and nothing here is ever passive. The lesson hiding inside the effort is a quiet one: knowing when enough is truly enough.',
    kws:['Karma','Intuition','Fulfilment','Sustained effort'],
    personality:'Responsibility to values is the heart of this card, which operates squarely within the law of karmic return: abundance flows in direct proportion to the energy invested, and you receive exactly what you earn. Blessed with great intelligence, sound intuition, and a remarkable psychic attunement, you are genuinely gifted at counselling others and at finding fulfilment in what life provides. You have a strong physical constitution, too, shared by many world-class athletes, and a natural sense of financial responsibility that dislikes carrying debt. Strong-willed as you are, flexibility and harmonious surroundings keep you healthy and happy. The challenge is the ongoing effort this card requires: success here is never passive, and the karmic lesson is knowing when enough is truly enough.',
    strengths:['Powerful intuition, often bordering on the psychic','Exceptional counselling wisdom and practical insight','Deeply attuned to the art of finding fulfilment in the present','Steady, sustained success built through genuine dedicated effort'],
    challenges:['Success demands constant energy and cannot be taken for granted','Reaching for more than this card\'s natural harvest leads to discontentment','Karmic lessons around knowing when enough is truly enough'] },
  { rank:'7',  suit:'diamonds', sym:'♦', name:'Seven of Diamonds', dates:'',
    teaser:'The millionaire\'s card, the meeting of spirit and matter, where money becomes the very place you learn faith and trust. It asks for a narrow, single-pointed focus and the willingness to release the values and relationships that have outlived their use.',
    kws:['Discernment','Self-development','Focus','Transformation'],
    personality:'Known as the millionaire\'s card, the 7 of Diamonds represents the union of spirit and matter, and the work of a lifetime is bringing those two into balance. Highly creative, nurturing and caring, you hold your loved ones dear and will sacrifice for them, though guarding against self-sacrifice, and letting yourself receive, is part of the path. Money is a major theme here, the very place you learn faith and trust, for when you manifest your creativity in practical ways your worries become your successes. The shadow is the discipline this asks: you must hold your focus on one thing with absolute clarity and be willing to release outdated values, skills, and relationships to clear the way. Note: the 7 of Diamonds is a semi-fixed card and Spiritual Twin to the 9 of Hearts.',
    strengths:['Extraordinary potential for material and financial achievement','Deeply self-directed and capable of sustained single-pointed focus','Tough, resilient, and forged by the challenges that define them','Highly discerning about what is truly worth their time and energy'],
    challenges:['Must be willing to release anything no longer aligned with their vision','Scattered focus produces very little; the path to success is a narrow one','Constant change in career and business is a feature, not a flaw, of this card'] },
  { rank:'8',  suit:'diamonds', sym:'♦', name:'Eight of Diamonds', dates:'',
    teaser:'The Sun Card, genuine material power and a mind that draws money in with surprising ease, best of all when it answers to no boss but itself. Beneath the steel runs real care for others, shadowed by a mistrust of intimacy that quietly argues with the heart\'s own longing.',
    kws:['Power','Material mastery','Organisation','Responsibility'],
    personality:'Sometimes called the Sun Card or the card of luck, this is genuine material power: a deep capacity to manage, organise, and govern in the realm of value and resources, paired with a brilliant mind that draws money your way with surprising ease. You focus intention toward your goals like few others, carry real personal strength and creative intelligence, and tend to be respected wherever you work, doing best as your own boss. Beneath the steely exterior runs an inner drive toward fairness and care for others. Two shadows ask for attention: a tendency to turn domineering or stubborn and hold your expectations of people too high, and a quiet mistrust of intimacy that sits at odds with the heart\'s genuine longing to love and be loved.',
    strengths:['Exceptional organisational ability and material mastery','Strong sense of fairness, trustworthiness, and practical responsibility','Deep inner drive to protect and empower others','High capacity to manifest and build lasting material success'],
    challenges:['Deep mistrust of intimate relationships as a lifelong undercurrent','Can become domineering when the power instinct is not consciously tempered','Must develop self-worth that is genuinely independent of financial standing'] },
  { rank:'9',  suit:'diamonds', sym:'♦', name:'Nine of Diamonds', dates:'',
    teaser:'The one who gives, among the most generous cards in the deck, called to champion the underdog and bring people together around their gifts. Its whole lesson is release, because money flows most freely through you when it is something to pass on rather than to hold.',
    kws:['Completion','Generosity','Philanthropy','Release'],
    personality:'The one who gives, this is among the most generous and philanthropic cards in the deck, a soul with a real calling to serve the less fortunate and champion the underdog. You are gifted with excellent communication and a gregarious open-heartedness; people naturally trust you, and you excel at bringing others together to share their gifts. Highly intelligent and global in your thinking, you thrive on mental stimulation and the company of witty, intelligent people, and your discernment tells you unerringly what is truly worthwhile. The life lesson is the release of attachment to material wealth: money and resources flow most freely through you when seen as something to pass through and on, rather than to hold and accumulate.',
    strengths:['Genuinely generous, open-hearted, and naturally philanthropic','Powerful manifesting ability when backed by real self-worth','Deep intuitive and psychic attunement to truth in situations','Natural orator with an engaging, warm, and often humorous presence'],
    challenges:['Resentment when power or recognition feels withheld or unearned','Spendthrift tendencies when the card\'s shadow side is expressed','Must release attachment to material outcomes in order to fully receive them'] },
  { rank:'10', suit:'diamonds', sym:'♦', name:'Ten of Diamonds',  dates:'',
    teaser:'A card of fortunate blessings that holds the entire Diamond suit, optimistic and sure of its own worth even down to the last dollar. The secret is almost too simple: work hard for what you want, and be grateful for what you already have.',
    kws:['Abundance','Self-worth','Optimism','Responsibility'],
    personality:'A card of fortunate blessings, the 10 of Diamonds encompasses the entire Diamond suit, material success, sustained activity, and the full spectrum of value in its most complete expression. You carry a naturally optimistic outlook and a strong innate sense of your own worth, and even down to your last dollar, something always spurs you to manifest income afresh. People trust you, which makes working with the public rewarding, and when you focus your considerable powers, you can make almost anything happen. The secret is simply this: work hard for what you want, and be grateful for what you have. The shadow is the weight that comes with such material engagement, for real success here demands constant, grounded stewardship rather than optimism alone.',
    strengths:['Naturally optimistic with a strongly developed sense of self-worth','Broad capacity for achievement spanning the full range of material values','Understands deeply that real abundance has a price, and pays it willingly','Steady and sustained in engaging with financial responsibilities'],
    challenges:['Overoptimism or unrealistic self-assessment can create expensive blind spots','The weight of constant responsibility must be actively and consciously managed','Developing emotional connections alongside material ones is ongoing work'] },
  { rank:'J',  suit:'diamonds', sym:'♦', name:'Jack of Diamonds', dates:'',
    teaser:'The golden child of the suit, quick-witted and charming, with sharp financial instincts and a gift for persuasion that can manifest things at startling speed. The shadow is immaturity, the clever charm that turns unreliable, so the real work is pouring all that brilliance into genuine integrity.',
    kws:['Persuasion','Resourcefulness','Independence','Youthful values'],
    personality:'Creative independence is the signature of this card, the golden child of the suit: quick-witted, charming, highly intuitive, and blessed with sharp financial instincts and a natural gift for persuasion. Freedom is your middle name, and you bring an exuberant energy to everything you touch, often making things manifest at impressive speed; your intuitive, perceptive nature also makes you a natural therapist, counsellor, or healer. You can be social and fond of the limelight one moment and quiet, refined, and craving your own world the next. The shadow is a tendency toward immaturity: at its lowest, this card turns clever but unreliable, even cunning, breaking commitments to those who believed in it. The great work is channelling real brilliance into genuine integrity and depth of character.',
    strengths:['Sharp financial instincts and a natural, disarming gift for persuasion','Exuberant, magnetic, and genuinely enjoyable to be around','Thrives on independence, self-direction, and entrepreneurial enterprise','Fast-moving mind with a real visionary streak and strong intuition'],
    challenges:['Immaturity, unreliability, or the breaking of promises','Can become absorbed in their own story to the point of self-deception','Life will periodically place deep challenges in the path to force true self-awareness'] },
  { rank:'Q',  suit:'diamonds', sym:'♦', name:'Queen of Diamonds', dates:'',
    teaser:'The cultivator of high value, determined and cultured, who knows exactly what she wants and earns it through sheer consistency. The path is genuinely hard, and her own high standards can turn critical and demanding if she lets them run unchecked.',
    kws:['Refinement','Excellence','Determination','Material mastery'],
    personality:'The cultivator of high value, gifted with a highly developed intelligence, keen perceptual skills, and tremendous endurance, you embody the wisdom of higher values and quietly exemplify them for others. Cultured and determined, you know exactly what you want and approach your goals with a consistency, diligence, and perseverance that commands real respect, which is why you so often find yourself in positions of authority and leadership. Loving, generous, courageous and inventive, you also read people with ease. The path is not an easy one, beset with genuine difficulty and demanding resilience alongside ambition, and your high standards can tip into being overly critical, judgmental, or demanding if left unchecked. The reward is a life of real excellence, built entirely by your own hand.',
    strengths:['Exceptional ability to identify, develop, and elevate genuine value','Determined, diligent, and strong of character under real pressure','Refined focus capable of producing world-class, lasting results','Earns deep and lasting respect through consistent effort and excellence'],
    challenges:['The path is genuinely demanding and rarely without serious obstacles','Risk of hardness or dominance when under prolonged pressure','Unrealistically high standards, when unchecked, breed chronic dissatisfaction'] },
  { rank:'K',  suit:'diamonds', sym:'♦', name:'King of Diamonds', dates:'',
    teaser:'Master of higher values, ruling money and manifestation through a rare blend of decisive action and real care for people over numbers. The old portrait shows him in profile with one eye hidden, a quiet warning about the one-sided thinking he has to work against.',
    kws:['Financial mastery','Leadership','Self-awareness','Wisdom'],
    personality:'Master of higher values, this King holds dominion over the realms of money and manifestation, ruling through a rare combination of decisive action and love. A visionary leader in business and commerce, you carry an innate wisdom for making things work and, with a disciplined mind and genuine values, an understanding of the very laws of abundance and integrity, all of it tempered by a warmth and fairness that places people before numbers. Sociable and ambitious from early life, you are drawn to leadership, self-improvement, and the company of exceptional minds. The classic portrait shows this King in profile, a single eye visible, a hint of the stubbornness and one-sided thinking you must consciously work against on the road to lasting authority.',
    strengths:['Phenomenally gifted in business, value creation, and material leadership','Leads with genuine fairness and a deep care for the people around them','Passionate about self-improvement and relentlessly committed to growth','Sociable, magnanimous, and genuinely inspiring in their presence'],
    challenges:['Psychological and health challenges that periodically force necessary inner work','Can feel profoundly stuck until the inward journey is honestly undertaken','Must eventually learn that material wealth, for all its beauty, cannot purchase true fulfilment'] },

  // SPADES
  { rank:'A',  suit:'spades',   sym:'♠', name:'Ace of Spades',    dates:'',
    teaser:'The Key to the Mystery of Life, pictured as the Magician and the most spiritually charged card in the whole deck, a soul that reinvents itself through hardship and comes back stronger each time. The lifelong tug is between the hunger for wisdom and the drive to succeed, and the secret is making room for the love the whole journey is actually for.',
    kws:['Transformation','Spirituality','Wisdom','Independence'],
    personality:'Called the Key to the Mystery of Life, and pictured as the Magician, the Ace of Spades is the most spiritually charged card in the entire deck: a soul called to profound personal transformation, reinventing itself through adversity and emerging stronger each time. You carry a magnetic, almost psychic quality that draws others to you for guidance they cannot fully explain, and an incredible intelligence that could see you move through several distinct careers in one lifetime. At your core runs a tug of war between the desire for wisdom and the drive to succeed in worldly ways; the secret is a balance that honours both. The great work is learning that your fierce drive for self-definition must make room for love, which is, ultimately, what the journey is for.',
    strengths:['Deeply spiritual, psychic, and magnetically compelling to others','Extraordinary capacity for self-transformation and personal renewal','Courageous ability to look unflinchingly into the self','Remarkable precision in reading people and situations'],
    challenges:['Intense independence and drive for self-definition can come at the cost of loved ones','Must learn to balance ambition with genuine emotional availability','The path requires repeated, sometimes painful, shedding of identity'] },
  { rank:'2',  suit:'spades',   sym:'♠', name:'Two of Spades',    dates:'',
    teaser:'The friendship card, a soul building real self-sufficiency through honest connection and the discovery of its own strength. The truth it keeps proving, over and over, is that the finest resource you will ever meet is the one already inside you.',
    kws:['Partnership','Self-reliance','Inner strength','Health'],
    personality:'Known as the Aquarian card and the friendship card of the deck, the 2 of Spades is a soul developing powerful self-sufficiency through authentic connection and the discovery of individual strength. You carry companionship, support and compassion in your nature, prefer to work and live in partnership, and find that giving guidance comes effortlessly; on a spiritual path you readily become a teacher or leader and gain recognition for it. Your considerable determination, passion and strength can even be intimidating to others, which would surprise you. When out of sorts, that energy can collapse into fear, passivity, or shyness. The great truth of this card is that the finest resource you will ever meet is the one already within you, and life keeps arranging itself to prove it.',
    strengths:['Powerful capacity to develop genuine inner strength and self-sufficiency','Natural ability to attract the right partnerships and healing at the right time','Authentic, individualistic, and solid in their unique way of being','Real grit and resilience through life\'s most demanding passages'],
    challenges:['Can find themselves in difficult situations before recognising their own power to handle them','Partnership energy must be balanced with genuine personal independence','Learning not to outsource inner knowing to the opinions of others'] },
  { rank:'3',  suit:'spades',   sym:'♠', name:'Three of Spades',  dates:'',
    teaser:'The Artist card, a powerhouse of creative energy and warmth with an unexpected head for business underneath. The familiar shadow is indecision around work, the gift left unused in the safety of the status quo, until you finally believe in yourself.',
    kws:['Creativity','Expression','Indecision','Work'],
    personality:'Known as the Artist card, the 3 of Spades is a powerhouse of creative energy, magnetic personality, and a genuine desire to help others, paired, less obviously, with a sharp mind for business. You carry real talent and a warm, expressive spirit that people are drawn to, and when you apply the mastery of this card in practical ways, with effort and integrity, success is all but guaranteed. The shadow is the 3\'s characteristic indecision around work and career: the very abilities that qualify you for your highest expression can be quietly left unused in the safety of the status quo. Believing in yourself is the key that unlocks the door, and fostering real self-love is what finally lets love be realised.',
    strengths:['Powerfully creative with genuine, broad artistic talent','Magnetic personality and instinctive desire to help','Warm, strong social presence that draws people in','Naturally aligned with strong mentors, particularly women in leadership'],
    challenges:['Work-related indecision as a recurring karmic theme','Risk of settling far below what these gifts actually deserve','Worry about reputation, gossip, and the opinions of others'] },
  { rank:'4',  suit:'spades',   sym:'♠', name:'Four of Spades',   dates:'',
    teaser:'The builder of the Spades suit, with a focus and willpower so unmatched you will often choose the harder road on purpose. The work is staying loose enough to play, letting worry and routine give way before they quietly turn into stagnation.',
    kws:['Stability','Discipline','Work ethic','Security'],
    personality:'Personal strength and willpower are the gifts of this quietly powerful card, the builder of the Spades suit, whose ability to focus and move through obstacles is all but unsurpassed, so much so that you will often choose the harder path to get where you are going. Work and productivity matter deeply to you, and you are happiest when busy with something you love; reliable, intelligent, intuitive and personable, you find real satisfaction in honest effort and prefer to be your own boss. A strong constitution tends to bless you with good health, and your endurance and dependability toward those you love know no equal. The challenge is to stay receptive and flexible, letting worry, stubbornness, and routine give way to play and adventure.',
    strengths:['Exceptional work ethic and capacity for sustained, disciplined effort','Deeply reliable and genuinely organised in all that they undertake','Finds real satisfaction and pride in honest, thorough work','Natural builder of security, health, and enduring structure'],
    challenges:['Can become so anchored in routine that necessary change is resisted','Overcritical when others do not meet the same high standards of effort','Must ensure that the stability they build does not quietly become stagnation'] },
  { rank:'5',  suit:'spades',   sym:'♠', name:'Five of Spades',   dates:'',
    teaser:'Change itself, a card whose very presence tends to set it in motion, and one of the most driven self-improvement energies in the deck. The shadow is the intensity of all that restlessness, the constant moving, and learning to balance company with solitude.',
    kws:['Change','Progress','Self-improvement','Restlessness'],
    personality:'Change is the dynamic at the centre of this card, and your very presence tends to act as a catalyst for it. Gifted with a good sense of values and strong intuition, you are usually well-liked, often genuinely popular, with admirers you secretly enjoy even when the attention grows overwhelming. The desire to experience life can run stronger than the desire to accomplish, and that is fine: travel, adventure, and new people all feed fresh self-awareness in you. This is also one of the most driven self-improvement cards in the deck, pushing beyond ordinary limits in great leaps. The shadow is the intensity of that restlessness, frequent changes of place, circumstance, or relationship, and learning to balance company with solitude is part of the path.',
    strengths:['Extraordinary natural capacity for self-transformation at every level','Driven and deeply resourceful in the face of health and life challenges','Makes bold, decisive leaps in personal growth when the time is right','Converts negative energy and old habits into real, lasting strength'],
    challenges:['Restlessness producing frequent moves, career changes, or relationship transitions','The consolidation periods between leaps feel deeply uncomfortable','The intensity of this inner drive can be genuinely difficult for others to keep pace with'] },
  { rank:'6',  suit:'spades',   sym:'♠', name:'Six of Spades',    dates:'',
    teaser:'Often called the conscience of humanity, carrying one of the heaviest karmic legacies in the deck, with many born here sensing their lives are somehow fated. They are, but the power short-circuits into inertia whenever the will goes unsupported; align with something higher and act, and life turns genuinely magical.',
    kws:['Karma','Responsibility','Conscience','Adjustment'],
    personality:'Often called the conscience of humanity, the 6 of Spades carries one of the most powerful karmic legacies in the deck, and many born to it feel their lives are somehow fated or destined. They are. With strong traits of honesty, fairness, responsibility and kindness, you hold real potential to be a force for alignment between the visible world and the higher laws that govern it, and unlimited potential for recognition once you take responsibility for the power you were born with. This is a dreamy card, though, prone to fantasy and escapism, and your greatest enemies are laziness and procrastination. The shadow is inertia: when the heart is confused and the will unsupported, this card\'s power can turn in on itself. Align with higher wisdom and act, and life becomes magical.',
    strengths:['Tremendous willpower, inner determination, and staying power','Deep karmic potential when responsibility is honestly embraced','Vision and conscience for aligning reality with higher principle','Highly creative and capable of extraordinary achievement when inspired'],
    challenges:['Indecision and confusion in matters of love as a persistent karmic challenge','Inertia when responsibilities feel overwhelming or in conflict with personal goals','Power can be short-circuited by superficiality, gossip, or avoidance of depth'] },
  { rank:'7',  suit:'spades',   sym:'♠', name:'Seven of Spades',  dates:'',
    teaser:'The card of the mystic and the artist, an old soul asked to build unshakeable faith through the repeated testing of the material world. Its trap is aiming that inner power at outward magnificence, when the real treasure has always lived within.',
    kws:['Wisdom','Faith','Spiritual testing','Self-mastery'],
    personality:'The card of the mystic and the artist, the 7 of Spades is one of the most spiritually demanding in the deck: an old soul called to develop unshakeable faith through the repeated testing of the material world. Very intuitive and extremely sensitive to those around you, you carry an acute understanding of human nature and a perceptive intelligence that works quietly, often behind the scenes; surrounding yourself with beauty and serenity is essential to your wellbeing. Your natural ingenuity can bring real success in the arts or metaphysics, and you hold within you the power to transform and to see beyond apparent limitations. The shadow is the misdirection of that inner power toward a longing for outward magnificence, when the real treasure, immense as it is, has always lived within.',
    strengths:['Profound accumulated wisdom and perceptive understanding of people','Exceptional memory, psychological acuity, and natural insight','Capable of genuine self-mastery when the inward journey is embraced','Natural psychologist, writer, or world traveller'],
    challenges:['Material discontent when life is lived beyond natural and sustainable means','Health and stress challenges tied to worry and frustrated ambition','Must redirect power inward, from the longing for magnificence to the finding of it'] },
  { rank:'8',  suit:'spades',   sym:'♠', name:'Eight of Spades',  dates:'',
    teaser:'Endurance in a single word, an intense, almost psychic force of will working from somewhere deep inside rather than out front. The whole task is giving that force a grounded direction, because the same will that moves mountains can, misdirected, turn against the self.',
    kws:['Willpower','Inner power','Transformation','Discipline'],
    personality:'Endurance is the one word for this card, one of the most internally powerful in the deck: not the commanding outer authority of the King, but an intense, often psychic force of will working from deep within. Blessed with strong determination and the ability to follow through on anything, you are a natural overcomer of adversity with a genuine gift for healing and for work in health and medicine, and a brilliant, creative mind that can equally find success in business or technology. Success is assured if you are willing to work hard, and being acknowledged for that work spurs you to excel further. The great work is giving this force a positive, spiritually grounded direction, and guarding your health, since the same will that moves mountains can, misdirected, turn against the self.',
    strengths:['Extraordinary inner willpower and depth of concentration','Natural overcomer of obstacles, adversity, and serious health challenges','Genuine capacity to heal and transform others through presence and will','Develops superb leadership ability under real, sustained pressure'],
    challenges:['Tendency toward a negative or fatalistic outlook that must be actively and consciously countered','Can feel profoundly stuck until the inner journey is honestly undertaken','The intensity of this card\'s power is a genuine responsibility, not merely a gift'] },
  { rank:'9',  suit:'spades',   sym:'♠', name:'Nine of Spades',   dates:'',
    teaser:'Spiritual liberation, one of the most magnetic and emotionally intense cards in the deck, of unlimited possibility for those who read their lives the right way. The shadow is the sheer depth of that intensity, and the path to freedom runs directly through it, never around.',
    kws:['Completion','Spiritual liberation','Service','Letting go'],
    personality:'The esoteric meaning of the 9 of Spades is spiritual liberation, making it one of the most magnetically powerful and emotionally intense cards in the entire deck, and one of unlimited possibility for those who read their lives the right way. Born with an inherent spiritual nature that taps higher knowledge, you are intelligent, artistic, original and unconventional in your thinking, frequently musically gifted, and called to a life of universal service in which your magnetism and capacity for leadership can become extraordinary. This is a card of accomplishment or disappointment depending entirely on how you choose to interpret what happens, so an impersonal approach that keeps you balanced and on course is the key. The shadow is the depth of its emotional intensity; the path to liberation moves directly through it, never around.',
    strengths:['Tremendous personal magnetism and natural authority in any room','Genuine, deep calling toward service, leadership, and the healing of others','Capable of managing significant responsibilities and large-scale endeavours','Original, unconventional, and deeply spiritual approach to wisdom'],
    challenges:['Intense inner emotional conflicts and psychosomatic stress as recurring patterns','Flirtatious or restless in love, with difficulty sustaining genuine depth','Must learn to sublimate rather than suppress the emotional intensity that defines them'] },
  { rank:'10', suit:'spades',   sym:'♠', name:'Ten of Spades',    dates:'',
    teaser:'Success is the keyword, a card both deeply materialistic and highly spiritual, with the whole challenge living in the polarity between the two. The great secret runs against everything its drive believes: surrender, let yourself be nurtured, and the freedom hidden inside acceptance opens up.',
    kws:['Effort','Mastery','Self-love','Abundance'],
    personality:'Success is the keyword for the 10 of Spades, a card both strongly materialistic and highly spiritual, and the challenge, and the gift, lies in the polarity between the two. The invitation is to go beyond the material while fully mastering it, attaining spiritual awareness without surrendering worldly success. This is driven energy that accomplishes every goal it commits to, powered by a sophisticated intelligence, and you thrive in the company of like-minded people; isolation, by contrast, can lead to misfortune and even poor health. Ambitious as you are, confusion between love and work is a recurring theme, and too much weight on career can starve your relationships. The great secret is surrender: focus on your feelings, allow yourself to be nurtured, and the freedom hidden inside acceptance opens up.',
    strengths:['Exceptional capacity for sustained, demanding work across every dimension of the self','Encompasses the full breadth of Spades wisdom within one lifetime','Developing profound self-love and the ability to feel at home in all of life','Can reach extraordinary levels of mastery through committed self-development'],
    challenges:['The weight of constant responsibility must be actively and consciously managed','Must guard against the inner critic turning the same high standards against the self','Learning to surrender to what the path truly asks, rather than resist it'] },
  { rank:'J',  suit:'spades',   sym:'♠', name:'Jack of Spades',   dates:'',
    teaser:'The Divine Trickster, the actor and the initiate, brimming with creative power not yet claimed and a path that is genuinely yours to choose. Genius and charisma are real here, but they are not yet wisdom, and wisdom is exactly what this card came to earn.',
    kws:['Creativity','Spiritual initiation','Rebellion','Self-discovery'],
    personality:'The card of the actor, the thief, and the spiritual initiate, the Jack of Spades is the Divine Trickster of the deck, brimming with creative potential and mental power not yet fully claimed. This card can become the King of Spades, a powerful and responsible leader, or a crafty figure who cannot be trusted; the path is genuinely the individual\'s to choose. You carry the rare ability to use your mind to initiate almost anything, an irrepressible individualism, and a constant, renewing stream of self-discovery, with enthusiasm that turns to conviction and conviction to success. The shadow is how easily these gifts aim toward the clever shortcut rather than the meaningful life: genius and charisma are real, but they are not yet wisdom, and wisdom is what this card is here to earn.',
    strengths:['Immense creative and mental power across a wide range of expression','Deeply individualistic with a genuine, ever-renewing capacity for self-discovery','Naturally resonant with the public and capable of real artistic or healing success','Innovative in finding new approaches to health, psychology, and self-knowledge'],
    challenges:['This card\'s power can lead to either the highest expression or the most self-destructive','Temptation toward clever shortcuts over genuine depth and earned wisdom','A solid, early-formed value system is essential to where these gifts ultimately land'] },
  { rank:'Q',  suit:'spades',   sym:'♠', name:'Queen of Spades',  dates:'',
    teaser:'Self-mastery is its very name, a quietly formidable card ambitious not for fame but to prove something real to herself, able to take in turmoil and come out wiser. The danger is forgetting the crown, pouring yourself into everyone else\'s needs while your own potential waits.',
    kws:['Ambition','Inner strength','Self-mastery','Resilience'],
    personality:'Self-mastery is the very name and purpose of this quietly formidable card, ambitious not for outer fame but for the deep inner drive to prove something real to herself. A born ruler with unlimited wisdom and intuitive ability available to her, she can take on immense turmoil, learn from it, and emerge genuinely stronger and wiser, even wishing what she desires into being once she claims the power of her own crown. The danger is forgetting that crown, losing yourself in menial tasks or in tending everyone else\'s needs rather than your own potential, so some real mental discipline and focus is essential to your contentment. Your happiness depends on authentic, ongoing growth, and the great work is developing genuine self-love alongside the strength, as its deepest foundation.',
    strengths:['Quietly formidable inner strength and genuine psychological resilience','Driven by self-mastery in the truest sense, not recognition or external validation','Emotionally mature and centred in ways that consistently surprise others','Able to take the most demanding experiences and convert them into lasting wisdom'],
    challenges:['The drive to grow stronger can be pushed so hard it forgets compassion for the self','Must ensure that building resilience doesn\'t mean building walls','Long-term commitments to people, practices, or spiritual paths are the true transformative agent'] },
  { rank:'K',  suit:'spades',   sym:'♠', name:'King of Spades',   dates:'',
    teaser:'Master of the deck and the highest card of all, ruling a single day of the year, one who has endured everything and built something unassailable from it. Its authority runs straight through the deepest limitations a life can hold, turning them, slowly and honestly, into a presence that needs no announcement.',
    kws:['Mastery','Authority','Wisdom','Responsibility'],
    personality:'Master of the deck, the King of Spades governs just one day of the year, January 1st, and in that singular exclusivity lies its entire nature. This is the highest card of all: the master of wisdom and of self-mastery, the ultimate authority, one who has endured everything and built something unassailable from it. Independent and strong-willed, you took on adult responsibility early and carry a weight others cannot imagine; you may value freedom and new horizons over any traditional life, and your solitary, in-your-head nature can read to others as secretive. The path runs straight through the deepest physical, psychological and existential limitations, transforming them, slowly and honestly, into a quiet authority that needs no announcement and commands lasting respect. Note: the King of Spades is a fixed card and a member of the Mystical Family of Seven.',
    strengths:['The pinnacle of authority and accumulated wisdom in the entire deck','Brilliant, strategic mind capable of shouldering the heaviest of burdens','Deeply responsible, resilient, and genuinely protective of those in their care','When fully realised, a presence that commands deep and lasting respect'],
    challenges:['The weight of this card is real and requires sustained, honest inner work throughout life','Reluctance to bend even to constructive guidance; autonomy is a double-edged gift','The path includes serious physical, psychological, and life challenges that cannot be bypassed or rushed'] },
];

const CARD_READINGS = {};
CARDS.forEach(c => { CARD_READINGS[`${c.rank}_${c.suit}`] = c; });
window.CARDS         = CARDS;
window.CARD_READINGS = CARD_READINGS;

// Subtitles — one line per card. Shown under the card name in the
// Finder About header. Joker has its own entry keyed '✦_joker'.
const SUBTITLES = {
  'A_hearts':   'The Quickening Flame',  '2_hearts':  'The Twin Flame',
  '3_hearts':   'The Wavering Flame',    '4_hearts':  'The Guarded Flame',
  '5_hearts':   'The Wandering Flame',   '6_hearts':  'The Faithful Flame',
  '7_hearts':   'The Dreaming Heart',    '8_hearts':  'The Magnetic Heart',
  '9_hearts':   'The All-Loving Heart',  '10_hearts': 'The Radiant Host',
  'J_hearts':   'The Ardent Youth',      'Q_hearts':  'The Mother of Flame',
  'K_hearts':   'The Lord of Flame',

  'A_clubs':    'The Waking Word',       '2_clubs':   'The Whispered Accord',
  '3_clubs':    'The Threefold Doubt',   '4_clubs':   'The Tempered Mind',
  '5_clubs':    'The Wind-Taught Mind',  '6_clubs':   'The Illumined Mind',
  '7_clubs':    'The Inner Oracle',      '8_clubs':   'The Mind Unbound',
  '9_clubs':    'The Mind of Many Lives','10_clubs':  "The Sage's Light",
  'J_clubs':    'The Quicksilver Mind',  'Q_clubs':   'The Oracle Queen',
  'K_clubs':    'The Master of the Word',

  'A_diamonds': 'The First Breath',      '2_diamonds':'The Sacred Clasp',
  '3_diamonds': 'The Trembling Vessel',  '4_diamonds':'The Cornerstone',
  '5_diamonds': 'The Untethered One',    '6_diamonds':'The Even Hand',
  '7_diamonds': 'The Hidden Gold',       '8_diamonds':'The Hand of Plenty',
  '9_diamonds': 'The Open Palm',         '10_diamonds':'The Golden Harvest',
  'J_diamonds': 'The Silver Tongue',     'Q_diamonds':'The Keeper of Beauty',
  'K_diamonds': 'The Lord of Plenty',

  'A_spades':   'The Opening Gate',      '2_spades':  'The Companion Soul',
  '3_spades':   'The Vale of Sorrows',   '4_spades':  'The Keeper of the Law',
  '5_spades':   'The Stormbringer',      '6_spades':  'The Wheel of Fate',
  '7_spades':   'The Dark Night of the Soul', '8_spades': 'The Adamant Will',
  '9_spades':   'The Great Reckoning',   '10_spades': 'The Crown of Toil',
  'J_spades':   'The Shadow Walker',     'Q_spades':  'The Veiled Crone',
  'K_spades':   'The Grand Magus',

  '✦_joker':    'Quinta Essentia',
};
window.SUBTITLES = SUBTITLES;

// Vows / mottos — one italic quote per card, shown under the subtitle
// in the Finder About header. Joker has '✦_joker'.
const VOWS = {
  'A_hearts':   'I am the first warmth that wakes the heart.',
  '2_hearts':   'I am made whole in the meeting of another.',
  '3_hearts':   'I burn in three directions and must choose one.',
  '4_hearts':   'I keep the hearth so others may come home.',
  '5_hearts':   'I follow my longing wherever it leads.',
  '6_hearts':   'I love steadily, and ask the same in return.',
  '7_hearts':   'I believe in what I have not yet seen.',
  '8_hearts':   'I draw to me what I most deeply feel.',
  '9_hearts':   'I open my arms to all and keep nothing back.',
  '10_hearts':  'I gather the many and we shine as one.',
  'J_hearts':   'I love with the whole fire of the first time.',
  'Q_hearts':   'I hold the fire that warms all who come near.',
  'K_hearts':   'I rule my heart, and so I rule with mercy.',

  'A_clubs':    'I am the question that begins all knowing.',
  '2_clubs':    'I am the truth two minds discover together.',
  '3_clubs':    'I learn by holding the question open.',
  '4_clubs':    'I am the calm that thought returns to.',
  '5_clubs':    'I learn from everything I cannot hold.',
  '6_clubs':    'I see clearly, and light the way for others.',
  '7_clubs':    'I trust the voice beneath my thoughts.',
  '8_clubs':    'I bend the world with the force of my thought.',
  '9_clubs':    'I remember more than this one life has taught.',
  '10_clubs':   'I carry the knowing of those who came before.',
  'J_clubs':    'I move faster than the world expects.',
  'Q_clubs':    'I know without being told.',
  'K_clubs':    'My word orders the world around me.',

  'A_diamonds': 'I am the spark that enters flesh.',
  '2_diamonds': 'I am the hand that holds and is held.',
  '3_diamonds': 'I steady my hands against the fear of want.',
  '4_diamonds': 'I am the ground that bears the weight.',
  '5_diamonds': 'I risk the known to find the more.',
  '6_diamonds': 'I give what is owed and take what is mine.',
  '7_diamonds': 'My worth is not measured by what I hold.',
  '8_diamonds': 'What I touch with intention multiplies.',
  '9_diamonds': 'I release what is finished and am made lighter.',
  '10_diamonds':'I reap in full what I planted in faith.',
  'J_diamonds': 'I speak, and the door opens.',
  'Q_diamonds': 'I make a sanctuary of all I tend.',
  'K_diamonds': 'I command abundance and steward it well.',

  'A_spades':   'I am the soul that turns toward the light.',
  '2_spades':   'I do not walk the road alone.',
  '3_spades':   'I pass through grief and am not undone.',
  '4_spades':   'I stand by what is true when it costs me.',
  '5_spades':   'I break what is stagnant so it may live again.',
  '6_spades':   'I meet what returns to me and call it justice.',
  '7_spades':   'I walk the dark until it becomes my teacher.',
  '8_spades':   'I cannot be broken by what I refuse to fear.',
  '9_spades':   'I let the old self die so the new may rise.',
  '10_spades':  'I earn my light through the labor of my hands.',
  'J_spades':   'I move unseen between the worlds.',
  'Q_spades':   'I have seen the far side and returned with wisdom.',
  'K_spades':   'I have mastered the self, and so the rest follows.',

  '✦_joker':    'I am bound by nothing and present in all.',
};
window.VOWS = VOWS;

// ── Life Script connection helpers (ported from v3 2026-07-10) ────
// Sage-voice gloss for each planetary connection (one card sitting
// in another's Life Script). Same locked register as REL_TEXT.
const PLANET_CONN_TEXT = {
  Mercury: "Your minds run on one wire. Talk comes quick and easy between you, ideas passed back and forth before either has finished the thought.",
  Venus:   "The warmest of the seats. Affection moves between you without being asked for, and nearness to each other is already its own reward.",
  Mars:    "There is heat here, the kind that drives and the kind that scorches. It moves you both to act, and it will find your tempers where wills cross.",
  Jupiter: "One of you keeps opening doors for the other. Good fortune runs this way, and the bond tends to leave you both larger than it found you.",
  Saturn:  "The heavy seat, and the truest teacher. One of you carries the other's lessons, and the love in it is real but asks to be earned in patience.",
  Uranus:  "An odd, electric current, free and hard to predict. You meet best as equals who hand each other room and ask for none of the usual promises.",
  Neptune: "A dream colours this bond, tender and far-seeing. Hold to what is actually before you, and let the other be a person rather than a wish.",
};
window.PLANET_CONN_TEXT = PLANET_CONN_TEXT;

// Is `toCard` one of `fromCard`'s seven planetary cards? If so return
// { idx, planet } describing which seat; otherwise null.
function lifeScriptConnection(fromCard, toCard) {
  const script = LIFE_SCRIPTS[`${fromCard.rank}_${fromCard.suit}`];
  if (!script) return null;
  for (let i = 0; i < script.length; i++) {
    const cc = lsParseCard(script[i]);
    if (cc.rank === toCard.rank && cc.suit === toCard.suit) {
      return { idx: i, planet: SPREAD_PLANETS[i] };
    }
  }
  return null;
}
window.lifeScriptConnection = lifeScriptConnection;
