# Deployment and operations

## Status and architecture

This is an educational clone, not a brokerage. The dashboard supports basic email/password accounts and account-scoped demo collections when `AUTH_REQUIRED=true`. `/newOrder` records demo orders; it does not change holdings, positions or funds, execute trades, or move money. CORS is not authentication. Public deployment still requires an approved hosting target, HTTPS, private MongoDB secrets, and review of the remaining dependency advisories.

- `frontend/`: React 19 marketing SPA, React Router 7, Bootstrap via integrity-pinned CDN, local Font Awesome/assets.
- `dashboard/`: React 18 SPA, React Router 6, Axios, Chart.js. Holdings, positions and orders use the API; quotes, indices, summary and funds are explicitly sample data.
- `backend/`: CommonJS Express 5 and Mongoose 9; MongoDB collections `holdings`, `positions`, `orders`. Passport packages exist but are not wired into any authentication flow.
- No workers, scheduled jobs, file storage, payment services, OAuth callbacks or database migration framework exist. No such services need provisioning for private demo staging.

Assumptions: low-traffic private evaluation, a Linux VM with SSH access and an existing MongoDB 8.x instance/Atlas database. A single VM with Nginx, two static directories and one Node process avoids unnecessary Docker/paid platform dependencies. Hosting costs, provider and domain were not specified. Neither this VM nor any live deployment was provisioned during the audit.

## 1. Prerequisites and source baseline

Use **Node 24.x**, npm 11.x, and MongoDB 8.x. `.nvmrc` pins Node 24; manifests constrain Node to that major. Run backend integration tests with `mongod` available on PATH. Optional browser smoke tests need Google Chrome and Playwright.

The canonical source repository is `https://github.com/Khushi25131/zerodha-clone`, with integration branch `main`. Marketing, dashboard and backend live in this **single repository** and can be deployed separately. The original frontend commits remain ancestors of `main`; the former frontend Git metadata and uncommitted-change patches were backed up outside this project before consolidation. Historical audit reports describe the earlier source snapshot and are not current Git setup instructions.

For a new checkout, authenticate as an authorized collaborator and run:

```sh
gh repo clone Khushi25131/zerodha-clone
cd zerodha-clone
git status --short --branch
git remote -v
git pull --ff-only origin main
```

For an existing checkout, inspect and preserve local changes before pulling. The private repository requires GitHub authentication. Never commit real `.env` files, MongoDB credentials, `node_modules` or generated builds. The root `.gitignore` excludes them. Verification runs through `.github/workflows/verify.yml`; it does not deploy infrastructure.

Local source root:

```sh
cd /Users/rajnish-22172/Downloads/ZERODHA_CLONE
node --version
npm --version
(cd backend && npm ci)
(cd dashboard && npm ci)
(cd frontend && npm ci)
```

Use the lockfiles and `npm ci`, not forced audit fixes. Remaining legacy build-tool and router advisories are recorded in `AUDIT_REPORT.md`. Do not deploy development servers or `node_modules` as static assets.

## 2. Environment and local development (local only)

Do not overwrite an existing `.env`:

```sh
[ -f backend/.env ] || cp backend/.env.example backend/.env
[ -f dashboard/.env ] || cp dashboard/.env.example dashboard/.env
[ -f frontend/.env ] || cp frontend/.env.example frontend/.env
```

Edit the backend URL privately. The existing workspace `.env` was preserved and was not used for integration or browser tests.

| Service | Key | Purpose |
| --- | --- | --- |
| Backend | `MONGO_URL` | Required MongoDB URL, stored only in a private file/secret store |
| Backend | `PORT` | TCP port; default `3002` |
| Backend | `HOST` | Bind address; default `127.0.0.1` (keep private) |
| Backend | `CORS_ORIGIN` | Exact comma-separated browser origins, no trailing slash; never `*` |
| Backend | `NODE_ENV` | `development` locally; `staging` for private VM testing; `production` for approved public hosting |
| Backend | `AUTH_REQUIRED` | `true` requires account login for reads/writes; use `true` for public API/dashboard deployments |
| Backend | `DEMO_USER_ID` | Optional fixed ObjectId for unauthenticated local/demo records when `AUTH_REQUIRED=false` |
| Dashboard | `PORT` | Development server port (`3001` in template) |
| Dashboard | `REACT_APP_API_URL` | Public build-time API base URL, default `http://localhost:3002`; `/api` for Nginx staging |
| Marketing | `PORT` | Development server port (`3000` in template) |
| Marketing | `REACT_APP_DASHBOARD_URL` | Public build-time demo dashboard URL |

