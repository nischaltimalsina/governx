import { v4 as uuidv4 } from 'uuid'
import { Result } from '../common/result'
import { Audit } from './audit'
import { Finding } from './finding'
import { IAuditRepository, IAuditTemplateRepository, IFindingRepository } from './repositories'
import { IFrameworkRepository } from '../compliance/framework_repository'
import { IControlRepository } from '../compliance/framework_repository'
import { IEvidenceRepository } from '../compliance/evidence_repository'
import {
  AuditName,
  AuditType,
  AuditStatus,
  AuditorInfo,
  SchedulePeriod,
  FindingTitle,
  FindingType,
  FindingSeverity,
  FindingStatus,
  RemediationPlan,
  AuditTemplate,
} from './audit_values'
import mongoose from 'mongoose'

/**
 * Audit service for managing audits and their findings
 */
export class AuditService {
  constructor(
    private auditRepository: IAuditRepository,
    private findingRepository: IFindingRepository,
    private frameworkRepository: IFrameworkRepository,
    private controlRepository: IControlRepository,
    private evidenceRepository: IEvidenceRepository,
    private auditTemplateRepository: IAuditTemplateRepository
  ) {}

  /**
   * Create a new audit
   */
  public async createAudit(
    name: AuditName,
    type: AuditType,
    description: string,
    frameworkIds: string[],
    leadAuditor: AuditorInfo,
    schedule: SchedulePeriod,
    userId: string,
    options?: {
      auditTeam?: AuditorInfo[]
      scope?: string
      methodology?: string
    }
  ): Promise<Result<Audit, Error>> {
    // Check if audit with same name already exists
    const existsResult = await this.auditRepository.existsByName(name.getValue())

    if (!existsResult.isSuccess) {
      return Result.fail<Audit>(existsResult.getError())
    }

    if (existsResult.getValue()) {
      return Result.fail<Audit>(new Error(`Audit with name '${name.getValue()}' already exists`))
    }

    // Verify that all framework IDs exist
    for (const frameworkId of frameworkIds) {
      const frameworkResult = await this.frameworkRepository.findById(frameworkId)

      if (!frameworkResult.isSuccess) {
        return Result.fail<Audit>(frameworkResult.getError())
      }

      const framework = frameworkResult.getValue()

      if (!framework) {
        return Result.fail<Audit>(new Error(`Framework with ID ${frameworkId} not found`))
      }
    }

    // Create audit entity
    const auditId = new mongoose.Types.ObjectId().toString()
    const auditResult = Audit.create(auditId, {
      name,
      type,
      description,
      frameworkIds,
      leadAuditor,
      schedule,
      auditTeam: options?.auditTeam,
      scope: options?.scope,
      methodology: options?.methodology,
      createdBy: userId,
    })

    if (!auditResult.isSuccess) {
      return Result.fail<Audit>(auditResult.getError())
    }

    const audit = auditResult.getValue()

    // Save audit to repository
    const saveResult = await this.auditRepository.save(audit)

    if (!saveResult.isSuccess) {
      return Result.fail<Audit>(saveResult.getError())
    }

    return Result.ok<Audit>(audit)
  }

  /**
   * Update audit status
   */
  public async updateAuditStatus(
    auditId: string,
    status: AuditStatus,
    userId: string
  ): Promise<Result<Audit, Error>> {
    // Find audit
    const auditResult = await this.auditRepository.findById(auditId)

    if (!auditResult.isSuccess) {
      return Result.fail<Audit>(auditResult.getError())
    }

    const audit = auditResult.getValue()

    if (!audit) {
      return Result.fail<Audit>(new Error(`Audit with ID ${auditId} not found`))
    }

    // Update audit status
    const updateResult = audit.updateStatus(status, userId)

    if (!updateResult.isSuccess) {
      return Result.fail<Audit>(updateResult.getError())
    }

    // Save updated audit
    const saveResult = await this.auditRepository.save(audit)

    if (!saveResult.isSuccess) {
      return Result.fail<Audit>(saveResult.getError())
    }

    return Result.ok<Audit>(audit)
  }

