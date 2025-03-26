import { v4 as uuidv4 } from 'uuid';
import { Result } from '../common/result';
import { Framework } from './framework';
import { Control } from './control';
import {
  FrameworkName,
  FrameworkVersion,
  ControlCode,
  ControlTitle,
  ImplementationStatus
} from './values';
import { IFrameworkRepository, IControlRepository } from './repositories';

/**
 * Compliance management service
 * Handles domain operations related to compliance frameworks and controls
 */
export class ComplianceService {
  constructor(
    private frameworkRepository: IFrameworkRepository,
    private controlRepository: IControlRepository
  ) {}

  /**
   * Create a new compliance framework
   */
  public async createFramework(
    name: FrameworkName,
    version: FrameworkVersion,
    description: string,
    userId: string,
    options?: {
      organization?: string;
      category?: string;
      website?: string;
      isActive?: boolean;
    }
  ): Promise<Result<Framework, Error>> {
    // Check if framework with this name and version already exists
    const existsResult = await this.frameworkRepository.exists(name, version);

    if (!existsResult.isSuccess) {
      return Result.fail<Framework>(existsResult.getError());
    }

    if (existsResult.getValue()) {
      return Result.fail<Framework>(
        new Error(`Framework '${name.getValue()} ${version.getValue()}' already exists`)
      );
    }

    // Create framework entity
    const frameworkId = uuidv4();
    const frameworkResult = Framework.create(frameworkId, {
      name,
      version,
      description,
      organization: options?.organization,
      category: options?.category,
      website: options?.website,
      isActive: options?.isActive,
      createdBy: userId
    });

    if (!frameworkResult.isSuccess) {
      return Result.fail<Framework>(frameworkResult.getError());
    }

    const framework = frameworkResult.getValue();

    // Save framework to repository
    const saveResult = await this.frameworkRepository.save(framework);

    if (!saveResult.isSuccess) {
      return Result.fail<Framework>(saveResult.getError());
    }

    return Result.ok<Framework>(framework);
  }

  /**
   * Add a control to a framework
   */
  public async addControl(
    frameworkId: string,
    code: ControlCode,
    title: ControlTitle,
    description: string,
    userId: string,
    options?: {
      guidance?: string;
      implementationStatus?: ImplementationStatus;
      implementationDetails?: string;
      ownerId?: string;
      categories?: string[];
      parentControlId?: string;
      isActive?: boolean;
    }
  ): Promise<Result<Control, Error>> {
    // Check if framework exists
    const frameworkResult = await this.frameworkRepository.findById(frameworkId);

    if (!frameworkResult.isSuccess) {
      return Result.fail<Control>(frameworkResult.getError());
    }

    const framework = frameworkResult.getValue();

    if (!framework) {
      return Result.fail<Control>(new Error(`Framework with ID ${frameworkId} not found`));
    }

    // Check if control with this code already exists in the framework
    const existsResult = await this.controlRepository.exists(frameworkId, code);

    if (!existsResult.isSuccess) {
      return Result.fail<Control>(existsResult.getError());
    }

    if (existsResult.getValue()) {
      return Result.fail<Control>(
        new Error(`Control with code '${code.getValue()}' already exists in this framework`)
      );
    }

    // If parent control ID is specified, check if it exists
    if (options?.parentControlId) {
      const parentControlResult = await this.controlRepository.findById(options.parentControlId);

      if (!parentControlResult.isSuccess) {
        return Result.fail<Control>(parentControlResult.getError());
      }

      const parentControl = parentControlResult.getValue();

      if (!parentControl) {
        return Result.fail<Control>(
          new Error(`Parent control with ID ${options.parentControlId} not found`)
        );
      }

      // Check if parent control belongs to the same framework
      if (parentControl.frameworkId !== frameworkId) {
        return Result.fail<Control>(
          new Error('Parent control must belong to the same framework')
        );
      }
    }

    // Create control entity
    const controlId = uuidv4();
    const controlResult = Control.create(controlId, {
      frameworkId,
      code,
      title,
      description,
      guidance: options?.guidance,
      implementationStatus: options?.implementationStatus,
      implementationDetails: options?.implementationDetails,
      ownerId: options?.ownerId,
      categories: options?.categories,
      parentControlId: options?.parentControlId,
      isActive: options?.isActive,
      createdBy: userId
    });

    if (!controlResult.isSuccess) {
      return Result.fail<Control>(controlResult.getError());
    }

    const control = controlResult.getValue();

    // Save control to repository
    const saveResult = await this.controlRepository.save(control);

    if (!saveResult.isSuccess) {
      return Result.fail<Control>(saveResult.getError());
    }

    return Result.ok<Control>(control);
  }

