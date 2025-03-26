import { Request, Response } from 'express';
import { CreateFrameworkUseCase } from '../../application/compliance/create_framework';
import { GetFrameworkUseCase } from '../../application/compliance/get_framework';
import { ListFrameworksUseCase } from '../../application/compliance/list_frameworks';

/**
 * Controller for framework-related endpoints
 */
export class FrameworkController {
  constructor(
    private createFrameworkUseCase: CreateFrameworkUseCase,
    private getFrameworkUseCase: GetFrameworkUseCase,
    private listFrameworksUseCase: ListFrameworksUseCase
  ) {}

  /**
   * Create a new framework
   */
  public createFramework = async (req: Request, res: Response): Promise<void> => {
    try {
      // Ensure userId is available from auth middleware
      if (!req.userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const result = await this.createFrameworkUseCase.execute(req.body, req.userId);

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
      console.error('Create framework error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get a framework by ID
   */
  public getFramework = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const includeStats = req.query.includeStats === 'true';

      const result = await this.getFrameworkUseCase.execute(id, includeStats);

      if (!result.isSuccess) {
        res.status(400).json({
          success: false,
          message: result.getError().message
        });
        return;
      }

      const framework = result.getValue();

      if (!framework) {
        res.status(404).json({
          success: false,
          message: `Framework with ID ${id} not found`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: framework
      });
    } catch (error) {
      console.error('Get framework error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * List all frameworks with optional filters
   */
  public listFrameworks = async (req: Request, res: Response): Promise<void> => {
    try {
      const active = req.query.active === 'true' ? true :
                     req.query.active === 'false' ? false : undefined;

      const category = req.query.category as string | undefined;
      const organization = req.query.organization as string | undefined;

      const result = await this.listFrameworksUseCase.execute({
        active,
        category,
        organization
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
      console.error('List frameworks error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}
