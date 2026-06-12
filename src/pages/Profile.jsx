import React, { useState } from 'react'
import { useStore } from '../lib/store.jsx'
import { getHcp } from '../lib/engine.js'
import { go } from '../App.jsx'

export default function Profile() {
  const { data, meta, me, session, logout, setHcp, setPin, updateMeta, unlockAdmin, isAdmin, refresh } = useStore()
  const [name, setName] = useState(me?.name || '')
  const [hcp, setHcpVal] = useState(String(getHcp(data, session.pid)))
  const [pin1, setPin1] = useState('')
  const [adminPin, setAdminPin] = useState('')
  const [msg, setMsg] = useState('')
  const [adminErr, setAdminErr] = useState('')

  if (!me) return null

  function flash(m) { setMsg(m); setTimeout(() => setMsg(''), 2500) }

  return (
    <div>
      <header className="hero"><h1>{me.name}{me.groom ? ' \u{1F935}' : ''}</h1><p>{meta.teams[me.team].name}</p></header>
      {msg && <div className="card flash">{msg}</div>}

      <div className="card">
        <h3>Display name</h3>
        <p className="hint">Got assigned a placeholder? Fix it here.</p>
        <div className="row">
          <input value={name} onChange={e => setName(e.target.value)} maxLength={24} />
          <button className="btn primary" onClick={() => {
            const n = name.trim()
            if (!n) return
            updateMeta(m => { const p = m.players.find(p => p.id === me.id); if (p) p.name = n; return m })
            flash('Name updated.')
          }}>Save</button>
        </div>
      </div>

      <div className="card">
        <h3>Your handicap</h3>
        <p className="hint">Seeded from the trip sheet. Only you can change yours &mdash; be honest, the strokes matter.</p>
        <div className="row">
          <input type="number" inputMode="numeric" min="0" max="40" value={hcp} onChange={e => setHcpVal(e.target.value)} />
          <button className="btn primary" onClick={() => {
            const v = Math.max(0, Math.min(40, parseInt(hcp || '0', 10)))
            setHcp(session.pid, v); setHcpVal(String(v)); flash(`Handicap set to ${v}.`)
          }}>Save</button>
        </div>
      </div>

      <div className="card">
        <h3>Change PIN</h3>
        <div className="row">
          <input type="password" inputMode="numeric" placeholder="New PIN (4+ digits)" value={pin1} onChange={e => setPin1(e.target.value.replace(/\D/g, ''))} maxLength={8} />
          <button className="btn" onClick={async () => {
            if (pin1.length < 4) { flash('PIN must be at least 4 digits.'); return }
            await setPin(session.pid, pin1); setPin1(''); flash('PIN changed.')
          }}>Update</button>
        </div>
      </div>

      <div className="card">
        <h3>Commissioner</h3>
        {isAdmin ? (
          <button className="btn primary" onClick={() => go('/admin')}>Open Commissioner panel</button>
        ) : (
          <>
            <p className="hint">Running the show? Enter the Commissioner PIN to manage names, teams, subs, and matchups.</p>
            <div className="row">
              <input type="password" inputMode="numeric" placeholder="Commissioner PIN" value={adminPin} onChange={e => setAdminPin(e.target.value)} maxLength={8} />
              <button className="btn" onClick={async () => {
                if (await unlockAdmin(adminPin)) { setAdminErr(''); go('/admin') } else setAdminErr('Nope. Wrong PIN.')
              }}>Unlock</button>
            </div>
            {adminErr && <p className="error">{adminErr}</p>}
          </>
        )}
      </div>

      <div className="card">
        <div className="row">
          <button className="btn" onClick={refresh}>Force refresh</button>
          <button className="btn danger" onClick={logout}>Log out</button>
        </div>
      </div>
    </div>
  )
}
