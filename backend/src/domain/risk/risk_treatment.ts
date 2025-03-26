import { Entity } from '../common/entity';
import { Result } from '../common/result';
import { TreatmentType, TreatmentStatus } from './risk_values';

/**
 * Risk treatment properties interface
 */
export interface RiskTreatmentProps {
  riskId: string;
  name: string;
  description: string;
  type: TreatmentType;
  status: TreatmentStatus;
  dueDate?: Date;
  completedDate?: Date;
  assignee?: string;
  cost?: number;
  relatedControlIds?: string[];
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * RiskTreatment entity representing a plan to address a risk
 */
export class RiskTreatment extends Entity<RiskTreatmentProps> {
  private readonly props: RiskTreatmentProps;

  private constructor(id: string, props: RiskTreatmentProps) {
    super(id);
    this.props = props;
  }

  // Getters
  get riskId(): string {
    return this.props.riskId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get type(): TreatmentType {
    return this.props.type;
  }

  get status(): TreatmentStatus {
    return this.props.status;
  }

  get dueDate(): Date | undefined {
    return this.props.dueDate ? new Date(this.props.dueDate) : undefined;
  }

  get completedDate(): Date | undefined {
    return this.props.completedDate ? new Date(this.props.completedDate) : undefined;
  }

  get assignee(): string | undefined {
    return this.props.assignee;
  }

  get cost(): number | undefined {
    return this.props.cost;
  }

  get relatedControlIds(): string[] | undefined {
    return this.props.relatedControlIds ? [...this.props.relatedControlIds] : undefined;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get updatedBy(): string | undefined {
    return this.props.updatedBy;
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt ? new Date(this.props.updatedAt) : undefined;
  }

  /**
   * Check if a treatment is overdue
   */
  public isOverdue(asOfDate: Date = new Date()): boolean {
    if (!this.props.dueDate) {
      return false;
    }

    // Only check treatments that are not completed or cancelled
    if (this.props.status === TreatmentStatus.IMPLEMENTED ||
        this.props.status === TreatmentStatus.VERIFIED ||
        this.props.status === TreatmentStatus.CANCELLED) {
      return false;
    }

    return asOfDate > this.props.dueDate;
  }

  /**
   * Calculate progress percentage based on treatment status
   */
  public getProgressPercentage(): number {
    const statusMap: Record<TreatmentStatus, number> = {
      [TreatmentStatus.PLANNED]: 10,
      [TreatmentStatus.IN_PROGRESS]: 50,
      [TreatmentStatus.IMPLEMENTED]: 90,
      [TreatmentStatus.VERIFIED]: 100,
      [TreatmentStatus.INEFFECTIVE]: 0,
      [TreatmentStatus.CANCELLED]: 0
    };

    return statusMap[this.props.status];
  }

  // Business methods
  public updateDescription(description: string, userId: string): Result<void, Error> {
    if (!description || description.trim().length === 0) {
      return Result.fail<void>(new Error('Description cannot be empty'));
    }

    if (description.length > 1000) {
      return Result.fail<void>(new Error('Description cannot exceed 1000 characters'));
    }

    this.props.description = description;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public updateStatus(status: TreatmentStatus, userId: string): Result<void, Error> {
    // Handle completed date when status changes to implemented or verified
    if ((status === TreatmentStatus.IMPLEMENTED || status === TreatmentStatus.VERIFIED)
        && !this.props.completedDate) {
      this.props.completedDate = new Date();
    }

    // If moving back to a non-complete status, clear the completed date
    if (status === TreatmentStatus.PLANNED || status === TreatmentStatus.IN_PROGRESS) {
      this.props.completedDate = undefined;
    }

    this.props.status = status;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public setDueDate(dueDate: Date | undefined, userId: string): Result<void, Error> {
    this.props.dueDate = dueDate;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public assignTo(assigneeId: string | undefined, userId: string): Result<void, Error> {
    this.props.assignee = assigneeId;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public setCost(cost: number | undefined, userId: string): Result<void, Error> {
    if (cost !== undefined && cost < 0) {
      return Result.fail<void>(new Error('Cost cannot be negative'));
    }

    this.props.cost = cost;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public linkControl(controlId: string, userId: string): Result<void, Error> {
    if (!controlId) {
      return Result.fail<void>(new Error('Control ID is required'));
    }

    if (!this.props.relatedControlIds) {
      this.props.relatedControlIds = [];
    }

    if (this.props.relatedControlIds.includes(controlId)) {
      return Result.fail<void>(new Error(`Treatment is already linked to control ${controlId}`));
    }

    this.props.relatedControlIds.push(controlId);
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public unlinkControl(controlId: string, userId: string): Result<void, Error> {
    if (!this.props.relatedControlIds || !this.props.relatedControlIds.includes(controlId)) {
      return Result.fail<void>(new Error(`Treatment is not linked to control ${controlId}`));
    }

    this.props.relatedControlIds = this.props.relatedControlIds.filter(id => id !== controlId);
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public activate(): void {
    this.props.isActive = true;
    this.updateTimestamp();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.updateTimestamp();
  }

  private updateTimestamp(): void {
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new RiskTreatment entity
   */
  public static create(
    id: string,
    props: {
      riskId: string;
      name: string;
      description: string;
      type: TreatmentType;
      status?: TreatmentStatus;
      dueDate?: Date;
      completedDate?: Date;
      assignee?: string;
      cost?: number;
      relatedControlIds?: string[];
      isActive?: boolean;
      createdBy: string;
      createdAt?: Date;
    }
  ): Result<RiskTreatment, Error> {
    // Validate required properties
    if (!props.riskId) {
      return Result.fail<RiskTreatment>(new Error('Risk ID is required'));
    }

    if (!props.name) {
      return Result.fail<RiskTreatment>(new Error('Treatment name is required'));
    }

    if (props.name.length > 200) {
      return Result.fail<RiskTreatment>(new Error('Treatment name cannot exceed 200 characters'));
    }

    if (!props.description) {
      return Result.fail<RiskTreatment>(new Error('Treatment description is required'));
    }

    if (props.description.length > 1000) {
      return Result.fail<RiskTreatment>(new Error('Treatment description cannot exceed 1000 characters'));
    }

    if (!props.type) {
      return Result.fail<RiskTreatment>(new Error('Treatment type is required'));
    }

    if (!props.createdBy) {
      return Result.fail<RiskTreatment>(new Error('Created by user ID is required'));
    }

    if (props.cost !== undefined && props.cost < 0) {
      return Result.fail<RiskTreatment>(new Error('Cost cannot be negative'));
    }

    // Create RiskTreatment with provided or default values
    const treatment = new RiskTreatment(id, {
      riskId: props.riskId,
      name: props.name,
      description: props.description,
      type: props.type,
      status: props.status ?? TreatmentStatus.PLANNED,
      dueDate: props.dueDate,
      completedDate: props.completedDate,
      assignee: props.assignee,
      cost: props.cost,
      relatedControlIds: props.relatedControlIds ? [...props.relatedControlIds] : undefined,
      isActive: props.isActive ?? true,
      createdBy: props.createdBy,
      createdAt: props.createdAt ?? new Date(),
    });

    return Result.ok<RiskTreatment>(treatment);
  }
}
