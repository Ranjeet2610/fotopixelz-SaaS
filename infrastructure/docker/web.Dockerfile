FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web ./apps/web
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile
EXPOSE 3000
CMD ["pnpm", "--filter", "web", "dev"]
