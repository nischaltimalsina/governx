import { Audit } from '../../domain/audit/audit'
import {
  AuditName,
  AuditStatus,
  AuditTemplate,
  AuditType,
  AuditorInfo,
  SchedulePeriod,
} from '../../domain/audit/audit_values'
import { IAuditRepository, IAuditTemplateRepository } from '../../domain/audit/repositories'
import { Result } from '../../domain/common/result'
import {
  AuditModel,
  AuditTemplateModel,
  IAuditDocument,
  IAuditTemplateDocument,
} from './models/audit_schema'

/**
 * MongoDB implementation of the Audit repository
 */
export class MongoAuditRepository implements IAuditRepository {
  /**
   * Find an audit by ID
   */
  public async findById(id: string): Promise<Result<Audit | null, Error>> {
    try {
      const auditDoc = await AuditModel.findById(id)
      if (!auditDoc) {
        return Result.ok<null>(null)
      }
      return this.mapDocumentToDomain(auditDoc)
    } catch (error) {
      return Result.fail<Audit | null>(
        error instanceof Error ? error : new Error(`Failed to find audit with id ${id}`)
      )
    }
  }

  /**
   * Find all audits with optional filters
   */
  public async findAll(options?: {
    types?: AuditType[]
    statuses?: AuditStatus[]
    frameworkId?: string
    leadAuditorId?: string
    startDate?: Date
    endDate?: Date
    active?: boolean
    pageSize?: number
    pageNumber?: number
  }): Promise<Result<Audit[], Error>> {
    try {
      // Build query
      const query: any = {}

      if (options?.types && options.types.length > 0) {
        query.type = { $in: options.types }
      }

      if (options?.statuses && options.statuses.length > 0) {
        query.status = { $in: options.statuses }
      }

      if (options?.leadAuditorId) {
        query['leadAuditor.id'] = options.leadAuditorId
      }

      if (options?.frameworkId) {
        query.frameworkIds = options.frameworkId
      }

      // Date range criteria for audit period
      if (options?.startDate || options?.endDate) {
        query['schedule.startDate'] = {}
        query['schedule.endDate'] = {}

        if (options?.startDate) {
          query['schedule.startDate'].$gte = options.startDate
        }

        if (options?.endDate) {
          query['schedule.endDate'].$lte = options.endDate
        }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      // Create query with pagination
      let auditDocs: IAuditDocument[]

      if (options?.pageSize && options?.pageNumber) {
        const skip = (options.pageNumber - 1) * options.pageSize
        auditDocs = await AuditModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(options.pageSize)
      } else {
        auditDocs = await AuditModel.find(query).sort({ createdAt: -1 })
      }

      // Map documents to domain entities
      const audits: Audit[] = []

      for (const doc of auditDocs) {
        const auditResult = await this.mapDocumentToDomain(doc)

        if (auditResult.isSuccess) {
          audits.push(auditResult.getValue())
        }
      }

      return Result.ok<Audit[]>(audits)
    } catch (error) {
      return Result.fail<Audit[]>(
        error instanceof Error ? error : new Error('Failed to find audits')
      )
    }
  }

  /**
   * Find audits by framework ID
   */
  public async findByFrameworkId(
    frameworkId: string,
    options?: {
      statuses?: AuditStatus[]
      active?: boolean
      pageSize?: number
      pageNumber?: number
    }
  ): Promise<Result<Audit[], Error>> {
    try {
      // Build query
      const query: any = {
        frameworkIds: frameworkId,
      }

      if (options?.statuses && options.statuses.length > 0) {
        query.status = { $in: options.statuses }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      // Create query with pagination
      let auditDocs: IAuditDocument[]

      if (options?.pageSize && options?.pageNumber) {
        const skip = (options.pageNumber - 1) * options.pageSize
        auditDocs = await AuditModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(options.pageSize)
      } else {
        auditDocs = await AuditModel.find(query).sort({ createdAt: -1 })
      }

      // Map documents to domain entities
      const audits: Audit[] = []

      for (const doc of auditDocs) {
        const auditResult = await this.mapDocumentToDomain(doc)

        if (auditResult.isSuccess) {
          audits.push(auditResult.getValue())
        }
      }

      return Result.ok<Audit[]>(audits)
    } catch (error) {
      return Result.fail<Audit[]>(
        error instanceof Error
          ? error
          : new Error(`Failed to find audits for framework ${frameworkId}`)
      )
    }
  }

  /**
   * Find audits by lead auditor ID
   */
  public async findByLeadAuditorId(
    auditorId: string,
    options?: {
      statuses?: AuditStatus[]
      active?: boolean
    }
  ): Promise<Result<Audit[], Error>> {
    try {
      // Build query
      const query: any = {
        'leadAuditor.id': auditorId,
      }

      if (options?.statuses && options.statuses.length > 0) {
        query.status = { $in: options.statuses }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      const auditDocs = await AuditModel.find(query).sort({ createdAt: -1 })

      // Map documents to domain entities
      const audits: Audit[] = []

      for (const doc of auditDocs) {
        const auditResult = await this.mapDocumentToDomain(doc)

        if (auditResult.isSuccess) {
          audits.push(auditResult.getValue())
        }
      }

      return Result.ok<Audit[]>(audits)
    } catch (error) {
      return Result.fail<Audit[]>(
        error instanceof Error
          ? error
          : new Error(`Failed to find audits for lead auditor ${auditorId}`)
      )
    }
  }

  /**
   * Check if an audit with the same name exists
   */
  public async existsByName(name: string): Promise<Result<boolean, Error>> {
    try {
      const count = await AuditModel.countDocuments({ name })
      return Result.ok<boolean>(count > 0)
    } catch (error) {
      return Result.fail<boolean>(
        error instanceof Error
          ? error
          : new Error(`Failed to check if audit with name ${name} exists`)
      )
    }
  }

  /**
   * Save an audit to the repository
   */
  public async save(audit: Audit): Promise<Result<void, Error>> {
    try {
      // Prepare lead auditor data
      const leadAuditorData = {
        id: audit.leadAuditor.getId(),
        name: audit.leadAuditor.getName(),
        organization: audit.leadAuditor.getOrganization(),
        role: audit.leadAuditor.getRole(),
        isExternal: audit.leadAuditor.getIsExternal(),
      }

      // Prepare audit team data if exists
      const auditTeamData = audit.auditTeam
        ? audit.auditTeam.map((auditor) => ({
            id: auditor.getId(),
            name: auditor.getName(),
            organization: auditor.getOrganization(),
            role: auditor.getRole(),
            isExternal: auditor.getIsExternal(),
          }))
        : undefined

      // Prepare schedule data
      const scheduleData = {
        startDate: audit.schedule.getStartDate(),
        endDate: audit.schedule.getEndDate(),
      }

      const auditData: any = {
        name: audit.name.getValue(),
        type: audit.type,
        status: audit.status,
        description: audit.description,
        frameworkIds: audit.frameworkIds,
        leadAuditor: leadAuditorData,
        auditTeam: auditTeamData,
        schedule: scheduleData,
        scope: audit.scope,
        methodology: audit.methodology,
        isActive: audit.isActive,
        createdBy: audit.createdBy,
        updatedBy: audit.updatedBy,
        // MongoDB will handle createdAt/updatedAt
      }

      await AuditModel.findByIdAndUpdate(audit.id, auditData, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      })

      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error ? error : new Error(`Failed to save audit with id ${audit.id}`)
      )
    }
  }

  /**
   * Delete an audit from the repository
   */
  public async delete(auditId: string): Promise<Result<void, Error>> {
    try {
      await AuditModel.findByIdAndDelete(auditId)
      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error ? error : new Error(`Failed to delete audit with id ${auditId}`)
      )
    }
  }

