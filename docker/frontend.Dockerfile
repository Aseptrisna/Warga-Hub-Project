# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/

# Install dependencies
RUN npm ci --workspace=apps/frontend

# Copy source code
COPY apps/frontend ./apps/frontend
COPY packages ./packages

# Build application
ENV VITE_API_URL=http://localhost:3000/api/v1
RUN npm run build --workspace=apps/frontend

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
