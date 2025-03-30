import { Result } from '../../domain/common/result'
import { IAuditTemplateRepository } from '../../domain/audit/repositories'
import { AuditType } from '../../domain/audit/audit_values'
import { AuditTemplateListItemDTO } from '../dtos/audit_dtos'

/**
 * Interface for audit template filter options
 */
export interface AuditTemplateFilterOptionsDTO {
  type?: AuditType[]
  frameworkId?: string
  active?: boolean
  pageSize?: number
  pageNumber?: number
}

/**
 * Use case for listing audit templates with optional filters
 */
export class ListAuditTemplatesUseCase {
  constructor(private auditTemplateRepository: IAuditTemplateRepository) {}

  /**
   * Execute the use case
   */
  public async execute(
    options?: AuditTemplateFilterOptionsDTO
  ): Promise<Result<AuditTemplateListItemDTO[], Error>> {
    // Define repository filter options
    const repoOptions: any = {}

    if (options?.type && options.type.length > 0) {
      repoOptions.type = options.type
    }

    if (options?.frameworkId) {
      repoOptions.frameworkId = options.frameworkId
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

    // Get templates from repository
    const templatesResult = await this.auditTemplateRepository.findAll(repoOptions)

    if (!templatesResult.isSuccess) {
      return Result.fail<AuditTemplateListItemDTO[]>(templatesResult.getError())
    }

    const templates = templatesResult.getValue()

    // Map domain entities to DTOs
    const templateDTOs: AuditTemplateListItemDTO[] = templates.map((template) => ({
      id: template.id,
      name: template.name,
      type: template.type,
      frameworkCount: template.frameworkIds?.length || 0,
      controlCount: template.controlIds?.length || 0,
      checklistItemCount: template.checklistItems?.length || 0,
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    }))

    return Result.ok<AuditTemplateListItemDTO[]>(templateDTOs)
  }
}
