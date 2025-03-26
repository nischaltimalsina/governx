import { Request, Response, NextFunction, Application } from 'express';
import mongoose from 'mongoose';

// Custom error classes for different types of errors
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class InternalServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InternalServerError';
  }
}

// Error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  // Handle different types of errors
  if (err instanceof NotFoundError) {
    res.status(404).json({
      success: false,
      message: err.message
    });
    return;
  }

  if (err instanceof ValidationError || err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      success: false,
      message: err.message
    });
    return;
  }

  if (err instanceof AuthorizationError) {
    res.status(403).json({
      success: false,
      message: err.message
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
    return;
  }

  // Default to 500 internal server error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message
  });
};

// Not found middleware for undefined routes
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
};

// Setup all error handlers in Express app
export const setupErrorHandlers = (app: Application): void => {
  // The not found handler must be after all other routes
  app.use('*', notFoundHandler);

  // The error handler must be the last middleware
  app.use(errorHandler);
};
