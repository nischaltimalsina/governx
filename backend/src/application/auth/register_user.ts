import { Result } from '../../domain/common/result';
import { Email, Password } from '../../domain/auth/entities';
import { AuthService } from '../../domain/auth/services';
import { RegisterUserDTO, UserDTO } from '../dtos/auth_dtos';
import mongoose from 'mongoose'

/**
 * Use case for registering a new user
 */
export class RegisterUserUseCase {
  constructor(private authService: AuthService) {}

  /**
   * Execute the use case
   */
  public async execute(request: RegisterUserDTO): Promise<Result<UserDTO, Error>> {
    // Create Email value object
    const emailOrError = Email.create(request.email)
    if (!emailOrError.isSuccess) {
      return Result.fail<UserDTO>(emailOrError.getError())
    }

    // Create Password value object
    const passwordOrError = Password.create(request.password)
    if (!passwordOrError.isSuccess) {
      return Result.fail<UserDTO>(passwordOrError.getError())
    }

    // Generate a new ObjectId for the user
    const userId = new mongoose.Types.ObjectId().toString()

    // Call domain service to register user
    const userResult = await this.authService.registerUser(
      userId,
      emailOrError.getValue(),
      passwordOrError.getValue(),
      request.firstName,
      request.lastName,
      request.roles
    )

    if (!userResult.isSuccess) {
      return Result.fail<UserDTO>(userResult.getError())
    }

    const user = userResult.getValue()

    // Map domain entity to DTO
    return Result.ok<UserDTO>({
      id: user.id,
      email: user.email.getValue(),
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      roles: user.roles,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
    })
  }
}
