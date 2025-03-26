import { Request, Response } from 'express';
import { CreateEvidenceUseCase } from '../../application/compliance/create_evidence';
import { GetEvidenceUseCase } from '../../application/compliance/get_evidence';
import { ListEvidenceUseCase } from '../../application/compliance/list_evidence';
import { ReviewEvidenceUseCase } from '../../application/compliance/review_evidence';
import { LinkEvidenceToControlUseCase } from '../../application/compliance/link_evidence_to_control';
import { EvidenceStatus, EvidenceType } from '../../domain/compliance/evidence_values';

/**
 * Controller for evidence-related endpoints
 */
export class EvidenceController {
  constructor(
    private createEvidenceUseCase: CreateEvidenceUseCase,
    private getEvidenceUseCase: GetEvidenceUseCase,
    private listEvidenceUseCase: ListEvidenceUseCase,
    private reviewEvidenceUseCase: ReviewEvidenceUseCase,
    private linkEvidenceToControlUseCase: LinkEvidenceToControlUseCase
  ) {}

  /**
   * Create new evidence
   */
  public createEvidence = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Handle file upload
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'File is required'
        });
        return;
      }

      // Create DTO from request
      const createEvidenceDto = {
        title: req.body.title,
        controlIds: Array.isArray(req.body.controlIds)
          ? req.body.controlIds
          : [req.body.controlIds],
        file: {
          filename: req.file.originalname,
          path: req.file.path,
          size: req.file.size,
          mimeType: req.file.mimetype,
          hash: req.body.fileHash // If provided by client
        },
        type: req.body.type,
        description: req.body.description,
        collectionMethod: req.body.collectionMethod,
        validityStartDate: req.body.validityStartDate ? new Date(req.body.validityStartDate) : undefined,
        validityEndDate: req.body.validityEndDate ? new Date(req.body.validityEndDate) : undefined,
        tags: req.body.tags ? JSON.parse(req.body.tags) : undefined,
        metadata: req.body.metadata ? JSON.parse(req.body.metadata) : undefined
      };

      const result = await this.createEvidenceUseCase.execute(createEvidenceDto, req.userId);

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
      console.error('Create evidence error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get evidence by ID
   */
  public getEvidence = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const includeControls = req.query.includeControls === 'true';

      const result = await this.getEvidenceUseCase.execute(id, includeControls);

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message
        });
        return;
      }

      const evidence = result.getValue();

      if (!evidence) {
        res.status(404).json({
          success: false,
          message: `Evidence with ID ${id} not found`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: evidence
      });
    } catch (error) {
      console.error('Get evidence error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * List evidence with filters
   */
  public listEvidence = async (req: Request, res: Response): Promise<void> => {
    try {
      // Parse filter parameters
      const controlId = req.query.controlId as string | undefined;
      const frameworkId = req.query.frameworkId as string | undefined;
      const createdBy = req.query.createdBy as string | undefined;
      const reviewerId = req.query.reviewerId as string | undefined;
      const search = req.query.search as string | undefined;

      const active = req.query.active === 'true' ? true :
                    req.query.active === 'false' ? false : undefined;

      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined;
      const pageNumber = req.query.pageNumber ? parseInt(req.query.pageNumber as string) : undefined;

      // Parse start and end dates if provided
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      // Parse status array
      let status: EvidenceStatus[] | undefined;
      const statusParam = req.query.status;
      if (statusParam) {
        if (Array.isArray(statusParam)) {
          status = statusParam as EvidenceStatus[];
        } else {
          status = [statusParam as EvidenceStatus];
        }
      }

      // Parse type array
      let type: EvidenceType[] | undefined;
      const typeParam = req.query.type;
      if (typeParam) {
        if (Array.isArray(typeParam)) {
          type = typeParam as EvidenceType[];
        } else {
          type = [typeParam as EvidenceType];
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

      const result = await this.listEvidenceUseCase.execute({
        controlId,
        frameworkId,
        status,
        type,
        tags,
        createdBy,
        reviewerId,
        startDate,
        endDate,
        active,
        pageSize,
        pageNumber,
        search
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
      console.error('List evidence error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Review evidence
   */
  public reviewEvidence = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;
      const result = await this.reviewEvidenceUseCase.execute(
        id,
        req.body,
        req.userId
      );

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
      console.error('Review evidence error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Link evidence to control
   */
  public linkEvidenceToControl = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;
      const result = await this.linkEvidenceToControlUseCase.execute(
        id,
        req.body,
        req.userId
      );

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
      console.error('Link evidence to control error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}
