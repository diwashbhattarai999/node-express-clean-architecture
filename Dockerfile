# syntax=docker/dockerfile:1

ARG NODE_VERSION=22
ARG PNPM_VERSION=11.22.0

FROM node:${NODE_VERSION}-alpine AS base
ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
# NOTE: avoid WORKDIR named /app — tsc-alias mis-resolves path aliases when the
# project directory is literally called "app" (confDirParentFolderName collision).
WORKDIR /workspace

FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
ENV LEFTHOOK=0
RUN pnpm install --frozen-lockfile --ignore-scripts \
  && pnpm rebuild argon2

FROM base AS build
COPY --from=deps /workspace/node_modules ./node_modules
COPY package.json pnpm-lock.yaml tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN ./node_modules/.bin/tsc -p tsconfig.build.json \
  && ./node_modules/.bin/tsc-alias -p tsconfig.build.json --resolve-full-paths \
  && if grep -R "from \"@/" dist >/dev/null 2>&1; then \
       echo "Path aliases were not rewritten by tsc-alias" >&2; \
       exit 1; \
     fi

FROM base AS production-deps
RUN apk add --no-cache libc6-compat python3 make g++
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
ENV LEFTHOOK=0
RUN pnpm install --frozen-lockfile --prod --ignore-scripts \
  && pnpm rebuild argon2

FROM base AS runtime
RUN apk add --no-cache libc6-compat \
  && addgroup -S nodejs \
  && adduser -S nodejs -G nodejs

ENV NODE_ENV=production \
  LEFTHOOK=0 \
  HOST=0.0.0.0 \
  PORT=3000 \
  RUN_MIGRATIONS=true

WORKDIR /workspace

COPY --from=production-deps --chown=nodejs:nodejs /workspace/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /workspace/dist ./dist
COPY --chown=nodejs:nodejs package.json ./
COPY --chown=nodejs:nodejs drizzle ./drizzle
COPY --chown=nodejs:nodejs docker/entrypoint.sh ./docker/entrypoint.sh

RUN chmod +x ./docker/entrypoint.sh

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["node", "dist/server.js"]
