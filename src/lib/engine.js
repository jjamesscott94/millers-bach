// Pure scoring logic: handicap strokes, net scores, match play, skins,
// and the overall Ryder Cup tally.

// Strokes received on a hole for a given course handicap (full allocation,
// standard stroke-index method; works above 18 too: a 20 strokes every hole
// plus a second pop on SI 1 and 2).
export function strokesOnHole(hcp, si) {
  const h = Math.max(0, Math.round(hcp ?? 20))
  return Math.floor(h / 18) + (si <= h % 18 ? 1 : 0)
}

export function netScore(gross, hcp, si) {
  if (gross == null) return null
  return gross - strokesOnHole(hcp, si)
}

export function getHcp(data, pid) {
  const prof = data[`prof:${pid}`]
  return prof && typeof prof.hcp === 'number' ? prof.hcp : 20
}

export function getScores(data, rid, pid) {
  const s = data[`scores:${rid}:${pid}`]
  return Array.isArray(s) ? s : Array(18).fill(null)
}

// Best net ball for a side on one hole; null until every listed player has a
// gross score (a four-ball side "has a score" once either man is in, but we
// wait for both so a hole never flips after the fact).
function sideNet(data, rid, pids, course, holeIdx) {
  let best = null
  for (const pid of pids) {
    if (!pid) continue
    const gross = getScores(data, rid, pid)[holeIdx]
    if (gross == null) return null
    const net = netScore(gross, getHcp(data, pid), course.si[holeIdx])
    if (best == null || net < best) best = net
  }
  return best
}

// Match status. Holes count in order; we stop at the first hole where either
// side is missing a score.
export function matchStatus(data, rid, match, course) {
  let up = 0 // positive = side A up
  let thru = 0
  for (let h = 0; h < 18; h++) {
    const a = sideNet(data, rid, match.a, course, h)
    const b = sideNet(data, rid, match.b, course, h)
    if (a == null || b == null) break
    if (a < b) up++
    else if (b < a) up--
    thru = h + 1
    const remaining = 18 - thru
    if (Math.abs(up) > remaining) {
      return {
        thru, up, done: true,
        winner: up > 0 ? 'A' : 'B',
        label: `${Math.abs(up)}&${remaining}`,
        points: up > 0 ? { A: 1, B: 0 } : { A: 0, B: 1 },
      }
    }
  }
  if (thru === 18) {
    if (up === 0) return { thru, up, done: true, winner: null, label: 'HALVED', points: { A: 0.5, B: 0.5 } }
    return {
      thru, up, done: true,
      winner: up > 0 ? 'A' : 'B',
      label: `${Math.abs(up)} UP`,
      points: up > 0 ? { A: 1, B: 0 } : { A: 0, B: 1 },
    }
  }
  return {
    thru, up, done: false,
    winner: null,
    label: thru === 0 ? 'NOT STARTED' : up === 0 ? `AS thru ${thru}` : `${Math.abs(up)} UP thru ${thru}`,
    points: { A: 0, B: 0 },
  }
}

// Cup scoreboard. `solid` counts only finished matches; `live` adds the
// current leader of in-progress matches as if the match ended now.
export function cupTally(data, meta) {
  const solid = { A: 0, B: 0 }
  const live = { A: 0, B: 0 }
  for (const round of meta.rounds) {
    const course = meta.courses[round.course]
    for (const m of round.matches) {
      const st = matchStatus(data, round.id, m, course)
      solid.A += st.points.A; solid.B += st.points.B
      if (st.done) {
        live.A += st.points.A; live.B += st.points.B
      } else if (st.thru > 0) {
        if (st.up > 0) live.A += 1
        else if (st.up < 0) live.B += 1
        else { live.A += 0.5; live.B += 0.5 }
      }
    }
  }
  const total = meta.rounds.reduce((n, r) => n + r.matches.length, 0)
  return { solid, live, total, toWin: total / 2 + 0.5 }
}

// Skins is opt-in per round: each entrant pays the buy-in into the round's
// pot, and only entrants' scores count toward skins.
export function skinsEntrants(data, meta, rid) {
  return meta.players.filter(p => data[`skinsin:${rid}:${p.id}`] === true).map(p => p.id)
}

export function skinsBuyIn(meta) {
  if (typeof meta.skinsBuyIn === 'number') return meta.skinsBuyIn
  return meta.skinsValue || 0
}

