# AEGIS: Free hosting deployment (no Docker)

This package is configured for a demonstration deployment using:
- **GitHub** to store the source code
- **Render free web service** for the FastAPI API
- **Vercel** for the React/Vite frontend

## Important limitations before publishing

AEGIS is a labelled simulation. The demo login lets visitors choose seeded personas. Do not put real personal data, passwords, or confidential files into it. SQLite on a free hosted service may be lost when the instance restarts, redeploys, or sleeps; this setup is for a demonstration, not durable production data. The live Hyperledger Fabric network is not connected to the demo API.

## 1. Put the project on GitHub

1. Extract this ZIP.
2. Open the extracted `aegis` folder. The files `README.md`, `render.yaml`, `backend/`, `frontend/`, and `chaincode/` should be inside it.
3. Create a new GitHub repository, for example `aegis-demo`. Keep it **Private** until you have checked the repository for secrets and confidential data.
4. Upload the *contents* of the `aegis` folder to the repository root, not the parent folder containing `aegis/`.
5. Confirm `.env` is not uploaded. `.gitignore` excludes it. Do not upload generated secrets.

## 2. Deploy the backend on Render

1. Sign in to Render and choose **New → Blueprint** (or create a Web Service manually).
2. Connect the GitHub repository.
3. If Render asks for the Blueprint file, use `render.yaml` in the repository root. The file configures a native Python service; it does not use Docker.
4. Deploy. Wait for the build to finish.
5. Copy the public service URL, for example `https://aegis-api-xxxx.onrender.com`.
6. Open `https://YOUR-RENDER-URL/health/live`. Expected response includes `"status":"up"` and `"mode":"demo"`.
7. Open `https://YOUR-RENDER-URL/health/ready`. Expected response includes `"ready":true` and `"ledger":"simulated"`.

If using manual service setup instead of the Blueprint:
- Runtime: Python
- Root directory: `backend`
- Build command: `pip install -r requirements.lock`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/health/live`
- Environment variables:
  - `AEGIS_MODE` = `demo`
  - `AEGIS_SIGNING_SECRET` = generate a unique random secret of at least 32 characters. Render's `generateValue` does this for Blueprint deployment.
  - `AEGIS_DATABASE_URL` = `sqlite:///./aegis-demo.db`
  - `AEGIS_ALLOWED_ORIGINS` = `["http://localhost:5173","http://127.0.0.1:5173"]` initially; update it after Vercel is deployed.
  - `AEGIS_TOKEN_MINUTES` = `15`

Do not set `AEGIS_MODE=production`: production mode intentionally fails readiness until the real Fabric, identity, and storage integrations exist.

## 3. Deploy the frontend on Vercel

1. Sign in to Vercel and choose **Add New → Project**.
2. Import the GitHub repository.
3. Set **Root Directory** to `frontend`.
4. Framework preset: Vite (or let Vercel detect it).
5. Build command: `npm run build`
6. Output directory: `dist`
7. Add this environment variable:
   - Name: `VITE_API_BASE_URL`
   - Value: the Render backend URL, e.g. `https://aegis-api-xxxx.onrender.com` (no trailing slash)
8. Deploy and copy the Vercel URL, e.g. `https://aegis-demo.vercel.app`.

The frontend config uses the full Render API URL only when `VITE_API_BASE_URL` is set. Local development keeps using the existing Vite proxy.

## 4. Allow the Vercel origin in the backend

1. Go back to Render → your `aegis-api` service → **Environment**.
2. Update `AEGIS_ALLOWED_ORIGINS` to include your exact Vercel origin, without a trailing slash. Example:
   `["https://aegis-demo.vercel.app","http://localhost:5173","http://127.0.0.1:5173"]`
3. If you use a Vercel preview URL or a custom domain, add that exact origin too.
4. Save changes and redeploy/restart the backend.
5. Visit the Vercel site, choose a seeded demo persona, and test the registry, verification, audit, and Jury Demo workflows.

## 5. Final smoke test

- `https://YOUR-RENDER-URL/health/live` returns status `up`.
- `https://YOUR-RENDER-URL/health/ready` returns ready `true`, mode `demo`, ledger `simulated`.
- `https://YOUR-RENDER-URL/docs` opens FastAPI's API docs.
- The Vercel page loads without a build error.
- Login and at least one read + one permitted command work.
- Open browser developer tools → Console/Network if requests fail. A CORS error usually means the Vercel origin is missing from `AEGIS_ALLOWED_ORIGINS`; a 502/503 often means the Render service is still waking up or failed to start.

## 6. Free-hosting caveats

- Render free services may sleep when idle, so the first request can be slow.
- Free local disk is not durable. Demo records can reset after restart/redeploy/sleep. Do not promise persistent data to judges.
- The API's in-process rate limit and SQLite are appropriate only for a small demo.
- Fabric chaincode is still a separate package; hosting the UI and API does not deploy or connect a Fabric ledger.
- Browser-based Playwright checks were not validated in the original checkpoint. Test the hosted UI yourself before presenting it.

## Native local development

Follow `README.md`. No Docker is required.
