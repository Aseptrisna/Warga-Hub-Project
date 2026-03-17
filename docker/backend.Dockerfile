# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Install dependencies
RUN npm ci --workspace=apps/backend

# Copy source code
COPY apps/backend ./apps/backend
COPY packages ./packages

# Build application
RUN npm run build --workspace=apps/backend

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/apps/backend/package*.json ./apps/backend/

# Install production dependencies only
RUN npm ci --workspace=apps/backend --only=production

# Copy built application
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages ./packages

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "apps/backend/dist/main.js"]
