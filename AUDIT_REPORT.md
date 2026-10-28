# Project audit and verification record

## A. Overall status

**Ready for staging; production blockers remain.** Staging means private, SSH-tunneled evaluation with disposable data, not a publicly accessible trading service. Local automated checks and real browser/database workflows passed. No external staging/production deployment was performed. The backend refuses `NODE_ENV=production` rather than expose shared financial-like records without identity or ownership.

## B. Architecture and baseline

Three independent npm projects: React 19/Router 7 marketing SPA (`frontend`), React 18/Router 6/Axios/Chart.js dashboard (`dashboard`), Express 5/Mongoose 9 CommonJS API (`backend`). MongoDB supplies holdings, positions and recorded orders. Passport dependencies are unused; there is no user model, session, authentication, exchange, payment, worker, scheduler or file-upload pipeline. The marketing site uses integrity-pinned Bootstrap CDN assets and local Font Awesome. Default API port 3002; local marketing/dashboard ports 3000/3001.

All application source modules, schemas/models, public HTML/manifests, environment templates, dependency manifests, deployment documentation and critical CSS were reviewed; local assets were exercised in Chrome. Generated dependencies/assets were not exhaustively hand-audited. The root has no Git metadata: initial/final Git checks failed with “not a git repository.” Therefore branch, upstream, local commits, stashes, remote synchronization and Git diff cannot be established. No fetch/pull/merge/switch/push/reset was attempted. Initial file hashes were recorded outside the project at `/tmp/zerodha-audit-baseline.json`; comparison was used instead. Existing `backend/.env` was preserved, not printed and never used by the isolated integration/browser tests. No source files or assets were deleted.

## C. Important issues fixed

| Severity | Location / root cause | Repair | Evidence |
| --- | --- | --- | --- |
| High | `backend/model/OrdersModel.js`: destructured schema was not imported; Mongoose received an object instead of the order schema, dropping intended fields | Import `OrdersSchema` correctly; enforce schema fields/validation/timestamps | Schema regression test and actual MongoDB order write/read-back |
| High | `backend/index.js`: API could start without a database URL; liveness looked healthy while persistence was unavailable | Fail startup without DB; bounded connection timeout/pool; separate `/health` and `/ready`; unavailable DB returns 503 | Startup/HTTP tests, real DB and browser restart checks |
| High | Backend endpoints have no identity/ownership model | Kept shared-demo semantics explicit; loopback binding and fail-closed production startup; private-only deployment configuration | Production-gate regression test; public production remains blocked, not “fixed authentication” |
| High | Backend dependency advisories in body parser/query parsing | Non-major lockfile updates; compressed requests rejected; smaller JSON limit | Backend full/runtime audit: zero advisories |
| Medium | `validateOrder`: null, coercion of arrays/booleans, fractional/oversized quantities and invalid prices | Object/type/finite/integer/length/boundary validation plus schema enforcement | Unit and real HTTP invalid-input tests |
| Medium | Backend default parser/CORS errors could return stack/error HTML | Consistent generic JSON errors, explicit 403/413/415, non-sensitive logging, no-store and basic security headers | HTTP tests for malformed JSON, origin rejection, size and headers |
| Medium | Unbounded collection reads and missing order-history endpoint | Bounded, sorted, lean list reads with query timeout and validated pagination; `/allOrders` added | Real DB pagination/invalid-boundary tests |
| High | `BuyActionWindow`: context accessed as a static property; save not awaited; failures invisible; duplicate clicks possible | Actual context consumption, awaited save, failure/retry guidance, pending guard, validated inputs, native modal focus behavior, cancellation | Component tests and real Chrome BUY/history/mobile-cancel workflow |
| Medium | Dashboard hardcoded API origin, no request timeout/cancellation/errors; positions used fixtures, orders always empty | Configurable Axios base URL and timeout; abortable collection loader with retry/pagination; real API-backed positions/orders | Component/API tests plus real browser holdings/positions/order history |
| Medium | Holdings totals were unrelated hardcoded figures; invalid table nesting and wrong day-loss calculation | Derived page totals, correct thead/tbody, negative day change handling and tolerant number display | Totals/component regressions and real seeded browser holdings |
| Medium | Watchlist search did nothing; actions hover-only; SELL inert | Search filtering and always reachable keyboard/touch BUY/SELL buttons | Component search/SELL payload test and mobile browser access |
| Medium | Menu state disagreed with direct URL; relative funds link; missing dashboard fallback | Route-derived active links, absolute routes, 404 fallback | Direct-route regression and browser checks |
| Medium | Marketing signup buttons inert; hero/award image names used incorrect case; nested routes used relative assets; product hrefs were literal braces | Working signup anchors, root-relative/correct-case assets, real prop-based product URLs, known route/footer destinations, removed unavailable product links instead of pretending they work | Marketing component tests and every marketing route's rendered images checked in Chrome |
| Medium | Signup placeholder and dead funds controls implied unsupported real transactions | Explicit demo/signup scope, external official account link, visibly unavailable funds actions, sample-data disclosure | Component tests and local browser journeys |
| Low | JSX `class`, missing image alt, mobile overflow risk, missing manifest icons, redundant imports and Babel implicit dependency | Valid JSX/alt attributes, responsive CSS/focus styles, valid manifests, clean imports and explicit Babel helper | Zero-warning lint, builds and mobile checks |
| Medium | No reproducible deployment/test pipeline; weak guide implied production readiness | Node 24 pin, lockfile installs, CI verification, private Nginx/systemd configuration, environment examples, SPA fallback and complete deployment/rollback guide | Local checks pass; CI/remote server execution not claimed |

