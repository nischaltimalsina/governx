import { Result } from '../common/result';

/**
 * PolicyType enum represents the type of policy
 */
export enum PolicyType {
  SECURITY = 'security',
  PRIVACY = 'privacy',
  OPERATIONAL = 'operational',
  HR = 'hr',
  IT = 'it',
  COMPLIANCE = 'compliance',
  GOVERNANCE = 'governance',
  RISK = 'risk',
  OTHER = 'other'
}

/**
 * PolicyStatus enum represents the status of a policy
 */
export enum PolicyStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

/**
 * PolicyFormat enum represents the file format of a policy document
 */
export enum PolicyFormat {
  PDF = 'pdf',
  DOCX = 'docx',
  HTML = 'html',
  MARKDOWN = 'markdown',
  TEXT = 'text'
}

/**
 * PolicyName value object represents the name of a policy
 */
export class PolicyName {
  private readonly value: string;

  private constructor(name: string) {
    this.value = name;
  }

  public getValue(): string {
    return this.value;
  }

  public static create(name: string): Result<PolicyName, Error> {
    if (!name) {
      return Result.fail<PolicyName>(new Error('Policy name cannot be empty'));
    }

    if (name.length < 3) {
      return Result.fail<PolicyName>(new Error('Policy name must be at least 3 characters'));
    }

    if (name.length > 100) {
      return Result.fail<PolicyName>(new Error('Policy name cannot exceed 100 characters'));
    }

    return Result.ok<PolicyName>(new PolicyName(name));
  }
}

/**
 * PolicyVersion value object represents a policy's version
 */
export class PolicyVersion {
  private readonly value: string;

  private constructor(version: string) {
    this.value = version;
  }

  public getValue(): string {
    return this.value;
  }

  /**
   * Compares this version with another version
   * @returns -1 if this < other, 0 if this === other, 1 if this > other
   */
  public compare(other: PolicyVersion): number {
    const thisComponents = this.value.split('.').map(Number);
    const otherComponents = other.getValue().split('.').map(Number);

    // Compare each component
    for (let i = 0; i < Math.max(thisComponents.length, otherComponents.length); i++) {
      const thisComponent = i < thisComponents.length ? thisComponents[i] : 0;
      const otherComponent = i < otherComponents.length ? otherComponents[i] : 0;

      if (thisComponent < otherComponent) {
        return -1;
      }

      if (thisComponent > otherComponent) {
        return 1;
      }
    }

    // Versions are equal
    return 0;
  }

  public static create(version: string): Result<PolicyVersion, Error> {
    if (!version) {
      return Result.fail<PolicyVersion>(new Error('Policy version cannot be empty'));
    }

    // Validate semantic versioning format (major.minor.patch)
    const semverRegex = /^(\d+)\.(\d+)(?:\.(\d+))?$/;
    if (!semverRegex.test(version)) {
      return Result.fail<PolicyVersion>(
        new Error('Policy version must follow semantic versioning (e.g., 1.0.0)')
      );
    }

    return Result.ok<PolicyVersion>(new PolicyVersion(version));
  }

  /**
   * Creates the next minor version
   */
  public static createNextMinor(current: PolicyVersion): Result<PolicyVersion, Error> {
    const components = current.getValue().split('.').map(Number);
    components[1] += 1; // Increment minor version
    if (components.length > 2) {
      components[2] = 0; // Reset patch version
    }
    return PolicyVersion.create(components.join('.'));
  }

  /**
   * Creates the next major version
   */
  public static createNextMajor(current: PolicyVersion): Result<PolicyVersion, Error> {
    const components = current.getValue().split('.').map(Number);
    components[0] += 1; // Increment major version
    components[1] = 0;  // Reset minor version
    if (components.length > 2) {
      components[2] = 0; // Reset patch version
    }
    return PolicyVersion.create(components.join('.'));
  }
}

/**
 * PolicyApprover represents a person who has approved a policy
 */
export class PolicyApprover {
  private readonly userId: string;
  private readonly name: string;
  private readonly title: string;
  private readonly approvedAt: Date;
  private readonly comments?: string;

  private constructor(
    userId: string,
    name: string,
    title: string,
    approvedAt: Date,
    comments?: string
  ) {
    this.userId = userId;
    this.name = name;
    this.title = title;
    this.approvedAt = approvedAt;
    this.comments = comments;
  }

  public getUserId(): string {
    return this.userId;
  }

  public getName(): string {
    return this.name;
  }

  public getTitle(): string {
    return this.title;
  }

  public getApprovedAt(): Date {
    return new Date(this.approvedAt);
  }

  public getComments(): string | undefined {
    return this.comments;
  }

  public static create(
    userId: string,
    name: string,
    title: string,
    approvedAt: Date = new Date(),
    comments?: string
  ): Result<PolicyApprover, Error> {
    if (!userId) {
      return Result.fail<PolicyApprover>(new Error('Approver user ID is required'));
    }

    if (!name) {
      return Result.fail<PolicyApprover>(new Error('Approver name is required'));
    }

    if (!title) {
      return Result.fail<PolicyApprover>(new Error('Approver title is required'));
    }

    return Result.ok<PolicyApprover>(
      new PolicyApprover(userId, name, title, approvedAt, comments)
    );
  }
}

/**
 * EffectiveDate represents the period when a policy is in effect
 */
export class EffectiveDate {
  private readonly startDate: Date;
  private readonly endDate?: Date;

  private constructor(startDate: Date, endDate?: Date) {
    this.startDate = startDate;
    this.endDate = endDate;
  }

  public getStartDate(): Date {
    return new Date(this.startDate);
  }

  public getEndDate(): Date | undefined {
    return this.endDate ? new Date(this.endDate) : undefined;
  }

  public isEffective(atDate: Date = new Date()): boolean {
    // Check if the given date is on or after the start date
    if (atDate < this.startDate) {
      return false;
    }

    // Check if the given date is before the end date (if an end date exists)
    if (this.endDate && atDate > this.endDate) {
      return false;
    }

    return true;
  }

  public static create(
    startDate: Date,
    endDate?: Date
  ): Result<EffectiveDate, Error> {
    if (!startDate) {
      return Result.fail<EffectiveDate>(new Error('Effective start date is required'));
    }

    if (endDate && startDate > endDate) {
      return Result.fail<EffectiveDate>(
        new Error('Effective end date must be after start date')
      );
    }

    return Result.ok<EffectiveDate>(new EffectiveDate(startDate, endDate));
  }
}
