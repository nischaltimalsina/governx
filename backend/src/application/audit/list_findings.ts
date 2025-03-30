import { Result } from '../../domain/common/result'
import { IFindingRepository } from '../../domain/audit/repositories'
import { FindingStatus, FindingSeverity, FindingType } from '../../domain/audit/audit_values'
import { FindingListItemDTO, FindingFilterOptionsDTO } from '../dtos/audit_dtos'

/**
 * Use case for listing findings with optional filters
 */
export class ListFindingsUseCase {
  constructor(private findingRepository: IFindingRepository) {}

  /**
   * Execute the use case
   */
  public async execute(
    options?: FindingFilterOptionsDTO
  ): Promise<Result<FindingListItemDTO[], Error>> {
    // Define repository filter options
    const repoOptions: any = {}

    if (options?.auditId) {
      repoOptions.auditId = options.auditId
    }

    if (options?.types && options.types.length > 0) {
      repoOptions.types = options.types
    }

    if (options?.severities && options.severities.length > 0) {
      repoOptions.severities = options.severities
    }

    if (options?.statuses && options.statuses.length > 0) {
      repoOptions.statuses = options.statuses
    }

    if (options?.controlId) {
      repoOptions.controlId = options.controlId
    }

    if (options?.assigneeId) {
      repoOptions.assigneeId = options.assigneeId
    }

    if (options?.overdue !== undefined) {
      repoOptions.overdue = options.overdue
    }

    if (options?.active !== undefined) {
      repoOptions.active = options.active
    }

    if (options?.pageSize) {
      repoOptions.pageSize = options.pageSize
    }

    if (options?.pageNumber) {
      repoOptions.pageNumber = options.pageNumber
    }

    // Get findings from repository
    const findingsResult = await this.findingRepository.findAll(repoOptions)

    if (!findingsResult.isSuccess) {
      return Result.fail<FindingListItemDTO[]>(findingsResult.getError())
    }

    const findings = findingsResult.getValue()

    // Map domain entities to DTOs
    const findingDTOs: FindingListItemDTO[] = findings.map((finding) => ({
      id: finding.id,
      auditId: finding.auditId,
      title: finding.title.getValue(),
      type: finding.type,
      severity: finding.severity,
      status: finding.status,
      dueDate: finding.dueDate,
      assignee: finding.remediationPlan?.getAssignee(),
      hasRemediationPlan: !!finding.remediationPlan,
      isOverdue: finding.isOverdue(),
      createdAt: finding.createdAt,
      updatedAt: finding.updatedAt,
    }))

    return Result.ok<FindingListItemDTO[]>(findingDTOs)
  }
}
