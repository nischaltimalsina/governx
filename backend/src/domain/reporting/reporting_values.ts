import { Result } from '../common/result'

/**
 * ReportType enum represents the type of report
 */
export enum ReportType {
  COMPLIANCE_SUMMARY = 'compliance_summary',
  RISK_SUMMARY = 'risk_summary',
  EVIDENCE_SUMMARY = 'evidence_summary',
  POLICY_SUMMARY = 'policy_summary',
  CONTROL_IMPLEMENTATION = 'control_implementation',
  AUDIT_READINESS = 'audit_readiness',
  CUSTOM = 'custom',
}

/**
 * ReportFormat enum represents the output format of a report
 */
export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
  HTML = 'html',
}

/**
 * ReportScheduleFrequency enum represents how often a report is generated
 */
export enum ReportScheduleFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
  CUSTOM = 'custom',
}

/**
 * DashboardType enum represents the type of dashboard
 */
export enum DashboardType {
  EXECUTIVE = 'executive',
  COMPLIANCE = 'compliance',
  RISK = 'risk',
  EVIDENCE = 'evidence',
  POLICY = 'policy',
  CUSTOM = 'custom',
}

/**
 * MetricType enum represents the type of metric
 */
export enum MetricType {
  COMPLIANCE_SCORE = 'compliance_score',
  IMPLEMENTATION_RATE = 'implementation_rate',
  RISK_LEVEL = 'risk_level',
  EVIDENCE_COLLECTION = 'evidence_collection',
  POLICY_EFFECTIVENESS = 'policy_effectiveness',
  CONTROL_EFFECTIVENESS = 'control_effectiveness',
  CUSTOM = 'custom',
}

/**
 * ReportName value object represents the name of a report
 */
export class ReportName {
  private readonly value: string

  private constructor(name: string) {
    this.value = name
  }

  public getValue(): string {
    return this.value
  }

  public static create(name: string): Result<ReportName, Error> {
    if (!name) {
      return Result.fail<ReportName>(new Error('Report name cannot be empty'))
    }

    if (name.length < 3) {
      return Result.fail<ReportName>(new Error('Report name must be at least 3 characters'))
    }

    if (name.length > 100) {
      return Result.fail<ReportName>(new Error('Report name cannot exceed 100 characters'))
    }

    return Result.ok<ReportName>(new ReportName(name))
  }
}

/**
 * DashboardName value object represents the name of a dashboard
 */
export class DashboardName {
  private readonly value: string

  private constructor(name: string) {
    this.value = name
  }

  public getValue(): string {
    return this.value
  }

  public static create(name: string): Result<DashboardName, Error> {
    if (!name) {
      return Result.fail<DashboardName>(new Error('Dashboard name cannot be empty'))
    }

    if (name.length < 3) {
      return Result.fail<DashboardName>(new Error('Dashboard name must be at least 3 characters'))
    }

    if (name.length > 100) {
      return Result.fail<DashboardName>(new Error('Dashboard name cannot exceed 100 characters'))
    }

    return Result.ok<DashboardName>(new DashboardName(name))
  }
}

/**
 * MetricName value object represents the name of a metric
 */
export class MetricName {
  private readonly value: string

  private constructor(name: string) {
    this.value = name
  }

  public getValue(): string {
    return this.value
  }

  public static create(name: string): Result<MetricName, Error> {
    if (!name) {
      return Result.fail<MetricName>(new Error('Metric name cannot be empty'))
    }

    if (name.length < 3) {
      return Result.fail<MetricName>(new Error('Metric name must be at least 3 characters'))
    }

    if (name.length > 100) {
      return Result.fail<MetricName>(new Error('Metric name cannot exceed 100 characters'))
    }

    return Result.ok<MetricName>(new MetricName(name))
  }
}

/**
 * ReportSchedule value object represents when a report is scheduled to run
 */
