// elementsdata.js — data for the Card Elements section (js/elements.js).
// NUMEROLOGY (13 ranks) + SUIT_MEANINGS (4 suits), each with the modern
// Sage reading and Olney H. Richmond's 1893 words attached as .olney for
// the Modern | Olney voice toggle. Extracted verbatim from the v3
// cardsdata.js 2026-07-11. Pure data; sets window.NUMEROLOGY +
// window.SUIT_MEANINGS. Loaded before js/elements.js.

const NUMEROLOGY = {
  'A': { n:1, label:'Ace', keywords:['Desire','Self','Beginning','Initiative'],
    text:'One is the single point before anything is shared, the first desire waking in the dark. You are the seed and the will that drives it upward, ambitious, restless to begin, certain the world is yours to start. Everything that follows is only One, divided and learning its way back. Stand in your own power and move. The hunger that says you are whole only when you are seen carries its own truth, that you were never meant to rise alone.',
    keynote:'Begin. You are the seed of all that follows.' },
  '2': { n:2, label:'Two', keywords:['Union','Cooperation','Partnership','Balance'],
    text:'Two is the meeting, the joining of what was apart. Here the One discovers it is not the whole of things, and a bargain is struck, a bond, a letter carried between two hands. You are made for partnership and read the unspoken weather of another with ease, happiest when you are not alone. Your strength is the bridge you become. Your trouble is the fear of standing single, which can bend you where you ought to hold.',
    keynote:'Two becomes strong in the bond, and weak in the fear of breaking it.' },
  '3': { n:3, label:'Three', keywords:['Creation','Expression','Choice','Restlessness'],
    text:'Three is the open mouth and the fork in the road. Out of the union of Two comes a third thing, and with it the gift of making, colour and word and voice pouring out faster than you can shape them. You are bright, quick, alive in company, holding more beginnings than you can ever finish. The two roads opening before you are real, and the worry that freezes you is only your creating force with nowhere to go. Choose one road and pour yourself down it.',
    keynote:'Creation is easy for you. Choosing is the work.' },
  '4': { n:4, label:'Four', keywords:['Foundation','Stability','Order','Endurance'],
    text:'Four is the square standing on the ground, the four corners that hold a thing in place. You build to last, steady and patient, the one others lean their weight against and feel safe. Walls are a blessing while they shelter and a prison once they will not open. Work, then, but watch the part of you that mistakes every change for a threat. What is truly founded does not fear the wind. It bends a little, and it stands.',
    keynote:'Build to last, and leave a door in the wall.' },
  '5': { n:5, label:'Five', keywords:['Change','Freedom','Movement','Seeking'],
    text:'Five is the crossing mark and the open road, the still square broken into motion. You are restless by birth, hungry for the new face, the far country, the thing you have not yet tasted. Movement is your medicine and your snare. The same wind that carries you onward can pull you from the field before the seed you planted breaks the soil. Go far. Then learn the older freedom, the one found by staying long enough for something to grow.',
    keynote:'Go everywhere. Then stay long enough for one thing to bloom.' },
  '6': { n:6, label:'Six', keywords:['Harmony','Responsibility','Cause and Effect','Service'],
    text:'Six is the level road and the returning scale. For a while the line runs straight and quiet, and in that quiet the law works: what you gave comes back to your door, the good of it and the cost of it alike. You are the one who heals the room, who carries the weight of others and calls it love. Tend that, but do not let peace become the thing you keep by never acting. What balance asks of you now is the courage to move.',
    keynote:'What you give returns. So give, and then act.' },
  '7': { n:7, label:'Seven', keywords:['Spirit','Trial','Faith','Inner Sight'],
    text:'Seven stands at the still center, the most inward of all the numbers. Something here blocks the way, and it will not yield to force or to argument. Met head on it is only trouble. Turn, come at it from another side, by trust in place of fear, and the wall you could not pass was never a wall. You are tuned to what others cannot hear. Stop demanding proof of the knowing that is already yours, and the victory comes quiet, and it is spiritual, and it is won over no one but yourself.',
    keynote:'The obstacle dissolves the moment you meet it by faith.' },
  '8': { n:8, label:'Eight', keywords:['Power','Mastery','Accomplishment','Abundance'],
    text:'Eight is power that has learned its own name. The doubled square, the standing strength, you set your will on a thing and it moves, in the body, in the work, in the gathering of many around you. Fortune leans your way. Yet power undirected hardens, turns to control, closes the hand it should hold open. Aim it well and keep it open, and what you build blesses everyone it touches. Mastery is yours. Domination is the counterfeit that costs you the very thing you mastered it for.',
    keynote:'Power blesses when it stays open and ruins when it closes.' },
  '9': { n:9, label:'Nine', keywords:['Completion','Release','Compassion','Letting Go'],
    text:'Nine is the circle closing, the last step before the cycle turns over again. You came to give, to love past the borders most people draw, and your hardest lessons arrive through what you must let go. Fulfilment is promised here, yet it so often comes dressed as loss, the thing held too tightly slipping the grip. This is the hardest grace, to give freely and then release the giving. Loosen your hands. What you let go does not leave you. It returns enlarged.',
    keynote:'Give freely, and let go of the giving.' },
  '10': { n:10, label:'Ten', keywords:['Success','Fullness','Attainment','Renewal'],
    text:'Ten is the full harvest, success standing on every side of you. The cycle that began as One returns here complete, crowned, richer for all it passed through. Stand in it. But the same number folds back to the One, which makes this fullness a first step as much as a summit, never a place to merely rest. Wear the success lightly and keep moving. The ease it brings is a gift, and lean on it too long and it becomes a slow forgetting of how you earned it.',
    keynote:'The harvest is also a seed. Do not rest in it.' },
  'J': { n:11, label:'Jack', keywords:['Youth','Creativity','Initiation','Maturity'],
    text:'Eleven is the bright apprentice, the young fire that arrives gifted past its years. You see what could be, and you see it early, quick with vision and charm, holding everything except the maturity you are here to earn. Two roads stand open. Learn through experience, train the gift, and grow into a true power. Or live on cleverness alone and stay the wanderer who never quite lands. The brilliance was never in question. What it waits for is your word that you will grow up around it.',
    keynote:'The gift is given young. The maturity, you earn.' },
  'Q': { n:12, label:'Queen', keywords:['Receptive Power','Love','Nurture','Inner Authority'],
    text:'Twelve is the throne that rules by giving. Here is love made into mastery, the power that nurtures, receives, and holds the room together without ever raising its voice. You carry real authority, though it often goes unnamed, the steady hand behind what others are credited for. Pour your warmth outward, you were made for it. Only see that some of it turns back toward you. The one who gives forever and is never given to cannot sustain the love that holds everything else up.',
    keynote:'You rule by giving. Let some of the love flow home.' },
  'K': { n:13, label:'King', keywords:['Mastery','Authority','Rule','The Summit'],
    text:'Thirteen is the crown, the number where a thing comes into its full power and rules. Whatever your nature, here it reaches its height and takes command, sure of itself, bound by no one’s doctrine but its own. This is real authority, the kind others feel without being told. Yet the crown stays only on the head that keeps earning it. Rule, but question yourself as fiercely as you question the world, and shed what you have outgrown. The king who stops remaking himself hardens into the very thing he rose to master.',
    keynote:'Wear the crown by remaking the head that wears it.' }
};
window.NUMEROLOGY = NUMEROLOGY;

