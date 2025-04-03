import { Result } from '../../domain/common/result'
import { ComplianceService } from '../../domain/compliance/framework_services'
import { UpdateFrameworkDTO, FrameworkDTO } from '../dtos/compliance_dtos'

/**
 * Use case for updating an existing compliance framework
 */
export class UpdateFrameworkUseCase {
  constructor(private complianceService: ComplianceService) {}

  /**
   * Execute the use case
   * @param frameworkId The ID of the framework to update
   * @param request The framework update data
   * @param userId The ID of the user updating the framework
   */
  public async execute(
    frameworkId: string,
    request: UpdateFrameworkDTO,
    userId: string
  ): Promise<Result<FrameworkDTO, Error>> {
    // Call domain service
    const frameworkResult = await this.complianceService.updateFramework(frameworkId, userId, {
      description: request.description,
      organization: request.organization,
      category: request.category,
      website: request.website,
      isActive: request.isActive,
    })

    if (!frameworkResult.isSuccess) {
      return Result.fail<FrameworkDTO>(frameworkResult.getError())
    }

    const framework = frameworkResult.getValue()

    // Map domain entity to DTO
    return Result.ok<FrameworkDTO>({
      id: framework.id,
      name: framework.name.getValue(),
      version: framework.version.getValue(),
      description: framework.description,
      organization: framework.organization,
      category: framework.category,
      website: framework.website,
      isActive: framework.isActive,
      createdBy: framework.createdBy,
      updatedBy: framework.updatedBy,
      createdAt: framework.createdAt,
      updatedAt: framework.updatedAt,
    })
  }
}
