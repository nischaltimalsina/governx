import {
  ReportType,
  ReportFormat,
  ReportScheduleFrequency,
  DashboardType,
  MetricType,
} from '../../domain/reporting/reporting_values'
import { MetricCalculationMethod, MetricTrendDirection } from '../../domain/reporting/metric'

/**
 * Data Transfer Objects for reporting-related use cases
 */

// Report DTOs
export interface CreateReportDTO {
  name: string
  type: ReportType
  description: string
  format: ReportFormat
  filter?: {
    frameworkIds?: string[]
    controlIds?: string[]
    riskIds?: string[]
    evidenceIds?: string[]
    policyIds?: string[]
    startDate?: Date
    endDate?: Date
    tags?: string[]
    customFilters?: Record<string, any>
  }
  schedule?: {
    frequency: ReportScheduleFrequency
    hour: number
    minute: number
    recipients: string[]
    dayOfWeek?: number
    dayOfMonth?: number
  }
  templateId?: string
}

export interface ReportDTO {
  id: string
  name: string
  type: ReportType
  description: string
  format: ReportFormat
  filter?: {
    frameworkIds?: string[]
    controlIds?: string[]
    riskIds?: string[]
    evidenceIds?: string[]
    policyIds?: string[]
    startDate?: Date
    endDate?: Date
    tags?: string[]
    customFilters?: Record<string, any>
  }
  schedule?: {
    frequency: ReportScheduleFrequency
    hour: number
    minute: number
    recipients: string[]
    dayOfWeek?: number
    dayOfMonth?: number
    nextRunTime: Date
  }
  templateId?: string
  lastGeneratedAt?: Date
  lastGeneratedBy?: string
  lastGeneratedFileUrl?: string
  isActive: boolean
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt?: Date
}

export interface ReportListItemDTO {
  id: string
  name: string
  type: ReportType
  format: ReportFormat
  isScheduled: boolean
  lastGeneratedAt?: Date
  isActive: boolean
  createdBy: string
  createdAt: Date
  updatedAt?: Date
}

export interface GenerateReportResultDTO {
  report: ReportDTO
  fileUrl: string
}

export interface UpdateReportFilterDTO {
  frameworkIds?: string[]
  controlIds?: string[]
  riskIds?: string[]
  evidenceIds?: string[]
  policyIds?: string[]
  startDate?: Date
  endDate?: Date
  tags?: string[]
  customFilters?: Record<string, any>
}

export interface UpdateReportScheduleDTO {
  frequency: ReportScheduleFrequency
  hour: number
  minute: number
  recipients: string[]
  dayOfWeek?: number
  dayOfMonth?: number
}

// Dashboard DTOs
export interface DashboardWidgetDTO {
  id: string
  title: string
  type: string
  dataSource: string
  size: {
    width: number
    height: number
  }
  position: {
    x: number
    y: number
  }
  config?: Record<string, any>
}

export interface CreateDashboardDTO {
  name: string
  type: DashboardType
  description: string
  widgets?: DashboardWidgetDTO[]
  isDefault?: boolean
}

export interface DashboardDTO {
  id: string
  name: string
  type: DashboardType
  description: string
  widgets: DashboardWidgetDTO[]
  isDefault: boolean
  isActive: boolean
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt?: Date
}

export interface DashboardListItemDTO {
  id: string
  name: string
  type: DashboardType
  widgetCount: number
  isDefault: boolean
  isActive: boolean
  createdBy: string
  createdAt: Date
  updatedAt?: Date
}

export interface AddWidgetDTO {
  title: string
  type: string
  dataSource: string
  size: {
    width: number
    height: number
  }
  position: {
    x: number
    y: number
  }
  config?: Record<string, any>
}

export interface UpdateWidgetDTO {
  title?: string
  dataSource?: string
  size?: {
    width: number
    height: number
  }
  position?: {
    x: number
    y: number
  }
  config?: Record<string, any>
}

// Metric DTOs
export interface CreateMetricDTO {
  name: string
  type: MetricType
  description: string
  calculationMethod: MetricCalculationMethod
  query: string
  unit?: string
  thresholds?: {
    critical?: number
    warning?: number
    target?: number
  }
}

export interface MetricDTO {
  id: string
  name: string
  type: MetricType
  description: string
  calculationMethod: MetricCalculationMethod
  query: string
  unit?: string
  thresholds?: {
    critical?: number
    warning?: number
    target?: number
  }
  currentValue?: number
  previousValue?: number
  trend?: MetricTrendDirection
  lastCalculatedAt?: Date
  isActive: boolean
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt?: Date
}

export interface MetricListItemDTO {
  id: string
  name: string
  type: MetricType
  calculationMethod: MetricCalculationMethod
  currentValue?: number
  unit?: string
  trend?: MetricTrendDirection
  lastCalculatedAt?: Date
  isActive: boolean
  createdAt: Date
  updatedAt?: Date
}

export interface UpdateMetricThresholdsDTO {
  critical?: number
  warning?: number
  target?: number
}

// Filter and search options
export interface ReportFilterOptionsDTO {
  type?: ReportType[]
  scheduled?: boolean
  createdBy?: string
  active?: boolean
  search?: string
  pageSize?: number
  pageNumber?: number
}

export interface DashboardFilterOptionsDTO {
  type?: DashboardType[]
  isDefault?: boolean
  createdBy?: string
  active?: boolean
  search?: string
  pageSize?: number
  pageNumber?: number
}

export interface MetricFilterOptionsDTO {
  type?: MetricType[]
  active?: boolean
  search?: string
  pageSize?: number
  pageNumber?: number
}
