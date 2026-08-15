FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:24-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Image builds must never contact a database: migrations are applied at
# deploy time (`npm run db:deploy`), keeping the build reproducible.
ENV SKIP_DB_MIGRATE=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Include the Prisma CLI/runtime and migration runner so startup migrations
# actually execute in the production image.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrate-deploy.mjs ./scripts/migrate-deploy.mjs
COPY --from=builder --chown=nextjs:nodejs /app/scripts/validate-production-env.mjs ./scripts/validate-production-env.mjs
USER nextjs
EXPOSE 3000
ENV PORT=3000
# Next.js standalone binds to localhost unless HOSTNAME is set, which makes
# the container unreachable from outside its network namespace.
ENV HOSTNAME=0.0.0.0
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "node scripts/validate-production-env.mjs && node scripts/migrate-deploy.mjs && node server.js"]
