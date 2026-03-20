FROM node:18-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files with ownership
COPY --chown=nodejs:nodejs package*.json ./

# Install dependencies
RUN npm config set strict-ssl false && npm ci && npm cache clean --force

# Copy rest of the app with ownership
COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE 3001

# Network configuration for Windows Docker compatibility
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV NODE_OPTIONS="--dns-result-order=ipv4first --max-old-space-size=512"

# Healthcheck to verify API is responding
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/claims || exit 1

CMD ["sh", "-c", "npm run start"]
