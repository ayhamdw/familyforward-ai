# FamilyForward API

Express + TypeScript + MongoDB (Mongoose). Node 20 or newer.

There are two environments, local and production. The same code runs in both and only environment variables change.

| Environment | Database name | Where |
|---|---|---|
| Local | `familyforward_dev` | your machine |
| Production | `familyforward_prod` | Render |

## Run locally

Run these from the repo root. Never paste your connection string into chat, issues or commits.

1. Install dependencies: `npm install`
2. Create your env file: `cp api/.env.example api/.env`
3. Edit `api/.env`: set `MONGODB_URI` to your Atlas connection string and keep `DB_NAME=familyforward_dev`. In Atlas, allow your IP under Network Access.
4. Start the dev server: `npm run dev -w api`
5. In another terminal, check liveness: `curl -i http://localhost:3000/health`
   Expected: `200` with `{"status":"ok","env":"development","uptimeSeconds":...}`
6. Check the database: `curl -i http://localhost:3000/health/db`
   Expected: `200` with `{"db":"up"}`. A `503` with `{"db":"down"}` means MongoDB is not reachable (check the URI, the Atlas user and the IP allow list).

If a variable is missing or invalid, the server exits immediately and lists the variable names (never the values).

## Scripts

Run with `npm run <script> -w api`.

| Script | What it does |
|---|---|
| `dev` | tsx watch, loads `api/.env` |
| `build` | compiles TypeScript to `api/dist` |
| `start` | runs `node dist/server.js` (reads variables from the process environment, no `.env` file) |
| `test` | Jest + supertest, no database needed |
| `typecheck` | `tsc --noEmit` |

## Environment variables

| Name | Required | Notes |
|---|---|---|
| `NODE_ENV` | yes | `development`, `production` or `test` |
| `PORT` | no | default `3000` (Render sets it for you) |
| `MONGODB_URI` | yes | secret, set only in `api/.env` and in the Render dashboard |
| `DB_NAME` | yes | `familyforward_dev` locally, `familyforward_prod` in production |
| `LOG_LEVEL` | no | default `info` |

## Deploy to Render

Create a **Web Service** from this repository with these settings:

- **Root Directory:** leave empty (the repo root), so npm workspaces and the lockfile resolve.
- **Build Command:** `npm ci -w api --include=dev && npm run build -w api`
  (`--include=dev` is required: with `NODE_ENV=production` npm would otherwise skip TypeScript and the type packages, and the build fails. `-w api` installs only the API's dependencies, not the mobile app's.)
- **Start Command:** `npm run start -w api`
- **Node version:** 20 or newer. Set the env var `NODE_VERSION` to `20` (or higher), or rely on `engines` in `api/package.json`.
- **Health Check Path:** `/health`

Environment variables to set in the Render dashboard (names only):

- `NODE_ENV` = `production`
- `MONGODB_URI` (secret)
- `DB_NAME` = `familyforward_prod`
- `LOG_LEVEL` (optional)

Do not set `PORT`; Render provides it. In Atlas, allow Render's outbound IPs under Network Access, or use an allow rule that covers them.

## Endpoints

- `GET /health`: liveness. `200 {"status":"ok","env":"...","uptimeSeconds":n}`. Does not touch the database.
- `GET /health/db`: readiness. `200 {"db":"up"}` or `503 {"db":"down"}`.

Neither endpoint returns versions, hostnames, URIs or stack traces.

## Notes

- Rate limit: 100 requests per minute per IP. `trust proxy` is set to 1 because Render sits behind one proxy.
- Request bodies are never logged; the `authorization` header and cookies are redacted.
- No CORS: the clients are mobile apps.
