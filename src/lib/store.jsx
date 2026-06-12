import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { fetchAll, put, flush, pendingCount, sha256 } from './api.js'
import { DEFAULT_META } from './defaults.js'

const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

const CACHE_KEY = 'mc_cache'
const SESSION_KEY = 'mc_session'
const POLL_MS = 15000

export function StoreProvider({ children }) {
  const [data, setData] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || null } catch { return null }
  })
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null } catch { return null }
  })
  const [online, setOnline] = useState(true)
  const [pending, setPending] = useState(pendingCount())
  const dataRef = useRef(data)
  dataRef.current = data

  const refresh = useCallback(async () => {
    try {
      await flush()
      const d = await fetchAll()
      setData(d)
      localStorage.setItem(CACHE_KEY, JSON.stringify(d))
      setOnline(true)
    } catch {
      setOnline(false)
    } finally {
      setPending(pendingCount())
    }
  }, [])

  useEffect(() => {
    refresh()
    const iv = setInterval(refresh, POLL_MS)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => { clearInterval(iv); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onFocus) }
  }, [refresh])

  // Optimistic local write + queue to server.
  const write = useCallback((key, value) => {
    setData(prev => {
      const next = { ...(prev || {}), [key]: value }
      localStorage.setItem(CACHE_KEY, JSON.stringify(next))
      return next
    })
    put(key, value).then(ok => { setOnline(ok); setPending(pendingCount()) })
  }, [])

  const meta = (data && data.meta) || DEFAULT_META

  // ---------- auth ----------
  const login = useCallback(async (pid, pin) => {
    if (!dataRef.current) return { ok: false, error: 'Still connecting to the clubhouse \u2014 give it a second and try again.' }
    const prof = dataRef.current?.[`prof:${pid}`]
    const hash = await sha256(`${pid}:${pin}`)
    if (!prof || !prof.pinHash) {
      // first login claims the profile with this PIN
      write(`prof:${pid}`, { ...(prof || {}), hcp: prof?.hcp ?? 20, pinHash: hash })
      const s = { pid }
      setSession(s); localStorage.setItem(SESSION_KEY, JSON.stringify(s))
      return { ok: true, claimed: true }
    }
    if (prof.pinHash !== hash) return { ok: false, error: 'Wrong PIN. Ask the Commissioner for a reset if you forgot it.' }
    const s = { pid }
    setSession(s); localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    return { ok: true }
  }, [write])

  const logout = useCallback(() => {
    setSession(null)
    localStorage.removeItem(SESSION_KEY)
  }, [])

  // Forgot PIN: honor-system self-service reset from the login screen.
  // Overwrites the stored hash with a new one and logs the player in.
  const forgotPin = useCallback(async (pid, pin) => {
    const prof = dataRef.current?.[`prof:${pid}`] || {}
    write(`prof:${pid}`, { ...prof, pinHash: await sha256(`${pid}:${pin}`) })
    const s = { pid }
    setSession(s); localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    return { ok: true }
  }, [write])

  const unlockAdmin = useCallback(async (pin) => {
    const hash = await sha256(`admin:${pin}`)
    const stored = dataRef.current?.['prof:admin']?.pinHash
    if (stored && hash === stored) {
      const s = { ...(session || {}), admin: true }
      setSession(s); localStorage.setItem(SESSION_KEY, JSON.stringify(s))
      return true
    }
    return false
  }, [session])

  // ---------- mutations ----------
  const setScore = useCallback((rid, pid, holeIdx, gross) => {
    const cur = dataRef.current?.[`scores:${rid}:${pid}`]
    const arr = Array.isArray(cur) ? [...cur] : Array(18).fill(null)
    arr[holeIdx] = gross
    write(`scores:${rid}:${pid}`, arr)
  }, [write])

  const setHcp = useCallback((pid, hcp) => {
    const prof = dataRef.current?.[`prof:${pid}`] || {}
    write(`prof:${pid}`, { ...prof, hcp })
  }, [write])

  const setPin = useCallback(async (pid, pin) => {
    const prof = dataRef.current?.[`prof:${pid}`] || {}
    write(`prof:${pid}`, { ...prof, pinHash: await sha256(`${pid}:${pin}`) })
  }, [write])

  const resetPin = useCallback((pid) => {
    const prof = dataRef.current?.[`prof:${pid}`] || {}
    const { pinHash, ...rest } = prof
    write(`prof:${pid}`, rest)
  }, [write])

  const setAdminPin = useCallback(async (pin) => {
    write('prof:admin', { pinHash: await sha256(`admin:${pin}`) })
  }, [write])

  const updateMeta = useCallback((mutator) => {
    const cur = dataRef.current?.meta || DEFAULT_META
    write('meta', mutator(structuredClone(cur)))
  }, [write])

  const setComp = useCallback((rid, kind, holeIdx, entry) => {
    const cur = dataRef.current?.[`comps:${rid}`] || { ctp: {}, ld: {} }
    const next = structuredClone(cur)
    if (!next[kind]) next[kind] = {}
    if (entry) next[kind][holeIdx] = entry
    else delete next[kind][holeIdx]
    write(`comps:${rid}`, next)
  }, [write])

  const clearRoundScores = useCallback((rid) => {
    const m = dataRef.current?.meta || DEFAULT_META
    for (const p of m.players) write(`scores:${rid}:${p.id}`, Array(18).fill(null))
  }, [write])

  const value = {
    data: data || {}, meta, session, online, pending, refresh,
    login, logout, unlockAdmin, forgotPin,
    setScore, setHcp, setPin, resetPin, setAdminPin, updateMeta, setComp, clearRoundScores,
    me: session ? meta.players.find(p => p.id === session.pid) : null,
    isAdmin: !!session?.admin,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
