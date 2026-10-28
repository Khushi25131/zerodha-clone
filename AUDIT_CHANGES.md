# Audit change inventory

The source snapshot has no Git repository. This inventory compares SHA-256 hashes with the initial baseline recorded outside the project. Generated dependencies/build artifacts are excluded.

**50 modified, 19 added, 0 deleted.**

## Modified

- `DEPLOYMENT.md`
- `backend/.env.example`
- `backend/index.js`
- `backend/model/OrdersModel.js`
- `backend/package-lock.json`
- `backend/package.json`
- `backend/schemas/OrdersSchema.js`
- `dashboard/package-lock.json`
- `dashboard/package.json`
- `dashboard/public/index.html`
- `dashboard/src/components/BuyActionWindow.css`
- `dashboard/src/components/BuyActionWindow.js`
- `dashboard/src/components/Dashboard.js`
- `dashboard/src/components/Funds.js`
- `dashboard/src/components/GeneralContext.js`
- `dashboard/src/components/Holdings.js`
- `dashboard/src/components/Home.js`
- `dashboard/src/components/Menu.js`
- `dashboard/src/components/Orders.js`
- `dashboard/src/components/Positions.js`
- `dashboard/src/components/WatchList.js`
- `dashboard/src/index.css`
- `frontend/package-lock.json`
- `frontend/package.json`
- `frontend/public/index.html`
- `frontend/public/manifest.json`
- `frontend/src/index.css`
- `frontend/src/index.js`
- `frontend/src/landing_page/Footer.js`
- `frontend/src/landing_page/Navbar.js`
- `frontend/src/landing_page/OpenAccount.js`
- `frontend/src/landing_page/about/Hero.js`
- `frontend/src/landing_page/about/Team.js`
- `frontend/src/landing_page/home/Awards.js`
- `frontend/src/landing_page/home/Education.js`
- `frontend/src/landing_page/home/Hero.js`
- `frontend/src/landing_page/home/HomePage.js`
- `frontend/src/landing_page/home/Pricing.js`
- `frontend/src/landing_page/home/Stats.js`
- `frontend/src/landing_page/pricing/Brokerage.js`
- `frontend/src/landing_page/pricing/Hero.js`
- `frontend/src/landing_page/products/Hero.js`
- `frontend/src/landing_page/products/LeftSection.js`
- `frontend/src/landing_page/products/ProductPage.js`
- `frontend/src/landing_page/products/RightSection.js`
- `frontend/src/landing_page/products/Universe.js`
- `frontend/src/landing_page/signup/Signup.js`
- `frontend/src/landing_page/support/CreateTicket.js`
- `frontend/src/landing_page/support/Hero.js`
- `frontend/src/landing_page/support/SupportPage.js`

## Added

- `.github/workflows/verify.yml`
- `.gitignore`
- `.nvmrc`
- `AUDIT_CHANGES.md`
- `AUDIT_REPORT.md`
- `backend/integration.test.js`
- `backend/test-integration.js`
- `dashboard/.env.example`
- `dashboard/public/_redirects`
- `dashboard/src/api.js`
- `dashboard/src/components/CollectionState.js`
- `dashboard/src/components/Trading.test.js`
- `dashboard/src/useCollection.js`
- `deploy/nginx-staging.conf`
- `deploy/zerodha-staging.service`
- `frontend/.env.example`
- `frontend/public/_redirects`
- `frontend/src/landing_page/Pages.test.js`
- `scripts/smoke.cjs`

## Deleted

None.

## Preservation checks

- Existing `backend/.env` unchanged; no secret values included.
- Original binary/static image/font assets unchanged.
- No original files deleted.
- No branch, history, stash, remote or production resources modified.
- See `AUDIT_REPORT.md` for rationale and verification; see `DEPLOYMENT.md` for private staging instructions.
