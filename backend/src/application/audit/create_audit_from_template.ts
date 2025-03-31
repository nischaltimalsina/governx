import { Result } from '../../domain/common/result'
import { AuditService } from '../../domain/audit/audit_service'
import { AuditName, AuditType, AuditorInfo, SchedulePeriod } from '../../domain/audit/audit_values'
import { CreateAuditFromTemplateDTO, AuditDTO } from '../dtos/audit_dtos'

/**
 * Use case for creating a new audit from a template
 */
export class CreateAuditFromTemplateUseCase {
  constructor(private auditService: AuditService) {}

  /**
   * Execute the use case
   */
  public async execute(
    request: CreateAuditFromTemplateDTO,
    userId: string
  ): Promise<Result<AuditDTO, Error>> {
    // Create AuditName value object
    const nameOrError = AuditName.create(request.name)
    if (!nameOrError.isSuccess) {
      return Result.fail<AuditDTO>(nameOrError.getError())
    }

    // Create lead auditor value object
    const leadAuditorOrError = AuditorInfo.create(
      request.leadAuditor.id,
      request.leadAuditor.name,
      request.leadAuditor.isExternal,
      request.leadAuditor.organization,
      request.leadAuditor.role
    )
    if (!leadAuditorOrError.isSuccess) {
      return Result.fail<AuditDTO>(leadAuditorOrError.getError())
    }

    // Create audit team value objects if provided
    let auditTeam: AuditorInfo[] | undefined
    if (request.auditTeam && request.auditTeam.length > 0) {
      auditTeam = []
      for (const teamMember of request.auditTeam) {
        const auditorOrError = AuditorInfo.create(
          teamMember.id,
          teamMember.name,
          teamMember.isExternal,
          teamMember.organization,
          teamMember.role
        )
        if (!auditorOrError.isSuccess) {
          return Result.fail<AuditDTO>(auditorOrError.getError())
        }
        auditTeam.push(auditorOrError.getValue())
      }
    }

    // Create schedule period value object
    const schedulePeriodOrError = SchedulePeriod.create(
      new Date(request.schedule.startDate),
      new Date(request.schedule.endDate)
    )
    if (!schedulePeriodOrError.isSuccess) {
      return Result.fail<AuditDTO>(schedulePeriodOrError.getError())
    }

    // Call domain service to create audit from template
    const auditResult = await this.auditService.createAuditFromTemplate(
      request.templateId,
      nameOrError.getValue(),
      leadAuditorOrError.getValue(),
      schedulePeriodOrError.getValue(),
      userId,
      {
        auditTeam,
        description: request.description,
        scope: request.scope,
        methodology: request.methodology,
      }
    )

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
      auditTeam: audit.auditTeam?.map((auditor: AuditorInfo) => ({
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
