import { Result } from '../../domain/common/result';
import { IRiskRepository } from '../../domain/risk/repositories';
import { IRiskTreatmentRepository } from '../../domain/risk/repositories';
import { RiskListItemDTO, RiskFilterOptionsDTO } from '../dtos/risk_dtos';

/**
 * Use case for listing risks with filters
 */
export class ListRisksUseCase {
  constructor(
    private riskRepository: IRiskRepository,
    private riskTreatmentRepository: IRiskTreatmentRepository
  ) {}

  /**
   * Execute the use case
   * @param options Filter options for risks
   */
  public async execute(
    options?: RiskFilterOptionsDTO
  ): Promise<Result<RiskListItemDTO[], Error>> {
    // Define repository filter options
    const repoOptions: any = {};

    if (options?.categories && options.categories.length > 0) {
      repoOptions.categories = options.categories;
    }

    if (options?.statuses && options.statuses.length > 0) {
      repoOptions.statuses = options.statuses;
    }

    if (options?.severities && options.severities.length > 0) {
      repoOptions.severities = options.severities;
    }

    if (options?.ownerId) {
      repoOptions.ownerId = options.ownerId;
    }

    if (options?.controlId) {
      repoOptions.controlId = options.controlId;
    }

    if (options?.assetId) {
      repoOptions.assetId = options.assetId;
    }

    if (options?.tags && options.tags.length > 0) {
      repoOptions.tags = options.tags;
    }

    if (options?.reviewDue !== undefined) {
      repoOptions.reviewDue = options.reviewDue;
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

    // Get risks from repository
    const risksResult = await this.riskRepository.findAll(repoOptions);

    if (!risksResult.isSuccess) {
      return Result.fail<RiskListItemDTO[]>(risksResult.getError());
    }

    const risks = risksResult.getValue();

    // If search term is provided, filter results
    let filteredRisks = risks;
    if (options?.search) {
      const searchTerm = options.search.toLowerCase();
      filteredRisks = risks.filter(risk =>
        risk.name.getValue().toLowerCase().includes(searchTerm) ||
        risk.description.toLowerCase().includes(searchTerm) ||
        (risk.tags && risk.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    }

    // Map domain entities to DTOs and include treatment counts
    const riskDTOs: RiskListItemDTO[] = [];

    for (const risk of filteredRisks) {
      // Get treatment count
      const treatmentCountResult = await this.riskTreatmentRepository.count({
        riskId: risk.id,
        active: true
      });

      const treatmentCount = treatmentCountResult.isSuccess
        ? treatmentCountResult.getValue()
        : 0;

      riskDTOs.push({
        id: risk.id,
        name: risk.name.getValue(),
        category: risk.category,
        status: risk.status,
        inherentRiskScore: {
          value: risk.inherentRiskScore.getValue(),
          severity: risk.inherentRiskScore.getSeverity()
        },
        residualRiskScore: risk.residualRiskScore ? {
          value: risk.residualRiskScore.getValue(),
          severity: risk.residualRiskScore.getSeverity()
        } : undefined,
        owner: risk.owner ? {
          id: risk.owner.getUserId(),
          name: risk.owner.getName()
        } : undefined,
        isReviewDue: risk.isReviewDue(),
        treatmentCount,
        tags: risk.tags,
        createdAt: risk.createdAt,
        updatedAt: risk.updatedAt
      });
    }

    return Result.ok<RiskListItemDTO[]>(riskDTOs);
  }
}
