import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware to validate request data using express-validator
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
      })),
    });
    return;
  }

  next();
};

/**
 * Middleware to handle errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Error handling middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
