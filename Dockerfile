# Multi-stage build for backend only
FROM node:22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy shared-types package
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY packages/shared-types ./packages/shared-types

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Build shared-types
RUN cd packages/shared-types && npm run build && cd ../..

# Copy backend source code (frontend excluded by .dockerignore)
COPY src ./src
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Build backend
RUN npm run build

# Production stage
FROM node:22-alpine

# Install runtime dependencies
RUN apk add --no-cache lsof

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy shared-types package.json
COPY packages/shared-types/package*.json ./packages/shared-types/

# Install ONLY production dependencies
RUN npm ci --only=production

# Copy built backend from builder stage
COPY --from=builder /app/dist ./dist

# Copy built shared-types from builder stage
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/

# Create data directory for SQLite (if needed)
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start the application
CMD ["node", "dist/main.js"]
