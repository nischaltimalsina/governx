import { Result } from '../../domain/common/result'
import { AuditService } from '../../domain/audit/audit_service'
import { AuditStatus } from '../../domain/audit/audit_values'
import { UpdateAuditStatusDTO, AuditDTO } from '../dtos/audit_dtos'

/**
 * Use case for updating an audit's status
 */
export class UpdateAuditStatusUseCase {
  constructor(private auditService: AuditService) {}

  /**
   * Execute the use case
   */
  public async execute(
    auditId: string,
    request: UpdateAuditStatusDTO,
    userId: string
  ): Promise<Result<AuditDTO, Error>> {
    // Call domain service to update audit status
    const auditResult = await this.auditService.updateAuditStatus(auditId, request.status, userId)

    if (!auditResult.isSuccess) {
      return Result.fail<AuditDTO>(auditResult.getError())
    }

    const audit = auditResult.getValue()

    // Map domain entity to DTO
    return Result.ok<AuditDTO>({
      id: audit.id,
      name: audit.name.getValue(),
      type: audit.type,
      status: audit.status,
      description: audit.description,
      frameworkIds: audit.frameworkIds,
      leadAuditor: {
        id: audit.leadAuditor.getId(),
        name: audit.leadAuditor.getName(),
        organization: audit.leadAuditor.getOrganization(),
        role: audit.leadAuditor.getRole(),
        isExternal: audit.leadAuditor.getIsExternal(),
      },
      auditTeam: audit.auditTeam?.map((auditor) => ({
        id: auditor.getId(),
        name: auditor.getName(),
        organization: auditor.getOrganization(),
        role: auditor.getRole(),
        isExternal: auditor.getIsExternal(),
      })),
      schedule: {
        startDate: audit.schedule.getStartDate(),
        endDate: audit.schedule.getEndDate(),
      },
      scope: audit.scope,
      methodology: audit.methodology,
      isActive: audit.isActive,
      createdBy: audit.createdBy,
      createdAt: audit.createdAt,
      updatedAt: audit.updatedAt,
    })
  }
}
