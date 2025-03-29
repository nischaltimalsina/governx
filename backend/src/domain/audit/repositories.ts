// backend/src/domain/audit/repositories.ts
import { Result } from '../common/result'
import { Audit } from './audit'
import { Finding } from './finding'
import { AuditType, AuditStatus, FindingStatus, FindingSeverity, FindingType, AuditTemplate } from './audit_values'

/**
 * Audit repository interface
 */
export interface IAuditRepository {
  /**
   * Find an audit by ID
   */
  findById(id: string): Promise<Result<Audit | null, Error>>

  /**
   * Find all audits with optional filters
   */
  findAll(options?: {
    types?: AuditType[]
    statuses?: AuditStatus[]
    frameworkId?: string
    leadAuditorId?: string
    startDate?: Date
    endDate?: Date
    active?: boolean
    pageSize?: number
    pageNumber?: number
  }): Promise<Result<Audit[], Error>>

  /**
   * Find audits by framework ID
   */
  findByFrameworkId(
    frameworkId: string,
    options?: {
      statuses?: AuditStatus[]
      active?: boolean
      pageSize?: number
      pageNumber?: number
    }
  ): Promise<Result<Audit[], Error>>

  /**
   * Find audits by lead auditor ID
   */
  findByLeadAuditorId(
    auditorId: string,
    options?: {
      statuses?: AuditStatus[]
      active?: boolean
    }
  ): Promise<Result<Audit[], Error>>

  /**
   * Check if an audit with the same name exists
   */
  existsByName(name: string): Promise<Result<boolean, Error>>

  /**
   * Save an audit to the repository
   */
  save(audit: Audit): Promise<Result<void, Error>>

  /**
   * Delete an audit from the repository
   */
  delete(auditId: string): Promise<Result<void, Error>>

  /**
   * Count audits with optional filters
   */
  count(options?: {
    types?: AuditType[]
    statuses?: AuditStatus[]
    frameworkId?: string
    active?: boolean
  }): Promise<Result<number, Error>>
}

/**
 * Finding repository interface
 */
export interface IFindingRepository {
  /**
   * Find a finding by ID
   */
  findById(id: string): Promise<Result<Finding | null, Error>>

  /**
   * Find all findings with optional filters
   */
  findAll(options?: {
    auditId?: string
    types?: FindingType[]
    severities?: FindingSeverity[]
    statuses?: FindingStatus[]
    controlId?: string
    assigneeId?: string
    overdue?: boolean
    active?: boolean
    pageSize?: number
    pageNumber?: number
  }): Promise<Result<Finding[], Error>>

  /**
   * Find findings by audit ID
   */
  findByAuditId(
    auditId: string,
    options?: {
      statuses?: FindingStatus[]
      severities?: FindingSeverity[]
      active?: boolean
    }
  ): Promise<Result<Finding[], Error>>

  /**
   * Find findings by control ID
   */
  findByControlId(
    controlId: string,
    options?: {
      statuses?: FindingStatus[]
      active?: boolean
    }
  ): Promise<Result<Finding[], Error>>

  /**
   * Find findings by assignee ID (from remediation plan)
   */
  findByAssigneeId(
    assigneeId: string,
    options?: {
      statuses?: FindingStatus[]
      overdue?: boolean
      active?: boolean
    }
  ): Promise<Result<Finding[], Error>>

  /**
   * Save a finding to the repository
   */
  save(finding: Finding): Promise<Result<void, Error>>

  /**
   * Delete a finding from the repository
   */
  delete(findingId: string): Promise<Result<void, Error>>

  /**
   * Count findings with optional filters
   */
  count(options?: {
    auditId?: string
    types?: FindingType[]
    severities?: FindingSeverity[]
    statuses?: FindingStatus[]
    controlId?: string
    overdue?: boolean
    active?: boolean
  }): Promise<Result<number, Error>>
}
/**
 * Audit template repository interface
 */
export interface IAuditTemplateRepository {
  /**
   * Find an audit template by ID
   */
  findById(id: string): Promise<Result<AuditTemplate | null, Error>>;

  /**
   * Find all audit templates with optional filters
   */
  findAll(options?: {
    type?: AuditType[];
    frameworkId?: string;
    active?: boolean;
    pageSize?: number;
    pageNumber?: number;
  }): Promise<Result<AuditTemplate[], Error>>;

  /**
   * Save an audit template to the repository
   */
  save(template: AuditTemplate): Promise<Result<void, Error>>;

  /**
   * Delete an audit template from the repository
   */
  delete(templateId: string): Promise<Result<void, Error>>;

  /**
   * Count audit templates with optional filters
   */
  count(options?: {
    type?: AuditType[];
    active?: boolean;
  }): Promise<Result<number, Error>>;
}
