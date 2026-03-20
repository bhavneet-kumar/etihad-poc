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

# ✅ Cloud Run requires 3001
EXPOSE 3001

CMD ["npm", "start"]
