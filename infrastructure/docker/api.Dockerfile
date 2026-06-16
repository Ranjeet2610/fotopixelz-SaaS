# syntax=docker/dockerfile:1

FROM node:22-alpine

RUN apk add --no-cache libc6-compat openssl

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PNPM_STORE_DIR="/pnpm/store"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable && corepack prepare pnpm@11.4.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc prisma.config.ts turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
COPY apps/workers/package.json ./apps/workers/
COPY services/api/package.json ./services/api/
COPY packages/database/package.json ./packages/database/
COPY packages/auth/package.json ./packages/auth/
COPY packages/validators/package.json ./packages/validators/
COPY packages/upload-gallery/package.json ./packages/upload-gallery/

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm fetch --filter "api..." --filter "fotopixelz" && \
    pnpm install --frozen-lockfile --offline \
      --filter "api..." --filter "fotopixelz"

COPY prisma ./prisma
COPY packages/auth ./packages/auth
COPY packages/database ./packages/database
COPY services/api ./services/api

ARG DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV DATABASE_URL=${DATABASE_URL}

RUN pnpm exec prisma generate

EXPOSE 5000

CMD ["pnpm", "--filter", "api", "dev"]
