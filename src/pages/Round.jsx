import React, { useMemo, useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { getScores, getHcp, matchStatus, skinsPool, skinsBuyIn, strokesOnHole, netScore, dots, playerById, fmtMoney } from '../lib/engine.js'
import { go } from '../App.jsx'
import { fmtPts } from './Dashboard.jsx'

const TABS = [
  { id: 'score', label: 'Scores' },
  { id: 'matches', label: 'Matches' },
  { id: 'skins', label: 'Skins' },
  { id: 'games', label: 'Games' },
  { id: 'comps', label: 'Comps' },
]

export default function Round({ roundId, tab }) {
  const { meta } = useStore()
  const round = meta.rounds.find(r => r.id === roundId) || meta.rounds[0]
  const course = meta.courses[round.course]

  return (
    <div>
      <div className="chips">
        {meta.rounds.map(r => (
          <button key={r.id} className={r.id === round.id ? 'chip active' : 'chip'} onClick={() => go(`/round/${r.id}/${tab}`)}>
            {r.name.replace(/^Round \d+ · /, '')}
          </button>
        ))}
      </div>
      <header className="roundhead">
        <h1>{round.name}</h1>
        <p>{course.name} &middot; {round.date}</p>
        <p className="hint">{round.format === 'fourball' ? 'Four-ball: pairs, net best ball wins the hole.' : 'Singles: head to head, net match play.'}</p>
        {round.sitting?.length > 0 && (
          <p className="sitting">Riding the bench: {round.sitting.map(pid => playerById(meta, pid)?.name).join(', ')} (still drinks, can still post a card for skins)</p>
        )}
      </header>
      <div className="tabs">
        {TABS.map(t => (
          <button key={t.id} className={t.id === tab ? 'tab active' : 'tab'} onClick={() => go(`/round/${round.id}/${t.id}`)}>{t.label}</button>
        ))}
      </div>
      {tab === 'score' && <ScoreTab key={round.id} round={round} course={course} />}
      {tab === 'matches' && <MatchesTab round={round} course={course} />}
      {tab === 'skins' && <SkinsTab round={round} course={course} />}
      {tab === 'games' && <GamesTab />}
      {tab === 'comps' && <CompsTab key={round.id} round={round} course={course} />}
    </div>
  )
}

// ---------------- Scores ----------------

function ScoreTab({ round, course }) {
  const { data, meta, me, setScore, setSkinsIn } = useStore()
  const meInSkins = me ? data[`skinsin:${round.id}:${me.id}`] === true : true
  const groups = useMemo(() => {
    const gs = round.matches.map((m, i) => ({
      id: m.id, label: `Match ${i + 1}`, pids: [...m.a, ...m.b].filter(Boolean),
    }))
    gs.push({ id: 'all', label: 'Everyone', pids: meta.players.map(p => p.id) })
    return gs
  }, [round, meta])

  const myGroup = groups.find(g => g.id !== 'all' && me && g.pids.includes(me.id))
  const [groupId, setGroupId] = useState(myGroup ? myGroup.id : 'all')
  const group = groups.find(g => g.id === groupId) || groups[groups.length - 1]
  const [hole, setHole] = useState(() => firstOpenHole(data, round.id, group.pids))
  const [view, setView] = useState('hole')

  const game = meta.games[hole]

  return (
    <div>
      <div className="chips">
        {groups.map(g => (
          <button key={g.id} className={g.id === group.id ? 'chip active' : 'chip'} onClick={() => setGroupId(g.id)}>{g.label}</button>
        ))}
        <button className={view === 'card' ? 'chip active' : 'chip'} onClick={() => setView(view === 'card' ? 'hole' : 'card')}>
          {view === 'card' ? 'Hole view' : 'Full card'}
        </button>
      </div>

      {view === 'card' ? <FullCard round={round} course={course} pids={group.pids} /> : (
        <>
          <div className="holenav">
            <button className="btn" onClick={() => setHole(h => Math.max(0, h - 1))} disabled={hole === 0}>&larr;</button>
            <div className="holeinfo">
              <div className="holenum">Hole {hole + 1}</div>
              <div className="holemeta">Par {course.par[hole]} &middot; {course.yards[hole]} yds &middot; SI {course.si[hole]}</div>
            </div>
            <button className="btn" onClick={() => setHole(h => Math.min(17, h + 1))} disabled={hole === 17}>&rarr;</button>
          </div>

          <div className="holedots">
            {course.par.map((_, i) => (
              <button key={i} className={i === hole ? 'holedot active' : holeComplete(data, round.id, group.pids, i) ? 'holedot done' : 'holedot'} onClick={() => setHole(i)}>{i + 1}</button>
            ))}
          </div>

          <div className="card gamecard">
            <span className="gamelabel">{'\u{1F37A}'} Hole {hole + 1} game</span>
            <p>{game}</p>
          </div>

          {me && !meInSkins && (
            <div className="card skinnudge">
              <span>You&rsquo;re <strong>not in skins</strong> this round.</span>
              <button className="btn small primary" onClick={() => setSkinsIn(round.id, me.id, true)}>Buy in &middot; {fmtMoney(skinsBuyIn(meta))}</button>
            </div>
          )}

          <div className="scoregrid">
          {group.pids.map(pid => {
            const p = playerById(meta, pid)
            if (!p) return null
            const gross = getScores(data, round.id, pid)[hole]
            const hcp = getHcp(data, pid)
            const pops = strokesOnHole(hcp, course.si[hole])
            const net = netScore(gross, hcp, course.si[hole])
            return (
              <div key={pid} className="scorerow" style={{ '--c': meta.teams[p.team].color }}>
                <div className="scorename">
                  <span>{p.name}{p.groom ? ' \u{1F935}' : ''} <span className="popdots">{dots(pops)}</span></span>
                  <span className="scoresub">hcp {hcp}{gross != null ? ` · net ${net}` : ''}</span>
                  {gross != null && <ScoreFeed gross={gross} par={course.par[hole]} />}
                </div>
                <div className="stepper">
                  <button className="stepbtn" onClick={() => setScore(round.id, pid, hole, gross == null ? null : gross - 1 < 1 ? null : gross - 1)}>&minus;</button>
                  <span className={`stepval ${scoreClass(gross, course.par[hole])}`}>{gross ?? '\u2013'}</span>
                  <button className="stepbtn" onClick={() => setScore(round.id, pid, hole, gross == null ? course.par[hole] : Math.min(15, gross + 1))}>+</button>
                </div>
              </div>
            )
          })}
          </div>
          <p className="hint">Tap + on an empty box to start at par. Anyone in the group can keep the card. Scores save automatically.</p>
        </>
      )}
    </div>
  )
}

function ScoreFeed({ gross, par }) {
  const d = gross - par
  if (d <= -2) return <span className="scorefeed under">{'\u{1F985}'} EAGLE!</span>
  if (d === -1) return <span className="scorefeed under">{'\u{1F525}'} BIRDIE!</span>
  if (d === 0) return <span className="scorefeed even">{'\u2705'} PAR</span>
  if (d === 1) return <span className="scorefeed over">BOGEY</span>
  return <span className="scorefeed over">{'\u{1F480}'} +{d}</span>
}

function firstOpenHole(data, rid, pids) {
  for (let h = 0; h < 18; h++) {
    if (!pids.every(pid => getScores(data, rid, pid)[h] != null)) return h
  }
  return 17
}
function holeComplete(data, rid, pids, h) {
  return pids.every(pid => getScores(data, rid, pid)[h] != null)
}
function scoreClass(gross, par) {
  if (gross == null) return ''
  if (gross < par) return 'under'
  if (gross === par) return 'even'
  return 'over'
}

function FullCard({ round, course, pids }) {
  const { data, meta } = useStore()
  return (
    <div className="card tablewrap">
      <table className="table cardtable">
        <thead>
          <tr><th>Hole</th>{course.par.map((_, i) => <th key={i}>{i + 1}</th>)}<th>Tot</th></tr>
          <tr className="parrow"><th>Par</th>{course.par.map((p, i) => <th key={i}>{p}</th>)}<th>{course.par.reduce((a, b) => a + b, 0)}</th></tr>
        </thead>
        <tbody>
          {pids.map(pid => {
            const p = playerById(meta, pid)
            if (!p) return null
            const sc = getScores(data, round.id, pid)
            const tot = sc.reduce((a, b) => a + (b || 0), 0)
            return (
              <tr key={pid}>
                <td className="namecell">{p.name}</td>
                {sc.map((g, i) => <td key={i} className={scoreClass(g, course.par[i])}>{g ?? ''}</td>)}
                <td className="num">{tot || ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ---------------- Matches ----------------

function MatchesTab({ round, course }) {
  const { data, meta } = useStore()
  const pts = { A: 0, B: 0 }
  const statuses = round.matches.map(m => {
    const st = matchStatus(data, round.id, m, course)
    pts.A += st.points.A; pts.B += st.points.B
    return st
  })
  return (
    <div>
      <div className="card matchpts">
        <span style={{ color: meta.teams.A.color }}>{meta.teams.A.name} {fmtPts(pts.A)}</span>
        <span className="vs">round points</span>
        <span style={{ color: meta.teams.B.color }}>{fmtPts(pts.B)} {meta.teams.B.name}</span>
      </div>
      <div className="matchgrid">
      {round.matches.map((m, i) => {
        const st = statuses[i]
        return (
          <div key={m.id} className="card match">
            <div className="matchrow">
              <div className="matchside" style={{ color: meta.teams.A.color }}>
                {m.a.map(pid => <div key={pid}>{playerById(meta, pid)?.name || '\u2014'}</div>)}
              </div>
              <div className={`matchstatus ${st.done ? 'final' : st.thru > 0 ? 'live' : ''}`}>
                <div className="matchlabel">
                  {st.thru === 0 ? 'NOT STARTED' : st.done
                    ? (st.winner ? `${meta.teams[st.winner].name} win ${st.label}` : 'HALVED')
                    : (st.up === 0 ? st.label : `${meta.teams[st.up > 0 ? 'A' : 'B'].name} ${st.label}`)}
                </div>
                {st.done && <div className="matchfinal">FINAL</div>}
              </div>
              <div className="matchside right" style={{ color: meta.teams.B.color }}>
                {m.b.map(pid => <div key={pid}>{playerById(meta, pid)?.name || '\u2014'}</div>)}
              </div>
            </div>
            <HoleStrip data={data} rid={round.id} match={m} course={course} meta={meta} />
          </div>
        )
      })}
      </div>
    </div>
  )
}

function HoleStrip({ data, rid, match, course, meta }) {
  const cells = []
  for (let h = 0; h < 18; h++) {
    const a = bestNet(data, rid, match.a, course, h)
    const b = bestNet(data, rid, match.b, course, h)
    if (a == null || b == null) { cells.push(<span key={h} className="hs" />); continue }
    const cls = a < b ? 'hs a' : b < a ? 'hs b' : 'hs t'
    const col = a < b ? meta.teams.A.color : b < a ? meta.teams.B.color : undefined
    cells.push(<span key={h} className={cls} style={col ? { background: col } : undefined} title={`Hole ${h + 1}`} />)
  }
  return <div className="holestrip">{cells}</div>
}
function bestNet(data, rid, pids, course, h) {
  let best = null
  for (const pid of pids) {
    if (!pid) continue
    const g = getScores(data, rid, pid)[h]
    if (g == null) return null
    const n = netScore(g, getHcp(data, pid), course.si[h])
    if (best == null || n < best) best = n
  }
  return best
}

// ---------------- Skins ----------------

function SkinsTab({ round, course }) {
  const { data, meta, me, setSkinsIn } = useStore()
  const { entrants, pot, holes, totals, carryLeft, claimed, payouts } = skinsPool(data, meta, round)
  const rank = Object.entries(totals).sort((a, b) => b[1] - a[1])
  const buyIn = skinsBuyIn(meta)
  const meIn = me ? entrants.includes(me.id) : false
  return (
    <div>
      <div className="card skinspool">
        <div className="pool-row">
          <div>
            <div className="pool-pot">{fmtMoney(pot)}</div>
            <div className="hint">{entrants.length} in &times; {fmtMoney(buyIn)} buy-in</div>
          </div>
          {me && (
            <button className={meIn ? 'btn' : 'btn primary'} onClick={() => setSkinsIn(round.id, me.id, !meIn)}>
              {meIn ? 'I\u2019m in \u00b7 tap to drop out' : `Buy in \u00b7 ${fmtMoney(buyIn)}`}
            </button>
          )}
        </div>
        <p className="hint">
          {entrants.length === 0
            ? 'Nobody\u2019s in yet \u2014 first buy-in starts the pot. Cash settles at the bar.'
            : `In: ${entrants.map(pid => playerById(meta, pid)?.name).join(', ')}`}
        </p>
      </div>
      <div className="card">
        <h3>Round skins leaderboard</h3>
        {rank.length === 0
          ? <p className="hint">Nothing claimed yet &mdash; first outright low {meta.skinsNet !== false ? 'net' : 'gross'} score among entrants opens the account.</p>
          : (
            <table className="table">
              <thead><tr><th>Player</th><th className="num">Skins</th><th className="num">Payout*</th></tr></thead>
              <tbody>
              {rank.map(([pid, n]) => (
                <tr key={pid}>
                  <td>{playerById(meta, pid)?.name}</td>
                  <td className="num">{n}</td>
                  <td className="num">{payouts[pid] != null ? fmtMoney(payouts[pid]) : ''}</td>
                </tr>
              ))}
            </tbody></table>
          )}
        <p className="hint">
          {claimed} skin{claimed === 1 ? '' : 's'} claimed{carryLeft > 0 ? ` \u00b7 ${carryLeft + 1} riding on the next outright winner` : ''}.
          {claimed > 0 ? ' *Projected: the pot splits across all skins won, so values move until the round\u2019s done.' : ''}
        </p>
      </div>
      <div className="card">
        <h3>{'\u{1F4B0}'} How skins work</h3>
        <ul className="rules">
          <li><strong>Opt-in per round:</strong> tap Buy in above ({fmtMoney(buyIn)} a round, cash at the bar). Only entrants&rsquo; scores count for skins &mdash; you can&rsquo;t win a hole you didn&rsquo;t pay for.</li>
          <li>Every hole puts <strong>1 skin on the line</strong>. Lowest <strong>{meta.skinsNet !== false ? 'NET' : 'GROSS'} score wins it outright</strong> &mdash; any tie for low and nobody takes it.</li>
          <li>Tied skins <strong>ride onto the next hole</strong> and stack. Push holes 3 and 4, and hole 5 is worth 3 skins.</li>
          <li><strong>Payouts:</strong> the round&rsquo;s pot (buy-ins &times; entrants) splits across all skins won. Win 3 of 9 claimed skins, take a third of the pot. No skins won = money back.</li>
          <li>Benched players can buy in, post a card, and steal skins too.</li>
        </ul>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Hole</th><th>Result</th><th className="num">Pot</th></tr></thead>
          <tbody>
            {holes.map(h => (
              <tr key={h.hole} className={h.state === 'won' ? 'skinwon' : ''}>
                <td>{h.hole + 1} <span className="hint">(par {course.par[h.hole]})</span></td>
                <td>
                  {h.state === 'won' && <>{playerById(meta, h.pid)?.name} &middot; {meta.skinsNet !== false ? `net ${h.score}` : h.score}{h.gross !== h.score ? ` (gross ${h.gross})` : ''}</>}
                  {h.state === 'push' && <span className="hint">Push &mdash; carries over</span>}
                  {h.state === 'pending' && <span className="hint">Waiting on scores&hellip;</span>}
                </td>
                <td className="num">{h.state === 'pending' ? '' : h.pot}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------- Games ----------------

function GamesTab() {
  const { meta } = useStore()
  return (
    <div>
      <div className="card">
        <h3>{'\u{1F37A}'} Hole-by-hole drinking games</h3>
        <ol className="gamelist">
          {meta.games.map((g, i) => <li key={i}><span className="gamehole">{i + 1}</span><span>{g}</span></li>)}
        </ol>
      </div>
      <div className="card">
        <h3>Standing rules</h3>
        <ul className="rules">{meta.rules.map((r, i) => <li key={i}>{r}</li>)}</ul>
      </div>
    </div>
  )
}

// ---------------- Competitions ----------------

function CompsTab({ round, course }) {
  const { data, meta, setComp } = useStore()
  const comps = data[`comps:${round.id}`] || { ctp: {}, ld: {} }
  return (
    <div>
      <p className="hint">Tap a card to crown a new leader. Whoever holds it when the round ends wins. Honor system, gentlemen.</p>
      <h3 className="sectionh">{'\u{1F3AF}'} Closest to the pin</h3>
      <div className="compgrid">
      {round.ctpHoles.map(h => (
        <CompCard key={h} kind="ctp" hole={h} entry={comps.ctp?.[h]} unit="ft/in from the cup"
          title={`Hole ${h + 1} · par 3 · ${course.yards[h]} yds`}
          onSave={(entry) => setComp(round.id, 'ctp', h, entry)} />
      ))}
      </div>
      <h3 className="sectionh">{'\u{1F4A3}'} Longest drive</h3>
      <CompCard kind="ld" hole={round.ldHole} entry={comps.ld?.[round.ldHole]} unit="yards"
        title={`Hole ${round.ldHole + 1} · par ${course.par[round.ldHole]} · ${course.yards[round.ldHole]} yds`}
        onSave={(entry) => setComp(round.id, 'ld', round.ldHole, entry)} />
    </div>
  )
}

function CompCard({ title, entry, onSave, unit }) {
  const { meta } = useStore()
  const [editing, setEditing] = useState(false)
  const [pid, setPid] = useState(entry?.pid || meta.players[0].id)
  const [dist, setDist] = useState(entry?.dist || '')
  return (
    <div className="card compcard">
      <div className="comptitle">{title}</div>
      {!editing ? (
        <button className="compbody" onClick={() => { setPid(entry?.pid || meta.players[0].id); setDist(entry?.dist || ''); setEditing(true) }}>
          {entry ? (
            <><span className="compleader">{playerById(meta, entry.pid)?.name}</span>{entry.dist && <span className="compdist">{entry.dist}</span>}</>
          ) : <span className="hint">Unclaimed &mdash; tap to enter a leader</span>}
        </button>
      ) : (
        <div className="compedit">
          <select value={pid} onChange={e => setPid(e.target.value)}>
            {meta.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input placeholder={unit} value={dist} onChange={e => setDist(e.target.value)} />
          <div className="row">
            <button className="btn primary" onClick={() => { onSave({ pid, dist: dist.trim() }); setEditing(false) }}>Save</button>
            <button className="btn" onClick={() => setEditing(false)}>Cancel</button>
            {entry && <button className="btn danger" onClick={() => { onSave(null); setEditing(false) }}>Clear</button>}
          </div>
        </div>
      )}
    </div>
  )
}
