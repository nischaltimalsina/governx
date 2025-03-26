import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { RiskController } from './risk_controller';
import { validateRequest } from './middlewares';
import { authMiddlewareFactory } from '../../infrastructure/auth/auth_middleware';
import { IAuthRepository, IUserRepository } from '../../domain/auth/repositories';
import { UserRole } from '../../domain/auth/entities';
import {
  RiskCategory,
  RiskImpact,
  RiskLikelihood,
  RiskStatus,
  RiskSeverity,
  TreatmentType,
  TreatmentStatus
} from '../../domain/risk/risk_values';

export const createRiskRouter = (
  riskController: RiskController,
  authRepository: IAuthRepository,
  userRepository: IUserRepository
): Router => {
  const router = Router();
  const { authenticate, authorize } = authMiddlewareFactory(authRepository, userRepository);

  // Risk routes
  // POST /api/risk/risks
  router.post(
    '/risks',
    [
      authenticate,
      authorize([UserRole.ADMIN, UserRole.COMPLIANCE_MANAGER, UserRole.RISK_MANAGER]),
      body('name').isString().notEmpty().withMessage('Risk name is required'),
      body('description').isString().notEmpty().withMessage('Risk description is required'),
      body('category').isIn(Object.values(RiskCategory)).withMessage('Invalid risk category'),
      body('inherentImpact').isIn(Object.values(RiskImpact)).withMessage('Invalid inherent impact'),
      body('inherentLikelihood').isIn(Object.values(RiskLikelihood)).withMessage('Invalid inherent likelihood'),
      body('residualImpact').optional().isIn(Object.values(RiskImpact)).withMessage('Invalid residual impact'),
      body('residualLikelihood').optional().isIn(Object.values(RiskLikelihood)).withMessage('Invalid residual likelihood'),
      body('reviewPeriodMonths').optional().isInt({ min: 1 }).withMessage('Review period must be at least 1 month'),
      validateRequest
    ],
    riskController.createRisk
  );

  // GET /api/risk/risks/:id
  router.get(
    '/risks/:id',
    [
      authenticate,
      param('id').isString().withMessage('Risk ID is required'),
      query('includeControls').optional().isBoolean().withMessage('includeControls must be a boolean'),
      query('includeTreatments').optional().isBoolean().withMessage('includeTreatments must be a boolean'),
      validateRequest
    ],
    riskController.getRisk
  );

  // GET /api/risk/risks
  router.get(
    '/risks',
    [
      authenticate,
      query('categories').optional(),
      query('statuses').optional(),
      query('severities').optional(),
      query('ownerId').optional().isString(),
      query('controlId').optional().isString(),
      query('assetId').optional().isString(),
      query('reviewDue').optional().isBoolean().withMessage('reviewDue must be a boolean'),
      query('active').optional().isBoolean().withMessage('active must be a boolean'),
      query('pageSize').optional().isInt().withMessage('pageSize must be an integer'),
      query('pageNumber').optional().isInt().withMessage('pageNumber must be an integer'),
      query('search').optional().isString(),
      validateRequest
    ],
    riskController.listRisks
  );

  // Risk Treatment routes
  // POST /api/risk/treatments
  router.post(
    '/treatments',
    [
      authenticate,
      authorize([UserRole.ADMIN, UserRole.COMPLIANCE_MANAGER, UserRole.RISK_MANAGER]),
      body('riskId').isString().notEmpty().withMessage('Risk ID is required'),
      body('name').isString().notEmpty().withMessage('Treatment name is required'),
      body('description').isString().notEmpty().withMessage('Treatment description is required'),
      body('type').isIn(Object.values(TreatmentType)).withMessage('Invalid treatment type'),
      body('status').optional().isIn(Object.values(TreatmentStatus)).withMessage('Invalid treatment status'),
      body('dueDate').optional().isISO8601().withMessage('Valid ISO date required for due date'),
      body('assignee').optional().isString(),
      body('cost').optional().isNumeric().withMessage('Cost must be a number'),
      validateRequest
    ],
    riskController.createRiskTreatment
  );

  return router;
};
