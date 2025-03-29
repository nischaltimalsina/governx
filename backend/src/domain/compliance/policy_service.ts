import mongoose from 'mongoose';
import { Result } from '../common/result';
import { IControlRepository } from './framework_repository';
import { Policy } from './policy';
import { IPolicyRepository } from './policy_repository';
import {
  EffectiveDate,
  PolicyApprover,
  PolicyFormat,
  PolicyName,
  PolicyStatus,
  PolicyType,
  PolicyVersion
} from './policy_values';

/**
 * Policy management service
 * Handles domain operations related to policy management
 */
export class PolicyService {
  constructor(
    private policyRepository: IPolicyRepository,
    private controlRepository: IControlRepository
  ) {}

  /**
   * Create a new policy
   */
  public async createPolicy(
    name: PolicyName,
    type: PolicyType,
    description: string,
    owner: string,
    userId: string,
    options?: {
      content?: string;
      documentUrl?: string;
      documentPath?: string;
      documentFormat?: PolicyFormat;
      relatedControlIds?: string[];
      effectiveStartDate?: Date;
      effectiveEndDate?: Date;
      reviewDate?: Date;
      tags?: string[];
    }
  ): Promise<Result<Policy, Error>> {
    // Check if any policy with this name already exists
    // If it does, create a new version, otherwise start with 1.0.0
    const latestResult = await this.policyRepository.findLatestByName(name);

    if (!latestResult.isSuccess) {
      return Result.fail<Policy>(latestResult.getError());
    }

    let version: PolicyVersion;
    const latestResultValue = latestResult.getValue();

    if (latestResultValue) {
      const latestVersion = latestResultValue.version;
      const nextVersionResult = PolicyVersion.createNextMinor(latestVersion);

      if (!nextVersionResult.isSuccess) {
        return Result.fail<Policy>(nextVersionResult.getError());
      }

      version = nextVersionResult.getValue();
    } else {
      // Start with version 1.0.0
      const versionResult = PolicyVersion.create('1.0.0');

      if (!versionResult.isSuccess) {
        return Result.fail<Policy>(versionResult.getError());
      }

      version = versionResult.getValue();
    }

    // Validate control IDs if provided
    if (options?.relatedControlIds && options.relatedControlIds.length > 0) {
      for (const controlId of options.relatedControlIds) {
        const controlResult = await this.controlRepository.findById(controlId);

        if (!controlResult.isSuccess) {
          return Result.fail<Policy>(controlResult.getError());
        }

        const control = controlResult.getValue();

        if (!control) {
          return Result.fail<Policy>(new Error(`Control with ID ${controlId} not found`));
        }
      }
    }

    // Create effective date if provided
    let effectiveDate: EffectiveDate | undefined;
    if (options?.effectiveStartDate) {
      const effectiveDateResult = EffectiveDate.create(
        options.effectiveStartDate,
        options.effectiveEndDate
      );

      if (!effectiveDateResult.isSuccess) {
        return Result.fail<Policy>(effectiveDateResult.getError());
      }

      effectiveDate = effectiveDateResult.getValue();
    }

    // Create policy entity
    const policyId = new mongoose.Types.ObjectId().toString()
    const policyResult = Policy.create(policyId, {
      name,
      version,
      type,
      description,
      content: options?.content,
      documentUrl: options?.documentUrl,
      documentPath: options?.documentPath,
      documentFormat: options?.documentFormat,
      relatedControlIds: options?.relatedControlIds,
      owner,
      effectiveDate,
      reviewDate: options?.reviewDate,
      tags: options?.tags,
      createdBy: userId
    });

    if (!policyResult.isSuccess) {
      return Result.fail<Policy>(policyResult.getError());
    }

    const policy = policyResult.getValue();

    // Save policy to repository
    const saveResult = await this.policyRepository.save(policy);

    if (!saveResult.isSuccess) {
      return Result.fail<Policy>(saveResult.getError());
    }

    return Result.ok<Policy>(policy);
  }

