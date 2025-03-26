import { Result } from '../../domain/common/result';
import { FrameworkName, FrameworkVersion } from '../../domain/compliance/framework_values';
import { ComplianceService } from '../../domain/compliance/framework_services';
import { CreateFrameworkDTO, FrameworkDTO } from '../dtos/compliance_dtos';

/**
 * Use case for creating a new compliance framework
 */
export class CreateFrameworkUseCase {
  constructor(private complianceService: ComplianceService) {}

  /**
   * Execute the use case
   * @param request The framework creation data
   * @param userId The ID of the user creating the framework
   */
  public async execute(
    request: CreateFrameworkDTO,
    userId: string
  ): Promise<Result<FrameworkDTO, Error>> {
    // Create value objects
    const nameOrError = FrameworkName.create(request.name);
    if (!nameOrError.isSuccess) {
      return Result.fail<FrameworkDTO>(nameOrError.getError());
    }

    const versionOrError = FrameworkVersion.create(request.version);
    if (!versionOrError.isSuccess) {
      return Result.fail<FrameworkDTO>(versionOrError.getError());
    }

    // Call domain service
    const frameworkResult = await this.complianceService.createFramework(
      nameOrError.getValue(),
      versionOrError.getValue(),
      request.description,
      userId,
      {
        organization: request.organization,
        category: request.category,
        website: request.website,
        isActive: request.isActive
      }
    );

    if (!frameworkResult.isSuccess) {
      return Result.fail<FrameworkDTO>(frameworkResult.getError());
    }

    const framework = frameworkResult.getValue();

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
      updatedAt: framework.updatedAt
    });
  }
}
