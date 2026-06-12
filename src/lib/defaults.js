// Initial event configuration. This is what gets seeded into the kvdb bucket
// under the `meta` key. After seeding, the live copy is edited via the
// Commissioner panel in the app — this file is only the starting point.

export const BUCKET = 'ECN7GoJ8wGh3CkgXDF7Cxm'
export const API_BASE = `https://kvdb.io/${BUCKET}`

// Yardages are the Palo Verde (middle) tees at Grayhawk and the standard
// resort cards at Pebble / Pinehurst.
export const COURSES = {
  raptor: {
    name: 'Grayhawk \u00b7 Raptor',
    loc: 'Scottsdale, AZ \u00b7 The Real Deal',
    par: [4, 4, 4, 5, 3, 4, 5, 3, 4, 4, 5, 4, 3, 4, 4, 3, 4, 5],
    si: [10, 16, 4, 2, 14, 12, 8, 18, 6, 9, 1, 5, 7, 13, 11, 17, 15, 3],
    yards: [380, 360, 419, 530, 180, 334, 474, 156, 427, 359, 539, 441, 200, 379, 415, 138, 301, 494],
  },
  talon: {
    name: 'Grayhawk \u00b7 Talon',
    loc: 'Scottsdale, AZ \u00b7 The Real Deal',
    par: [4, 4, 5, 4, 3, 4, 4, 3, 5, 4, 3, 4, 4, 5, 4, 4, 3, 5],
    si: [9, 13, 5, 7, 17, 1, 11, 15, 3, 4, 16, 2, 14, 10, 8, 12, 18, 6],
    yards: [385, 309, 465, 363, 133, 422, 366, 189, 507, 422, 161, 405, 277, 519, 419, 383, 114, 552],
  },
  shinnecock: {
    name: 'Shinnecock Hills',
    loc: 'Sim Bay \u00b7 Southampton, NY \u00b7 2026 U.S. Open host',
    par: [4, 3, 4, 4, 5, 4, 3, 4, 4, 4, 3, 4, 4, 4, 4, 5, 3, 4],
    si: [15, 17, 5, 7, 11, 1, 13, 9, 3, 2, 16, 8, 12, 4, 6, 10, 18, 14],
    yards: [399, 220, 469, 409, 537, 453, 189, 394, 435, 415, 159, 469, 374, 463, 409, 540, 180, 426],
  },
  pebble: {
    name: 'Pebble Beach Golf Links',
    loc: 'Sim Bay \u00b7 Pebble Beach, CA',
    par: [4, 5, 4, 4, 3, 5, 3, 4, 4, 4, 4, 3, 4, 5, 4, 4, 3, 5],
    si: [6, 10, 12, 16, 14, 2, 18, 4, 8, 3, 9, 17, 7, 1, 13, 11, 15, 5],
    yards: [378, 509, 397, 333, 189, 498, 107, 416, 483, 444, 370, 202, 401, 559, 393, 400, 182, 541],
  },
  pinehurst: {
    name: 'Pinehurst No. 2',
    loc: 'Sim Bay \u00b7 Village of Pinehurst, NC',
    par: [4, 4, 4, 4, 5, 3, 4, 5, 3, 5, 4, 4, 4, 4, 3, 5, 3, 4],
    si: [11, 3, 9, 1, 15, 5, 7, 17, 13, 18, 8, 10, 6, 2, 12, 16, 14, 4],
    yards: [393, 439, 350, 474, 508, 203, 393, 469, 174, 580, 455, 419, 375, 433, 183, 513, 185, 415],
  },
}

// The 14 golfers from the "Miller and his Mice go to Scottsdale" sheet
// (everyone marked Yes for golf; Benny, Kyle, and TJ are not playing).
// Handicaps come from the HC column; Andrew and Pauley had none listed so
// they start at the default 20 (each man can edit his own in the app).
// Teams are split 7v7 and roughly balanced by handicap.
export const PLAYERS = [
  { id: 'p1', name: 'Luke Miller', team: 'A', groom: true, hcp: 18 },
  { id: 'p2', name: 'Brad', team: 'A', hcp: 15 },
  { id: 'p3', name: 'Brandon', team: 'A', hcp: 20 },
  { id: 'p4', name: 'Charles', team: 'A', hcp: 11 },
  { id: 'p5', name: 'Connor', team: 'A', hcp: 25 },
  { id: 'p6', name: 'Ryan', team: 'A', hcp: 13 },
  { id: 'p7', name: 'Pauley', team: 'A', hcp: 20 },
  { id: 'p8', name: 'John', team: 'B', hcp: 8 },
  { id: 'p9', name: 'Matt Collins', team: 'B', hcp: 11 },
  { id: 'p10', name: 'Nick', team: 'B', hcp: 25 },
  { id: 'p11', name: 'Noodle', team: 'B', hcp: 19 },
  { id: 'p12', name: 'Simon', team: 'B', hcp: 23 },
  { id: 'p13', name: 'Maline', team: 'B', hcp: 18 },
  { id: 'p14', name: 'Andrew', team: 'B', hcp: 20 },
]

