import { Result } from '../../domain/common/result';
import { IFrameworkRepository, IControlRepository } from '../../domain/compliance/repositories';
import { FrameworkListItemDTO } from '../dtos/compliance_dtos';
import { ImplementationStatus } from '../../domain/compliance/values';

/**
 * Use case for listing compliance frameworks
 */
export class ListFrameworksUseCase {
  constructor(
    private frameworkRepository: IFrameworkRepository,
    private controlRepository: IControlRepository
  ) {}

  /**
   * Execute the use case
   * @param options Filter options for frameworks
   */
  public async execute(
    options?: {
      active?: boolean;
      category?: string;
      organization?: string;
    }
  ): Promise<Result<FrameworkListItemDTO[], Error>> {
    // Get frameworks from repository
    const frameworksResult = await this.frameworkRepository.findAll(options);

    if (!frameworksResult.isSuccess) {
      return Result.fail<FrameworkListItemDTO[]>(frameworksResult.getError());
    }

    const frameworks = frameworksResult.getValue();
    const frameworkDTOs: FrameworkListItemDTO[] = [];

    // Map domain entities to DTOs with additional stats
    for (const framework of frameworks) {
      // Count total controls
      const totalResult = await this.controlRepository.countByFrameworkId(framework.id, {
        active: true
      });

      if (!totalResult.isSuccess) {
        return Result.fail<FrameworkListItemDTO[]>(totalResult.getError());
      }

      const totalControls = totalResult.getValue();

      // Get implementation statistics
      const implementedResult = await this.controlRepository.countByFrameworkId(framework.id, {
        implementationStatus: [ImplementationStatus.IMPLEMENTED],
        active: true
      });

      if (!implementedResult.isSuccess) {
        return Result.fail<FrameworkListItemDTO[]>(implementedResult.getError());
      }

      const partiallyImplementedResult = await this.controlRepository.countByFrameworkId(framework.id, {
        implementationStatus: [ImplementationStatus.PARTIALLY_IMPLEMENTED],
        active: true
      });

      if (!partiallyImplementedResult.isSuccess) {
        return Result.fail<FrameworkListItemDTO[]>(partiallyImplementedResult.getError());
      }

      const notApplicableResult = await this.controlRepository.countByFrameworkId(framework.id, {
        implementationStatus: [ImplementationStatus.NOT_APPLICABLE],
        active: true
      });

      if (!notApplicableResult.isSuccess) {
        return Result.fail<FrameworkListItemDTO[]>(notApplicableResult.getError());
      }

      const implementedControls = implementedResult.getValue();
      const partiallyImplementedControls = partiallyImplementedResult.getValue();
      const notApplicableControls = notApplicableResult.getValue();

      // Calculate implementation rate (excluding N/A controls)
      const applicableControls = totalControls - notApplicableControls;
      const implementationRate = applicableControls > 0
        ? (implementedControls + (partiallyImplementedControls * 0.5)) / applicableControls * 100
        : 0;

      frameworkDTOs.push({
        id: framework.id,
        name: framework.name.getValue(),
        version: framework.version.getValue(),
        organization: framework.organization,
        category: framework.category,
        isActive: framework.isActive,
        controlCount: totalControls,
        implementationRate: Math.round(implementationRate * 10) / 10, // Round to 1 decimal place
        createdAt: framework.createdAt,
        updatedAt: framework.updatedAt
      });
    }

    return Result.ok<FrameworkListItemDTO[]>(frameworkDTOs);
  }
}
