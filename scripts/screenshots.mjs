// Capture screenshots of the live site for review.
import { chromium } from 'playwright'

const URL = process.argv[2] || 'https://millers-bach.surge.sh'
const OUT = process.argv[3] || '/opt/cursor/artifacts/screenshots'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })

await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)
await page.screenshot({ path: `${OUT}/login.png` })

// log in as the groom's slot without claiming: use localStorage session directly
await page.evaluate(() => localStorage.setItem('mc_session', JSON.stringify({ pid: 'p1' })))
await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
await page.screenshot({ path: `${OUT}/dashboard.png`, fullPage: true })

await page.goto(`${URL}/#/round/r1/score`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/scorecard.png` })

await page.goto(`${URL}/#/round/r1/matches`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/matches.png` })

await browser.close()
console.log('screenshots saved')
