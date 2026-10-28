# Midnight glass UI enhancement

## Scope

Dashboard and marketing routes now share a midnight/indigo/cyan direction, using their existing CSS and component architecture. No new runtime dependencies, API changes, database migrations, secrets, or production deployments were introduced. Git baseline: main at 02ccab8, clean before changes.

## Design system

- Central tokens in each application's `src/index.css`: midnight canvas, readable secondary text, restrained indigo actions, cyan highlights, semantic gain/loss colors.
- Opaque dark fallback surfaces; feature-detected blur limited to toolbar/auth panels, plus the modal backdrop. Scrolling tables and watchlist avoid large backdrop filters.
- Refined active navigation, labeled inputs, disabled/pending/error states, numeric tables, charts, pagination, empty screens, and responsive layouts.
- Focus-visible rings, skip links, autocomplete hints, reduced-motion support, native dialog keyboard dismissal retained.
- Marketing artwork remains original rather than inverting financial charts. Some illustrations intentionally retain a light canvas for legibility.
- Existing sample balances and summary metrics remain sample data, explicitly labeled. This change does not invent live portfolio data.

## Component work

Dashboard: login/signup, top navigation/profile, watchlist/search/actions/chart, overview, holdings, positions, orders, funds, apps, collection status/pagination, and order modal.
Marketing: shared navbar/footer, home hero and shared content styles, about, product, pricing, support topics/search, signup and not-found layouts.

Navigation is now React-controlled rather than depending on Bootstrap JavaScript; route selection and mobile collapse are regression-tested. Corrected the missing Font Awesome stylesheet reference and a home-page demo link that ignored the configured dashboard URL.

## Verification executed

| Check | Command / procedure | Result |
| --- | --- | --- |
| Both applications lint | `npm run lint` in each app | PASS, zero warnings |
| Dashboard tests | `CI=true npm test -- --watchAll=false --runInBand` | PASS, 11 tests |
| Marketing tests | Same command in frontend | PASS, 7 tests |
| Both optimized builds | `CI=true GENERATE_SOURCEMAP=false npm run build` | PASS |
| Backend syntax | `npm run check` in backend | PASS |
| Backend unit + isolated MongoDB | `npm run test:integration` | PASS, 23 tests, no skips |
| Browser matrix | `PLAYWRIGHT_MODULE=/tmp/zerodha-browser-tools.CS76wz/node_modules/playwright BROWSER_ENGINES=chromium,firefox,webkit node scripts/smoke.cjs` | PASS |
| Whitespace | `git diff --check` | PASS |

The optional browser dependency was already available outside this repository. For other environments install Playwright in a tooling directory, install supported browser binaries (Chrome channel required for Chromium here), and pass its absolute module path through PLAYWRIGHT_MODULE. Build both apps with their documented localhost configuration before running. The script reserves localhost ports 3000–3002 and refuses to reuse existing services.

Browser verification uses built static applications, an actual Express process, AUTH_REQUIRED=true and disposable local MongoDB. No production services/data were used. Each of Chrome, Firefox and WebKit passed:

- Seven marketing routes with image loading and no document overflow at 1440, 768 and 390px.
- Six dashboard routes at the same widths, with seeded account-owned holdings and positions.
- UI signup/login/logout, watchlist filtering, order creation/history, cancellation with Escape, and order persistence after API restart/relogin.
- Mobile modal viewport containment and final opacity, reduced-motion transition disabling, and no page runtime exceptions.

Screenshots from the final run are retained outside source control at `/var/folders/q7/31qy9y1d3zz21b12cx2kg5qh0000gp/T/zerodha-ui-dzDV96`. Desktop login/overview and mobile marketing/modal captures were reviewed during this work. This is not an exhaustive screen-reader or WCAG conformance audit.

## Tooling compatibility fix

The new real-router navigation test exposed CRA/Jest's inability to resolve React Router 7's `react-router/dom` export. A test-only module mapping and jsdom TextEncoder/TextDecoder setup resolve this without changing production dependencies. The original failed run is not counted as passing; both suites subsequently passed. Existing dashboard Router future-version warnings remain.

## Remaining limitations / release

- No hosted preview, production deployment or physical-device testing performed in this pass.
- No formal accessibility audit or performance benchmark; no performance improvement claim.
- Bootstrap CSS remains CDN-hosted; product artwork is not redrawn.
- Prior authentication/session/rate-limit and legacy dependency risks are unchanged by this visual work.
- Changes are local and uncommitted. Review, commit, and explicitly authorize a push before triggering production-linked hosting. Backend redeployment is not required for the UI changes. Existing frontend build-time URLs must be preserved when rebuilding.
