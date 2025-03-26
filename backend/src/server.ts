import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { database } from './infrastructure/database';
import { errorHandler } from './interfaces/api/middlewares';

// Import repositories
import { AuthRepository } from './infrastructure/repositories/auth_repository';
import { MongoUserRepository } from './infrastructure/repositories/user_repository';

// Import domain services
import { AuthService } from './domain/auth/services';

// Import use cases
import { RegisterUserUseCase } from './application/auth/register_user';
import { LoginUserUseCase } from './application/auth/login_user';
import { ValidateTokenUseCase } from './application/auth/validate_token';

// Import controllers and routes
import { AuthController } from './interfaces/api/auth_controller';
import { createAuthRouter } from './interfaces/api/auth_routes';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 4000;

// Configure middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Initialize repositories
const userRepository = new MongoUserRepository();
const authRepository = new AuthRepository(
  process.env.JWT_SECRET || 'your_jwt_secret_here'
);

// Initialize domain services
const authService = new AuthService(userRepository, authRepository);

// Initialize use cases
const registerUserUseCase = new RegisterUserUseCase(authService);
const loginUserUseCase = new LoginUserUseCase(authService);
const validateTokenUseCase = new ValidateTokenUseCase(authService);

// Initialize controllers
const authController = new AuthController(
  registerUserUseCase,
  loginUserUseCase,
  validateTokenUseCase
);

// Configure routes
app.use('/api/auth', createAuthRouter(authController, authRepository, userRepository));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Start the server
const startServer = async () => {
  try {
    // Connect to database
    const dbResult = await database.connect();

    if (!dbResult.isSuccess) {
      console.error('Failed to connect to database:', dbResult.getError().message);
      process.exit(1);
    }

    // Start HTTP server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Gracefully shutting down');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Gracefully shutting down');
  await database.disconnect();
  process.exit(0);
});

// Start the server
startServer();
