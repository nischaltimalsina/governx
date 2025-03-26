import { IRiskTreatmentRepository } from '../../domain/risk/repositories'
import { RiskTreatment } from '../../domain/risk/risk_treatment'
import { TreatmentStatus, TreatmentType } from '../../domain/risk/risk_values'
import { Result } from '../../domain/common/result'
import { IRiskTreatmentDocument, RiskTreatmentModel } from './models/risk_treatment_schema'

/**
 * MongoDB implementation of the Risk Treatment repository
 */
export class MongoRiskTreatmentRepository implements IRiskTreatmentRepository {
  /**
   * Find a risk treatment by ID
   */
  public async findById(id: string): Promise<Result<RiskTreatment | null, Error>> {
    try {
      const treatmentDoc = await RiskTreatmentModel.findById(id)

      if (!treatmentDoc) {
        return Result.ok<null>(null)
      }

      return this.mapDocumentToDomain(treatmentDoc)
    } catch (error) {
      return Result.fail<RiskTreatment | null>(
        error instanceof Error ? error : new Error(`Failed to find risk treatment with id ${id}`)
      )
    }
  }

  /**
   * Find all risk treatments for a specific risk
   */
  public async findByRiskId(
    riskId: string,
    options?: {
      active?: boolean
    }
  ): Promise<Result<RiskTreatment[], Error>> {
    try {
      // Build query
      const query: any = {
        riskId,
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      const treatmentDocs = await RiskTreatmentModel.find(query).sort({ createdAt: -1 })

      // Map documents to domain entities
      const treatments: RiskTreatment[] = []

      for (const doc of treatmentDocs) {
        const treatmentResult = await this.mapDocumentToDomain(doc)

        if (treatmentResult.isSuccess) {
          treatments.push(treatmentResult.getValue())
        }
      }

      return Result.ok<RiskTreatment[]>(treatments)
    } catch (error) {
      return Result.fail<RiskTreatment[]>(
        error instanceof Error ? error : new Error(`Failed to find treatments for risk ${riskId}`)
      )
    }
  }

  /**
   * Find all risk treatments with optional filters
   */
  public async findAll(options?: {
    statuses?: string[]
    assignee?: string
    controlId?: string
    overdue?: boolean
    active?: boolean
    pageSize?: number
    pageNumber?: number
  }): Promise<Result<RiskTreatment[], Error>> {
    try {
      // Build query
      const query: any = {}

      if (options?.statuses && options.statuses.length > 0) {
        query.status = { $in: options.statuses }
      }

      if (options?.assignee) {
        query.assignee = options.assignee
      }

      if (options?.controlId) {
        query.relatedControlIds = options.controlId
      }

      if (options?.overdue) {
        const now = new Date()
        query.dueDate = { $lt: now }
        query.status = {
          $nin: [TreatmentStatus.IMPLEMENTED, TreatmentStatus.VERIFIED, TreatmentStatus.CANCELLED],
        }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      // Create query with pagination
      let treatmentDocs: IRiskTreatmentDocument[]

      if (options?.pageSize && options?.pageNumber) {
        const skip = (options.pageNumber - 1) * options.pageSize
        treatmentDocs = await RiskTreatmentModel.find(query)
          .sort({ dueDate: 1, createdAt: -1 })
          .skip(skip)
          .limit(options.pageSize)
      } else {
        treatmentDocs = await RiskTreatmentModel.find(query).sort({ dueDate: 1, createdAt: -1 })
      }

      // Map documents to domain entities
      const treatments: RiskTreatment[] = []

      for (const doc of treatmentDocs) {
        const treatmentResult = await this.mapDocumentToDomain(doc)

        if (treatmentResult.isSuccess) {
          treatments.push(treatmentResult.getValue())
        }
      }

      return Result.ok<RiskTreatment[]>(treatments)
    } catch (error) {
      return Result.fail<RiskTreatment[]>(
        error instanceof Error ? error : new Error('Failed to find risk treatments')
      )
    }
  }

  /**
   * Find treatments by assignee
   */
  public async findByAssignee(
    assigneeId: string,
    options?: {
      overdue?: boolean
      active?: boolean
    }
  ): Promise<Result<RiskTreatment[], Error>> {
    try {
      // Build query
      const query: any = {
        assignee: assigneeId,
      }

      if (options?.overdue) {
        const now = new Date()
        query.dueDate = { $lt: now }
        query.status = {
          $nin: [TreatmentStatus.IMPLEMENTED, TreatmentStatus.VERIFIED, TreatmentStatus.CANCELLED],
        }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      const treatmentDocs = await RiskTreatmentModel.find(query).sort({ dueDate: 1, createdAt: -1 })

      // Map documents to domain entities
      const treatments: RiskTreatment[] = []

      for (const doc of treatmentDocs) {
        const treatmentResult = await this.mapDocumentToDomain(doc)

        if (treatmentResult.isSuccess) {
          treatments.push(treatmentResult.getValue())
        }
      }

      return Result.ok<RiskTreatment[]>(treatments)
    } catch (error) {
      return Result.fail<RiskTreatment[]>(
        error instanceof Error
          ? error
          : new Error(`Failed to find treatments for assignee ${assigneeId}`)
      )
    }
  }

  /**
   * Save a risk treatment to the repository
   */
  /**
   * Save a risk treatment to the repository
   */
  public async save(treatment: RiskTreatment): Promise<Result<void, Error>> {
    try {
      const treatmentData = {
        riskId: treatment.riskId,
        name: treatment.name,
        description: treatment.description,
        type: treatment.type,
        status: treatment.status,
        dueDate: treatment.dueDate,
        completedDate: treatment.completedDate,
        assignee: treatment.assignee,
        cost: treatment.cost,
        relatedControlIds: treatment.relatedControlIds,
        isActive: treatment.isActive,
        createdBy: treatment.createdBy,
        updatedBy: treatment.updatedBy,
        // MongoDB will handle createdAt/updatedAt
      }

      await RiskTreatmentModel.findByIdAndUpdate(treatment.id, treatmentData, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      })

      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error ? error : new Error(`Failed to save risk treatment ${treatment.id}`)
      )
    }
  }

  /**
   * Delete a risk treatment from the repository
   */
  public async delete(id: string): Promise<Result<void, Error>> {
    try {
      await RiskTreatmentModel.findByIdAndDelete(id)
      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error ? error : new Error(`Failed to delete risk treatment ${id}`)
      )
    }
  }

