import { UniqueEntityID } from '../common/Entity';
import { Result } from '../common/Result';
import { Framework, Control, Evidence, ControlStatus, EvidenceStatus } from '../models/compliance';
import { IFrameworkRepository, IControlRepository, IEvidenceRepository } from '../repositories/complianceRepository';

export class ComplianceService {
  constructor(
    private frameworkRepository: IFrameworkRepository,
    private controlRepository: IControlRepository,
    private evidenceRepository: IEvidenceRepository
  ) {}

  // Framework operations
  async getFrameworkById(id: UniqueEntityID): Promise<Result<Framework>> {
    const framework = await this.frameworkRepository.findById(id);
    if (!framework) {
      return Result.fail<Framework>(`Framework with ID ${id.toString()} not found`);
    }
    return Result.ok<Framework>(framework);
  }

  async getAllFrameworks(options?: { isActive?: boolean }): Promise<Result<Framework[]>> {
    try {
      const frameworks = await this.frameworkRepository.findAll(options);
      return Result.ok<Framework[]>(frameworks);
    } catch (error) {
      return Result.fail<Framework[]>(`Error retrieving frameworks: ${error}`);
    }
  }

  async createFramework(framework: Framework): Promise<Result<void>> {
    try {
      await this.frameworkRepository.save(framework);
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Error creating framework: ${error}`);
    }
  }

  async updateFramework(framework: Framework): Promise<Result<void>> {
    try {
      const existingFramework = await this.frameworkRepository.findById(framework.frameworkId);
      if (!existingFramework) {
        return Result.fail<void>(`Framework with ID ${framework.frameworkId.toString()} not found`);
      }

      await this.frameworkRepository.save(framework);
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Error updating framework: ${error}`);
    }
  }

  // Control operations
  async getControlById(id: UniqueEntityID): Promise<Result<Control>> {
    const control = await this.controlRepository.findById(id);
    if (!control) {
      return Result.fail<Control>(`Control with ID ${id.toString()} not found`);
    }
    return Result.ok<Control>(control);
  }

  async getControlsByFramework(frameworkId: UniqueEntityID): Promise<Result<Control[]>> {
    try {
      const framework = await this.frameworkRepository.findById(frameworkId);
      if (!framework) {
        return Result.fail<Control[]>(`Framework with ID ${frameworkId.toString()} not found`);
      }

      const controls = await this.controlRepository.findByFrameworkId(frameworkId);
      return Result.ok<Control[]>(controls);
    } catch (error) {
      return Result.fail<Control[]>(`Error retrieving controls for framework: ${error}`);
    }
  }

  async createControl(control: Control): Promise<Result<void>> {
    try {
      // Verify the framework exists
      const framework = await this.frameworkRepository.findById(control.frameworkId);
      if (!framework) {
        return Result.fail<void>(`Framework with ID ${control.frameworkId.toString()} not found`);
      }

      await this.controlRepository.save(control);
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Error creating control: ${error}`);
    }
  }

  async updateControlStatus(
    controlId: UniqueEntityID,
    status: ControlStatus
  ): Promise<Result<void>> {
    try {
      const control = await this.controlRepository.findById(controlId);
      if (!control) {
        return Result.fail<void>(`Control with ID ${controlId.toString()} not found`);
      }

      control.updateStatus(status);
      await this.controlRepository.save(control);
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Error updating control status: ${error}`);
    }
  }

  // Evidence operations
  async getEvidenceById(id: UniqueEntityID): Promise<Result<Evidence>> {
    const evidence = await this.evidenceRepository.findById(id);
    if (!evidence) {
      return Result.fail<Evidence>(`Evidence with ID ${id.toString()} not found`);
    }
    return Result.ok<Evidence>(evidence);
  }

  async getEvidenceForControl(controlId: UniqueEntityID): Promise<Result<Evidence[]>> {
    try {
      const control = await this.controlRepository.findById(controlId);
      if (!control) {
        return Result.fail<Evidence[]>(`Control with ID ${controlId.toString()} not found`);
      }

      const evidences = await this.evidenceRepository.findByControlId(controlId);
      return Result.ok<Evidence[]>(evidences);
    } catch (error) {
      return Result.fail<Evidence[]>(`Error retrieving evidence for control: ${error}`);
    }
  }

  async createEvidence(evidence: Evidence): Promise<Result<void>> {
    try {
      // Verify all controls exist
      for (const controlId of evidence.controlIds) {
        const control = await this.controlRepository.findById(controlId);
        if (!control) {
          return Result.fail<void>(`Control with ID ${controlId.toString()} not found`);
        }
      }

      await this.evidenceRepository.save(evidence);
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Error creating evidence: ${error}`);
    }
  }

  async updateEvidenceStatus(
    evidenceId: UniqueEntityID,
    status: EvidenceStatus
  ): Promise<Result<void>> {
    try {
      const evidence = await this.evidenceRepository.findById(evidenceId);
      if (!evidence) {
        return Result.fail<void>(`Evidence with ID ${evidenceId.toString()} not found`);
      }

      if (status === EvidenceStatus.APPROVED) {
        evidence.approve();
      } else if (status === EvidenceStatus.REJECTED) {
        evidence.reject();
      } else {
        return Result.fail<void>(`Invalid evidence status: ${status}`);
      }

      await this.evidenceRepository.save(evidence);
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(`Error updating evidence status: ${error}`);
    }
  }

  async getExpiringEvidence(daysUntilExpiration: number): Promise<Result<Evidence[]>> {
    try {
      const evidences = await this.evidenceRepository.findExpiring(daysUntilExpiration);
      return Result.ok<Evidence[]>(evidences);
    } catch (error) {
      return Result.fail<Evidence[]>(`Error retrieving expiring evidence: ${error}`);
    }
  }

  // Framework compliance assessment
  async assessFrameworkCompliance(frameworkId: UniqueEntityID): Promise<Result<{
    totalControls: number;
    implementedControls: number;
    partiallyImplementedControls: number;
    notImplementedControls: number;
    compliancePercentage: number;
  }>> {
    try {
      const framework = await this.frameworkRepository.findById(frameworkId);
      if (!framework) {
        return Result.fail(`Framework with ID ${frameworkId.toString()} not found`);
      }

      const controls = await this.controlRepository.findByFrameworkId(frameworkId);

      const totalControls = controls.length;
      const implementedControls = controls.filter(c => c.status === ControlStatus.IMPLEMENTED).length;
      const partiallyImplementedControls = controls.filter(c => c.status === ControlStatus.PARTIALLY_IMPLEMENTED).length;
      const notImplementedControls = controls.filter(c => c.status === ControlStatus.NOT_IMPLEMENTED).length;

      // Calculate compliance percentage - fully implemented controls count as 100%, partially as 50%
      const compliancePercentage = totalControls > 0
        ? ((implementedControls + (partiallyImplementedControls * 0.5)) / totalControls) * 100
        : 0;

      return Result.ok({
        totalControls,
        implementedControls,
        partiallyImplementedControls,
        notImplementedControls,
        compliancePercentage
      });
    } catch (error) {
      return Result.fail(`Error assessing framework compliance: ${error}`);
    }
  }
}
