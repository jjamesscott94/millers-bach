import React from 'react'
import { useStore } from '../lib/store.jsx'
import { getHcp, playerById } from '../lib/engine.js'
import { go } from '../App.jsx'

export default function Teams() {
  const { data, meta, isAdmin } = useStore()
  return (
    <div>
      <header className="hero"><h1>Teams</h1><p>7 on {meta.teams.A.name} &mdash; one man rides the bench each round.</p></header>
      {['A', 'B'].map(tid => {
        const team = meta.teams[tid]
        const roster = meta.players.filter(p => p.team === tid)
        return (
          <div key={tid} className="card" style={{ borderTop: `4px solid ${team.color}` }}>
            <h3 style={{ color: team.color }}>{team.name} <span className="hint">({roster.length} men)</span></h3>
            <table className="table"><tbody>
              {roster.map(p => (
                <tr key={p.id}>
                  <td>{p.name}{p.groom ? ' \u{1F935} (the groom)' : ''}</td>
                  <td className="num">hcp {getHcp(data, p.id)}</td>
                  <td className="num hint">{data[`prof:${p.id}`]?.pinHash ? 'claimed' : 'unclaimed'}</td>
                </tr>
              ))}
            </tbody></table>
          </div>
        )
      })}
      <div className="card">
        <h3>Round lineups</h3>
        {meta.rounds.map(r => (
          <p key={r.id}>
            <strong>{r.name}:</strong>{' '}
            {r.sitting?.length ? <>sitting &mdash; {r.sitting.map(pid => playerById(meta, pid)?.name).join(', ')}</> : 'everyone plays'}
          </p>
        ))}
        <p className="hint">{isAdmin ? 'Set subs and pairings in the Commissioner panel.' : 'The Commissioner sets subs and pairings (Me tab \u2192 Commissioner).'}</p>
        {isAdmin && <button className="btn" onClick={() => go('/admin')}>Open Commissioner panel</button>}
      </div>
    </div>
  )
}
