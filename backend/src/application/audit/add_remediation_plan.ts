import { Result } from '../../domain/common/result'
import { AuditService } from '../../domain/audit/audit_service'
import { AddRemediationPlanDTO, FindingDTO } from '../dtos/audit_dtos'

/**
 * Use case for adding a remediation plan to a finding
 */
export class AddRemediationPlanUseCase {
  constructor(private auditService: AuditService) {}

  /**
   * Execute the use case
   */
  public async execute(
    findingId: string,
    request: AddRemediationPlanDTO,
    userId: string
  ): Promise<Result<FindingDTO, Error>> {
    // Call domain service to add remediation plan
    const findingResult = await this.auditService.addRemediationPlan(
      findingId,
      request.description,
      new Date(request.dueDate),
      request.assignee,
      userId
    )

    if (!findingResult.isSuccess) {
      return Result.fail<FindingDTO>(findingResult.getError())
    }

    const finding = findingResult.getValue()

    // Map domain entity to DTO
    return Result.ok<FindingDTO>({
      id: finding.id,
      auditId: finding.auditId,
      title: finding.title.getValue(),
      description: finding.description,
      type: finding.type,
      severity: finding.severity,
      status: finding.status,
      controlIds: finding.controlIds,
      evidenceIds: finding.evidenceIds,
      dueDate: finding.dueDate,
      remediationPlan: finding.remediationPlan
        ? {
            description: finding.remediationPlan.getDescription(),
            dueDate: finding.remediationPlan.getDueDate(),
            assignee: finding.remediationPlan.getAssignee(),
            status: finding.remediationPlan.getStatus(),
            lastUpdated: finding.remediationPlan.getLastUpdated(),
            updatedBy: finding.remediationPlan.getUpdatedBy(),
          }
        : undefined,
      isOverdue: finding.isOverdue(),
      isActive: finding.isActive,
      createdBy: finding.createdBy,
      createdAt: finding.createdAt,
      updatedAt: finding.updatedAt,
    })
  }
}