export const GAMES = [
  'Toast the Groom \u2014 everyone drinks to Luke before a single ball is struck.',
  'Caddie Hole \u2014 low score on this hole picks one guy to finish his drink.',
  'Church Hole \u2014 no swearing tee to green. Every slip = 1 drink.',
  'Tee Box Waterfall \u2014 waterfall starting with the groom, ending with the worst score from the last hole.',
  'Par 3 Pressure \u2014 miss the green from the tee = 1 drink. Closest to the pin hands out 2.',
  'Three-Putt Poison \u2014 any 3-putt on this hole = finish your drink.',
  'Big Dog \u2014 shortest drive in your group drinks twice.',
  'Phone Jail \u2014 caught on your phone (scores app excluded) = 1 drink.',
  'The Turn \u2014 beer chug race on the 9th green. Loser buys the next round.',
  'Fresh Start \u2014 crack a new beverage before teeing off. No exceptions.',
  'Quiet Please \u2014 talking in someone\u2019s backswing = 2 drinks.',
  'Beach Day \u2014 find a bunker, take a drink. Leave it in the bunker, take two.',
  'Lucky 13 \u2014 par or better and everyone else drinks. Bogey or worse, you drink.',
  'Dealer\u2019s Choice \u2014 winner of the last hole invents a rule for this hole.',
  'Splash Zone \u2014 water ball = chug. (Sim rounds: any penalty counts.)',
  'Mulligan Market \u2014 mulligans for sale on this hole. Price: 2 drinks each.',
  'One Club Wonder \u2014 play the whole hole with one club, or take 3 drinks.',
  'Last Call \u2014 losing team on the hole shotguns. Groom finishes his drink and gets carried to the bar.',
]

export const RULES = [
  'Handicaps come from the trip sheet (Andrew and Pauley start at 20). Only YOU can edit your own \u2014 Me tab.',
  'Match play: net best-ball in the pairs rounds, net singles in the finale. Full handicap strokes by hole index.',
  'Skins: lowest unique NET score on a hole takes the skin. Ties carry the pot to the next hole.',
  'Both squads carry 7 men \u2014 each team benches one for the pairs rounds, everybody plays Sunday singles. Benched men still drink (and can still post a card for skins).',
  'Groups rotate every round \u2014 new partner in Round 2, a fresh opponent in Sunday singles. Make new friends.',
  'Gimmies inside the leather, unless money or matches are on the line.',
  'The groom never buys his own drinks. Ever.',
]

export function par3s(course) {
  return course.par.map((p, i) => (p === 3 ? i : -1)).filter(i => i >= 0)
}
export function longestPar5(course) {
  let best = -1
  course.par.forEach((p, i) => {
    if (p === 5 && (best < 0 || course.yards[i] > course.yards[best])) best = i
  })
  return best >= 0 ? best : 0
}

// Pairings rotate every round: nobody partners the same man twice, and the
// singles draw gives everyone a fresh opponent. Luke anchors the last match.
const MATCHES = {
  r1: [
    { id: 'r1m1', a: ['p1', 'p2'], b: ['p10', 'p9'] },
    { id: 'r1m2', a: ['p3', 'p4'], b: ['p8', 'p11'] },
    { id: 'r1m3', a: ['p5', 'p6'], b: ['p12', 'p13'] },
  ],
  r2: [
    { id: 'r2m1', a: ['p1', 'p4'], b: ['p8', 'p12'] },
    { id: 'r2m2', a: ['p3', 'p6'], b: ['p9', 'p11'] },
    { id: 'r2m3', a: ['p2', 'p7'], b: ['p10', 'p14'] },
  ],
  r3: [
    { id: 'r3m1', a: ['p2'], b: ['p12'] },
    { id: 'r3m2', a: ['p4'], b: ['p14'] },
    { id: 'r3m3', a: ['p5'], b: ['p8'] },
    { id: 'r3m4', a: ['p7'], b: ['p9'] },
    { id: 'r3m5', a: ['p6'], b: ['p10'] },
    { id: 'r3m6', a: ['p3'], b: ['p13'] },
    { id: 'r3m7', a: ['p1'], b: ['p11'] },
  ],
}

function round(id, name, date, courseId, format, sitting) {
  const c = COURSES[courseId]
  return {
    id, name, date, course: courseId, format, sitting,
    matches: MATCHES[id],
    ctpHoles: par3s(c),
    ldHole: longestPar5(c),
  }
}

export const DEFAULT_META = {
  v: 2,
  eventName: 'The Miller Cup',
  subtitle: 'Miller & His Mice Go to Scottsdale',
  dates: 'June 12\u201314, 2026',
  skinsValue: 5,
  skinsNet: true,
  teams: {
    A: { name: 'Team Miller', color: '#e3354d' },
    B: { name: 'The Mice', color: '#2f6fed' },
  },
  players: PLAYERS,
  courses: COURSES,
  rounds: [
    // 3 + 3 + 7 = 13 points. First to 7 lifts the Cup.
    round('r1', 'Round 1 \u00b7 Grayhawk', 'Saturday, June 13 \u00b7 On the course', 'raptor', 'fourball', ['p7', 'p14']),
    round('r2', 'Round 2 \u00b7 Shinnecock Hills', 'Simulator session \u00b7 2026 U.S. Open venue', 'shinnecock', 'fourball', ['p5', 'p13']),
    round('r3', 'Round 3 \u00b7 Pinehurst No. 2', 'Simulator \u00b7 Sunday Singles', 'pinehurst', 'singles', []),
  ],
  games: GAMES,
  rules: RULES,
}