  /**
   * Count audits with optional filters
   */
  public async count(options?: {
    types?: AuditType[]
    statuses?: AuditStatus[]
    frameworkId?: string
    active?: boolean
  }): Promise<Result<number, Error>> {
    try {
      // Build query
      const query: any = {}

      if (options?.types && options.types.length > 0) {
        query.type = { $in: options.types }
      }

      if (options?.statuses && options.statuses.length > 0) {
        query.status = { $in: options.statuses }
      }

      if (options?.frameworkId) {
        query.frameworkIds = options.frameworkId
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      const count = await AuditModel.countDocuments(query)

      return Result.ok<number>(count)
    } catch (error) {
      return Result.fail<number>(
        error instanceof Error ? error : new Error('Failed to count audits')
      )
    }
  }

  /**
   * Map a MongoDB document to a domain Audit entity
   */
  private async mapDocumentToDomain(doc: IAuditDocument): Promise<Result<Audit, Error>> {
    try {
      // Create AuditName value object
      const nameOrError = AuditName.create(doc.name)
      if (!nameOrError.isSuccess) {
        return Result.fail<Audit>(nameOrError.getError())
      }

      // Create leadAuditor value object
      const leadAuditorData = doc.leadAuditor || {
        id: 'Unknown', // Fallback for backward compatibility
        name: 'Unknown',
        isExternal: false,
      }

      const leadAuditorOrError = AuditorInfo.create(
        leadAuditorData.id,
        leadAuditorData.name,
        leadAuditorData.isExternal,
        leadAuditorData.organization,
        leadAuditorData.role
      )

      if (!leadAuditorOrError.isSuccess) {
        return Result.fail<Audit>(leadAuditorOrError.getError())
      }

      // Create auditTeam value objects if they exist
      let auditTeam: AuditorInfo[] | undefined
      if (doc.auditTeam && doc.auditTeam.length > 0) {
        auditTeam = []

        for (const teamMember of doc.auditTeam) {
          const auditorInfoOrError = AuditorInfo.create(
            teamMember.id,
            teamMember.name,
            teamMember.isExternal,
            teamMember.organization,
            teamMember.role
          )

          if (!auditorInfoOrError.isSuccess) {
            return Result.fail<Audit>(auditorInfoOrError.getError())
          }

          auditTeam.push(auditorInfoOrError.getValue())
        }
      }

      // Create SchedulePeriod value object
      // Adapt based on how data is stored in the document
      const scheduleDataSource = doc.schedule ||
        doc.schedule || {
          startDate: new Date(),
          endDate: new Date(),
        }

      const schedulePeriodOrError = SchedulePeriod.create(
        scheduleDataSource.startDate,
        scheduleDataSource.endDate
      )

      if (!schedulePeriodOrError.isSuccess) {
        return Result.fail<Audit>(schedulePeriodOrError.getError())
      }

      // Create Audit entity
      return Audit.create(doc._id.toString(), {
        name: nameOrError.getValue(),
        type: doc.type as AuditType,
        description: doc.description,
        frameworkIds: doc.frameworkIds ?? [],
        leadAuditor: leadAuditorOrError.getValue(),
        auditTeam,
        schedule: schedulePeriodOrError.getValue(),
        scope: doc.scope,
        methodology: doc.methodology,
        status: doc.status as AuditStatus,
        isActive: doc.isActive,
        createdBy: doc.createdBy,
        createdAt: doc.createdAt,
      })
    } catch (error) {
      return Result.fail<Audit>(
        error instanceof Error
          ? error
          : new Error(`Failed to map audit document to domain: ${error}`)
      )
    }
  }
}

/**
 * MongoDB implementation of the Audit Template repository
 */
export class MongoAuditTemplateRepository implements IAuditTemplateRepository {
  /**
   * Find an audit template by ID
   */
  public async findById(id: string): Promise<Result<AuditTemplate | null, Error>> {
    try {
      const templateDoc = await AuditTemplateModel.findById(id)

      if (!templateDoc) {
        return Result.ok<null>(null)
      }

      return this.mapDocumentToDomain(templateDoc)
    } catch (error) {
      return Result.fail<AuditTemplate | null>(
        error instanceof Error ? error : new Error(`Failed to find audit template with id ${id}`)
      )
    }
  }

