import { Entity } from '../common/entity';
import { Result } from '../common/result';
import {
  PolicyName,
  PolicyVersion,
  PolicyType,
  PolicyStatus,
  PolicyFormat,
  PolicyApprover,
  EffectiveDate
} from './policy_values';

/**
 * Policy properties interface
 */
export interface PolicyProps {
  name: PolicyName;
  version: PolicyVersion;
  type: PolicyType;
  status: PolicyStatus;
  description: string;
  content?: string;
  documentUrl?: string;
  documentPath?: string;
  documentFormat?: PolicyFormat;
  relatedControlIds?: string[];
  owner: string; // User ID of the policy owner
  approvers?: PolicyApprover[];
  effectiveDate?: EffectiveDate;
  reviewDate?: Date;
  tags?: string[];
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Policy entity representing a compliance policy document
 */
export class Policy extends Entity<PolicyProps> {
  private readonly props: PolicyProps;

  private constructor(id: string, props: PolicyProps) {
    super(id);
    this.props = props;
  }

  // Getters
  get name(): PolicyName {
    return this.props.name;
  }

  get version(): PolicyVersion {
    return this.props.version;
  }

  get type(): PolicyType {
    return this.props.type;
  }

  get status(): PolicyStatus {
    return this.props.status;
  }

  get description(): string {
    return this.props.description;
  }

  get content(): string | undefined {
    return this.props.content;
  }

  get documentUrl(): string | undefined {
    return this.props.documentUrl;
  }

  get documentPath(): string | undefined {
    return this.props.documentPath;
  }

  get documentFormat(): PolicyFormat | undefined {
    return this.props.documentFormat;
  }

  get relatedControlIds(): string[] | undefined {
    return this.props.relatedControlIds ? [...this.props.relatedControlIds] : undefined;
  }

  get owner(): string {
    return this.props.owner;
  }

  get approvers(): PolicyApprover[] | undefined {
    return this.props.approvers ? [...this.props.approvers] : undefined;
  }

  get effectiveDate(): EffectiveDate | undefined {
    return this.props.effectiveDate;
  }

  get reviewDate(): Date | undefined {
    return this.props.reviewDate ? new Date(this.props.reviewDate) : undefined;
  }

