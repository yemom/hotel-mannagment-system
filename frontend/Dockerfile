# Multi-stage Docker build for Hotel Management Frontend

# Stage 1: Build React Application
FROM node:20-alpine AS build-stage

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install dependencies
RUN npm ci || npm install

# Copy application source code
COPY . .

ARG VITE_API_URL=/api
ARG VITE_SUPERADMIN_EMAIL=12yemom@gmail.com
ARG VITE_SUPERADMIN_PASSWORD=12345678
ARG VITE_SUPERADMIN_FIRST_NAME=Yemom
ARG VITE_SUPERADMIN_LAST_NAME=Admin
ARG VITE_SUPERADMIN_PHONE=+251934046279

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPERADMIN_EMAIL=$VITE_SUPERADMIN_EMAIL
ENV VITE_SUPERADMIN_PASSWORD=$VITE_SUPERADMIN_PASSWORD
ENV VITE_SUPERADMIN_FIRST_NAME=$VITE_SUPERADMIN_FIRST_NAME
ENV VITE_SUPERADMIN_LAST_NAME=$VITE_SUPERADMIN_LAST_NAME
ENV VITE_SUPERADMIN_PHONE=$VITE_SUPERADMIN_PHONE

# Build production bundle
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine AS production-stage

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled frontend assets from build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]

# Metadata
LABEL maintainer="Hotel Management Team"
LABEL description="Hotel Management Frontend React Dashboard"
LABEL version="1.0.0"
