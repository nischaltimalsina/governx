import { Result } from '../../domain/common/result'
import { IAuditRepository, IFindingRepository } from '../../domain/audit/repositories'
import { AuditStatus, AuditType } from '../../domain/audit/audit_values'
import { AuditListItemDTO, AuditFilterOptionsDTO } from '../dtos/audit_dtos'

/**
 * Use case for listing audits with optional filters
 */
export class ListAuditsUseCase {
  constructor(
    private auditRepository: IAuditRepository,
    private findingRepository: IFindingRepository
  ) {}

  /**
   * Execute the use case
   */
  public async execute(
    options?: AuditFilterOptionsDTO
  ): Promise<Result<AuditListItemDTO[], Error>> {
    // Define repository filter options
    const repoOptions: any = {}

    if (options?.types && options.types.length > 0) {
      repoOptions.types = options.types
    }

    if (options?.statuses && options.statuses.length > 0) {
      repoOptions.statuses = options.statuses
    }

    if (options?.frameworkId) {
      repoOptions.frameworkId = options.frameworkId
    }

    if (options?.leadAuditorId) {
      repoOptions.leadAuditorId = options.leadAuditorId
    }

    if (options?.startDate) {
      repoOptions.startDate = options.startDate
    }

    if (options?.endDate) {
      repoOptions.endDate = options.endDate
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

    // Get audits from repository
    const auditsResult = await this.auditRepository.findAll(repoOptions)

    if (!auditsResult.isSuccess) {
      return Result.fail<AuditListItemDTO[]>(auditsResult.getError())
    }

    const audits = auditsResult.getValue()

    // Map domain entities to DTOs
    const auditDTOs: AuditListItemDTO[] = []

    for (const audit of audits) {
      // Get finding count
      const findingsCountResult = await this.findingRepository.count({
        auditId: audit.id,
        active: true,
      })

      let findingCount = 0
      if (findingsCountResult.isSuccess) {
        findingCount = findingsCountResult.getValue()
      }

      // Map to DTO
      auditDTOs.push({
        id: audit.id,
        name: audit.name.getValue(),
        type: audit.type,
        status: audit.status,
        leadAuditor: {
          id: audit.leadAuditor.getId(),
          name: audit.leadAuditor.getName(),
          isExternal: audit.leadAuditor.getIsExternal(),
        },
        schedule: {
          startDate: audit.schedule.getStartDate(),
          endDate: audit.schedule.getEndDate(),
        },
        findingCount,
        frameworkCount: audit.frameworkIds.length,
        isActive: audit.isActive,
        createdAt: audit.createdAt,
        updatedAt: audit.updatedAt,
      })
    }

    return Result.ok<AuditListItemDTO[]>(auditDTOs)
  }
}