  /**
   * Find all audit templates with optional filters
   */
  public async findAll(options?: {
    type?: AuditType[]
    frameworkId?: string
    active?: boolean
    pageSize?: number
    pageNumber?: number
  }): Promise<Result<AuditTemplate[], Error>> {
    try {
      // Build query
      const query: any = {}

      if (options?.type && options.type.length > 0) {
        query.type = { $in: options.type }
      }

      if (options?.frameworkId) {
        query.frameworkId = options.frameworkId
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      // Create query with pagination
      let templateDocs: IAuditTemplateDocument[]

      if (options?.pageSize && options?.pageNumber) {
        const skip = (options.pageNumber - 1) * options.pageSize
        templateDocs = await AuditTemplateModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(options.pageSize)
      } else {
        templateDocs = await AuditTemplateModel.find(query).sort({ createdAt: -1 })
      }

      // Map documents to domain entities
      const templates: AuditTemplate[] = []

      for (const doc of templateDocs) {
        const templateResult = await this.mapDocumentToDomain(doc)

        if (templateResult.isSuccess) {
          templates.push(templateResult.getValue())
        }
      }

      return Result.ok<AuditTemplate[]>(templates)
    } catch (error) {
      return Result.fail<AuditTemplate[]>(
        error instanceof Error ? error : new Error('Failed to find audit templates')
      )
    }
  }

  /**
   * Save an audit template to the repository
   */
  public async save(template: AuditTemplate): Promise<Result<void, Error>> {
    try {
      // Framework IDs transformation
      const frameworkId =
        template.frameworkIds && template.frameworkIds.length > 0
          ? template.frameworkIds[0]
          : undefined

      // Map checklistItems to questionSections format used in the repository
      const checklistSections = template.checklistItems
        ? [
            {
              title: 'Checklist Items',
              questions: template.checklistItems.map((item) => ({
                id: item.id,
                text: item.description,
                category: item.category,
                required: item.required,
                responseType: 'yesno',
              })),
            },
          ]
        : []

      const templateData = {
        _id: template.id,
        name: template.name,
        type: template.type,
        description: template.description,
        frameworkId,
        controlIds: template.controlIds,
        questionSections: checklistSections,
        isActive: template.isActive,
        createdBy: template.createdBy,
        updatedBy: template.updatedBy,
      }

      await AuditTemplateModel.findByIdAndUpdate(template.id, templateData, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      })

      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error
          ? error
          : new Error(`Failed to save audit template with id ${template.id}`)
      )
    }
  }

