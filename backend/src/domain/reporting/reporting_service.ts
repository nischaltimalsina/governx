import mongoose from 'mongoose'
import { Result } from '../common/result'
import { Dashboard, DashboardWidget } from './dashboard'
import { Metric, MetricCalculationMethod } from './metric'
import { Report } from './report'
import { IDashboardRepository, IMetricRepository, IReportRepository } from './reporting_repository'
import {
  DashboardName,
  DashboardType,
  MetricName,
  MetricType,
  ReportFilter,
  ReportFormat,
  ReportName,
  ReportSchedule,
  ReportType,
} from './reporting_values'

/**
 * Reporting service for managing reports, dashboards, and metrics
 */
export class ReportingService {
  constructor(
    private reportRepository: IReportRepository,
    private dashboardRepository: IDashboardRepository,
    private metricRepository: IMetricRepository
  ) {}

  /**
   * Create a new report
   */
  public async createReport(
    name: ReportName,
    type: ReportType,
    description: string,
    format: ReportFormat,
    userId: string,
    options?: {
      filter?: ReportFilter
      schedule?: ReportSchedule
      templateId?: string
    }
  ): Promise<Result<Report, Error>> {
    // Create report entity
    const reportId = new mongoose.Types.ObjectId().toString()
    const reportResult = Report.create(reportId, {
      name,
      type,
      description,
      format,
      filter: options?.filter,
      schedule: options?.schedule,
      templateId: options?.templateId,
      createdBy: userId,
    })

    if (!reportResult.isSuccess) {
      return Result.fail<Report>(reportResult.getError())
    }

    const report = reportResult.getValue()

    // Save report to repository
    const saveResult = await this.reportRepository.save(report)

    if (!saveResult.isSuccess) {
      return Result.fail<Report>(saveResult.getError())
    }

    return Result.ok<Report>(report)
  }

  /**
   * Generate a report
   */
  public async generateReport(
    reportId: string,
    userId: string
  ): Promise<Result<{ report: Report; fileUrl: string }, Error>> {
    // Find report
    const reportResult = await this.reportRepository.findById(reportId)

    if (!reportResult.isSuccess) {
      return Result.fail(reportResult.getError())
    }

    const report = reportResult.getValue()

    if (!report) {
      return Result.fail(new Error(`Report with ID ${reportId} not found`))
    }

    // TODO: Implement actual report generation logic
    // This would involve querying data based on report type and filters,
    // formatting it according to the report format, and saving it to a file

    // For now, we'll just fake a file URL
    const fileUrl = `/reports/${reportId}-${Date.now()}.${report.format.toLowerCase()}`

    // Update report with generation info
    const updateResult = report.markGenerated(userId, fileUrl)

    if (!updateResult.isSuccess) {
      return Result.fail(updateResult.getError())
    }

    // Save updated report to repository
    const saveResult = await this.reportRepository.save(report)

    if (!saveResult.isSuccess) {
      return Result.fail(saveResult.getError())
    }

    return Result.ok({
      report,
      fileUrl,
    })
  }

  /**
   * Create a new dashboard
   */
  public async createDashboard(
    name: DashboardName,
    type: DashboardType,
    description: string,
    userId: string,
    options?: {
      widgets?: DashboardWidget[]
      isDefault?: boolean
    }
  ): Promise<Result<Dashboard, Error>> {
    // Check if this is set as default and update existing default if needed
    if (options?.isDefault) {
      const existingDefaultResult = await this.dashboardRepository.findDefaultByType(type)

      if (!existingDefaultResult.isSuccess) {
        return Result.fail<Dashboard>(existingDefaultResult.getError())
      }

      const existingDefault = existingDefaultResult.getValue()

      if (existingDefault) {
        // Update existing default dashboard
        const updateResult = existingDefault.unsetAsDefault(userId)

        if (!updateResult.isSuccess) {
          return Result.fail<Dashboard>(updateResult.getError())
        }

        const saveResult = await this.dashboardRepository.save(existingDefault)

        if (!saveResult.isSuccess) {
          return Result.fail<Dashboard>(saveResult.getError())
        }
      }
    }

    // Create dashboard entity
    const dashboardId = new mongoose.Types.ObjectId().toString()
    const dashboardResult = Dashboard.create(dashboardId, {
      name,
      type,
      description,
      widgets: options?.widgets,
      isDefault: options?.isDefault,
      createdBy: userId,
    })

    if (!dashboardResult.isSuccess) {
      return Result.fail<Dashboard>(dashboardResult.getError())
    }

    const dashboard = dashboardResult.getValue()

    // Save dashboard to repository
    const saveResult = await this.dashboardRepository.save(dashboard)

    if (!saveResult.isSuccess) {
      return Result.fail<Dashboard>(saveResult.getError())
    }

    return Result.ok<Dashboard>(dashboard)
  }