Non-major dependency updates removed known critical advisories from both static projects. Dashboard's measured gzip JS artifact went from approximately 177.57 kB in the first generated artifact to 127.55 kB after removing unused MUI icon usage; this is an artifact-size comparison, not a measured latency or throughput improvement. Final marketing JS is approximately 90.74 kB before the last small CTA regression update. No performance load test was performed.

## D. Remaining issues, limits and blockers

### Verified production blockers

1. No authentication, ownership, user isolation, sessions/logout or permissions exist. Shared collections must remain private. No unauthorized/forbidden account-isolation tests are possible until that product/security model is implemented. The production guard is a containment measure only; `NODE_ENV` is not a security boundary if operators expose staging publicly.
2. Frontend dependency audit: **34 advisories (16 low, 5 moderate, 13 high)**. Dashboard: **36 (16 low, 7 moderate, 13 high)**. No critical advisories remain. Most affect the legacy CRA build/test/dev-server chain (SVGO/nth-check, PostCSS, serialization, webpack middleware, old jsdom/Jest, deepmerge and related packages). Dashboard additionally has React Router 6 moderate advisories, including backslash redirects and SSR hydration; this app has fixed internal navigation and no SSR, but advisories remain. `npm audit fix --force` proposes `react-scripts@0.0.0`, an unacceptable destructive “fix.” A reviewed tooling/router migration or explicit security acceptance is required; no blanket safety claim is made.
3. No server-side idempotency or distributed rate limiting. Simultaneous UI clicks are guarded, but an ambiguous timeout/retry or direct API replay may duplicate orders. The UI warns users to check history. Before public use add persisted idempotency, account-aware limits and corresponding concurrency tests.
4. Signup, cash transfer, registration/KYC, exchange execution and multi-account portfolios are not implemented. They were not fabricated. Quotes/summary/funds are sample data and now disclosed. Do not use real customer/financial data.

### Historical data risks (not verified against an existing database)

The old order-schema import may have stored records without requested business fields. No actual user/production database was queried. Review a restored copy for such documents; do not delete or invent missing historical payloads. Existing holdings/position schemas are permissive read models and were left unchanged to avoid imposing unverified business constraints. New order validation/timestamps are additive and no data migration was executed.

### Environment / coverage limits

- No canonical Git branch/remote, deployment target, SSH credentials, domain, budget or public-release authorization was supplied.
- Nginx is absent locally; `nginx -t` and systemd service execution are **not verified**. Language diagnostics alone do not validate server configuration.
- Workflow YAML was prepared but GitHub Actions was not executed. No deployment stage was added without a target/approval.
- MongoDB backup/restore tools are installed and `--config` support was checked, but no backup/restore exercise or production migration was run.
- Browser verification uses installed desktop Chrome plus a 390px viewport, not Firefox/Safari, physical mobile devices, assistive technology or a full accessibility audit. Error paths beyond the listed tests, large-volume pagination, load/concurrency under stress, financial rounding and external official links were not exhaustively verified. Bootstrap CDN availability was exercised locally but remains an external dependency.
- No standalone formatter/TypeScript configuration exists. Static checks are ESLint, Node syntax checks, diagnostics and CRA builds. Known Node/CRA and React test-library/router deprecation warnings remain; they did not fail tests.
- Public auth callbacks, TLS/HSTS, secrets rotation, DNS, hosted monitoring, backups and provider settings remain future, authorized work. No secret values were printed or rotated.

## E. Verification results

Commands run from the specified project directory unless prefixed with a path. Baseline permission-denied CRA execution was repaired with clean `npm ci`; a later JSX alt warning and test lint failures were corrected, then checks were rerun.

