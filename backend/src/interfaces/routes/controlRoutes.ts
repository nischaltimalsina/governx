import express from 'express';
import { body, param } from 'express-validator';
import { ControlController } from '../controllers/ControlController';
import { authMiddleware } from '../../infrastructure/middlewares/authMiddleware';
import { ControlStatus } from '../../domain/models/compliance';

export const controlRouter = (controlController: ControlController) => {
  const router = express.Router();

  // Apply authentication middleware to all routes
  router.use(authMiddleware);

  // Create new control
  router.post(
    '/',
    [
      body('frameworkId').isMongoId().withMessage('Valid framework ID is required'),
      body('code').notEmpty().withMessage('Control code is required'),
      body('title').notEmpty().withMessage('Control title is required'),
      body('description').notEmpty().withMessage('Control description is required'),
      body('status')
        .optional()
        .isIn(Object.values(ControlStatus))
        .withMessage('Invalid status value'),
      body('ownerId')
        .optional()
        .isMongoId()
        .withMessage('Owner ID must be a valid ID')
    ],
    (req, res) => controlController.createControl(req, res)
  );

  // Get control by ID
  router.get(
    '/:id',
    [
      param('id').isMongoId().withMessage('Invalid control ID format')
    ],
    (req, res) => controlController.getControlById(req, res)
  );

  // Get controls by framework ID
  router.get(
    '/framework/:frameworkId',
    [
      param('frameworkId').isMongoId().withMessage('Invalid framework ID format')
    ],
    (req, res) => controlController.getControlsByFramework(req, res)
  );

  // Update control status
  router.patch(
    '/:id/status',
    [
      param('id').isMongoId().withMessage('Invalid control ID format'),
      body('status')
        .notEmpty()
        .isIn(Object.values(ControlStatus))
        .withMessage('Valid status is required')
    ],
    (req, res) => controlController.updateControlStatus(req, res)
  );

  // Assign control owner
  router.patch(
    '/:id/owner',
    [
      param('id').isMongoId().withMessage('Invalid control ID format'),
      body('ownerId')
        .notEmpty()
        .isMongoId()
        .withMessage('Valid owner ID is required')
    ],
    (req, res) => controlController.assignControlOwner(req, res)
  );

  return router;
};
