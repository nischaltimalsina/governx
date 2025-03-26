import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { PolicyController } from './policy_controller';
import { validateRequest } from './middlewares';
import { authMiddlewareFactory } from '../../infrastructure/auth/auth_middleware';
import { IAuthRepository, IUserRepository } from '../../domain/auth/repositories';
import { UserRole } from '../../domain/auth/entities';
import { PolicyType, PolicyStatus, PolicyFormat } from '../../domain/compliance/policy_values';

export const createPolicyRouter = (
  policyController: PolicyController,
  authRepository: IAuthRepository,
  userRepository: IUserRepository
): Router => {
  const router = Router();
  const { authenticate, authorize } = authMiddlewareFactory(authRepository, userRepository);

  // Policy routes
  // POST /api/compliance/policies
  router.post(
    '/',
    [
      authenticate,
      body('name').isString().notEmpty().withMessage('Policy name is required'),
      body('type').isIn(Object.values(PolicyType)).withMessage('Invalid policy type'),
      body('description').isString().notEmpty().withMessage('Policy description is required'),
      body('content').optional().isString(),
      body('documentUrl').optional().isString(),
      body('documentPath').optional().isString(),
      body('documentFormat').optional().isIn(Object.values(PolicyFormat)).withMessage('Invalid document format'),
      body('owner').optional().isString(),
      body('relatedControlIds').optional(),
      body('effectiveStartDate').optional().isISO8601().withMessage('Valid ISO date required for effective start date'),
      body('effectiveEndDate').optional().isISO8601().withMessage('Valid ISO date required for effective end date'),
      body('reviewDate').optional().isISO8601().withMessage('Valid ISO date required for review date'),
      body('tags').optional(),
      validateRequest
    ],
    policyController.createPolicy
  );

  // GET /api/compliance/policies/:id
  router.get(
    '/:id',
    [
      authenticate,
      param('id').isString().withMessage('Policy ID is required'),
      query('includeControls').optional().isBoolean().withMessage('includeControls must be a boolean'),
      validateRequest
    ],
    policyController.getPolicy
  );

  // GET /api/compliance/policies
  router.get(
    '/',
    [
      authenticate,
      query('type').optional().isIn(Object.values(PolicyType)).withMessage('Invalid policy type'),
      query('status').optional().isIn(Object.values(PolicyStatus)).withMessage('Invalid policy status'),
      query('owner').optional().isString(),
      query('controlId').optional().isString(),
      query('effectiveOnly').optional().isBoolean().withMessage('effectiveOnly must be a boolean'),
      query('reviewDue').optional().isBoolean().withMessage('reviewDue must be a boolean'),
      query('active').optional().isBoolean().withMessage('active must be a boolean'),
      query('pageSize').optional().isInt().withMessage('pageSize must be an integer'),
      query('pageNumber').optional().isInt().withMessage('pageNumber must be an integer'),
      query('search').optional().isString(),
      validateRequest
    ],
    policyController.listPolicies
  );

  // POST /api/compliance/policies/:id/approve
  router.post(
    '/:id/approve',
    [
      authenticate,
      authorize([UserRole.ADMIN, UserRole.COMPLIANCE_MANAGER]),
      param('id').isString().withMessage('Policy ID is required'),
      body('approverName').isString().notEmpty().withMessage('Approver name is required'),
      body('approverTitle').isString().notEmpty().withMessage('Approver title is required'),
      body('comments').optional().isString(),
      validateRequest
    ],
    policyController.approvePolicy
  );

  // POST /api/compliance/policies/:id/publish
  router.post(
    '/:id/publish',
    [
      authenticate,
      authorize([UserRole.ADMIN, UserRole.COMPLIANCE_MANAGER]),
      param('id').isString().withMessage('Policy ID is required'),
      body('effectiveStartDate').isISO8601().withMessage('Valid ISO date required for effective start date'),
      body('effectiveEndDate').optional().isISO8601().withMessage('Valid ISO date required for effective end date'),
      body('reviewDate').optional().isISO8601().withMessage('Valid ISO date required for review date'),
      validateRequest
    ],
    policyController.publishPolicy
  );

  return router;
};
