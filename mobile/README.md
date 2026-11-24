# Block Journey — iPhone app (Capacitor)

The app bundles a snapshot of the website (`scripts/build-www.sh` renders the home page and copies every asset into `www/`).
iPhone-only code paths switch on when `Capacitor.isNativePlatform()` is true (`src/lib/game/native.ts`):

- Purchases go through Apple In-App Purchase (@capgo/native-purchases) instead of Stripe; **Restore purchases** is in Settings.
- Server calls (leaderboard) go to https://puzzle-journey-ruby.vercel.app (CapacitorHttp, so no CORS).
- No web ads, no Vercel analytics, no preview badge in the app.

Bundle ID: `com.pettygamesstudios.blockjourney` · Team `FHGP486J8U` · portrait only · version 1.0.

## Build
GitHub Actions → "iOS App Store Release (Block Journey)" → Run workflow. It needs these repo secrets (same values as the Infinite Arena repo):
`APP_STORE_CONNECT_API_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_API_PRIVATE_KEY`.
The workflow only appears in the Actions tab once it is on `main` (merge PR #2).

On a Mac instead: `cd mobile && npm install && npm run sync && npm run open`, then Archive in Xcode.

## In-app purchases to create in App Store Connect
Product ID = `com.pettygamesstudios.blockjourney.` + id. Prices match the website.

Consumable:
| id | name | price |
|---|---|---|
| hammer3 | Hammer ×3 | $0.99 |
| refresh3 | Reroll ×3 | $0.99 |
| bomb3 | Bomb ×3 | $1.49 |
| freeze3 | Frost ×3 | $0.99 |
| crate | Booster Crate ×20 | $3.99 |
| pass1 | Continue Pass ×1 | $0.99 |
| pass5 | Continue Passes ×5 | $3.99 |
| coins1 | Pile of Coins 1,200 | $0.99 |
| coins2 | Bag of Coins 6,500 | $4.99 |
| coins3 | Chest of Coins 15,000 | $9.99 |
| gems1 | Handful of Gems 120 | $1.99 |
| gems2 | Pouch of Gems 650 | $9.99 |
| gems3 | Vault of Gems 1,500 | $19.99 |
| treasure | Island Treasure | $9.99 |

Non-consumable:
| id | name | price |
|---|---|---|
| starter | Starter Chest (one-time) | $1.99 |
| skin_ocean | Sea Glass skin | $0.99 |
| skin_candy | Candy Pop skin | $0.99 |
| skin_jelly | Jelly Wobble skin | $0.99 |
| skin_tiki | Tiki Wood skin | $1.99 |
| skin_pixel | Retro Pixel skin | $1.99 |
| skin_faces | Happy Blocks skin | $1.99 |
| skin_frost | Frost Bite skin | $1.99 |
| skin_sunset | Lava Glow skin | $1.99 |
| skin_midnight | Neon Night skin | $2.99 |
| skin_chrome | Chrome skin | $2.99 |
| skin_royal | Royal Gems skin | $3.99 |
| skin_holo | Holo Foil skin | $3.99 |
| skin_cosmic | Cosmic skin | $4.99 |

## App Store listing
- Privacy policy: https://puzzle-journey-ruby.vercel.app/privacy
- Support: https://puzzle-journey-ruby.vercel.app/support
- Icon: `store-icon-1024.png` · Category: Games › Puzzle · Age rating 4+
- App Privacy: Data not linked to you — Gameplay content (leaderboard name + score). No tracking.
