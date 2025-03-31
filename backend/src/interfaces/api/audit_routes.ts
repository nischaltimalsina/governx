import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { AuditController } from './audit_controller'
import { validateRequest } from './middlewares'
import { authMiddlewareFactory } from '../../infrastructure/auth/auth_middleware'
import { IAuthRepository, IUserRepository } from '../../domain/auth/repositories'
import { UserRole } from '../../domain/auth/entities'
import {
  AuditType,
  AuditStatus,
  FindingType,
  FindingSeverity,
  FindingStatus,
} from '../../domain/audit/audit_values'

export const createAuditRouter = (
  auditController: AuditController,
  authRepository: IAuthRepository,
  userRepository: IUserRepository
): Router => {
  const router = Router()
  const { authenticate, authorize } = authMiddlewareFactory(authRepository, userRepository)

  // Audit routes
  // POST /api/audit/audits
  router.post(
    '/audits',
    [
      authenticate,
      authorize([UserRole.ADMIN, UserRole.COMPLIANCE_MANAGER, UserRole.AUDITOR]),
      body('name').isString().notEmpty().withMessage('Audit name is required'),
      body('type').isIn(Object.values(AuditType)).withMessage('Invalid audit type'),
      body('description').isString().notEmpty().withMessage('Audit description is required'),
      body('frameworkIds')
        .isArray()
        .notEmpty()
        .withMessage('At least one framework ID is required'),
      body('leadAuditor').isObject().notEmpty().withMessage('Lead auditor is required'),
      body('leadAuditor.id').isString().notEmpty().withMessage('Lead auditor ID is required'),
      body('leadAuditor.name').isString().notEmpty().withMessage('Lead auditor name is required'),
      body('leadAuditor.isExternal')
        .isBoolean()
        .withMessage('Lead auditor isExternal must be a boolean'),
      body('schedule').isObject().notEmpty().withMessage('Schedule is required'),
      body('schedule.startDate').isISO8601().withMessage('Valid start date is required'),
      body('schedule.endDate').isISO8601().withMessage('Valid end date is required'),
      body('scope').optional().isString(),
      body('methodology').optional().isString(),
      validateRequest,
    ],
    auditController.createAudit
  )

  // GET /api/audit/audits/:id
  router.get(
    '/audits/:id',
    [
      authenticate,
      param('id').isString().withMessage('Audit ID is required'),
      query('includeFindings')
        .optional()
        .isBoolean()
        .withMessage('includeFindings must be a boolean'),
      validateRequest,
    ],
    auditController.getAudit
  )

  // GET /api/audit/audits
  router.get(
    '/audits',
    [
      authenticate,
      query('type').optional().isIn(Object.values(AuditType)).withMessage('Invalid audit type'),
      query('status')
        .optional()
        .isIn(Object.values(AuditStatus))
        .withMessage('Invalid audit status'),
      query('frameworkId').optional().isString(),
      query('leadAuditorId').optional().isString(),
      query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Valid ISO date required for start date'),
      query('endDate').optional().isISO8601().withMessage('Valid ISO date required for end date'),
      query('active').optional().isBoolean().withMessage('active must be a boolean'),
      query('pageSize').optional().isInt().withMessage('pageSize must be an integer'),
      query('pageNumber').optional().isInt().withMessage('pageNumber must be an integer'),
      validateRequest,
    ],
    auditController.listAudits
  )

  // PATCH /api/audit/audits/:id/status
  router.patch(
    '/audits/:id/status',
    [
      authenticate,
      authorize([UserRole.ADMIN, UserRole.COMPLIANCE_MANAGER, UserRole.AUDITOR]),
      param('id').isString().withMessage('Audit ID is required'),
      body('status').isIn(Object.values(AuditStatus)).withMessage('Invalid audit status'),
      validateRequest,
    ],
    auditController.updateAuditStatus
  )

  // POST /api/audit/audits/from-template
  router.post(
    '/audits/from-template',
    [
      authenticate,
      authorize([UserRole.ADMIN, UserRole.COMPLIANCE_MANAGER, UserRole.AUDITOR]),
      body('templateId').isString().notEmpty().withMessage('Template ID is required'),
      body('name').isString().notEmpty().withMessage('Audit name is required'),
      body('leadAuditor').isObject().notEmpty().withMessage('Lead auditor is required'),
      body('leadAuditor.id').isString().notEmpty().withMessage('Lead auditor ID is required'),
      body('leadAuditor.name').isString().notEmpty().withMessage('Lead auditor name is required'),
      body('leadAuditor.isExternal')
        .isBoolean()
        .withMessage('Lead auditor isExternal must be a boolean'),
      body('schedule').isObject().notEmpty().withMessage('Schedule is required'),
      body('schedule.startDate').isISO8601().withMessage('Valid start date is required'),
      body('schedule.endDate').isISO8601().withMessage('Valid end date is required'),
      body('description').optional().isString(),
      body('scope').optional().isString(),
      body('methodology').optional().isString(),
      validateRequest,
    ],
    auditController.createAuditFromTemplate
  )

  // Finding routes
  // POST /api/audit/findings
  router.post(
    '/findings',
    [
      authenticate,
      authorize([UserRole.ADMIN, UserRole.COMPLIANCE_MANAGER, UserRole.AUDITOR]),
      body('auditId').isString().notEmpty().withMessage('Audit ID is required'),
      body('title').isString().notEmpty().withMessage('Finding title is required'),
      body('description').isString().notEmpty().withMessage('Finding description is required'),
      body('type').isIn(Object.values(FindingType)).withMessage('Invalid finding type'),
      body('severity').isIn(Object.values(FindingSeverity)).withMessage('Invalid finding severity'),
      body('dueDate').optional().isISO8601().withMessage('Valid ISO date required for due date'),
      validateRequest,
    ],
    auditController.createFinding
  )

  // GET /api/audit/findings/:id
  router.get(
    '/findings/:id',
    [authenticate, param('id').isString().withMessage('Finding ID is required'), validateRequest],
    auditController.getFinding
  )

  // GET /api/audit/findings
  router.get(
    '/findings',
    [
      authenticate,
      query('auditId').optional().isString(),
      query('type').optional().isIn(Object.values(FindingType)).withMessage('Invalid finding type'),
      query('severity')
        .optional()
        .isIn(Object.values(FindingSeverity))
        .withMessage('Invalid finding severity'),
      query('status')
        .optional()
        .isIn(Object.values(FindingStatus))
        .withMessage('Invalid finding status'),
      query('controlId').optional().isString(),
      query('assigneeId').optional().isString(),
      query('overdue').optional().isBoolean().withMessage('overdue must be a boolean'),
      query('active').optional().isBoolean().withMessage('active must be a boolean'),
      query('pageSize').optional().isInt().withMessage('pageSize must be an integer'),
      query('pageNumber').optional().isInt().withMessage('pageNumber must be an integer'),
      validateRequest,
    ],
    auditController.listFindings
  )

  // PATCH /api/audit/findings/:id/status
  router.patch(
    '/findings/:id/status',
    [
      authenticate,
      authorize([UserRole.ADMIN, UserRole.COMPLIANCE_MANAGER, UserRole.AUDITOR]),
      param('id').isString().withMessage('Finding ID is required'),
      body('status').isIn(Object.values(FindingStatus)).withMessage('Invalid finding status'),
      validateRequest,
    ],
    auditController.updateFindingStatus
  )

  // POST /api/audit/findings/:id/remediation-plan
  router.post(
    '/findings/:id/remediation-plan',
    [
      authenticate,
      param('id').isString().withMessage('Finding ID is required'),
      body('description')
        .isString()
        .notEmpty()
        .withMessage('Remediation plan description is required'),
      body('dueDate').isISO8601().withMessage('Valid ISO date required for due date'),
      body('assignee').isString().notEmpty().withMessage('Assignee is required'),
      validateRequest,
    ],
    auditController.addRemediationPlan
  )

  // PATCH /api/audit/findings/:id/remediation-plan
  router.patch(
    '/findings/:id/remediation-plan',
    [
      authenticate,
      param('id').isString().withMessage('Finding ID is required'),
      body('description').optional().isString(),
      body('dueDate').optional().isISO8601().withMessage('Valid ISO date required for due date'),
      body('assignee').optional().isString(),
      body('status').optional().isIn(Object.values(FindingStatus)).withMessage('Invalid status'),
      validateRequest,
    ],
    auditController.updateRemediationPlan
  )

  return router
}