  /**
   * Soft delete a risk treatment by marking it as inactive
   */
  public async softDelete(id: string, updatedBy: string): Promise<Result<void, Error>> {
    try {
      await RiskTreatmentModel.findByIdAndUpdate(id, {
        isActive: false,
        updatedBy,
      })
      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error ? error : new Error(`Failed to soft delete risk treatment ${id}`)
      )
    }
  }

  /**
   * Update the status of a risk treatment
   */
  public async updateStatus(
    id: string,
    status: string,
    updatedBy: string,
    completedDate?: Date
  ): Promise<Result<void, Error>> {
    try {
      const updateData: any = {
        status,
        updatedBy,
      }

      // If status is IMPLEMENTED or VERIFIED, set completedDate if not provided
      if (
        (status === TreatmentStatus.IMPLEMENTED || status === TreatmentStatus.VERIFIED) &&
        !completedDate
      ) {
        updateData.completedDate = new Date()
      } else if (completedDate) {
        updateData.completedDate = completedDate
      }

      await RiskTreatmentModel.findByIdAndUpdate(id, updateData)
      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error
          ? error
          : new Error(`Failed to update status of risk treatment ${id}`)
      )
    }
  }

  /**
   * Count risk treatments with optional filters
   */
  public async count(options?: {
    riskId?: string
    statuses?: string[]
    assignee?: string
    overdue?: boolean
    active?: boolean
  }): Promise<Result<number, Error>> {
    try {
      // Build query
      const query: any = {}

      if (options?.riskId) {
        query.riskId = options.riskId
      }

      if (options?.statuses && options.statuses.length > 0) {
        query.status = { $in: options.statuses }
      }

      if (options?.assignee) {
        query.assignee = options.assignee
      }

      if (options?.overdue) {
        const now = new Date()
        query.dueDate = { $lt: now }
        query.status = {
          $nin: [TreatmentStatus.IMPLEMENTED, TreatmentStatus.VERIFIED, TreatmentStatus.CANCELLED],
        }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      const count = await RiskTreatmentModel.countDocuments(query)
      return Result.ok<number>(count)
    } catch (error) {
      return Result.fail<number>(
        error instanceof Error ? error : new Error('Failed to count risk treatments')
      )
    }
  }

  /**
   * Map a MongoDB document to a domain entity
   */
  private async mapDocumentToDomain(
    doc: IRiskTreatmentDocument
  ): Promise<Result<RiskTreatment, Error>> {
    try {
      // Create RiskTreatment entity
      return RiskTreatment.create(doc._id.toString(), {
        riskId: doc.riskId,
        name: doc.name,
        description: doc.description,
        type: doc.type as TreatmentType,
        status: doc.status as TreatmentStatus,
        dueDate: doc.dueDate,
        completedDate: doc.completedDate,
        assignee: doc.assignee,
        cost: doc.cost,
        relatedControlIds: doc.relatedControlIds,
        isActive: doc.isActive,
        createdBy: doc.createdBy,
        createdAt: doc.createdAt,
      })
    } catch (error) {
      return Result.fail<RiskTreatment>(
        error instanceof Error
          ? error
          : new Error(`Failed to map risk treatment document to domain: ${error}`)
      )
    }
  }
}
