# Zerodha educational clone

One repository containing three independently runnable applications:

| Directory | Application | Local command | Deployment artifact |
| --- | --- | --- | --- |
| `frontend/` | React marketing website | `npm start` | `npm run build` -> `build/` |
| `dashboard/` | React demo trading dashboard | `PORT=3001 npm start` | `npm run build` -> `build/` |
| `backend/` | Express/Mongoose API | `npm run dev` | `npm start` (no build step) |

**Private demo only.** There is no authentication, account ownership or real trade execution. All records are shared. The API deliberately blocks `NODE_ENV=production`; do not disable this guard to expose it publicly.

## Get started

Prerequisites: Node 24, npm 11 and MongoDB 8.x. Authenticate with GitHub to access this private repository.

```sh
gh repo clone Khushi25131/zerodha-clone
cd zerodha-clone
(cd backend && npm ci)
(cd dashboard && npm ci)
(cd frontend && npm ci)
[ -f backend/.env ] || cp backend/.env.example backend/.env
[ -f dashboard/.env ] || cp dashboard/.env.example dashboard/.env
[ -f frontend/.env ] || cp frontend/.env.example frontend/.env
```

Configure `backend/.env` with a private demo MongoDB URL. Start MongoDB and run each application's local command above in a separate terminal inside its directory. Open marketing at `http://localhost:3000` and dashboard at `http://localhost:3001`.

## Push future changes

Run from the repository root. Review changes before committing; never add secrets.

```sh
git status
git diff
git add README.md
git diff --cached
git commit -m "Update project documentation"
git push origin main
```

The example stages only `README.md`; select the actual files you intend to commit. A single push can update all three applications. Separate repositories or backend/frontend branches are not required.

## Deployment

Read [DEPLOYMENT.md](DEPLOYMENT.md) for verified commands, environment keys, private VM staging, health checks, backups and rollback. GitHub hosts source code, not this Node API or MongoDB. GitHub Actions verifies the API and builds both React sites; it intentionally does not deploy.

- Backend: Node service and a private MongoDB database.
- Dashboard: static site built with `REACT_APP_API_URL` pointing to the API (or `/api` behind the supplied Nginx proxy).
- Marketing: static site built with `REACT_APP_DASHBOARD_URL` pointing to the dashboard.
- Private staging configuration: `deploy/nginx-staging.conf` and `deploy/zerodha-staging.service`, using loopback listeners and SSH tunnels.

No production provider, paid resources, DNS or public backend deployment is configured. Public deployment requires authentication/account isolation and review of the remaining dependency advisories. Never put `MONGO_URL` or other secrets in React build variables.

See [AUDIT_REPORT.md](AUDIT_REPORT.md) and [DEBUG_VERIFICATION.md](DEBUG_VERIFICATION.md) for earlier investigation evidence and known limitations.
