import { Result } from "../../domain/common/result";
import { IPolicyRepository } from "../../domain/compliance/policy_repository";
import { IControlRepository } from "../../domain/compliance/framework_repository";
import { IFrameworkRepository } from "../../domain/compliance/framework_repository";
import { PolicyDTO } from "../dtos/policy_dtos";

/**
 * Use case for retrieving a policy by ID
 */
export class GetPolicyUseCase {
  constructor(
    private policyRepository: IPolicyRepository,
    private controlRepository: IControlRepository,
    private frameworkRepository: IFrameworkRepository,
  ) {}

  /**
   * Execute the use case
   * @param policyId The ID of the policy to retrieve
   * @param includeControls Whether to include detailed control information
   */
  public async execute(
    policyId: string,
    includeControls = false,
  ): Promise<Result<PolicyDTO, Error>> {
    // Get policy from repository
    const policyResult = await this.policyRepository.findById(policyId);

    if (!policyResult.isSuccess) {
      return Result.fail<PolicyDTO>(policyResult.getError());
    }

    const policy = policyResult.getValue();

    if (!policy) {
      return Result.fail<PolicyDTO>(
        new Error(`Policy with ID ${policyId} not found`),
      );
    }

    // Create base DTO
    const policyDTO: PolicyDTO = {
      id: policy.id,
      name: policy.name.getValue(),
      version: policy.version.getValue(),
      type: policy.type,
      status: policy.status,
      description: policy.description,
      content: policy.content,
      document: policy.documentUrl || policy.documentPath
        ? {
          url: policy.documentUrl,
          path: policy.documentPath,
          format: policy.documentFormat!,
        }
        : undefined,
      relatedControlIds: policy.relatedControlIds,
      owner: policy.owner,
      approvers: policy.approvers?.map((approver) => ({
        userId: approver.getUserId(),
        name: approver.getName(),
        title: approver.getTitle(),
        approvedAt: approver.getApprovedAt(),
        comments: approver.getComments(),
      })),
      effectivePeriod: policy.effectiveDate
        ? {
          startDate: policy.effectiveDate.getStartDate(),
          endDate: policy.effectiveDate.getEndDate(),
        }
        : undefined,
      reviewDate: policy.reviewDate,
      isEffective: policy.isEffective(),
      isReviewDue: policy.isReviewDue(),
      tags: policy.tags,
      isActive: policy.isActive,
      createdBy: policy.createdBy,
      updatedBy: policy.updatedBy,
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    };

    // Include control details if requested
    if (
      includeControls && policy.relatedControlIds &&
      policy.relatedControlIds.length > 0
    ) {
      policyDTO.controls = await this.getControlsInfo(policy.relatedControlIds);
    }

    return Result.ok<PolicyDTO>(policyDTO);
  }

  /**
   * Helper method to get detailed control information including framework names
   */
  private async getControlsInfo(controlIds: string[]) {
    const controls = [];

    for (const controlId of controlIds) {
      const controlResult = await this.controlRepository.findById(controlId);

      if (controlResult.isSuccess && controlResult.getValue()) {
        const control = controlResult.getValue();
        if (control) {
          // Get framework name
          let frameworkName = "";
          const frameworkResult = await this.frameworkRepository.findById(
            control.frameworkId,
          );
          if (frameworkResult.isSuccess && frameworkResult.getValue()) {
            frameworkName = frameworkResult.getValue()?.name.getValue() ?? "";
          }

          controls.push({
            id: control.id,
            code: control.code.getValue(),
            title: control.title.getValue(),
            implementationStatus: control.implementationStatus,
            frameworkId: control.frameworkId,
            frameworkName,
          });
        }
      }
    }

    return controls.length > 0 ? controls : undefined;
  }
}
