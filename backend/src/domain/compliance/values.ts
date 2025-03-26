import { Result } from '../common/result';

/**
 * FrameworkName value object represents the name of a compliance framework
 * Example: "SOC 2", "ISO 27001", "HIPAA"
 */
export class FrameworkName {
  private readonly value: string;

  private constructor(name: string) {
    this.value = name;
  }

  public getValue(): string {
    return this.value;
  }

  public static create(name: string): Result<FrameworkName, Error> {
    if (!name) {
      return Result.fail<FrameworkName>(new Error('Framework name cannot be empty'));
    }

    if (name.length < 2) {
      return Result.fail<FrameworkName>(new Error('Framework name must be at least 2 characters'));
    }

    if (name.length > 100) {
      return Result.fail<FrameworkName>(new Error('Framework name cannot exceed 100 characters'));
    }

    return Result.ok<FrameworkName>(new FrameworkName(name));
  }
}

/**
 * FrameworkVersion value object represents the version of a compliance framework
 * Example: "2022", "v2.0", "May 2023"
 */
export class FrameworkVersion {
  private readonly value: string;

  private constructor(version: string) {
    this.value = version;
  }

  public getValue(): string {
    return this.value;
  }

  public static create(version: string): Result<FrameworkVersion, Error> {
    if (!version) {
      return Result.fail<FrameworkVersion>(new Error('Framework version cannot be empty'));
    }

    if (version.length > 50) {
      return Result.fail<FrameworkVersion>(new Error('Framework version cannot exceed 50 characters'));
    }

    return Result.ok<FrameworkVersion>(new FrameworkVersion(version));
  }
}

/**
 * ControlCode value object represents a unique identifier for a compliance control
 * Example: "AC-1", "SOC2.CC5.1", "A.5.1.1"
 */
export class ControlCode {
  private readonly value: string;

  private constructor(code: string) {
    this.value = code;
  }

  public getValue(): string {
    return this.value;
  }

  public static create(code: string): Result<ControlCode, Error> {
    if (!code) {
      return Result.fail<ControlCode>(new Error('Control code cannot be empty'));
    }

    if (code.length > 50) {
      return Result.fail<ControlCode>(new Error('Control code cannot exceed 50 characters'));
    }

    // Control codes often have special characters but shouldn't contain spaces
    if (code.includes(' ')) {
      return Result.fail<ControlCode>(new Error('Control code should not contain spaces'));
    }

    return Result.ok<ControlCode>(new ControlCode(code));
  }
}

/**
 * ControlTitle value object represents the title of a compliance control
 * Example: "Access Control Policy", "Security Awareness Training"
 */
export class ControlTitle {
  private readonly value: string;

  private constructor(title: string) {
    this.value = title;
  }

  public getValue(): string {
    return this.value;
  }

  public static create(title: string): Result<ControlTitle, Error> {
    if (!title) {
      return Result.fail<ControlTitle>(new Error('Control title cannot be empty'));
    }

    if (title.length > 200) {
      return Result.fail<ControlTitle>(new Error('Control title cannot exceed 200 characters'));
    }

    return Result.ok<ControlTitle>(new ControlTitle(title));
  }
}

/**
 * EvidenceType enum represents the type of evidence
 */
export enum EvidenceType {
  DOCUMENT = 'document',
  SCREENSHOT = 'screenshot',
  SYSTEM_EXPORT = 'system_export',
  LOG = 'log',
  CONFIGURATION = 'configuration',
  INTERVIEW = 'interview',
  ATTESTATION = 'attestation',
  OBSERVATION = 'observation',
  OTHER = 'other'
}

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
 * Status types for various compliance-related entities
 */
export enum ImplementationStatus {
  NOT_IMPLEMENTED = 'not_implemented',
  PARTIALLY_IMPLEMENTED = 'partially_implemented',
  IMPLEMENTED = 'implemented',
  NOT_APPLICABLE = 'not_applicable'
}

export enum VerificationStatus {
  NOT_VERIFIED = 'not_verified',
  VERIFIED = 'verified',
  FAILED = 'failed'
}

export enum EvidenceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export enum AssessmentResult {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PARTIALLY_COMPLIANT = 'partially_compliant',
  NOT_APPLICABLE = 'not_applicable'
}
