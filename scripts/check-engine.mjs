// Quick sanity checks for the scoring engine. Run: node scripts/check-engine.mjs
import { strokesOnHole, matchStatus, skinsForRound, cupTally } from '../src/lib/engine.js'
import { DEFAULT_META } from '../src/lib/defaults.js'

let failures = 0
function check(name, actual, expected) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected)
  if (a === e) console.log(`ok   ${name}`)
  else { console.error(`FAIL ${name}: got ${a}, want ${e}`); failures++ }
}

// strokes: hcp 20 = 1 everywhere + extra on SI 1,2; hcp 0 = none; hcp 18 = 1 everywhere
check('hcp20 SI1', strokesOnHole(20, 1), 2)
check('hcp20 SI2', strokesOnHole(20, 2), 2)
check('hcp20 SI3', strokesOnHole(20, 3), 1)
check('hcp20 SI18', strokesOnHole(20, 18), 1)
check('hcp0 SI1', strokesOnHole(0, 1), 0)
check('hcp18 SI18', strokesOnHole(18, 18), 1)
check('hcp9 SI9', strokesOnHole(9, 9), 1)
check('hcp9 SI10', strokesOnHole(9, 10), 0)

const meta = DEFAULT_META
const r1 = meta.rounds[0]
const course = meta.courses.raptor
const data = {}
const everyone = meta.players.map(p => p.id)
// all 13 at hcp 20
for (const pid of everyone) data[`prof:${pid}`] = { hcp: 20 }

// Singles-style test using r1m1 pairs: give A side better scores on first 10 holes.
// A pair shoots par, B pair shoots bogey on every hole => A wins every hole.
const par = course.par
for (const pid of ['p1', 'p2']) data[`scores:r1:${pid}`] = par.map(p => p)
for (const pid of ['p8', 'p9']) data[`scores:r1:${pid}`] = par.map(p => p + 1)
const st = matchStatus(data, 'r1', r1.matches[0], course)
// equal handicaps cancel; A up 1 per hole; decided when up > remaining: after hole 10 (10 up, 8 left)
check('match decided', { done: st.done, label: st.label, winner: st.winner }, { done: true, label: '10&8', winner: 'A' })

// halved match: identical scores
const data2 = structuredClone(data)
for (const pid of ['p8', 'p9']) data2[`scores:r1:${pid}`] = par.map(p => p)
const st2 = matchStatus(data2, 'r1', r1.matches[0], course)
check('match halved', { done: st2.done, label: st2.label }, { done: true, label: 'HALVED' })

// in progress: only 3 holes entered for all four
const data3 = structuredClone(data)
for (const pid of ['p1', 'p2', 'p8', 'p9']) {
  data3[`scores:r1:${pid}`] = par.map((p, i) => (i < 3 ? p : null))
}
data3['scores:r1:p1'] = par.map((p, i) => (i < 3 ? p - 1 : null)) // p1 birdies 3 straight
const st3 = matchStatus(data3, 'r1', r1.matches[0], course)
check('match live', { done: st3.done, thru: st3.thru, up: st3.up }, { done: false, thru: 3, up: 3 })

// Skins: hole 0 (par 4, SI 11): p1 gross 3 (net 2), everyone else gross 4 (net 3) -> p1 wins skin
// hole 1: everyone gross = par -> push; hole 2: p2 unique low -> wins pot of 2
const data4 = {}
for (const pid of everyone) data4[`prof:${pid}`] = { hcp: 20 }
for (const pid of everyone) {
  const sc = Array(18).fill(null)
  sc[0] = 4; sc[1] = course.par[1]; sc[2] = course.par[2]
  data4[`scores:r1:${pid}`] = sc
}
data4['scores:r1:p1'][0] = 3
data4['scores:r1:p2'][2] = course.par[2] - 1
const sk = skinsForRound(data4, 'r1', meta, r1)
check('skin h1 winner', { pid: sk.holes[0].pid, pot: sk.holes[0].pot }, { pid: 'p1', pot: 1 })
check('skin h2 push', sk.holes[1].state, 'push')
check('skin h3 carry pot', { pid: sk.holes[2].pid, pot: sk.holes[2].pot }, { pid: 'p2', pot: 2 })
check('skin totals', sk.totals, { p1: 1, p2: 2 })
check('skin pending h4', sk.holes[3].state, 'pending')

// cup tally over the full default meta with data: only r1m1 decided (10&8 from data)
// 3 + 3 + 7 matches = 13 points, first to 7
const tally = cupTally(data, meta)
check('cup tally', { A: tally.solid.A, B: tally.solid.B, total: tally.total, toWin: tally.toWin }, { A: 1, B: 0, total: 13, toWin: 7 })

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1) }
console.log('\nAll engine checks passed.')
