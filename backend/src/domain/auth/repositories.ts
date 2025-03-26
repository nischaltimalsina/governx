import { User, Email } from './entities';
import { Result } from '../common/result';

/**
 * Repository interface for User entity
 */
export interface IUserRepository {
  /**
   * Find a user by ID
   */
  findById(id: string): Promise<Result<User | null, Error>>;

  /**
   * Find a user by email
   */
  findByEmail(email: Email): Promise<Result<User | null, Error>>;

  /**
   * Check if a user with the given email exists
   */
  exists(email: Email): Promise<Result<boolean, Error>>;

  /**
   * Save a user to the repository
   */
  save(user: User): Promise<Result<void, Error>>;

  /**
   * Delete a user from the repository
   */
  delete(userId: string): Promise<Result<void, Error>>;
}

/**
 * Repository interface for auth-related operations
 */
export interface IAuthRepository {
  /**
   * Compare a raw password against a hashed password
   */
  comparePassword(plainPassword: string, hashedPassword: string): Promise<Result<boolean, Error>>;

  /**
   * Hash a password
   */
  hashPassword(plainPassword: string): Promise<Result<string, Error>>;

  /**
   * Generate a JWT token for a user
   */
  generateToken(user: User): Promise<Result<string, Error>>;

  /**
   * Verify a JWT token
   */
  verifyToken(token: string): Promise<Result<{ userId: string }, Error>>;
}
