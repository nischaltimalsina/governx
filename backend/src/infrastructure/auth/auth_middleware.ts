import { Request, Response, NextFunction } from 'express';
import { IAuthRepository } from '../../domain/auth/repositories';
import { IUserRepository } from '../../domain/auth/repositories';
import { UserRole } from '../../domain/auth/entities';

// Extending Express Request type to include user and token
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRoles?: UserRole[];
      token?: string;
    }
  }
}

/**
 * Authentication middleware factory
 */
export const authMiddlewareFactory = (
  authRepository: IAuthRepository,
  userRepository: IUserRepository
) => {
  /**
   * Middleware to authenticate requests using JWT
   */
  const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: 'No authentication token provided',
        });
        return;
      }

      const token = authHeader.split(' ')[1];

      // Verify token
      const verifyResult = await authRepository.verifyToken(token);

      if (!verifyResult.isSuccess) {
        res.status(401).json({
          success: false,
          message: 'Invalid authentication token',
        });
        return;
      }

      const { userId } = verifyResult.getValue();

      // Find user by ID
      const userResult = await userRepository.findById(userId);

      if (!userResult.isSuccess || !userResult.getValue()) {
        res.status(401).json({
          success: false,
          message: 'User not found or authentication failed',
        });
        return;
      }

      const user = userResult.getValue();

      // Check if user is active
      if (!user?.isActive) {
        res.status(403).json({
          success: false,
          message: 'User account is inactive',
        });
        return;
      }

      // Attach user ID, roles, and token to request object
      req.userId = user.id;
      req.userRoles = user.roles;
      req.token = token;

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication failed',
      });
    }
  };

  /**
   * Middleware to restrict access based on user roles
   */
  const authorize = (allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Check if user has been authenticated
      if (!req.userId || !req.userRoles) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Check if user has any of the allowed roles
      const hasAllowedRole = req.userRoles.some(role =>
        allowedRoles.includes(role)
      );

      if (!hasAllowedRole) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
        return;
      }

      next();
    };
  };

  return {
    authenticate,
    authorize,
  };
};
