import { Result } from '../../domain/common/result';
import { Email, Password } from '../../domain/auth/entities';
import { AuthService } from '../../domain/auth/services';
import { LoginDTO, AuthResponseDTO } from '../dtos/auth_dtos';

/**
 * Use case for user login
 */
export class LoginUserUseCase {
  constructor(private authService: AuthService) {}

  /**
   * Execute the use case
   */
  public async execute(request: LoginDTO): Promise<Result<AuthResponseDTO, Error>> {
    // Create Email value object
    const emailOrError = Email.create(request.email);
    if (!emailOrError.isSuccess) {
      return Result.fail<AuthResponseDTO>(emailOrError.getError());
    }

    // Create Password value object (for raw password)
    const passwordOrError = Password.create(request.password);
    if (!passwordOrError.isSuccess) {
      return Result.fail<AuthResponseDTO>(passwordOrError.getError());
    }

    // Call domain service to authenticate user
    const authResult = await this.authService.authenticateUser(
      emailOrError.getValue(),
      passwordOrError.getValue()
    );

    if (!authResult.isSuccess) {
      return Result.fail<AuthResponseDTO>(authResult.getError());
    }

    const { user, token } = authResult.getValue();

    // Map domain entity to DTO
    return Result.ok<AuthResponseDTO>({
      user: {
        id: user.id,
        email: user.email.getValue(),
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        roles: user.roles,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      },
      token
    });
  }
}
