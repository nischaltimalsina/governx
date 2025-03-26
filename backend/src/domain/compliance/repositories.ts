import { Result } from '../common/result';
import { Framework } from './framework';
import { Control } from './control';
import { FrameworkName, FrameworkVersion, ControlCode } from './values';

/**
 * Framework repository interface
 */
export interface IFrameworkRepository {
  /**
   * Find a framework by ID
   */
  findById(id: string): Promise<Result<Framework | null, Error>>;

  /**
   * Find a framework by name and version
   */
  findByNameAndVersion(
    name: FrameworkName,
    version: FrameworkVersion
  ): Promise<Result<Framework | null, Error>>;

  /**
   * Find all frameworks
   */
  findAll(options?: {
    active?: boolean;
    category?: string;
    organization?: string;
  }): Promise<Result<Framework[], Error>>;

  /**
   * Check if a framework with the given name and version exists
   */
  exists(
    name: FrameworkName,
    version: FrameworkVersion
  ): Promise<Result<boolean, Error>>;

  /**
   * Save a framework to the repository
   */
  save(framework: Framework): Promise<Result<void, Error>>;

  /**
   * Delete a framework from the repository
   */
  delete(frameworkId: string): Promise<Result<void, Error>>;
}

/**
 * Control repository interface
 */
export interface IControlRepository {
  /**
   * Find a control by ID
   */
  findById(id: string): Promise<Result<Control | null, Error>>;

  /**
   * Find a control by framework ID and code
   */
  findByFrameworkAndCode(
    frameworkId: string,
    code: ControlCode
  ): Promise<Result<Control | null, Error>>;

  /**
   * Find all controls
   */
  findAll(options?: {
    frameworkId?: string;
    active?: boolean;
    ownerId?: string;
    implementationStatus?: string[];
    categories?: string[];
    parentControlId?: string;
  }): Promise<Result<Control[], Error>>;

  /**
   * Find all controls for a framework
   */
  findByFrameworkId(
    frameworkId: string,
    includeInactive?: boolean
  ): Promise<Result<Control[], Error>>;

  /**
   * Check if a control with the given framework ID and code exists
   */
  exists(
    frameworkId: string,
    code: ControlCode
  ): Promise<Result<boolean, Error>>;

  /**
   * Save a control to the repository
   */
  save(control: Control): Promise<Result<void, Error>>;

  /**
   * Delete a control from the repository
   */
  delete(controlId: string): Promise<Result<void, Error>>;

  /**
   * Count controls by framework ID with optional filters
   */
  countByFrameworkId(
    frameworkId: string,
    options?: {
      implementationStatus?: string[];
      ownerId?: string;
      active?: boolean;
    }
  ): Promise<Result<number, Error>>;
}
