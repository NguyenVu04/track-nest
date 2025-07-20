# GuardianTrack

## Overview

This project is an AI-driven microservice system designed to enhance personal safety and aid in the prevention and response to abduction scenarios. The system provides real-time alerts and actionable information to both users and their designated guardians by leveraging intelligent analysis of user mobility, location data, and crime statistics.

## Key Features

- **Abnormal Mobility Alerts:**  
  Detects abnormal movement patterns using AI and notifies the guardian. If abduction is suspected, the guardian can share the user’s live location with law enforcement.

- **Crime Density Warnings:**  
  Monitors the user's location and sends alerts to both the user and guardian when entering areas with high crime density.

- **Crime Information Service:**  
  Stores and provides up-to-date information about crimes in nearby areas, empowering users to make safer decisions.

## Microservice Architecture

The system is composed of the following microservices:

1. **Identity and Access Management (IAM):**  
   - Handles authentication, authorization, and user management for secure access.

2. **Abnormal Mobility Alert Service:**  
   - Leverages AI to monitor and analyze user mobility.
   - Sends real-time notifications to guardians and provides location sharing capabilities with the police.

3. **Crime Information Service:**  
   - Aggregates, stores, and serves crime data based on location.
   - Issues alerts when users enter high-risk areas.

## Workflow

1. **User Registration & Guardian Assignment:**  
   Users register via the IAM service and assign one or more guardians.

2. **Mobility Monitoring:**  
   The system continuously analyzes user mobility for anomalies. Upon detection, it alerts the guardian, who can then share the location with authorities.

3. **Crime Density Monitoring:**  
   User location is cross-referenced with crime data. If a high-risk area is entered, both user and guardian are notified.

4. **Crime Data Access:**  
   Users can query the system for crime statistics in their vicinity.

## Technologies Used

- AI/ML models for mobility anomaly detection
- Microservices (REST/gRPC)
- Secure authentication and authorization (IAM)
- Real-time messaging/notification system
- Geolocation and mapping APIs
- Crime data aggregation (public APIs, databases)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/<owner>/<repo>.git
   cd <repo>
   ```

2. **Set Up Dependencies**  
   Install required dependencies for each microservice as described in their respective folders.

3. **Configure Environment**  
   Set environment variables for database connections, API keys, and IAM credentials.

4. **Run Microservices**  
   Start each service as per instructions in their documentation.

5. **Register Users and Guardians**  
   Use the IAM service’s API/UI to onboard users and assign guardians.

## API Documentation

Each microservice exposes its own API. See the `/docs` folder or visit the API reference for details on endpoints, authentication, and usage.

## Contributing

Contributions are welcome! Please submit issues or pull requests via GitHub.

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please contact [support@example.com].
