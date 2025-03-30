import { Result } from '../common/result'

/**
 * AuditType enum represents the type of audit
 */
export enum AuditType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  CERTIFICATION = 'certification',
  REGULATORY = 'regulatory',
  VENDOR = 'vendor',
  CUSTOM = 'custom',
}

/**
 * AuditStatus enum represents the current status of an audit
 */
export enum AuditStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  UNDER_REVIEW = 'under_review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * FindingType enum represents the type of audit finding
 */
export enum FindingType {
  NONCONFORMITY = 'nonconformity',
  OBSERVATION = 'observation',
  OPPORTUNITY = 'opportunity',
  RECOMMENDATION = 'recommendation',
}

/**
 * FindingSeverity enum represents the severity of audit findings
 */
export enum FindingSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFORMATIONAL = 'informational',
}

/**
 * FindingStatus enum represents the status of audit findings
 */
export enum FindingStatus {
  OPEN = 'open',
  IN_REMEDIATION = 'in_remediation',
  REMEDIATED = 'remediated',
  VERIFIED = 'verified',
  ACCEPTED = 'accepted',
  DEFERRED = 'deferred',
  CLOSED = 'closed',
}

/**
 * AuditName value object represents the name of an audit
 */
export class AuditName {
  private readonly value: string

  private constructor(name: string) {
    this.value = name
  }

  public getValue(): string {
    return this.value
  }

  public static create(name: string): Result<AuditName, Error> {
    if (!name) {
      return Result.fail<AuditName>(new Error('Audit name cannot be empty'))
    }

    if (name.length < 3) {
      return Result.fail<AuditName>(new Error('Audit name must be at least 3 characters'))
    }

    if (name.length > 200) {
      return Result.fail<AuditName>(new Error('Audit name cannot exceed 200 characters'))
    }

    return Result.ok<AuditName>(new AuditName(name))
  }
}

/**
 * FindingTitle value object represents the title of an audit finding
 */
export class FindingTitle {
  private readonly value: string

  private constructor(title: string) {
    this.value = title
  }

  public getValue(): string {
    return this.value
  }

  public static create(title: string): Result<FindingTitle, Error> {
    if (!title) {
      return Result.fail<FindingTitle>(new Error('Finding title cannot be empty'))
    }

    if (title.length < 3) {
      return Result.fail<FindingTitle>(new Error('Finding title must be at least 3 characters'))
    }

    if (title.length > 200) {
      return Result.fail<FindingTitle>(new Error('Finding title cannot exceed 200 characters'))
    }

    return Result.ok<FindingTitle>(new FindingTitle(title))
  }
}

/**
 * AuditorInfo value object represents information about an auditor
 */
export class AuditorInfo {
  private readonly id: string
  private readonly name: string
  private readonly organization?: string
  private readonly role?: string
  private readonly isExternal: boolean

  private constructor(
    id: string,
    name: string,
    isExternal: boolean,
    organization?: string,
    role?: string
  ) {
    this.id = id
    this.name = name
    this.organization = organization
    this.role = role
    this.isExternal = isExternal
  }

  public getId(): string {
    return this.id
  }

  public getName(): string {
    return this.name
  }

  public getOrganization(): string | undefined {
    return this.organization
  }

  public getRole(): string | undefined {
    return this.role
  }

  public getIsExternal(): boolean {
    return this.isExternal
  }

  public static create(
    id: string,
    name: string,
    isExternal: boolean,
    organization?: string,
    role?: string
  ): Result<AuditorInfo, Error> {
    if (!id) {
      return Result.fail<AuditorInfo>(new Error('Auditor ID is required'))
    }

    if (!name) {
      return Result.fail<AuditorInfo>(new Error('Auditor name is required'))
    }

    // External auditors should have an organization
    if (isExternal && !organization) {
      return Result.fail<AuditorInfo>(new Error('Organization is required for external auditors'))
    }

    return Result.ok<AuditorInfo>(new AuditorInfo(id, name, isExternal, organization, role))
  }
}

/**
 * SchedulePeriod value object represents the period of an audit
 */
