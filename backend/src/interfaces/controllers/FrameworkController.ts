import { Request, Response } from 'express';
import { CreateFrameworkUseCase } from '../../application/usecases/CreateFrameworkUseCase';
import { UniqueEntityID } from '../../domain/common/Entity';
import { ComplianceService } from '../../domain/services/complianceService';
import { validationResult } from 'express-validator';

export class FrameworkController {
  constructor(
    private createFrameworkUseCase: CreateFrameworkUseCase,
    private complianceService: ComplianceService
  ) {}

  async createFramework(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      // Extract request data
      const { name, version, description } = req.body;

      // Execute use case
      const result = await this.createFrameworkUseCase.execute({
        name,
        version,
        description
      });

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          message: result.error
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: result.getValue()
      });
    } catch (error) {
      console.error('Error creating framework:', error);
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred'
      });
    }
  }

  async getFrameworkById(req: Request, res: Response): Promise<void> {
    try {
      const frameworkId = new UniqueEntityID(req.params.id);
      const result = await this.complianceService.getFrameworkById(frameworkId);

      if (result.isFailure) {
        res.status(404).json({
          success: false,
          message: result.error
        });
        return;
      }

      const framework = result.getValue();
      res.status(200).json({
        success: true,
        data: {
          id: framework.frameworkId.toString(),
          name: framework.name.getValue(),
          version: framework.version.getValue(),
          description: framework.description,
          isActive: framework.isActive,
          createdAt: framework.createdAt,
          updatedAt: framework.updatedAt
        }
      });
    } catch (error) {
      console.error('Error retrieving framework:', error);
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred'
      });
    }
  }

  async getAllFrameworks(req: Request, res: Response): Promise<void> {
    try {
      // Extract query parameters
      const isActive = req.query.isActive === 'true' ? true :
                      req.query.isActive === 'false' ? false :
                      undefined;

      const result = await this.complianceService.getAllFrameworks({ isActive });

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          message: result.error
        });
        return;
      }

      const frameworks = result.getValue();
      res.status(200).json({
        success: true,
        data: frameworks.map(framework => ({
          id: framework.frameworkId.toString(),
          name: framework.name.getValue(),
          version: framework.version.getValue(),
          description: framework.description,
          isActive: framework.isActive,
          createdAt: framework.createdAt,
          updatedAt: framework.updatedAt
        }))
      });
    } catch (error) {
      console.error('Error retrieving frameworks:', error);
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred'
      });
    }
  }

  async updateFramework(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const frameworkId = new UniqueEntityID(req.params.id);
      const { description, isActive } = req.body;

      // Get the existing framework
      const frameworkResult = await this.complianceService.getFrameworkById(frameworkId);
      if (frameworkResult.isFailure) {
        res.status(404).json({
          success: false,
          message: frameworkResult.error
        });
        return;
      }

      const framework = frameworkResult.getValue();

      // Update the framework
      if (description !== undefined) {
        const updateResult = framework.updateDescription(description);
        if (updateResult.isFailure) {
          res.status(400).json({
            success: false,
            message: updateResult.error
          });
          return;
        }
      }

      if (isActive !== undefined) {
        if (isActive) {
          framework.activate();
        } else {
          framework.deactivate();
        }
      }

      // Save the updated framework
      const updateResult = await this.complianceService.updateFramework(framework);
      if (updateResult.isFailure) {
        res.status(400).json({
          success: false,
          message: updateResult.error
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: framework.frameworkId.toString(),
          name: framework.name.getValue(),
          version: framework.version.getValue(),
          description: framework.description,
          isActive: framework.isActive,
          updatedAt: framework.updatedAt
        }
      });
    } catch (error) {
      console.error('Error updating framework:', error);
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred'
      });
    }
  }

  async deleteFramework(req: Request, res: Response): Promise<void> {
    try {
      const frameworkId = new UniqueEntityID(req.params.id);

      // Check if framework exists
      const frameworkResult = await this.complianceService.getFrameworkById(frameworkId);
      if (frameworkResult.isFailure) {
        res.status(404).json({
          success: false,
          message: frameworkResult.error
        });
        return;
      }

      // Delete the framework
      const deleteResult = await this.frameworkRepository.delete(frameworkId);
      if (!deleteResult) {
        res.status(400).json({
          success: false,
          message: 'Failed to delete framework'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Framework deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting framework:', error);
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred'
      });
    }
  }
}
