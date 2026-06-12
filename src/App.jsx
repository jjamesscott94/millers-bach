import React, { useEffect, useState } from 'react'
import trophy from './assets/trophy.png'
import { useStore } from './lib/store.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Round from './pages/Round.jsx'
import Teams from './pages/Teams.jsx'
import Profile from './pages/Profile.jsx'
import Admin from './pages/Admin.jsx'

// Tiny hash router: '#/', '#/round/r1', '#/teams', '#/me', '#/admin'
function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || '#/')
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash.replace(/^#/, '') || '/'
}

export function go(path) {
  window.location.hash = path
}

const NAV = [
  { path: '/', label: 'Cup', icon: '\u{1F3C6}' },
  { path: '/round', label: 'Play', icon: '\u26F3' },
  { path: '/teams', label: 'Teams', icon: '\u{1F465}' },
  { path: '/me', label: 'Me', icon: '\u{1F464}' },
]

export default function App() {
  const { session, meta, online, pending } = useStore()
  const route = useHashRoute()

  if (!session) return <Login />

  const parts = route.split('/').filter(Boolean)
  let page
  if (parts[0] === 'round') {
    page = <Round roundId={parts[1] || meta.rounds[0].id} tab={parts[2] || 'score'} />
  } else if (parts[0] === 'teams') {
    page = <Teams />
  } else if (parts[0] === 'me') {
    page = <Profile />
  } else if (parts[0] === 'admin') {
    page = <Admin />
  } else {
    page = <Dashboard />
  }

  return (
    <div className="app">
      <header className="masthead">
        <img className="masthead-trophy" src={trophy} alt="The Miller Cup trophy" />
        <div className="masthead-title">{meta.eventName}</div>
        <div className="masthead-kicker">Scottsdale, Ariz. &middot; {meta.dates}</div>
      </header>
      {(!online || pending > 0) && (
        <div className="syncbar">
          {online ? `Syncing ${pending} change${pending === 1 ? '' : 's'}\u2026` : 'Offline \u2014 changes saved on this phone and will sync when you\u2019re back.'}
        </div>
      )}
      <main className="page">{page}</main>
      <nav className="bottomnav">
        {NAV.map(n => {
          const active = n.path === '/' ? route === '/' : route.startsWith(n.path)
          return (
            <button key={n.path} className={active ? 'navbtn active' : 'navbtn'} onClick={() => go(n.path)}>
              <span className="navicon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
