# TrackNest - Agent System Documentation

## Project Overview

TrackNest is a sophisticated, microservices-based real-time abduction prevention system designed for smart city safety initiatives. It's an event-driven architecture system that provides comprehensive location tracking, anomaly detection, and emergency response capabilities.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        TrackNest System                        │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Frontend      │   Backend       │        Infrastructure      │
│                 │   Services      │                             │
├─────────────────┼─────────────────┼─────────────────────────────┤
│ • Web App       │ • User Tracking │ • PostgreSQL + PostGIS     │
│   (Next.js)     │ • Emergency Ops │ • TimescaleDB               │
│ • Mobile App    │ • Criminal      │ • Apache Kafka Cluster     │
│   (React Native)│   Reports       │ • Keycloak (Auth)           │
│ • Keycloak UI   │                 │ • Redis Cache               │
│                 │                 │ • MinIO Storage             │
│                 │                 │ • Envoy Proxy + NGINX       │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

## Tech Stack

### Backend Services (Java Spring Boot)

#### 1. User Tracking Service

- **Location**: `service/user-tracking/`
- **Tech Stack**: Java 25, Spring Boot 3.5.6, gRPC, Spring GRPC 0.12.0
- **Database**: PostgreSQL with PostGIS and TimescaleDB
- **Purpose**: Real-time user tracking, anomaly detection, vector-based mobility analysis
- **Key Features**:
  - Real-time location tracking with spatial data
  - Firebase push notifications
  - Time-series optimization for tracking data
  - gRPC services for real-time communication
  - Anomaly detection algorithms

#### 2. Emergency Operations Service

- **Location**: `service/emergency-ops/`
- **Tech Stack**: Java 25, Spring Boot 3.5.6, Spring WebSocket, Quartz Scheduler
- **Database**: PostgreSQL with PostGIS
- **Purpose**: Emergency request management, safe location coordination
- **Key Features**:
  - Real-time emergency response coordination
  - Safe zone management with spatial queries
  - WebSocket support for real-time communication
  - Automated emergency workflows
  - Emergency responder dispatch

#### 3. Criminal Reports Service

- **Location**: `service/criminal-reports/`
- **Tech Stack**: Java 25, Spring Boot 3.5.6, MinIO integration
- **Database**: PostgreSQL with spatial extensions
- **Purpose**: Crime and missing person reports management
- **Key Features**:
  - Crime data management with spatial indexing
  - Missing person report workflows
  - File storage with MinIO integration
  - Advanced search and analytics capabilities

### Frontend Applications

#### 1. Web Application

- **Location**: `frontend/track-nest-web/`
- **Tech Stack**: Next.js 16.2.2, React 19.2.0, TypeScript 5, TailwindCSS 4
- **Key Dependencies**:
  - **UI Framework**: Radix UI ecosystem for components
  - **Maps**: Leaflet and React-Leaflet for interactive mapping
  - **Charts**: Recharts for data visualization
  - **Forms**: React Hook Form for form management
  - **Animations**: Framer Motion for smooth transitions
  - **HTTP Client**: Axios for API communication

#### 2. Mobile Application

- **Location**: `frontend/TrackNest/`
- **Tech Stack**: React Native (Expo 54), TypeScript, Expo Router
- **Key Features**:
  - Cross-platform mobile app (iOS/Android)
  - Real-time location tracking
  - Voice-activated SOS (Expo Speech Recognition)
  - Push notifications (Expo Notifications)
  - Background location tracking
  - gRPC-Web client integration
- **Key Dependencies**:
  - **Maps**: React Native Maps
  - **Location**: Expo Location
  - **Networking**: gRPC-Web, Axios
  - **Navigation**: React Navigation, Expo Router

#### 3. Keycloak Theme

- **Location**: `keycloak/keycloak-theme/`
- **Tech Stack**: React 18, Keycloakify 11.15.0, Vite 5
- **Purpose**: Custom authentication UI for Keycloak identity provider

## Database Architecture

### Database Services

```yaml
Services:
  - user_tracking_postgres: port 15432
  - emergency_ops_postgres: port 25432
  - criminal_reports_postgres: port 35432
  - keycloak_postgres: port 5432
```

### Database Features

#### PostgreSQL with Extensions

- **PostGIS**: Spatial data support for location tracking
- **TimescaleDB**: Time-series optimization for tracking data
- **UUID**: UUID-based primary keys throughout
- **Spatial Indexing**: All location data uses PostGIS geometry columns

#### Storage Strategy

- **Relational Data**: PostgreSQL for structured data
- **Spatial Data**: PostGIS for geospatial operations and queries
- **Time-series Data**: TimescaleDB hypertables for location tracking
- **Object Storage**: MinIO for files, media, and documents

## Data Flow Architecture

### 1. Real-time Tracking Flow

```
Mobile/Web Client
    ↓ (gRPC/WebSocket)
User Tracking Service
    ↓ (Kafka Events)
Emergency Ops Service
    ↓ (Database)
PostgreSQL + TimescaleDB
    ↓ (Real-time Updates)
Dashboard/Monitoring
```

### 2. Emergency Response Flow

```
Emergency Trigger
    ↓ (API Call)
Emergency Ops Service
    ↓ (Spatial Query)
Safe Zone Calculation
    ↓ (Notification)
Push Notification Service
    ↓ (WebSocket)
Real-time Dashboard Updates
```

### 3. Event-Driven Architecture

```
Service Events → Kafka Topics → Service Consumers
    ↓                ↓               ↓
Location Updates   Emergency      Crime Reports
    ↓             Alerts             ↓
Database Store      ↓          Database Store
    ↓         Real-time Alerts       ↓
Analytics           ↓          Search Index
                Dashboard
```

## Infrastructure Components

