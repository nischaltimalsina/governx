import { Result } from '../../domain/common/result'
import { AuditService } from '../../domain/audit/audit_service'
import { FindingTitle, FindingType, FindingSeverity } from '../../domain/audit/audit_values'
import { CreateFindingDTO, FindingDTO } from '../dtos/audit_dtos'

/**
 * Use case for creating a new audit finding
 */
export class CreateFindingUseCase {
  constructor(private auditService: AuditService) {}

  /**
   * Execute the use case
   */
  public async execute(
    request: CreateFindingDTO,
    userId: string
  ): Promise<Result<FindingDTO, Error>> {
    // Create FindingTitle value object
    const titleOrError = FindingTitle.create(request.title)
    if (!titleOrError.isSuccess) {
      return Result.fail<FindingDTO>(titleOrError.getError())
    }

    // Prepare options for service call
    const options: any = {
      controlIds: request.controlIds,
      evidenceIds: request.evidenceIds,
      dueDate: request.dueDate ? new Date(request.dueDate) : undefined,
    }

    // Add remediation plan if provided
    if (request.remediationPlan) {
      options.remediationPlan = {
        description: request.remediationPlan.description,
        dueDate: new Date(request.remediationPlan.dueDate),
        assignee: request.remediationPlan.assignee,
      }
    }

    // Call domain service to create finding
    const findingResult = await this.auditService.createFinding(
      request.auditId,
      titleOrError.getValue(),
      request.description,
      request.type,
      request.severity,
      userId,
      options
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
