FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin ./apps/admin
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile
EXPOSE 3001
CMD ["pnpm", "--filter", "admin", "dev"]