// ── Suit meanings (keyed by suit) ──────────────────────────────────
// Shown in the finder profile beside Numerology. Locked Sage voice; same
// shape as NUMEROLOGY. The Joker has no suit entry (section hides for it).
const SUIT_MEANINGS = {
  hearts: { sym:'♥', label:'Hearts', keywords:['Love','Feeling','Connection','Devotion'],
    text:'Hearts is the suit of love, and love is the element you were poured from. You feel first and reason after, and what you feel runs warm and deep and close to the surface, so the people near you become the weather of your days. Your gift is connection, the rare power to meet another and let them be truly met. Tend the spring at your center and give from its overflow, never its floor, and the warmth you spend returns to you many times over. The danger is losing your own banks inside someone else, for love without shores floods the very ground it meant to feed.',
    keynote:'Love is your element. Give from the overflow, never the floor.' },
  clubs: { sym:'♣', label:'Clubs', keywords:['Mind','Knowledge','Word','Curiosity'],
    text:'Clubs is the suit of the mind, and yours is quick, bright, and seldom still. You live by ideas and by the words that carry them, hungry to know, to question, to see the workings beneath the surface of things. Truth has weight for you, and so does speech, for what you say can build a person up or cut them down. Feed the curiosity and follow a single thought to its end before you reach for the next, and your knowing ripens into wisdom others come to trust. Left scattered, the same bright mind spins in worry and noise, full of beginnings and starved of rest.',
    keynote:'Your mind is the gift. Follow one thought all the way down.' },
  diamonds: { sym:'♦', label:'Diamonds', keywords:['Value','Worth','Exchange','Abundance'],
    text:'Diamonds is the suit of value, and you came to learn what things are truly worth, yourself most of all. You have a clear eye for quality and a natural feel for exchange, for turning effort into something solid you can hold and share. Money and the material are honest teachers for you, yet the deeper lesson is the worth no ledger counts, the value of your hours, your gifts, and the people you will never trade away. Know what you are worth and ask for it plainly, and abundance comes as a matter of course. The shadow is pricing everything until the priceless slips through your fingers.',
    keynote:'Know your true worth, then ask for it plainly.' },
  spades: { sym:'♠', label:'Spades', keywords:['Wisdom','Work','Mastery','Transformation'],
    text:'Spades is the suit of wisdom, the deepest and most demanding of the four, and you were handed the heaviest tools. Yours is the work that transforms, the labor of the hands and of the spirit at once, and you carry a quiet certainty that real things are earned. Difficulty is your forge. What you pass through, you master, and what you master, you become. Give yourself to the work with patience and honesty, and you turn even hardship into an authority no one can take from you. Set the labor down and the same suit grows heavy, a weight carried with no ground gained.',
    keynote:'You were given the deepest work. Through it, you are made.' }
};
window.SUIT_MEANINGS = SUIT_MEANINGS;

