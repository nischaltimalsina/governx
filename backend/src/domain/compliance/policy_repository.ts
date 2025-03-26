import { Result } from '../common/result';
import { Policy } from './policy';
import { PolicyType, PolicyStatus, PolicyName, PolicyVersion } from './policy_values';

/**
 * Policy repository interface
 */
export interface IPolicyRepository {
  /**
   * Find a policy by ID
   */
  findById(id: string): Promise<Result<Policy | null, Error>>;

  /**
   * Find a policy by name and version
   */
  findByNameAndVersion(
    name: PolicyName,
    version: PolicyVersion
  ): Promise<Result<Policy | null, Error>>;

  /**
   * Find the latest version of a policy by name
   */
  findLatestByName(name: PolicyName): Promise<Result<Policy | null, Error>>;

  /**
   * Find all policies with optional filters
   */
  findAll(options?: {
    type?: PolicyType[];
    status?: PolicyStatus[];
    owner?: string;
    controlId?: string;
    tags?: string[];
    effectiveOnly?: boolean;
    reviewDue?: boolean;
    active?: boolean;
    pageSize?: number;
    pageNumber?: number;
  }): Promise<Result<Policy[], Error>>;

  /**
   * Find all policies related to a control
   */
  findByControlId(
    controlId: string,
    options?: {
      status?: PolicyStatus[];
      active?: boolean;
    }
  ): Promise<Result<Policy[], Error>>;

  /**
   * Find policies by owner
   */
  findByOwner(
    ownerId: string,
    options?: {
      status?: PolicyStatus[];
      active?: boolean;
    }
  ): Promise<Result<Policy[], Error>>;

  /**
   * Check if a policy with the given name and version exists
   */
  exists(
    name: PolicyName,
    version: PolicyVersion
  ): Promise<Result<boolean, Error>>;

  /**
   * Save a policy to the repository
   */
  save(policy: Policy): Promise<Result<void, Error>>;

  /**
   * Delete a policy from the repository
   */
  delete(policyId: string): Promise<Result<void, Error>>;

  /**
   * Count policies with optional filters
   */
  count(options?: {
    type?: PolicyType[];
    status?: PolicyStatus[];
    owner?: string;
    controlId?: string;
    effectiveOnly?: boolean;
    reviewDue?: boolean;
    active?: boolean;
  }): Promise<Result<number, Error>>;
}
