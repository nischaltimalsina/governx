import mongoose from 'mongoose';
import { IControlRepository } from '../../domain/repositories/complianceRepository';
import { Control, ControlCode, ControlStatus } from '../../domain/models/compliance';
import { UniqueEntityID } from '../../domain/common/Entity';
import { ControlModel, IControlDocument } from '../database/models/complianceModels';

export class MongoControlRepository implements IControlRepository {
  async findById(id: UniqueEntityID): Promise<Control | null> {
    const controlDocument = await ControlModel.findById(id.toString());

    if (!controlDocument) {
      return null;
    }

    return this.toDomainEntity(controlDocument);
  }

  async findByFrameworkId(frameworkId: UniqueEntityID): Promise<Control[]> {
    const controlDocuments = await ControlModel.find({
      frameworkId: frameworkId.toString()
    });

    return Promise.all(
      controlDocuments.map(doc => this.toDomainEntity(doc))
    );
  }

  async findByStatus(status: string): Promise<Control[]> {
    const controlDocuments = await ControlModel.find({ status });

    return Promise.all(
      controlDocuments.map(doc => this.toDomainEntity(doc))
    );
  }

  async findByOwner(ownerId: UniqueEntityID): Promise<Control[]> {
    const controlDocuments = await ControlModel.find({
      ownerId: ownerId.toString()
    });

    return Promise.all(
      controlDocuments.map(doc => this.toDomainEntity(doc))
    );
  }

  async save(control: Control): Promise<void> {
    const controlData = {
      frameworkId: control.frameworkId.toString(),
      code: control.code.getValue(),
      title: control.title,
      description: control.description,
      implementationGuidance: control.implementationGuidance,
      status: control.status,
      ownerId: control.ownerId?.toString()
    };

    await ControlModel.findOneAndUpdate(
      { _id: control.controlId.toString() },
      controlData,
      { upsert: true, new: true }
    );
  }

  async delete(id: UniqueEntityID): Promise<boolean> {
    const result = await ControlModel.deleteOne({ _id: id.toString() });
    return result.deletedCount > 0;
  }

  private async toDomainEntity(controlDocument: IControlDocument): Promise<Control> {
    const codeOrError = ControlCode.create(controlDocument.code);

    if (codeOrError.isFailure) {
      throw new Error(`Invalid control code in database: ${codeOrError.error}`);
    }

    const frameworkId = new UniqueEntityID(controlDocument.frameworkId.toString());
    const ownerId = controlDocument.ownerId
      ? new UniqueEntityID(controlDocument.ownerId.toString())
      : undefined;

    const controlOrError = Control.create({
      frameworkId,
      code: codeOrError.getValue(),
      title: controlDocument.title,
      description: controlDocument.description,
      implementationGuidance: controlDocument.implementationGuidance,
      status: controlDocument.status as ControlStatus,
      ownerId
    }, new UniqueEntityID(controlDocument._id.toString()));

    if (controlOrError.isFailure) {
      throw new Error(`Could not create control domain entity: ${controlOrError.error}`);
    }

    return controlOrError.getValue();
  }
}