  /**
   * Create a finding for an audit
   */
  public async createFinding(
    auditId: string,
    title: FindingTitle,
    description: string,
    type: FindingType,
    severity: FindingSeverity,
    userId: string,
    options?: {
      controlIds?: string[]
      evidenceIds?: string[]
      dueDate?: Date
      remediationPlan?: {
        description: string
        dueDate: Date
        assignee: string
      }
    }
  ): Promise<Result<Finding, Error>> {
    // Verify that the audit exists
    const auditResult = await this.auditRepository.findById(auditId)

    if (!auditResult.isSuccess) {
      return Result.fail<Finding>(auditResult.getError())
    }

    const audit = auditResult.getValue()

    if (!audit) {
      return Result.fail<Finding>(new Error(`Audit with ID ${auditId} not found`))
    }

    // Verify controls if provided
    if (options?.controlIds && options.controlIds.length > 0) {
      for (const controlId of options.controlIds) {
        const controlResult = await this.controlRepository.findById(controlId)

        if (!controlResult.isSuccess) {
          return Result.fail<Finding>(controlResult.getError())
        }

        const control = controlResult.getValue()

        if (!control) {
          return Result.fail<Finding>(new Error(`Control with ID ${controlId} not found`))
        }
      }
    }

    // Verify evidence if provided
    if (options?.evidenceIds && options.evidenceIds.length > 0) {
      for (const evidenceId of options.evidenceIds) {
        const evidenceResult = await this.evidenceRepository.findById(evidenceId)

        if (!evidenceResult.isSuccess) {
          return Result.fail<Finding>(evidenceResult.getError())
        }

        const evidence = evidenceResult.getValue()

        if (!evidence) {
          return Result.fail<Finding>(new Error(`Evidence with ID ${evidenceId} not found`))
        }
      }
    }

    // Create remediation plan if provided
    let remediationPlan: RemediationPlan | undefined
    if (options?.remediationPlan) {
      const planResult = RemediationPlan.create(
        options.remediationPlan.description,
        options.remediationPlan.dueDate,
        options.remediationPlan.assignee,
        FindingStatus.OPEN,
        userId
      )

      if (!planResult.isSuccess) {
        return Result.fail<Finding>(planResult.getError())
      }

      remediationPlan = planResult.getValue()
    }

    // Create finding entity
    const findingId = uuidv4()
    const findingResult = Finding.create(findingId, {
      auditId,
      title,
      description,
      type,
      severity,
      controlIds: options?.controlIds,
      evidenceIds: options?.evidenceIds,
      dueDate: options?.dueDate,
      remediationPlan,
      createdBy: userId,
    })

    if (!findingResult.isSuccess) {
      return Result.fail<Finding>(findingResult.getError())
    }

    const finding = findingResult.getValue()

    // Save finding to repository
    const saveResult = await this.findingRepository.save(finding)

    if (!saveResult.isSuccess) {
      return Result.fail<Finding>(saveResult.getError())
    }

    return Result.ok<Finding>(finding)
  }

  /**
   * Update finding status
   */
  public async updateFindingStatus(
    findingId: string,
    status: FindingStatus,
    userId: string
  ): Promise<Result<Finding, Error>> {
    // Find finding
    const findingResult = await this.findingRepository.findById(findingId)

    if (!findingResult.isSuccess) {
      return Result.fail<Finding>(findingResult.getError())
    }

    const finding = findingResult.getValue()

    if (!finding) {
      return Result.fail<Finding>(new Error(`Finding with ID ${findingId} not found`))
    }

    // Update finding status
    const updateResult = finding.updateStatus(status, userId)

    if (!updateResult.isSuccess) {
      return Result.fail<Finding>(updateResult.getError())
    }

    // If remediation plan exists, update its status as well
    if (finding.remediationPlan) {
      const remedPlan = finding.remediationPlan

      const planUpdateResult = RemediationPlan.update(remedPlan, { status }, userId)

      if (planUpdateResult.isSuccess) {
        const updatePlanResult = finding.updateRemediationPlan(planUpdateResult.getValue(), userId)

        if (!updatePlanResult.isSuccess) {
          return Result.fail<Finding>(updatePlanResult.getError())
        }
      }
    }

    // Save updated finding
    const saveResult = await this.findingRepository.save(finding)

    if (!saveResult.isSuccess) {
      return Result.fail<Finding>(saveResult.getError())
    }

    return Result.ok<Finding>(finding)
  }

