import { API_BASE } from './defaults.js'

// Tiny client for kvdb.io. The whole event lives in one bucket:
//   meta                  event config (teams, rounds, matches, courses...)
//   prof:{pid}            per-player profile { hcp, pinHash, displayName? }
//   scores:{rid}:{pid}    array[18] of gross strokes (null = not played)
//   comps:{rid}           { ctp: {holeIdx: {pid, dist}}, ld: {holeIdx: {pid, dist}} }
//
// Writes are queued in localStorage and retried, so spotty course wifi
// doesn't eat anybody's scores.

const QKEY = 'mc_pending_writes'

function loadQueue() {
  try { return JSON.parse(localStorage.getItem(QKEY)) || {} } catch { return {} }
}
function saveQueue(q) {
  localStorage.setItem(QKEY, JSON.stringify(q))
}

export function pendingCount() {
  return Object.keys(loadQueue()).length
}

export async function fetchAll() {
  const res = await fetch(`${API_BASE}/?values=true&format=json&limit=1000&t=${Date.now()}`)
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
  const pairs = await res.json()
  const data = {}
  for (const [k, v] of pairs) {
    try { data[k] = JSON.parse(v) } catch { data[k] = v }
  }
  // Anything still queued locally is newer than what the server returned.
  const q = loadQueue()
  for (const [k, v] of Object.entries(q)) data[k] = v
  return data
}

async function putNow(key, value) {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(value),
  })
  if (!res.ok) throw new Error(`put failed: ${res.status}`)
}

// Optimistic write: queue first, then try to flush. Returns true if synced.
export async function put(key, value) {
  const q = loadQueue()
  q[key] = value
  saveQueue(q)
  return flush()
}

let flushing = false
export async function flush() {
  if (flushing) return false
  flushing = true
  try {
    let ok = true
    const q = loadQueue()
    for (const [key, value] of Object.entries(q)) {
      try {
        await putNow(key, value)
        const cur = loadQueue()
        delete cur[key]
        saveQueue(cur)
      } catch {
        ok = false
      }
    }
    return ok
  } finally {
    flushing = false
  }
}

export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}
