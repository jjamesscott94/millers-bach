// Seeds the kvdb.io bucket with the initial event state.
// Usage: npm run seed            (won't overwrite an existing meta)
//        npm run seed -- --force (overwrites meta/profiles, keeps scores)
import { createHash } from 'node:crypto'
import { DEFAULT_META, API_BASE, PLAYERS } from '../src/lib/defaults.js'

const force = process.argv.includes('--force')
const sha256 = s => createHash('sha256').update(s).digest('hex')

async function put(key, value) {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(value),
  })
  if (!res.ok) throw new Error(`PUT ${key} -> ${res.status}`)
  console.log(`  put ${key}`)
}

const existing = await fetch(`${API_BASE}/meta`)
if (existing.ok && !force) {
  console.log('Bucket already seeded (meta exists). Use --force to overwrite config.')
  process.exit(0)
}

console.log(`Seeding ${API_BASE} ...`)
await put('meta', DEFAULT_META)

// Commissioner PIN starts as 1313 — change it in the app after first login.
await put('prof:admin', { pinHash: sha256('admin:1313') })

for (const p of PLAYERS) {
  await put(`prof:${p.id}`, { hcp: p.hcp ?? 20 })
  for (const r of DEFAULT_META.rounds) {
    await put(`scores:${r.id}:${p.id}`, Array(18).fill(null))
  }
}
for (const r of DEFAULT_META.rounds) {
  await put(`comps:${r.id}`, { ctp: {}, ld: {} })
}
console.log('Done. Commissioner PIN: 1313 (change it in the app).')
