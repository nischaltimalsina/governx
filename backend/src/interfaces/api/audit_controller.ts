import { Request, Response } from 'express'
import { CreateAuditUseCase } from '../../application/audit/create_audit'
import { GetAuditUseCase } from '../../application/audit/get_audit'
import { ListAuditsUseCase } from '../../application/audit/list_audits'
import { UpdateAuditStatusUseCase } from '../../application/audit/update_audit_status'
import { CreateFindingUseCase } from '../../application/audit/create_finding'
import { GetFindingUseCase } from '../../application/audit/get_finding'
import { ListFindingsUseCase } from '../../application/audit/list_findings'
import { UpdateFindingStatusUseCase } from '../../application/audit/update_finding_status'
import { AddRemediationPlanUseCase } from '../../application/audit/add_remediation_plan'
import { UpdateRemediationPlanUseCase } from '../../application/audit/update_remediation_plan'
import {
  AuditType,
  AuditStatus,
  FindingType,
  FindingSeverity,
  FindingStatus,
} from '../../domain/audit/audit_values'

/**
 * Controller for audit-related endpoints
 */
export class AuditController {
  constructor(
    private createAuditUseCase: CreateAuditUseCase,
    private getAuditUseCase: GetAuditUseCase,
    private listAuditsUseCase: ListAuditsUseCase,
    private updateAuditStatusUseCase: UpdateAuditStatusUseCase,
    private createFindingUseCase: CreateFindingUseCase,
    private getFindingUseCase: GetFindingUseCase,
    private listFindingsUseCase: ListFindingsUseCase,
    private updateFindingStatusUseCase: UpdateFindingStatusUseCase,
    private addRemediationPlanUseCase: AddRemediationPlanUseCase,
    private updateRemediationPlanUseCase: UpdateRemediationPlanUseCase
  ) {}

