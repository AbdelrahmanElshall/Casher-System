# Phase 20: Production Multi-Stage Dockerfile for Nile Horizon POS Egypt
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy full application source
COPY . .

# Build Vite application for production distribution
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install serve to deliver the high-performance static SPA
RUN npm install -g serve

# Copy built production assets from builder
COPY --from=builder /app/dist ./dist

# Non-root secure user
USER node

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
