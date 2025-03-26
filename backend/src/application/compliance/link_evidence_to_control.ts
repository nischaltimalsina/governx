import { Result } from '../../domain/common/result';
import { EvidenceService } from '../../domain/compliance/evidence_service';
import { IControlRepository, IFrameworkRepository } from '../../domain/compliance/framework_repository';
import { LinkControlDTO, EvidenceDTO } from '../dtos/evidence_dtos';

/**
 * Use case for linking evidence to a control
 */
export class LinkEvidenceToControlUseCase {
  constructor(
    private evidenceService: EvidenceService,
    private controlRepository: IControlRepository,
    private frameworkRepository: IFrameworkRepository
  ) {}

  /**
   * Execute the use case
   * @param evidenceId The ID of the evidence
   * @param request The link control data
   * @param userId The ID of the user performing the operation
   */
  public async execute(
    evidenceId: string,
    request: LinkControlDTO,
    userId: string
  ): Promise<Result<EvidenceDTO, Error>> {
    // Call domain service
    const evidenceResult = await this.evidenceService.linkEvidenceToControl(
      evidenceId,
      request.controlId,
      userId
    );

    if (!evidenceResult.isSuccess) {
      return Result.fail<EvidenceDTO>(evidenceResult.getError());
    }

    const evidence = evidenceResult.getValue();

    // Fetch control information for the response
    const controls = await this.getControlsInfo(evidence.controlIds);

    // Map domain entity to DTO
    return Result.ok<EvidenceDTO>({
      id: evidence.id,
      title: evidence.title.getValue(),
      controlIds: evidence.controlIds,
      file: {
        filename: evidence.filename.getValue(),
        path: evidence.filePath,
        size: evidence.fileSize,
        mimeType: evidence.mimeType,
        hash: evidence.fileHash?.getValue()
      },
      type: evidence.type,
      status: evidence.status,
      collectionMethod: evidence.collectionMethod,
      description: evidence.description,
      collectedAt: evidence.collectedAt,
      validityPeriod: evidence.validityPeriod ? {
        startDate: evidence.validityPeriod.getStartDate(),
        endDate: evidence.validityPeriod.getEndDate() || undefined
      } : undefined,
      review: evidence.reviewerId ? {
        reviewerId: evidence.reviewerId,
        reviewedAt: evidence.reviewedAt!,
        notes: evidence.reviewNotes
      } : undefined,
      tags: evidence.tags,
      metadata: evidence.metadata,
      isActive: evidence.isActive,
      createdBy: evidence.createdBy,
      updatedBy: evidence.updatedBy,
      createdAt: evidence.createdAt,
      updatedAt: evidence.updatedAt,
      controls
    });
  }

  /**
   * Helper method to get control information for the evidence
   */
  private async getControlsInfo(controlIds: string[]) {
    const controls = [];

    for (const controlId of controlIds) {
      const controlResult = await this.controlRepository.findById(controlId);

      if (controlResult.isSuccess && controlResult.getValue()) {
        const control = controlResult.getValue();
        if (control) {
          const frameworkResult = await this.frameworkRepository.findById(control.frameworkId);
          if (frameworkResult.isSuccess && frameworkResult.getValue()) {
            const framework = frameworkResult.getValue();
            controls.push({
              id: control.id,
              code: control.code.getValue(),
              title: control.title.getValue(),
              implementationStatus: control.implementationStatus,
              frameworkId: control.frameworkId,
              frameworkName: framework?.name as string | undefined,
            });
          }
      }
      }
    }

    return controls.length > 0 ? controls : undefined;
  }
}
