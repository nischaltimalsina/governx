import { IUserRepository } from '../../domain/auth/repositories';
import { User, Email, Password, UserRole } from '../../domain/auth/entities';
import { Result } from '../../domain/common/result';
import { UserModel, IUserDocument } from './models/user_schema';

/**
 * MongoDB implementation of the User repository
 */
export class MongoUserRepository implements IUserRepository {
  /**
   * Find a user by ID
   */
  public async findById(id: string): Promise<Result<User | null, Error>> {
    try {
      const userDoc = await UserModel.findById(id);

      if (!userDoc) {
        return Result.ok<null>(null);
      }

      return this.mapDocumentToDomain(userDoc);
    } catch (error) {
      return Result.fail<User | null>(
        error instanceof Error
          ? error
          : new Error(`Failed to find user with id ${id}`)
      );
    }
  }

  /**
   * Find a user by email
   */
  public async findByEmail(email: Email): Promise<Result<User | null, Error>> {
    try {
      const userDoc = await UserModel.findOne({ email: email.getValue() });

      if (!userDoc) {
        return Result.ok<null>(null);
      }

      return this.mapDocumentToDomain(userDoc);
    } catch (error) {
      return Result.fail<User | null>(
        error instanceof Error
          ? error
          : new Error(`Failed to find user with email ${email.getValue()}`)
      );
    }
  }

  /**
   * Check if a user with the given email exists
   */
  public async exists(email: Email): Promise<Result<boolean, Error>> {
    try {
      const count = await UserModel.countDocuments({ email: email.getValue() });
      return Result.ok<boolean>(count > 0);
    } catch (error) {
      return Result.fail<boolean>(
        error instanceof Error
          ? error
          : new Error(`Failed to check if user with email ${email.getValue()} exists`)
      );
    }
  }

  /**
   * Save a user to the repository
   */
  public async save(user: User): Promise<Result<void, Error>> {
    try {
      // Check if user already exists
      const existingUser = await UserModel.findById(user.id);

      if (existingUser) {
        // Update existing user
        await UserModel.updateOne(
          { _id: user.id },
          {
            email: user.email.getValue(),
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles,
            isActive: user.isActive,
            lastLogin: user.lastLogin,
            // Don't update password here as it requires special handling
          }
        );
      } else {
        // Create new user
        await UserModel.create({
          _id: user.id,
          email: user.email.getValue(),
          password: user.password.getValue(),
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
        });
      }

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error
          ? error
          : new Error(`Failed to save user with id ${user.id}`)
      );
    }
  }

  /**
   * Delete a user from the repository
   */
  public async delete(userId: string): Promise<Result<void, Error>> {
    try {
      await UserModel.deleteOne({ _id: userId });
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error
          ? error
          : new Error(`Failed to delete user with id ${userId}`)
      );
    }
  }

  /**
   * Map a MongoDB document to a domain User entity
   */
  private mapDocumentToDomain(userDoc: IUserDocument): Result<User, Error> {
    // Create Email value object
    const emailOrError = Email.create(userDoc.email);
    if (!emailOrError.isSuccess) {
      return Result.fail<User>(emailOrError.getError());
    }

    // Create Password value object (already hashed)
    const passwordOrError = Password.createHashed(userDoc.password);
    if (!passwordOrError.isSuccess) {
      return Result.fail<User>(passwordOrError.getError());
    }

    // Create User entity
    return User.create(userDoc._id.toString(), {
      email: emailOrError.getValue(),
      password: passwordOrError.getValue(),
      firstName: userDoc.firstName,
      lastName: userDoc.lastName,
      roles: userDoc.roles as UserRole[],
      isActive: userDoc.isActive,
      lastLogin: userDoc.lastLogin,
    });
  }
}
