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

# ✅ Cloud Run requires 8080
ENV PORT=8080
EXPOSE 8080

# Network configuration
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV NODE_OPTIONS="--dns-result-order=ipv4first --max-old-space-size=512"

# ✅ Fix healthcheck port
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/claims || exit 1

CMD ["npm", "start"]
