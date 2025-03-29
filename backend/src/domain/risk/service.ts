import mongoose from 'mongoose';
import { Result } from '../common/result';
import { IRiskRepository, IRiskTreatmentRepository } from './repositories';
import { Risk } from './risk';
import { RiskTreatment } from './risk_treatment';
import {
  ReviewPeriod,
  RiskCategory,
  RiskImpact,
  RiskLikelihood,
  RiskName,
  RiskOwner,
  RiskSeverity,
  RiskStatus,
  TreatmentStatus,
  TreatmentType
} from './risk_values';

/**
 * Risk management service
 * Handles domain operations related to risk management
 */
export class RiskManagementService {
  constructor(
    private riskRepository: IRiskRepository,
    private riskTreatmentRepository: IRiskTreatmentRepository
  ) {}

  /**
   * Create a new risk
   */
  public async createRisk(
    name: RiskName,
    description: string,
    category: RiskCategory,
    inherentImpact: RiskImpact,
    inherentLikelihood: RiskLikelihood,
    userId: string,
    options?: {
      residualImpact?: RiskImpact
      residualLikelihood?: RiskLikelihood
      owner?: RiskOwner
      relatedControlIds?: string[]
      relatedAssets?: string[]
      reviewPeriodMonths?: number
      tags?: string[]
    }
  ): Promise<Result<Risk, Error>> {
    // Create review period if months are provided
    let reviewPeriod: ReviewPeriod | undefined

    if (options?.reviewPeriodMonths) {
      const reviewPeriodResult = ReviewPeriod.create(options.reviewPeriodMonths)

      if (!reviewPeriodResult.isSuccess) {
        return Result.fail<Risk>(reviewPeriodResult.getError())
      }

      reviewPeriod = reviewPeriodResult.getValue()
    }

    // Create risk entity
    const riskId = new mongoose.Types.ObjectId().toString()
    const riskResult = Risk.create(riskId, {
      name,
      description,
      category,
      inherentImpact,
      inherentLikelihood,
      residualImpact: options?.residualImpact,
      residualLikelihood: options?.residualLikelihood,
      owner: options?.owner,
      relatedControlIds: options?.relatedControlIds,
      relatedAssets: options?.relatedAssets,
      reviewPeriod,
      tags: options?.tags,
      createdBy: userId,
    })

    if (!riskResult.isSuccess) {
      return Result.fail<Risk>(riskResult.getError())
    }

    const risk = riskResult.getValue()

    // Save risk to repository
    const saveResult = await this.riskRepository.save(risk)

    if (!saveResult.isSuccess) {
      return Result.fail<Risk>(saveResult.getError())
    }

    return Result.ok<Risk>(risk)
  }

  /**
   * Update a risk's assessment
   */
  public async updateRiskAssessment(
    riskId: string,
    inherentImpact: RiskImpact,
    inherentLikelihood: RiskLikelihood,
    residualImpact: RiskImpact | undefined,
    residualLikelihood: RiskLikelihood | undefined,
    userId: string
  ): Promise<Result<Risk, Error>> {
    // Find risk
    const riskResult = await this.riskRepository.findById(riskId)

    if (!riskResult.isSuccess) {
      return Result.fail<Risk>(riskResult.getError())
    }

    const risk = riskResult.getValue()

    if (!risk) {
      return Result.fail<Risk>(new Error(`Risk with ID ${riskId} not found`))
    }

    // Update inherent risk
    const inherentResult = risk.updateInherentRisk(inherentImpact, inherentLikelihood, userId)

    if (!inherentResult.isSuccess) {
      return Result.fail<Risk>(inherentResult.getError())
    }

    // Update residual risk if provided
    if (residualImpact && residualLikelihood) {
      const residualResult = risk.updateResidualRisk(residualImpact, residualLikelihood, userId)

      if (!residualResult.isSuccess) {
        return Result.fail<Risk>(residualResult.getError())
      }
    }

    // Save updated risk
    const saveResult = await this.riskRepository.save(risk)

    if (!saveResult.isSuccess) {
      return Result.fail<Risk>(saveResult.getError())
    }

    return Result.ok<Risk>(risk)
  }

