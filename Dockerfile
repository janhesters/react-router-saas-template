# syntax=docker/dockerfile:1

FROM oven/bun:1.3.14-debian AS base
# React's streaming server renderer requires a real Node.js runtime. Bun stays
# responsible for dependency installation and package scripts.
COPY --from=node:24.19.0-trixie-slim /usr/local/bin/node /usr/local/bin/node
WORKDIR /app

FROM base AS build-env
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts
COPY . .
RUN bun run build

FROM base AS production-dependencies-env
ENV NODE_ENV=production
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production --ignore-scripts

FROM base AS release
ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV PORT=3000
COPY package.json bun.lock ./
COPY --chown=bun:bun --from=production-dependencies-env /app/node_modules ./node_modules
COPY --chown=bun:bun --from=build-env /app/build ./build
COPY --chown=bun:bun --from=build-env /app/prisma ./prisma
COPY --chown=bun:bun --from=build-env /app/prisma.config.ts ./prisma.config.ts
COPY --chown=bun:bun --from=build-env /app/public ./public
EXPOSE 3000
USER bun
CMD ["bun", "run", "start"]
