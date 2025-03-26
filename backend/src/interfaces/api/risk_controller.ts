import { Request, Response } from 'express';
import { CreateRiskUseCase } from '../../application/risk/create_risk';
import { GetRiskUseCase } from '../../application/risk/get_risk';
import { ListRisksUseCase } from '../../application/risk/list_risks';
import { CreateRiskTreatmentUseCase } from '../../application/risk/create_treatment';
import {
  RiskCategory,
  RiskStatus,
  RiskSeverity,
} from '../../domain/risk/risk_values';

/**
 * Controller for risk-related endpoints
 */
export class RiskController {
  constructor(
    private createRiskUseCase: CreateRiskUseCase,
    private getRiskUseCase: GetRiskUseCase,
    private listRisksUseCase: ListRisksUseCase,
    private createRiskTreatmentUseCase: CreateRiskTreatmentUseCase
  ) {}

  /**
   * Create a new risk
   */
  public createRisk = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Parse owner data if provided
      let owner;
      if (req.body.owner) {
        owner = {
          id: req.body.owner.id,
          name: req.body.owner.name,
          department: req.body.owner.department
        };
      }

      // Parse tags if provided as string
      let tags;
      if (typeof req.body.tags === 'string') {
        tags = JSON.parse(req.body.tags);
      } else {
        tags = req.body.tags;
      }

      // Parse related IDs if provided as string
      let relatedControlIds;
      if (typeof req.body.relatedControlIds === 'string') {
        relatedControlIds = JSON.parse(req.body.relatedControlIds);
      } else {
        relatedControlIds = req.body.relatedControlIds;
      }

      let relatedAssets;
      if (typeof req.body.relatedAssets === 'string') {
        relatedAssets = JSON.parse(req.body.relatedAssets);
      } else {
        relatedAssets = req.body.relatedAssets;
      }

      // Create DTO from request
      const createRiskDto = {
        name: req.body.name,
        description: req.body.description,
        category: req.body.category,
        inherentImpact: req.body.inherentImpact,
        inherentLikelihood: req.body.inherentLikelihood,
        residualImpact: req.body.residualImpact,
        residualLikelihood: req.body.residualLikelihood,
        owner,
        relatedControlIds,
        relatedAssets,
        reviewPeriodMonths: req.body.reviewPeriodMonths ? parseInt(req.body.reviewPeriodMonths) : undefined,
        tags
      };

      const result = await this.createRiskUseCase.execute(createRiskDto, req.userId);

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: result.getValue()
      });
    } catch (error) {
      console.error('Create risk error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get a risk by ID
   */
  public getRisk = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const includeControls = req.query.includeControls === 'true';
      const includeTreatments = req.query.includeTreatments === 'true';

      const result = await this.getRiskUseCase.execute(id, {
        includeControls,
        includeTreatments
      });

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message
        });
        return;
      }

      const risk = result.getValue();

      if (!risk) {
        res.status(404).json({
          success: false,
          message: `Risk with ID ${id} not found`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: risk
      });
    } catch (error) {
      console.error('Get risk error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * List risks with filters
   */
  public listRisks = async (req: Request, res: Response): Promise<void> => {
    try {
      // Parse filter parameters
      const ownerId = req.query.ownerId as string | undefined;
      const controlId = req.query.controlId as string | undefined;
      const assetId = req.query.assetId as string | undefined;
      const search = req.query.search as string | undefined;

      const reviewDue = req.query.reviewDue === 'true';
      const active = req.query.active === 'true' ? true :
                     req.query.active === 'false' ? false : undefined;

      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined;
      const pageNumber = req.query.pageNumber ? parseInt(req.query.pageNumber as string) : undefined;

      // Parse categories array
      let categories: RiskCategory[] | undefined;
      const categoriesParam = req.query.categories;
      if (categoriesParam) {
        if (Array.isArray(categoriesParam)) {
          categories = categoriesParam as RiskCategory[];
        } else {
          categories = [categoriesParam as RiskCategory];
        }
      }

      // Parse statuses array
      let statuses: RiskStatus[] | undefined;
      const statusesParam = req.query.statuses;
      if (statusesParam) {
        if (Array.isArray(statusesParam)) {
          statuses = statusesParam as RiskStatus[];
        } else {
          statuses = [statusesParam as RiskStatus];
        }
      }

      // Parse severities array
      let severities: RiskSeverity[] | undefined;
      const severitiesParam = req.query.severities;
      if (severitiesParam) {
        if (Array.isArray(severitiesParam)) {
          severities = severitiesParam as RiskSeverity[];
        } else {
          severities = [severitiesParam as RiskSeverity];
        }
      }

      // Parse tags array
      let tags: string[] | undefined;
      const tagsParam = req.query.tags;
      if (tagsParam) {
        if (Array.isArray(tagsParam)) {
          tags = tagsParam as string[];
        } else {
          tags = [tagsParam as string];
        }
      }

      const result = await this.listRisksUseCase.execute({
        categories,
        statuses,
        severities,
        ownerId,
        controlId,
        assetId,
        tags,
        reviewDue,
        active,
        search,
        pageSize,
        pageNumber
      });

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.getValue()
      });
    } catch (error) {
      console.error('List risks error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Create a new risk treatment
   */
  public createRiskTreatment = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Parse related control IDs if provided as string
      let relatedControlIds;
      if (typeof req.body.relatedControlIds === 'string') {
        relatedControlIds = JSON.parse(req.body.relatedControlIds);
      } else {
        relatedControlIds = req.body.relatedControlIds;
      }

      // Parse dates if provided
      const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : undefined;

      // Create DTO from request
      const createTreatmentDto = {
        riskId: req.body.riskId,
        name: req.body.name,
        description: req.body.description,
        type: req.body.type,
        status: req.body.status,
        dueDate,
        assignee: req.body.assignee,
        cost: req.body.cost ? parseFloat(req.body.cost) : undefined,
        relatedControlIds
      };

      const result = await this.createRiskTreatmentUseCase.execute(createTreatmentDto, req.userId);

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: result.getValue()
      });
    } catch (error) {
      console.error('Create risk treatment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}
