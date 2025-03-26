import { v4 as uuidv4 } from 'uuid';
import { Result } from '../common/result';
import { Evidence } from './evidence';
import { IEvidenceRepository } from './evidence_repository';
import { IControlRepository } from './framework_repository';
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
 * Evidence management service
 * Handles domain operations related to evidence management
 */
export class EvidenceService {
  constructor(
    private evidenceRepository: IEvidenceRepository,
    private controlRepository: IControlRepository
  ) {}

  /**
   * Upload and create a new evidence
   */
  public async createEvidence(
    title: EvidenceTitle,
    controlIds: string[],
    filename: EvidenceFilename,
    filePath: string,
    fileSize: number,
    mimeType: string,
    fileHash: string | undefined,
    type: EvidenceType,
    userId: string,
    options?: {
      description?: string;
      collectionMethod?: EvidenceCollectionMethod;
      validityStartDate?: Date;
      validityEndDate?: Date;
      tags?: string[];
      metadata?: Record<string, any>;
    }
  ): Promise<Result<Evidence, Error>> {
    // Validate controlIds (ensure they exist)
    for (const controlId of controlIds) {
      const controlResult = await this.controlRepository.findById(controlId);

      if (!controlResult.isSuccess) {
        return Result.fail<Evidence>(controlResult.getError());
      }

      const control = controlResult.getValue();

      if (!control) {
        return Result.fail<Evidence>(new Error(`Control with ID ${controlId} not found`));
      }
    }

    // Check if evidence with same file hash already exists
    if (fileHash) {
      const fileHashResult = EvidenceFileHash.create(fileHash);

      if (!fileHashResult.isSuccess) {
        return Result.fail<Evidence>(fileHashResult.getError());
      }

      const existsResult = await this.evidenceRepository.existsByHash(fileHash);

      if (!existsResult.isSuccess) {
        return Result.fail<Evidence>(existsResult.getError());
      }

      if (existsResult.getValue()) {
        return Result.fail<Evidence>(new Error('Evidence with this file hash already exists'));
      }
    }

    // Create validity period if provided
    let validityPeriod: EvidenceValidityPeriod | undefined;
    if (options?.validityStartDate) {
      const validityPeriodResult = EvidenceValidityPeriod.create(
        options.validityStartDate,
        options.validityEndDate
      );

      if (!validityPeriodResult.isSuccess) {
        return Result.fail<Evidence>(validityPeriodResult.getError());
      }

      validityPeriod = validityPeriodResult.getValue();
    }

    // Create file hash value object if provided
    let fileHashObj: EvidenceFileHash | undefined;
    if (fileHash) {
      const fileHashResult = EvidenceFileHash.create(fileHash);

      if (!fileHashResult.isSuccess) {
        return Result.fail<Evidence>(fileHashResult.getError());
      }

      fileHashObj = fileHashResult.getValue();
    }

    // Create evidence entity
    const evidenceId = uuidv4();
    const evidenceResult = Evidence.create(evidenceId, {
      title,
      controlIds,
      filename,
      fileHash: fileHashObj,
      filePath,
      fileSize,
      mimeType,
      type,
      collectionMethod: options?.collectionMethod ?? EvidenceCollectionMethod.MANUAL_UPLOAD,
      description: options?.description,
      validityPeriod,
      tags: options?.tags,
      metadata: options?.metadata,
      createdBy: userId
    });

    if (!evidenceResult.isSuccess) {
      return Result.fail<Evidence>(evidenceResult.getError());
    }

    const evidence = evidenceResult.getValue();

    // Save evidence to repository
    const saveResult = await this.evidenceRepository.save(evidence);

    if (!saveResult.isSuccess) {
      return Result.fail<Evidence>(saveResult.getError());
    }

    return Result.ok<Evidence>(evidence);
  }