// ── Olney (1893) readings — the alternate "voice" for the Card Elements toggle
// on cardsoflife.html, paired with the modern SUIT_MEANINGS / NUMEROLOGY text
// above. Olney H. Richmond's own words from The Mystic Test Book (1893); each
// entry attaches as `.olney = {keywords, text, keynote}`. Sources + provenance:
// dev/Book of Life/olney-element-drafts.md.
(function () {
  var S = {
    hearts: {
      keywords: ['Love', 'Friendship', 'Affection', 'Spring'],
      keynote: 'The emblem of love, and of the first quarter and the first season.',
      text: 'The heart is an emblem of love the world over. In the springtime of life, the first quarter, love is the master passion; the heart was therefore chosen as the emblem of the first quarter and the first season. It is the suit of love, friendship, and affection, and of the desire for harmony, ruled by Venus, the planet of friendship and love, and by Mercury, which quickens it to passion.'
    },
    clubs: {
      keywords: ['Knowledge', 'Intelligence', 'Summer'],
      keynote: 'The emblem of knowledge, and of the summer of life.',
      text: 'The club, the trefoil or clover leaf, is the emblem of summer and the second period of life, for knowledge is best gained and retained in the summer of life. It became the emblem of knowledge and intelligence, ruled by the Earth and by Mars. Under the gentler influence it signifies learning and argument; under the stronger it turns to heat, to quarrels, and even to law suits.'
    },
    diamonds: {
      keywords: ['Wealth', 'Property', 'Commerce', 'Autumn'],
      keynote: 'The emblem of wealth, and of the harvest season.',
      text: 'The third season, autumn, has for its emblem the diamond, the emblem of wealth. The third period of man’s life is the one in which he is best able to gain wealth, for in the fall of the year the crops are sold and the wealth of the harvest realized. It is the suit of money, property, and commerce, ruled by Jupiter, the giver of wealth, and by Neptune, whose diamonds indicate commerce.'
    },
    spades: {
      keywords: ['Labour', 'Death', 'Winter'],
      keynote: 'The emblem of labour and death combined, the winter quarter.',
      text: 'Winter, the fourth quarter, is represented by the spade, which was once the acorn, the old emblem of the death and burial of the physical form. Yet the acorn planted in the soil sends forth a new tree in time, so it carried a deeper meaning than the spade, which alone would symbolize death without resurrection. Being also an instrument of labour, the spade becomes the emblem of labour and death combined, ruled by Saturn from the standpoint of death, and by Uranus from the point of labour.'
    }
  };
  var N = {
    'A':  { keywords: ['A Single Thing', 'A Wish', 'A Beginning'], keynote: 'A single thing, a wish or a letter, and the start of a quarter.', text: 'The ace is the single spot, and stands for a single thing. It begins its quarter, as the ace of hearts begins the quarter of love, a heart single to the labour of love; in a reading it commonly falls as a wish or a letter.' },
    '2':  { keywords: ['Union', 'Bargain', 'Co-partnership'], keynote: 'Union and joining, a bargain between two, letters passing.', text: 'The twos indicate unions or joinings, and bargains between two persons; co-partnership, and letters passing from person to person.' },
    '3':  { keywords: ['Indecision', 'Two Ways Open'], keynote: 'Indecision, a place where two ways open before one.', text: 'The threes indicate indecision, a place where two ways open before one, as if the spot in the centre were the person and the others the two roads leading off in different directions.' },
    '4':  { keywords: ['Satisfaction', 'Stability'], keynote: 'Satisfaction and stability, a thing standing firm.', text: 'The four is the squared number, and signifies satisfaction and stability, as the four of spades gives a satisfaction in labour.' },
    '5':  { keywords: ['Change', 'A Journey'], keynote: 'Change, a cross in the path, a journey out of the old routine.', text: 'The five shows a change, for it represents a cross, an X, in one’s path; the lines of the life change, and a journey perhaps removes the person from the monotony that went before.' },
    '6':  { keywords: ['Monotony', 'Routine'], keynote: 'A life moving in straight lines, the settled routine.', text: 'The sixes show a life, for a time, moving in straight lines, with nothing out of the usual routine, until at length an obstacle comes in the way, and trouble with it.' },
    '7':  { keywords: ['The Soul', 'Trouble'], keynote: 'The soul’s number, a trouble met from one way only.', text: 'The number seven represents the soul in nature, and stands at the centre of all the symbolic numbers. As an emblem it is a trouble, but a trouble from one way only; approach it from another direction and the trouble disappears. It is a sacred number representing spirit, yet its trouble is material and not spiritual, for the spiritual and the material are antipodes of each other.' },
    '8':  { keywords: ['Power', 'Gatherings'], keynote: 'Power to overcome obstacles, and the gathering of many.', text: 'The eights indicate power to overcome obstacles, and spiritual advancement, and numbers of persons, congregations or gatherings of people; the row is a symmetrical fullness, a rounding out.' },
    '9':  { keywords: ['Disappointment', 'The Obstacle'], keynote: 'A disappointing obstacle in the centre that bars the way.', text: 'The geometrical form of the nines is a path with a disappointing obstacle in the centre. Approach it from either end and it bars your progress; you are disappointed and turned back. The nines rule under Saturn, the planet of disappointment.' },
    '10': { keywords: ['Success', 'The Open Space'], keynote: 'Success on every side, standing in the open space.', text: 'The tens represent success, as if one stood in the open space between the spots, surrounded with success upon all sides. The tens rule under Uranus, the planet of success.' },
    'J':  { keywords: ['The Young Man', 'A Male Friend'], keynote: 'A young man and a male friend, counting eleven.', text: 'The knave, counting eleven, is emblematic of the younger and unmarried portion of the male persuasion, a young man or a male friend, and in a reading a man you may trust. They were honest men all in the beginning, and only later, standing next the royal couple, were some transformed by bribery into knaves.' },
    'Q':  { keywords: ['The Woman', 'Love', 'Virtue'], keynote: 'The woman, ruling under Venus, holding the lotus of virtue.', text: 'The queen, counting twelve, is the woman or lady, ruling under Venus, the female planet and ruler of love. She looks from the same Egyptian eyes as of old, and holds modestly the secret lotus flower of innocence and virtue.' },
    'K':  { keywords: ['Power', 'Rule'], keynote: 'The man of power and rule, ruling under Jupiter.', text: 'The king, counting thirteen, is the man of power and rule, ruling under Jupiter, which denotes power and rule; he holds up the sword of justice or the battle axe of power, as the kings have done through all the ages.' }
  };
  var SM = window.SUIT_MEANINGS || {}, NU = window.NUMEROLOGY || {};
  Object.keys(S).forEach(function (k) { if (SM[k]) SM[k].olney = S[k]; });
  Object.keys(N).forEach(function (k) { if (NU[k]) NU[k].olney = N[k]; });
})();