  /**
   * Assign an owner to a risk
   */
  public async assignRiskOwner(
    riskId: string,
    ownerId: string,
    ownerName: string,
    ownerDepartment: string,
    userId: string
  ): Promise<Result<Risk, Error>> {
    // Find risk
    const riskResult = await this.riskRepository.findById(riskId)

    if (!riskResult.isSuccess) {
      return Result.fail<Risk>(riskResult.getError())
    }

    const risk = riskResult.getValue()

    if (!risk) {
      return Result.fail<Risk>(new Error(`Risk with ID ${riskId} not found`))
    }

    // Create owner
    const ownerResult = RiskOwner.create(ownerId, ownerName, ownerDepartment)

    if (!ownerResult.isSuccess) {
      return Result.fail<Risk>(ownerResult.getError())
    }

    // Assign owner to risk
    const assignResult = risk.assignOwner(ownerResult.getValue(), userId)

    if (!assignResult.isSuccess) {
      return Result.fail<Risk>(assignResult.getError())
    }

    // Save updated risk
    const saveResult = await this.riskRepository.save(risk)

    if (!saveResult.isSuccess) {
      return Result.fail<Risk>(saveResult.getError())
    }

    return Result.ok<Risk>(risk)
  }

  /**
   * Set or update the review period for a risk
   */
  public async setRiskReviewPeriod(
    riskId: string,
    months: number,
    userId: string
  ): Promise<Result<Risk, Error>> {
    // Find risk
    const riskResult = await this.riskRepository.findById(riskId)

    if (!riskResult.isSuccess) {
      return Result.fail<Risk>(riskResult.getError())
    }

    const risk = riskResult.getValue()

    if (!risk) {
      return Result.fail<Risk>(new Error(`Risk with ID ${riskId} not found`))
    }

    // Create review period
    const reviewPeriodResult = ReviewPeriod.create(months)

    if (!reviewPeriodResult.isSuccess) {
      return Result.fail<Risk>(reviewPeriodResult.getError())
    }

    // Set review period for risk
    const setResult = risk.setReviewPeriod(reviewPeriodResult.getValue(), userId)

    if (!setResult.isSuccess) {
      return Result.fail<Risk>(setResult.getError())
    }

    // Save updated risk
    const saveResult = await this.riskRepository.save(risk)

    if (!saveResult.isSuccess) {
      return Result.fail<Risk>(saveResult.getError())
    }

    return Result.ok<Risk>(risk)
  }

  /**
   * Mark a risk as reviewed
   */
  public async markRiskReviewed(riskId: string, userId: string): Promise<Result<Risk, Error>> {
    // Find risk
    const riskResult = await this.riskRepository.findById(riskId)

    if (!riskResult.isSuccess) {
      return Result.fail<Risk>(riskResult.getError())
    }

    const risk = riskResult.getValue()

    if (!risk) {
      return Result.fail<Risk>(new Error(`Risk with ID ${riskId} not found`))
    }

    // Mark risk as reviewed
    const reviewResult = risk.markReviewed(new Date(), userId)

    if (!reviewResult.isSuccess) {
      return Result.fail<Risk>(reviewResult.getError())
    }

    // Save updated risk
    const saveResult = await this.riskRepository.save(risk)

    if (!saveResult.isSuccess) {
      return Result.fail<Risk>(saveResult.getError())
    }

    return Result.ok<Risk>(risk)
  }

  /**
   * Create a new risk treatment
   */
  public async createRiskTreatment(
    riskId: string,
    name: string,
    description: string,
    type: TreatmentType,
    userId: string,
    options?: {
      status?: TreatmentStatus
      dueDate?: Date
      assignee?: string
      cost?: number
      relatedControlIds?: string[]
    }
  ): Promise<Result<RiskTreatment, Error>> {
    // Verify risk exists
    const riskResult = await this.riskRepository.findById(riskId)

    if (!riskResult.isSuccess) {
      return Result.fail<RiskTreatment>(riskResult.getError())
    }

    const risk = riskResult.getValue()

    if (!risk) {
      return Result.fail<RiskTreatment>(new Error(`Risk with ID ${riskId} not found`))
    }

    // Create treatment entity
    const treatmentId = new mongoose.Types.ObjectId().toString()
    const treatmentResult = RiskTreatment.create(treatmentId, {
      riskId,
      name,
      description,
      type,
      status: options?.status,
      dueDate: options?.dueDate,
      assignee: options?.assignee,
      cost: options?.cost,
      relatedControlIds: options?.relatedControlIds,
      createdBy: userId,
    })

    if (!treatmentResult.isSuccess) {
      return Result.fail<RiskTreatment>(treatmentResult.getError())
    }

    const treatment = treatmentResult.getValue()

    // Save treatment to repository
    const saveResult = await this.riskTreatmentRepository.save(treatment)

    if (!saveResult.isSuccess) {
      return Result.fail<RiskTreatment>(saveResult.getError())
    }

    // Update risk status if needed
    if (risk.status === RiskStatus.ASSESSED || risk.status === RiskStatus.IDENTIFIED) {
      risk.updateStatus(RiskStatus.MITIGATING, userId)
      await this.riskRepository.save(risk)
    }

    return Result.ok<RiskTreatment>(treatment)
  }