export class SchedulePeriod {
  private readonly startDate: Date
  private readonly endDate: Date

  private constructor(startDate: Date, endDate: Date) {
    this.startDate = startDate
    this.endDate = endDate
  }

  public getStartDate(): Date {
    return new Date(this.startDate)
  }

  public getEndDate(): Date {
    return new Date(this.endDate)
  }

  public getDurationInDays(): number {
    const diff = this.endDate.getTime() - this.startDate.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  public static create(startDate: Date, endDate: Date): Result<SchedulePeriod, Error> {
    if (!startDate) {
      return Result.fail<SchedulePeriod>(new Error('Start date is required'))
    }

    if (!endDate) {
      return Result.fail<SchedulePeriod>(new Error('End date is required'))
    }

    if (startDate > endDate) {
      return Result.fail<SchedulePeriod>(new Error('End date must be after start date'))
    }

    return Result.ok<SchedulePeriod>(new SchedulePeriod(startDate, endDate))
  }
}

/**
 * RemediationPlan value object represents a plan to address an audit finding
 */
export class RemediationPlan {
  private readonly description: string
  private readonly dueDate: Date
  private readonly assignee: string
  private readonly status: FindingStatus
  private readonly lastUpdated: Date
  private readonly updatedBy: string

  private constructor(
    description: string,
    dueDate: Date,
    assignee: string,
    status: FindingStatus,
    lastUpdated: Date,
    updatedBy: string
  ) {
    this.description = description
    this.dueDate = dueDate
    this.assignee = assignee
    this.status = status
    this.lastUpdated = lastUpdated
    this.updatedBy = updatedBy
  }

  public getDescription(): string {
    return this.description
  }

  public getDueDate(): Date {
    return new Date(this.dueDate)
  }

  public getAssignee(): string {
    return this.assignee
  }

  public getStatus(): FindingStatus {
    return this.status
  }

  public getLastUpdated(): Date {
    return new Date(this.lastUpdated)
  }

  public getUpdatedBy(): string {
    return this.updatedBy
  }

  public isOverdue(asOfDate: Date = new Date()): boolean {
    return (
      this.dueDate < asOfDate &&
      this.status !== FindingStatus.REMEDIATED &&
      this.status !== FindingStatus.VERIFIED &&
      this.status !== FindingStatus.CLOSED
    )
  }

  public static create(
    description: string,
    dueDate: Date,
    assignee: string,
    status: FindingStatus = FindingStatus.OPEN,
    updatedBy: string
  ): Result<RemediationPlan, Error> {
    if (!description) {
      return Result.fail<RemediationPlan>(new Error('Remediation plan description is required'))
    }

    if (!dueDate) {
      return Result.fail<RemediationPlan>(new Error('Due date is required'))
    }

    if (!assignee) {
      return Result.fail<RemediationPlan>(new Error('Assignee is required'))
    }

    if (!updatedBy) {
      return Result.fail<RemediationPlan>(new Error('Updated by is required'))
    }

    return Result.ok<RemediationPlan>(
      new RemediationPlan(description, dueDate, assignee, status, new Date(), updatedBy)
    )
  }

  public static update(
    existing: RemediationPlan,
    updates: {
      description?: string
      dueDate?: Date
      assignee?: string
      status?: FindingStatus
    },
    updatedBy: string
  ): Result<RemediationPlan, Error> {
    if (!updatedBy) {
      return Result.fail<RemediationPlan>(new Error('Updated by is required'))
    }

    return Result.ok<RemediationPlan>(
      new RemediationPlan(
        updates.description || existing.description,
        updates.dueDate || existing.dueDate,
        updates.assignee || existing.assignee,
        updates.status || existing.status,
        new Date(),
        updatedBy
      )
    )
  }
}

/**
 * AuditTemplate interface for reusable audit templates
 */
export interface AuditTemplate {
  id: string
  name: string
  description: string
  type: AuditType
  frameworkIds?: string[]
  controlIds?: string[]
  checklistItems?: {
    id: string
    description: string
    category?: string
    required: boolean
  }[]
  isActive: boolean
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt?: Date
}
