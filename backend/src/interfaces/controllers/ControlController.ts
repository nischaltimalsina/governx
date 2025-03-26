import { Request, Response } from 'express';
import { CreateControlUseCase } from '../../application/usecases/CreateControlUseCase';
import { UniqueEntityID } from '../../domain/common/Entity';
import { ComplianceService } from '../../domain/services/complianceService';
import { ControlStatus } from '../../domain/models/compliance';
import { validationResult } from 'express-validator';

export class ControlController {
  constructor(
    private createControlUseCase: CreateControlUseCase,
    private complianceService: ComplianceService
  ) {}

  async createControl(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      // Extract request data
      const { frameworkId, code, title, description, implementationGuidance, status, ownerId } = req.body;

      // Execute use case
      const result = await this.createControlUseCase.execute({
        frameworkId,
        code,
        title,
        description,
        implementationGuidance,
        status,
        ownerId
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
      console.error('Error creating control:', error);
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred'
      });
    }
  }

  async getControlById(req: Request, res: Response): Promise<void> {
    try {
      const controlId = new UniqueEntityID(req.params.id);
      const result = await this.complianceService.getControlById(controlId);

      if (result.isFailure) {
        res.status(404).json({
          success: false,
          message: result.error
        });
        return;
      }

      const control = result.getValue();
      res.status(200).json({
        success: true,
        data: {
          id: control.controlId.toString(),
          frameworkId: control.frameworkId.toString(),
          code: control.code.getValue(),
          title: control.title,
          description: control.description,
          implementationGuidance: control.implementationGuidance,
          status: control.status,
          ownerId: control.ownerId?.toString(),
          createdAt: control.createdAt,
          updatedAt: control.updatedAt
        }
      });
    } catch (error) {
      console.error('Error retrieving control:', error);
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred'
      });
    }
  }

  async getControlsByFramework(req: Request, res: Response): Promise<void> {
    try {
      const frameworkId = new UniqueEntityID(req.params.frameworkId);
      const result = await this.complianceService.getControlsByFramework(frameworkId);

      if (result.isFailure) {
        res.status(404).json({
          success: false,
          message: result.error
        });
        return;
      }

      const controls = result.getValue();
      res.status(200).json({
        success: true,
        data: controls.map(control => ({
          id: control.controlId.toString(),
          frameworkId: control.frameworkId.toString(),
          code: control.code.getValue(),
          title: control.title,
          description: control.description,
          implementationGuidance: control.implementationGuidance,
          status: control.status,
          ownerId: control.ownerId?.toString(),
          createdAt: control.createdAt,
          updatedAt: control.updatedAt
        }))
      });
    } catch (error) {
      console.error('Error retrieving controls:', error);
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred'
      });
    }
  }

  async updateControlStatus(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const controlId = new UniqueEntityID(req.params.id);
      const { status } = req.body;

      // Execute service method
      const result = await this.complianceService.updateControlStatus(
        controlId,
        status as ControlStatus
      );

      if (result.isFailure) {
        res.status(400).json({
          success: false,
          message: result.error
        });
        return;
      }

      // Get the updated control
      const controlResult = await this.complianceService.getControlById(controlId);
      if (controlResult.isFailure) {
        res.status(404).json({
          success: false,
          message: controlResult.error
        });
        return;
      }

      const control = controlResult.getValue();
      res.status(200).json({
        success: true,
        data: {
          id: control.controlId.toString(),
          status: control.status,
          updatedAt: control.updatedAt
        }
      });
    } catch (error) {
      console.error('Error updating control status:', error);
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred'
      });
    }
  }

  async assignControlOwner(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const controlId = new UniqueEntityID(req.params.id);
      const ownerId = new UniqueEntityID(req.body.ownerId);

      // Get the control
      const controlResult = await this.complianceService.getControlById(controlId);
      if (controlResult.isFailure) {
        res.status(404).json({
          success: false,
          message: controlResult.error
        });
        return;
      }

      const control = controlResult.getValue();

      // Update owner
      control.assignOwner(ownerId);

      // Save the updated control
      const updateResult = await this.complianceService.updateControl(control);
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
          id: control.controlId.toString(),
          ownerId: control.ownerId?.toString(),
          updatedAt: control.updatedAt
        }
      });
    } catch (error) {
      console.error('Error assigning control owner:', error);
      res.status(500).json({
        success: false,
        message: 'An unexpected error occurred'
      });
    }
  }
}
