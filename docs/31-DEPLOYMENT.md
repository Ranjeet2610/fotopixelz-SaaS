# Deployment

## Development commands (root `package.json`)
```
pnpm dev              # all apps/services in parallel (turbo, via pnpm -r --parallel run dev)
pnpm dev:client       # apps/client only (next dev -p 3000)
pnpm dev:admin        # apps/admin only (next dev -p 3001)
pnpm dev:api          # services/api only (tsx watch src/bootstrap.ts)
pnpm dev:workers      # apps/workers only (tsx watch — no real consumer, see docs/19-WORKERS-AND-JOBS.md)
pnpm --filter web run dev   # apps/web only (next dev -p 3002) — no root alias defined
```

## Build/lint/typecheck (root `package.json`, via Turborepo)
```
pnpm build      # turbo run build
pnpm lint       # turbo run lint
pnpm typecheck  # turbo run typecheck
```
Per-package: `pnpm --filter <name> run <script>`. `apps/workers` has no real lint config (`lint` is a no-op echo, per CLAUDE.md). `services/api` build = `tsc -p tsconfig.json`.

## Database commands
```
pnpm db:generate      # prisma generate
pnpm db:migrate       # prisma migrate dev
pnpm db:deploy        # prisma migrate deploy (no prompts — used in the Docker Compose api service startup)
pnpm db:studio        # prisma studio
pnpm db:seed          # prisma db seed → prisma/seed.ts
pnpm db:cleanup-empty-orgs[:execute]
pnpm db:repair-deliverables[:execute]
```

## Docker / Docker Compose
`infrastructure/docker-compose.yml`, verified directly. Services defined: **`postgres`, `redis`, `api`, `client`, `admin`, `worker`**. **No `web` service is defined** — confirms Pass 1's finding that `apps/web` is not yet wired into deployment.

| Service | Image/Build | Container name | Port mapping | Notes |
|---|---|---|---|---|
| `postgres` | `postgres:18-alpine` | `fotopixelz-postgres` | `${POSTGRES_PORT:-5432}:5432` | Healthcheck via `pg_isready` |
| `redis` | `redis:7-alpine` | `fotopixelz-redis` | `${REDIS_PORT:-6379}:6379` | Healthcheck via `redis-cli ping` |
| `api` | `infrastructure/docker/api.Dockerfile` | `fotopixelz-api` | `${API_PORT:-5000}:5000` | Waits on postgres+redis healthy; startup command runs `pnpm install`, `prisma migrate deploy`, `prisma generate`, then `pnpm --filter api dev`; own healthcheck hits `GET /health` |
| `client` | `infrastructure/docker/client.Dockerfile` | `fotopixelz-client` | `${CLIENT_PORT:-3000}:3000` | Waits on api healthy; runs `next dev -H 0.0.0.0 -p 3000` |
| `admin` | `infrastructure/docker/admin.Dockerfile` | `fotopixelz-admin` | `${ADMIN_PORT:-3001}:3001` | Waits on api healthy; runs `next dev -H 0.0.0.0 -p 3001` |
| `worker` | `infrastructure/docker/worker.Dockerfile` | `fotopixelz-worker` | none published | Waits on postgres+redis+api healthy; runs `pnpm --filter workers dev` — starts the process documented as non-functional in `docs/19-WORKERS-AND-JOBS.md` |

Notable: **every service in Compose runs its `dev` script** (`next dev`, `tsx watch`), not a production build/start command — this Compose file is a **development/local environment configuration**, not a production deployment manifest, despite `restart: unless-stopped` policies being set. No production-mode Compose file, Kubernetes manifest, or equivalent was found in `infrastructure/`.

No `Nginx` configuration and no `PM2`/`ecosystem.config.*` file exist anywhere in the repository — confirmed by direct search. Any reverse-proxy/process-manager layer for production is either handled outside this repository or not yet built.

## Per-app Dockerfiles
`infrastructure/docker/{api,client,admin,worker}.Dockerfile` exist (one per deployed service, matching the Compose service list — no `web` Dockerfile exists either).

## Ports (confirmed, cross-referenced against Pass 1)
| Port | Service |
|---|---|
| 3000 | `apps/client` |
| 3001 | `apps/admin` |
| 3002 | `apps/web` (dev-only; not in Docker Compose) |
| 5000 | `services/api` |
| 5432 | PostgreSQL |
| 6379 | Redis |

## Environment configuration
`.env` at the repo root is the single source of env vars for local/Docker development (`env_file: ../.env` in Compose; `services/api/src/bootstrap.ts` loads it via `dotenv` from both `process.cwd()/.env` and `../../.env`, matching the pattern noted in `apps/workers/src/index.ts`). Docker Compose overrides `DATABASE_URL`/`REDIS_URL` to point at the in-network `postgres`/`redis` service names rather than `localhost`.

### Environment variable names by group

Names only — no values reproduced, per project convention (see `docs/architecture/env.md` for the existing living reference with descriptions).

**Frontend**
- `NEXT_PUBLIC_API_BASE_URL` (client, admin)

**Backend / app config**
- `NODE_ENV`, `PORT`, `APP_NAME`, `SUPPORT_EMAIL`, `WEB_APP_URL`, `ADMIN_APP_URL`, `API_BASE_URL`, `ADMIN_NOTIFICATION_EMAIL`

**Database**
- `DATABASE_URL`

**Security / tokens**
- `JWT_ACCESS_SECRET`, `JWT_ACCESS_TTL`, `OAUTH_STATE_SECRET`, `ENFORCE_EMAIL_VERIFICATION`

**OAuth**
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

**Email**
- `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `EMAIL_LOGO_URL`

**Storage**
- `STORAGE_PROVIDER`, `STORAGE_UPLOAD_EXPIRY_SECONDS`, `STORAGE_DOWNLOAD_EXPIRY_SECONDS`, `CLOUDINARY_CLOUD_NAME`

**Redis**
- `REDIS_URL`

**Payments (unused by working code, per `docs/14-PAYMENTS-AND-BILLING.md`)**
- `STRIPE_SECRET_KEY`

**Docker Compose-only (local infra, not app-level secrets)**
- `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `REDIS_PORT`, `API_PORT`, `CLIENT_PORT`, `ADMIN_PORT`

## Deployment status
**Local/dev-oriented only.** There is no confirmed production deployment configuration in this repository: no production Dockerfile targets/build stage separation confirmed beyond what each Dockerfile does internally (not individually inspected line-by-line in this pass), **no `.github` directory exists — confirmed directly, so there is no CI/CD pipeline in this repository at all**, and `docs/planning/PRODUCTION_DEPLOYMENT_STRATEGY.md` exists as a planning document (per Pass 1 discovery) describing an intended rollout process, but that is a plan document, not a verified-working deployment pipeline.
