# Stage 1: Build stage with Maven and Java 21
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /build

# Cache dependencies by copying pom.xml first
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and build the application JAR
COPY src ./src
RUN mvn package -DskipTests -B && cp target/*.jar /build/app.jar

# Stage 2: Minimal Java 21 runtime stage
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Create a dedicated non-root application user and group
RUN groupadd -r foodloop && useradd -r -g foodloop -m -d /home/foodloop foodloop

# Copy the generated JAR file from the builder stage
COPY --from=builder /build/app.jar app.jar

# Ensure appropriate ownership
RUN chown -R foodloop:foodloop /app

# Switch to the non-root user
USER foodloop

# Render provides the PORT environment variable at runtime
ENV PORT=8080
EXPOSE 8080

# Execute Spring Boot using the assigned port
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8080} -jar app.jar"]