| Check | Command | Result / evidence |
| --- | --- | --- |
| Git baseline/final | `git status --short --branch`, branches/remotes/log/stash checks | BLOCKED: no `.git`; no branch operation attempted |
| Dependency reproducibility | `npm ci` in each project | PASS; final installs completed with lockfiles |
| Backend static | `npm run check` | PASS; Node syntax checks |
| Dashboard lint | `npm run lint` | PASS; zero warnings |
| Marketing lint | `npm run lint` | PASS; zero warnings |
| Type checking / formatter | No configured command | BLOCKED / not configured; no fabricated result |
| Backend unit + actual MongoDB integration | `npm run test:integration` | PASS: 18 tests, zero skipped; disposable loopback mongod |
| Dashboard component/interaction | `CI=true npm test -- --watchAll=false --runInBand` | PASS: 9 tests; API/chart mocks explicitly used |
| Marketing component | `CI=true npm test -- --watchAll=false --runInBand` | PASS: 5 tests, including the shared open-account CTA regression |
| Dashboard build | `CI=true GENERATE_SOURCEMAP=false npm run build` | PASS; optimized static output |
| Marketing build | `CI=true GENERATE_SOURCEMAP=false npm run build` | PASS; rerun after CTA fix |
| Backend audit | `npm audit --omit=dev --audit-level=moderate` (also full audit) | PASS: zero vulnerabilities |
| Dashboard audit | `npm audit --json` | FAIL: 36 advisories remain |
| Marketing audit | `npm audit --json` | FAIL: 34 advisories remain |
| Real browser integration | `PLAYWRIGHT_MODULE=... node scripts/smoke.cjs` | PASS: real Chrome, static sites, API and MongoDB; all marketing routes/images, holdings/positions, buy/history, API restart persistence, mobile navigation/cancel; no page runtime exceptions |
| Existing-file safety | Initial SHA-256 comparison | PASS: backend `.env` and binary/assets unchanged; no original file deleted |
| Schema migration / live data review | No migration framework/command | BLOCKED: no live data inspected; no destructive migration introduced |
| Nginx / systemd / remote health | Prepared config; no available target | BLOCKED: not executed remotely, Nginx absent locally |
| CI, hosted staging, public production | No authorized external run | BLOCKED: not deployed; no verified URL |

## F. Important changed files

- `backend/index.js`, `model/OrdersModel.js`, `schemas/OrdersSchema.js`: persistence repair, input constraints, readiness/error handling, bounded list routes and safe startup.
- `backend/integration.test.js`, `test-integration.js`: boundary/security/real-MongoDB regression coverage and isolated runner; original `index.test.js` retained.
- `dashboard/src/api.js`, `useCollection.js`, `components/CollectionState.js`: configurable networking, cancellation, error/retry/pagination.
- Dashboard `BuyActionWindow`, `GeneralContext`, `Holdings`, `Positions`, `Orders`, `WatchList`, `Menu`, `Dashboard`, `Home`, `Funds` and styles: functional workflows, actual data, demo disclosures and accessibility/responsive repairs.
- Marketing landing components, HTML/manifest/styles: working routes/CTAs/URLs, correct-case/root-relative assets, mobile styling and truthful signup scope. Line-ending-only edits to unchanged modules were removed.
- Both React test suites: regression coverage without weakening original tests.
- All manifests/lockfiles: compatible advisory updates, explicit build helper, Node engines and check/lint scripts.
- `.gitignore`, `.nvmrc`, all `.env.example` templates: protect secrets/artifacts and document public build-time configuration.
- `.github/workflows/verify.yml`, SPA `_redirects`, `deploy/` configs, `scripts/smoke.cjs`, `DEPLOYMENT.md`: verification and private deployment preparation.
- No original source file or asset deleted. No Git history exists in this snapshot to modify. Hash comparison confirms preservation of the existing environment file/assets; edits were limited to the audit's source/config/test/docs scope. An exact final change inventory is generated separately in `AUDIT_CHANGES.md`.

## G. Deployment sequence

Use **`DEPLOYMENT.md`** for executable, project-specific local and approved-VM commands, complete environment key table, safe isolated test databases, immutable release upload, SSH tunnels, health checks, logs, backup and rollback. It explicitly distinguishes local commands from consequential external operations.

Sequence: obtain the canonical repository/branch → preserve/reconcile work → Node 24 and `npm ci` in all projects → configure private environments → run all checks and browser test → provision only an approved isolated staging MongoDB → take/test backups if existing data is involved → build dashboard with `REACT_APP_API_URL=/api` and marketing with `REACT_APP_DASHBOARD_URL=http://localhost:8081` → upload a new release excluding `.env` → install the private loopback Nginx/systemd setup → verify readiness/history through SSH tunnels → record acceptance. On failure switch `current` back to the recorded previous release and restart; do not automatically restore/overwrite database data.

No DNS, paid resources, deployment, credential rotation or public production changes were performed.

## H. Final checklist

- [x] Both frontend production builds executed successfully.
- [x] Backend starts against an isolated real database; restart persistence verified.
- [x] Automated backend and component tests pass; no real-integration test skipped in integration run.
- [x] Tested critical demo workflows pass locally in real Chrome.
- [ ] All possible workflows/browsers/load cases verified (not claimed).
- [ ] Production data/migration/restore safety verified on actual target (no target access).
- [x] Verified repairable backend issues fixed; backend dependency audit clean.
- [ ] All security issues addressed (identity/ownership, idempotency/rate limits and frontend advisories remain).
- [x] Private staging configuration and deployment documentation prepared.
- [ ] Nginx/systemd configuration executed on target.
- [ ] Hosted staging deployment verified.
- [ ] Production deployment verified or approved.
