import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { API_BASE, par3s, longestPar5 } from '../lib/defaults.js'

export default function Admin() {
  const { isAdmin } = useStore()
  if (!isAdmin) return <div className="card"><p>Commissioner access required. Unlock it from the Me tab.</p></div>
  return (
    <div>
      <header className="hero"><h1>Commissioner</h1><p>With great power comes great responsibility (and bar tabs).</p></header>
      <PlayersEditor />
      <LineupsEditor />
      <SettingsEditor />
      <GamesEditor />
      <DangerZone />
    </div>
  )
}

function PlayersEditor() {
  const { data, meta, updateMeta, resetPin, setHcp } = useStore()
  const [msg, setMsg] = useState('')
  return (
    <div className="card">
      <h3>Players</h3>
      <p className="hint">Rename the placeholders, move guys between teams, reset forgotten PINs, fix handicaps.</p>
      {msg && <p className="flash">{msg}</p>}
      {meta.players.map(p => (
        <div key={p.id} className="adminplayer">
          <input
            defaultValue={p.name}
            onBlur={e => {
              const n = e.target.value.trim()
              if (n && n !== p.name) { updateMeta(m => { m.players.find(x => x.id === p.id).name = n; return m }); setMsg(`Renamed to ${n}.`) }
            }}
          />
          <select value={p.team} onChange={e => { updateMeta(m => { m.players.find(x => x.id === p.id).team = e.target.value; return m }); setMsg('Team changed — check lineups below.') }}>
            <option value="A">{meta.teams.A.name}</option>
            <option value="B">{meta.teams.B.name}</option>
          </select>
          <input
            className="hcpinput" type="number" min="0" max="40" title="handicap"
            defaultValue={data[`prof:${p.id}`]?.hcp ?? 20}
            onBlur={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setHcp(p.id, Math.max(0, Math.min(40, v))) }}
          />
          <button className="btn small" disabled={!data[`prof:${p.id}`]?.pinHash} onClick={() => { resetPin(p.id); setMsg(`${p.name}'s PIN cleared — they can claim again.`) }}>PIN reset</button>
        </div>
      ))}
    </div>
  )
}

function SkinsEntries({ round }) {
  const { data, meta, setSkinsIn } = useStore()
  const inIds = meta.players.filter(p => data[`skinsin:${round.id}:${p.id}`] === true).map(p => p.id)
  return (
    <>
      <label className="lbl">Skins entries ({inIds.length} in &middot; tap to toggle)</label>
      <div className="chips wrap">
        {meta.players.map(p => {
          const isIn = inIds.includes(p.id)
          return (
            <button key={p.id} className={isIn ? 'chip active' : 'chip'} onClick={() => setSkinsIn(round.id, p.id, !isIn)}>
              {p.name}
            </button>
          )
        })}
      </div>
    </>
  )
}