  /**
   * Add remediation plan to a finding
   */
  public async addRemediationPlan(
    findingId: string,
    planDescription: string,
    dueDate: Date,
    assignee: string,
    userId: string
  ): Promise<Result<Finding, Error>> {
    // Find finding
    const findingResult = await this.findingRepository.findById(findingId)

    if (!findingResult.isSuccess) {
      return Result.fail<Finding>(findingResult.getError())
    }

    const finding = findingResult.getValue()

    if (!finding) {
      return Result.fail<Finding>(new Error(`Finding with ID ${findingId} not found`))
    }

    // Create remediation plan
    const remediationPlanResult = RemediationPlan.create(
      planDescription,
      dueDate,
      assignee,
      FindingStatus.IN_REMEDIATION,
      userId
    )

    if (!remediationPlanResult.isSuccess) {
      return Result.fail<Finding>(remediationPlanResult.getError())
    }

    // Update finding with remediation plan
    const updateResult = finding.updateRemediationPlan(remediationPlanResult.getValue(), userId)

    if (!updateResult.isSuccess) {
      return Result.fail<Finding>(updateResult.getError())
    }

    // Update finding status to IN_REMEDIATION
    const statusResult = finding.updateStatus(FindingStatus.IN_REMEDIATION, userId)

    if (!statusResult.isSuccess) {
      return Result.fail<Finding>(statusResult.getError())
    }

    // Update due date if not already set
    if (!finding.dueDate) {
      finding.updateDueDate(dueDate, userId)
    }

    // Save updated finding
    const saveResult = await this.findingRepository.save(finding)

    if (!saveResult.isSuccess) {
      return Result.fail<Finding>(saveResult.getError())
    }

    return Result.ok<Finding>(finding)
  }

  /**
   * Update remediation plan
   */
  public async updateRemediationPlan(
    findingId: string,
    updates: {
      description?: string
      dueDate?: Date
      assignee?: string
      status?: FindingStatus
    },
    userId: string
  ): Promise<Result<Finding, Error>> {
    // Find finding
    const findingResult = await this.findingRepository.findById(findingId)

    if (!findingResult.isSuccess) {
      return Result.fail<Finding>(findingResult.getError())
    }

    const finding = findingResult.getValue()

    if (!finding) {
      return Result.fail<Finding>(new Error(`Finding with ID ${findingId} not found`))
    }

    // Check if finding has a remediation plan
    if (!finding.remediationPlan) {
      return Result.fail<Finding>(new Error('Finding does not have a remediation plan'))
    }

    // Update remediation plan
    const planUpdateResult = RemediationPlan.update(finding.remediationPlan, updates, userId)

    if (!planUpdateResult.isSuccess) {
      return Result.fail<Finding>(planUpdateResult.getError())
    }

    // Update finding with new remediation plan
    const updateResult = finding.updateRemediationPlan(planUpdateResult.getValue(), userId)

    if (!updateResult.isSuccess) {
      return Result.fail<Finding>(updateResult.getError())
    }

    // Update finding status if provided
    if (updates.status) {
      const statusResult = finding.updateStatus(updates.status, userId)

      if (!statusResult.isSuccess) {
        return Result.fail<Finding>(statusResult.getError())
      }
    }

    // Update finding due date if remediation plan due date is updated
    if (updates.dueDate) {
      finding.updateDueDate(updates.dueDate, userId)
    }

    // Save updated finding
    const saveResult = await this.findingRepository.save(finding)

    if (!saveResult.isSuccess) {
      return Result.fail<Finding>(saveResult.getError())
    }

    return Result.ok<Finding>(finding)
  }

  /**
   * Get overdue findings
   */
  public async getOverdueFindings(): Promise<Result<Finding[], Error>> {
    // Find findings that are overdue
    return await this.findingRepository.findAll({
      overdue: true,
      statuses: [FindingStatus.OPEN, FindingStatus.IN_REMEDIATION],
      active: true,
    })
  }