  /**
   * Create a major new version of an existing policy
   */
  public async createMajorVersion(
    policyId: string,
    description: string,
    content: string | undefined,
    documentUrl: string | undefined,
    documentPath: string | undefined,
    documentFormat: PolicyFormat | undefined,
    userId: string
  ): Promise<Result<Policy, Error>> {
    // Find existing policy
    const existingResult = await this.policyRepository.findById(policyId);

    if (!existingResult.isSuccess) {
      return Result.fail<Policy>(existingResult.getError());
    }

    const existingPolicy = existingResult.getValue();

    if (!existingPolicy) {
      return Result.fail<Policy>(new Error(`Policy with ID ${policyId} not found`));
    }

    // Create next major version
    const nextVersionResult = PolicyVersion.createNextMajor(existingPolicy.version);

    if (!nextVersionResult.isSuccess) {
      return Result.fail<Policy>(nextVersionResult.getError());
    }

    const nextVersion = nextVersionResult.getValue();

    // Create new policy entity with incremented version
    const newPolicyId = new mongoose.Types.ObjectId().toString()
    const policyResult = Policy.create(newPolicyId, {
      name: existingPolicy.name,
      version: nextVersion,
      type: existingPolicy.type,
      status: PolicyStatus.DRAFT, // New versions always start as drafts
      description,
      content,
      documentUrl,
      documentPath,
      documentFormat,
      relatedControlIds: existingPolicy.relatedControlIds,
      owner: existingPolicy.owner,
      tags: existingPolicy.tags,
      createdBy: userId
    });

    if (!policyResult.isSuccess) {
      return Result.fail<Policy>(policyResult.getError());
    }

    const policy = policyResult.getValue();

    // Save policy to repository
    const saveResult = await this.policyRepository.save(policy);

    if (!saveResult.isSuccess) {
      return Result.fail<Policy>(saveResult.getError());
    }

    return Result.ok<Policy>(policy);
  }

  /**
   * Add an approver to a policy
   */
  public async approvePolicy(
    policyId: string,
    approverUserId: string,
    approverName: string,
    approverTitle: string,
    comments: string | undefined,
    userId: string
  ): Promise<Result<Policy, Error>> {
    // Find policy
    const policyResult = await this.policyRepository.findById(policyId);

    if (!policyResult.isSuccess) {
      return Result.fail<Policy>(policyResult.getError());
    }

    const policy = policyResult.getValue();

    if (!policy) {
      return Result.fail<Policy>(new Error(`Policy with ID ${policyId} not found`));
    }

    // Check if policy is in a state that can be approved
    if (policy.status !== PolicyStatus.REVIEW && policy.status !== PolicyStatus.DRAFT) {
      return Result.fail<Policy>(
        new Error(`Policy must be in DRAFT or REVIEW status to be approved, current status: ${policy.status}`)
      );
    }

    // Create approver
    const approverResult = PolicyApprover.create(
      approverUserId,
      approverName,
      approverTitle,
      new Date(),
      comments
    );

    if (!approverResult.isSuccess) {
      return Result.fail<Policy>(approverResult.getError());
    }

    // Add approver to policy
    const addResult = policy.addApprover(approverResult.getValue(), userId);

    if (!addResult.isSuccess) {
      return Result.fail<Policy>(addResult.getError());
    }

    // Update policy status if needed
    if (policy.status === PolicyStatus.DRAFT) {
      const updateResult = policy.updateStatus(PolicyStatus.REVIEW, userId);

      if (!updateResult.isSuccess) {
        return Result.fail<Policy>(updateResult.getError());
      }
    }

    // Save updated policy
    const saveResult = await this.policyRepository.save(policy);

    if (!saveResult.isSuccess) {
      return Result.fail<Policy>(saveResult.getError());
    }

    return Result.ok<Policy>(policy);
  }

  /**
   * Publish a policy
   */
  public async publishPolicy(
    policyId: string,
    effectiveStartDate: Date,
    effectiveEndDate: Date | undefined,
    reviewDate: Date | undefined,
    userId: string
  ): Promise<Result<Policy, Error>> {
    // Find policy
    const policyResult = await this.policyRepository.findById(policyId);

    if (!policyResult.isSuccess) {
      return Result.fail<Policy>(policyResult.getError());
    }

    const policy = policyResult.getValue();

    if (!policy) {
      return Result.fail<Policy>(new Error(`Policy with ID ${policyId} not found`));
    }

    // Check if policy can be published
    if (policy.status !== PolicyStatus.APPROVED) {
      return Result.fail<Policy>(
        new Error(`Policy must be in APPROVED status to be published, current status: ${policy.status}`)
      );
    }

    // Set effective date
    const effectiveDateResult = EffectiveDate.create(effectiveStartDate, effectiveEndDate);

    if (!effectiveDateResult.isSuccess) {
      return Result.fail<Policy>(effectiveDateResult.getError());
    }

    const setDateResult = policy.setEffectiveDate(effectiveDateResult.getValue(), userId);

    if (!setDateResult.isSuccess) {
      return Result.fail<Policy>(setDateResult.getError());
    }

    // Set review date if provided
    if (reviewDate) {
      const setReviewResult = policy.setReviewDate(reviewDate, userId);

      if (!setReviewResult.isSuccess) {
        return Result.fail<Policy>(setReviewResult.getError());
      }
    }

    // Update policy status
    const updateResult = policy.updateStatus(PolicyStatus.PUBLISHED, userId);

    if (!updateResult.isSuccess) {
      return Result.fail<Policy>(updateResult.getError());
    }

    // Save updated policy
    const saveResult = await this.policyRepository.save(policy);

    if (!saveResult.isSuccess) {
      return Result.fail<Policy>(saveResult.getError());
    }

    return Result.ok<Policy>(policy);
  }

