import { Result } from '../common/result';
import { Evidence } from './evidence';
import { EvidenceStatus, EvidenceType } from './evidence_values';

/**
 * Evidence repository interface
 */
export interface IEvidenceRepository {
  /**
   * Find evidence by ID
   */
  findById(id: string): Promise<Result<Evidence | null, Error>>;

  /**
   * Find all evidence with optional filters
   */
  findAll(options?: {
    controlId?: string;
    frameworkId?: string;
    status?: EvidenceStatus[];
    type?: EvidenceType[];
    tags?: string[];
    createdBy?: string;
    reviewerId?: string;
    startDate?: Date;
    endDate?: Date;
    active?: boolean;
    pageSize?: number;
    pageNumber?: number;
  }): Promise<Result<Evidence[], Error>>;

  /**
   * Find evidence by control ID
   */
  findByControlId(
    controlId: string,
    options?: {
      status?: EvidenceStatus[];
      active?: boolean;
    }
  ): Promise<Result<Evidence[], Error>>;

  /**
   * Find evidence by framework ID
   */
  findByFrameworkId(
    frameworkId: string,
    options?: {
      status?: EvidenceStatus[];
      active?: boolean;
      pageSize?: number;
      pageNumber?: number;
    }
  ): Promise<Result<Evidence[], Error>>;

  /**
   * Save evidence to repository
   */
  save(evidence: Evidence): Promise<Result<void, Error>>;

  /**
   * Delete evidence from repository
   */
  delete(evidenceId: string): Promise<Result<void, Error>>;

  /**
   * Count evidence with optional filters
   */
  count(options?: {
    controlId?: string;
    frameworkId?: string;
    status?: EvidenceStatus[];
    type?: EvidenceType[];
    active?: boolean;
  }): Promise<Result<number, Error>>;

  /**
   * Check if a piece of evidence exists with the given file hash
   */
  existsByHash(fileHash: string): Promise<Result<boolean, Error>>;

  /**
   * Find evidence by file hash
   */
  findByFileHash(fileHash: string): Promise<Result<Evidence | null, Error>>;
}
