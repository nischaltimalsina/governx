import { Result } from '../../domain/common/result';
import { IEvidenceRepository } from '../../domain/compliance/evidence_repository';
import { EvidenceListItemDTO, EvidenceFilterOptionsDTO } from '../dtos/evidence_dtos';

/**
 * Use case for listing evidence with optional filters
 */
export class ListEvidenceUseCase {
  constructor(private evidenceRepository: IEvidenceRepository) {}

  /**
   * Execute the use case
   * @param options Filter options for evidence
   */
  public async execute(
    options?: EvidenceFilterOptionsDTO
  ): Promise<Result<EvidenceListItemDTO[], Error>> {
    // Define repository filter options
    const repoOptions: any = {};

    if (options?.controlId) {
      repoOptions.controlId = options.controlId;
    }

    if (options?.frameworkId) {
      repoOptions.frameworkId = options.frameworkId;
    }

    if (options?.status && options.status.length > 0) {
      repoOptions.status = options.status;
    }

    if (options?.type && options.type.length > 0) {
      repoOptions.type = options.type;
    }

    if (options?.tags && options.tags.length > 0) {
      repoOptions.tags = options.tags;
    }

    if (options?.createdBy) {
      repoOptions.createdBy = options.createdBy;
    }

    if (options?.reviewerId) {
      repoOptions.reviewerId = options.reviewerId;
    }

    if (options?.startDate) {
      repoOptions.startDate = options.startDate;
    }

    if (options?.endDate) {
      repoOptions.endDate = options.endDate;
    }

    if (options?.active !== undefined) {
      repoOptions.active = options.active;
    }

    if (options?.pageSize) {
      repoOptions.pageSize = options.pageSize;
    }

    if (options?.pageNumber) {
      repoOptions.pageNumber = options.pageNumber;
    }

    // Get evidence from repository
    const evidenceResult = await this.evidenceRepository.findAll(repoOptions);

    if (!evidenceResult.isSuccess) {
      return Result.fail<EvidenceListItemDTO[]>(evidenceResult.getError());
    }

    const evidenceList = evidenceResult.getValue();

    // If search term is provided, filter results
    let filteredEvidence = evidenceList;
    if (options?.search) {
      const searchTerm = options.search.toLowerCase();
      filteredEvidence = evidenceList.filter(evidence =>
        evidence.title.getValue().toLowerCase().includes(searchTerm) ||
        evidence.filename.getValue().toLowerCase().includes(searchTerm) ||
        (evidence.description && evidence.description.toLowerCase().includes(searchTerm)) ||
        (evidence.tags && evidence.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    }

    // Map domain entities to DTOs
    const evidenceDTOs: EvidenceListItemDTO[] = filteredEvidence.map(evidence => ({
      id: evidence.id,
      title: evidence.title.getValue(),
      type: evidence.type,
      status: evidence.status,
      filename: evidence.filename.getValue(),
      controlCount: evidence.controlIds.length,
      tags: evidence.tags,
      collectedAt: evidence.collectedAt,
      createdBy: evidence.createdBy,
      updatedAt: evidence.updatedAt
    }));

    return Result.ok<EvidenceListItemDTO[]>(evidenceDTOs);
  }
}