export class ReportSchedule {
  private readonly frequency: ReportScheduleFrequency
  private readonly dayOfWeek?: number // 0-6, Sunday to Saturday
  private readonly dayOfMonth?: number // 1-31
  private readonly hour: number // 0-23
  private readonly minute: number // 0-59
  private readonly nextRunTime: Date
  private readonly recipients: string[]

  private constructor(
    frequency: ReportScheduleFrequency,
    hour: number,
    minute: number,
    recipients: string[],
    dayOfWeek?: number,
    dayOfMonth?: number,
    nextRunTime?: Date
  ) {
    this.frequency = frequency
    this.hour = hour
    this.minute = minute
    this.dayOfWeek = dayOfWeek
    this.dayOfMonth = dayOfMonth
    this.recipients = recipients

    // Calculate next run time if not provided
    if (nextRunTime) {
      this.nextRunTime = nextRunTime
    } else {
      this.nextRunTime = this.calculateNextRunTime()
    }
  }

  public getFrequency(): ReportScheduleFrequency {
    return this.frequency
  }

  public getDayOfWeek(): number | undefined {
    return this.dayOfWeek
  }

  public getDayOfMonth(): number | undefined {
    return this.dayOfMonth
  }

  public getHour(): number {
    return this.hour
  }

  public getMinute(): number {
    return this.minute
  }

  public getNextRunTime(): Date {
    return new Date(this.nextRunTime)
  }

  public getRecipients(): string[] {
    return [...this.recipients]
  }

  private calculateNextRunTime(): Date {
    const now = new Date()
    const next = new Date()

    // Set hours and minutes
    next.setHours(this.hour, this.minute, 0, 0)

    // If the time today has already passed, start from tomorrow
    if (next <= now) {
      next.setDate(next.getDate() + 1)
    }

    switch (this.frequency) {
      case ReportScheduleFrequency.DAILY:
        // Already set for the next day
        break

      case ReportScheduleFrequency.WEEKLY:
        if (this.dayOfWeek !== undefined) {
          const currentDay = next.getDay()
          const daysUntilTarget = (this.dayOfWeek - currentDay + 7) % 7
          next.setDate(next.getDate() + daysUntilTarget)
        }
        break

      case ReportScheduleFrequency.MONTHLY:
        if (this.dayOfMonth !== undefined) {
          next.setDate(this.dayOfMonth)
          // If this month's day has passed, move to next month
          if (next <= now) {
            next.setMonth(next.getMonth() + 1)
          }
        }
        break

      case ReportScheduleFrequency.QUARTERLY:
        if (this.dayOfMonth !== undefined) {
          const currentMonth = next.getMonth()
          const targetMonth = (Math.ceil((currentMonth + 1) / 3) * 3) % 12

          next.setMonth(targetMonth)
          next.setDate(this.dayOfMonth)

          // If this quarter's date has passed, move to next quarter
          if (next <= now) {
            next.setMonth(next.getMonth() + 3)
          }
        }
        break

      case ReportScheduleFrequency.ANNUALLY:
        if (this.dayOfMonth !== undefined) {
          const currentMonth = next.getMonth()
          next.setMonth(0) // January
          next.setDate(this.dayOfMonth)

          // If this year's date has passed, move to next year
          if (next <= now) {
            next.setFullYear(next.getFullYear() + 1)
          }
        }
        break

      default:
        // For custom schedules, default to next day
        next.setDate(next.getDate() + 1)
    }

    return next
  }

