import { Result } from '../../domain/common/result';
import { IFrameworkRepository } from '../../domain/compliance/repositories';
import { IControlRepository } from '../../domain/compliance/repositories';
import { FrameworkDTO } from '../dtos/compliance_dtos';

/**
 * Use case for retrieving a framework by ID
 */
export class GetFrameworkUseCase {
  constructor(
    private frameworkRepository: IFrameworkRepository,
    private controlRepository: IControlRepository
  ) {}

  /**
   * Execute the use case
   * @param frameworkId The ID of the framework to retrieve
   * @param includeStats Whether to include control statistics
   */
  public async execute(
    frameworkId: string,
    includeStats = false
  ): Promise<Result<FrameworkDTO, Error>> {
    // Get framework from repository
    const frameworkResult = await this.frameworkRepository.findById(frameworkId);

    if (!frameworkResult.isSuccess) {
      return Result.fail<FrameworkDTO>(frameworkResult.getError());
    }

    const framework = frameworkResult.getValue();

    if (!framework) {
      return Result.fail<FrameworkDTO>(new Error(`Framework with ID ${frameworkId} not found`));
    }

    // Create base DTO
    const frameworkDTO: FrameworkDTO = {
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
    };

    // Include control statistics if requested
    if (includeStats) {
      // Count total controls
      const totalResult = await this.controlRepository.countByFrameworkId(frameworkId, {
        active: true
      });

      if (!totalResult.isSuccess) {
        return Result.fail<FrameworkDTO>(totalResult.getError());
      }

      // Count implemented controls
      const implementedResult = await this.controlRepository.countByFrameworkId(frameworkId, {
        implementationStatus: ['implemented'],
        active: true
      });

      if (!implementedResult.isSuccess) {
        return Result.fail<FrameworkDTO>(implementedResult.getError());
      }

      // Count partially implemented controls
      const partiallyImplementedResult = await this.controlRepository.countByFrameworkId(frameworkId, {
        implementationStatus: ['partially_implemented'],
        active: true
      });

      if (!partiallyImplementedResult.isSuccess) {
        return Result.fail<FrameworkDTO>(partiallyImplementedResult.getError());
      }

      // Count not implemented controls
      const notImplementedResult = await this.controlRepository.countByFrameworkId(frameworkId, {
        implementationStatus: ['not_implemented'],
        active: true
      });

      if (!notImplementedResult.isSuccess) {
        return Result.fail<FrameworkDTO>(notImplementedResult.getError());
      }

      // Count not applicable controls
      const notApplicableResult = await this.controlRepository.countByFrameworkId(frameworkId, {
        implementationStatus: ['not_applicable'],
        active: true
      });

      if (!notApplicableResult.isSuccess) {
        return Result.fail<FrameworkDTO>(notApplicableResult.getError());
      }

      const totalControls = totalResult.getValue();
      const implementedControls = implementedResult.getValue();
      const partiallyImplementedControls = partiallyImplementedResult.getValue();
      const notImplementedControls = notImplementedResult.getValue();
      const notApplicableControls = notApplicableResult.getValue();

      // Calculate implementation rate (excluding N/A controls)
      const applicableControls = totalControls - notApplicableControls;
      const implementationRate = applicableControls > 0
        ? (implementedControls + (partiallyImplementedControls * 0.5)) / applicableControls * 100
        : 0;

      frameworkDTO.controlStats = {
        totalControls,
        implementedControls,
        partiallyImplementedControls,
        notImplementedControls,
        notApplicableControls,
        implementationRate
      };
    }

    return Result.ok<FrameworkDTO>(frameworkDTO);
  }
}
