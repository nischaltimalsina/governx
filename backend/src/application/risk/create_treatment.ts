import { Result } from '../../domain/common/result';
import { RiskManagementService } from '../../domain/risk/service';
import { CreateRiskTreatmentDTO, RiskTreatmentDTO } from '../dtos/risk_dtos';

/**
 * Use case for creating a new risk treatment
 */
export class CreateRiskTreatmentUseCase {
  constructor(private riskManagementService: RiskManagementService) {}

  /**
   * Execute the use case
   * @param request The risk treatment creation data
   * @param userId The ID of the user creating the treatment
   */
  public async execute(
    request: CreateRiskTreatmentDTO,
    userId: string
  ): Promise<Result<RiskTreatmentDTO, Error>> {
    // Call domain service
    const treatmentResult = await this.riskManagementService.createRiskTreatment(
      request.riskId,
      request.name,
      request.description,
      request.type,
      userId,
      {
        status: request.status,
        dueDate: request.dueDate,
        assignee: request.assignee,
        cost: request.cost,
        relatedControlIds: request.relatedControlIds
      }
    );

    if (!treatmentResult.isSuccess) {
      return Result.fail<RiskTreatmentDTO>(treatmentResult.getError());
    }

    const treatment = treatmentResult.getValue();

    // Map domain entity to DTO
    return Result.ok<RiskTreatmentDTO>({
      id: treatment.id,
      riskId: treatment.riskId,
      name: treatment.name,
      description: treatment.description,
      type: treatment.type,
      status: treatment.status,
      progressPercentage: treatment.getProgressPercentage(),
      dueDate: treatment.dueDate,
      completedDate: treatment.completedDate,
      isOverdue: treatment.isOverdue(),
      assignee: treatment.assignee,
      assigneeName: undefined, // Would need a user lookup service to get the name
      cost: treatment.cost,
      relatedControlIds: treatment.relatedControlIds,
      isActive: treatment.isActive,
      createdBy: treatment.createdBy,
      updatedBy: treatment.updatedBy,
      createdAt: treatment.createdAt,
      updatedAt: treatment.updatedAt
    });
  }
}
