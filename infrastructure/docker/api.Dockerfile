FROM node:20-alpine
WORKDIR /app
COPY . .
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile
EXPOSE 5000
CMD ["pnpm", "--filter", "api", "dev"]
