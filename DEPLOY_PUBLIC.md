# Public deployment checklist

This project can be deployed from the single GitHub repository as three services: marketing SPA, dashboard SPA, and API. Public deployment requires authenticated dashboard access and a private MongoDB database.

## Recommended low-cost public architecture

- **Marketing SPA** (`frontend/`): Netlify/Vercel static site.
- **Dashboard SPA** (`dashboard/`): Netlify/Vercel static site.
- **API** (`backend/`): Render/Railway/Fly.io/VM Node service with HTTPS.
- **Database**: MongoDB Atlas free/shared tier for demo use, restricted by database user and network rules where possible.

The API and dashboard must be deployed together because the dashboard calls the API. The marketing site can be public independently.

## Required environment variables

### Backend service

```dotenv
NODE_ENV=production
AUTH_REQUIRED=true
HOST=0.0.0.0
PORT=3002
MONGO_URL=<private MongoDB Atlas connection string>
CORS_ORIGIN=https://<dashboard-domain>
```

Do not put `MONGO_URL` in frontend/dashboard variables.

### Dashboard build

```dotenv
REACT_APP_API_URL=https://<api-domain>
```

### Marketing build

```dotenv
REACT_APP_DASHBOARD_URL=https://<dashboard-domain>
```

## Build commands

### Backend

```sh
cd backend
npm ci --omit=dev
npm start
```

### Dashboard

```sh
cd dashboard
npm ci
CI=true GENERATE_SOURCEMAP=false npm run build
```

Publish `dashboard/build`.

### Marketing

```sh
cd frontend
npm ci
CI=true GENERATE_SOURCEMAP=false npm run build
```

Publish `frontend/build`.

## Production smoke test

After deploying, verify:

1. API `GET /health` returns 200.
2. API `GET /ready` returns 200.
3. Dashboard loads over HTTPS.
4. Signup creates an account.
5. Logout invalidates the token.
6. Login works again.
7. An order created by one account appears only for that account.
8. An anonymous `GET /allOrders` returns 401.
9. Browser console has no runtime errors.

## Important limitations before real users

This is still an educational clone. Orders are stored records only and do not execute trades or move funds. In-memory tokens are acceptable for a single demo API instance but should be replaced with durable sessions/JWT rotation before scaling to multiple API instances. Remaining dependency advisories from the legacy React tooling should be reviewed before broad public promotion.
