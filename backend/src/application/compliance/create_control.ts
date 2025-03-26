import { Result } from '../../domain/common/result';
import { ControlCode, ControlTitle } from '../../domain/compliance/values';
import { ComplianceService } from '../../domain/compliance/services';
import { CreateControlDTO, ControlDTO } from '../dtos/compliance_dtos';

/**
 * Use case for creating a new compliance control
 */
export class CreateControlUseCase {
  constructor(private complianceService: ComplianceService) {}

  /**
   * Execute the use case
   * @param request The control creation data
   * @param userId The ID of the user creating the control
   */
  public async execute(
    request: CreateControlDTO,
    userId: string
  ): Promise<Result<ControlDTO, Error>> {
    // Create value objects
    const codeOrError = ControlCode.create(request.code);
    if (!codeOrError.isSuccess) {
      return Result.fail<ControlDTO>(codeOrError.getError());
    }

    const titleOrError = ControlTitle.create(request.title);
    if (!titleOrError.isSuccess) {
      return Result.fail<ControlDTO>(titleOrError.getError());
    }

    // Call domain service
    const controlResult = await this.complianceService.addControl(
      request.frameworkId,
      codeOrError.getValue(),
      titleOrError.getValue(),
      request.description,
      userId,
      {
        guidance: request.guidance,
        implementationStatus: request.implementationStatus,
        implementationDetails: request.implementationDetails,
        ownerId: request.ownerId,
        categories: request.categories,
        parentControlId: request.parentControlId,
        isActive: request.isActive
      }
    );

    if (!controlResult.isSuccess) {
      return Result.fail<ControlDTO>(controlResult.getError());
    }

    const control = controlResult.getValue();

    // Map domain entity to DTO
    return Result.ok<ControlDTO>({
      id: control.id,
      frameworkId: control.frameworkId,
      code: control.code.getValue(),
      title: control.title.getValue(),
      description: control.description,
      guidance: control.guidance,
      implementationStatus: control.implementationStatus,
      implementationDetails: control.implementationDetails,
      ownerId: control.ownerId,
      categories: control.categories,
      parentControlId: control.parentControlId,
      isActive: control.isActive,
      createdBy: control.createdBy,
      updatedBy: control.updatedBy,
      createdAt: control.createdAt,
      updatedAt: control.updatedAt
    });
  }
}
