FROM gradle:jdk25 AS builder

WORKDIR /app

COPY build.gradle settings.gradle gradlew ./
COPY gradle ./gradle

RUN ./gradlew dependencies --no-daemon || true

COPY src ./src

RUN ./gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:25-jre-jammy

RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/build/libs/emergency-ops-1.0.0.jar app.jar

EXPOSE 28080

EXPOSE 8081

ENTRYPOINT [ "java", "-XX:MaxRAMPercentage=60", "-XX:InitialRAMPercentage=30", "-XX:MaxMetaspaceSize=128m", "-Xss256k", "-XX:+UseG1GC", "-XX:MaxGCPauseMillis=200", "-XX:+ExitOnOutOfMemoryError", "-jar", "app.jar"]