`REACT_APP_*` values are embedded in bundles. Never put secrets in them. Changing them requires rebuilding.

For a new local database, in a separate terminal (this starts a new empty local data directory):

```sh
LOCAL_DB_DIR=$(mktemp -d /tmp/zerodha-local.XXXXXX)
mongod --dbpath "$LOCAL_DB_DIR" --bind_ip 127.0.0.1 --port 27017
```

Set `MONGO_URL=mongodb://127.0.0.1:27017/zerodha_demo` in the backend environment. Do not start this if another MongoDB instance uses port 27017. No seeds are run: empty holdings and positions are valid. To retain local data across restarts, retain and reuse the printed directory; don't delete it accidentally.

Start each service in a separate terminal:

```sh
cd backend && npm run dev
```
```sh
cd dashboard && PORT=3001 npm start
```
```sh
cd frontend && PORT=3000 npm start
```

Open `http://localhost:3000` and `http://localhost:3001`. Default API CORS allows both origins. API startup waits for the database; it does not listen in a falsely healthy state.

## 3. Verification and builds (local only)

Run from the project root:

```sh
(cd backend && npm run check && npm run test:integration)
(cd backend && npm audit --omit=dev --audit-level=moderate)
(cd dashboard && npm run lint && CI=true npm test -- --watchAll=false --runInBand)
(cd frontend && npm run lint && CI=true npm test -- --watchAll=false --runInBand)
(cd dashboard && CI=true GENERATE_SOURCEMAP=false npm run build)
(cd frontend && CI=true GENERATE_SOURCEMAP=false npm run build)
```

The backend integration runner starts its own loopback `mongod` on a free port and a fresh temporary database, shuts it down and prints its retained data/log directory. It never uses `MONGO_URL`. `npm test` alone skips the real-database case unless `TEST_MONGO_URL` names the isolated test database. Do not point `TEST_MONGO_URL` at production. CI runs it against an ephemeral MongoDB service. There is no TypeScript compiler or dedicated formatter configured; ESLint, Node syntax checks and CRA compilation are the relevant static checks.

Optional real-browser test, with ports 3000/3001/3002 free and **default local URL builds**:

```sh
BROWSER_TOOLS=$(mktemp -d /tmp/zerodha-browser-tools.XXXXXX)
npm install --prefix "$BROWSER_TOOLS" playwright --no-audit --no-fund
PLAYWRIGHT_MODULE="$BROWSER_TOOLS/node_modules/playwright" node scripts/smoke.cjs
```

This optional dependency is outside the project. `scripts/smoke.cjs` uses installed Google Chrome, real static builds, a real API child process and a fresh local MongoDB instance. It checks all marketing routes/assets, holdings, positions, buy-to-order history, API-restart persistence, mobile cancel/navigation and runtime exceptions. It does not kill existing services. Component tests mock API responses and charts; they are not proof of database integration. The browser test and MongoDB integration tests provide separate real-integration evidence.

## 4. Data safety and schema changes

There are no migration commands to run. The only schema change adds validation and timestamps to newly written orders; existing documents are not rewritten or deleted. Existing untimestamped records remain readable and display an unknown date. The previous incorrect order-schema import may have created records missing business fields: review counts/missing fields on a **restored staging copy**. Missing historical payloads cannot be reconstructed automatically. Preserve original records and request owner-approved remediation; do not delete them or run `syncIndexes()` automatically.

Before touching any existing dataset:

1. Take an Atlas snapshot or `mongodump` backup with MongoDB Database Tools.
2. Restore it into a different staging database, never over production.
3. Check holdings/positions/orders, invalid historical data and the new-order read-back path.
4. There are no new indexes or destructive DDL changes. Default `_id` indexing supports bounded list ordering. API lists default to 100 rows, cap at 500 and support `limit`/`offset`; dashboard totals are labeled page totals.

Atlas: use a dedicated database user restricted to this demo database, TLS connection string, and a narrow network allowlist/private connectivity for the VM. Never use live financial/customer data in this application.

## 5. Private VM staging setup (external actions: approval required)

**Do not execute this section without authorization for the target VM.** These steps install files, create a service account and restart services. They were prepared, not executed. Assumes Debian/Ubuntu, Nginx installed, Node 24 available at `/usr/bin/node`, and MongoDB reachable. Verify the executable path before installing the service; adjust `ExecStart` to the actual Node 24 binary if needed.

Use your SSH configuration to define the actual host as `zerodha-staging` (no host or credentials were available in the audit). Configure key authentication, restrict SSH ingress to trusted users/networks, and leave ports 3002/8080/8081 closed externally. No DNS changes, public TLS certificates or domain are required: an encrypted SSH tunnel provides private access. Do not change the Nginx loopback listeners to public addresses.