  /**
   * Get audit statistics
   */
  public async getAuditStatistics(): Promise<
    Result<
      {
        totalAudits: number
        byStatus: Record<AuditStatus, number>
        byType: Record<AuditType, number>
        findings: {
          total: number
          bySeverity: Record<FindingSeverity, number>
          byStatus: Record<FindingStatus, number>
          overdue: number
        }
      },
      Error
    >
  > {
    try {
      // Get total audits
      const totalResult = await this.auditRepository.count({ active: true })
      if (!totalResult.isSuccess) {
        return Result.fail(totalResult.getError())
      }
      const totalAudits = totalResult.getValue()

      // Initialize empty statistics objects
      const byStatus: Partial<Record<AuditStatus, number>> = {}
      const byType: Partial<Record<AuditType, number>> = {}
      const bySeverity: Partial<Record<FindingSeverity, number>> = {}
      const findingByStatus: Partial<Record<FindingStatus, number>> = {}

      // Get audits by status
      for (const status of Object.values(AuditStatus)) {
        const countResult = await this.auditRepository.count({
          statuses: [status],
          active: true,
        })

        if (countResult.isSuccess) {
          byStatus[status] = countResult.getValue()
        }
      }

      // Get audits by type
      for (const type of Object.values(AuditType)) {
        const countResult = await this.auditRepository.count({
          types: [type],
          active: true,
        })

        if (countResult.isSuccess) {
          byType[type] = countResult.getValue()
        }
      }

      // Get total findings
      const totalFindingsResult = await this.findingRepository.count({ active: true })
      if (!totalFindingsResult.isSuccess) {
        return Result.fail(totalFindingsResult.getError())
      }
      const totalFindings = totalFindingsResult.getValue()

      // Get findings by severity
      for (const severity of Object.values(FindingSeverity)) {
        const countResult = await this.findingRepository.count({
          severities: [severity],
          active: true,
        })

        if (countResult.isSuccess) {
          bySeverity[severity] = countResult.getValue()
        }
      }

      // Get findings by status
      for (const status of Object.values(FindingStatus)) {
        const countResult = await this.findingRepository.count({
          statuses: [status],
          active: true,
        })

        if (countResult.isSuccess) {
          findingByStatus[status] = countResult.getValue()
        }
      }

      // Get overdue findings
      const overdueResult = await this.findingRepository.count({
        overdue: true,
        active: true,
      })

      if (!overdueResult.isSuccess) {
        return Result.fail(overdueResult.getError())
      }
      const overdueFindings = overdueResult.getValue()

      return Result.ok({
        totalAudits,
        byStatus: byStatus as Record<AuditStatus, number>,
        byType: byType as Record<AuditType, number>,
        findings: {
          total: totalFindings,
          bySeverity: bySeverity as Record<FindingSeverity, number>,
          byStatus: findingByStatus as Record<FindingStatus, number>,
          overdue: overdueFindings,
        },
      })
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Error getting audit statistics')
      )
    }
  }

  /**
   * Create an audit template
   */
  public async createAuditTemplate(
    name: string,
    description: string,
    type: AuditType,
    userId: string,
    options?: {
      frameworkIds?: string[]
      controlIds?: string[]
      checklistItems?: {
        description: string
        category?: string
        required: boolean
      }[]
    }
  ): Promise<Result<AuditTemplate, Error>> {
    // Validate name
    if (!name || name.trim().length === 0) {
      return Result.fail<AuditTemplate>(new Error('Template name is required'))
    }

    if (name.length > 200) {
      return Result.fail<AuditTemplate>(new Error('Template name cannot exceed 200 characters'))
    }

    // Validate description
    if (!description || description.trim().length === 0) {
      return Result.fail<AuditTemplate>(new Error('Template description is required'))
    }

    if (description.length > 2000) {
      return Result.fail<AuditTemplate>(
        new Error('Template description cannot exceed 2000 characters')
      )
    }

    // Verify framework IDs if provided
    if (options?.frameworkIds && options.frameworkIds.length > 0) {
      for (const frameworkId of options.frameworkIds) {
        const frameworkResult = await this.frameworkRepository.findById(frameworkId)

        if (!frameworkResult.isSuccess) {
          return Result.fail<AuditTemplate>(frameworkResult.getError())
        }

        const framework = frameworkResult.getValue()

        if (!framework) {
          return Result.fail<AuditTemplate>(new Error(`Framework with ID ${frameworkId} not found`))
        }
      }
    }

    // Verify control IDs if provided
    if (options?.controlIds && options.controlIds.length > 0) {
      for (const controlId of options.controlIds) {
        const controlResult = await this.controlRepository.findById(controlId)

        if (!controlResult.isSuccess) {
          return Result.fail<AuditTemplate>(controlResult.getError())
        }

        const control = controlResult.getValue()

        if (!control) {
          return Result.fail<AuditTemplate>(new Error(`Control with ID ${controlId} not found`))
        }
      }
    }

    // Transform checklist items if provided
    const checklistItems = options?.checklistItems?.map((item) => ({
      id: uuidv4(),
      description: item.description,
      category: item.category,
      required: item.required,
    }))

    // Create template
    const template: AuditTemplate = {
      id: uuidv4(),
      name,
      description,
      type,
      frameworkIds: options?.frameworkIds,
      controlIds: options?.controlIds,
      checklistItems,
      isActive: true,
      createdBy: userId,
      createdAt: new Date(),
    }

    // Save template to repository
    const saveResult = await this.auditTemplateRepository.save(template)

    if (!saveResult.isSuccess) {
      return Result.fail<AuditTemplate>(saveResult.getError())
    }

    return Result.ok<AuditTemplate>(template)
  }
}
