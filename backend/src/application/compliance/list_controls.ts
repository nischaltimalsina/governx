import { Result } from '../../domain/common/result';
import { IControlRepository } from '../../domain/compliance/repositories';
import { ControlListItemDTO, ControlFilterOptionsDTO } from '../dtos/compliance_dtos';

/**
 * Use case for listing controls with filter options
 */
export class ListControlsUseCase {
  constructor(private controlRepository: IControlRepository) {}

  /**
   * Execute the use case
   * @param options Filter options for controls
   */
  public async execute(
    options?: ControlFilterOptionsDTO
  ): Promise<Result<ControlListItemDTO[], Error>> {
    // Define repository filter options
    const repoOptions: any = {};

    if (options?.frameworkId) {
      repoOptions.frameworkId = options.frameworkId;
    }

    if (options?.implementationStatus && options.implementationStatus.length > 0) {
      repoOptions.implementationStatus = options.implementationStatus;
    }

    if (options?.categories && options.categories.length > 0) {
      repoOptions.categories = options.categories;
    }

    if (options?.ownerId) {
      repoOptions.ownerId = options.ownerId;
    }

    if (options?.isActive !== undefined) {
      repoOptions.active = options.isActive;
    }

    // Get controls from repository
    const controlsResult = await this.controlRepository.findAll(repoOptions);

    if (!controlsResult.isSuccess) {
      return Result.fail<ControlListItemDTO[]>(controlsResult.getError());
    }

    const controls = controlsResult.getValue();

    // If search term is provided, filter results
    let filteredControls = controls;
    if (options?.search) {
      const searchTerm = options.search.toLowerCase();
      filteredControls = controls.filter(control =>
        control.code.getValue().toLowerCase().includes(searchTerm) ||
        control.title.getValue().toLowerCase().includes(searchTerm) ||
        control.description.toLowerCase().includes(searchTerm)
      );
    }

    // Map domain entities to DTOs
    const controlDTOs: ControlListItemDTO[] = filteredControls.map(control => ({
      id: control.id,
      frameworkId: control.frameworkId,
      code: control.code.getValue(),
      title: control.title.getValue(),
      implementationStatus: control.implementationStatus,
      categories: control.categories,
      ownerId: control.ownerId,
      isActive: control.isActive,
      updatedAt: control.updatedAt
    }));

    return Result.ok<ControlListItemDTO[]>(controlDTOs);
  }
}
