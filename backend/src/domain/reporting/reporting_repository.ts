import { Result } from '../common/result'
import { Report } from './report'
import { Dashboard } from './dashboard'
import { Metric } from './metric'
import { ReportType, DashboardType, MetricType } from './reporting_values'

/**
 * Report repository interface
 */
export interface IReportRepository {
  /**
   * Find a report by ID
   */
  findById(id: string): Promise<Result<Report | null, Error>>

  /**
   * Find all reports with optional filters
   */
  findAll(options?: {
    type?: ReportType[]
    scheduled?: boolean
    createdBy?: string
    active?: boolean
    pageSize?: number
    pageNumber?: number
  }): Promise<Result<Report[], Error>>

  /**
   * Find reports that are scheduled to run
   */
  findScheduledReports(beforeDate: Date): Promise<Result<Report[], Error>>

  /**
   * Save a report to the repository
   */
  save(report: Report): Promise<Result<void, Error>>

  /**
   * Delete a report from the repository
   */
  delete(reportId: string): Promise<Result<void, Error>>

  /**
   * Count reports with optional filters
   */
  count(options?: {
    type?: ReportType[]
    scheduled?: boolean
    active?: boolean
  }): Promise<Result<number, Error>>
}

/**
 * Dashboard repository interface
 */
export interface IDashboardRepository {
  /**
   * Find a dashboard by ID
   */
  findById(id: string): Promise<Result<Dashboard | null, Error>>

  /**
   * Find all dashboards with optional filters
   */
  findAll(options?: {
    type?: DashboardType[]
    isDefault?: boolean
    createdBy?: string
    active?: boolean
    pageSize?: number
    pageNumber?: number
  }): Promise<Result<Dashboard[], Error>>

  /**
   * Find default dashboard by type
   */
  findDefaultByType(type: DashboardType): Promise<Result<Dashboard | null, Error>>

  /**
   * Save a dashboard to the repository
   */
  save(dashboard: Dashboard): Promise<Result<void, Error>>

  /**
   * Delete a dashboard from the repository
   */
  delete(dashboardId: string): Promise<Result<void, Error>>

  /**
   * Count dashboards with optional filters
   */
  count(options?: { type?: DashboardType[]; active?: boolean }): Promise<Result<number, Error>>
}

/**
 * Metric repository interface
 */
export interface IMetricRepository {
  /**
   * Find a metric by ID
   */
  findById(id: string): Promise<Result<Metric | null, Error>>

  /**
   * Find all metrics with optional filters
   */
  findAll(options?: {
    type?: MetricType[]
    active?: boolean
    pageSize?: number
    pageNumber?: number
  }): Promise<Result<Metric[], Error>>

  /**
   * Save a metric to the repository
   */
  save(metric: Metric): Promise<Result<void, Error>>

  /**
   * Delete a metric from the repository
   */
  delete(metricId: string): Promise<Result<void, Error>>

  /**
   * Count metrics with optional filters
   */
  count(options?: { type?: MetricType[]; active?: boolean }): Promise<Result<number, Error>>
}
