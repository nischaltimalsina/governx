import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { AuditTemplateController } from './audit_template_controller'
import { validateRequest } from './middlewares'
import { authMiddlewareFactory } from '../../infrastructure/auth/auth_middleware'
import { IAuthRepository, IUserRepository } from '../../domain/auth/repositories'
import { UserRole } from '../../domain/auth/entities'
import { AuditType } from '../../domain/audit/audit_values'

export const createAuditTemplateRouter = (
  auditTemplateController: AuditTemplateController,
  authRepository: IAuthRepository,
  userRepository: IUserRepository
): Router => {
  const router = Router()
  const { authenticate, authorize } = authMiddlewareFactory(authRepository, userRepository)

  // Audit Template routes
  // POST /api/audit/templates
  router.post(
    '/',
    [
      authenticate,
      authorize([UserRole.ADMIN, UserRole.COMPLIANCE_MANAGER, UserRole.AUDITOR]),
      body('name').isString().notEmpty().withMessage('Template name is required'),
      body('description').isString().notEmpty().withMessage('Template description is required'),
      body('type').isIn(Object.values(AuditType)).withMessage('Invalid audit type'),
      validateRequest,
    ],
    auditTemplateController.createAuditTemplate
  )

  // GET /api/audit/templates/:id
  router.get(
    '/:id',
    [authenticate, param('id').isString().withMessage('Template ID is required'), validateRequest],
    auditTemplateController.getAuditTemplate
  )

  // GET /api/audit/templates
  router.get(
    '/',
    [
      authenticate,
      query('type').optional().isIn(Object.values(AuditType)).withMessage('Invalid audit type'),
      query('frameworkId').optional().isString(),
      query('active').optional().isBoolean().withMessage('active must be a boolean'),
      query('pageSize').optional().isInt().withMessage('pageSize must be an integer'),
      query('pageNumber').optional().isInt().withMessage('pageNumber must be an integer'),
      validateRequest,
    ],
    auditTemplateController.listAuditTemplates
  )

  return router
}
