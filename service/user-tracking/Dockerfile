FROM gradle:jdk25 AS builder

WORKDIR /app

COPY . .

RUN gradle build --no-daemon -x test

FROM eclipse-temurin:25-jre-jammy

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/build/libs/user-tracking-1.0.0.jar app.jar

EXPOSE 19090

EXPOSE 18080

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]