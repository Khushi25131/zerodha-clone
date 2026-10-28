# Focused order-validation investigation

## Scope and baseline

No new error message or reproduction steps were supplied. Investigation of the existing audit and order submission path found a reproducible input-validation defect; this report is limited to that defect, not a claim that all outstanding audit items are fixed.

The workspace has no Git repository metadata. Status, remotes, recent commits and stashes could not be inspected; no synchronization or history operation was attempted. A SHA-256 file baseline was recorded outside the workspace before editing. Existing environment files and lockfiles were not modified. The prior audit describes earlier work and is not evidence of checks executed in this investigation.

## Confirmed issue (P2 — Medium)

`backend/index.js`, `validateOrder`, called `Number(body.qty)` and `Number(body.price)` before checking whether those values were numbers or numeric strings. JSON objects such as `{"toString":null}` cannot be converted to primitives. A syntactically valid POST to `/newOrder` therefore threw a TypeError and returned HTTP 500 instead of a validation error (HTTP 400).

Minimal payload: `{"name":"INFY","qty":{"toString":null},"price":10,"mode":"BUY"}`. The same failure occurs for an object-valued price. This requires a ready database because the database-availability middleware runs before the route.

Before the fix, a direct validator reproduction threw `TypeError: Cannot convert object to primitive value` for both fields. Newly added tests then failed before implementation: two unit cases threw and the actual HTTP/MongoDB integration assertion received 500 rather than 400 (17 passed, 3 failed).

## Repair

Reject nonnumeric types before invoking Number conversion. Keep valid number/numeric-string normalization, existing ranges, error messages, schema and successful response contracts unchanged. No migration or deployment configuration change is required.

Regression tests cover both numeric fields with malformed objects, arrays, booleans and null. Actual HTTP tests with a disposable loopback MongoDB assert 400, the validation error message, zero stored records for invalid payloads, and subsequent successful saves/read-back/concurrent requests/reconnection persistence.

## Verification executed

| Check | Command (in named directory) | Result |
| --- | --- | --- |
| Original validator reproduction | Inline Node call to validateOrder for object-valued qty/price | Confirmed TypeError before fix |
| Red regression suite | backend: `npm run test:integration` before fix | Expected FAIL: 17 pass, 3 fail |
| Backend static | backend: `npm run check` | PASS |
| Backend unit + real isolated MongoDB | backend: `npm run test:integration` after fix | PASS: 20 tests, zero skipped |
| Backend runtime dependency audit | backend: `npm audit --omit=dev --audit-level=moderate` | PASS: zero vulnerabilities |
| Dashboard lint | dashboard: `npm run lint` | PASS |
| Dashboard components | dashboard: `CI=true npm test -- --watchAll=false --runInBand --silent` | PASS: 9 tests; API mocks |
| Marketing lint | frontend: `npm run lint` | PASS |
| Marketing components | frontend: `CI=true npm test -- --watchAll=false --runInBand --silent` | PASS: 5 tests |
| Both production builds | each React project: `CI=true GENERATE_SOURCEMAP=false npm run build` | PASS |
| Edited JavaScript editor diagnostics | Three modified backend files | No diagnostics |
| Real-browser smoke | Browser dependency resolution | BLOCKED: Playwright not resolvable; browser suite not executed in this investigation |

34 automated tests passed in total. React Router future-flag warnings were observed in the nonsilent dashboard run; assertions and builds passed. No standalone TypeScript or formatter check is configured. No production database was queried; integration data/logs remain in disposable temporary directories.

## Changed files

- `backend/index.js`: numeric type guard before coercion.
- `backend/index.test.js`: two regression cases, covering both fields and multiple invalid types.
- `backend/integration.test.js`: real HTTP validation/status and no-write assertions.
- `DEBUG_VERIFICATION.md`: this investigation record.

No dependencies, schema, original tests, frontend sources or deployment settings were changed. Existing work was preserved; Git diff is unavailable without repository metadata.

## Remaining limitations and recommendation

The specific validation defect is fixed and verified. Existing architectural blockers in AUDIT_REPORT.md remain: no authentication/account ownership, shared demo data, frontend dependency advisories, and no order idempotency. Frontend advisories were not re-audited in this focused pass. Public production remains blocked; no external deployment was attempted. Review and integrate these focused changes into the canonical repository, rerun hosted CI, and provision the optional browser-test dependency to rerun `scripts/smoke.cjs` before staging acceptance.