  /**
   * Review evidence and update its status
   */
  public async reviewEvidence(
    evidenceId: string,
    status: EvidenceStatus,
    reviewerId: string,
    notes?: string
  ): Promise<Result<Evidence, Error>> {
    // Check if evidence exists
    const evidenceResult = await this.evidenceRepository.findById(evidenceId);

    if (!evidenceResult.isSuccess) {
      return Result.fail<Evidence>(evidenceResult.getError());
    }

    const evidence = evidenceResult.getValue();

    if (!evidence) {
      return Result.fail<Evidence>(new Error(`Evidence with ID ${evidenceId} not found`));
    }

    // Validate review status
    if (status !== EvidenceStatus.APPROVED && status !== EvidenceStatus.REJECTED) {
      return Result.fail<Evidence>(new Error('Review status must be either approved or rejected'));
    }

    // Update evidence status
    const reviewResult = evidence.review(status, reviewerId, notes);

    if (!reviewResult.isSuccess) {
      return Result.fail<Evidence>(reviewResult.getError());
    }

    // Save updated evidence
    const saveResult = await this.evidenceRepository.save(evidence);

    if (!saveResult.isSuccess) {
      return Result.fail<Evidence>(saveResult.getError());
    }

    return Result.ok<Evidence>(evidence);
  }

  /**
   * Link evidence to additional control
   */
  public async linkEvidenceToControl(
    evidenceId: string,
    controlId: string,
    userId: string
  ): Promise<Result<Evidence, Error>> {
    // Check if evidence exists
    const evidenceResult = await this.evidenceRepository.findById(evidenceId);

    if (!evidenceResult.isSuccess) {
      return Result.fail<Evidence>(evidenceResult.getError());
    }

    const evidence = evidenceResult.getValue();

    if (!evidence) {
      return Result.fail<Evidence>(new Error(`Evidence with ID ${evidenceId} not found`));
    }

    // Check if control exists
    const controlResult = await this.controlRepository.findById(controlId);

    if (!controlResult.isSuccess) {
      return Result.fail<Evidence>(controlResult.getError());
    }

    const control = controlResult.getValue();

    if (!control) {
      return Result.fail<Evidence>(new Error(`Control with ID ${controlId} not found`));
    }

    // Link evidence to control
    const linkResult = evidence.addControl(controlId, userId);

    if (!linkResult.isSuccess) {
      return Result.fail<Evidence>(linkResult.getError());
    }

    // Save updated evidence
    const saveResult = await this.evidenceRepository.save(evidence);

    if (!saveResult.isSuccess) {
      return Result.fail<Evidence>(saveResult.getError());
    }

    return Result.ok<Evidence>(evidence);
  }

  /**
   * Unlink evidence from control
   */
  public async unlinkEvidenceFromControl(
    evidenceId: string,
    controlId: string,
    userId: string
  ): Promise<Result<Evidence, Error>> {
    // Check if evidence exists
    const evidenceResult = await this.evidenceRepository.findById(evidenceId);

    if (!evidenceResult.isSuccess) {
      return Result.fail<Evidence>(evidenceResult.getError());
    }

    const evidence = evidenceResult.getValue();

    if (!evidence) {
      return Result.fail<Evidence>(new Error(`Evidence with ID ${evidenceId} not found`));
    }

    // Unlink evidence from control
    const unlinkResult = evidence.removeControl(controlId, userId);

    if (!unlinkResult.isSuccess) {
      return Result.fail<Evidence>(unlinkResult.getError());
    }

    // Save updated evidence
    const saveResult = await this.evidenceRepository.save(evidence);

    if (!saveResult.isSuccess) {
      return Result.fail<Evidence>(saveResult.getError());
    }

    return Result.ok<Evidence>(evidence);
  }

