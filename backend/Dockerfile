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

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["sh", "-c", "npm run start"]