On the authorized VM:

```sh
node --version
command -v node
nginx -v
sudo useradd --system --user-group --no-create-home --shell /usr/sbin/nologin zerodha
sudo install -d -o root -g zerodha -m 0750 /etc/zerodha
sudo install -d -o zerodha -g zerodha -m 0755 /opt/zerodha/releases
```

Create the account only if it does not already exist. Create `/etc/zerodha/backend.env` with a private editor or secret-manager delivery; do not paste real credentials into shell history:

```dotenv
NODE_ENV=staging
AUTH_REQUIRED=true
HOST=127.0.0.1
PORT=3002
CORS_ORIGIN=http://localhost:8081
MONGO_URL=mongodb://127.0.0.1:27017/zerodha_demo
```

The MongoDB URL shown is only a loopback example; replace it privately with the authorized isolated staging database URL. Secure the file:

```sh
sudo chown root:zerodha /etc/zerodha/backend.env
sudo chmod 0640 /etc/zerodha/backend.env
```

After local tests pass, build the **staging** static sites locally (these replace local build directories):

```sh
(cd dashboard && REACT_APP_API_URL=/api CI=true GENERATE_SOURCEMAP=false npm run build)
(cd frontend && REACT_APP_DASHBOARD_URL=http://localhost:8081 CI=true GENERATE_SOURCEMAP=false npm run build)
RELEASE=$(date -u +%Y%m%dT%H%M%SZ)
ssh zerodha-staging "sudo -u zerodha mkdir -p /opt/zerodha/releases/$RELEASE"
rsync -az --rsync-path='sudo -u zerodha rsync' \
  --exclude=node_modules --exclude=.git --exclude=.env --exclude='.env.*' \
  --exclude=coverage --exclude=.DS_Store \
  ./ "zerodha-staging:/opt/zerodha/releases/$RELEASE/"
printf 'Release uploaded: %s\n' "$RELEASE"
```

The upload intentionally excludes every real `.env`. Source/build paths do not contain secrets. Review files before transferring. On the VM, set `RELEASE` to the **actual printed release ID**, then:

```sh
sudo -u zerodha sh -c "cd /opt/zerodha/releases/$RELEASE/backend && npm ci --omit=dev"
# Preserve the old symlink target for rollback before changing current.
readlink -f /opt/zerodha/current || true
sudo ln -sfn "/opt/zerodha/releases/$RELEASE" /opt/zerodha/current
sudo install -m 0644 /opt/zerodha/current/deploy/zerodha-staging.service /etc/systemd/system/zerodha-staging.service
sudo install -m 0644 /opt/zerodha/current/deploy/nginx-staging.conf /etc/nginx/sites-available/zerodha-staging
sudo ln -sfn /etc/nginx/sites-available/zerodha-staging /etc/nginx/sites-enabled/zerodha-staging
sudo nginx -t
sudo systemctl daemon-reload
sudo systemctl enable --now zerodha-staging
sudo systemctl restart zerodha-staging
sudo systemctl reload nginx
curl --fail http://127.0.0.1:3002/ready
# With AUTH_REQUIRED=true, verify the dashboard signup/login flow or call API endpoints with a Bearer token.
```

Do not expose the API using `HOST=0.0.0.0`. Nginx strips `/api/` when proxying. There is no server build step; Node executes `backend/index.js`. Service shutdown closes HTTP connections and the database, with a bounded shutdown timeout. No persistent filesystem is required for the API; MongoDB owns durable data.

On your local machine:

```sh
ssh -N -L 8080:127.0.0.1:8080 -L 8081:127.0.0.1:8081 zerodha-staging
```

Visit `http://localhost:8080` (marketing) and `http://localhost:8081` (dashboard). The SSH transport is encrypted; these URLs listen only locally. Test page refresh on `/holdings`, search, buy/sell, cancel, history, errors and restart persistence using disposable staging records. Do not enter real account data.

## 6. Public hosting, DNS, HTTPS and authentication

Not authorized or ready. Before any public rollout:

- Review the basic token authentication for the chosen hosting model. In-memory tokens are acceptable for one demo API instance, but a durable session/JWT rotation design is needed before horizontal scaling.
- Add server-side idempotency for order retries and application/edge rate limits; disabling a submit button only prevents simultaneous submissions in one dialog.
- Resolve or explicitly accept remaining dependency advisories with exposure analysis, including the dashboard React Router 6 advisories; do not run `npm audit fix --force` (it proposes replacing CRA with `react-scripts@0.0.0`). Plan a separately reviewed tooling migration.
- Complete test data review, monitoring, secrets management and a documented backup exercise.
- Obtain provider/domain/budget/traffic requirements. Then configure HTTPS at the ingress, exact production CORS origins and HSTS after validating TLS.

