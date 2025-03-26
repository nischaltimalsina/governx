import { Result } from '../common/result';

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
 * EvidenceStatus enum represents the status of evidence
 */
export enum EvidenceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

/**
 * EvidenceFilename value object represents the filename of evidence
 */
export class EvidenceFilename {
  private readonly value: string;

  private constructor(filename: string) {
    this.value = filename;
  }

  public getValue(): string {
    return this.value;
  }

  public static create(filename: string): Result<EvidenceFilename, Error> {
    if (!filename) {
      return Result.fail<EvidenceFilename>(new Error('Evidence filename cannot be empty'));
    }

    if (filename.length > 255) {
      return Result.fail<EvidenceFilename>(new Error('Evidence filename cannot exceed 255 characters'));
    }

    return Result.ok<EvidenceFilename>(new EvidenceFilename(filename));
  }
}

/**
 * EvidenceTitle value object represents the title of evidence
 */
export class EvidenceTitle {
  private readonly value: string;

  private constructor(title: string) {
    this.value = title;
  }

  public getValue(): string {
    return this.value;
  }

  public static create(title: string): Result<EvidenceTitle, Error> {
    if (!title) {
      return Result.fail<EvidenceTitle>(new Error('Evidence title cannot be empty'));
    }

    if (title.length > 200) {
      return Result.fail<EvidenceTitle>(new Error('Evidence title cannot exceed 200 characters'));
    }

    return Result.ok<EvidenceTitle>(new EvidenceTitle(title));
  }
}

/**
 * EvidenceFileHash value object represents a hash of an evidence file for integrity verification
 */
export class EvidenceFileHash {
  private readonly value: string;

  private constructor(hash: string) {
    this.value = hash;
  }

  public getValue(): string {
    return this.value;
  }

  public static create(hash: string): Result<EvidenceFileHash, Error> {
    if (!hash) {
      return Result.fail<EvidenceFileHash>(new Error('Evidence file hash cannot be empty'));
    }

    // SHA-256 hash is 64 characters
    if (hash.length !== 64 && hash.length !== 128) {
      return Result.fail<EvidenceFileHash>(
        new Error('Evidence file hash must be a valid SHA-256 or SHA-512 hash')
      );
    }

    // Check if hash contains only hexadecimal characters
    if (!/^[0-9a-f]+$/i.test(hash)) {
      return Result.fail<EvidenceFileHash>(
        new Error('Evidence file hash must contain only hexadecimal characters')
      );
    }

    return Result.ok<EvidenceFileHash>(new EvidenceFileHash(hash));
  }
}

/**
 * EvidenceCollectionMethod enum represents how evidence was collected
 */
export enum EvidenceCollectionMethod {
  MANUAL_UPLOAD = 'manual_upload',
  AUTOMATIC_INTEGRATION = 'automatic_integration',
  API_SUBMISSION = 'api_submission',
  EMAIL_SUBMISSION = 'email_submission'
}

/**
 * EvidenceValidityPeriod value object represents the period during which evidence is valid
 */
export class EvidenceValidityPeriod {
  private readonly startDate: Date;
  private readonly endDate: Date | null;

  private constructor(startDate: Date, endDate: Date | null) {
    this.startDate = startDate;
    this.endDate = endDate;
  }

  public getStartDate(): Date {
    return new Date(this.startDate);
  }

  public getEndDate(): Date | null {
    return this.endDate ? new Date(this.endDate) : null;
  }

  public isValid(atDate: Date = new Date()): boolean {
    if (this.endDate && atDate > this.endDate) {
      return false;
    }

    return true;
  }

  public static create(
    startDate: Date,
    endDate: Date | null = null
  ): Result<EvidenceValidityPeriod, Error> {
    if (!startDate) {
      return Result.fail<EvidenceValidityPeriod>(new Error('Evidence validity start date is required'));
    }

    if (endDate && startDate > endDate) {
      return Result.fail<EvidenceValidityPeriod>(
        new Error('Evidence validity end date must be after start date')
      );
    }

    return Result.ok<EvidenceValidityPeriod>(new EvidenceValidityPeriod(startDate, endDate));
  }
}
