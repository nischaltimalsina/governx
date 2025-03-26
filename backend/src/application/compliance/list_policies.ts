import { Result } from '../../domain/common/result';
import { IPolicyRepository } from '../../domain/compliance/policy_repository';
import { PolicyListItemDTO, PolicyFilterOptionsDTO } from '../dtos/policy_dtos';

/**
 * Use case for listing policies with optional filters
 */
export class ListPoliciesUseCase {
  constructor(private policyRepository: IPolicyRepository) {}

  /**
   * Execute the use case
   * @param options Filter options for policies
   */
  public async execute(
    options?: PolicyFilterOptionsDTO
  ): Promise<Result<PolicyListItemDTO[], Error>> {
    // Define repository filter options
    const repoOptions: any = {};

    if (options?.type && options.type.length > 0) {
      repoOptions.type = options.type;
    }

    if (options?.status && options.status.length > 0) {
      repoOptions.status = options.status;
    }

    if (options?.owner) {
      repoOptions.owner = options.owner;
    }

    if (options?.controlId) {
      repoOptions.controlId = options.controlId;
    }

    if (options?.tags && options.tags.length > 0) {
      repoOptions.tags = options.tags;
    }

    if (options?.effectiveOnly !== undefined) {
      repoOptions.effectiveOnly = options.effectiveOnly;
    }

    if (options?.reviewDue !== undefined) {
      repoOptions.reviewDue = options.reviewDue;
    }

    if (options?.active !== undefined) {
      repoOptions.active = options.active;
    }

    if (options?.pageSize) {
      repoOptions.pageSize = options.pageSize;
    }

    if (options?.pageNumber) {
      repoOptions.pageNumber = options.pageNumber;
    }

    // Get policies from repository
    const policiesResult = await this.policyRepository.findAll(repoOptions);

    if (!policiesResult.isSuccess) {
      return Result.fail<PolicyListItemDTO[]>(policiesResult.getError());
    }

    const policies = policiesResult.getValue();

    // If search term is provided, filter results
    let filteredPolicies = policies;
    if (options?.search) {
      const searchTerm = options.search.toLowerCase();
      filteredPolicies = policies.filter(policy =>
        policy.name.getValue().toLowerCase().includes(searchTerm) ||
        policy.description.toLowerCase().includes(searchTerm) ||
        (policy.tags && policy.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    }

    // Map domain entities to DTOs
    const policyDTOs: PolicyListItemDTO[] = [];

    for (const policy of filteredPolicies) {
      policyDTOs.push({
        id: policy.id,
        name: policy.name.getValue(),
        version: policy.version.getValue(),
        type: policy.type,
        status: policy.status,
        owner: policy.owner,
        effectiveStartDate: policy.effectiveDate?.getStartDate(),
        effectiveEndDate: policy.effectiveDate?.getEndDate(),
        reviewDate: policy.reviewDate,
        isEffective: policy.isEffective(),
        isReviewDue: policy.isReviewDue(),
        controlCount: policy.relatedControlIds?.length || 0,
        tags: policy.tags,
        createdAt: policy.createdAt,
        updatedAt: policy.updatedAt
      });
    }

    return Result.ok<PolicyListItemDTO[]>(policyDTOs);
  }
}
