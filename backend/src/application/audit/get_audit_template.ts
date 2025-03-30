import { Result } from '../../domain/common/result'
import { IAuditTemplateRepository } from '../../domain/audit/repositories'
import { AuditTemplateDTO } from '../dtos/audit_dtos'

/**
 * Use case for retrieving an audit template by ID
 */
export class GetAuditTemplateUseCase {
  constructor(private auditTemplateRepository: IAuditTemplateRepository) {}

  /**
   * Execute the use case
   * @param templateId ID of the audit template to retrieve
   */
  public async execute(templateId: string): Promise<Result<AuditTemplateDTO | null, Error>> {
    // Get template from repository
    const templateResult = await this.auditTemplateRepository.findById(templateId)

    if (!templateResult.isSuccess) {
      return Result.fail<AuditTemplateDTO | null>(templateResult.getError())
    }

    const template = templateResult.getValue()

    if (!template) {
      return Result.ok<null>(null)
    }

    // Map domain entity to DTO
    return Result.ok<AuditTemplateDTO>({
      id: template.id,
      name: template.name,
      description: template.description,
      type: template.type,
      frameworkIds: template.frameworkIds,
      controlIds: template.controlIds,
      checklistItems: template.checklistItems,
      isActive: template.isActive,
      createdBy: template.createdBy,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    })
  }
}
