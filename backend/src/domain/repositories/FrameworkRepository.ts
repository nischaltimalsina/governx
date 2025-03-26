import mongoose from 'mongoose';
import { IFrameworkRepository } from '../../domain/repositories/complianceRepository';
import { Framework, FrameworkName, FrameworkVersion } from '../../domain/models/compliance';
import { UniqueEntityID } from '../../domain/common/Entity';
import { FrameworkModel, IFrameworkDocument } from '../models/complianceModels';

export class MongoFrameworkRepository implements IFrameworkRepository {
  async findById(id: UniqueEntityID): Promise<Framework | null> {
    const frameworkDocument = await FrameworkModel.findById(id.toString());

    if (!frameworkDocument) {
      return null;
    }

    return this.toDomainEntity(frameworkDocument);
  }

  async findAll(options?: { isActive?: boolean }): Promise<Framework[]> {
    let query = FrameworkModel.find();

    if (options?.isActive !== undefined) {
      query = query.where('isActive').equals(options.isActive);
    }

    const frameworkDocuments = await query.exec();

    return Promise.all(
      frameworkDocuments.map(doc => this.toDomainEntity(doc))
    );
  }

  async save(framework: Framework): Promise<void> {
    const frameworkData = {
      name: framework.name.getValue(),
      version: framework.version.getValue(),
      description: framework.description,
      isActive: framework.isActive
    };

    await FrameworkModel.findOneAndUpdate(
      { _id: framework.frameworkId.toString() },
      frameworkData,
      { upsert: true, new: true }
    );
  }

  async delete(id: UniqueEntityID): Promise<boolean> {
    const result = await FrameworkModel.deleteOne({ _id: id.toString() });
    return result.deletedCount > 0;
  }

  private async toDomainEntity(frameworkDocument: IFrameworkDocument): Promise<Framework> {
    const nameOrError = FrameworkName.create(frameworkDocument.name);
    const versionOrError = FrameworkVersion.create(frameworkDocument.version);

    // This shouldn't happen if our DB validation is working properly,
    // but we handle it gracefully just in case
    if (nameOrError.isFailure) {
      throw new Error(`Invalid framework name in database: ${nameOrError.error}`);
    }

    if (versionOrError.isFailure) {
      throw new Error(`Invalid framework version in database: ${versionOrError.error}`);
    }

    const frameworkOrError = Framework.create({
      name: nameOrError.getValue(),
      version: versionOrError.getValue(),
      description: frameworkDocument.description,
      isActive: frameworkDocument.isActive
    }, new UniqueEntityID(frameworkDocument._id.toString()));

    if (frameworkOrError.isFailure) {
      throw new Error(`Could not create framework domain entity: ${frameworkOrError.error}`);
    }

    return frameworkOrError.getValue();
  }
}
