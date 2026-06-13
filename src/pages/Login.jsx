import React, { useState } from 'react'
import trophy from '../assets/trophy.png'
import { useStore } from '../lib/store.jsx'

export default function Login() {
  const { meta, data, login, forgotPin, online } = useStore()
  const [pid, setPid] = useState(null)
  const [pin, setPinVal] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [resetting, setResetting] = useState(false)

  const claimed = id => !!data[`prof:${id}`]?.pinHash
  const selected = pid ? meta.players.find(p => p.id === pid) : null

  async function submit(e) {
    e.preventDefault()
    if (!pid || pin.length < 4) { setErr('PIN must be at least 4 digits.'); return }
    setBusy(true); setErr('')
    const res = resetting ? await forgotPin(pid, pin) : await login(pid, pin)
    setBusy(false)
    if (!res.ok) setErr(res.error)
  }

  return (
    <div className="login">
      <div className="login-hero">
        <div className="login-trophy"><img src={trophy} alt="The Miller Cup trophy" /></div>
        <h1>{meta.eventName}</h1>
        <p>{meta.subtitle}</p>
        <p className="login-dates">{meta.dates}</p>
      </div>

      {!selected ? (
        <>
          <h2 className="login-h2">Who are you?</h2>
          {!online && Object.keys(data).length === 0 && (
            <p className="hint">Connecting to the clubhouse&hellip; if this hangs, check your signal.</p>
          )}
          <div className="login-grid">
            {meta.players.map(p => (
              <button key={p.id} className="login-player" style={{ borderTopColor: meta.teams[p.team].color }} onClick={() => { setPid(p.id); setErr('') }}>
                <span className="login-name">{p.name}{p.groom ? ' \u{1F935}' : ''}</span>
                <span className="login-team" style={{ color: meta.teams[p.team].color }}>{meta.teams[p.team].name}</span>
                <span className="login-claimed">{claimed(p.id) ? 'PIN set' : 'Tap to claim'}</span>
              </button>
            ))}
          </div>
          <p className="hint">Tap your name and set a PIN. Handicaps are pre-loaded from the trip sheet.</p>
        </>
      ) : (
        <form className="login-pin" onSubmit={submit}>
          <button type="button" className="linkbtn" onClick={() => { setPid(null); setPinVal(''); setResetting(false); setErr('') }}>&larr; Not {selected.name}?</button>
          <h2 className="login-h2">
            {resetting ? `New PIN for ${selected.name}` : claimed(pid) ? `Welcome back, ${selected.name}` : `Claim ${selected.name}`}
          </h2>
          <p className="hint">
            {resetting
              ? 'Pick a new 4+ digit PIN \u2014 it replaces the old one. Resetting a buddy\u2019s PIN to mess with him is a 2-drink penalty.'
              : claimed(pid) ? 'Enter your PIN.' : 'First time in \u2014 set a 4+ digit PIN you\u2019ll remember all day.'}
          </p>
          <input
            autoFocus type="password" inputMode="numeric" placeholder={resetting ? 'New PIN' : 'PIN'}
            value={pin} onChange={e => setPinVal(e.target.value.replace(/\D/g, ''))} maxLength={8}
          />
          {err && <p className="error">{err}</p>}
          <button className="btn primary" disabled={busy}>
            {resetting ? 'Set new PIN & log in' : claimed(pid) ? 'Log in' : 'Claim profile'}
          </button>
          {claimed(pid) && !resetting && (
            <button type="button" className="linkbtn login-forgot" onClick={() => { setResetting(true); setPinVal(''); setErr('') }}>
              Forgot your PIN?
            </button>
          )}
          {resetting && (
            <button type="button" className="linkbtn login-forgot" onClick={() => { setResetting(false); setPinVal(''); setErr('') }}>
              Never mind, I remember it
            </button>
          )}
        </form>
      )}
    </div>
  )
}
