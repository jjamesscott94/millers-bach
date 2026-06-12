// Initial event configuration. This is what gets seeded into the kvdb bucket
// under the `meta` key. After seeding, the live copy is edited via the
// Commissioner panel in the app — this file is only the starting point.

export const BUCKET = 'ECN7GoJ8wGh3CkgXDF7Cxm'
export const API_BASE = `https://kvdb.io/${BUCKET}`

export const COURSES = {
  greyhawk: {
    name: 'Grey Hawk Golf Club',
    loc: 'LaGrange, OH · The Real Deal',
    par: [4, 3, 4, 5, 3, 4, 5, 4, 4, 5, 3, 4, 3, 5, 4, 4, 3, 5],
    si: [11, 17, 13, 7, 15, 9, 1, 5, 3, 6, 12, 8, 16, 2, 14, 10, 18, 4],
    yards: [404, 194, 328, 511, 177, 375, 549, 401, 388, 535, 164, 404, 167, 532, 405, 391, 193, 569],
  },
  pebble: {
    name: 'Pebble Beach Golf Links',
    loc: 'Sim Bay · Pebble Beach, CA',
    par: [4, 5, 4, 4, 3, 5, 3, 4, 4, 4, 4, 3, 4, 5, 4, 4, 3, 5],
    si: [6, 10, 12, 16, 14, 2, 18, 4, 8, 3, 9, 17, 7, 1, 13, 11, 15, 5],
    yards: [378, 509, 397, 333, 189, 498, 107, 416, 483, 444, 370, 202, 401, 559, 393, 400, 182, 541],
  },
  pinehurst: {
    name: 'Pinehurst No. 2',
    loc: 'Sim Bay · Village of Pinehurst, NC',
    par: [4, 4, 4, 4, 5, 3, 4, 5, 3, 5, 4, 4, 4, 4, 3, 5, 3, 4],
    si: [11, 3, 9, 1, 15, 5, 7, 17, 13, 18, 8, 10, 6, 2, 12, 16, 14, 4],
    yards: [393, 439, 350, 474, 508, 203, 393, 469, 174, 580, 455, 419, 375, 433, 183, 513, 185, 415],
  },
}

// 13 golfers. Luke is the groom. Names are placeholders until each guy claims
// his profile (players can rename themselves on first login; the Commissioner
// can rename anyone). Team A carries 7 men and subs one out each round.
export const PLAYERS = [
  { id: 'p1', name: 'Luke Miller', team: 'A', groom: true },
  { id: 'p2', name: 'Player 2', team: 'A' },
  { id: 'p3', name: 'Player 3', team: 'A' },
  { id: 'p4', name: 'Player 4', team: 'A' },
  { id: 'p5', name: 'Player 5', team: 'A' },
  { id: 'p6', name: 'Player 6', team: 'A' },
  { id: 'p7', name: 'Player 7', team: 'A' },
  { id: 'p8', name: 'Player 8', team: 'B' },
  { id: 'p9', name: 'Player 9', team: 'B' },
  { id: 'p10', name: 'Player 10', team: 'B' },
  { id: 'p11', name: 'Player 11', team: 'B' },
  { id: 'p12', name: 'Player 12', team: 'B' },
  { id: 'p13', name: 'Player 13', team: 'B' },
]

export const GAMES = [
  'Toast the Groom — everyone drinks to Luke before a single ball is struck.',
  'Caddie Hole — low score on this hole picks one guy to finish his drink.',
  'Church Hole — no swearing tee to green. Every slip = 1 drink.',
  'Tee Box Waterfall — waterfall starting with the groom, ending with the worst score from the last hole.',
  'Par 3 Pressure — miss the green from the tee = 1 drink. Closest to the pin hands out 2.',
  'Three-Putt Poison — any 3-putt on this hole = finish your drink.',
  'Big Dog — shortest drive in your group drinks twice.',
  'Phone Jail — caught on your phone (scores app excluded) = 1 drink.',
  'The Turn — beer chug race on the 9th green. Loser buys the next round.',
  'Fresh Start — crack a new beverage before teeing off. No exceptions.',
  'Quiet Please — talking in someone\u2019s backswing = 2 drinks.',
  'Beach Day — find a bunker, take a drink. Leave it in the bunker, take two.',
  'Lucky 13 — par or better and everyone else drinks. Bogey or worse, you drink.',
  'Dealer\u2019s Choice — winner of the last hole invents a rule for this hole.',
  'Splash Zone — water ball = chug. (Sim rounds: any penalty counts.)',
  'Mulligan Market — mulligans for sale on this hole. Price: 2 drinks each.',
  'One Club Wonder — play the whole hole with one club, or take 3 drinks.',
  'Last Call — losing team on the hole shotguns. Groom finishes his drink and gets carried to the bar.',
]