  /**
   * Create a new audit
   */
  public createAudit = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
        return
      }

      // Transform dates from request
      const startDate = new Date(req.body.schedule.startDate)
      const endDate = new Date(req.body.schedule.endDate)

      // Create DTO from request
      const createAuditDto = {
        name: req.body.name,
        type: req.body.type,
        description: req.body.description,
        frameworkIds: req.body.frameworkIds,
        leadAuditor: req.body.leadAuditor,
        auditTeam: req.body.auditTeam,
        schedule: {
          startDate,
          endDate,
        },
        scope: req.body.scope,
        methodology: req.body.methodology,
      }

      const result = await this.createAuditUseCase.execute(createAuditDto, req.userId)

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(201).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('Create audit error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * Get an audit by ID
   */
  public getAudit = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params
      const includeFindings = req.query.includeFindings === 'true'

      const result = await this.getAuditUseCase.execute(id, includeFindings)

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      const audit = result.getValue()

      if (!audit) {
        res.status(404).json({
          success: false,
          message: `Audit with ID ${id} not found`,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: audit,
      })
    } catch (error) {
      console.error('Get audit error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * List audits with filters
   */
  public listAudits = async (req: Request, res: Response): Promise<void> => {
    try {
      // Parse filter parameters
      const frameworkId = req.query.frameworkId as string | undefined
      const leadAuditorId = req.query.leadAuditorId as string | undefined
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined
      const active =
        req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined
      const pageNumber = req.query.pageNumber ? parseInt(req.query.pageNumber as string) : undefined

      // Parse type array
      let types: AuditType[] | undefined
      const typeParam = req.query.type
      if (typeParam) {
        if (Array.isArray(typeParam)) {
          types = typeParam as AuditType[]
        } else {
          types = [typeParam as AuditType]
        }
      }

      // Parse status array
      let statuses: AuditStatus[] | undefined
      const statusParam = req.query.status
      if (statusParam) {
        if (Array.isArray(statusParam)) {
          statuses = statusParam as AuditStatus[]
        } else {
          statuses = [statusParam as AuditStatus]
        }
      }

      const result = await this.listAuditsUseCase.execute({
        types,
        statuses,
        frameworkId,
        leadAuditorId,
        startDate,
        endDate,
        active,
        pageSize,
        pageNumber,
      })

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('List audits error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * Update audit status
   */
  public updateAuditStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
        return
      }

      const { id } = req.params
      const result = await this.updateAuditStatusUseCase.execute(
        id,
        { status: req.body.status },
        req.userId
      )

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('Update audit status error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * Create a new finding
   */
  public createFinding = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
        return
      }

      // Transform dates from request
      const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : undefined

      // Create DTO from request
      const createFindingDto = {
        auditId: req.body.auditId,
        title: req.body.title,
        description: req.body.description,
        type: req.body.type,
        severity: req.body.severity,
        controlIds: req.body.controlIds,
        evidenceIds: req.body.evidenceIds,
        dueDate,
        remediationPlan: req.body.remediationPlan
          ? {
              description: req.body.remediationPlan.description,
              dueDate: new Date(req.body.remediationPlan.dueDate),
              assignee: req.body.remediationPlan.assignee,
            }
          : undefined,
      }

      const result = await this.createFindingUseCase.execute(createFindingDto, req.userId)

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(201).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('Create finding error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * Get a finding by ID
   */
  public getFinding = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      const result = await this.getFindingUseCase.execute(id)

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      const finding = result.getValue()

      if (!finding) {
        res.status(404).json({
          success: false,
          message: `Finding with ID ${id} not found`,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: finding,
      })
    } catch (error) {
      console.error('Get finding error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * List findings with filters
   */
  public listFindings = async (req: Request, res: Response): Promise<void> => {
    try {
      // Parse filter parameters
      const auditId = req.query.auditId as string | undefined
      const controlId = req.query.controlId as string | undefined
      const assigneeId = req.query.assigneeId as string | undefined
      const overdue = req.query.overdue === 'true'
      const active =
        req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined
      const pageNumber = req.query.pageNumber ? parseInt(req.query.pageNumber as string) : undefined

      // Parse type array
      let types: FindingType[] | undefined
      const typeParam = req.query.type
      if (typeParam) {
        if (Array.isArray(typeParam)) {
          types = typeParam as FindingType[]
        } else {
          types = [typeParam as FindingType]
        }
      }

      // Parse severity array
      let severities: FindingSeverity[] | undefined
      const severityParam = req.query.severity
      if (severityParam) {
        if (Array.isArray(severityParam)) {
          severities = severityParam as FindingSeverity[]
        } else {
          severities = [severityParam as FindingSeverity]
        }
      }

      // Parse status array
      let statuses: FindingStatus[] | undefined
      const statusParam = req.query.status
      if (statusParam) {
        if (Array.isArray(statusParam)) {
          statuses = statusParam as FindingStatus[]
        } else {
          statuses = [statusParam as FindingStatus]
        }
      }

      const result = await this.listFindingsUseCase.execute({
        auditId,
        types,
        severities,
        statuses,
        controlId,
        assigneeId,
        overdue,
        active,
        pageSize,
        pageNumber,
      })

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('List findings error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * Update finding status
   */
  public updateFindingStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
        return
      }

      const { id } = req.params
      const result = await this.updateFindingStatusUseCase.execute(
        id,
        { status: req.body.status },
        req.userId
      )

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('Update finding status error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * Add remediation plan to finding
   */
  public addRemediationPlan = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
        return
      }

      const { id } = req.params
      const result = await this.addRemediationPlanUseCase.execute(
        id,
        {
          description: req.body.description,
          dueDate: new Date(req.body.dueDate),
          assignee: req.body.assignee,
        },
        req.userId
      )

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('Add remediation plan error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * Update remediation plan
   */
  public updateRemediationPlan = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
        return
      }

      const { id } = req.params

      // Create DTO from request with optional fields
      const updateDto: any = {}

      if (req.body.description !== undefined) {
        updateDto.description = req.body.description
      }

      if (req.body.dueDate !== undefined) {
        updateDto.dueDate = new Date(req.body.dueDate)
      }

      if (req.body.assignee !== undefined) {
        updateDto.assignee = req.body.assignee
      }

      if (req.body.status !== undefined) {
        updateDto.status = req.body.status
      }

      const result = await this.updateRemediationPlanUseCase.execute(id, updateDto, req.userId)

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result.getValue(),
      })
    } catch (error) {
      console.error('Update remediation plan error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }
}
