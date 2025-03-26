import { Entity } from '../common/entity';
import { Result } from '../common/result';
import { ControlCode, ControlTitle, ImplementationStatus } from './framework_values';

/**
 * Control properties interface
 */
export interface ControlProps {
  frameworkId: string;
  code: ControlCode;
  title: ControlTitle;
  description: string;
  guidance?: string;
  implementationStatus: ImplementationStatus;
  implementationDetails?: string;
  ownerId?: string;
  categories?: string[];
  parentControlId?: string;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Control entity representing a compliance control within a framework
 * Examples: AC-1 (Access Control Policy), SOC2.CC5.1 (Control Activities)
 */
export class Control extends Entity<ControlProps> {
  private readonly props: ControlProps;

  private constructor(id: string, props: ControlProps) {
    super(id);
    this.props = props;
  }

  // Getters
  get frameworkId(): string {
    return this.props.frameworkId;
  }

  get code(): ControlCode {
    return this.props.code;
  }

  get title(): ControlTitle {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get guidance(): string | undefined {
    return this.props.guidance;
  }

  get implementationStatus(): ImplementationStatus {
    return this.props.implementationStatus;
  }

  get implementationDetails(): string | undefined {
    return this.props.implementationDetails;
  }

  get ownerId(): string | undefined {
    return this.props.ownerId;
  }

  get categories(): string[] | undefined {
    return this.props.categories ? [...this.props.categories] : undefined;
  }

  get parentControlId(): string | undefined {
    return this.props.parentControlId;
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
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  // Business methods
  public activate(): void {
    this.props.isActive = true;
    this.updateTimestamp();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.updateTimestamp();
  }

  public updateImplementationStatus(
    status: ImplementationStatus,
    details: string | undefined,
    userId: string
  ): Result<void, Error> {
    this.props.implementationStatus = status;
    this.props.implementationDetails = details;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public updateDescription(description: string, userId: string): Result<void, Error> {
    if (!description || description.trim().length === 0) {
      return Result.fail<void>(new Error('Description cannot be empty'));
    }

    if (description.length > 2000) {
      return Result.fail<void>(new Error('Description cannot exceed 2000 characters'));
    }

    this.props.description = description;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public updateGuidance(guidance: string | undefined, userId: string): Result<void, Error> {
    if (guidance && guidance.length > 5000) {
      return Result.fail<void>(new Error('Guidance cannot exceed 5000 characters'));
    }

    this.props.guidance = guidance;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public assignOwner(ownerId: string | undefined, userId: string): Result<void, Error> {
    this.props.ownerId = ownerId;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public updateCategories(categories: string[] | undefined, userId: string): Result<void, Error> {
    if (categories) {
      // Ensure categories are unique
      this.props.categories = [...new Set(categories)];
    } else {
      this.props.categories = undefined;
    }

    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  private updateTimestamp(): void {
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new Control entity
   */
  public static create(
    id: string,
    props: {
      frameworkId: string;
      code: ControlCode;
      title: ControlTitle;
      description: string;
      guidance?: string;
      implementationStatus?: ImplementationStatus;
      implementationDetails?: string;
      ownerId?: string;
      categories?: string[];
      parentControlId?: string;
      isActive?: boolean;
      createdBy: string;
      createdAt?: Date;
    }
  ): Result<Control, Error> {
    // Validate required properties
    if (!props.frameworkId) {
      return Result.fail<Control>(new Error('Framework ID is required'));
    }

    if (!props.code) {
      return Result.fail<Control>(new Error('Control code is required'));
    }

    if (!props.title) {
      return Result.fail<Control>(new Error('Control title is required'));
    }

    if (!props.description) {
      return Result.fail<Control>(new Error('Control description is required'));
    }

    if (props.description.length > 2000) {
      return Result.fail<Control>(new Error('Control description cannot exceed 2000 characters'));
    }

    if (props.guidance && props.guidance.length > 5000) {
      return Result.fail<Control>(new Error('Control guidance cannot exceed 5000 characters'));
    }

    if (!props.createdBy) {
      return Result.fail<Control>(new Error('Created by user ID is required'));
    }

    // Create control with provided or default values
    const control = new Control(id, {
      frameworkId: props.frameworkId,
      code: props.code,
      title: props.title,
      description: props.description,
      guidance: props.guidance,
      implementationStatus: props.implementationStatus ?? ImplementationStatus.NOT_IMPLEMENTED,
      implementationDetails: props.implementationDetails,
      ownerId: props.ownerId,
      categories: props.categories,
      parentControlId: props.parentControlId,
      isActive: props.isActive ?? true,
      createdBy: props.createdBy,
      createdAt: props.createdAt ?? new Date(),
    });

    return Result.ok<Control>(control);
  }
}