The static SPAs can later use Netlify; `public/_redirects` includes history fallback. Build command `npm ci && npm run build`, base directory `frontend` or `dashboard`, publish `build`. Set the two real build-time URL values first, and deploy the API with `AUTH_REQUIRED=true`. Existing Netlify CLI availability does **not** authorize deployment or charges. See `DEPLOY_PUBLIC.md` for a concise public deployment checklist.

## 7. Health, logs and diagnosis

- `/health`: process liveness, not database readiness.
- `/ready`: 200 when Mongoose is connected, otherwise 503.
- `/allHoldings`, `/allPositions`, `/allOrders`: bounded JSON arrays.
- `POST /auth/signup`, `/auth/login`, `/auth/logout`, `GET /auth/me`: account/session endpoints.
- `POST /newOrder`: `{ "name": "INFY", "qty": 1, "price": 100, "mode": "BUY" }`; 201 returns a stored document and its ID, not an executed trade. With `AUTH_REQUIRED=true`, the request needs an `Authorization: Bearer <token>` header.
- Invalid JSON → 400; invalid fields → 400; unauthenticated access → 401; forbidden browser origin → 403; oversized body → 413; compressed input → 415; unavailable DB → 503. Unexpected errors do not expose connection strings or payloads.

```sh
sudo systemctl status zerodha-staging
sudo journalctl -u zerodha-staging -n 100 --no-pager
sudo tail -n 100 /var/log/nginx/error.log
curl --fail http://127.0.0.1:8081/api/ready
```

Startup failure: verify private MongoDB URL, network access, `NODE_ENV`, port and bind permissions. CORS failure: exact origin mismatch (scheme/host/port), not an authentication failure. Browser calls `localhost:3002` on staging: rebuild dashboard with `REACT_APP_API_URL=/api`. Blank deep links: enable SPA fallback. Unknown asset 404s: check case and root-relative paths. An order request timeout is ambiguous: check history before retrying, since server-side idempotency is not yet implemented. Arrange readiness checks, restart alerts and database/storage monitoring before extending beyond private staging. Retain and redact operational logs; never log secrets.

## 8. Updates and rollback (external actions: approval required)

For future releases: verify canonical branch/remote, preserve existing work, install with lockfiles, run all checks, take a database backup, build the two static artifacts, upload a new immutable release directory, record the previous `current` target, switch the symlink, restart API/reload Nginx, and repeat live checks. Never `git reset --hard`, force-push or overwrite an active data directory.

For rollback, set `PREVIOUS_RELEASE` to the actual absolute path recorded before deployment, verify it exists, then:

```sh
test -d "$PREVIOUS_RELEASE/backend" && sudo ln -sfn "$PREVIOUS_RELEASE" /opt/zerodha/current
sudo systemctl restart zerodha-staging
sudo nginx -t && sudo systemctl reload nginx
curl --fail http://127.0.0.1:8081/api/ready
```

Roll back application files and reviewed environment configuration first. **Do not restore the database automatically on an application rollback**: doing so loses newer records. The added validation/timestamps require no reverse migration. Restoring a database requires explicit owner approval, a backup of its current state and a separate recovery plan. Keep previous release directories until acceptance; do not delete branches or deployments automatically.

## 9. Backup and restore

Atlas: enable snapshots/PITR according to retention needs; verify an actual restore into a new staging cluster before production approval. For MongoDB Database Tools, invoke `mongodump --config` / `mongorestore --config` with a restricted YAML configuration containing the authorized URI/password, so credentials are not on the command line. Check your installed tools' `--help` first. Example after configuring those private files:

```sh
# Production read/export: authorization required; may load the database.
BACKUP="zerodha-$(date -u +%Y%m%dT%H%M%SZ).archive.gz"
mongodump --config /etc/zerodha/backup.yml --archive="$BACKUP" --gzip
# Restore ONLY into a different, empty staging database configured in restore-staging.yml.
mongorestore --config /etc/zerodha/restore-staging.yml --archive="$BACKUP" --gzip \
  --nsFrom='zerodha_demo.*' --nsTo='zerodha_restore.*'
# Set nsFrom to the actual archived database name; nsTo must be a new staging namespace.
```

No `--drop` is used. Encrypt backups, restrict access, store off-host and test document counts/read-back on restoration. These commands were not executed and no production data was accessed. No paid resource, DNS record or live deployment was modified.
