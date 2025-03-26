# Doqett Compliance Platform Architecture

## Overview

The Doqett Compliance Platform follows a domain-driven design approach with a clean architecture pattern. The system is designed to be modular, testable, and maintainable, with clear separation of concerns.

## Architectural Layers

The backend is structured into the following layers:

### 1. Domain Layer

The core business logic and domain models live here. This layer is independent of any external frameworks or services.

- **Models**: Core business entities and value objects
- **Repositories**: Interfaces that define data access patterns
- **Services**: Domain services for complex operations spanning multiple entities
- **Common**: Shared components like Result and Entity base classes

### 2. Application Layer

This layer orchestrates the flow of data between the domain layer and the outside world.

- **Use Cases**: Application-specific business logic
- **DTOs**: Data Transfer Objects for input/output
- **Commands/Queries**: Command and Query objects following CQRS

### 3. Infrastructure Layer

External concerns and implementation details:

- **Database**: Database connection, schema definitions, and repository implementations
- **Auth**: Authentication and authorization logic
- **Monitoring**: Metrics, logging, and error tracking
- **Services**: External service implementations

### 4. Interfaces Layer

The entry points to the application:

- **Controllers**: HTTP request handlers
- **Routes**: Express.js route definitions
- **Validators**: Request validation logic

## Domain-Driven Design Patterns

The codebase implements several DDD patterns:

- **Entity**: Objects with identity (Framework, Control, Evidence)
- **Value Object**: Immutable objects defined by their attributes (FrameworkName, ControlCode)
- **Repository**: Data access abstractions (FrameworkRepository, ControlRepository)
- **Domain Service**: Services dealing with domain concerns (ComplianceService)
- **Application Service**: Use cases orchestrating domain operations

## Directory Structure

```
backend/
├── src/
│   ├── domain/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── common/
│   │
│   ├── application/
│   │   ├── usecases/
│   │   ├── dto/
│   │   ├── commands/
│   │   └── queries/
│   │
│   ├── infrastructure/
│   │   ├── database/
│   │   ├── repositories/
│   │   ├── auth/
│   │   ├── monitoring/
│   │   ├── services/
│   │   └── middlewares/
│   │
│   ├── interfaces/
│   │   ├── controllers/
│   │   └── routes/
│   │
│   ├── __tests__/
│   │   ├── unit/
│   │   └── integration/
│   │
│   └── server.ts
│
├── Dockerfile
├── Dockerfile.test
├── package.json
└── tsconfig.json
```

## Workflow Patterns

### Creating a New Feature

1. **Define Domain Model**: Start by defining the domain entities, value objects, and relationships in the domain layer.
2. **Define Repository Interface**: Create the repository interface in the domain layer.
3. **Implement Use Cases**: Create use cases in the application layer.
4. **Implement Repository**: Create the repository implementation in the infrastructure layer.
5. **Create Controllers**: Create controllers in the interfaces layer that use the use cases.
6. **Define Routes**: Create routes that map to controller methods.
7. **Write Tests**: Write unit tests for the domain models and use cases, and integration tests for the API endpoints.

### Example: Adding a New Entity

Let's say we want to add a "Policy" entity:

1. Create `domain/models/policy.ts` with the Policy entity and related value objects.
2. Add `IPolicyRepository` interface to `domain/repositories/`.
3. Create use cases in `application/usecases/` like `CreatePolicyUseCase`.
4. Implement `MongoPolicyRepository` in `infrastructure/repositories/`.
5. Create `PolicyController` in `interfaces/controllers/`.
6. Define routes in `interfaces/routes/policyRoutes.ts`.
7. Add tests in `__tests__/unit/domain/models/Policy.test.ts`.

## Working with Docker

The project is set up to run in Docker containers for development, testing, and production.

### Development

```bash
docker-compose up
```

This starts the frontend, backend, MongoDB, Redis, Prometheus, and Grafana services.

### Running Tests

```bash
./run-tests.sh
```

This runs the backend tests in a Docker container.

### Production

For production deployment, a separate docker-compose.prod.yml file should be created with appropriate settings.

## Continuous Integration

The CI pipeline should:

1. Build the Docker images
2. Run the tests
3. Deploy to staging/production if tests pass

## Monitoring and Observability

The platform includes:

- **Prometheus**: For metrics collection
- **Grafana**: For visualization and alerting
- **Sentry**: For error tracking and performance monitoring

## Security Considerations

- JWT-based authentication
- Role-based access control
- Input validation using express-validator
- Proper error handling and logging
- MongoDB connection security best practices
