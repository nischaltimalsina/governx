import { Result } from '../../domain/common/result';
import { PolicyName } from '../../domain/compliance/policy_values';
import { PolicyService } from '../../domain/compliance/policy_service';
import { CreatePolicyDTO, PolicyDTO } from '../dtos/policy_dtos';

/**
 * Use case for creating a new policy
 */
export class CreatePolicyUseCase {
  constructor(private policyService: PolicyService) {}

  /**
   * Execute the use case
   * @param request The policy creation data
   * @param userId The ID of the user creating the policy
   */
  public async execute(
    request: CreatePolicyDTO,
    userId: string
  ): Promise<Result<PolicyDTO, Error>> {
    // Create value objects
    const nameOrError = PolicyName.create(request.name);
    if (!nameOrError.isSuccess) {
      return Result.fail<PolicyDTO>(nameOrError.getError());
    }

    // Call domain service
    const policyResult = await this.policyService.createPolicy(
      nameOrError.getValue(),
      request.type,
      request.description,
      request.owner,
      userId,
      {
        content: request.content,
        documentUrl: request.document?.url,
        documentPath: request.document?.path,
        documentFormat: request.document?.format,
        relatedControlIds: request.relatedControlIds,
        effectiveStartDate: request.effectiveStartDate,
        effectiveEndDate: request.effectiveEndDate,
        reviewDate: request.reviewDate,
        tags: request.tags
      }
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