  /**
   * Delete an audit template from the repository
   */
  public async delete(templateId: string): Promise<Result<void, Error>> {
    try {
      await AuditTemplateModel.findByIdAndDelete(templateId)
      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error
          ? error
          : new Error(`Failed to delete audit template with id ${templateId}`)
      )
    }
  }

  /**
   * Count audit templates with optional filters
   */
  public async count(options?: {
    type?: AuditType[]
    active?: boolean
  }): Promise<Result<number, Error>> {
    try {
      // Build query
      const query: any = {}

      if (options?.type && options.type.length > 0) {
        query.type = { $in: options.type }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      const count = await AuditTemplateModel.countDocuments(query)

      return Result.ok<number>(count)
    } catch (error) {
      return Result.fail<number>(
        error instanceof Error ? error : new Error('Failed to count audit templates')
      )
    }
  }

  /**
   * Map a MongoDB document to a domain AuditTemplate entity
   */
  private async mapDocumentToDomain(
    doc: IAuditTemplateDocument
  ): Promise<Result<AuditTemplate, Error>> {
    try {
      // Extract checklist items from question sections
      const checklistItems = doc.questionSections
        ? doc.questionSections.flatMap((section) =>
            section.questions.map((question) => ({
              id: question.id,
              description: question.text,
              category: question.guidance || section.title, // Use guidance as category or fallback to section title
              required: question.required,
            }))
          )
        : []

      const template: AuditTemplate = {
        id: doc._id.toString(),
        name: doc.name,
        type: doc.type as AuditType,
        description: doc.description,
        frameworkIds: doc.frameworkId ? [doc.frameworkId] : [],
        controlIds: doc.controlIds || [],
        checklistItems: checklistItems,
        isActive: doc.isActive,
        createdBy: doc.createdBy,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }

      return Result.ok<AuditTemplate>(template)
    } catch (error) {
      return Result.fail<AuditTemplate>(
        error instanceof Error
          ? error
          : new Error(`Failed to map audit template document to domain: ${error}`)
      )
    }
  }
}
