import { Result } from '../../domain/common/result';
import { AuthService } from '../../domain/auth/services';
import { TokenDTO, UserDTO } from '../dtos/auth_dtos';

/**
 * Use case for validating a token and retrieving the associated user
 */
export class ValidateTokenUseCase {
  constructor(private authService: AuthService) {}

  /**
   * Execute the use case
   */
  public async execute(request: TokenDTO): Promise<Result<UserDTO, Error>> {
    // Call domain service to validate token
    const userResult = await this.authService.validateToken(request.token);

    if (!userResult.isSuccess) {
      return Result.fail<UserDTO>(userResult.getError());
    }

    const user = userResult.getValue();

    // Map domain entity to DTO
    return Result.ok<UserDTO>({
      id: user.id,
      email: user.email.getValue(),
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      roles: user.roles,
      isActive: user.isActive,
      lastLogin: user.lastLogin
    });
  }
}
