# Local Setup

## Prerequisites
- Node.js 20+
- pnpm 11+
- PostgreSQL 16+
- Redis 7+

## Bootstrap
1. Install dependencies:
```bash
pnpm install
```
2. Copy env file:
```bash
cp .env.example .env
```
3. Start infra (optional):
```bash
docker compose -f infrastructure/docker-compose.yml up -d
```
4. Generate Prisma client:
```bash
pnpm db:generate
```
5. Run migrations:
```bash
pnpm db:migrate
```
6. Start all apps:
```bash
pnpm dev
```

## Individual services
- Web: `pnpm dev:web`
- Admin: `pnpm dev:admin`
- API: `pnpm dev:api`
- Workers: `pnpm dev:workers`

## Validation Commands
- `pnpm -r run typecheck`
- `pnpm -r run build`

## Known Local Blockers
- If Windows ACL denies writes under `apps/admin/src/app`, adjust folder permissions before scaffolding new admin routes.
