import { Entity } from '../common/entity'
import { Result } from '../common/result'
import {
  FindingTitle,
  FindingType,
  FindingSeverity,
  FindingStatus,
  RemediationPlan,
} from './audit_values'

/**
 * Finding properties interface
 */
export interface FindingProps {
  auditId: string
  title: FindingTitle
  description: string
  type: FindingType
  severity: FindingSeverity
  status: FindingStatus
  controlIds?: string[]
  evidenceIds?: string[]
  remediationPlan?: RemediationPlan
  dueDate?: Date
  isActive: boolean
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt?: Date
}

/**
 * Finding entity representing an issue identified during an audit
 */
export class Finding extends Entity<FindingProps> {
  private readonly props: FindingProps

  private constructor(id: string, props: FindingProps) {
    super(id)
    this.props = props
  }

  // Getters
  get auditId(): string {
    return this.props.auditId
  }

  get title(): FindingTitle {
    return this.props.title
  }

  get description(): string {
    return this.props.description
  }

  get type(): FindingType {
    return this.props.type
  }

  get severity(): FindingSeverity {
    return this.props.severity
  }

  get status(): FindingStatus {
    return this.props.status
  }

  get controlIds(): string[] | undefined {
    return this.props.controlIds ? [...this.props.controlIds] : undefined
  }

  get evidenceIds(): string[] | undefined {
    return this.props.evidenceIds ? [...this.props.evidenceIds] : undefined
  }

  get remediationPlan(): RemediationPlan | undefined {
    return this.props.remediationPlan
  }

  get dueDate(): Date | undefined {
    return this.props.dueDate ? new Date(this.props.dueDate) : undefined
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

  /**
   * Check if the finding is overdue
   */
  public isOverdue(asOfDate: Date = new Date()): boolean {
    if (!this.props.dueDate) {
      return false
    }

    if (
      this.props.status === FindingStatus.CLOSED ||
      this.props.status === FindingStatus.VERIFIED ||
      this.props.status === FindingStatus.ACCEPTED
    ) {
      return false
    }

    return this.props.dueDate < asOfDate
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

  public updateStatus(status: FindingStatus, userId: string): Result<void, Error> {
    // Validate status transitions
    if (
      this.props.status === FindingStatus.CLOSED &&
      status !== FindingStatus.OPEN &&
      status !== FindingStatus.ACCEPTED
    ) {
      return Result.fail<void>(new Error('A closed finding can only be reopened or accepted'))
    }

    this.props.status = status
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateSeverity(severity: FindingSeverity, userId: string): Result<void, Error> {
    this.props.severity = severity
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateType(type: FindingType, userId: string): Result<void, Error> {
    this.props.type = type
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateRemediationPlan(
    remediationPlan: RemediationPlan | undefined,
    userId: string
  ): Result<void, Error> {
    this.props.remediationPlan = remediationPlan
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateDueDate(dueDate: Date | undefined, userId: string): Result<void, Error> {
    this.props.dueDate = dueDate
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateControlIds(controlIds: string[] | undefined, userId: string): Result<void, Error> {
    this.props.controlIds = controlIds
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateEvidenceIds(evidenceIds: string[] | undefined, userId: string): Result<void, Error> {
    this.props.evidenceIds = evidenceIds
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
   * Create a new Finding entity
   */
  public static create(
    id: string,
    props: {
      auditId: string
      title: FindingTitle
      description: string
      type: FindingType
      severity: FindingSeverity
      controlIds?: string[]
      evidenceIds?: string[]
      remediationPlan?: RemediationPlan
      dueDate?: Date
      status?: FindingStatus
      isActive?: boolean
      createdBy: string
      createdAt?: Date
    }
  ): Result<Finding, Error> {
    // Validate required properties
    if (!props.auditId) {
      return Result.fail<Finding>(new Error('Audit ID is required'))
    }

    if (!props.title) {
      return Result.fail<Finding>(new Error('Finding title is required'))
    }

    if (!props.description) {
      return Result.fail<Finding>(new Error('Finding description is required'))
    }

    if (props.description.length > 2000) {
      return Result.fail<Finding>(new Error('Finding description cannot exceed 2000 characters'))
    }

    if (!props.type) {
      return Result.fail<Finding>(new Error('Finding type is required'))
    }

    if (!props.severity) {
      return Result.fail<Finding>(new Error('Finding severity is required'))
    }

    if (!props.createdBy) {
      return Result.fail<Finding>(new Error('Created by is required'))
    }

    // Create finding with provided or default values
    const finding = new Finding(id, {
      auditId: props.auditId,
      title: props.title,
      description: props.description,
      type: props.type,
      severity: props.severity,
      status: props.status ?? FindingStatus.OPEN,
      controlIds: props.controlIds,
      evidenceIds: props.evidenceIds,
      remediationPlan: props.remediationPlan,
      dueDate: props.dueDate,
      isActive: props.isActive ?? true,
      createdBy: props.createdBy,
      createdAt: props.createdAt ?? new Date(),
    })

    return Result.ok<Finding>(finding)
  }
}