### Message Broker

- **Apache Kafka**: 3-controller, 3-broker cluster for high availability
- **External Ports**: 29092, 39092, 49092
- **Purpose**: Event-driven communication between microservices
- **Topics**: Location updates, emergency events, crime reports

### API Gateway & Proxy

- **Envoy Proxy**: gRPC-Web gateway on port 8800
  - JWT authentication
  - gRPC-Web protocol translation
  - Service routing and load balancing
- **NGINX**: HTTP reverse proxy on port 80
  - Static file serving
  - CORS handling
  - SSL termination (production)

### Identity & Access Management

- **Keycloak**: Identity provider on port 8080 (/auth)
- **Realms**:
  - `public-dev`: Public user access
  - `restricted-dev`: Administrative access
- **Integration**: JWT-based authentication across all services
- **Features**: OAuth2/OIDC, role-based access control

### Caching & Storage

- **Redis**: Port 6379 for application caching
  - Session storage
  - Temporary data caching
  - Rate limiting data
- **MinIO**: Object storage on ports 9000/9001
  - File uploads
  - Document storage
  - Image and media assets

## Communication Protocols

### gRPC Services

- **Protocol Buffers**:
  - `tracker.proto`: Location tracking
  - `trackingmanager.proto`: Tracking management
  - `notifier.proto`: Notification services
- **Code Generation**: Java and TypeScript/JavaScript clients
- **Features**: Real-time bidirectional communication, type safety

### REST APIs

- **Spring Boot REST Controllers**:
  - User Tracking: TrackerController, TrackingManagerController
  - Emergency Ops: EmergencyRequestController, SafeZoneController
  - Criminal Reports: ReportManagerController, CrimeLocatorController

### WebSocket Communication

- **Real-time Features**:
  - Live location updates
  - Emergency alerts
  - System notifications
  - Dashboard real-time data

## Security Implementation

### Authentication & Authorization

- **Keycloak Integration**: Centralized identity management
- **JWT Tokens**: Stateless authentication across services
- **Role-Based Access Control**: Granular permissions
- **API Security**: JWT validation in Envoy proxy

### Network Security

- **Container Isolation**: Docker network segmentation
- **Service Mesh**: Envoy proxy for secure service communication
- **Database Access**: Service-specific database instances
- **Secrets Management**: Environment-based configuration

## Development & Deployment

### Build Tools

- **Backend**: Gradle with Java 25
- **Frontend Web**: npm with Next.js and TypeScript
- **Frontend Mobile**: npm with Expo and React Native
- **Containerization**: Docker with multi-stage builds

### Testing Strategy

- **Backend Testing**:
  - JUnit 5 for unit tests
  - Spring Boot Test for integration tests
  - Mockito for mocking dependencies
- **Frontend Testing**:
  - Jest for unit testing
  - React Testing Library for component testing

### Container Orchestration

- **Docker Compose**: Multi-service orchestration
- **Main Configuration**: `docker-compose/docker-compose.yaml`
- **Service Dependencies**: Automated startup order
- **Health Checks**: Spring Actuator endpoints

## Monitoring & Observability

### Health Monitoring

- **Spring Actuator**: Health and metrics endpoints
- **Database Health**: Connection monitoring
- **Service Discovery**: Health check integration

### Performance Monitoring

- **Application Metrics**: JVM metrics, request latency
- **Database Metrics**: Query performance, connection pools
- **System Metrics**: Resource utilization

## Scalability Features

### Horizontal Scaling

- **Microservices**: Independent scaling per service
- **Database**: Separate instances with replication capabilities
- **Message Queue**: Kafka cluster for high throughput
- **Load Balancing**: Envoy proxy and NGINX

### Performance Optimization

- **Caching**: Redis for frequently accessed data
- **Time-series**: TimescaleDB for efficient time-based queries
- **Spatial Indexing**: PostGIS for fast geospatial operations
- **Connection Pooling**: Optimized database connections

## Key Configuration Files

### Entry Points

- **Backend Services**: `*Application.java` files in each service directory
- **Web Application**: `frontend/track-nest-web/app/page.tsx`
- **Mobile Application**: `frontend/TrackNest/app.json`

### Infrastructure Configuration

- **Docker Orchestration**: `docker-compose/docker-compose.yaml`
- **Envoy Configuration**: `docker-compose/envoy/envoy.yaml`
- **NGINX Configuration**: `docker-compose/nginx/nginx.conf`
- **Keycloak Setup**: `keycloak/` directory structure

## Production Readiness

### Enterprise Features

- **High Availability**: Multi-instance deployments
- **Data Backup**: Database replication and backup strategies
- **Disaster Recovery**: Multi-zone deployment capabilities
- **Security Compliance**: Industry-standard security practices

### Operational Features

- **Logging**: Centralized logging with structured formats
- **Monitoring**: Health checks and performance metrics
- **Deployment**: Blue-green deployment support
- **Configuration Management**: Environment-based configuration

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Java 25 JDK
- Node.js and npm
- Git

### Quick Start

1. Clone the repository
2. Run `docker-compose up` from the `docker-compose/` directory
3. Access the web application at `http://localhost:80`
4. Access Keycloak admin at `http://localhost:8080/auth`

### Service Ports

- **Web Application**: http://localhost:80
- **Keycloak**: http://localhost:8080/auth
- **gRPC Gateway**: http://localhost:8800
- **Database Ports**: 5432, 15432, 25432, 35432
- **Kafka Brokers**: 29092, 39092, 49092
- **Redis**: 6379
- **MinIO**: 9000 (API), 9001 (Console)

This documentation provides a comprehensive overview of the TrackNest system architecture, designed for developers, system administrators, and stakeholders who need to understand the system's technical implementation and operational characteristics.
