import { AuditService } from '../../domain/audit/audit_service'
import { Result } from '../../domain/common/result'
import { FindingDTO, UpdateRemediationPlanDTO } from '../dtos/audit_dtos'

/**
 * Use case for updating a finding's remediation plan
 */
export class UpdateRemediationPlanUseCase {
  constructor(private auditService: AuditService) {}

  /**
   * Execute the use case
   */
  public async execute(
    findingId: string,
    request: UpdateRemediationPlanDTO,
    userId: string
  ): Promise<Result<FindingDTO, Error>> {
    // Prepare updates for service call
    const updates: any = {}

    if (request.description !== undefined) {
      updates.description = request.description
    }

    if (request.dueDate !== undefined) {
      updates.dueDate = new Date(request.dueDate)
    }

    if (request.assignee !== undefined) {
      updates.assignee = request.assignee
    }

    if (request.status !== undefined) {
      updates.status = request.status
    }

    // Call domain service to update remediation plan
    const findingResult = await this.auditService.updateRemediationPlan(findingId, updates, userId)

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
