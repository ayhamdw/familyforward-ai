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
| `build` | type-checks, then bundles the API and the shared package into `api/dist/server.js` (esbuild) |
| `lint` | ESLint |
| `start` | runs `node dist/server.js` (reads variables from the process environment, no `.env` file) |
| `test` | Jest + supertest. Uses an in-memory MongoDB (`mongodb-memory-server`, database `familyforward_test`); the first run downloads a MongoDB binary. Never touches dev or prod data |
| `typecheck` | `tsc --noEmit` |

## Environment variables

Names only here. Values go in `api/.env` locally and in the Render dashboard. `api/.env.example` lists them all.

| Name | Required | Notes |
|---|---|---|
| `NODE_ENV` | yes | `development`, `production` or `test` |
| `PORT` | no | default `3000` (Render sets it for you) |
| `MONGODB_URI` | yes | secret, set only in `api/.env` and in the Render dashboard |
| `DB_NAME` | yes | `familyforward_dev` locally, `familyforward_prod` in production |
| `LOG_LEVEL` | no | default `info` |
| `JWT_SECRET` | yes | secret, at least 32 characters. Signs the 30-day sign-in token |
| `CODE_HMAC_SECRET` | yes | secret, at least 32 characters. Keys the hashes of emails and one-time codes. Changing it invalidates pending codes |
| `RESEND_API_KEY` | production | secret. Optional in development: without it the sign-in code is printed in the API terminal (development only, never in production) |
| `MAIL_FROM` | with the key | sender address verified in Resend |
| `LLM_PROVIDER` | no | `mock` (default) or `claude`. See below |
| `ANTHROPIC_API_KEY` | if `claude` | secret |
| `ANTHROPIC_MODEL` | if `claude` | model id to use |
| `PLAN_DAILY_LIMIT` | no | plans per parent per 24 hours, default `5` |

Generate the two secrets with: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`

## Switching the plan generator

`LLM_PROVIDER=mock` (default) builds plans from the seed library. It is deterministic, free and needs no key. Use it for local work and the mobile app.

To use Claude, set in `api/.env` (or Render):

```
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=<your key>
ANTHROPIC_MODEL=<model id>
```

Restart the API. The startup log shows `llm: claude`. If a variable is missing the server will not start. Every model answer is validated and safety-filtered. After one retry, or on a provider error or a 20 second timeout, the parent gets a ready-made fallback plan (`source: "fallback"`). Switch back by setting `LLM_PROVIDER=mock`.

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
- `JWT_SECRET`, `CODE_HMAC_SECRET` (secrets)
- `RESEND_API_KEY` (secret), `MAIL_FROM`
- `LLM_PROVIDER`, and for `claude`: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`
- `PLAN_DAILY_LIMIT`, `LOG_LEVEL` (optional)

Do not set `PORT`; Render provides it. In Atlas, allow Render's outbound IPs under Network Access, or use an allow rule that covers them.

## Endpoints

Errors always look like `{"error":{"code":"...","message":"..."}}`. No stack traces. Send the token as `Authorization: Bearer <token>`.

| Method and path | Auth | Success | Errors (code) |
|---|---|---|---|
| `GET /health` | no | `200 {"status":"ok",...}` | |
| `GET /health/db` | no | `200 {"db":"up"}` | `503 {"db":"down"}` |
| `POST /auth/request-code` `{email}` | no | `200 {"ok":true}`, same for every email | `400 invalid_email`, `429 rate_limited` |
| `POST /auth/verify` `{email, code}` | no | `200 {"token"}` | `400 invalid_code`, `400 code_expired` (expired, used or locked after 5 tries), `429 rate_limited` |
| `POST /plans` survey + optional `note` | yes | `201` plan | `400 invalid_survey`, `401 unauthorized`, `429 plan_daily_limit` |
| `GET /plans/current` | yes | `200` plan of this week | `404 no_plan` |
| `GET /plans` | yes | `200 {"plans":[...]}` past weeks, newest first | |
| `DELETE /me` | yes | `204`, deletes parent, surveys, plans, codes | |

Survey body: `language` (`en|es|ar`), `ageBand` (`2-3|4-5`), `focusAreas` (1-2), `interests`, `materials`, `minutesPerDay` (5|10|20), `daysPerWeek` (2|3|5), optional `note` (max 140 characters).

The `note` is used only to build the prompt, in memory. It is not saved or logged, and it is left out of the prompt if it mentions health or development. In that case the `POST /plans` response has `"noteIgnored": true` (otherwise `false`) so the app can say the note was not used; the note text is never returned.

A [Postman collection](postman/familyforward-api.postman_collection.json) covers every endpoint. Import it, run `request-code`, copy the code from the API terminal into the `code` variable, run `verify` (it saves the token), then try the rest.

Try it with curl (development, mock generator):

```
curl -s -X POST localhost:3000/auth/request-code -H 'content-type: application/json' -d '{"email":"me@example.com"}'
# read the 6-digit code in the API terminal
curl -s -X POST localhost:3000/auth/verify -H 'content-type: application/json' -d '{"email":"me@example.com","code":"123456"}'
curl -s -X POST localhost:3000/plans -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"language":"en","ageBand":"2-3","focusAreas":["talking"],"interests":[],"materials":["paper"],"minutesPerDay":10,"daysPerWeek":3}'
```

## Notes

- Rate limits: 100 requests per minute per IP overall. Sign-in has its own limits per IP and per email (counted in memory, so they reset on restart and are per instance). Plans are limited per parent by `PLAN_DAILY_LIMIT`.
- Logs hold only method, path (no query), status, response time and an error code. Survey text, notes, emails, codes, tokens, IPs and headers are never logged. Plan generation logs only short reason codes.
- `trust proxy` is set to 1 because Render sits behind one proxy.
- Request bodies are never logged; the `authorization` header and cookies are redacted.
- No CORS: the clients are mobile apps.
