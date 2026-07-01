# UniSentinel GRC platform — production image (web + worker from one image).
# Build context is the REPO ROOT:  docker build -f deploy/docker/Dockerfile .
# The .dockerignore excludes apps/website (marketing + internal CRM) from the
# context except its package.json (required for npm ci lockfile validation).

# ---- deps: install the workspace tree --------------------------------------
FROM node:22-bookworm-slim AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/grc/package.json apps/grc/
COPY apps/website/package.json apps/website/
COPY packages/ui/package.json packages/ui/
COPY packages/db/package.json packages/db/
RUN npm ci

# ---- build: ui dist -> next standalone -> worker bundles -------------------
FROM node:22-bookworm-slim AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/grc ./apps/grc
COPY apps/website/package.json ./apps/website/package.json
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w @unisentinel/ui \
 && npm run build -w @unisentinel/grc \
 && npm run build:worker -w @unisentinel/grc

# ---- runner: minimal runtime, non-root -------------------------------------
FROM node:22-bookworm-slim AS runner
ARG APP_VERSION=0.1.0
ENV NODE_ENV=production \
    APP_VERSION=${APP_VERSION} \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

# Next standalone output (server.js + traced node_modules), static assets,
# and the self-contained worker/migrate bundles + SQL migrations.
COPY --from=build /repo/apps/grc/.next/standalone ./
COPY --from=build /repo/apps/grc/.next/static ./apps/grc/.next/static
COPY --from=build /repo/apps/grc/public ./apps/grc/public
COPY --from=build /repo/apps/grc/dist/worker.cjs /repo/apps/grc/dist/migrate.cjs ./
COPY --from=build /repo/packages/db/migrations ./migrations
COPY deploy/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && chown -R node:node /app

USER node
EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["web"]
