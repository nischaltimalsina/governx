import { Request, Response } from 'express'
import { CreateAuditTemplateUseCase } from '../../application/audit/create_audit_template'
import { GetAuditTemplateUseCase } from '../../application/audit/get_audit_template'
import { ListAuditTemplatesUseCase } from '../../application/audit/list_audit_templates'
import { AuditType } from '../../domain/audit/audit_values'

/**
 * Controller for audit template-related endpoints
 */
export class AuditTemplateController {
  constructor(
    private createAuditTemplateUseCase: CreateAuditTemplateUseCase,
    private getAuditTemplateUseCase: GetAuditTemplateUseCase,
    private listAuditTemplatesUseCase: ListAuditTemplatesUseCase
  ) {}

  /**
   * Create a new audit template
   */
  public createAuditTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        })
        return
      }

      // Create DTO from request
      const createAuditTemplateDto = {
        name: req.body.name,
        description: req.body.description,
        type: req.body.type,
        frameworkIds: req.body.frameworkIds,
        controlIds: req.body.controlIds,
        checklistItems: req.body.checklistItems,
      }

      const result = await this.createAuditTemplateUseCase.execute(
        createAuditTemplateDto,
        req.userId
      )

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
      console.error('Create audit template error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * Get an audit template by ID
   */
  public getAuditTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params

      const result = await this.getAuditTemplateUseCase.execute(id)

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message,
        })
        return
      }

      const template = result.getValue()

      if (!template) {
        res.status(404).json({
          success: false,
          message: `Audit template with ID ${id} not found`,
        })
        return
      }

      res.status(200).json({
        success: true,
        data: template,
      })
    } catch (error) {
      console.error('Get audit template error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }

  /**
   * List audit templates with filters
   */
  public listAuditTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      // Parse filter parameters
      const frameworkId = req.query.frameworkId as string | undefined
      const active =
        req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined
      const pageNumber = req.query.pageNumber ? parseInt(req.query.pageNumber as string) : undefined

      // Parse type array
      let type: AuditType[] | undefined
      const typeParam = req.query.type
      if (typeParam) {
        if (Array.isArray(typeParam)) {
          type = typeParam as AuditType[]
        } else {
          type = [typeParam as AuditType]
        }
      }

      const result = await this.listAuditTemplatesUseCase.execute({
        type,
        frameworkId,
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
      console.error('List audit templates error:', error)
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      })
    }
  }
}