  /**
   * Archive a policy
   */
  public async archivePolicy(
    policyId: string,
    userId: string
  ): Promise<Result<Policy, Error>> {
    // Find policy
    const policyResult = await this.policyRepository.findById(policyId);

    if (!policyResult.isSuccess) {
      return Result.fail<Policy>(policyResult.getError());
    }

    const policy = policyResult.getValue();

    if (!policy) {
      return Result.fail<Policy>(new Error(`Policy with ID ${policyId} not found`));
    }

    // Archive policy
    const archiveResult = policy.archive(userId);

    if (!archiveResult.isSuccess) {
      return Result.fail<Policy>(archiveResult.getError());
    }

    // Save updated policy
    const saveResult = await this.policyRepository.save(policy);

    if (!saveResult.isSuccess) {
      return Result.fail<Policy>(saveResult.getError());
    }

    return Result.ok<Policy>(policy);
  }

  /**
   * Link a policy to a control
   */
  public async linkPolicyToControl(
    policyId: string,
    controlId: string,
    userId: string
  ): Promise<Result<Policy, Error>> {
    // Find policy
    const policyResult = await this.policyRepository.findById(policyId);

    if (!policyResult.isSuccess) {
      return Result.fail<Policy>(policyResult.getError());
    }

    const policy = policyResult.getValue();

    if (!policy) {
      return Result.fail<Policy>(new Error(`Policy with ID ${policyId} not found`));
    }

    // Verify control exists
    const controlResult = await this.controlRepository.findById(controlId);

    if (!controlResult.isSuccess) {
      return Result.fail<Policy>(controlResult.getError());
    }

    const control = controlResult.getValue();

    if (!control) {
      return Result.fail<Policy>(new Error(`Control with ID ${controlId} not found`));
    }

    // Link control to policy
    const linkResult = policy.linkControl(controlId, userId);

    if (!linkResult.isSuccess) {
      return Result.fail<Policy>(linkResult.getError());
    }

    // Save updated policy
    const saveResult = await this.policyRepository.save(policy);

    if (!saveResult.isSuccess) {
      return Result.fail<Policy>(saveResult.getError());
    }

    return Result.ok<Policy>(policy);
  }

  /**
   * Unlink a policy from a control
   */
  public async unlinkPolicyFromControl(
    policyId: string,
    controlId: string,
    userId: string
  ): Promise<Result<Policy, Error>> {
    // Find policy
    const policyResult = await this.policyRepository.findById(policyId);

    if (!policyResult.isSuccess) {
      return Result.fail<Policy>(policyResult.getError());
    }

    const policy = policyResult.getValue();

    if (!policy) {
      return Result.fail<Policy>(new Error(`Policy with ID ${policyId} not found`));
    }

    // Unlink control from policy
    const unlinkResult = policy.unlinkControl(controlId, userId);

    if (!unlinkResult.isSuccess) {
      return Result.fail<Policy>(unlinkResult.getError());
    }

    // Save updated policy
    const saveResult = await this.policyRepository.save(policy);

    if (!saveResult.isSuccess) {
      return Result.fail<Policy>(saveResult.getError());
    }

    return Result.ok<Policy>(policy);
  }

  /**
   * Get policies due for review
   */
  public async getPoliciesDueForReview(): Promise<Result<Policy[], Error>> {
    // Find policies with review date in the past
    const policiesResult = await this.policyRepository.findAll({
      status: [PolicyStatus.PUBLISHED],
      reviewDue: true,
      active: true
    });

    if (!policiesResult.isSuccess) {
      return Result.fail<Policy[]>(policiesResult.getError());
    }

    return Result.ok<Policy[]>(policiesResult.getValue());
  }

  /**
   * Get policies by type
   */
  public async getPoliciesByType(
    type: PolicyType,
    onlyEffective: boolean = false
  ): Promise<Result<Policy[], Error>> {
    // Find policies of specific type
    const policiesResult = await this.policyRepository.findAll({
      type: [type],
      status: [PolicyStatus.PUBLISHED],
      effectiveOnly: onlyEffective,
      active: true
    });

    if (!policiesResult.isSuccess) {
      return Result.fail<Policy[]>(policiesResult.getError());
    }

    return Result.ok<Policy[]>(policiesResult.getValue());
  }
}
