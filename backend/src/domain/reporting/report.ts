import { Entity } from '../common/entity'
import { Result } from '../common/result'
import {
  ReportName,
  ReportType,
  ReportFormat,
  ReportSchedule,
  ReportFilter,
} from './reporting_values'

/**
 * Report properties interface
 */
export interface ReportProps {
  name: ReportName
  type: ReportType
  description: string
  format: ReportFormat
  filter?: ReportFilter
  schedule?: ReportSchedule
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

/**
 * Report entity representing a compliance report
 */
export class Report extends Entity<ReportProps> {
  private readonly props: ReportProps

  private constructor(id: string, props: ReportProps) {
    super(id)
    this.props = props
  }

  // Getters
  get name(): ReportName {
    return this.props.name
  }

  get type(): ReportType {
    return this.props.type
  }

  get description(): string {
    return this.props.description
  }

  get format(): ReportFormat {
    return this.props.format
  }

  get filter(): ReportFilter | undefined {
    return this.props.filter
  }

  get schedule(): ReportSchedule | undefined {
    return this.props.schedule
  }

  get templateId(): string | undefined {
    return this.props.templateId
  }

  get lastGeneratedAt(): Date | undefined {
    return this.props.lastGeneratedAt ? new Date(this.props.lastGeneratedAt) : undefined
  }

  get lastGeneratedBy(): string | undefined {
    return this.props.lastGeneratedBy
  }

  get lastGeneratedFileUrl(): string | undefined {
    return this.props.lastGeneratedFileUrl
  }

  get isActive(): boolean {
    return this.props.isActive
  }

  get createdBy(): string {
    return this.props.createdBy
  }

  get updatedBy(): string | undefined {
    return this.props.updatedBy
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt)
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt ? new Date(this.props.updatedAt) : undefined
  }

  // Business methods
  public updateDescription(description: string, userId: string): Result<void, Error> {
    if (!description || description.trim().length === 0) {
      return Result.fail<void>(new Error('Description cannot be empty'))
    }

    if (description.length > 1000) {
      return Result.fail<void>(new Error('Description cannot exceed 1000 characters'))
    }

    this.props.description = description
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateFormat(format: ReportFormat, userId: string): Result<void, Error> {
    this.props.format = format
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateFilter(filter: ReportFilter | undefined, userId: string): Result<void, Error> {
    this.props.filter = filter
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateSchedule(schedule: ReportSchedule | undefined, userId: string): Result<void, Error> {
    this.props.schedule = schedule
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateTemplate(templateId: string | undefined, userId: string): Result<void, Error> {
    this.props.templateId = templateId
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public markGenerated(generatedBy: string, fileUrl: string): Result<void, Error> {
    this.props.lastGeneratedAt = new Date()
    this.props.lastGeneratedBy = generatedBy
    this.props.lastGeneratedFileUrl = fileUrl
    this.props.updatedBy = generatedBy
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public activate(): void {
    this.props.isActive = true
    this.updateTimestamp()
  }

  public deactivate(): void {
    this.props.isActive = false
    this.updateTimestamp()
  }

  private updateTimestamp(): void {
    this.props.updatedAt = new Date()
  }

  /**
   * Create a new Report entity
   */
  public static create(
    id: string,
    props: {
      name: ReportName
      type: ReportType
      description: string
      format: ReportFormat
      filter?: ReportFilter
      schedule?: ReportSchedule
      templateId?: string
      isActive?: boolean
      createdBy: string
      createdAt?: Date
    }
  ): Result<Report, Error> {
    // Validate required properties
    if (!props.name) {
      return Result.fail<Report>(new Error('Report name is required'))
    }

    if (!props.type) {
      return Result.fail<Report>(new Error('Report type is required'))
    }

    if (!props.description) {
      return Result.fail<Report>(new Error('Report description is required'))
    }

    if (props.description.length > 1000) {
      return Result.fail<Report>(new Error('Report description cannot exceed 1000 characters'))
    }

    if (!props.format) {
      return Result.fail<Report>(new Error('Report format is required'))
    }

    if (!props.createdBy) {
      return Result.fail<Report>(new Error('Created by user ID is required'))
    }

    // Create report with provided or default values
    const report = new Report(id, {
      name: props.name,
      type: props.type,
      description: props.description,
      format: props.format,
      filter: props.filter,
      schedule: props.schedule,
      templateId: props.templateId,
      isActive: props.isActive ?? true,
      createdBy: props.createdBy,
      createdAt: props.createdAt ?? new Date(),
    })

    return Result.ok<Report>(report)
  }
}
