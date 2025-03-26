import { Result } from '../../domain/common/result';
import { ComplianceService } from '../../domain/compliance/services';
import { UpdateControlImplementationDTO, ControlDTO } from '../dtos/compliance_dtos';

/**
 * Use case for updating a control's implementation status
 */
export class UpdateControlImplementationUseCase {
  constructor(private complianceService: ComplianceService) {}

  /**
   * Execute the use case
   * @param controlId The ID of the control to update
   * @param request The implementation update data
   * @param userId The ID of the user updating the control
   */
  public async execute(
    controlId: string,
    request: UpdateControlImplementationDTO,
    userId: string
  ): Promise<Result<ControlDTO, Error>> {
    // Call domain service
    const controlResult = await this.complianceService.updateControlImplementation(
      controlId,
      request.implementationStatus,
      userId,
      request.implementationDetails
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
