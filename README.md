# 🛡️ TrackNest

## 🌟 Overview

**TrackNest** is a microservices-based real-time kidnapping prevention system. The system empowers users with real-time location tracking, anomaly detection, crime information management, and emergency response coordination—all accessible via a dedicated mobile app. Designed for scalability, security, and interoperability, TrackNest is suitable for smart city safety initiatives, community protection, and emergency response management.

## 🧩 Architecture

TrackNest is composed of multiple microservices and infrastructure components, each optimized for reliability and performance:

- **Location Tracking Service**
  - Technology: Python, TensorFlow, FastAPI
  - Database: PostgreSQL + PostGIS (geospatial queries)
  - Storage: MinIO
  - Functionality: Tracks user locations, detects mobility anomalies, manages tracking sessions, and provides geospatial analytics.

- **Criminal Information Service**
  - Technology: Java, Spring Boot
  - Database: PostgreSQL
  - Storage: MinIO
  - Functionality: Stores, updates, and publishes criminal incident data for authorized users and writers, supports advanced search and analytics.

- **Identity and Access Management (IAM)**
  - Technology: Keycloak
  - Functionality: Centralized authentication and authorization with OAuth2, user management, secure API access, and role-based controls.

- **Mobile Application**
  - Technology: React Native
  - Functionality: User interface for all features, including location tracking, crime alerts, emergency requests, and secure access.

- **API Gateway**
  - Technology: Apache APISIX
  - Functionality: Secures, manages, and routes API traffic between clients and microservices, supports rate-limiting, authentication, and monitoring.

- **Event Streaming**
  - Technology: Apache Kafka
  - Functionality: Facilitates real-time data streaming, inter-service communication, event-driven workflows, and scalability.

- **Containerization & Orchestration**
  - Technology: Docker, Kubernetes (K8s)
  - Functionality: Containerizes microservices for consistent deployment, manages scaling, rolling updates, and service discovery.

## ✨ Features

- Real-time detection of user anomalies and dangerous areas
- Emergency request and response workflow
- Crime information publishing, searching, and management
- Scalable user, writer, admin, and emergency service roles
- Secure authentication and role-based access via Keycloak IAM
- Mobile app for convenient access and notifications
- API gateway for secure, scalable communication
- Real-time event streaming and processing with Apache Kafka
- Cloud-native deployment with Docker and Kubernetes

## 🛠️ Technologies

| Component                    | Tech Stack                                  |
|------------------------------|---------------------------------------------|
| Location Tracking Service    | Python, TensorFlow, FastAPI, PostgreSQL + PostGIS, MinIO |
| Criminal Information Service | Java, Spring Boot, PostgreSQL, MinIO        |
| IAM                         | Keycloak                                    |
| API Gateway                 | Apache APISIX                               |
| Event Streaming             | Apache Kafka                                |
| Mobile App                  | React Native                                |
| Deployment & Orchestration  | Docker, Kubernetes                          |

## 🚦 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   ```
2. **Install dependencies for each microservice**  
   *(See each service's README for details.)*
3. **Set up Keycloak for IAM**
4. **Configure PostgreSQL + PostGIS and MinIO**
5. **Set up Apache Kafka for event streaming**
6. **Deploy microservices using Docker and Kubernetes**
7. **Configure Apache APISIX for API gateway management**
8. **Build and install the mobile app using React Native on your device**
9. **Sign up and start using TrackNest!**

## 📱 Mobile App Features

- Secure login and registration
- Real-time location sharing and tracking
- Receive crime and danger alerts
- Emergency request button
- View and search nearby crime information
- Manage personal account and notification settings

## 🧑‍🤝‍🧑 System Roles

- **User**: Main app user; can authenticate, receive alerts, track location, request emergency help
- **Writer**: Authorized to create, update, or delete criminal information
- **Emergency Service**: Receives emergency requests, coordinates rapid response
- **Admin**: Manages users, monitors system
- **Identity Provider**: Handles authentication and identity management

## 🖼️ Documentation

- See the [diagrams](https://drive.google.com/file/d/1QvLAFJZOpmkjzOIqNoP01gEp86QR5JBV/view?usp=sharing) for a visual representation of the system
- See the [report](https://www.overleaf.com/read/tbvhpdqvcfqh#b59cf0) for a detailed explanation of the system architecture, design decisions, implementation, and evaluation results

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/xyz`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📜 License

[MIT](LICENSE)

## 📬 Contact

For questions or support, please contact [nguyenvu04.work@gmail.com].

---
