import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from './auth_controller';
import { validateRequest } from './middlewares';
import { authMiddlewareFactory } from '../../infrastructure/auth/auth_middleware';
import { IAuthRepository } from '../../domain/auth/repositories';
import { IUserRepository } from '../../domain/auth/repositories';

export const createAuthRouter = (
  authController: AuthController,
  authRepository: IAuthRepository,
  userRepository: IUserRepository
): Router => {
  const router = Router();
  const { authenticate } = authMiddlewareFactory(authRepository, userRepository);

  // Register a new user
  router.post(
    '/register',
    [
      body('email').isEmail().withMessage('Email must be valid'),
      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters'),
      body('firstName').notEmpty().withMessage('First name is required'),
      body('lastName').notEmpty().withMessage('Last name is required'),
      validateRequest,
    ],
    authController.register
  );

  // Login user
  router.post(
    '/login',
    [
      body('email').isEmail().withMessage('Email must be valid'),
      body('password').notEmpty().withMessage('Password is required'),
      validateRequest,
    ],
    authController.login
  );

  // Get current user
  router.get('/me', authenticate, authController.me);

  return router;
};