  /**
   * Create a new metric
   */
  public async createMetric(
    name: MetricName,
    type: MetricType,
    description: string,
    calculationMethod: MetricCalculationMethod,
    query: string,
    userId: string,
    options?: {
      unit?: string
      thresholds?: {
        critical?: number
        warning?: number
        target?: number
      }
    }
  ): Promise<Result<Metric, Error>> {
    // Create metric entity
    const metricId = new mongoose.Types.ObjectId().toString()
    const metricResult = Metric.create(metricId, {
      name,
      type,
      description,
      calculationMethod,
      query,
      unit: options?.unit,
      thresholds: options?.thresholds,
      createdBy: userId,
    })

    if (!metricResult.isSuccess) {
      return Result.fail<Metric>(metricResult.getError())
    }

    const metric = metricResult.getValue()

    // Save metric to repository
    const saveResult = await this.metricRepository.save(metric)

    if (!saveResult.isSuccess) {
      return Result.fail<Metric>(saveResult.getError())
    }

    return Result.ok<Metric>(metric)
  }

  /**
   * Calculate metric value
   */
  public async calculateMetric(metricId: string, userId: string): Promise<Result<Metric, Error>> {
    // Find metric
    const metricResult = await this.metricRepository.findById(metricId)

    if (!metricResult.isSuccess) {
      return Result.fail<Metric>(metricResult.getError())
    }

    const metric = metricResult.getValue()

    if (!metric) {
      return Result.fail<Metric>(new Error(`Metric with ID ${metricId} not found`))
    }

    // TODO: Implement actual metric calculation logic
    // This would involve executing the query and calculating the value

    // For now, we'll just fake a value
    const value = Math.random() * 100

    // Update metric with new value
    const updateResult = metric.updateValue(value, userId)

    if (!updateResult.isSuccess) {
      return Result.fail<Metric>(updateResult.getError())
    }

    // Save updated metric to repository
    const saveResult = await this.metricRepository.save(metric)

    if (!saveResult.isSuccess) {
      return Result.fail<Metric>(saveResult.getError())
    }

    return Result.ok<Metric>(metric)
  }

  /**
   * Process scheduled reports
   */
  public async processScheduledReports(userId: string): Promise<
    Result<
      {
        processed: number
        succeeded: number
        failed: number
        errors: Error[]
      },
      Error
    >
  > {
    // Find all reports scheduled to run before now
    const now = new Date()
    const reportsResult = await this.reportRepository.findScheduledReports(now)

    if (!reportsResult.isSuccess) {
      return Result.fail(reportsResult.getError())
    }

    const reports = reportsResult.getValue()
    const results = {
      processed: reports.length,
      succeeded: 0,
      failed: 0,
      errors: [] as Error[],
    }

    // Process each report
    for (const report of reports) {
      try {
        const generateResult = await this.generateReport(report.id, userId)

        if (!generateResult.isSuccess) {
          results.failed++
          results.errors.push(generateResult.getError())
        } else {
          results.succeeded++
        }
      } catch (error) {
        results.failed++
        results.errors.push(error instanceof Error ? error : new Error('Unknown error'))
      }
    }

    return Result.ok(results)
  }
}
