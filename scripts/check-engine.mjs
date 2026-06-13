// Quick sanity checks for the scoring engine. Run: node scripts/check-engine.mjs
import { strokesOnHole, matchStatus, skinsForRound, skinsPool, fmtMoney, cupTally, drinkTotals } from '../src/lib/engine.js'
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
const course = meta.courses[r1.course]
const data = {}
const everyone = meta.players.map(p => p.id)
// all 12 at hcp 20
for (const pid of everyone) data[`prof:${pid}`] = { hcp: 20 }

// Four-ball test using r1m1: A pair shoots par, B pair shoots bogey on every
// hole => A wins every hole. Player ids come from the match itself.
const par = course.par
const m1 = r1.matches[0]
for (const pid of m1.a) data[`scores:r1:${pid}`] = par.map(p => p)
for (const pid of m1.b) data[`scores:r1:${pid}`] = par.map(p => p + 1)
const st = matchStatus(data, 'r1', m1, course)
// equal handicaps cancel; A up 1 per hole; decided when up > remaining: after hole 10 (10 up, 8 left)
check('match decided', { done: st.done, label: st.label, winner: st.winner }, { done: true, label: '10&8', winner: 'A' })

// halved match: identical scores
const data2 = structuredClone(data)
for (const pid of m1.b) data2[`scores:r1:${pid}`] = par.map(p => p)
const st2 = matchStatus(data2, 'r1', m1, course)
check('match halved', { done: st2.done, label: st2.label }, { done: true, label: 'HALVED' })

// in progress: only 3 holes entered for all four
const data3 = structuredClone(data)
for (const pid of [...m1.a, ...m1.b]) {
  data3[`scores:r1:${pid}`] = par.map((p, i) => (i < 3 ? p : null))
}
data3[`scores:r1:${m1.a[0]}`] = par.map((p, i) => (i < 3 ? p - 1 : null)) // 3 straight birdies
const st3 = matchStatus(data3, 'r1', m1, course)
check('match live', { done: st3.done, thru: st3.thru, up: st3.up }, { done: false, thru: 3, up: 3 })

// Skins (opt-in): everyone enters except p7. Hole 0: p1 gross 3, rest gross 4
// -> p1 wins skin. Hole 1: all par -> push. Hole 2: p3 unique low -> pot of 2.
// p7 shoots 1s but is NOT entered, so he can't win anything.
const data4 = {}
const entrants = everyone.filter(pid => pid !== 'p7')
for (const pid of everyone) data4[`prof:${pid}`] = { hcp: 20 }
for (const pid of entrants) data4[`skinsin:r1:${pid}`] = true
for (const pid of everyone) {
  const sc = Array(18).fill(null)
  sc[0] = 4; sc[1] = course.par[1]; sc[2] = course.par[2]
  data4[`scores:r1:${pid}`] = sc
}
data4['scores:r1:p1'][0] = 3
data4['scores:r1:p3'][2] = course.par[2] - 1
data4['scores:r1:p7'] = Array(18).fill(1) // hustler who didn't pay
const sk = skinsForRound(data4, 'r1', meta, r1)
check('skin h1 winner', { pid: sk.holes[0].pid, pot: sk.holes[0].pot }, { pid: 'p1', pot: 1 })
check('skin h2 push', sk.holes[1].state, 'push')
check('skin h3 carry pot', { pid: sk.holes[2].pid, pot: sk.holes[2].pot }, { pid: 'p3', pot: 2 })
check('skin totals (non-entrant excluded)', sk.totals, { p1: 1, p3: 2 })
check('skin pending h4', sk.holes[3].state, 'pending')

// Pool math: 11 entrants x $10 = $110 pot; 3 skins claimed -> p1 gets 1/3, p3 gets 2/3
const pool = skinsPool(data4, meta, r1)
check('pool pot', { entrants: pool.entrants.length, pot: pool.pot, claimed: pool.claimed }, { entrants: 11, pot: 110, claimed: 3 })
check('pool payouts', { p1: Math.round(pool.payouts.p1 * 100) / 100, p3: Math.round(pool.payouts.p3 * 100) / 100 }, { p1: 36.67, p3: 73.33 })
check('fmtMoney', [fmtMoney(110), fmtMoney(36.666666)], ['$110', '$36.67'])

// Nobody entered -> no skins awarded no matter the scores
const sk0 = skinsForRound({ ...data4, 'skinsin:r1:p1': false, ...Object.fromEntries(entrants.map(p => [`skinsin:r1:${p}`, false])) }, 'r1', meta, r1)
check('no entrants, no skins', sk0.totals, {})

// Drink totals: p1 drinks on r1 holes 1+3; p3 stays dry
const data5 = {}
data5['drinks:r1:p1'] = [2, 0, 1, ...Array(15).fill(0)]
const dt = drinkTotals(data5, meta)
check('drink round totals', dt.byRound.r1, { p1: 3 })
check('drink event total', dt.total, { p1: 3 })

// cup tally over the full default meta with data: only r1m1 decided (10&8 from data)
// 3 matches = 3 points, first to 2
const tally = cupTally(data, meta)
check('cup tally', { A: tally.solid.A, B: tally.solid.B, total: tally.total, toWin: tally.toWin }, { A: 1, B: 0, total: 3, toWin: 2 })

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1) }
console.log('\nAll engine checks passed.')
