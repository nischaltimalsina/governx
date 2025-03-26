import { IFrameworkRepository } from '../../domain/repositories/complianceRepository';
import { Framework, FrameworkName, FrameworkVersion } from '../../domain/models/compliance';
import { Result } from '../../domain/common/Result';

// Data Transfer Object for creating a framework
export interface CreateFrameworkDTO {
  name: string;
  version: string;
  description: string;
}

// Response for the use case
export interface CreateFrameworkResponse {
  id: string;
  name: string;
  version: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
}

export class CreateFrameworkUseCase {
  constructor(private frameworkRepository: IFrameworkRepository) {}

  async execute(request: CreateFrameworkDTO): Promise<Result<CreateFrameworkResponse>> {
    // 1. Validate and create value objects
    const nameOrError = FrameworkName.create(request.name);
    if (nameOrError.isFailure) {
      return Result.fail<CreateFrameworkResponse>(nameOrError.error);
    }

    const versionOrError = FrameworkVersion.create(request.version);
    if (versionOrError.isFailure) {
      return Result.fail<CreateFrameworkResponse>(versionOrError.error);
    }

    // 2. Create the domain entity
    const frameworkOrError = Framework.create({
      name: nameOrError.getValue(),
      version: versionOrError.getValue(),
      description: request.description,
      isActive: true
    });

    if (frameworkOrError.isFailure) {
      return Result.fail<CreateFrameworkResponse>(frameworkOrError.error);
    }

    const framework = frameworkOrError.getValue();

    // 3. Persist the entity
    try {
      await this.frameworkRepository.save(framework);

      // 4. Return the response
      return Result.ok<CreateFrameworkResponse>({
        id: framework.frameworkId.toString(),
        name: framework.name.getValue(),
        version: framework.version.getValue(),
        description: framework.description,
        isActive: framework.isActive,
        createdAt: framework.createdAt
      });
    } catch (error) {
      return Result.fail<CreateFrameworkResponse>(`Failed to create framework: ${error}`);
    }
  }
}
