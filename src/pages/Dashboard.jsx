import React from 'react'
import trophy from '../assets/trophy.png'
import { useStore } from '../lib/store.jsx'
import { cupTally, matchStatus, skinsTotalsAllRounds, skinsBuyIn, drinkTotals, playerById, fmtMoney } from '../lib/engine.js'
import { go } from '../App.jsx'

export default function Dashboard() {
  const { data, meta, me } = useStore()
  const tally = cupTally(data, meta)
  const { totals: skins, money } = skinsTotalsAllRounds(data, meta)
  const skinsRank = Object.entries(skins).sort((a, b) => b[1] - a[1])
  const { total: drinks } = drinkTotals(data, meta)
  const drinkRank = Object.entries(drinks).sort((a, b) => b[1] - a[1])
  const { A, B } = meta.teams

  return (
    <div>
      <section className="card scoreboard">
        <div className="sb-team" style={{ '--c': A.color }}>
          <div className="sb-name">{A.name}</div>
          <div className="sb-points">{fmtPts(tally.solid.A)}</div>
          {tally.live.A !== tally.solid.A && <div className="sb-proj">{fmtPts(tally.live.A)} projected</div>}
        </div>
        <div className="sb-mid">
          <div className="sb-cup"><img src={trophy} alt="" /></div>
          <div className="sb-towin">first to {fmtPts(tally.toWin)}</div>
        </div>
        <div className="sb-team" style={{ '--c': B.color }}>
          <div className="sb-name">{B.name}</div>
          <div className="sb-points">{fmtPts(tally.solid.B)}</div>
          {tally.live.B !== tally.solid.B && <div className="sb-proj">{fmtPts(tally.live.B)} projected</div>}
        </div>
      </section>

      {me && <p className="welcome">You&rsquo;re in, {playerById(meta, me.id)?.name}. Go post some numbers.</p>}

      <div className="dashgrid">
      <div>
      <h2 className="sectionh">Rounds</h2>
      {meta.rounds.map(round => {
        const course = meta.courses[round.course]
        const done = round.matches.filter(m => matchStatus(data, round.id, m, course).done).length
        const started = round.matches.some(m => matchStatus(data, round.id, m, course).thru > 0)
        return (
          <button key={round.id} className="card roundcard" onClick={() => go(`/round/${round.id}`)}>
            <div className="rc-top">
              <span className="rc-name">{round.name}</span>
              <span className={`pill ${done === round.matches.length ? 'pill-done' : started ? 'pill-live' : ''}`}>
                {done === round.matches.length ? 'Final' : started ? 'LIVE' : 'Upcoming'}
              </span>
            </div>
            <div className="rc-sub">{course.name} &middot; {round.date}</div>
            <div className="rc-sub">{round.format === 'fourball' ? 'Four-Ball (pairs, net best ball)' : 'Singles (net match play)'} &middot; {round.matches.length} matches &middot; {done}/{round.matches.length} final</div>
          </button>
        )
      })}
      </div>

      <div>
      <h2 className="sectionh">Skins leaderboard</h2>
      <div className="card">
        <p className="hint">{fmtMoney(skinsBuyIn(meta))} buy-in per round, opt in on each round&rsquo;s Skins tab. 1 skin per hole, lowest net wins outright, ties stack the pot &mdash; each round&rsquo;s pot splits across its skins won.</p>
        {skinsRank.length === 0 ? (
          <p className="hint">No skins claimed yet.</p>
        ) : (
          <table className="table">
            <tbody>
              {skinsRank.map(([pid, n]) => (
                <tr key={pid}>
                  <td>{playerById(meta, pid)?.name || pid}</td>
                  <td className="num">{n} skin{n === 1 ? '' : 's'}</td>
                  <td className="num">{money[pid] != null ? fmtMoney(money[pid]) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2 className="sectionh">Drink leaderboard</h2>
      <div className="card">
        {drinkRank.length === 0 ? (
          <p className="hint">Nobody&rsquo;s logged a drink yet. Track them with the {'\u{1F37A}'} buttons on the scorecard &mdash; event totals stack up here.</p>
        ) : (
          <table className="table">
            <tbody>
              {drinkRank.map(([pid, n], i) => (
                <tr key={pid}>
                  <td>{i === 0 ? '\u{1F451} ' : ''}{playerById(meta, pid)?.name || pid}</td>
                  <td className="num">{n} {'\u{1F37A}'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2 className="sectionh">House rules</h2>
      <div className="card">
        <ul className="rules">
          {meta.rules.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </div>
      </div>
      </div>
    </div>
  )
}

export function fmtPts(n) {
  const whole = Math.floor(n)
  const half = n - whole >= 0.5
  if (whole === 0 && half) return '\u00BD'
  return half ? `${whole}\u00BD` : `${whole}`
}
