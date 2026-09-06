# Multi-stage Docker build for Hotel Management System

# Stage 1: Build stage — Java 21
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy pom.xml and source code
COPY pom.xml .
COPY src ./src

# Build JAR without running unit tests during container creation
RUN mvn -B clean package -DskipTests

# Stage 2: Runtime stage — slim JRE 21
FROM eclipse-temurin:21-jre

WORKDIR /app

# Install curl for health check
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copy JAR from builder
COPY --from=builder /app/target/hotel-management-*.jar app.jar

EXPOSE 8085

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8085/api/guests || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]

LABEL maintainer="Hotel Management Team"
LABEL description="የ-mom Hotel Management System - REST API"
LABEL version="1.0.0"
