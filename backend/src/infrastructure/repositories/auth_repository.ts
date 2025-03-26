import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IAuthRepository } from '../../domain/auth/repositories';
import { User } from '../../domain/auth/entities';
import { Result } from '../../domain/common/result';

/**
 * Implementation of AuthRepository using bcrypt and JWT
 */
export class AuthRepository implements IAuthRepository {
  constructor(
    private readonly jwtSecret: string,
    private readonly jwtExpiresIn: string = '24h'
  ) {
    if (!jwtSecret) {
      throw new Error('JWT secret is required');
    }
  }

  /**
   * Compare a plain text password with a hashed password
   */
  public async comparePassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<Result<boolean, Error>> {
    try {
      const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
      return Result.ok<boolean>(isMatch);
    } catch (error) {
      return Result.fail<boolean>(
        error instanceof Error
          ? error
          : new Error('Failed to compare passwords')
      );
    }
  }

  /**
   * Hash a plain text password
   */
  public async hashPassword(plainPassword: string): Promise<Result<string, Error>> {
    try {
      // Generate a salt with cost factor 12
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);
      return Result.ok<string>(hashedPassword);
    } catch (error) {
      return Result.fail<string>(
        error instanceof Error
          ? error
          : new Error('Failed to hash password')
      );
    }
  }

  /**
   * Generate a JWT token for a user
   */
  public async generateToken(user: User): Promise<Result<string, Error>> {
    try {
      const payload = {
        userId: user.id,
        email: user.email.getValue(),
        roles: user.roles
      };

      const expiresIn = this.jwtExpiresIn.endsWith('h')
        ? parseInt(this.jwtExpiresIn.slice(0, -1), 10) * 3600
        : parseInt(this.jwtExpiresIn.slice(0, -1), 10) * 86400; // assuming 'd' for days

      const token = jwt.sign(payload, this.jwtSecret, { expiresIn });

      return Result.ok<string>(token);
    } catch (error) {
      return Result.fail<string>(
        error instanceof Error
          ? error
          : new Error('Failed to generate token')
      );
    }
  }

  /**
   * Verify a JWT token
   */
  public async verifyToken(
    token: string
  ): Promise<Result<{ userId: string }, Error>> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as jwt.JwtPayload;

      if (!decoded || typeof decoded !== 'object' || !decoded.userId) {
        return Result.fail<{ userId: string }>(new Error('Invalid token'));
      }

      return Result.ok<{ userId: string }>({ userId: decoded.userId });
    } catch (error) {
      return Result.fail<{ userId: string }>(
        error instanceof Error
          ? error
          : new Error('Failed to verify token')
      );
    }
  }
  }
