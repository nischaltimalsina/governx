import { Entity, UniqueEntityID } from '../common/Entity';
import { Result } from '../common/Result';

// Value Objects
export class FrameworkName {
  private constructor(private readonly value: string) {}

  public getValue(): string {
    return this.value;
  }

  public static create(name: string): Result<FrameworkName> {
    if (!name || name.trim().length === 0) {
      return Result.fail<FrameworkName>('Framework name cannot be empty');
    }
    if (name.length > 100) {
      return Result.fail<FrameworkName>('Framework name cannot exceed 100 characters');
    }
    return Result.ok<FrameworkName>(new FrameworkName(name));
  }
}

export class FrameworkVersion {
  private constructor(private readonly value: string) {}

  public getValue(): string {
    return this.value;
  }

  public static create(version: string): Result<FrameworkVersion> {
    if (!version || version.trim().length === 0) {
      return Result.fail<FrameworkVersion>('Version cannot be empty');
    }
    // Version format validation could be added here
    return Result.ok<FrameworkVersion>(new FrameworkVersion(version));
  }
}

export class ControlCode {
  private constructor(private readonly value: string) {}

  public getValue(): string {
    return this.value;
  }

  public static create(code: string): Result<ControlCode> {
    if (!code || code.trim().length === 0) {
      return Result.fail<ControlCode>('Control code cannot be empty');
    }
    // Additional validation could be added here
    return Result.ok<ControlCode>(new ControlCode(code));
  }
}

// Entities
export interface FrameworkProps {
  name: FrameworkName;
  version: FrameworkVersion;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Framework extends Entity<FrameworkProps> {
  private constructor(props: FrameworkProps, id?: UniqueEntityID) {
    super(props, id);
  }

  get frameworkId(): UniqueEntityID {
    return this._id;
  }

  get name(): FrameworkName {
    return this.props.name;
  }

  get version(): FrameworkVersion {
    return this.props.version;
  }

  get description(): string {
    return this.props.description;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  public updateDescription(description: string): Result<void> {
    if (!description || description.trim().length === 0) {
      return Result.fail<void>('Description cannot be empty');
    }

    this.props.description = description;
    this.props.updatedAt = new Date();

    return Result.ok<void>();
  }

  public static create(props: Omit<FrameworkProps, 'createdAt' | 'updatedAt'>, id?: UniqueEntityID): Result<Framework> {
    const defaultProps: FrameworkProps = {
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return Result.ok<Framework>(new Framework(defaultProps, id));
  }
}

export enum ControlStatus {
  IMPLEMENTED = 'implemented',
  PARTIALLY_IMPLEMENTED = 'partially_implemented',
  NOT_IMPLEMENTED = 'not_implemented'
}

export interface ControlProps {
  frameworkId: UniqueEntityID;
  code: ControlCode;
  title: string;
  description: string;
  implementationGuidance?: string;
  status: ControlStatus;
  ownerId?: UniqueEntityID;
  createdAt: Date;
  updatedAt: Date;
}

export class Control extends Entity<ControlProps> {
  private constructor(props: ControlProps, id?: UniqueEntityID) {
    super(props, id);
  }

  get controlId(): UniqueEntityID {
    return this._id;
  }

  get frameworkId(): UniqueEntityID {
    return this.props.frameworkId;
  }

  get code(): ControlCode {
    return this.props.code;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get implementationGuidance(): string | undefined {
    return this.props.implementationGuidance;
  }

  get status(): ControlStatus {
    return this.props.status;
  }

  get ownerId(): UniqueEntityID | undefined {
    return this.props.ownerId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public updateStatus(status: ControlStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  public assignOwner(ownerId: UniqueEntityID): void {
    this.props.ownerId = ownerId;
    this.props.updatedAt = new Date();
  }

  public updateImplementationGuidance(guidance: string): void {
    this.props.implementationGuidance = guidance;
    this.props.updatedAt = new Date();
  }

  public static create(props: Omit<ControlProps, 'createdAt' | 'updatedAt'>, id?: UniqueEntityID): Result<Control> {
    if (!props.title || props.title.trim().length === 0) {
      return Result.fail<Control>('Control title cannot be empty');
    }

    if (!props.description || props.description.trim().length === 0) {
      return Result.fail<Control>('Control description cannot be empty');
    }

    const defaultProps: ControlProps = {
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return Result.ok<Control>(new Control(defaultProps, id));
  }
}

export enum EvidenceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum EvidenceSource {
  MANUAL = 'manual',
  AUTOMATED = 'automated'
}

export interface EvidenceProps {
  controlIds: UniqueEntityID[];
  title: string;
  description?: string;
  fileUrls?: string[];
  metadata: Record<string, any>;
  source: EvidenceSource;
  collectionDate: Date;
  expirationDate?: Date;
  status: EvidenceStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Evidence extends Entity<EvidenceProps> {
  private constructor(props: EvidenceProps, id?: UniqueEntityID) {
    super(props, id);
  }

  get evidenceId(): UniqueEntityID {
    return this._id;
  }

  get controlIds(): UniqueEntityID[] {
    return this.props.controlIds;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get fileUrls(): string[] | undefined {
    return this.props.fileUrls;
  }

  get metadata(): Record<string, any> {
    return this.props.metadata;
  }

  get source(): EvidenceSource {
    return this.props.source;
  }

  get collectionDate(): Date {
    return this.props.collectionDate;
  }

  get expirationDate(): Date | undefined {
    return this.props.expirationDate;
  }

  get status(): EvidenceStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public approve(): void {
    this.props.status = EvidenceStatus.APPROVED;
    this.props.updatedAt = new Date();
  }

  public reject(): void {
    this.props.status = EvidenceStatus.REJECTED;
    this.props.updatedAt = new Date();
  }

  public isExpired(): boolean {
    if (!this.props.expirationDate) {
      return false;
    }
    return new Date() > this.props.expirationDate;
  }

  public addControlId(controlId: UniqueEntityID): void {
    if (!this.props.controlIds.some(id => id.equals(controlId))) {
      this.props.controlIds.push(controlId);
      this.props.updatedAt = new Date();
    }
  }

  public removeControlId(controlId: UniqueEntityID): void {
    this.props.controlIds = this.props.controlIds.filter(id => !id.equals(controlId));
    this.props.updatedAt = new Date();
  }

  public static create(props: Omit<EvidenceProps, 'createdAt' | 'updatedAt'>, id?: UniqueEntityID): Result<Evidence> {
    if (!props.title || props.title.trim().length === 0) {
      return Result.fail<Evidence>('Evidence title cannot be empty');
    }

    if (props.controlIds.length === 0) {
      return Result.fail<Evidence>('Evidence must be linked to at least one control');
    }

    const defaultProps: EvidenceProps = {
      ...props,
      status: props.status || EvidenceStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return Result.ok<Evidence>(new Evidence(defaultProps, id));
  }
}
