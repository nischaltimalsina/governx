import { Result } from '../../domain/common/result'
import { AuditService } from '../../domain/audit/audit_service'
import { CreateAuditTemplateDTO, AuditTemplateDTO } from '../dtos/audit_dtos'

/**
 * Use case for creating a new audit template
 */
export class CreateAuditTemplateUseCase {
  constructor(private auditService: AuditService) {}

  /**
   * Execute the use case
   */
  public async execute(
    request: CreateAuditTemplateDTO,
    userId: string
  ): Promise<Result<AuditTemplateDTO, Error>> {
    // Call domain service to create audit template
    const templateResult = await this.auditService.createAuditTemplate(
      request.name,
      request.description,
      request.type,
      userId,
      {
        frameworkIds: request.frameworkIds,
        controlIds: request.controlIds,
        checklistItems: request.checklistItems,
      }
    )

    if (!templateResult.isSuccess) {
      return Result.fail<AuditTemplateDTO>(templateResult.getError())
    }

    const template = templateResult.getValue()

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
