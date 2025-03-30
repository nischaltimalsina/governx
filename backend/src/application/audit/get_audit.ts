import { Result } from '../../domain/common/result'
import { IAuditRepository, IFindingRepository } from '../../domain/audit/repositories'
import { AuditDTO, FindingListItemDTO } from '../dtos/audit_dtos'

/**
 * Use case for retrieving an audit by ID
 */
export class GetAuditUseCase {
  constructor(
    private auditRepository: IAuditRepository,
    private findingRepository: IFindingRepository
  ) {}

  /**
   * Execute the use case
   * @param auditId ID of the audit to retrieve
   * @param includeFindings Whether to include linked findings
   */
  public async execute(
    auditId: string,
    includeFindings: boolean = false
  ): Promise<Result<AuditDTO | null, Error>> {
    // Get audit from repository
    const auditResult = await this.auditRepository.findById(auditId)

    if (!auditResult.isSuccess) {
      return Result.fail<AuditDTO | null>(auditResult.getError())
    }

    const audit = auditResult.getValue()

    if (!audit) {
      return Result.ok<null>(null)
    }

    // Map domain entity to DTO
    const auditDTO: AuditDTO = {
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
    }

    // Include findings if requested
    if (includeFindings) {
      const findingsResult = await this.findingRepository.findByAuditId(auditId, { active: true })

      if (!findingsResult.isSuccess) {
        return Result.fail<AuditDTO | null>(findingsResult.getError())
      }

      const findings = findingsResult.getValue()

      // Map findings to DTOs and add to audit
      auditDTO.findings = findings.map((finding) => ({
        id: finding.id,
        auditId: finding.auditId,
        title: finding.title.getValue(),
        type: finding.type,
        severity: finding.severity,
        status: finding.status,
        dueDate: finding.dueDate,
        hasRemediationPlan: !!finding.remediationPlan,
        isOverdue: finding.isOverdue(),
        createdAt: finding.createdAt,
      }))
    }

    return Result.ok<AuditDTO>(auditDTO)
  }
}