  get tags(): string[] | undefined {
    return this.props.tags ? [...this.props.tags] : undefined;
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

  // Calculate if policy is effective as of a specific date
  public isEffective(atDate: Date = new Date()): boolean {
    if (!this.props.effectiveDate) {
      return false;
    }

    return this.props.effectiveDate.isEffective(atDate);
  }

  // Calculate if policy is due for review
  public isReviewDue(asOfDate: Date = new Date()): boolean {
    if (!this.props.reviewDate) {
      return false;
    }

    return asOfDate >= this.props.reviewDate;
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

  public updateContent(content: string, userId: string): Result<void, Error> {
    this.props.content = content;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public updateStatus(status: PolicyStatus, userId: string): Result<void, Error> {
    // Validate status transitions
    if (this.props.status === PolicyStatus.DRAFT && status === PolicyStatus.PUBLISHED) {
      return Result.fail<void>(new Error('Cannot publish a policy directly from draft status. It must be reviewed and approved first.'));
    }

    if (this.props.status === PolicyStatus.ARCHIVED && status !== PolicyStatus.DRAFT) {
      return Result.fail<void>(new Error('An archived policy can only be restored to draft status.'));
    }

    if (status === PolicyStatus.APPROVED && (!this.props.approvers || this.props.approvers.length === 0)) {
      return Result.fail<void>(new Error('Cannot approve a policy without approvers.'));
    }

    this.props.status = status;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public addApprover(approver: PolicyApprover, userId: string): Result<void, Error> {
    if (!this.props.approvers) {
      this.props.approvers = [];
    }

    // Check if approver already exists
    if (this.props.approvers.some(a => a.getUserId() === approver.getUserId())) {
      return Result.fail<void>(new Error('Approver has already approved this policy'));
    }

    this.props.approvers.push(approver);
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public setEffectiveDate(effectiveDate: EffectiveDate, userId: string): Result<void, Error> {
    this.props.effectiveDate = effectiveDate;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public setReviewDate(reviewDate: Date, userId: string): Result<void, Error> {
    if (reviewDate < new Date()) {
      return Result.fail<void>(new Error('Review date cannot be in the past'));
    }

    this.props.reviewDate = reviewDate;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public setOwner(ownerId: string, userId: string): Result<void, Error> {
    if (!ownerId) {
      return Result.fail<void>(new Error('Owner ID is required'));
    }

    this.props.owner = ownerId;
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
      return Result.fail<void>(new Error(`Policy is already linked to control ${controlId}`));
    }

    this.props.relatedControlIds.push(controlId);
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public unlinkControl(controlId: string, userId: string): Result<void, Error> {
    if (!this.props.relatedControlIds || !this.props.relatedControlIds.includes(controlId)) {
      return Result.fail<void>(new Error(`Policy is not linked to control ${controlId}`));
    }

    this.props.relatedControlIds = this.props.relatedControlIds.filter(id => id !== controlId);
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public updateTags(tags: string[] | undefined, userId: string): Result<void, Error> {
    if (tags) {
      // Ensure tags are unique
      this.props.tags = [...new Set(tags)];
    } else {
      this.props.tags = undefined;
    }

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

  public archive(userId: string): Result<void, Error> {
    if (this.props.status === PolicyStatus.ARCHIVED) {
      return Result.fail<void>(new Error('Policy is already archived'));
    }

    this.props.status = PolicyStatus.ARCHIVED;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  private updateTimestamp(): void {
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new Policy entity
   */
  public static create(
    id: string,
    props: {
      name: PolicyName;
      version: PolicyVersion;
      type: PolicyType;
      status?: PolicyStatus;
      description: string;
      content?: string;
      documentUrl?: string;
      documentPath?: string;
      documentFormat?: PolicyFormat;
      relatedControlIds?: string[];
      owner: string;
      approvers?: PolicyApprover[];
      effectiveDate?: EffectiveDate;
      reviewDate?: Date;
      tags?: string[];
      isActive?: boolean;
      createdBy: string;
      createdAt?: Date;
    }
  ): Result<Policy, Error> {
    // Validate required properties
    if (!props.name) {
      return Result.fail<Policy>(new Error('Policy name is required'));
    }

    if (!props.version) {
      return Result.fail<Policy>(new Error('Policy version is required'));
    }

    if (!props.type) {
      return Result.fail<Policy>(new Error('Policy type is required'));
    }

    if (!props.description) {
      return Result.fail<Policy>(new Error('Policy description is required'));
    }

    if (props.description.length > 1000) {
      return Result.fail<Policy>(new Error('Policy description cannot exceed 1000 characters'));
    }

    if (!props.owner) {
      return Result.fail<Policy>(new Error('Policy owner is required'));
    }

    if (!props.createdBy) {
      return Result.fail<Policy>(new Error('Created by user ID is required'));
    }

    // Validate that either content or document info is provided
    if (!props.content && !props.documentUrl && !props.documentPath) {
      return Result.fail<Policy>(new Error('Either content or document information (URL or path) must be provided'));
    }

    // If document path/url is provided, format should be provided too
    if ((props.documentUrl || props.documentPath) && !props.documentFormat) {
      return Result.fail<Policy>(new Error('Document format is required when document URL or path is provided'));
    }

    // Validate review date is in the future
    if (props.reviewDate && props.reviewDate < new Date()) {
      return Result.fail<Policy>(new Error('Review date cannot be in the past'));
    }

    // Create policy with provided or default values
    const policy = new Policy(id, {
      name: props.name,
      version: props.version,
      type: props.type,
      status: props.status ?? PolicyStatus.DRAFT,
      description: props.description,
      content: props.content,
      documentUrl: props.documentUrl,
      documentPath: props.documentPath,
      documentFormat: props.documentFormat,
      relatedControlIds: props.relatedControlIds ? [...props.relatedControlIds] : undefined,
      owner: props.owner,
      approvers: props.approvers ? [...props.approvers] : undefined,
      effectiveDate: props.effectiveDate,
      reviewDate: props.reviewDate,
      tags: props.tags ? [...new Set(props.tags)] : undefined,
      isActive: props.isActive ?? true,
      createdBy: props.createdBy,
      createdAt: props.createdAt ?? new Date(),
    });

    return Result.ok<Policy>(policy);
  }
}
