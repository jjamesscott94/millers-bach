// End-to-end smoke test against the live site using headless chromium.
// Run: node scripts/e2e-check.mjs [url]
import { chromium } from 'playwright'

const URL = process.argv[2] || 'https://millers-bach.surge.sh'
let failures = 0
const ok = (name, cond) => {
  if (cond) console.log(`ok   ${name}`)
  else { console.error(`FAIL ${name}`); failures++ }
}

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on('pageerror', e => errors.push(String(e)))
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })

await page.goto(URL, { waitUntil: 'networkidle' })
ok('title', (await page.title()).includes('Miller Cup'))
await page.waitForTimeout(1500)

// Login screen lists all 14 players
const players = await page.locator('.login-player').count()
ok(`login shows 14 players (got ${players})`, players === 14)
ok('Luke Miller present', await page.getByText('Luke Miller').first().isVisible())

// Claim a profile (use Andrew to avoid claiming Luke's slot)
await page.locator('.login-player', { hasText: 'Andrew' }).click()
await page.locator('input[type=password]').fill('9876')
await page.getByRole('button', { name: /claim profile|log in/i }).click()
await page.waitForTimeout(2000)
ok('dashboard scoreboard visible', await page.locator('.scoreboard').isVisible())
ok('masthead shows', await page.locator('.masthead-title').isVisible())
ok('rounds listed', (await page.locator('.roundcard').count()) === 3)

// Enter scores on Round 1
await page.locator('.roundcard').first().click()
await page.waitForTimeout(800)
ok('score tab open', await page.locator('.holenav').isVisible())
ok('drinking game card shows', await page.locator('.gamecard').isVisible())
// Tap + for first two players on hole 1 (sets par), then +1 more for second player
const rows = page.locator('.scorerow')
ok('scorerows shown', (await rows.count()) >= 4)
await rows.nth(0).locator('.stepbtn').nth(1).click() // par
await rows.nth(1).locator('.stepbtn').nth(1).click() // par
await rows.nth(1).locator('.stepbtn').nth(1).click() // bogey
await page.waitForTimeout(2500) // let writes flush
const v0 = await rows.nth(0).locator('.stepval').textContent()
const v1 = await rows.nth(1).locator('.stepval').textContent()
ok(`score entry works (${v0}, ${v1})`, v0 === '4' && v1 === '5')

// Matches tab shows a live status
await page.getByRole('button', { name: 'Matches' }).click()
await page.waitForTimeout(500)
ok('match points bar', await page.locator('.matchpts').isVisible())

// Skins tab renders
await page.getByRole('button', { name: 'Skins' }).click()
await page.waitForTimeout(500)
ok('skins table renders', await page.locator('.table').first().isVisible())

// Games tab
await page.getByRole('button', { name: 'Games', exact: true }).click()
await page.waitForTimeout(500)
ok('18 games listed', (await page.locator('.gamelist li').count()) === 18)

// Comps tab
await page.getByRole('button', { name: 'Comps', exact: true }).click()
await page.waitForTimeout(500)
ok('CTP cards', (await page.locator('.compcard').count()) >= 2)

// Profile: handicap edit visible
await page.locator('.navbtn', { hasText: 'Me' }).click()
await page.waitForTimeout(400)
ok('handicap editor', await page.getByText('Your handicap').isVisible())

// Commissioner unlock
await page.locator('input[placeholder="Commissioner PIN"]').fill('1313')
await page.getByRole('button', { name: 'Unlock' }).click()
await page.waitForTimeout(800)
ok('admin panel opens', await page.getByText('Lineups & matchups').isVisible())

ok('no page errors', errors.length === 0)
if (errors.length) console.error(errors.slice(0, 5))

await browser.close()
if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1) }
console.log('\nAll e2e checks passed.')