  /**
   * Check if evidence is still valid
   */
  public async checkEvidenceValidity(
    evidenceId: string,
    userId: string
  ): Promise<Result<{ isValid: boolean; evidence: Evidence }, Error>> {
    // Check if evidence exists
    const evidenceResult = await this.evidenceRepository.findById(evidenceId);

    if (!evidenceResult.isSuccess) {
      return Result.fail(evidenceResult.getError());
    }

    const evidence = evidenceResult.getValue();

    if (!evidence) {
      return Result.fail(new Error(`Evidence with ID ${evidenceId} not found`));
    }

    // Check if evidence is still valid
    const isValid = evidence.isValid();

    // If not valid and status is not yet marked as expired, update status
    if (!isValid && evidence.status !== EvidenceStatus.EXPIRED) {
      const markResult = evidence.markAsExpired(userId);

      if (!markResult.isSuccess) {
        return Result.fail(markResult.getError());
      }

      // Save updated evidence
      const saveResult = await this.evidenceRepository.save(evidence);

      if (!saveResult.isSuccess) {
        return Result.fail(saveResult.getError());
      }
    }

    return Result.ok({ isValid, evidence });
  }

  /**
   * Update evidence tags
   */
  public async updateEvidenceTags(
    evidenceId: string,
    tags: string[],
    userId: string
  ): Promise<Result<Evidence, Error>> {
    // Check if evidence exists
    const evidenceResult = await this.evidenceRepository.findById(evidenceId);

    if (!evidenceResult.isSuccess) {
      return Result.fail<Evidence>(evidenceResult.getError());
    }

    const evidence = evidenceResult.getValue();

    if (!evidence) {
      return Result.fail<Evidence>(new Error(`Evidence with ID ${evidenceId} not found`));
    }

    // Update evidence tags
    const updateResult = evidence.updateTags(tags, userId);

    if (!updateResult.isSuccess) {
      return Result.fail<Evidence>(updateResult.getError());
    }

    // Save updated evidence
    const saveResult = await this.evidenceRepository.save(evidence);

    if (!saveResult.isSuccess) {
      return Result.fail<Evidence>(saveResult.getError());
    }

    return Result.ok<Evidence>(evidence);
  }

  /**
   * Get evidence stats for a framework
   */
  public async getEvidenceStatsForFramework(
    frameworkId: string
  ): Promise<Result<{
    totalEvidence: number;
    approvedEvidence: number;
    pendingEvidence: number;
    rejectedEvidence: number;
    expiredEvidence: number;
  }, Error>> {
    // Count total evidence
    const totalResult = await this.evidenceRepository.count({
      frameworkId,
      active: true
    });

    if (!totalResult.isSuccess) {
      return Result.fail(totalResult.getError());
    }

    // Count approved evidence
    const approvedResult = await this.evidenceRepository.count({
      frameworkId,
      status: [EvidenceStatus.APPROVED],
      active: true
    });

    if (!approvedResult.isSuccess) {
      return Result.fail(approvedResult.getError());
    }

    // Count pending evidence
    const pendingResult = await this.evidenceRepository.count({
      frameworkId,
      status: [EvidenceStatus.PENDING],
      active: true
    });

    if (!pendingResult.isSuccess) {
      return Result.fail(pendingResult.getError());
    }

    // Count rejected evidence
    const rejectedResult = await this.evidenceRepository.count({
      frameworkId,
      status: [EvidenceStatus.REJECTED],
      active: true
    });

    if (!rejectedResult.isSuccess) {
      return Result.fail(rejectedResult.getError());
    }

    // Count expired evidence
    const expiredResult = await this.evidenceRepository.count({
      frameworkId,
      status: [EvidenceStatus.EXPIRED],
      active: true
    });

    if (!expiredResult.isSuccess) {
      return Result.fail(expiredResult.getError());
    }

    return Result.ok({
      totalEvidence: totalResult.getValue(),
      approvedEvidence: approvedResult.getValue(),
      pendingEvidence: pendingResult.getValue(),
      rejectedEvidence: rejectedResult.getValue(),
      expiredEvidence: expiredResult.getValue()
    });
  }
}
