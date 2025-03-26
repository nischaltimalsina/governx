import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ success: false, message: 'Authorization header missing' });
      return;
    }

    // Extract the token from the Bearer scheme
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ success: false, message: 'Invalid authorization format' });
      return;
    }

    const token = parts[1];

    // Verify and decode the token
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_here';

    const decoded = jwt.verify(token, jwtSecret) as {
      id: string;
      email: string;
      role: string;
    };

    // Add the user info to the request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    // Continue processing the request
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, message: 'Invalid token' });
      return;
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

// For development/testing, this middleware can be used to bypass authentication
export const devAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Set a fake user for development purposes
  req.user = {
    id: 'dev-user-id',
    email: 'dev@example.com',
    role: 'admin'
  };

  next();
};
