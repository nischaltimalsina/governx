import { Entity } from '../common/entity'
import { Result } from '../common/result'
import { AuditName, AuditType, AuditStatus, AuditorInfo, SchedulePeriod } from './audit_values'

/**
 * Audit properties interface
 */
export interface AuditProps {
  name: AuditName
  type: AuditType
  status: AuditStatus
  description: string
  frameworkIds: string[]
  leadAuditor: AuditorInfo
  auditTeam?: AuditorInfo[]
  schedule: SchedulePeriod
  scope?: string
  methodology?: string
  isActive: boolean
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt?: Date
}

/**
 * Audit entity representing an audit activity
 */
export class Audit extends Entity<AuditProps> {
  private readonly props: AuditProps

  private constructor(id: string, props: AuditProps) {
    super(id)
    this.props = props
  }

  // Getters
  get name(): AuditName {
    return this.props.name
  }

  get type(): AuditType {
    return this.props.type
  }

  get status(): AuditStatus {
    return this.props.status
  }

  get description(): string {
    return this.props.description
  }

  get frameworkIds(): string[] {
    return [...this.props.frameworkIds]
  }

  get leadAuditor(): AuditorInfo {
    return this.props.leadAuditor
  }

  get auditTeam(): AuditorInfo[] | undefined {
    return this.props.auditTeam ? [...this.props.auditTeam] : undefined
  }

  get schedule(): SchedulePeriod {
    return this.props.schedule
  }

  get scope(): string | undefined {
    return this.props.scope
  }

  get methodology(): string | undefined {
    return this.props.methodology
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

    if (description.length > 2000) {
      return Result.fail<void>(new Error('Description cannot exceed 2000 characters'))
    }

    this.props.description = description
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateStatus(status: AuditStatus, userId: string): Result<void, Error> {
    // Validate status transitions
    if (this.props.status === AuditStatus.CANCELLED && status !== AuditStatus.PLANNED) {
      return Result.fail<void>(
        new Error('A cancelled audit can only be moved back to planned status')
      )
    }

    if (
      this.props.status === AuditStatus.COMPLETED &&
      status !== AuditStatus.UNDER_REVIEW &&
      status !== AuditStatus.CANCELLED
    ) {
      return Result.fail<void>(
        new Error('A completed audit can only be moved to under review or cancelled')
      )
    }

    this.props.status = status
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateSchedule(schedule: SchedulePeriod, userId: string): Result<void, Error> {
    this.props.schedule = schedule
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateScope(scope: string, userId: string): Result<void, Error> {
    if (scope && scope.length > 5000) {
      return Result.fail<void>(new Error('Scope cannot exceed 5000 characters'))
    }

    this.props.scope = scope
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateMethodology(methodology: string, userId: string): Result<void, Error> {
    if (methodology && methodology.length > 5000) {
      return Result.fail<void>(new Error('Methodology cannot exceed 5000 characters'))
    }

    this.props.methodology = methodology
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateAuditTeam(
    auditTeam: AuditorInfo[] | undefined,
    userId: string
  ): Result<void, Error> {
    this.props.auditTeam = auditTeam
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateLeadAuditor(leadAuditor: AuditorInfo, userId: string): Result<void, Error> {
    this.props.leadAuditor = leadAuditor
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateFrameworks(frameworkIds: string[], userId: string): Result<void, Error> {
    if (!frameworkIds || frameworkIds.length === 0) {
      return Result.fail<void>(new Error('At least one framework must be specified'))
    }

    this.props.frameworkIds = frameworkIds
    this.props.updatedBy = userId
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
   * Create a new Audit entity
   */
  public static create(
    id: string,
    props: {
      name: AuditName
      type: AuditType
      description: string
      frameworkIds: string[]
      leadAuditor: AuditorInfo
      schedule: SchedulePeriod
      auditTeam?: AuditorInfo[]
      scope?: string
      methodology?: string
      status?: AuditStatus
      isActive?: boolean
      createdBy: string
      createdAt?: Date
    }
  ): Result<Audit, Error> {
    // Validate required properties
    if (!props.name) {
      return Result.fail<Audit>(new Error('Audit name is required'))
    }

    if (!props.type) {
      return Result.fail<Audit>(new Error('Audit type is required'))
    }

    if (!props.description) {
      return Result.fail<Audit>(new Error('Audit description is required'))
    }

    if (props.description.length > 2000) {
      return Result.fail<Audit>(new Error('Audit description cannot exceed 2000 characters'))
    }

    if (!props.frameworkIds || props.frameworkIds.length === 0) {
      return Result.fail<Audit>(new Error('At least one framework must be specified'))
    }

    if (!props.leadAuditor) {
      return Result.fail<Audit>(new Error('Lead auditor is required'))
    }

    if (!props.schedule) {
      return Result.fail<Audit>(new Error('Audit schedule is required'))
    }

    if (!props.createdBy) {
      return Result.fail<Audit>(new Error('Created by is required'))
    }

    if (props.scope && props.scope.length > 5000) {
      return Result.fail<Audit>(new Error('Scope cannot exceed 5000 characters'))
    }

    if (props.methodology && props.methodology.length > 5000) {
      return Result.fail<Audit>(new Error('Methodology cannot exceed 5000 characters'))
    }

    // Create audit with provided or default values
    const audit = new Audit(id, {
      name: props.name,
      type: props.type,
      status: props.status ?? AuditStatus.PLANNED,
      description: props.description,
      frameworkIds: props.frameworkIds,
      leadAuditor: props.leadAuditor,
      auditTeam: props.auditTeam,
      schedule: props.schedule,
      scope: props.scope,
      methodology: props.methodology,
      isActive: props.isActive ?? true,
      createdBy: props.createdBy,
      createdAt: props.createdAt ?? new Date(),
    })

    return Result.ok<Audit>(audit)
  }
}
