# Account analytics UI enhancement

## Implemented
- Replaced sample overview balances with stored account holdings totals and recent saved orders.
- Added value-allocation doughnut, invested-cost/current-value grouped bars, unrealized P&L bars, and buy/sell recording activity by UTC day using existing Chart.js dependencies.
- Added holdings search/sort, chart metric selection, order symbol/side/rolling-date filters and reset actions. Chart legends support series visibility; activity includes an accessible exact-data disclosure.
- Centralized reusable headers, metrics, empty states, filter bars, scoped data explanations, responsive panels, loading indicators and semantic badges.
- Removed the sample unit-price doughnut from the watchlist: unit prices are not meaningful parts of a portfolio total.
- Updated marketing feature explanations and preserved the configured dashboard destination.

## Data boundaries
All analytics use the loaded API page (maximum 100 records), not full-account aggregates. Charts and tables explicitly state this scope. Quotes are stored, not live. Orders are records, not executions, cash movement or trading performance. Missing order timestamps are excluded from time charts, not invented. No historical market prices are available, so no performance history is fabricated. New accounts may have no holdings.

## Verification in this pass
- Dashboard: `npm run lint`; `CI=true npm test -- --watchAll=false --runInBand --silent` (18 tests); `CI=true GENERATE_SOURCEMAP=false npm run build` — PASS.
- Marketing: same lint/test/build commands (7 tests) — PASS.
- Backend: `npm run check`; `npm run test:integration` — PASS, 23 tests, zero skipped, disposable local MongoDB.
- `scripts/smoke.cjs` with an external Playwright installation and `BROWSER_ENGINES=chromium,firefox,webkit` — PASS. Tested 7 marketing and 6 dashboard routes at 1440/768/390px, assets, overflow, signup/login/logout, real DB holdings/orders, filters/reset, chart metric selection and data disclosure, modal Escape, restart persistence and reduced motion. No runtime exceptions.
- No dependencies, backend implementations, schemas, real environment files or live database data changed.

## Limitations
No physical-device or formal screen-reader audit. Hosted deployment is not proved by local builds/browser tests; verify Netlify build completion after pushing. Existing authentication/session security and dependency advisories remain outside this UI enhancement.
