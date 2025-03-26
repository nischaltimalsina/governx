import { Request, Response } from 'express';
import { CreatePolicyUseCase } from '../../application/compliance/create_policy';
import { GetPolicyUseCase } from '../../application/compliance/get_policy';
import { ListPoliciesUseCase } from '../../application/compliance/list_policies';
import { ApprovePolicyUseCase } from '../../application/compliance/approve_policy';
import { PublishPolicyUseCase } from '../../application/compliance/publish_policy';
import { PolicyType, PolicyStatus } from '../../domain/compliance/policy_values';

/**
 * Controller for policy-related endpoints
 */
export class PolicyController {
  constructor(
    private createPolicyUseCase: CreatePolicyUseCase,
    private getPolicyUseCase: GetPolicyUseCase,
    private listPoliciesUseCase: ListPoliciesUseCase,
    private approvePolicyUseCase: ApprovePolicyUseCase,
    private publishPolicyUseCase: PublishPolicyUseCase
  ) {}

  /**
   * Create a new policy
   */
  public createPolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Parse document data if provided
      let document;
      if (req.body.documentUrl || req.body.documentPath || req.body.documentFormat) {
        document = {
          url: req.body.documentUrl,
          path: req.body.documentPath,
          format: req.body.documentFormat
        };
      }

      // Parse tags if provided as string
      let tags;
      if (typeof req.body.tags === 'string') {
        tags = JSON.parse(req.body.tags);
      } else {
        tags = req.body.tags;
      }

      // Parse control IDs if provided as string
      let relatedControlIds;
      if (typeof req.body.relatedControlIds === 'string') {
        relatedControlIds = JSON.parse(req.body.relatedControlIds);
      } else {
        relatedControlIds = req.body.relatedControlIds;
      }

      // Create DTO from request
      const createPolicyDto = {
        name: req.body.name,
        type: req.body.type,
        description: req.body.description,
        content: req.body.content,
        document,
        owner: req.body.owner || req.userId, // Default to current user if not specified
        relatedControlIds,
        effectiveStartDate: req.body.effectiveStartDate ? new Date(req.body.effectiveStartDate) : undefined,
        effectiveEndDate: req.body.effectiveEndDate ? new Date(req.body.effectiveEndDate) : undefined,
        reviewDate: req.body.reviewDate ? new Date(req.body.reviewDate) : undefined,
        tags
      };

      const result = await this.createPolicyUseCase.execute(createPolicyDto, req.userId);

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
      console.error('Create policy error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get a policy by ID
   */
  public getPolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const includeControls = req.query.includeControls === 'true';

      const result = await this.getPolicyUseCase.execute(id, includeControls);

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message
        });
        return;
      }

      const policy = result.getValue();

      if (!policy) {
        res.status(404).json({
          success: false,
          message: `Policy with ID ${id} not found`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: policy
      });
    } catch (error) {
      console.error('Get policy error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * List policies with filters
   */
  public listPolicies = async (req: Request, res: Response): Promise<void> => {
    try {
      // Parse filter parameters
      const owner = req.query.owner as string | undefined;
      const controlId = req.query.controlId as string | undefined;
      const search = req.query.search as string | undefined;

      const effectiveOnly = req.query.effectiveOnly === 'true';
      const reviewDue = req.query.reviewDue === 'true';
      const active = req.query.active === 'true' ? true :
                     req.query.active === 'false' ? false : undefined;

      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined;
      const pageNumber = req.query.pageNumber ? parseInt(req.query.pageNumber as string) : undefined;

      // Parse type array
      let type: PolicyType[] | undefined;
      const typeParam = req.query.type;
      if (typeParam) {
        if (Array.isArray(typeParam)) {
          type = typeParam as PolicyType[];
        } else {
          type = [typeParam as PolicyType];
        }
      }

      // Parse status array
      let status: PolicyStatus[] | undefined;
      const statusParam = req.query.status;
      if (statusParam) {
        if (Array.isArray(statusParam)) {
          status = statusParam as PolicyStatus[];
        } else {
          status = [statusParam as PolicyStatus];
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

      const result = await this.listPoliciesUseCase.execute({
        type,
        status,
        owner,
        controlId,
        tags,
        effectiveOnly,
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
      console.error('List policies error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Approve a policy
   */
  public approvePolicy = async (req: Request, res: Response): Promise<void> => {
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
      const result = await this.approvePolicyUseCase.execute(
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
      console.error('Approve policy error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Publish a policy
   */
  public publishPolicy = async (req: Request, res: Response): Promise<void> => {
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

      // Parse dates from request
      const effectiveStartDate = new Date(req.body.effectiveStartDate);
      const effectiveEndDate = req.body.effectiveEndDate ? new Date(req.body.effectiveEndDate) : undefined;
      const reviewDate = req.body.reviewDate ? new Date(req.body.reviewDate) : undefined;

      const result = await this.publishPolicyUseCase.execute(
        id,
        {
          effectiveStartDate,
          effectiveEndDate,
          reviewDate
        },
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
      console.error('Publish policy error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}
