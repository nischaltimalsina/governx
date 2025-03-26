import { Result } from '../../domain/common/result';
import {
  RiskName,
  RiskOwner
} from '../../domain/risk/risk_values';
import { RiskManagementService } from '../../domain/risk/service';
import { CreateRiskDTO, RiskDTO } from '../dtos/risk_dtos';

/**
 * Use case for creating a new risk
 */
export class CreateRiskUseCase {
  constructor(private riskManagementService: RiskManagementService) {}

  /**
   * Execute the use case
   * @param request The risk creation data
   * @param userId The ID of the user creating the risk
   */
  public async execute(
    request: CreateRiskDTO,
    userId: string
  ): Promise<Result<RiskDTO, Error>> {
    // Create value objects
    const nameOrError = RiskName.create(request.name);
    if (!nameOrError.isSuccess) {
      return Result.fail<RiskDTO>(nameOrError.getError());
    }

    // Create owner if provided
    let owner: RiskOwner | undefined;
    if (request.owner) {
      const ownerResult = RiskOwner.create(
        request.owner.id,
        request.owner.name,
        request.owner.department
      );

      if (!ownerResult.isSuccess) {
        return Result.fail<RiskDTO>(ownerResult.getError());
      }

      owner = ownerResult.getValue();
    }

    // Call domain service
    const riskResult = await this.riskManagementService.createRisk(
      nameOrError.getValue(),
      request.description,
      request.category,
      request.inherentImpact,
      request.inherentLikelihood,
      userId,
      {
        residualImpact: request.residualImpact,
        residualLikelihood: request.residualLikelihood,
        owner,
        relatedControlIds: request.relatedControlIds,
        relatedAssets: request.relatedAssets,
        reviewPeriodMonths: request.reviewPeriodMonths,
        tags: request.tags
      }
    );

    if (!riskResult.isSuccess) {
      return Result.fail<RiskDTO>(riskResult.getError());
    }

    const risk = riskResult.getValue();

    // Map domain entity to DTO
    return Result.ok<RiskDTO>({
      id: risk.id,
      name: risk.name.getValue(),
      description: risk.description,
      category: risk.category,
      status: risk.status,
      inherentImpact: risk.inherentImpact,
      inherentLikelihood: risk.inherentLikelihood,
      inherentRiskScore: {
        value: risk.inherentRiskScore.getValue(),
        severity: risk.inherentRiskScore.getSeverity()
      },
      residualImpact: risk.residualImpact,
      residualLikelihood: risk.residualLikelihood,
      residualRiskScore: risk.residualRiskScore ? {
        value: risk.residualRiskScore.getValue(),
        severity: risk.residualRiskScore.getSeverity()
      } : undefined,
      riskReductionPercentage: risk.getRiskReductionPercentage(),
      owner: risk.owner ? {
        id: risk.owner.getUserId(),
        name: risk.owner.getName(),
        department: risk.owner.getDepartment(),
        assignedAt: risk.owner.getAssignedAt()
      } : undefined,
      relatedControlIds: risk.relatedControlIds,
      relatedAssets: risk.relatedAssets,
      reviewPeriod: risk.reviewPeriod ? {
        months: risk.reviewPeriod.getMonths(),
        lastReviewed: risk.reviewPeriod.getLastReviewed(),
        nextReviewDate: risk.reviewPeriod.getNextReviewDate(),
        isReviewDue: risk.isReviewDue()
      } : undefined,
      tags: risk.tags,
      isActive: risk.isActive,
      createdBy: risk.createdBy,
      updatedBy: risk.updatedBy,
      createdAt: risk.createdAt,
      updatedAt: risk.updatedAt
    });
  }
}
