import { Result } from '../../domain/common/result';
import { PolicyService } from '../../domain/compliance/policy_service';
import { PublishPolicyDTO, PolicyDTO } from '../dtos/policy_dtos';

/**
 * Use case for publishing a policy
 */
export class PublishPolicyUseCase {
  constructor(private policyService: PolicyService) {}

  /**
   * Execute the use case
   * @param policyId The ID of the policy to publish
   * @param request The publishing data
   * @param userId The ID of the user publishing the policy
   */
  public async execute(
    policyId: string,
    request: PublishPolicyDTO,
    userId: string
  ): Promise<Result<PolicyDTO, Error>> {
    // Call domain service
    const policyResult = await this.policyService.publishPolicy(
      policyId,
      request.effectiveStartDate,
      request.effectiveEndDate,
      request.reviewDate,
      userId
    );

    if (!policyResult.isSuccess) {
      return Result.fail<PolicyDTO>(policyResult.getError());
    }

    const policy = policyResult.getValue();

    // Map domain entity to DTO
    return Result.ok<PolicyDTO>({
      id: policy.id,
      name: policy.name.getValue(),
      version: policy.version.getValue(),
      type: policy.type,
      status: policy.status,
      description: policy.description,
      content: policy.content,
      document: policy.documentUrl || policy.documentPath ? {
        url: policy.documentUrl,
        path: policy.documentPath,
        format: policy.documentFormat!
      } : undefined,
      relatedControlIds: policy.relatedControlIds,
      owner: policy.owner,
      approvers: policy.approvers?.map(approver => ({
        userId: approver.getUserId(),
        name: approver.getName(),
        title: approver.getTitle(),
        approvedAt: approver.getApprovedAt(),
        comments: approver.getComments()
      })),
      effectivePeriod: policy.effectiveDate ? {
        startDate: policy.effectiveDate.getStartDate(),
        endDate: policy.effectiveDate.getEndDate()
      } : undefined,
      reviewDate: policy.reviewDate,
      isEffective: policy.isEffective(),
      isReviewDue: policy.isReviewDue(),
      tags: policy.tags,
      isActive: policy.isActive,
      createdBy: policy.createdBy,
      updatedBy: policy.updatedBy,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt
    });
  }
}
