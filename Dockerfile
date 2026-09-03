# Multi-stage Docker build for Hotel Management System

# Stage 1: Build stage
FROM maven:3.8.1-openjdk-11 AS builder

WORKDIR /app

# Copy pom.xml
COPY pom.xml .

# Download dependencies
RUN mvn dependency:go-offline

# Copy source code
COPY src ./src

# Build the application
RUN mvn -B clean package -DskipTests

# Stage 2: Runtime stage
FROM openjdk:11-jre-slim

WORKDIR /app

# Copy JAR from builder
COPY --from=builder /app/target/hotel-management-system-*.jar app.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]

# Labels
LABEL maintainer="Hotel Management Team"
LABEL description="Hotel Management System - Complete REST API with tests"
LABEL version="1.0.0"
