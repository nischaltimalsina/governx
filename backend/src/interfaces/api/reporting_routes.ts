import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { ReportingController } from './reporting_controller'
import { validateRequest } from './middlewares'
import { authMiddlewareFactory } from '../../infrastructure/auth/auth_middleware'
import { IAuthRepository, IUserRepository } from '../../domain/auth/repositories'
import { UserRole } from '../../domain/auth/entities'
import {
  ReportType,
  ReportFormat,
  ReportScheduleFrequency,
  DashboardType,
  MetricType,
} from '../../domain/reporting/reporting_values'
import { MetricCalculationMethod } from '../../domain/reporting/metric'

export const createReportingRouter = (
  reportingController: ReportingController,
  authRepository: IAuthRepository,
  userRepository: IUserRepository
): Router => {
  const router = Router()
  const { authenticate, authorize } = authMiddlewareFactory(authRepository, userRepository)

  // Reports routes
  // POST /api/reporting/reports
  router.post(
    '/reports',
    [
      authenticate,
      authorize([UserRole.ADMIN, UserRole.COMPLIANCE_MANAGER, UserRole.RISK_MANAGER]),
      body('name').isString().notEmpty().withMessage('Report name is required'),
      body('type').isIn(Object.values(ReportType)).withMessage('Invalid report type'),
      body('description').isString().notEmpty().withMessage('Report description is required'),
      body('format').isIn(Object.values(ReportFormat)).withMessage('Invalid report format'),
      body('schedule.frequency')
        .optional()
        .isIn(Object.values(ReportScheduleFrequency))
        .withMessage('Invalid schedule frequency'),
      body('schedule.hour')
        .optional()
        .isInt({ min: 0, max: 23 })
        .withMessage('Hour must be between 0 and 23'),
      body('schedule.minute')
        .optional()
        .isInt({ min: 0, max: 59 })
        .withMessage('Minute must be between 0 and 59'),
      body('schedule.recipients').optional().isArray().withMessage('Recipients must be an array'),
      validateRequest,
    ],
    reportingController.createReport
  )

  // GET /api/reporting/reports/:id
  router.get(
    '/reports/:id',
    [authenticate, param('id').isString().withMessage('Report ID is required'), validateRequest],
    reportingController.getReport
  )

  // GET /api/reporting/reports
  router.get(
    '/reports',
    [
      authenticate,
      query('type').optional().isIn(Object.values(ReportType)).withMessage('Invalid report type'),
      query('scheduled').optional().isBoolean().withMessage('Scheduled must be a boolean'),
      query('active').optional().isBoolean().withMessage('Active must be a boolean'),
      query('createdBy').optional().isString(),
      query('pageSize').optional().isInt().withMessage('Page size must be an integer'),
      query('pageNumber').optional().isInt().withMessage('Page number must be an integer'),
      query('search').optional().isString(),
      validateRequest,
    ],
    reportingController.listReports
  )

  // POST /api/reporting/reports/:id/generate
  router.post(
    '/reports/:id/generate',
    [authenticate, param('id').isString().withMessage('Report ID is required'), validateRequest],
    reportingController.generateReport
  )

  // Dashboards routes
  // POST /api/reporting/dashboards
  router.post(
    '/dashboards',
    [
      authenticate,
      body('name').isString().notEmpty().withMessage('Dashboard name is required'),
      body('type').isIn(Object.values(DashboardType)).withMessage('Invalid dashboard type'),
      body('description').isString().notEmpty().withMessage('Dashboard description is required'),
      body('isDefault').optional().isBoolean().withMessage('Is default must be a boolean'),
      validateRequest,
    ],
    reportingController.createDashboard
  )

  // GET /api/reporting/dashboards/:id
  router.get(
    '/dashboards/:id',
    [authenticate, param('id').isString().withMessage('Dashboard ID is required'), validateRequest],
    reportingController.getDashboard
  )

  // GET /api/reporting/dashboards
  router.get(
    '/dashboards',
    [
      authenticate,
      query('type')
        .optional()
        .isIn(Object.values(DashboardType))
        .withMessage('Invalid dashboard type'),
      query('isDefault').optional().isBoolean().withMessage('Is default must be a boolean'),
      query('active').optional().isBoolean().withMessage('Active must be a boolean'),
      query('createdBy').optional().isString(),
      query('pageSize').optional().isInt().withMessage('Page size must be an integer'),
      query('pageNumber').optional().isInt().withMessage('Page number must be an integer'),
      query('search').optional().isString(),
      validateRequest,
    ],
    reportingController.listDashboards
  )

  // Metrics routes
  // POST /api/reporting/metrics
  router.post(
    '/metrics',
    [
      authenticate,
      authorize([UserRole.ADMIN, UserRole.COMPLIANCE_MANAGER, UserRole.RISK_MANAGER]),
      body('name').isString().notEmpty().withMessage('Metric name is required'),
      body('type').isIn(Object.values(MetricType)).withMessage('Invalid metric type'),
      body('description').isString().notEmpty().withMessage('Metric description is required'),
      body('calculationMethod')
        .isIn(Object.values(MetricCalculationMethod))
        .withMessage('Invalid calculation method'),
      body('query').isString().notEmpty().withMessage('Metric query is required'),
      validateRequest,
    ],
    reportingController.createMetric
  )

  // GET /api/reporting/metrics/:id
  router.get(
    '/metrics/:id',
    [authenticate, param('id').isString().withMessage('Metric ID is required'), validateRequest],
    reportingController.getMetric
  )

  // GET /api/reporting/metrics
  router.get(
    '/metrics',
    [
      authenticate,
      query('type').optional().isIn(Object.values(MetricType)).withMessage('Invalid metric type'),
      query('active').optional().isBoolean().withMessage('Active must be a boolean'),
      query('pageSize').optional().isInt().withMessage('Page size must be an integer'),
      query('pageNumber').optional().isInt().withMessage('Page number must be an integer'),
      query('search').optional().isString(),
      validateRequest,
    ],
    reportingController.listMetrics
  )

  // POST /api/reporting/metrics/:id/calculate
  router.post(
    '/metrics/:id/calculate',
    [authenticate, param('id').isString().withMessage('Metric ID is required'), validateRequest],
    reportingController.calculateMetric
  )

  return router
}
