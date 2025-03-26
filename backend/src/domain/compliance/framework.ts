import { Entity } from '../common/entity';
import { Result } from '../common/result';
import { FrameworkName, FrameworkVersion } from './values';

/**
 * Framework properties interface
 */
export interface FrameworkProps {
  name: FrameworkName;
  version: FrameworkVersion;
  description: string;
  isActive: boolean;
  organization?: string;
  category?: string;
  website?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Framework entity representing a compliance framework
 * Examples: SOC 2, ISO 27001, HIPAA, GDPR, etc.
 */
export class Framework extends Entity<FrameworkProps> {
  private readonly props: FrameworkProps;

  private constructor(id: string, props: FrameworkProps) {
    super(id);
    this.props = props;
  }

  // Getters
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

  get organization(): string | undefined {
    return this.props.organization;
  }

  get category(): string | undefined {
    return this.props.category;
  }

  get website(): string | undefined {
    return this.props.website;
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

  public updateWebsite(website: string | undefined, userId: string): Result<void, Error> {
    if (website && website.length > 255) {
      return Result.fail<void>(new Error('Website URL cannot exceed 255 characters'));
    }

    this.props.website = website;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public updateCategory(category: string | undefined, userId: string): Result<void, Error> {
    if (category && category.length > 100) {
      return Result.fail<void>(new Error('Category cannot exceed 100 characters'));
    }

    this.props.category = category;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public updateOrganization(organization: string | undefined, userId: string): Result<void, Error> {
    if (organization && organization.length > 255) {
      return Result.fail<void>(new Error('Organization name cannot exceed 255 characters'));
    }

    this.props.organization = organization;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  private updateTimestamp(): void {
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new Framework entity
   */
  public static create(
    id: string,
    props: {
      name: FrameworkName;
      version: FrameworkVersion;
      description: string;
      isActive?: boolean;
      organization?: string;
      category?: string;
      website?: string;
      createdBy: string;
      createdAt?: Date;
    }
  ): Result<Framework, Error> {
    // Validate required properties
    if (!props.name) {
      return Result.fail<Framework>(new Error('Framework name is required'));
    }

    if (!props.version) {
      return Result.fail<Framework>(new Error('Framework version is required'));
    }

    if (!props.description) {
      return Result.fail<Framework>(new Error('Framework description is required'));
    }

    if (props.description.length > 2000) {
      return Result.fail<Framework>(new Error('Framework description cannot exceed 2000 characters'));
    }

    if (!props.createdBy) {
      return Result.fail<Framework>(new Error('Created by user ID is required'));
    }

    // Create framework with provided or default values
    const framework = new Framework(id, {
      name: props.name,
      version: props.version,
      description: props.description,
      isActive: props.isActive ?? true,
      organization: props.organization,
      category: props.category,
      website: props.website,
      createdBy: props.createdBy,
      createdAt: props.createdAt ?? new Date(),
    });

    return Result.ok<Framework>(framework);
  }
}
