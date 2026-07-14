# =============================================================================
# TITANBOT PRODUCTION IMAGE
# =============================================================================

FROM node:20-alpine AS base

# Install security updates and build deps (removed in final stage if needed)
RUN apk add --no-cache dumb-init ca-certificates

WORKDIR /usr/src/app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# -----------------------------------------------------------------------------
# DEPENDENCIES STAGE
# -----------------------------------------------------------------------------
FROM base AS deps

# Cache mount for npm — speeds up rebuilds when package.json hasn't changed
RUN --mount=type=cache,target=/root/.npm \
    npm config set cache /root/.npm --global

COPY package*.json ./

# Install only production dependencies
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# -----------------------------------------------------------------------------
# PRODUCTION STAGE
# -----------------------------------------------------------------------------
FROM base AS production

ENV NODE_ENV=production
ENV PORT=3000

# Build args for traceability
ARG BUILD_DATE
ARG VCS_REF
LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.title="titanbot" \
      org.opencontainers.image.description="TitanBot production image"

# Copy dependencies from deps stage
COPY --from=deps --chown=nodejs:nodejs /usr/src/app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

EXPOSE 3000

# Health check for orchestrators
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Use dumb-init for proper signal handling (PID 1 problem)
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "server.js"]
