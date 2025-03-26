import { UserRole } from '../../domain/auth/entities';

/**
 * Data Transfer Objects for auth-related use cases
 */

export interface RegisterUserDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles?: UserRole[];
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface TokenDTO {
  token: string;
}

export interface UserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: UserRole[];
  isActive: boolean;
  lastLogin?: Date;
}

export interface AuthResponseDTO {
  user: UserDTO;
  token: string;
}