  /**
   * Update treatment status
   */
  public async updateTreatmentStatus(
    treatmentId: string,
    status: TreatmentStatus,
    userId: string
  ): Promise<Result<RiskTreatment, Error>> {
    // Find treatment
    const treatmentResult = await this.riskTreatmentRepository.findById(treatmentId)

    if (!treatmentResult.isSuccess) {
      return Result.fail<RiskTreatment>(treatmentResult.getError())
    }

    const treatment = treatmentResult.getValue()

    if (!treatment) {
      return Result.fail<RiskTreatment>(new Error(`Treatment with ID ${treatmentId} not found`))
    }

    // Update treatment status
    const updateResult = treatment.updateStatus(status, userId)

    if (!updateResult.isSuccess) {
      return Result.fail<RiskTreatment>(updateResult.getError())
    }

    // Save updated treatment
    const saveResult = await this.riskTreatmentRepository.save(treatment)

    if (!saveResult.isSuccess) {
      return Result.fail<RiskTreatment>(saveResult.getError())
    }

    // Update risk status if needed
    const riskResult = await this.riskRepository.findById(treatment.riskId)

    if (riskResult.isSuccess && riskResult.getValue()) {
      const risk = riskResult.getValue()
      let updateRiskStatus = false
      let newStatus: RiskStatus | undefined

      // If treatment is verified and it's a mitigation treatment
      if (status === TreatmentStatus.VERIFIED && treatment.type === TreatmentType.MITIGATE) {
        // Check if all other treatments for this risk are also verified or cancelled
        const treatmentsResult = await this.riskTreatmentRepository.findByRiskId(treatment.riskId, {
          active: true,
        })

        if (treatmentsResult.isSuccess) {
          const allTreatments = treatmentsResult.getValue()
          const allCompleted = allTreatments.every(
            (t) => t.status === TreatmentStatus.VERIFIED || t.status === TreatmentStatus.CANCELLED
          )

          if (allCompleted && risk?.residualRiskScore) {
            updateRiskStatus = true
            newStatus = RiskStatus.MITIGATING
          }
        }
      }

      // If treatment status is completed and it's an acceptance treatment
      if (
        (status === TreatmentStatus.IMPLEMENTED || status === TreatmentStatus.VERIFIED) &&
        treatment.type === TreatmentType.ACCEPT
      ) {
        updateRiskStatus = true
        newStatus = RiskStatus.ACCEPTED
      }

      // If treatment status is completed and it's a transfer treatment
      if (
        (status === TreatmentStatus.IMPLEMENTED || status === TreatmentStatus.VERIFIED) &&
        treatment.type === TreatmentType.TRANSFER
      ) {
        updateRiskStatus = true
        newStatus = RiskStatus.TRANSFERRED
      }

      // If treatment status is completed and it's an avoidance treatment
      if (
        (status === TreatmentStatus.IMPLEMENTED || status === TreatmentStatus.VERIFIED) &&
        treatment.type === TreatmentType.AVOID
      ) {
        updateRiskStatus = true
        newStatus = RiskStatus.AVOIDED
      }

      if (updateRiskStatus && newStatus) {
        if (risk) {
          risk.updateStatus(newStatus, userId)
          await this.riskRepository.save(risk)
        }
      }
    }

    return Result.ok<RiskTreatment>(treatment)
  }