  /**
   * Update a control's implementation status
   */
  public async updateControlImplementation(
    controlId: string,
    implementationStatus: ImplementationStatus,
    userId: string,
    implementationDetails?: string
  ): Promise<Result<Control, Error>> {
    // Find control
    const controlResult = await this.controlRepository.findById(controlId);

    if (!controlResult.isSuccess) {
      return Result.fail<Control>(controlResult.getError());
    }

    const control = controlResult.getValue();

    if (!control) {
      return Result.fail<Control>(new Error(`Control with ID ${controlId} not found`));
    }

    // Update implementation status
    const updateResult = control.updateImplementationStatus(
      implementationStatus,
      implementationDetails,
      userId
    );

    if (!updateResult.isSuccess) {
      return Result.fail<Control>(updateResult.getError());
    }

    // Save updated control
    const saveResult = await this.controlRepository.save(control);

    if (!saveResult.isSuccess) {
      return Result.fail<Control>(saveResult.getError());
    }

    return Result.ok<Control>(control);
  }

  /**
   * Get compliance status metrics for a framework
   */
  public async getFrameworkComplianceStatus(
    frameworkId: string
  ): Promise<Result<{
    totalControls: number;
    implementedControls: number;
    partiallyImplementedControls: number;
    notImplementedControls: number;
    notApplicableControls: number;
    implementationRate: number;
  }, Error>> {
    // Check if framework exists
    const frameworkResult = await this.frameworkRepository.findById(frameworkId);

    if (!frameworkResult.isSuccess) {
      return Result.fail(frameworkResult.getError());
    }

    const framework = frameworkResult.getValue();

    if (!framework) {
      return Result.fail(new Error(`Framework with ID ${frameworkId} not found`));
    }

    // Count controls by implementation status
    const totalResult = await this.controlRepository.countByFrameworkId(frameworkId, {
      active: true
    });

    if (!totalResult.isSuccess) {
      return Result.fail(totalResult.getError());
    }

    const implementedResult = await this.controlRepository.countByFrameworkId(frameworkId, {
      implementationStatus: [ImplementationStatus.IMPLEMENTED],
      active: true
    });

    if (!implementedResult.isSuccess) {
      return Result.fail(implementedResult.getError());
    }

    const partiallyImplementedResult = await this.controlRepository.countByFrameworkId(frameworkId, {
      implementationStatus: [ImplementationStatus.PARTIALLY_IMPLEMENTED],
      active: true
    });

    if (!partiallyImplementedResult.isSuccess) {
      return Result.fail(partiallyImplementedResult.getError());
    }

    const notImplementedResult = await this.controlRepository.countByFrameworkId(frameworkId, {
      implementationStatus: [ImplementationStatus.NOT_IMPLEMENTED],
      active: true
    });

    if (!notImplementedResult.isSuccess) {
      return Result.fail(notImplementedResult.getError());
    }

    const notApplicableResult = await this.controlRepository.countByFrameworkId(frameworkId, {
      implementationStatus: [ImplementationStatus.NOT_APPLICABLE],
      active: true
    });

    if (!notApplicableResult.isSuccess) {
      return Result.fail(notApplicableResult.getError());
    }

    const totalControls = totalResult.getValue();
    const implementedControls = implementedResult.getValue();
    const partiallyImplementedControls = partiallyImplementedResult.getValue();
    const notImplementedControls = notImplementedResult.getValue();
    const notApplicableControls = notApplicableResult.getValue();

    // Calculate implementation rate (excluding N/A controls)
    const applicableControls = totalControls - notApplicableControls;
    const implementationRate = applicableControls > 0
      ? (implementedControls + (partiallyImplementedControls * 0.5)) / applicableControls * 100
      : 0;

    return Result.ok({
      totalControls,
      implementedControls,
      partiallyImplementedControls,
      notImplementedControls,
      notApplicableControls,
      implementationRate
    });
  }

  /**
   * Assign an owner to a control
   */
  public async assignControlOwner(
    controlId: string,
    ownerId: string,
    userId: string
  ): Promise<Result<Control, Error>> {
    // Find control
    const controlResult = await this.controlRepository.findById(controlId);

    if (!controlResult.isSuccess) {
      return Result.fail<Control>(controlResult.getError());
    }

    const control = controlResult.getValue();

    if (!control) {
      return Result.fail<Control>(new Error(`Control with ID ${controlId} not found`));
    }

    // Assign owner
    const assignResult = control.assignOwner(ownerId, userId);

    if (!assignResult.isSuccess) {
      return Result.fail<Control>(assignResult.getError());
    }

    // Save updated control
    const saveResult = await this.controlRepository.save(control);

    if (!saveResult.isSuccess) {
      return Result.fail<Control>(saveResult.getError());
    }

    return Result.ok<Control>(control);
  }

  /**
   * Deactivate a framework
   */
  public async deactivateFramework(
    frameworkId: string,
    userId: string
  ): Promise<Result<Framework, Error>> {
    // Find framework
    const frameworkResult = await this.frameworkRepository.findById(frameworkId);

    if (!frameworkResult.isSuccess) {
      return Result.fail<Framework>(frameworkResult.getError());
    }

    const framework = frameworkResult.getValue();

    if (!framework) {
      return Result.fail<Framework>(new Error(`Framework with ID ${frameworkId} not found`));
    }

    // Deactivate framework
    framework.deactivate();

    // Save updated framework
    const saveResult = await this.frameworkRepository.save(framework);

    if (!saveResult.isSuccess) {
      return Result.fail<Framework>(saveResult.getError());
    }

    return Result.ok<Framework>(framework);
  }
}
