import { Entity } from '../common/entity';
import { Result } from '../common/result';

export enum UserRole {
  ADMIN = 'admin',
  COMPLIANCE_MANAGER = 'compliance_manager',
  RISK_MANAGER = 'risk_manager',
  AUDITOR = 'auditor',
  STANDARD_USER = 'standard_user',
  ASSET_MANAGER = 'asset_manager',
  IT_MANAGER = 'it_manager',
}

export class Email {
  private readonly value: string;

  private constructor(email: string) {
    this.value = email;
  }

  public getValue(): string {
    return this.value;
  }

  public static create(email: string): Result<Email, Error> {
    if (!email) {
      return Result.fail<Email>(new Error('Email cannot be empty'));
    }

    // Simple regex for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Result.fail<Email>(new Error('Email is invalid'));
    }

    return Result.ok<Email>(new Email(email));
  }
}

export class Password {
  private readonly value: string;
  private readonly isHashed: boolean;

  private constructor(password: string, isHashed: boolean) {
    this.value = password;
    this.isHashed = isHashed;
  }

  public getValue(): string {
    return this.value;
  }

  public isAlreadyHashed(): boolean {
    return this.isHashed;
  }

  /**
   * Create a raw password (not hashed)
   */
  public static create(password: string): Result<Password, Error> {
    if (!password) {
      return Result.fail<Password>(new Error('Password cannot be empty'));
    }

    if (password.length < 8) {
      return Result.fail<Password>(new Error('Password must be at least 8 characters'));
    }

    // Password must contain at least one uppercase letter, one lowercase letter, and one number
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(password)) {
      return Result.fail<Password>(
        new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number')
      );
    }

    return Result.ok<Password>(new Password(password, false));
  }

  /**
   * Create a password with an already hashed value
   */
  public static createHashed(hashedPassword: string): Result<Password, Error> {
    if (!hashedPassword) {
      return Result.fail<Password>(new Error('Hashed password cannot be empty'));
    }

    return Result.ok<Password>(new Password(hashedPassword, true));
  }
}

export interface UserProps {
  email: Email;
  password: Password;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  isActive: boolean;
  lastLogin?: Date;
}

/**
 * User domain entity representing a system user
 */
export class User extends Entity<UserProps> {
  private readonly props: UserProps;

  private constructor(id: string, props: UserProps) {
    super(id);
    this.props = props;
  }

  get email(): Email {
    return this.props.email;
  }

  get password(): Password {
    return this.props.password;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get roles(): UserRole[] {
    return [...this.props.roles];
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get lastLogin(): Date | undefined {
    return this.props.lastLogin;
  }

  public hasRole(role: UserRole): boolean {
    return this.props.roles.includes(role);
  }

  public updateLastLogin(date: Date): void {
    this.props.lastLogin = date;
  }

  public deactivate(): void {
    this.props.isActive = false;
  }

  public activate(): void {
    this.props.isActive = true;
  }

  public addRole(role: UserRole): Result<void, Error> {
    if (this.hasRole(role)) {
      return Result.fail<void>(new Error(`User already has role ${role}`));
    }

    this.props.roles.push(role);
    return Result.ok<void>();
  }

  public removeRole(role: UserRole): Result<void, Error> {
    if (!this.hasRole(role)) {
      return Result.fail<void>(new Error(`User does not have role ${role}`));
    }

    if (this.props.roles.length === 1) {
      return Result.fail<void>(new Error('User must have at least one role'));
    }

    this.props.roles = this.props.roles.filter(r => r !== role);
    return Result.ok<void>();
  }

  public static create(
    id: string,
    props: UserProps
  ): Result<User, Error> {
    // Validate minimum required fields
    if (!props.email) {
      return Result.fail<User>(new Error('Email is required'));
    }

    if (!props.password) {
      return Result.fail<User>(new Error('Password is required'));
    }

    if (!props.firstName) {
      return Result.fail<User>(new Error('First name is required'));
    }

    if (!props.lastName) {
      return Result.fail<User>(new Error('Last name is required'));
    }

    if (!props.roles || props.roles.length === 0) {
      return Result.fail<User>(new Error('User must have at least one role'));
    }

    return Result.ok<User>(new User(id, props));
  }
}