function LineupsEditor() {
  const { meta, updateMeta } = useStore()
  return (
    <div className="card">
      <h3>Lineups &amp; matchups</h3>
      <p className="hint">Set the Talon pairings. Use optional sit-outs only if someone else drops.</p>
      {meta.rounds.map((round, ri) => (
        <div key={round.id} className="adminround">
          <h4>{round.name} <span className="hint">({round.format === 'fourball' ? '2v2 best ball \u00d73' : `singles \u00d7${round.matches.length}`})</span></h4>
          <label className="lbl">Course</label>
          <select
            value={round.course}
            onChange={e => updateMeta(m => {
              const r = m.rounds[ri]
              r.course = e.target.value
              const c = m.courses[r.course]
              r.ctpHoles = par3s(c)
              r.ldHole = longestPar5(c)
              return m
            })}
          >
            {Object.entries(meta.courses).map(([cid, c]) => <option key={cid} value={cid}>{c.name}</option>)}
          </select>
          <div className="row">
            {['A', 'B'].map(tid => (
              <span key={tid} className="benchpick">
                <label className="lbl">Benched ({meta.teams[tid].name})</label>
                <select
                  value={round.sitting?.find(pid => meta.players.find(p => p.id === pid)?.team === tid) || ''}
                  onChange={e => updateMeta(m => {
                    const keep = (m.rounds[ri].sitting || []).filter(pid => m.players.find(p => p.id === pid)?.team !== tid)
                    m.rounds[ri].sitting = e.target.value ? [...keep, e.target.value] : keep
                    return m
                  })}
                >
                  <option value="">Nobody</option>
                  {meta.players.filter(p => p.team === tid).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </span>
            ))}
          </div>
          {round.matches.map((match, mi) => (
            <div key={match.id} className="adminmatch">
              <span className="lbl">Match {mi + 1}</span>
              <div className="matchpickers">
                <SlotPickers round={round} ri={ri} mi={mi} side="a" team="A" />
                <span className="vs">vs</span>
                <SlotPickers round={round} ri={ri} mi={mi} side="b" team="B" />
              </div>
            </div>
          ))}
          <SkinsEntries round={round} />
        </div>
      ))}
      <p className="hint">A man can only play one match per round &mdash; the dropdowns don&rsquo;t enforce it, so double-check yourself, Commish.</p>
    </div>
  )
}

function SlotPickers({ round, ri, mi, side, team }) {
  const { meta, updateMeta } = useStore()
  const slots = round.format === 'fourball' ? [0, 1] : [0]
  return (
    <span className="slotgroup">
      {slots.map(si => (
        <select
          key={si}
          value={round.matches[mi][side][si] || ''}
          onChange={e => updateMeta(m => { m.rounds[ri].matches[mi][side][si] = e.target.value || null; return m })}
        >
          <option value="">&mdash;</option>
          {meta.players.filter(p => p.team === team).map(p => (
            <option key={p.id} value={p.id}>{p.name}{round.sitting?.includes(p.id) ? ' (sitting)' : ''}</option>
          ))}
        </select>
      ))}
    </span>
  )
}

function SettingsEditor() {
  const { meta, updateMeta, setAdminPin } = useStore()
  const [pin, setPin] = useState('')
  const [msg, setMsg] = useState('')
  return (
    <div className="card">
      <h3>Settings</h3>
      {msg && <p className="flash">{msg}</p>}
      <label className="lbl">Team names</label>
      <div className="row">
        <input defaultValue={meta.teams.A.name} onBlur={e => { const v = e.target.value.trim(); if (v) updateMeta(m => { m.teams.A.name = v; return m }) }} />
        <input defaultValue={meta.teams.B.name} onBlur={e => { const v = e.target.value.trim(); if (v) updateMeta(m => { m.teams.B.name = v; return m }) }} />
      </div>
      <label className="lbl">Skins buy-in per player, per round ($)</label>
      <input type="number" min="0" defaultValue={meta.skinsBuyIn ?? meta.skinsValue ?? 5} onBlur={e => { const v = parseInt(e.target.value, 10); updateMeta(m => { m.skinsBuyIn = isNaN(v) ? 0 : v; return m }) }} />
      <label className="lbl">Skins scoring</label>
      <select value={meta.skinsNet !== false ? 'net' : 'gross'} onChange={e => updateMeta(m => { m.skinsNet = e.target.value === 'net'; return m })}>
        <option value="net">Net (handicapped)</option>
        <option value="gross">Gross</option>
      </select>
      <label className="lbl">Change Commissioner PIN</label>
      <div className="row">
        <input type="password" inputMode="numeric" placeholder="New PIN" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} maxLength={8} />
        <button className="btn" onClick={async () => { if (pin.length >= 4) { await setAdminPin(pin); setPin(''); setMsg('Commissioner PIN changed.') } }}>Update</button>
      </div>
    </div>
  )
}

function GamesEditor() {
  const { meta, updateMeta } = useStore()
  const [text, setText] = useState(meta.games.join('\n'))
  const [msg, setMsg] = useState('')
  return (
    <div className="card">
      <h3>Drinking games (one per hole, 18 lines)</h3>
      <textarea rows={10} value={text} onChange={e => setText(e.target.value)} />
      <button className="btn primary" onClick={() => {
        const lines = text.split('\n').map(s => s.trim()).filter(Boolean)
        updateMeta(m => { m.games = lines.slice(0, 18); while (m.games.length < 18) m.games.push('Dealer\u2019s choice.'); return m })
        setMsg('Games updated.')
        setTimeout(() => setMsg(''), 2000)
      }}>Save games</button>
      {msg && <span className="flash"> {msg}</span>}
    </div>
  )
}

function DangerZone() {
  const { data, meta, clearRoundScores } = useStore()
  const [confirmRid, setConfirmRid] = useState(null)
  function exportJson() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `miller-cup-backup-${new Date().toISOString().slice(0, 19)}.json`
    a.click()
  }
  return (
    <div className="card dangercard">
      <h3>Danger zone</h3>
      <div className="row">
        <button className="btn" onClick={exportJson}>Download backup (JSON)</button>
      </div>
      <p className="hint">Backup grabs everything: scores, profiles, settings. Data lives at {API_BASE}.</p>
      {meta.rounds.map(r => (
        <div key={r.id} className="row">
          {confirmRid === r.id ? (
            <>
              <span>Wipe all scores for {r.name}?</span>
              <button className="btn danger" onClick={() => { clearRoundScores(r.id); setConfirmRid(null) }}>Yes, wipe it</button>
              <button className="btn" onClick={() => setConfirmRid(null)}>Cancel</button>
            </>
          ) : (
            <button className="btn danger" onClick={() => setConfirmRid(r.id)}>Clear scores: {r.name}</button>
          )}
        </div>
      ))}
    </div>
  )
}