  /**
   * Get risks due for review
   */
  public async getRisksForReview(): Promise<Result<Risk[], Error>> {
    // Find risks with review due
    const risksResult = await this.riskRepository.findAll({
      reviewDue: true,
      active: true,
    })

    if (!risksResult.isSuccess) {
      return Result.fail<Risk[]>(risksResult.getError())
    }

    return Result.ok<Risk[]>(risksResult.getValue())
  }

  /**
   * Get overdue risk treatments
   */
  public async getOverdueTreatments(): Promise<Result<RiskTreatment[], Error>> {
    // Find treatments that are overdue
    const treatmentsResult = await this.riskTreatmentRepository.findAll({
      overdue: true,
      active: true,
    })

    if (!treatmentsResult.isSuccess) {
      return Result.fail<RiskTreatment[]>(treatmentsResult.getError())
    }

    return Result.ok<RiskTreatment[]>(treatmentsResult.getValue())
  }

  /**
   * Get risk dashboard statistics
   */
  public async getRiskStatistics(): Promise<
    Result<
      {
        totalRisks: number
        bySeverity: Record<RiskSeverity, number>
        byStatus: Record<RiskStatus, number>
        byCategory: Record<RiskCategory, number>
        treatmentProgress: {
          total: number
          implemented: number
          inProgress: number
          planned: number
          implementationRate: number
        }
      },
      Error
    >
  > {
    try {
      // Get total risks
      const totalResult = await this.riskRepository.count({ active: true })
      if (!totalResult.isSuccess) {
        return Result.fail(totalResult.getError())
      }
      const totalRisks = totalResult.getValue()

      // Initialize empty statistics objects
      const bySeverity: Partial<Record<RiskSeverity, number>> = {}
      const byStatus: Partial<Record<RiskStatus, number>> = {}
      const byCategory: Partial<Record<RiskCategory, number>> = {}

      // Get risks by severity
      for (const severity of Object.values(RiskSeverity)) {
        const countResult = await this.riskRepository.count({
          severities: [severity],
          active: true,
        })

        if (countResult.isSuccess) {
          bySeverity[severity] = countResult.getValue()
        }
      }

      // Get risks by status
      for (const status of Object.values(RiskStatus)) {
        const countResult = await this.riskRepository.count({
          statuses: [status],
          active: true,
        })

        if (countResult.isSuccess) {
          byStatus[status] = countResult.getValue()
        }
      }

      // Get risks by category
      for (const category of Object.values(RiskCategory)) {
        const countResult = await this.riskRepository.count({
          categories: [category],
          active: true,
        })

        if (countResult.isSuccess) {
          byCategory[category] = countResult.getValue()
        }
      }

      // Get treatment statistics
      const totalTreatmentsResult = await this.riskTreatmentRepository.count({ active: true })
      const implementedResult = await this.riskTreatmentRepository.count({
        statuses: [TreatmentStatus.IMPLEMENTED, TreatmentStatus.VERIFIED],
        active: true,
      })
      const inProgressResult = await this.riskTreatmentRepository.count({
        statuses: [TreatmentStatus.IN_PROGRESS],
        active: true,
      })
      const plannedResult = await this.riskTreatmentRepository.count({
        statuses: [TreatmentStatus.PLANNED],
        active: true,
      })

      if (
        !totalTreatmentsResult.isSuccess ||
        !implementedResult.isSuccess ||
        !inProgressResult.isSuccess ||
        !plannedResult.isSuccess
      ) {
        return Result.fail(new Error('Failed to get treatment statistics'))
      }

      const totalTreatments = totalTreatmentsResult.getValue()
      const implementedTreatments = implementedResult.getValue()
      const inProgressTreatments = inProgressResult.getValue()
      const plannedTreatments = plannedResult.getValue()

      // Calculate implementation rate
      const implementationRate =
        totalTreatments > 0 ? (implementedTreatments / totalTreatments) * 100 : 0

      return Result.ok({
        totalRisks,
        bySeverity: bySeverity as Record<RiskSeverity, number>,
        byStatus: byStatus as Record<RiskStatus, number>,
        byCategory: byCategory as Record<RiskCategory, number>,
        treatmentProgress: {
          total: totalTreatments,
          implemented: implementedTreatments,
          inProgress: inProgressTreatments,
          planned: plannedTreatments,
          implementationRate,
        },
      })
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Error getting risk statistics')
      )
    }
  }
}
