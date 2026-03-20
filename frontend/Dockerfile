# syntax=docker/dockerfile:1

FROM node:20.0.0-slim AS builder
WORKDIR /app

# Vite env vars are read at build-time.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Install deps (cached) using the lockfile.
COPY package.json package-lock.json ./
RUN npm config set strict-ssl false \
  && npm ci --no-audit --no-fund

# Build
COPY . .
RUN npm run build

# Runtime: serve static build with Node (no nginx)
FROM node:20.0.0-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY docker-static-server.mjs ./docker-static-server.mjs
COPY docker-serve.sh /usr/local/bin/serve
RUN chmod +x /usr/local/bin/serve

EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "8080", "--single"]
