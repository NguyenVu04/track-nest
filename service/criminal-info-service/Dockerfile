FROM gradle:jdk-21-and-24 AS builder
WORKDIR /app
COPY . .
RUN gradle build --no-daemon

FROM eclipse-temurin:21
RUN mkdir /opt/app
COPY --from=builder /app/build/libs/criminal-info-service-0.0.1-SNAPSHOT.jar /opt/app
CMD ["java", "-jar", "/opt/app/criminal-info-service-0.0.1-SNAPSHOT.jar", "--spring.profiles.active=${SPRING_PROFILES_ACTIVE}"]