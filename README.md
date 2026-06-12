# The Miller Cup ⛳

Ryder Cup-style scoring app for Luke Miller's bachelor party golf weekend —
13 guys, 3 rounds, skins, drinking games, and bragging rights.

**Live site:** https://jjamesscott94.github.io/millers-bach/

## The format

| Round | Course | Where | Format |
|---|---|---|---|
| 1 | Grey Hawk Golf Club | Real life — Sat, June 13 | Four-ball (2v2 net best ball), 3 matches |
| 2 | Pebble Beach | Simulator | Four-ball, 3 matches |
| 3 | Pinehurst No. 2 | Simulator | Singles (1v1), 6 matches |

12 points up for grabs — first team to **6.5** takes the Cup.

- **Team Miller** carries 7 players and subs one man out each round (the
  Commissioner sets who sits and the pairings in the admin panel).
- **Skins** run every round: lowest unique *net* score wins the hole, ties
  carry the pot. Tracked automatically from the scorecards.
- **Competitions:** closest to the pin on every par 3, longest drive on the
  big par 5. Honor system entry in the Comps tab.
- **Drinking games** for all 18 holes, editable by the Commissioner.

## How players use it

1. Open the site, tap your name, set a 4-digit PIN (first login claims the slot).
2. Placeholder name? Rename yourself in the **Me** tab.
3. Everyone starts at a **20 handicap** — only *you* can edit yours (Me tab).
4. Enter scores hole by hole in **Play → Scores**. Anyone in your group can
   keep the card. Everything saves automatically and syncs to all phones.

## Commissioner

Unlock from the **Me** tab. Initial PIN: **1313** — change it right away.
The Commissioner can rename players, move guys between teams, set subs and
matchups, reset forgotten PINs, edit handicaps, change skin values, and wipe
a round's scores.

## Tech notes

- React + Vite static app, deployed to GitHub Pages by the workflow in
  `.github/workflows/deploy.yml` on every push to `main`.
- Shared state lives in a [kvdb.io](https://kvdb.io) bucket (see
  `src/lib/defaults.js`), polled every 15s. Writes are queued in
  `localStorage` and retried, so spotty course wifi won't lose scores.
- `npm run seed` initializes the bucket (`--force` re-seeds config without
  touching scores). `npm run dev` for local dev.
- This is a weekend party app: auth is PIN-on-the-honor-system, and anyone
  with the bucket ID could write to it. Don't run a major championship on it.
