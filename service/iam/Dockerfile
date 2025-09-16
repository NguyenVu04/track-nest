FROM eclipse-temurin:21-jre-jammy

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN apt-get update && apt-get install -y dos2unix && dos2unix ./bin/kc.sh

RUN chmod +x ./bin/kc.sh

EXPOSE 8080

ENTRYPOINT [ "./bin/kc.sh", "start" ]