import { User, Email, Password, UserRole } from './entities';
import { IUserRepository, IAuthRepository } from './repositories';
import { Result } from '../common/result';

/**
 * AuthService handles domain-level authentication and authorization logic
 */
export class AuthService {
  constructor(
    private userRepository: IUserRepository,
    private authRepository: IAuthRepository
  ) {}

  /**
   * Register a new user
   */
  public async registerUser(
    id: string,
    email: Email,
    password: Password,
    firstName: string,
    lastName: string,
    roles: UserRole[] = [UserRole.STANDARD_USER]
  ): Promise<Result<User, Error>> {
    // Check if user already exists
    const userExistsResult = await this.userRepository.exists(email);
    if (!userExistsResult.isSuccess) {
      return Result.fail<User>(userExistsResult.getError());
    }

    if (userExistsResult.getValue()) {
      return Result.fail<User>(new Error('User with this email already exists'));
    }

    // Hash password if not already hashed
    let hashedPassword: string;
    if (!password.isAlreadyHashed()) {
      const hashedPasswordResult = await this.authRepository.hashPassword(password.getValue());
      if (!hashedPasswordResult.isSuccess) {
        return Result.fail<User>(hashedPasswordResult.getError());
      }
      hashedPassword = hashedPasswordResult.getValue();
    } else {
      hashedPassword = password.getValue();
    }

    // Create hashed password value object
    const hashedPasswordOrError = Password.createHashed(hashedPassword);
    if (!hashedPasswordOrError.isSuccess) {
      return Result.fail<User>(hashedPasswordOrError.getError());
    }

    // Create user entity
    const userOrError = User.create(id, {
      email,
      password: hashedPasswordOrError.getValue(),
      firstName,
      lastName,
      roles,
      isActive: true
    });

    if (!userOrError.isSuccess) {
      return Result.fail<User>(userOrError.getError());
    }

    const user = userOrError.getValue();

    // Save user
    const saveResult = await this.userRepository.save(user);
    if (!saveResult.isSuccess) {
      return Result.fail<User>(saveResult.getError());
    }

    return Result.ok<User>(user);
  }

  /**
   * Authenticate a user with email and password
   */
  public async authenticateUser(
    email: Email,
    password: Password
  ): Promise<Result<{ user: User; token: string }, Error>> {
    // Find user by email
    const userResult = await this.userRepository.findByEmail(email);
    if (!userResult.isSuccess) {
      return Result.fail(userResult.getError());
    }

    const user = userResult.getValue();
    if (!user) {
      return Result.fail(new Error('Invalid email or password'));
    }

    // Check if user is active
    if (!user.isActive) {
      return Result.fail(new Error('User account is inactive'));
    }

    // Verify password
    const passwordMatch = await this.authRepository.comparePassword(
      password.getValue(),
      user.password.getValue()
    );

    if (!passwordMatch.isSuccess) {
      return Result.fail(passwordMatch.getError());
    }

    if (!passwordMatch.getValue()) {
      return Result.fail(new Error('Invalid email or password'));
    }

    // Update last login time
    user.updateLastLogin(new Date());
    const saveResult = await this.userRepository.save(user);
    if (!saveResult.isSuccess) {
      return Result.fail(saveResult.getError());
    }

    // Generate JWT token
    const tokenResult = await this.authRepository.generateToken(user);
    if (!tokenResult.isSuccess) {
      return Result.fail(tokenResult.getError());
    }

    return Result.ok({
      user,
      token: tokenResult.getValue()
    });
  }

  /**
   * Validate a token and return the associated user
   */
  public async validateToken(token: string): Promise<Result<User, Error>> {
    // Verify token
    const verifyResult = await this.authRepository.verifyToken(token);
    if (!verifyResult.isSuccess) {
      return Result.fail<User>(verifyResult.getError());
    }

    const { userId } = verifyResult.getValue();

    // Find user by ID
    const userResult = await this.userRepository.findById(userId);
    if (!userResult.isSuccess) {
      return Result.fail<User>(userResult.getError());
    }

    const user = userResult.getValue();
    if (!user) {
      return Result.fail<User>(new Error('User not found'));
    }

    // Check if user is active
    if (!user.isActive) {
      return Result.fail<User>(new Error('User account is inactive'));
    }

    return Result.ok<User>(user);
  }
}
