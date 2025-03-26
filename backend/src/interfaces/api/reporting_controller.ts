import { Request, Response } from 'express'
import { CreateReportUseCase } from '../../application/reporting/create_report'
import { GetReportUseCase } from '../../application/reporting/get_report'
import { ListReportsUseCase } from '../../application/reporting/list_reports'
import { GenerateReportUseCase } from '../../application/reporting/generate_report'
import { CreateDashboardUseCase } from '../../application/reporting/create_dashboard'
import { GetDashboardUseCase } from '../../application/reporting/get_dashboard'
import { ListDashboardsUseCase } from '../../application/reporting/list_dashboards'
import { CreateMetricUseCase } from '../../application/reporting/create_metric'
import { GetMetricUseCase } from '../../application/reporting/get_metric'
import { ListMetricsUseCase } from '../../application/reporting/list_metrics'
import { CalculateMetricUseCase } from '../../application/reporting/calculate_metric'
import {
  ReportType,
  ReportFormat,
  ReportScheduleFrequency,
  DashboardType,
  MetricType,
} from '../../domain/reporting/reporting_values'
import { MetricCalculationMethod } from '../../domain/reporting/metric'

/**
 * Controller for reporting-related endpoints
 */
export class ReportingController {
  constructor(
    private createReportUseCase: CreateReportUseCase,
    private getReportUseCase: GetReportUseCase,
    private listReportsUseCase: ListReportsUseCase,
    private generateReportUseCase: GenerateReportUseCase,
    private createDashboardUseCase: CreateDashboardUseCase,
    private getDashboardUseCase: GetDashboardUseCase,
    private listDashboardsUseCase: ListDashboardsUseCase,
    private createMetricUseCase: CreateMetricUseCase,
    private getMetricUseCase: GetMetricUseCase,
    private listMetricsUseCase: ListMetricsUseCase,
    private calculateMetricUseCase: CalculateMetricUseCase
  ) {}

