import { UniqueEntityID } from '../common/Entity';
import { Framework, Control, Evidence } from '../models/compliance';

export interface IFrameworkRepository {
  findById(id: UniqueEntityID): Promise<Framework | null>;
  findAll(options?: { isActive?: boolean }): Promise<Framework[]>;
  save(framework: Framework): Promise<void>;
  delete(id: UniqueEntityID): Promise<boolean>;
}

export interface IControlRepository {
  findById(id: UniqueEntityID): Promise<Control | null>;
  findByFrameworkId(frameworkId: UniqueEntityID): Promise<Control[]>;
  findByStatus(status: string): Promise<Control[]>;
  findByOwner(ownerId: UniqueEntityID): Promise<Control[]>;
  save(control: Control): Promise<void>;
  delete(id: UniqueEntityID): Promise<boolean>;
}

export interface IEvidenceRepository {
  findById(id: UniqueEntityID): Promise<Evidence | null>;
  findByControlId(controlId: UniqueEntityID): Promise<Evidence[]>;
  findByStatus(status: string): Promise<Evidence[]>;
  findExpiring(daysUntilExpiration: number): Promise<Evidence[]>;
  save(evidence: Evidence): Promise<void>;
  delete(id: UniqueEntityID): Promise<boolean>;
}
