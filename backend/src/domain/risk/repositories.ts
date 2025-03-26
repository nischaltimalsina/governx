import { Result } from '../common/result';
import { Risk } from './risk';
import { RiskTreatment } from './risk_treatment';
import { RiskCategory, RiskStatus, RiskSeverity } from './risk_values';

/**
 * Risk repository interface
 */
export interface IRiskRepository {
  /**
   * Find a risk by ID
   */
  findById(id: string): Promise<Result<Risk | null, Error>>;

  /**
   * Find all risks with optional filters
   */
  findAll(options?: {
    categories?: RiskCategory[];
    statuses?: RiskStatus[];
    severities?: RiskSeverity[];
    ownerId?: string;
    controlId?: string;
    assetId?: string;
    tags?: string[];
    reviewDue?: boolean;
    active?: boolean;
    pageSize?: number;
    pageNumber?: number;
  }): Promise<Result<Risk[], Error>>;

  /**
   * Find risks by owner
   */
  findByOwner(
    ownerId: string,
    options?: {
      statuses?: RiskStatus[];
      active?: boolean;
    }
  ): Promise<Result<Risk[], Error>>;

  /**
   * Find risks by control ID
   */
  findByControlId(
    controlId: string,
    options?: {
      statuses?: RiskStatus[];
      active?: boolean;
    }
  ): Promise<Result<Risk[], Error>>;

  /**
   * Save a risk to the repository
   */
  save(risk: Risk): Promise<Result<void, Error>>;

  /**
   * Delete a risk from the repository
   */
  delete(riskId: string): Promise<Result<void, Error>>;

  /**
   * Count risks with optional filters
   */
  count(options?: {
    categories?: RiskCategory[];
    statuses?: RiskStatus[];
    severities?: RiskSeverity[];
    ownerId?: string;
    controlId?: string;
    assetId?: string;
    reviewDue?: boolean;
    active?: boolean;
  }): Promise<Result<number, Error>>;
}

/**
 * Risk treatment repository interface
 */
export interface IRiskTreatmentRepository {
  /**
   * Find a risk treatment by ID
   */
  findById(id: string): Promise<Result<RiskTreatment | null, Error>>;

  /**
   * Find all risk treatments for a specific risk
   */
  findByRiskId(
    riskId: string,
    options?: {
      active?: boolean;
    }
  ): Promise<Result<RiskTreatment[], Error>>;

  /**
   * Find all risk treatments with optional filters
   */
  findAll(options?: {
    statuses?: string[];
    assignee?: string;
    controlId?: string;
    overdue?: boolean;
    active?: boolean;
    pageSize?: number;
    pageNumber?: number;
  }): Promise<Result<RiskTreatment[], Error>>;

  /**
   * Find treatments by assignee
   */
  findByAssignee(
    assigneeId: string,
    options?: {
      overdue?: boolean;
      active?: boolean;
    }
  ): Promise<Result<RiskTreatment[], Error>>;

  /**
   * Save a risk treatment to the repository
   */
  save(treatment: RiskTreatment): Promise<Result<void, Error>>;

  /**
   * Delete a risk treatment from the repository
   */
  delete(treatmentId: string): Promise<Result<void, Error>>;

  /**
   * Count risk treatments with optional filters
   */
  count(options?: {
    riskId?: string;
    statuses?: string[];
    assignee?: string;
    overdue?: boolean;
    active?: boolean;
  }): Promise<Result<number, Error>>;
}
