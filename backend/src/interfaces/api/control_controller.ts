import { Request, Response } from 'express';
import { CreateControlUseCase } from '../../application/compliance/create_control';
import { GetControlUseCase } from '../../application/compliance/get_control';
import { ListControlsUseCase } from '../../application/compliance/list_controls';
import { UpdateControlImplementationUseCase } from '../../application/compliance/update_control_implementation';
import { ImplementationStatus } from '../../domain/compliance/framework_values';

/**
 * Controller for control-related endpoints
 */
export class ControlController {
  constructor(
    private createControlUseCase: CreateControlUseCase,
    private getControlUseCase: GetControlUseCase,
    private listControlsUseCase: ListControlsUseCase,
    private updateControlImplementationUseCase: UpdateControlImplementationUseCase
  ) {}

  /**
   * Create a new control
   */
  public createControl = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.createControlUseCase.execute(req.body, req.userId);

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
      console.error('Create control error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get a control by ID
   */
  public getControl = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const includeRelated = req.query.includeRelated === 'true';

      const result = await this.getControlUseCase.execute(id, includeRelated);

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message
        });
        return;
      }

      const control = result.getValue();

      if (!control) {
        res.status(404).json({
          success: false,
          message: `Control with ID ${id} not found`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: control
      });
    } catch (error) {
      console.error('Get control error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * List controls with optional filters
   */
  public listControls = async (req: Request, res: Response): Promise<void> => {
    try {
      const frameworkId = req.query.frameworkId as string | undefined;
      const isActive = req.query.isActive === 'true' ? true :
                       req.query.isActive === 'false' ? false : undefined;
      const ownerId = req.query.ownerId as string | undefined;
      const search = req.query.search as string | undefined;

      // Parse implementation status array
      let implementationStatus: ImplementationStatus[] | undefined;
      const statusParam = req.query.implementationStatus;
      if (statusParam) {
        if (Array.isArray(statusParam)) {
          implementationStatus = statusParam as ImplementationStatus[];
        } else {
          implementationStatus = [statusParam as ImplementationStatus];
        }
      }

      // Parse categories array
      let categories: string[] | undefined;
      const categoriesParam = req.query.categories;
      if (categoriesParam) {
        if (Array.isArray(categoriesParam)) {
          categories = categoriesParam as string[];
        } else {
          categories = [categoriesParam as string];
        }
      }

      const result = await this.listControlsUseCase.execute({
        frameworkId,
        implementationStatus,
        categories,
        ownerId,
        isActive,
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
      console.error('List controls error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Update control implementation status
   */
  public updateControlImplementation = async (req: Request, res: Response): Promise<void> => {
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
      const result = await this.updateControlImplementationUseCase.execute(
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
      console.error('Update control implementation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}
