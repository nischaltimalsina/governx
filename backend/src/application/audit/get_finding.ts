import { Result } from '../../domain/common/result'
import { IFindingRepository } from '../../domain/audit/repositories'
import { FindingDTO } from '../dtos/audit_dtos'

/**
 * Use case for retrieving a finding by ID
 */
export class GetFindingUseCase {
  constructor(private findingRepository: IFindingRepository) {}

  /**
   * Execute the use case
   * @param findingId ID of the finding to retrieve
   */
  public async execute(findingId: string): Promise<Result<FindingDTO | null, Error>> {
    // Get finding from repository
    const findingResult = await this.findingRepository.findById(findingId)

    if (!findingResult.isSuccess) {
      return Result.fail<FindingDTO | null>(findingResult.getError())
    }

    const finding = findingResult.getValue()

    if (!finding) {
      return Result.ok<null>(null)
    }

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