// Skins for one round, recalculated live from whatever scores exist.
// A hole is evaluated once at least 2 entrants have a score on it. Lowest
// unique net wins the pot (1 skin + any carried). Ties carry.
export function skinsForRound(data, rid, meta, round) {
  const course = meta.courses[round.course]
  const useNet = meta.skinsNet !== false
  const entrants = new Set(skinsEntrants(data, meta, rid))
  const holes = []
  const totals = {}
  let carry = 0
  for (let h = 0; h < 18; h++) {
    const entries = []
    for (const p of meta.players) {
      if (!entrants.has(p.id)) continue
      const gross = getScores(data, rid, p.id)[h]
      if (gross == null) continue
      const score = useNet ? netScore(gross, getHcp(data, p.id), course.si[h]) : gross
      entries.push({ pid: p.id, score, gross })
    }
    if (entries.length < 2) {
      holes.push({ hole: h, state: 'pending', pot: carry + 1 })
      continue
    }
    entries.sort((x, y) => x.score - y.score)
    const best = entries[0]
    const tied = entries.filter(e => e.score === best.score)
    if (tied.length === 1) {
      const pot = carry + 1
      totals[best.pid] = (totals[best.pid] || 0) + pot
      holes.push({ hole: h, state: 'won', pid: best.pid, score: best.score, gross: best.gross, pot })
      carry = 0
    } else {
      holes.push({ hole: h, state: 'push', score: best.score, pot: carry + 1, tied: tied.map(t => t.pid) })
      carry += 1
    }
  }
  return { holes, totals, carryLeft: carry }
}

// Pool view for one round: entrants, pot, and projected payouts.
// Each skin's value = pot / total skins claimed, so payouts firm up as the
// round finishes. With zero skins claimed the pot is still intact.
export function skinsPool(data, meta, round) {
  const entrants = skinsEntrants(data, meta, round.id)
  const pot = entrants.length * skinsBuyIn(meta)
  const { holes, totals, carryLeft } = skinsForRound(data, round.id, meta, round)
  const claimed = Object.values(totals).reduce((a, b) => a + b, 0)
  const payouts = {}
  if (claimed > 0) {
    for (const [pid, n] of Object.entries(totals)) payouts[pid] = (pot * n) / claimed
  }
  return { entrants, pot, holes, totals, carryLeft, claimed, payouts }
}

// Weekend totals: skins counts and projected dollars across all rounds.
export function skinsTotalsAllRounds(data, meta) {
  const totals = {}
  const money = {}
  for (const round of meta.rounds) {
    const { totals: t, payouts } = skinsPool(data, meta, round)
    for (const [pid, n] of Object.entries(t)) totals[pid] = (totals[pid] || 0) + n
    for (const [pid, d] of Object.entries(payouts)) money[pid] = (money[pid] || 0) + d
  }
  return { totals, money }
}

// ---------- drink tracking ----------
export function getDrinks(data, rid, pid) {
  const d = data[`drinks:${rid}:${pid}`]
  return Array.isArray(d) ? d : Array(18).fill(0)
}

// Per-round and weekend drink totals per player.
export function drinkTotals(data, meta) {
  const byRound = {}
  const total = {}
  for (const r of meta.rounds) {
    byRound[r.id] = {}
    for (const p of meta.players) {
      const n = getDrinks(data, r.id, p.id).reduce((a, b) => a + (b || 0), 0)
      if (n > 0) {
        byRound[r.id][p.id] = n
        total[p.id] = (total[p.id] || 0) + n
      }
    }
  }
  return { byRound, total }
}

export function fmtMoney(n) {
  const r = Math.round(n * 100) / 100
  return r % 1 === 0 ? `$${r}` : `$${r.toFixed(2)}`
}

export function playerById(meta, pid) {
  return meta.players.find(p => p.id === pid)
}

export function fmtScore(gross, par) {
  if (gross == null) return ''
  const d = gross - par
  if (d <= -2) return 'eagle'
  if (d === -1) return 'birdie'
  if (d === 0) return 'par'
  if (d === 1) return 'bogey'
  return 'double'
}

// Stroke dots shown on the scorecard: how many pops a player gets on a hole.
export function dots(n) {
  return n > 0 ? '\u2022'.repeat(Math.min(n, 3)) : ''
}
