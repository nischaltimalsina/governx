import { IFindingRepository } from '../../domain/audit/repositories'
import { Finding } from '../../domain/audit/finding'
import {
  FindingTitle,
  FindingType,
  FindingSeverity,
  FindingStatus,
  RemediationPlan,
} from '../../domain/audit/audit_values'
import { Result } from '../../domain/common/result'
import { FindingModel, IFindingDocument } from './models/finding_schema'

/**
 * MongoDB implementation of the Finding repository
 */
export class MongoFindingRepository implements IFindingRepository {
  /**
   * Find a finding by ID
   */
  public async findById(id: string): Promise<Result<Finding | null, Error>> {
    try {
      const findingDoc = await FindingModel.findById(id)

      if (!findingDoc) {
        return Result.ok<null>(null)
      }

      return this.mapDocumentToDomain(findingDoc)
    } catch (error) {
      return Result.fail<Finding | null>(
        error instanceof Error ? error : new Error(`Failed to find finding with id ${id}`)
      )
    }
  }

  /**
   * Find all findings with optional filters
   */
  public async findAll(options?: {
    auditId?: string
    types?: FindingType[]
    severities?: FindingSeverity[]
    statuses?: FindingStatus[]
    controlId?: string
    assigneeId?: string
    overdue?: boolean
    active?: boolean
    pageSize?: number
    pageNumber?: number
  }): Promise<Result<Finding[], Error>> {
    try {
      // Build query
      const query: any = {}

      if (options?.auditId) {
        query.auditId = options.auditId
      }

      if (options?.types && options.types.length > 0) {
        query.type = { $in: options.types }
      }

      if (options?.severities && options.severities.length > 0) {
        query.severity = { $in: options.severities }
      }

      if (options?.statuses && options.statuses.length > 0) {
        query.status = { $in: options.statuses }
      }

      if (options?.controlId) {
        query.controlIds = options.controlId
      }

      if (options?.assigneeId) {
        query['remediationPlan.assignee'] = options.assigneeId
      }

      // Handle overdue findings
      if (options?.overdue) {
        const now = new Date()

        // Findings are overdue if their due date is in the past and they're not closed/verified/accepted
        const overdueStatuses = [
          FindingStatus.OPEN,
          FindingStatus.IN_REMEDIATION,
          FindingStatus.REMEDIATED,
          FindingStatus.DEFERRED,
        ]

        query.$or = [
          {
            dueDate: { $lt: now },
            status: { $in: overdueStatuses },
          },
          {
            'remediationPlan.dueDate': { $lt: now },
            status: { $in: overdueStatuses },
          },
        ]
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      // Create query with pagination
      let findingDocs: IFindingDocument[]

      if (options?.pageSize && options?.pageNumber) {
        const skip = (options.pageNumber - 1) * options.pageSize
        findingDocs = await FindingModel.find(query)
          .sort({ severity: -1, createdAt: -1 }) // Sort by severity (critical first) then date
          .skip(skip)
          .limit(options.pageSize)
      } else {
        findingDocs = await FindingModel.find(query).sort({ severity: -1, createdAt: -1 })
      }

      // Map documents to domain entities
      const findings: Finding[] = []

      for (const doc of findingDocs) {
        const findingResult = await this.mapDocumentToDomain(doc)

        if (findingResult.isSuccess) {
          findings.push(findingResult.getValue())
        }
      }

      return Result.ok<Finding[]>(findings)
    } catch (error) {
      return Result.fail<Finding[]>(
        error instanceof Error ? error : new Error('Failed to find findings')
      )
    }
  }

  /**
   * Find findings by audit ID
   */
  public async findByAuditId(
    auditId: string,
    options?: {
      statuses?: FindingStatus[]
      severities?: FindingSeverity[]
      active?: boolean
    }
  ): Promise<Result<Finding[], Error>> {
    try {
      // Build query
      const query: any = {
        auditId,
      }

      if (options?.statuses && options.statuses.length > 0) {
        query.status = { $in: options.statuses }
      }

      if (options?.severities && options.severities.length > 0) {
        query.severity = { $in: options.severities }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      const findingDocs = await FindingModel.find(query).sort({ severity: -1, createdAt: -1 })

      // Map documents to domain entities
      const findings: Finding[] = []

      for (const doc of findingDocs) {
        const findingResult = await this.mapDocumentToDomain(doc)

        if (findingResult.isSuccess) {
          findings.push(findingResult.getValue())
        }
      }

      return Result.ok<Finding[]>(findings)
    } catch (error) {
      return Result.fail<Finding[]>(
        error instanceof Error ? error : new Error(`Failed to find findings for audit ${auditId}`)
      )
    }
  }

  /**
   * Find findings by control ID
   */
  public async findByControlId(
    controlId: string,
    options?: {
      statuses?: FindingStatus[]
      active?: boolean
    }
  ): Promise<Result<Finding[], Error>> {
    try {
      // Build query
      const query: any = {
        controlIds: controlId,
      }

      if (options?.statuses && options.statuses.length > 0) {
        query.status = { $in: options.statuses }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      const findingDocs = await FindingModel.find(query).sort({ severity: -1, createdAt: -1 })

      // Map documents to domain entities
      const findings: Finding[] = []

      for (const doc of findingDocs) {
        const findingResult = await this.mapDocumentToDomain(doc)

        if (findingResult.isSuccess) {
          findings.push(findingResult.getValue())
        }
      }

      return Result.ok<Finding[]>(findings)
    } catch (error) {
      return Result.fail<Finding[]>(
        error instanceof Error
          ? error
          : new Error(`Failed to find findings for control ${controlId}`)
      )
    }
  }

  /**
   * Find findings by assignee ID (from remediation plan)
   */
  public async findByAssigneeId(
    assigneeId: string,
    options?: {
      statuses?: FindingStatus[]
      overdue?: boolean
      active?: boolean
    }
  ): Promise<Result<Finding[], Error>> {
    try {
      // Build query
      const query: any = {
        'remediationPlan.assignee': assigneeId,
      }

      if (options?.statuses && options.statuses.length > 0) {
        query.status = { $in: options.statuses }
      }

      if (options?.overdue) {
        const now = new Date()
        query['remediationPlan.dueDate'] = { $lt: now }

        // Exclude closed/verified/accepted findings
        const excludedStatuses = [
          FindingStatus.CLOSED,
          FindingStatus.VERIFIED,
          FindingStatus.ACCEPTED,
        ]

        if (query.status) {
          // If statuses are already specified, make sure they don't include excluded ones
          query.status.$nin = excludedStatuses
        } else {
          query.status = { $nin: excludedStatuses }
        }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      const findingDocs = await FindingModel.find(query).sort({
        'remediationPlan.dueDate': 1,
        severity: -1,
        createdAt: -1,
      })

      // Map documents to domain entities
      const findings: Finding[] = []

      for (const doc of findingDocs) {
        const findingResult = await this.mapDocumentToDomain(doc)

        if (findingResult.isSuccess) {
          findings.push(findingResult.getValue())
        }
      }

      return Result.ok<Finding[]>(findings)
    } catch (error) {
      return Result.fail<Finding[]>(
        error instanceof Error
          ? error
          : new Error(`Failed to find findings for assignee ${assigneeId}`)
      )
    }
  }

  /**
   * Save a finding to the repository
   */
  public async save(finding: Finding): Promise<Result<void, Error>> {
    try {
      // Prepare remediation plan data if exists
      let remediationPlanData = undefined

      if (finding.remediationPlan) {
        remediationPlanData = {
          description: finding.remediationPlan.getDescription(),
          dueDate: finding.remediationPlan.getDueDate(),
          assignee: finding.remediationPlan.getAssignee(),
          status: finding.remediationPlan.getStatus(),
          lastUpdated: finding.remediationPlan.getLastUpdated(),
          updatedBy: finding.remediationPlan.getUpdatedBy(),
        }
      }

      const findingData: any = {
        auditId: finding.auditId,
        title: finding.title.getValue(),
        description: finding.description,
        type: finding.type,
        severity: finding.severity,
        status: finding.status,
        controlIds: finding.controlIds,
        evidenceIds: finding.evidenceIds,
        remediationPlan: remediationPlanData,
        dueDate: finding.dueDate,
        isActive: finding.isActive,
        createdBy: finding.createdBy,
        updatedBy: finding.updatedBy,
        // MongoDB will handle createdAt/updatedAt
      }

      await FindingModel.findByIdAndUpdate(finding.id, findingData, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      })

      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error ? error : new Error(`Failed to save finding with id ${finding.id}`)
      )
    }
  }

  /**
   * Delete a finding from the repository
   */
  public async delete(findingId: string): Promise<Result<void, Error>> {
    try {
      await FindingModel.findByIdAndDelete(findingId)
      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error ? error : new Error(`Failed to delete finding with id ${findingId}`)
      )
    }
  }

  /**
   * Count findings with optional filters
   */
  public async count(options?: {
    auditId?: string
    types?: FindingType[]
    severities?: FindingSeverity[]
    statuses?: FindingStatus[]
    controlId?: string
    overdue?: boolean
    active?: boolean
  }): Promise<Result<number, Error>> {
    try {
      // Build query
      const query: any = {}

      if (options?.auditId) {
        query.auditId = options.auditId
      }

      if (options?.types && options.types.length > 0) {
        query.type = { $in: options.types }
      }

      if (options?.severities && options.severities.length > 0) {
        query.severity = { $in: options.severities }
      }

      if (options?.statuses && options.statuses.length > 0) {
        query.status = { $in: options.statuses }
      }

      if (options?.controlId) {
        query.controlIds = options.controlId
      }

      if (options?.overdue) {
        const now = new Date()

        const overdueStatuses = [
          FindingStatus.OPEN,
          FindingStatus.IN_REMEDIATION,
          FindingStatus.REMEDIATED,
          FindingStatus.DEFERRED,
        ]

        query.$or = [
          {
            dueDate: { $lt: now },
            status: { $in: overdueStatuses },
          },
          {
            'remediationPlan.dueDate': { $lt: now },
            status: { $in: overdueStatuses },
          },
        ]
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      const count = await FindingModel.countDocuments(query)

      return Result.ok<number>(count)
    } catch (error) {
      return Result.fail<number>(
        error instanceof Error ? error : new Error('Failed to count findings')
      )
    }
  }

  /**
   * Map a MongoDB document to a domain Finding entity
   */
  private async mapDocumentToDomain(doc: IFindingDocument): Promise<Result<Finding, Error>> {
    try {
      // Create FindingTitle value object
      const titleOrError = FindingTitle.create(doc.title)
      if (!titleOrError.isSuccess) {
        return Result.fail<Finding>(titleOrError.getError())
      }

      // Create RemediationPlan value object if exists
      let remediationPlan: RemediationPlan | undefined
      if (doc.remediationPlan) {
        const remediationPlanOrError = RemediationPlan.create(
          doc.remediationPlan.description,
          doc.remediationPlan.dueDate,
          doc.remediationPlan.assignee,
          doc.remediationPlan.status as FindingStatus,
          doc.remediationPlan.updatedBy
        )

        if (!remediationPlanOrError.isSuccess) {
          return Result.fail<Finding>(remediationPlanOrError.getError())
        }

        remediationPlan = remediationPlanOrError.getValue()
      }

      // Create Finding entity
      return Finding.create(doc._id.toString(), {
        auditId: doc.auditId,
        title: titleOrError.getValue(),
        description: doc.description,
        type: doc.type as FindingType,
        severity: doc.severity as FindingSeverity,
        status: doc.status as FindingStatus,
        controlIds: doc.controlIds,
        evidenceIds: doc.evidenceIds,
        remediationPlan,
        dueDate: doc.dueDate,
        isActive: doc.isActive,
        createdBy: doc.createdBy,
        createdAt: doc.createdAt,
      })
    } catch (error) {
      return Result.fail<Finding>(
        error instanceof Error
          ? error
          : new Error(`Failed to map finding document to domain: ${error}`)
      )
    }
  }
}
