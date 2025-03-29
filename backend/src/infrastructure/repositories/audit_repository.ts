import { IAuditRepository, IAuditTemplateRepository } from '../../domain/audit/repositories'
import { Audit } from '../../domain/audit/audit'
import {
  AuditName,
  AuditType,
  AuditStatus,
  AuditTemplate,
  FindingSeverity,
  FindingStatus,
  SchedulePeriod,
} from '../../domain/audit/audit_values'
import { Result } from '../../domain/common/result'
import {
  AuditModel,
  IAuditDocument,
  AuditTemplateModel,
  IAuditTemplateDocument,
} from './models/audit_schema'
import { Finding } from '@/domain/audit/finding'

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
    type?: AuditType[]
    status?: AuditStatus[]
    auditorId?: string
    auditeeId?: string
    frameworkId?: string
    controlId?: string
    startDate?: Date
    endDate?: Date
    overdue?: boolean
    active?: boolean
    pageSize?: number
    pageNumber?: number
  }): Promise<Result<Audit[], Error>> {
    try {
      // Build query
      const query: any = {}

      if (options?.type && options.type.length > 0) {
        query.type = { $in: options.type }
      }

      if (options?.status && options.status.length > 0) {
        query.status = { $in: options.status }
      }

      if (options?.auditorId) {
        query.auditorId = options.auditorId
      }

      if (options?.auditeeId) {
        query.auditeeId = options.auditeeId
      }

      if (options?.frameworkId) {
        query.relatedFrameworkIds = options.frameworkId
      }

      if (options?.controlId) {
        query.relatedControlIds = options.controlId
      }

      // Date range criteria
      if (options?.startDate || options?.endDate) {
        query['auditPeriod.startDate'] = {}
        query['auditPeriod.endDate'] = {}

        if (options?.startDate) {
          query['auditPeriod.startDate'].$gte = options.startDate
        }

        if (options?.endDate) {
          query['auditPeriod.endDate'].$lte = options.endDate
        }
      }

      // Handle overdue audits
      if (options?.overdue) {
        const now = new Date()
        query.dueDate = { $lt: now }
        query.status = { $nin: [AuditStatus.COMPLETED, AuditStatus.CANCELLED] }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      // Create query with pagination
      let auditDocs: IAuditDocument[]

      if (options?.pageSize && options?.pageNumber) {
        const skip = (options.pageNumber - 1) * options.pageSize
        auditDocs = await AuditModel.find(query)
          .sort({ dueDate: 1, createdAt: -1 })
          .skip(skip)
          .limit(options.pageSize)
      } else {
        auditDocs = await AuditModel.find(query).sort({ dueDate: 1, createdAt: -1 })
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
        relatedFrameworkIds: frameworkId,
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
          .sort({ 'auditPeriod.startDate': -1, createdAt: -1 })
          .skip(skip)
          .limit(options.pageSize)
      } else {
        auditDocs = await AuditModel.find(query).sort({
          'auditPeriod.startDate': -1,
          createdAt: -1,
        })
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
        auditorId: auditorId, // Changed from 'leadAuditor.id' to match fields in the document
      }

      if (options?.statuses && options.statuses.length > 0) {
        query.status = { $in: options.statuses }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      const auditDocs = await AuditModel.find(query).sort({
        'auditPeriod.startDate': -1,
        createdAt: -1,
      })

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
   * Find audits assigned to an auditor
   */
  public async findByAuditor(
    auditorId: string,
    options?: {
      status?: AuditStatus[]
      overdue?: boolean
      active?: boolean
    }
  ): Promise<Result<Audit[], Error>> {
    try {
      // Build query
      const query: any = {
        auditorId,
      }

      if (options?.status && options.status.length > 0) {
        query.status = { $in: options.status }
      }

      if (options?.overdue) {
        const now = new Date()
        query.dueDate = { $lt: now }
        query.status = { $nin: [AuditStatus.COMPLETED, AuditStatus.CANCELLED] }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      const auditDocs = await AuditModel.find(query).sort({ dueDate: 1, createdAt: -1 })

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
        error instanceof Error ? error : new Error(`Failed to find audits for auditor ${auditorId}`)
      )
    }
  }

  /**
   * Find audits where the entity is being audited
   */
  public async findByAuditee(
    auditeeId: string,
    options?: {
      status?: AuditStatus[]
      active?: boolean
    }
  ): Promise<Result<Audit[], Error>> {
    try {
      // Build query
      const query: any = {
        auditeeId,
      }

      if (options?.status && options.status.length > 0) {
        query.status = { $in: options.status }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      const auditDocs = await AuditModel.find(query).sort({ dueDate: 1, createdAt: -1 })

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
        error instanceof Error ? error : new Error(`Failed to find audits for auditee ${auditeeId}`)
      )
    }
  }

  /**
   * Find audits related to a specific control
   */
  public async findByControlId(
    controlId: string,
    options?: {
      status?: AuditStatus[]
      active?: boolean
    }
  ): Promise<Result<Audit[], Error>> {
    try {
      // Build query
      const query: any = {
        relatedControlIds: controlId,
      }

      if (options?.status && options.status.length > 0) {
        query.status = { $in: options.status }
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
        error instanceof Error ? error : new Error(`Failed to find audits for control ${controlId}`)
      )
    }
  }

  /**
   * Save an audit to the repository
   */
  public async save(audit: Audit): Promise<Result<void, Error>> {
    try {
      const auditData: any = {
        name: audit.name.getValue(),
        type: audit.type,
        status: audit.status,
        description: audit.description,
        auditPeriod: {
          startDate: audit.schedule.getStartDate(),
          endDate: audit.schedule.getEndDate(),
        },
        dueDate: audit.remediation.dueDate,
        auditeeId: audit.auditeeId,
        auditorId: audit.auditorId,
        relatedFrameworkIds: audit.relatedFrameworkIds,
        relatedControlIds: audit.relatedControlIds,
        findings: audit.findings
          ? audit.findings.map((finding) => ({
              id: finding.id,
              title: finding.title,
              description: finding.description,
              severity: finding.severity,
              status: finding.status,
              controlId: finding.controlId,
              evidenceIds: finding.evidenceIds,
              remediation: finding.remediation,
              createdAt: finding.createdAt,
              updatedAt: finding.updatedAt,
            }))
          : [],
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
    type?: AuditType[]
    status?: AuditStatus[]
    auditorId?: string
    auditeeId?: string
    frameworkId?: string
    controlId?: string
    overdue?: boolean
    active?: boolean
  }): Promise<Result<number, Error>> {
    try {
      // Build query
      const query: any = {}

      if (options?.type && options.type.length > 0) {
        query.type = { $in: options.type }
      }

      if (options?.status && options.status.length > 0) {
        query.status = { $in: options.status }
      }

      if (options?.auditorId) {
        query.auditorId = options.auditorId
      }

      if (options?.auditeeId) {
        query.auditeeId = options.auditeeId
      }

      if (options?.frameworkId) {
        query.relatedFrameworkIds = options.frameworkId
      }

      if (options?.controlId) {
        query.relatedControlIds = options.controlId
      }

      if (options?.overdue) {
        const now = new Date()
        query.dueDate = { $lt: now }
        query.status = { $nin: [AuditStatus.COMPLETED, AuditStatus.CANCELLED] }
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
      // Create value objects
      const nameOrError = AuditName.create(doc.name)
      if (!nameOrError.isSuccess) {
        return Result.fail<Audit>(nameOrError.getError())
      }

      // Create audit period
      const auditPeriodOrError = SchedulePeriod.create(
        doc.auditPeriod.startDate,
        doc.auditPeriod.endDate
      )
      if (!auditPeriodOrError.isSuccess) {
        return Result.fail<Audit>(auditPeriodOrError.getError())
      }

      // Map findings if they exist
      const findings = doc.findings
        ? doc.findings.map((f) => {
            return Finding.create(f.id, {
              title: f.title,
              description: f.description,
              severity: f.severity as FindingSeverity,
              status: f.status as FindingStatus,
              controlId: f.controlId,
              evidenceIds: f.evidenceIds,
              remediation: f.remediation,
              createdAt: f.createdAt,
            }).getValue()
          })
        : undefined

      // Create Audit entity
      return Audit.create(doc._id.toString(), {
        name: nameOrError.getValue(),
        type: doc.type as AuditType,
        status: doc.status as AuditStatus,
        description: doc.description,
        auditPeriod: auditPeriodOrError.getValue(),
        dueDate: doc.dueDate,
        auditeeId: doc.auditeeId,
        auditorId: doc.auditorId,
        relatedFrameworkIds: doc.relatedFrameworkIds,
        relatedControlIds: doc.relatedControlIds,
        findings,
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
      const templateData = {
        name: template.name,
        type: template.type,
        description: template.description,
        frameworkId:
          template.frameworkIds && template.frameworkIds.length > 0
            ? template.frameworkIds[0]
            : null,
        controlIds: template.controlIds,
        questionSections: template.questionSections,
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
   * Map a MongoDB document to a domain AuditTemplate entity
   */
  private async mapDocumentToDomain(
    doc: IAuditTemplateDocument
  ): Promise<Result<AuditTemplate, Error>> {
    try {
      return Result.ok<AuditTemplate>({
        id: doc._id.toString(),
        name: doc.name,
        type: doc.type as AuditType,
        description: doc.description,
        frameworkIds: doc.frameworkId ? [doc.frameworkId] : [],
        controlIds: doc.controlIds || [],
        questionSections: doc.questionSections || [],
        isActive: doc.isActive,
        createdBy: doc.createdBy,
        updatedBy: doc.updatedBy,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      })
    } catch (error) {
      return Result.fail<AuditTemplate>(
        error instanceof Error
          ? error
          : new Error(`Failed to map audit template document to domain: ${error}`)
      )
    }
  }
}
