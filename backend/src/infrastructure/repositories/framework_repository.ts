import { IFrameworkRepository } from '../../domain/compliance/repositories';
import { Framework } from '../../domain/compliance/framework';
import { FrameworkName, FrameworkVersion } from '../../domain/compliance/values';
import { Result } from '../../domain/common/result';
import { FrameworkModel, IFrameworkDocument } from './models/framework_schema';

/**
 * MongoDB implementation of the Framework repository
 */
export class MongoFrameworkRepository implements IFrameworkRepository {
  /**
   * Find a framework by ID
   */
  public async findById(id: string): Promise<Result<Framework | null, Error>> {
    try {
      const frameworkDoc = await FrameworkModel.findById(id);

      if (!frameworkDoc) {
        return Result.ok<null>(null);
      }

      return this.mapDocumentToDomain(frameworkDoc);
    } catch (error) {
      return Result.fail<Framework | null>(
        error instanceof Error
          ? error
          : new Error(`Failed to find framework with id ${id}`)
      );
    }
  }

  /**
   * Find a framework by name and version
   */
  public async findByNameAndVersion(
    name: FrameworkName,
    version: FrameworkVersion
  ): Promise<Result<Framework | null, Error>> {
    try {
      const frameworkDoc = await FrameworkModel.findOne({
        name: name.getValue(),
        version: version.getValue()
      });

      if (!frameworkDoc) {
        return Result.ok<null>(null);
      }

      return this.mapDocumentToDomain(frameworkDoc);
    } catch (error) {
      return Result.fail<Framework | null>(
        error instanceof Error
          ? error
          : new Error(`Failed to find framework with name ${name.getValue()} and version ${version.getValue()}`)
      );
    }
  }

  /**
   * Find all frameworks with optional filters
   */
  public async findAll(options?: {
    active?: boolean;
    category?: string;
    organization?: string;
  }): Promise<Result<Framework[], Error>> {
    try {
      // Build query
      const query: any = {};

      if (options?.active !== undefined) {
        query.isActive = options.active;
      }

      if (options?.category) {
        query.category = options.category;
      }

      if (options?.organization) {
        query.organization = options.organization;
      }

      const frameworkDocs = await FrameworkModel.find(query).sort({ name: 1, version: -1 });

      const frameworks: Framework[] = [];

      for (const doc of frameworkDocs) {
        const frameworkResult = await this.mapDocumentToDomain(doc);

        if (frameworkResult.isSuccess) {
          frameworks.push(frameworkResult.getValue());
        }
      }

      return Result.ok<Framework[]>(frameworks);
    } catch (error) {
      return Result.fail<Framework[]>(
        error instanceof Error
          ? error
          : new Error('Failed to find frameworks')
      );
    }
  }

  /**
   * Check if a framework with the given name and version exists
   */
  public async exists(
    name: FrameworkName,
    version: FrameworkVersion
  ): Promise<Result<boolean, Error>> {
    try {
      const count = await FrameworkModel.countDocuments({
        name: name.getValue(),
        version: version.getValue()
      });

      return Result.ok<boolean>(count > 0);
    } catch (error) {
      return Result.fail<boolean>(
        error instanceof Error
          ? error
          : new Error(`Failed to check if framework exists with name ${name.getValue()} and version ${version.getValue()}`)
      );
    }
  }

  /**
   * Save a framework to the repository
   */
  public async save(framework: Framework): Promise<Result<void, Error>> {
    try {
      const frameworkData = {
        name: framework.name.getValue(),
        version: framework.version.getValue(),
        description: framework.description,
        organization: framework.organization,
        category: framework.category,
        website: framework.website,
        isActive: framework.isActive,
        createdBy: framework.createdBy,
        updatedBy: framework.updatedBy,
        // MongoDB will handle createdAt/updatedAt
      };

      await FrameworkModel.findByIdAndUpdate(
        framework.id,
        frameworkData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error
          ? error
          : new Error(`Failed to save framework with id ${framework.id}`)
      );
    }
  }

  /**
   * Delete a framework from the repository
   */
  public async delete(frameworkId: string): Promise<Result<void, Error>> {
    try {
      await FrameworkModel.findByIdAndDelete(frameworkId);
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error
          ? error
          : new Error(`Failed to delete framework with id ${frameworkId}`)
      );
    }
  }

  /**
   * Map a MongoDB document to a domain Framework entity
   */
  private async mapDocumentToDomain(doc: IFrameworkDocument): Promise<Result<Framework, Error>> {
    // Create value objects
    const nameOrError = FrameworkName.create(doc.name);
    if (!nameOrError.isSuccess) {
      return Result.fail<Framework>(nameOrError.getError());
    }

    const versionOrError = FrameworkVersion.create(doc.version);
    if (!versionOrError.isSuccess) {
      return Result.fail<Framework>(versionOrError.getError());
    }

    // Create Framework entity
    return Framework.create(doc._id.toString(), {
      name: nameOrError.getValue(),
      version: versionOrError.getValue(),
      description: doc.description,
      organization: doc.organization,
      category: doc.category,
      website: doc.website,
      isActive: doc.isActive,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt
    });
  }
}
