import { Result } from '../../domain/common/result';
import {
  EvidenceFilename,
  EvidenceTitle,
  EvidenceType,
  EvidenceCollectionMethod
} from '../../domain/compliance/evidence_values';
import { EvidenceService } from '../../domain/compliance/evidence_service';
import { CreateEvidenceDTO, EvidenceDTO } from '../dtos/evidence_dtos';
import { IControlRepository, IFrameworkRepository } from '../../domain/compliance/framework_repository';

/**
 * Use case for creating a new evidence
 */
export class CreateEvidenceUseCase {
  constructor(
    private evidenceService: EvidenceService,
    private controlRepository: IControlRepository,
    private frameworkRepository: IFrameworkRepository
  ) {}

  /**
   * Execute the use case
   * @param request The evidence creation data
   * @param userId The ID of the user creating the evidence
   */
  public async execute(
    request: CreateEvidenceDTO,
    userId: string
  ): Promise<Result<EvidenceDTO, Error>> {
    // Create value objects
    const titleOrError = EvidenceTitle.create(request.title);
    if (!titleOrError.isSuccess) {
      return Result.fail<EvidenceDTO>(titleOrError.getError());
    }

    const filenameOrError = EvidenceFilename.create(request.file.filename);
    if (!filenameOrError.isSuccess) {
      return Result.fail<EvidenceDTO>(filenameOrError.getError());
    }

    // Call domain service
    const evidenceResult = await this.evidenceService.createEvidence(
      titleOrError.getValue(),
      request.controlIds,
      filenameOrError.getValue(),
      request.file.path,
      request.file.size,
      request.file.mimeType,
      request.file.hash,
      request.type,
      userId,
      {
        description: request.description,
        collectionMethod: request.collectionMethod,
        validityStartDate: request.validityStartDate,
        validityEndDate: request.validityEndDate,
        tags: request.tags,
        metadata: request.metadata
      }
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
        if (control){
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