  /**
   * Create a new report
   */
  public createReport = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
        return
      }

      // Create the schedule object if schedule parameters are provided
      let schedule
      if (req.body.schedule) {
        schedule = {
          frequency: req.body.schedule.frequency,
          hour: parseInt(req.body.schedule.hour),
          minute: parseInt(req.body.schedule.minute),
          recipients: Array.isArray(req.body.schedule.recipients)
            ? req.body.schedule.recipients
            : [req.body.schedule.recipients],
          dayOfWeek:
            req.body.schedule.dayOfWeek !== undefined
              ? parseInt(req.body.schedule.dayOfWeek)
              : undefined,
          dayOfMonth:
            req.body.schedule.dayOfMonth !== undefined
              ? parseInt(req.body.schedule.dayOfMonth)
              : undefined,
        }
      }

      // Create the filter object if filter parameters are provided
      let filter
      if (req.body.filter) {
        // Parse dates if provided
        const startDate = req.body.filter.startDate
          ? new Date(req.body.filter.startDate)
          : undefined
        const endDate = req.body.filter.endDate ? new Date(req.body.filter.endDate) : undefined

        // Parse arrays if they're provided as strings
        let frameworkIds = req.body.filter.frameworkIds
        let controlIds = req.body.filter.controlIds
        let riskIds = req.body.filter.riskIds
        let evidenceIds = req.body.filter.evidenceIds
        let policyIds = req.body.filter.policyIds
        let tags = req.body.filter.tags

        if (typeof frameworkIds === 'string') {
          frameworkIds = JSON.parse(frameworkIds)
        }
        if (typeof controlIds === 'string') {
          controlIds = JSON.parse(controlIds)
        }
        if (typeof riskIds === 'string') {
          riskIds = JSON.parse(riskIds)
        }
        if (typeof evidenceIds === 'string') {
          evidenceIds = JSON.parse(evidenceIds)
        }
        if (typeof policyIds === 'string') {
          policyIds = JSON.parse(policyIds)
        }
        if (typeof tags === 'string') {
          tags = JSON.parse(tags)
        }

        const customtags = req.body.filter.customtags
          ? JSON.parse(req.body.filter.customtags)
          : undefined

        filter = {
          frameworkIds,
          controlIds,
          riskIds,
          evidenceIds,
          policyIds,
          startDate,
          endDate,
          tags,
          customtags,
          customFilters: req.body.filter.customFilters
            ? JSON.parse(req.body.filter.customFilters)
            : undefined,
        }
      }

      // Create DTO from request
      const createReportDto = {
        name: req.body.name,
        type: req.body.type as ReportType,
        description: req.body.description,
        format: req.body.format as ReportFormat,
        filter,
        schedule,
        templateId: req.body.templateId,
      }

      const result = await this.createReportUseCase.execute(createReportDto, req.userId)

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(201).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('Create report error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * Get a report by ID
   */
  public getReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      const result = await this.getReportUseCase.execute(id)

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      const report = result.getValue()

      if (!report) {
        res.status(404).json({
          success: false,
          message: `Report with ID ${id} not found`,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: report,
      })
    } catch (error) {
      console.error('Get report error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * List reports with filters
   */
  public listReports = async (req: Request, res: Response): Promise<void> => {
    try {
      // Parse filter parameters
      const createdBy = req.query.createdBy as string | undefined
      const search = req.query.search as string | undefined

      const scheduled =
        req.query.scheduled === 'true' ? true : req.query.scheduled === 'false' ? false : undefined
      const active =
        req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined

      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined
      const pageNumber = req.query.pageNumber ? parseInt(req.query.pageNumber as string) : undefined

      // Parse type array
      let type: ReportType[] | undefined
      const typeParam = req.query.type
      if (typeParam) {
        if (Array.isArray(typeParam)) {
          type = typeParam as ReportType[]
        } else {
          type = [typeParam as ReportType]
        }
      }

      const result = await this.listReportsUseCase.execute({
        type,
        scheduled,
        createdBy,
        active,
        search,
        pageSize,
        pageNumber,
      })

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('List reports error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * Generate a report
   */
  public generateReport = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
        return
      }

      const { id } = req.params
      const result = await this.generateReportUseCase.execute(id, req.userId)

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('Generate report error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * Create a new dashboard
   */
  public createDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
        return
      }

      // Parse widgets if provided as string
      let widgets
      if (typeof req.body.widgets === 'string') {
        widgets = JSON.parse(req.body.widgets)
      } else {
        widgets = req.body.widgets
      }

      // Create DTO from request
      const createDashboardDto = {
        name: req.body.name,
        type: req.body.type as DashboardType,
        description: req.body.description,
        widgets,
        isDefault: req.body.isDefault === true,
      }

      const result = await this.createDashboardUseCase.execute(createDashboardDto, req.userId)

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(201).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('Create dashboard error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * Get a dashboard by ID
   */
  public getDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      const result = await this.getDashboardUseCase.execute(id)

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      const dashboard = result.getValue()

      if (!dashboard) {
        res.status(404).json({
          success: false,
          message: `Dashboard with ID ${id} not found`,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: dashboard,
      })
    } catch (error) {
      console.error('Get dashboard error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * List dashboards with filters
   */
  public listDashboards = async (req: Request, res: Response): Promise<void> => {
    try {
      // Parse filter parameters
      const createdBy = req.query.createdBy as string | undefined
      const search = req.query.search as string | undefined

      const isDefault =
        req.query.isDefault === 'true' ? true : req.query.isDefault === 'false' ? false : undefined
      const active =
        req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined

      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined
      const pageNumber = req.query.pageNumber ? parseInt(req.query.pageNumber as string) : undefined

      // Parse type array
      let type: DashboardType[] | undefined
      const typeParam = req.query.type
      if (typeParam) {
        if (Array.isArray(typeParam)) {
          type = typeParam as DashboardType[]
        } else {
          type = [typeParam as DashboardType]
        }
      }

      const result = await this.listDashboardsUseCase.execute({
        type,
        isDefault,
        createdBy,
        active,
        search,
        pageSize,
        pageNumber,
      })

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('List dashboards error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * Create a new metric
   */
  public createMetric = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
        return
      }

      // Parse thresholds if provided as string
      let thresholds
      if (typeof req.body.thresholds === 'string') {
        thresholds = JSON.parse(req.body.thresholds)
      } else {
        thresholds = req.body.thresholds
      }

      // Create DTO from request
      const createMetricDto = {
        name: req.body.name,
        type: req.body.type as MetricType,
        description: req.body.description,
        calculationMethod: req.body.calculationMethod as MetricCalculationMethod,
        query: req.body.query,
        unit: req.body.unit,
        thresholds,
      }

      const result = await this.createMetricUseCase.execute(createMetricDto, req.userId)

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(201).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('Create metric error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * Get a metric by ID
   */
  public getMetric = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      const result = await this.getMetricUseCase.execute(id)

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      const metric = result.getValue()

      if (!metric) {
        res.status(404).json({
          success: false,
          message: `Metric with ID ${id} not found`,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: metric,
      })
    } catch (error) {
      console.error('Get metric error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * List metrics with filters
   */
  public listMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      // Parse filter parameters
      const search = req.query.search as string | undefined

      const active =
        req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined

      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined
      const pageNumber = req.query.pageNumber ? parseInt(req.query.pageNumber as string) : undefined

      // Parse type array
      let type: MetricType[] | undefined
      const typeParam = req.query.type
      if (typeParam) {
        if (Array.isArray(typeParam)) {
          type = typeParam as MetricType[]
        } else {
          type = [typeParam as MetricType]
        }
      }

      const result = await this.listMetricsUseCase.execute({
        type,
        active,
        search,
        pageSize,
        pageNumber,
      })

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('List metrics error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * Calculate a metric
   */
  public calculateMetric = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
        return
      }

      const { id } = req.params
      const result = await this.calculateMetricUseCase.execute(id, req.userId)

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('Calculate metric error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }
}
