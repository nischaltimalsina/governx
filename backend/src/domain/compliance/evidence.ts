import { Entity } from '../common/entity';
import { Result } from '../common/result';
import {
  EvidenceFilename,
  EvidenceTitle,
  EvidenceFileHash,
  EvidenceType,
  EvidenceStatus,
  EvidenceCollectionMethod,
  EvidenceValidityPeriod
} from './evidence_values';

/**
 * Evidence properties interface
 */
export interface EvidenceProps {
  title: EvidenceTitle;
  controlIds: string[];
  filename: EvidenceFilename;
  fileHash?: EvidenceFileHash;
  filePath: string;
  fileSize: number;
  mimeType: string;
  type: EvidenceType;
  status: EvidenceStatus;
  collectionMethod: EvidenceCollectionMethod;
  description?: string;
  collectedAt: Date;
  validityPeriod?: EvidenceValidityPeriod;
  reviewerId?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Evidence entity representing evidence collected for compliance controls
 */
export class Evidence extends Entity<EvidenceProps> {
  private readonly props: EvidenceProps;

  private constructor(id: string, props: EvidenceProps) {
    super(id);
    this.props = props;
  }

  // Getters
  get title(): EvidenceTitle {
    return this.props.title;
  }

  get controlIds(): string[] {
    return [...this.props.controlIds];
  }

  get filename(): EvidenceFilename {
    return this.props.filename;
  }

  get fileHash(): EvidenceFileHash | undefined {
    return this.props.fileHash;
  }

  get filePath(): string {
    return this.props.filePath;
  }

  get fileSize(): number {
    return this.props.fileSize;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }

  get type(): EvidenceType {
    return this.props.type;
  }

  get status(): EvidenceStatus {
    return this.props.status;
  }

  get collectionMethod(): EvidenceCollectionMethod {
    return this.props.collectionMethod;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get collectedAt(): Date {
    return new Date(this.props.collectedAt);
  }

  get validityPeriod(): EvidenceValidityPeriod | undefined {
    return this.props.validityPeriod;
  }

  get reviewerId(): string | undefined {
    return this.props.reviewerId;
  }

  get reviewedAt(): Date | undefined {
    return this.props.reviewedAt ? new Date(this.props.reviewedAt) : undefined;
  }

  get reviewNotes(): string | undefined {
    return this.props.reviewNotes;
  }

  get tags(): string[] | undefined {
    return this.props.tags ? [...this.props.tags] : undefined;
  }

  get metadata(): Record<string, any> | undefined {
    return this.props.metadata ? { ...this.props.metadata } : undefined;
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

  // Check if evidence is still valid
  public isValid(atDate: Date = new Date()): boolean {
    if (!this.props.validityPeriod) {
      return true; // If no validity period set, consider it always valid
    }

    return this.props.validityPeriod.isValid(atDate);
  }

  // Business methods
  public updateTitle(title: EvidenceTitle, userId: string): Result<void, Error> {
    this.props.title = title;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public updateDescription(description: string | undefined, userId: string): Result<void, Error> {
    if (description && description.length > 2000) {
      return Result.fail<void>(new Error('Description cannot exceed 2000 characters'));
    }

    this.props.description = description;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public addControl(controlId: string, userId: string): Result<void, Error> {
    if (!controlId) {
      return Result.fail<void>(new Error('Control ID is required'));
    }

    if (this.props.controlIds.includes(controlId)) {
      return Result.fail<void>(new Error(`Evidence is already linked to control ${controlId}`));
    }

    this.props.controlIds.push(controlId);
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public removeControl(controlId: string, userId: string): Result<void, Error> {
    if (!this.props.controlIds.includes(controlId)) {
      return Result.fail<void>(new Error(`Evidence is not linked to control ${controlId}`));
    }

    if (this.props.controlIds.length === 1) {
      return Result.fail<void>(new Error('Evidence must be linked to at least one control'));
    }

    this.props.controlIds = this.props.controlIds.filter(id => id !== controlId);
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

  public updateMetadata(metadata: Record<string, any> | undefined, userId: string): Result<void, Error> {
    this.props.metadata = metadata ? { ...metadata } : undefined;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public review(
    status: EvidenceStatus,
    reviewerId: string,
    notes?: string
  ): Result<void, Error> {
    if (status !== EvidenceStatus.APPROVED && status !== EvidenceStatus.REJECTED) {
      return Result.fail<void>(new Error('Review status must be either approved or rejected'));
    }

    this.props.status = status;
    this.props.reviewerId = reviewerId;
    this.props.reviewedAt = new Date();
    this.props.reviewNotes = notes;
    this.props.updatedBy = reviewerId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public markAsExpired(userId: string): Result<void, Error> {
    if (this.props.status === EvidenceStatus.EXPIRED) {
      return Result.fail<void>(new Error('Evidence is already marked as expired'));
    }

    this.props.status = EvidenceStatus.EXPIRED;
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
   * Create a new Evidence entity
   */
  public static create(
    id: string,
    props: {
      title: EvidenceTitle;
      controlIds: string[];
      filename: EvidenceFilename;
      fileHash?: EvidenceFileHash;
      filePath: string;
      fileSize: number;
      mimeType: string;
      type: EvidenceType;
      status?: EvidenceStatus;
      collectionMethod: EvidenceCollectionMethod;
      description?: string;
      collectedAt?: Date;
      validityPeriod?: EvidenceValidityPeriod;
      tags?: string[];
      metadata?: Record<string, any>;
      isActive?: boolean;
      createdBy: string;
      createdAt?: Date;
    }
  ): Result<Evidence, Error> {
    // Validate required properties
    if (!props.title) {
      return Result.fail<Evidence>(new Error('Evidence title is required'));
    }

    if (!props.controlIds || props.controlIds.length === 0) {
      return Result.fail<Evidence>(new Error('Evidence must be linked to at least one control'));
    }

    if (!props.filename) {
      return Result.fail<Evidence>(new Error('Evidence filename is required'));
    }

    if (!props.filePath) {
      return Result.fail<Evidence>(new Error('Evidence file path is required'));
    }

    if (props.fileSize <= 0) {
      return Result.fail<Evidence>(new Error('Evidence file size must be greater than 0'));
    }

    if (!props.mimeType) {
      return Result.fail<Evidence>(new Error('Evidence MIME type is required'));
    }

    if (!props.collectionMethod) {
      return Result.fail<Evidence>(new Error('Evidence collection method is required'));
    }

    if (!props.createdBy) {
      return Result.fail<Evidence>(new Error('Created by user ID is required'));
    }

    if (props.description && props.description.length > 2000) {
      return Result.fail<Evidence>(new Error('Description cannot exceed 2000 characters'));
    }

    // Create evidence with provided or default values
    const evidence = new Evidence(id, {
      title: props.title,
      controlIds: [...props.controlIds],
      filename: props.filename,
      fileHash: props.fileHash,
      filePath: props.filePath,
      fileSize: props.fileSize,
      mimeType: props.mimeType,
      type: props.type,
      status: props.status ?? EvidenceStatus.PENDING,
      collectionMethod: props.collectionMethod,
      description: props.description,
      collectedAt: props.collectedAt ?? new Date(),
      validityPeriod: props.validityPeriod,
      tags: props.tags ? [...new Set(props.tags)] : undefined,
      metadata: props.metadata ? { ...props.metadata } : undefined,
      isActive: props.isActive ?? true,
      createdBy: props.createdBy,
      createdAt: props.createdAt ?? new Date(),
    });

    return Result.ok<Evidence>(evidence);
  }
}
