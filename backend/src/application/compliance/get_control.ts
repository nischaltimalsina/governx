import { Result } from '../../domain/common/result';
import { IControlRepository } from '../../domain/compliance/repositories';
import { ControlDTO, RelatedControlDTO } from '../dtos/compliance_dtos';

/**
 * Use case for retrieving a control by ID
 */
export class GetControlUseCase {
  constructor(private controlRepository: IControlRepository) {}

  /**
   * Execute the use case
   * @param controlId The ID of the control to retrieve
   * @param includeRelated Whether to include related controls
   */
  public async execute(
    controlId: string,
    includeRelated = false
  ): Promise<Result<ControlDTO, Error>> {
    // Get control from repository
    const controlResult = await this.controlRepository.findById(controlId);

    if (!controlResult.isSuccess) {
      return Result.fail<ControlDTO>(controlResult.getError());
    }

    const control = controlResult.getValue();

    if (!control) {
      return Result.fail<ControlDTO>(new Error(`Control with ID ${controlId} not found`));
    }

    // Create base DTO
    const controlDTO: ControlDTO = {
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
    };

    // Include related controls if requested
    if (includeRelated) {
      const relatedControls: RelatedControlDTO[] = [];

      // Add parent control if it exists
      if (control.parentControlId) {
        const parentResult = await this.controlRepository.findById(control.parentControlId);

        if (parentResult.isSuccess && parentResult.getValue()) {
          const parentControl = parentResult.getValue();

          if (parentControl) {
            relatedControls.push({
              id: parentControl.id,
              frameworkId: parentControl.frameworkId,
              code: parentControl.code.getValue(),
              title: parentControl.title.getValue(),
              relationship: 'parent'
            });
          }
        }
      }

      // Find child controls
      const childrenResult = await this.controlRepository.findAll({
        parentControlId: control.id
      });

      if (childrenResult.isSuccess) {
        const childControls = childrenResult.getValue();

        for (const childControl of childControls) {
          relatedControls.push({
            id: childControl.id,
            frameworkId: childControl.frameworkId,
            code: childControl.code.getValue(),
            title: childControl.title.getValue(),
            relationship: 'child'
          });
        }
      }

      if (relatedControls.length > 0) {
        controlDTO.relatedControls = relatedControls;
      }
    }

    return Result.ok<ControlDTO>(controlDTO);
  }
}
