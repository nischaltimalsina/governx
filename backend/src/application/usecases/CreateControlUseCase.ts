import { IControlRepository, IFrameworkRepository } from '../../domain/repositories/complianceRepository';
import { Control, ControlCode, ControlStatus } from '../../domain/models/compliance';
import { Result } from '../../domain/common/Result';
import { UniqueEntityID } from '../../domain/common/Entity';

// Data Transfer Object for creating a control
export interface CreateControlDTO {
  frameworkId: string;
  code: string;
  title: string;
  description: string;
  implementationGuidance?: string;
  status?: ControlStatus;
  ownerId?: string;
}

// Response for the use case
export interface CreateControlResponse {
  id: string;
  frameworkId: string;
  code: string;
  title: string;
  description: string;
  implementationGuidance?: string;
  status: ControlStatus;
  ownerId?: string;
  createdAt: Date;
}

export class CreateControlUseCase {
  constructor(
    private controlRepository: IControlRepository,
    private frameworkRepository: IFrameworkRepository
  ) {}

  async execute(request: CreateControlDTO): Promise<Result<CreateControlResponse>> {
    // 1. Validate and create value objects
    const codeOrError = ControlCode.create(request.code);
    if (codeOrError.isFailure) {
      return Result.fail<CreateControlResponse>(codeOrError.error);
    }

    // 2. Verify that the framework exists
    const frameworkId = new UniqueEntityID(request.frameworkId);
    const framework = await this.frameworkRepository.findById(frameworkId);
    if (!framework) {
      return Result.fail<CreateControlResponse>(`Framework with ID ${request.frameworkId} not found`);
    }

    // 3. Create the domain entity
    const ownerId = request.ownerId ? new UniqueEntityID(request.ownerId) : undefined;

    const controlOrError = Control.create({
      frameworkId,
      code: codeOrError.getValue(),
      title: request.title,
      description: request.description,
      implementationGuidance: request.implementationGuidance,
      status: request.status || ControlStatus.NOT_IMPLEMENTED,
      ownerId
    });

    if (controlOrError.isFailure) {
      return Result.fail<CreateControlResponse>(controlOrError.error);
    }

    const control = controlOrError.getValue();

    // 4. Persist the entity
    try {
      await this.controlRepository.save(control);

      // 5. Return the response
      return Result.ok<CreateControlResponse>({
        id: control.controlId.toString(),
        frameworkId: control.frameworkId.toString(),
        code: control.code.getValue(),
        title: control.title,
        description: control.description,
        implementationGuidance: control.implementationGuidance,
        status: control.status,
        ownerId: control.ownerId?.toString(),
        createdAt: control.createdAt
      });
    } catch (error) {
      return Result.fail<CreateControlResponse>(`Failed to create control: ${error}`);
    }
  }
}
