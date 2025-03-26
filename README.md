# Doqett Compliance Platform

A Governance, Risk, and Compliance (GRC) management platform designed to automate compliance tracking, manage risks efficiently, and ensure regulatory adherence.

## Project Structure

```
doqett-compliance/
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       └── server.ts
└── monitoring/
    ├── prometheus/
    │   └── prometheus.yml
    └── grafana/
        └── provisioning/
```

## Technology Stack

- **Frontend**: Next.js (React, TypeScript)
- **Backend**: Express.js (TypeScript)
- **Database**: MongoDB
- **Authentication**: OAuth2.0 / JWT
- **Queue Processing**: Redis
- **Monitoring**: Prometheus, Grafana
- **Error Tracking**: Sentry
- **Containerization**: Docker, Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your machine
- Git

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-org/doqett-compliance.git
cd doqett-compliance
```

2. Create necessary directories:

```bash
mkdir -p frontend/src backend/src monitoring/prometheus monitoring/grafana/provisioning
```

3. Create the necessary configuration files as specified in this repository.

4. Start the development environment:

```bash
docker-compose up
```

This will start all the services defined in the `docker-compose.yml` file.

### Access the Applications

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- MongoDB: mongodb://localhost:27017
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

## Domain Model

The Doqett Compliance Platform is built around several core domains:

1. **Compliance Management Domain**
   - Framework Management
   - Evidence Collection & Management
   - Control Implementation
   - Policy Management
   - Audit Management

2. **Risk Management Domain**
   - Risk Assessment
   - Risk Treatment
   - Risk Monitoring
   - Risk Reporting

3. **Integration & Data Collection Domain**
   - Security Tool Integration
   - Cloud Security Integration
   - ITSM & Ticketing Integration
   - Document Management

4. **Reporting & Analytics Domain**
   - Dashboards
   - Reporting Engine
   - Analytics & Insights
   - Metrics & KPIs

5. **User & Access Management Domain**
   - Authentication
   - Authorization & Access Control
   - User Management
   - Audit Trail

## Development Workflow

### Domain-Driven Development

The codebase follows a domain-driven design approach:

- `domain`: Contains the core business logic, entities, and interfaces
- `application`: Contains application services, use cases, and commands/queries
- `infrastructure`: Contains implementations of repositories, external services, and framework-specific code

### Testing

Run tests for the backend:

```bash
docker-compose exec backend npm test
```

Run tests for the frontend:

```bash
docker-compose exec frontend npm test
```

## Monitoring and Observability

The platform includes a comprehensive monitoring solution:

- **Prometheus**: For metrics collection
- **Grafana**: For visualization and alerting
- **Sentry**: For error tracking and performance monitoring

## Implementation Phases

The project is being implemented in phases:

1. **Phase 1**: Core Compliance Foundation
2. **Phase 2**: Risk Management & Integration
3. **Phase 3**: Advanced Analytics & Automation
4. **Phase 4**: Enterprise Scaling & Optimization

## Contributing

Please read the CONTRIBUTING.md file for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the [LICENSE] - see the LICENSE file for details.
