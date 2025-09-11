FROM gradle:jdk21 AS builder

WORKDIR /app

COPY . .

RUN gradle build --no-daemon

FROM eclipse-temurin:21

WORKDIR /app

COPY --from=builder /app/build/libs/emergency-ops-0.0.1.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]