  public static create(
    frequency: ReportScheduleFrequency,
    hour: number,
    minute: number,
    recipients: string[],
    dayOfWeek?: number,
    dayOfMonth?: number,
    nextRunTime?: Date
  ): Result<ReportSchedule, Error> {
    // Validate hour and minute
    if (hour < 0 || hour > 23) {
      return Result.fail<ReportSchedule>(new Error('Hour must be between 0 and 23'))
    }

    if (minute < 0 || minute > 59) {
      return Result.fail<ReportSchedule>(new Error('Minute must be between 0 and 59'))
    }

    // Validate day of week for weekly schedules
    if (
      frequency === ReportScheduleFrequency.WEEKLY &&
      (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6)
    ) {
      return Result.fail<ReportSchedule>(
        new Error('Day of week must be between 0 and 6 for weekly schedules')
      )
    }

    // Validate day of month for monthly schedules
    if (
      (frequency === ReportScheduleFrequency.MONTHLY ||
        frequency === ReportScheduleFrequency.QUARTERLY ||
        frequency === ReportScheduleFrequency.ANNUALLY) &&
      (dayOfMonth === undefined || dayOfMonth < 1 || dayOfMonth > 31)
    ) {
      return Result.fail<ReportSchedule>(
        new Error(
          'Day of month must be between 1 and 31 for monthly, quarterly, or annual schedules'
        )
      )
    }

    // Validate recipients
    if (!recipients || recipients.length === 0) {
      return Result.fail<ReportSchedule>(new Error('At least one recipient is required'))
    }

    return Result.ok<ReportSchedule>(
      new ReportSchedule(frequency, hour, minute, recipients, dayOfWeek, dayOfMonth, nextRunTime)
    )
  }
}

/**
 * ReportFilter value object represents filter criteria for a report
 */
export class ReportFilter {
  private readonly frameworkIds?: string[]
  private readonly controlIds?: string[]
  private readonly riskIds?: string[]
  private readonly evidenceIds?: string[]
  private readonly policyIds?: string[]
  private readonly startDate?: Date
  private readonly endDate?: Date
  private readonly tags?: string[]
  private readonly customFilters?: Record<string, any>

  private constructor(
    frameworkIds?: string[],
    controlIds?: string[],
    riskIds?: string[],
    evidenceIds?: string[],
    policyIds?: string[],
    startDate?: Date,
    endDate?: Date,
    tags?: string[],
    customFilters?: Record<string, any>
  ) {
    this.frameworkIds = frameworkIds
    this.controlIds = controlIds
    this.riskIds = riskIds
    this.evidenceIds = evidenceIds
    this.policyIds = policyIds
    this.startDate = startDate
    this.endDate = endDate
    this.tags = tags
    this.customFilters = customFilters
  }

  public getFrameworkIds(): string[] | undefined {
    return this.frameworkIds ? [...this.frameworkIds] : undefined
  }

  public getControlIds(): string[] | undefined {
    return this.controlIds ? [...this.controlIds] : undefined
  }

  public getRiskIds(): string[] | undefined {
    return this.riskIds ? [...this.riskIds] : undefined
  }

  public getEvidenceIds(): string[] | undefined {
    return this.evidenceIds ? [...this.evidenceIds] : undefined
  }

  public getPolicyIds(): string[] | undefined {
    return this.policyIds ? [...this.policyIds] : undefined
  }

  public getStartDate(): Date | undefined {
    return this.startDate ? new Date(this.startDate) : undefined
  }

  public getEndDate(): Date | undefined {
    return this.endDate ? new Date(this.endDate) : undefined
  }

  public getTags(): string[] | undefined {
    return this.tags ? [...this.tags] : undefined
  }

  public getCustomFilters(): Record<string, any> | undefined {
    return this.customFilters ? { ...this.customFilters } : undefined
  }

  public static create(
    frameworkIds?: string[],
    controlIds?: string[],
    riskIds?: string[],
    evidenceIds?: string[],
    policyIds?: string[],
    startDate?: Date,
    endDate?: Date,
    tags?: string[],
    customFilters?: Record<string, any>
  ): Result<ReportFilter, Error> {
    // Validate date range if both dates are provided
    if (startDate && endDate && startDate > endDate) {
      return Result.fail<ReportFilter>(new Error('Start date must be before end date'))
    }

    return Result.ok<ReportFilter>(
      new ReportFilter(
        frameworkIds,
        controlIds,
        riskIds,
        evidenceIds,
        policyIds,
        startDate,
        endDate,
        tags,
        customFilters
      )
    )
  }
}
