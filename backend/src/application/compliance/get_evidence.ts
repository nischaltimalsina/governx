import { Result } from "../../domain/common/result";
import { IEvidenceRepository } from "../../domain/compliance/evidence_repository";
import { IControlRepository } from "../../domain/compliance/framework_repository";
import { IFrameworkRepository } from "../../domain/compliance/framework_repository";
import { EvidenceDTO } from "../dtos/evidence_dtos";

/**
 * Use case for retrieving evidence by ID
 */
export class GetEvidenceUseCase {
  constructor(
    private evidenceRepository: IEvidenceRepository,
    private controlRepository: IControlRepository,
    private frameworkRepository: IFrameworkRepository,
  ) {}

  /**
   * Execute the use case
   * @param evidenceId The ID of the evidence to retrieve
   * @param includeControls Whether to include detailed control information
   */
  public async execute(
    evidenceId: string,
    includeControls = false,
  ): Promise<Result<EvidenceDTO, Error>> {
    // Get evidence from repository
    const evidenceResult = await this.evidenceRepository.findById(evidenceId);

    if (!evidenceResult.isSuccess) {
      return Result.fail<EvidenceDTO>(evidenceResult.getError());
    }

    const evidence = evidenceResult.getValue();

    if (!evidence) {
      return Result.fail<EvidenceDTO>(
        new Error(`Evidence with ID ${evidenceId} not found`),
      );
    }

    // Create base DTO
    const evidenceDTO: EvidenceDTO = {
      id: evidence.id,
      title: evidence.title.getValue(),
      controlIds: evidence.controlIds,
      file: {
        filename: evidence.filename.getValue(),
        path: evidence.filePath,
        size: evidence.fileSize,
        mimeType: evidence.mimeType,
        hash: evidence.fileHash?.getValue(),
      },
      type: evidence.type,
      status: evidence.status,
      collectionMethod: evidence.collectionMethod,
      description: evidence.description,
      collectedAt: evidence.collectedAt,
      validityPeriod: evidence.validityPeriod
        ? {
          startDate: evidence.validityPeriod.getStartDate(),
          endDate: evidence.validityPeriod.getEndDate() || undefined,
        }
        : undefined,
      review: evidence.reviewerId
        ? {
          reviewerId: evidence.reviewerId,
          reviewedAt: evidence.reviewedAt!,
          notes: evidence.reviewNotes,
        }
        : undefined,
      tags: evidence.tags,
      metadata: evidence.metadata,
      isActive: evidence.isActive,
      createdBy: evidence.createdBy,
      updatedBy: evidence.updatedBy,
      createdAt: evidence.createdAt,
      updatedAt: evidence.updatedAt,
    };

    // Include control details if requested
    if (includeControls && evidence.controlIds.length > 0) {
      evidenceDTO.controls = await this.getDetailedControlsInfo(
        evidence.controlIds,
      );
    }

    return Result.ok<EvidenceDTO>(evidenceDTO);
  }

  /**
   * Helper method to get detailed control information including framework names
   */
  private async getDetailedControlsInfo(controlIds: string[]) {
    const controls = [];

    for (const controlId of controlIds) {
      const controlResult = await this.controlRepository.findById(controlId);

      if (controlResult.isSuccess && controlResult.getValue()) {
        const control = controlResult.getValue();

        // Get framework name
        if (control) {
          let frameworkName = "";
          const frameworkResult = await this.frameworkRepository.findById(
            control.frameworkId,
          );
          if (frameworkResult.isSuccess && frameworkResult.getValue()) {
            frameworkName = frameworkResult.getValue()?.name.getValue() ?? "";
          }

          controls.push({
            id: control.id,
            code: control.code.getValue(),
            title: control.title.getValue(),
            implementationStatus: control.implementationStatus,
            frameworkId: control.frameworkId,
            frameworkName,
          });
        }
      }
    }

    return controls.length > 0 ? controls : undefined;
  }
}
