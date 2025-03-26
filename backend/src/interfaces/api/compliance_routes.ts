import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { FrameworkController } from './framework_controller';
import { ControlController } from './control_controller';
import { validateRequest } from './middlewares';
import { authMiddlewareFactory } from '../../infrastructure/auth/auth_middleware';
import { IAuthRepository, IUserRepository } from '../../domain/auth/repositories';
import { UserRole } from '../../domain/auth/entities';
import { ImplementationStatus } from '../../domain/compliance/values';

export const createComplianceRouter = (
  frameworkController: FrameworkController,
  controlController: ControlController,
  authRepository: IAuthRepository,
  userRepository: IUserRepository
): Router => {
  const router = Router();
  const { authenticate, authorize } = authMiddlewareFactory(authRepository, userRepository);

  // Framework routes
  // GET /api/compliance/frameworks
  router.get(
    '/frameworks',
    [
      authenticate,
      query('active').optional().isBoolean().withMessage('Active must be a boolean'),
      query('category').optional().isString().withMessage('Category must be a string'),
      query('organization').optional().isString().withMessage('Organization must be a string'),
      validateRequest
    ],
    frameworkController.listFrameworks
  );

  // GET /api/compliance/frameworks/:id
  router.get(
    '/frameworks/:id',
    [
      authenticate,
      param('id').isString().withMessage('Framework ID is required'),
      query('includeStats').optional().isBoolean().withMessage('includeStats must be a boolean'),
      validateRequest
    ],
    frameworkController.getFramework
  );

  // POST /api/compliance/frameworks
  router.post(
    '/frameworks',
    [
      authenticate,
      authorize([UserRole.ADMIN, UserRole.COMPLIANCE_MANAGER]),
      body('name').isString().notEmpty().withMessage('Framework name is required'),
      body('version').isString().notEmpty().withMessage('Framework version is required'),
      body('description').isString().notEmpty().withMessage('Framework description is required'),
      body('organization').optional().isString(),
      body('category').optional().isString(),
      body('website').optional().isString().isURL().withMessage('Website must be a valid URL'),
      body('isActive').optional().isBoolean(),
      validateRequest
    ],
    frameworkController.createFramework
  );

  // Control routes
  // GET /api/compliance/controls
  router.get(
    '/controls',
    [
      authenticate,
      query('frameworkId').optional().isString(),
      query('implementationStatus').optional().isIn(Object.values(ImplementationStatus)).withMessage('Invalid implementation status'),
      query('categories').optional(),
      query('ownerId').optional().isString(),
      query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
      query('search').optional().isString(),
      validateRequest
    ],
    controlController.listControls
  );

  // GET /api/compliance/controls/:id
  router.get(
    '/controls/:id',
    [
      authenticate,
      param('id').isString().withMessage('Control ID is required'),
      query('includeRelated').optional().isBoolean().withMessage('includeRelated must be a boolean'),
      validateRequest
    ],
    controlController.getControl
  );

  // POST /api/compliance/controls
  router.post(
    '/controls',
    [
      authenticate,
      authorize([UserRole.ADMIN, UserRole.COMPLIANCE_MANAGER]),
      body('frameworkId').isString().notEmpty().withMessage('Framework ID is required'),
      body('code').isString().notEmpty().withMessage('Control code is required'),
      body('title').isString().notEmpty().withMessage('Control title is required'),
      body('description').isString().notEmpty().withMessage('Control description is required'),
      body('guidance').optional().isString(),
      body('implementationStatus').optional().isIn(Object.values(ImplementationStatus)).withMessage('Invalid implementation status'),
      body('implementationDetails').optional().isString(),
      body('ownerId').optional().isString(),
      body('categories').optional().isArray(),
      body('parentControlId').optional().isString(),
      body('isActive').optional().isBoolean(),
      validateRequest
    ],
    controlController.createControl
  );

  // PATCH /api/compliance/controls/:id/implementation
  router.patch(
    '/controls/:id/implementation',
    [
      authenticate,
      param('id').isString().withMessage('Control ID is required'),
      body('implementationStatus').isIn(Object.values(ImplementationStatus)).withMessage('Invalid implementation status'),
      body('implementationDetails').optional().isString(),
      validateRequest
    ],
    controlController.updateControlImplementation
  );

  return router;
};
