import { Result } from '../../domain/common/result';
import { IRiskRepository } from '../../domain/risk/repositories';
import { IRiskTreatmentRepository } from '../../domain/risk/repositories';
import { IControlRepository } from '../../domain/compliance/framework_repository';
import { IFrameworkRepository } from '../../domain/compliance/framework_repository';
import { RiskDTO, RiskTreatmentSummaryDTO } from '../dtos/risk_dtos';

/**
 * Use case for retrieving a risk by ID
 */
export class GetRiskUseCase {
  constructor(
    private riskRepository: IRiskRepository,
    private riskTreatmentRepository: IRiskTreatmentRepository,
    private controlRepository: IControlRepository,
    private frameworkRepository: IFrameworkRepository
  ) {}

  /**
   * Execute the use case
   * @param riskId The ID of the risk to retrieve
   * @param options Options for including related data
   */
  public async execute(
    riskId: string,
    options: {
      includeControls?: boolean;
      includeTreatments?: boolean;
    } = {}
  ): Promise<Result<RiskDTO, Error>> {
    // Get risk from repository
    const riskResult = await this.riskRepository.findById(riskId);

    if (!riskResult.isSuccess) {
      return Result.fail<RiskDTO>(riskResult.getError());
    }

    const risk = riskResult.getValue();

    if (!risk) {
      return Result.fail<RiskDTO>(new Error(`Risk with ID ${riskId} not found`));
    }

    // Create base DTO
    const riskDTO: RiskDTO = {
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
    };

    // Include control details if requested and if risk has related controls
    if (options.includeControls && risk.relatedControlIds && risk.relatedControlIds.length > 0) {
      riskDTO.controls = await this.getControlsInfo(risk.relatedControlIds);
    }

    // Include treatment summaries if requested
    if (options.includeTreatments) {
      riskDTO.treatments = await this.getTreatmentsSummary(risk.id);
    }

    return Result.ok<RiskDTO>(riskDTO);
  }

  /**
   * Helper method to get detailed control information
   */
  private async getControlsInfo(controlIds: string[]) {
    const controls = [];

    for (const controlId of controlIds) {
      const controlResult = await this.controlRepository.findById(controlId);

      if (controlResult.isSuccess && controlResult.getValue()) {
        const control = controlResult.getValue();

        if (control){
          // Get framework name
          let frameworkName = '';
          const frameworkResult = await this.frameworkRepository.findById(control.frameworkId);
          const frameworkResultValue = frameworkResult.getValue()
          if (frameworkResult.isSuccess && frameworkResultValue) {
            frameworkName = frameworkResultValue.name.getValue();
          }

          controls.push({
            id: control.id,
            code: control.code.getValue(),
            title: control.title.getValue(),
            implementationStatus: control.implementationStatus,
            frameworkId: control.frameworkId,
            frameworkName
          });
        }
      }
    }

    return controls.length > 0 ? controls : undefined;
  }

  /**
   * Helper method to get treatment summaries for a risk
   */
  private async getTreatmentsSummary(riskId: string): Promise<RiskTreatmentSummaryDTO[] | undefined> {
    const treatmentsResult = await this.riskTreatmentRepository.findByRiskId(riskId, { active: true });

    if (!treatmentsResult.isSuccess || treatmentsResult.getValue().length === 0) {
      return undefined;
    }

    const treatments = treatmentsResult.getValue();

    return treatments.map(treatment => ({
      id: treatment.id,
      name: treatment.name,
      type: treatment.type,
      status: treatment.status,
      progressPercentage: treatment.getProgressPercentage(),
      dueDate: treatment.dueDate,
      isOverdue: treatment.isOverdue()
    }));
  }
}
