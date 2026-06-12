# The Miller Cup ⛳

Ryder Cup-style scoring app for Luke Miller's bachelor party golf weekend —
Miller & His Mice go to Scottsdale. 14 golfers, 3 rounds, skins, drinking
games, and bragging rights.

**Live site:** https://millers-bach.surge.sh

## The format

| Round | Course | Where | Format |
|---|---|---|---|
| 1 | Grayhawk (Raptor by default — Talon selectable) | Real life — Sat, June 13 | Four-ball (2v2 net best ball), 3 matches |
| 2 | Pebble Beach | Simulator | Four-ball, 3 matches |
| 3 | Pinehurst No. 2 | Simulator | Sunday singles (1v1), 7 matches |

13 points up for grabs — first team to **7** takes the Cup.

- **Rosters:** 7 a side — **Team Miller** vs **The Mice** — split roughly
  evenly by handicap. Each team benches one man in the pairs rounds;
  everybody plays Sunday singles. The Commissioner sets benches and pairings.
- **Handicaps** are seeded from the trip sheet (Andrew and Pauley had none
  listed, so they start at 20). Each man can edit only his own.
- **Skins** run every round: lowest unique *net* score wins the hole, ties
  carry the pot. Tracked automatically from the scorecards.
- **Competitions:** closest to the pin on every par 3, longest drive on the
  big par 5. Honor system entry in the Comps tab.
- **Drinking games** for all 18 holes, editable by the Commissioner.

## How players use it

1. Open the site, tap your name, set a 4-digit PIN (first login claims the slot).
2. Enter scores hole by hole in **Play → Scores**. Anyone in your group can
   keep the card. Everything saves automatically and syncs to all phones.
3. Check **Matches** for live Ryder Cup status, **Skins** for the money board,
   **Games** for the hole-by-hole drinking rules, **Comps** for CTP/long drive.

## Commissioner

Unlock from the **Me** tab. Initial PIN: **1313** — change it right away.
The Commissioner can rename players, move guys between teams, switch Round 1
between Raptor and Talon, set benches and matchups, reset forgotten PINs,
edit handicaps, change skin values, and wipe a round's scores.

## Tech notes

- React + Vite static app. Live deployment is on [surge.sh](https://surge.sh)
  at https://millers-bach.surge.sh. To redeploy after changes:
  `npm run build && npx surge ./dist millers-bach.surge.sh`
  (log in with the surge account credentials).
- A GitHub Pages workflow (`.github/workflows/deploy.yml`) is also included.
  It starts publishing to https://jjamesscott94.github.io/millers-bach/
  automatically once the repo owner enables Pages
  (Settings → Pages → Source: **GitHub Actions**) — one click, then every
  push to `main` deploys.
- Shared state lives in a [kvdb.io](https://kvdb.io) bucket (see
  `src/lib/defaults.js`), polled every 15s. Writes are queued in
  `localStorage` and retried, so spotty course wifi won't lose scores.
- `npm run seed` initializes the bucket (`--force` re-seeds config without
  touching scores). `npm run dev` for local dev,
  `node scripts/check-engine.mjs` for scoring-engine tests,
  `node scripts/e2e-check.mjs` for a live-site smoke test (Playwright).
- This is a weekend party app: auth is PIN-on-the-honor-system, and anyone
  with the bucket ID could write to it. Don't run a major championship on it.