export const RULES = [
  'Everyone starts at a 20 handicap. Update your own in the Profile tab — nobody can touch it but you.',
  'Match play: net best-ball in pairs rounds, net singles in the finale. Full handicap strokes by hole index.',
  'Skins: lowest unique NET score on a hole takes the skin. Ties carry the pot to the next hole.',
  'Team Miller carries 7 men — captain subs one man out each round. Benched man still drinks (and can still post a score for skins).',
  'Gimmies inside the leather, unless money or matches are on the line.',
  'The groom never buys his own drinks. Ever.',
]

function defaultLdHole(course) {
  let best = 0
  COURSES[course].par.forEach((p, i) => {
    if (p === 5 && COURSES[course].yards[i] > COURSES[course].yards[best]) best = i
  })
  return best
}
function par3s(course) {
  return COURSES[course].par.map((p, i) => (p === 3 ? i : -1)).filter(i => i >= 0)
}

const teamIds = t => PLAYERS.filter(p => p.team === t).map(p => p.id)

function pairsMatches(roundId, sitting) {
  const a = teamIds('A').filter(id => !sitting.includes(id))
  const b = teamIds('B').filter(id => !sitting.includes(id))
  return [0, 1, 2].map(i => ({
    id: `${roundId}m${i + 1}`,
    a: [a[i * 2], a[i * 2 + 1]],
    b: [b[i * 2], b[i * 2 + 1]],
  }))
}
function singlesMatches(roundId, sitting) {
  const a = teamIds('A').filter(id => !sitting.includes(id))
  const b = teamIds('B').filter(id => !sitting.includes(id))
  return a.map((pid, i) => ({ id: `${roundId}m${i + 1}`, a: [pid], b: [b[i]] }))
}

export const DEFAULT_META = {
  v: 1,
  eventName: 'The Miller Cup',
  subtitle: 'Luke Miller\u2019s Bachelor Party Ryder Cup',
  dates: 'June 12\u201314, 2026',
  skinsValue: 5,
  skinsNet: true,
  teams: {
    A: { name: 'Team Miller', color: '#0b5d3b' },
    B: { name: 'The Field', color: '#1d3557' },
  },
  players: PLAYERS,
  courses: COURSES,
  rounds: [
    {
      id: 'r1',
      name: 'Round 1 · Grey Hawk',
      date: 'Saturday, June 13 · On the course',
      course: 'greyhawk',
      format: 'fourball',
      sitting: ['p7'],
      matches: pairsMatches('r1', ['p7']),
      ctpHoles: par3s('greyhawk'),
      ldHole: defaultLdHole('greyhawk'),
    },
    {
      id: 'r2',
      name: 'Round 2 · Pebble Beach',
      date: 'Simulator session',
      course: 'pebble',
      format: 'fourball',
      sitting: ['p6'],
      matches: pairsMatches('r2', ['p6']),
      ctpHoles: par3s('pebble'),
      ldHole: defaultLdHole('pebble'),
    },
    {
      id: 'r3',
      name: 'Round 3 · Pinehurst No. 2',
      date: 'Simulator session · Sunday Singles',
      course: 'pinehurst',
      format: 'singles',
      sitting: ['p5'],
      matches: singlesMatches('r3', ['p5']),
      ctpHoles: par3s('pinehurst'),
      ldHole: defaultLdHole('pinehurst'),
    },
  ],
  games: GAMES,
  rules: RULES,
}
