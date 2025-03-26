import { IControlRepository } from '../../domain/compliance/repositories';
import { Control } from '../../domain/compliance/control';
import { ControlCode, ControlTitle, ImplementationStatus } from '../../domain/compliance/values';
import { Result } from '../../domain/common/result';
import { ControlModel, IControlDocument } from './models/control_schema';

/**
 * MongoDB implementation of the Control repository
 */
export class MongoControlRepository implements IControlRepository {
  /**
   * Find a control by ID
   */
  public async findById(id: string): Promise<Result<Control | null, Error>> {
    try {
      const controlDoc = await ControlModel.findById(id);

      if (!controlDoc) {
        return Result.ok<null>(null);
      }

      return this.mapDocumentToDomain(controlDoc);
    } catch (error) {
      return Result.fail<Control | null>(
        error instanceof Error
          ? error
          : new Error(`Failed to find control with id ${id}`)
      );
    }
  }

  /**
   * Find a control by framework ID and code
   */
  public async findByFrameworkAndCode(
    frameworkId: string,
    code: ControlCode
  ): Promise<Result<Control | null, Error>> {
    try {
      const controlDoc = await ControlModel.findOne({
        frameworkId,
        code: code.getValue()
      });

      if (!controlDoc) {
        return Result.ok<null>(null);
      }

      return this.mapDocumentToDomain(controlDoc);
    } catch (error) {
      return Result.fail<Control | null>(
        error instanceof Error
          ? error
          : new Error(`Failed to find control with framework ID ${frameworkId} and code ${code.getValue()}`)
      );
    }
  }

  /**
   * Find all controls with optional filters
   */
  public async findAll(options?: {
    frameworkId?: string;
    active?: boolean;
    ownerId?: string;
    implementationStatus?: string[];
    categories?: string[];
    parentControlId?: string;
  }): Promise<Result<Control[], Error>> {
    try {
      // Build query
      const query: any = {};

      if (options?.frameworkId) {
        query.frameworkId = options.frameworkId;
      }

      if (options?.active !== undefined) {
        query.isActive = options.active;
      }

      if (options?.ownerId) {
        query.ownerId = options.ownerId;
      }

      if (options?.implementationStatus && options.implementationStatus.length > 0) {
        query.implementationStatus = { $in: options.implementationStatus };
      }

      if (options?.categories && options.categories.length > 0) {
        query.categories = { $in: options.categories };
      }

      if (options?.parentControlId) {
        query.parentControlId = options.parentControlId;
      }

      const controlDocs = await ControlModel.find(query).sort({ code: 1 });

      const controls: Control[] = [];

      for (const doc of controlDocs) {
        const controlResult = await this.mapDocumentToDomain(doc);

        if (controlResult.isSuccess) {
          controls.push(controlResult.getValue());
        }
      }

      return Result.ok<Control[]>(controls);
    } catch (error) {
      return Result.fail<Control[]>(
        error instanceof Error
          ? error
          : new Error('Failed to find controls')
      );
    }
  }

  /**
   * Find all controls for a framework
   */
  public async findByFrameworkId(
    frameworkId: string,
    includeInactive?: boolean
  ): Promise<Result<Control[], Error>> {
    try {
      const query: any = { frameworkId };

      if (!includeInactive) {
        query.isActive = true;
      }

      const controlDocs = await ControlModel.find(query).sort({ code: 1 });

      const controls: Control[] = [];

      for (const doc of controlDocs) {
        const controlResult = await this.mapDocumentToDomain(doc);

        if (controlResult.isSuccess) {
          controls.push(controlResult.getValue());
        }
      }

      return Result.ok<Control[]>(controls);
    } catch (error) {
      return Result.fail<Control[]>(
        error instanceof Error
          ? error
          : new Error(`Failed to find controls for framework ${frameworkId}`)
      );
    }
  }

  /**
   * Check if a control with the given framework ID and code exists
   */
  public async exists(
    frameworkId: string,
    code: ControlCode
  ): Promise<Result<boolean, Error>> {
    try {
      const count = await ControlModel.countDocuments({
        frameworkId,
        code: code.getValue()
      });

      return Result.ok<boolean>(count > 0);
    } catch (error) {
      return Result.fail<boolean>(
        error instanceof Error
          ? error
          : new Error(`Failed to check if control exists with framework ID ${frameworkId} and code ${code.getValue()}`)
      );
    }
  }

  /**
   * Save a control to the repository
   */
  public async save(control: Control): Promise<Result<void, Error>> {
    try {
      const controlData = {
        frameworkId: control.frameworkId,
        code: control.code.getValue(),
        title: control.title.getValue(),
        description: control.description,
        guidance: control.guidance,
        implementationStatus: control.implementationStatus,
        implementationDetails: control.implementationDetails,
        ownerId: control.ownerId,
        categories: control.categories,
        parentControlId: control.parentControlId,
        isActive: control.isActive,
        createdBy: control.createdBy,
        updatedBy: control.updatedBy,
        // MongoDB will handle createdAt/updatedAt
      };

      await ControlModel.findByIdAndUpdate(
        control.id,
        controlData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error
          ? error
          : new Error(`Failed to save control with id ${control.id}`)
      );
    }
  }

  /**
   * Delete a control from the repository
   */
  public async delete(controlId: string): Promise<Result<void, Error>> {
    try {
      await ControlModel.findByIdAndDelete(controlId);
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error
          ? error
          : new Error(`Failed to delete control with id ${controlId}`)
      );
    }
  }

  /**
   * Count controls by framework ID with optional filters
   */
  public async countByFrameworkId(
    frameworkId: string,
    options?: {
      implementationStatus?: string[];
      ownerId?: string;
      active?: boolean;
    }
  ): Promise<Result<number, Error>> {
    try {
      const query: any = { frameworkId };

      if (options?.implementationStatus && options.implementationStatus.length > 0) {
        query.implementationStatus = { $in: options.implementationStatus };
      }

      if (options?.ownerId) {
        query.ownerId = options.ownerId;
      }

      if (options?.active !== undefined) {
        query.isActive = options.active;
      }

      const count = await ControlModel.countDocuments(query);

      return Result.ok<number>(count);
    } catch (error) {
      return Result.fail<number>(
        error instanceof Error
          ? error
          : new Error(`Failed to count controls for framework ${frameworkId}`)
      );
    }
  }

  /**
   * Map a MongoDB document to a domain Control entity
   */
  private async mapDocumentToDomain(doc: IControlDocument): Promise<Result<Control, Error>> {
    // Create value objects
    const codeOrError = ControlCode.create(doc.code);
    if (!codeOrError.isSuccess) {
      return Result.fail<Control>(codeOrError.getError());
    }

    const titleOrError = ControlTitle.create(doc.title);
    if (!titleOrError.isSuccess) {
      return Result.fail<Control>(titleOrError.getError());
    }

    // Create Control entity
    return Control.create(doc._id.toString(), {
      frameworkId: doc.frameworkId,
      code: codeOrError.getValue(),
      title: titleOrError.getValue(),
      description: doc.description,
      guidance: doc.guidance,
      implementationStatus: doc.implementationStatus as ImplementationStatus,
      implementationDetails: doc.implementationDetails,
      ownerId: doc.ownerId,
      categories: doc.categories,
      parentControlId: doc.parentControlId,
      isActive: doc.isActive,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt
    });
  }
}
