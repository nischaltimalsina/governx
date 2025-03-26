import express from 'express';
import { body, param, query } from 'express-validator';
import { FrameworkController } from '../controllers/FrameworkController';
import { authMiddleware } from '@/infrastructure/middlewares/authMiddleware';

export const frameworkRouter = (frameworkController: FrameworkController) => {
  const router = express.Router();

  // Apply authentication middleware to all routes
  router.use(authMiddleware);

  // Create new framework
  router.post(
    '/',
    [
      body('name').notEmpty().withMessage('Framework name is required'),
      body('version').notEmpty().withMessage('Framework version is required'),
      body('description').notEmpty().withMessage('Framework description is required')
    ],
    (req, res) => frameworkController.createFramework(req, res)
  );

  // Get all frameworks
  router.get(
    '/',
    [
      query('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
    ],
    (req, res) => frameworkController.getAllFrameworks(req, res)
  );

  // Get framework by ID
  router.get(
    '/:id',
    [
      param('id').isMongoId().withMessage('Invalid framework ID format')
    ],
    (req, res) => frameworkController.getFrameworkById(req, res)
  );

  // Update framework
  router.patch(
    '/:id',
    [
      param('id').isMongoId().withMessage('Invalid framework ID format'),
      body('description').optional().notEmpty().withMessage('Description cannot be empty'),
      body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
    ],
    (req, res) => frameworkController.updateFramework(req, res)
  );

  // Delete framework
  router.delete(
    '/:id',
    [
      param('id').isMongoId().withMessage('Invalid framework ID format')
    ],
    (req, res) => frameworkController.deleteFramework(req, res)
  );

  return router;
};
