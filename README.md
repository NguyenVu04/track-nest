# TrackNest

TrackNest is an event-driven, microservices-based real-time abduction-prevention and emergency-response platform. It provides continuous location tracking, AI-assisted crime/missing-person report management, and coordinated emergency operations — accessible via a mobile app and web interface.

[![CI – Test & Quality Gate](https://github.com/NguyenVu04/track-nest/actions/workflows/test.yaml/badge.svg)](https://github.com/NguyenVu04/track-nest/actions/workflows/test.yaml)
[![Deploy](https://github.com/NguyenVu04/track-nest/actions/workflows/deploy.yaml/badge.svg)](https://github.com/NguyenVu04/track-nest/actions/workflows/deploy.yaml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=NguyenVu04_track-nest&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=NguyenVu04_track-nest)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=NguyenVu04_track-nest&metric=coverage)](https://sonarcloud.io/summary/new_code?id=NguyenVu04_track-nest)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=NguyenVu04_track-nest&metric=bugs)](https://sonarcloud.io/summary/new_code?id=NguyenVu04_track-nest)

## Table of Contents

- [Features](#features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Repository Layout](#repository-layout)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [License](#license)
- [Documentation](#documentation)

---

## Features

- **Real-Time Location Tracking**: Continuous gRPC-based location streaming with Quartz-scheduled durable jobs and H3 hexagonal spatial indexing.
- **Crime & Missing Person Reports**: Full lifecycle management with AI-generated summaries (Google Gemini), rich-text content, geo queries, and MinIO/Spaces media storage.
- **Emergency Response Coordination**: Request lifecycle management, safe location guidance, and real-time WebSocket updates.
- **Push Notifications**: Firebase Admin SDK integration for mobile push delivery.
- **Role-Based Access**: Keycloak-backed IAM with separate realms for end users and privileged actors.

---

## System Architecture

TrackNest uses a microservices architecture with Nginx as the HTTP gateway, Envoy as the gRPC-Web bridge, and Kafka for asynchronous event propagation.

**Ingress / Edge**

| Component | Role | Port |
|---|---|---|
| Nginx | HTTP reverse proxy — routes `/auth` → Keycloak, `/` → Next.js web | 80 |
| Envoy | gRPC-Web bridge for mobile; also proxies HTTP services | 8800 |

**Backend Services**

| Service | Runtime | Responsibilities | Key Dependencies |
|---|---|---|---|
| `user-tracking` | Spring Boot (Java 25) | Real-time location streaming (gRPC + HTTP), push notifications, durable scheduled jobs | TimescaleDB, Quartz, Firebase Admin, Kafka, Uber H3 |
| `emergency-ops` | Spring Boot (Java 25) | Emergency request lifecycle, safe location management | Postgres, Keycloak Admin Client, WebSocket, Kafka, Quartz |
| `criminal-reports` | Spring Boot (Java 25) | Crime/missing-person report CRUD, AI summaries, geo queries, media upload | Postgres (PostGIS/JTS), MinIO/Spaces, Kafka, Redis, Spring AI (Gemini) |

**Frontends**

| App | Stack |
|---|---|
| Web | Next.js 16 + React 19 + Tailwind v4 + shadcn/Radix + Leaflet, deployed on Vercel |
| Mobile (Android) | Expo React Native — gRPC-Web via Envoy |

**Data Stores**

| Store | Usage | Prod Backend |
|---|---|---|
| Postgres / TimescaleDB | Per-service relational + spatial data | Neon |
| Redis | Distributed locks, caching | Upstash |
| MinIO / Spaces | Object storage for report media | DigitalOcean Spaces |

**Identity**

Keycloak with two realms: `public-dev` (end users) and `restricted-dev` (privileged actors / emergency services).

---

## Technology Stack

| Layer | Technology |
|---|---|
| HTTP Gateway | Nginx |
| gRPC-Web Gateway | Envoy |
| Message Broker | Apache Kafka (KRaft — local; Aiven SASL/SSL — prod) |
| User Tracking | Spring Boot, Java 25, gRPC (spring-grpc + protobuf), Quartz, Firebase Admin, Uber H3 |
| Emergency Ops | Spring Boot, Java 25, WebSocket, Quartz, Keycloak Admin Client |
| Criminal Reports | Spring Boot, Java 25, JTS / hibernate-spatial, Spring AI (Google Gemini) |
| Databases | TimescaleDB / Neon Postgres, Redis (Upstash) |
| Object Storage | MinIO (local), DigitalOcean Spaces (prod) |
| IAM | Keycloak |
| Web Frontend | Next.js 16, React 19, Tailwind v4, shadcn/Radix, Leaflet |
| Mobile | Expo React Native (Android), gRPC-Web, buf |
| CI/CD | GitHub Actions, SonarCloud, Docker Hub |
| Deployment | Docker Compose (local/prod), Kubernetes + Helm (DigitalOcean K8s) |

---

## Repository Layout

```
track-nest/
├── service/
│   ├── criminal-reports/   # Spring Boot — crime/missing-person reports + AI summaries
│   ├── emergency-ops/      # Spring Boot — emergency request lifecycle
│   └── user-tracking/      # Spring Boot — real-time tracking + gRPC
├── frontend/
│   ├── track-nest-web/     # Next.js 16 web app (deployed to Vercel)
│   ├── TrackNest/          # Expo React Native mobile app (Android)
│   └── proto/              # Protobuf source of truth (tracker, trackingmanager, notifier)
├── database/               # Per-service Postgres init/seed SQL scripts
├── docker-compose/         # Dev and prod Docker Compose stacks + Envoy/Nginx config
├── keycloak/               # Realm import JSON + custom Dockerfile
├── helm/                   # Helm chart for DigitalOcean K8s deployment
├── test/                   # k6 load testing scripts
└── certs/                  # TLS material for local Kafka dev
```

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose

### Local Development Stack

```bash
cd docker-compose
docker compose -f docker-compose.yaml up --build
```

This starts the full local stack: Kafka (KRaft 3 controllers + 3 brokers), Postgres/TimescaleDB (per service), Redis, MinIO, Keycloak, Nginx, and Envoy.

### Running Individual Services

**Spring Boot services** (`criminal-reports`, `emergency-ops`, `user-tracking`):
```bash
cd service/<service-name>
./gradlew bootRun
./gradlew test
```

**Web frontend**:
```bash
cd frontend/track-nest-web
npm install
npm run dev        # http://localhost:3000
```

**Mobile app**:
```bash
cd frontend/TrackNest
npm install
npx expo start
```

### Production Deployment (DigitalOcean K8s)

Docker images are built and pushed to Docker Hub, then deployed via Helm to DigitalOcean Kubernetes through the `deploy` branch CI pipeline.

```bash
# Manual Helm deploy (requires kubeconfig for the DigitalOcean cluster)
helm upgrade --install tracknest ./helm \
  -f helm/values-secrets.yaml \
  -n tracknest --create-namespace \
  --atomic --timeout 5m
```

---

## Contributing

Contributions are welcome. Please open an issue or pull request for new features, bug fixes, or suggestions.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Documentation

- [Use Case Diagram](docs/TrackNest-usecase.png)
- [Architecture Diagrams](https://drive.google.com/file/d/1QvLAFJZOpmkjzOIqNoP01gEb86QR5JBV/view?usp=sharing)
- [Technical Report](https://www.overleaf.com/read/tbvhpdqvcfqh#b59cf0)
