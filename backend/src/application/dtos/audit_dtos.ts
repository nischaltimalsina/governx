import {
  AuditType,
  AuditStatus,
  FindingType,
  FindingSeverity,
  FindingStatus,
} from '../../domain/audit/audit_values'

/**
 * Data Transfer Objects for audit-related use cases
 */

// Audit DTOs
export interface CreateAuditDTO {
  name: string
  type: AuditType
  description: string
  frameworkIds: string[]
  leadAuditor: {
    id: string
    name: string
    organization?: string
    role?: string
    isExternal: boolean
  }
  auditTeam?: {
    id: string
    name: string
    organization?: string
    role?: string
    isExternal: boolean
  }[]
  schedule: {
    startDate: Date
    endDate: Date
  }
  scope?: string
  methodology?: string
}

export interface AuditDTO {
  id: string
  name: string
  type: AuditType
  status: AuditStatus
  description: string
  frameworkIds: string[]
  leadAuditor: {
    id: string
    name: string
    organization?: string
    role?: string
    isExternal: boolean
  }
  auditTeam?: {
    id: string
    name: string
    organization?: string
    role?: string
    isExternal: boolean
  }[]
  schedule: {
    startDate: Date
    endDate: Date
  }
  scope?: string
  methodology?: string
  findings?: FindingListItemDTO[]
  isActive: boolean
  createdBy: string
  createdAt: Date
  updatedAt?: Date
}

export interface AuditListItemDTO {
  id: string
  name: string
  type: AuditType
  status: AuditStatus
  leadAuditor: {
    id: string
    name: string
    isExternal: boolean
  }
  schedule: {
    startDate: Date
    endDate: Date
  }
  findingCount: number
  frameworkCount: number
  isActive: boolean
  createdAt: Date
  updatedAt?: Date
}

export interface UpdateAuditStatusDTO {
  status: AuditStatus
}

export interface AuditFilterOptionsDTO {
  types?: AuditType[]
  statuses?: AuditStatus[]
  frameworkId?: string
  leadAuditorId?: string
  startDate?: Date
  endDate?: Date
  active?: boolean
  pageSize?: number
  pageNumber?: number
}

// Finding DTOs
export interface CreateFindingDTO {
  auditId: string
  title: string
  description: string
  type: FindingType
  severity: FindingSeverity
  controlIds?: string[]
  evidenceIds?: string[]
  dueDate?: Date
  remediationPlan?: {
    description: string
    dueDate: Date
    assignee: string
  }
}

export interface FindingDTO {
  id: string
  auditId: string
  title: string
  description: string
  type: FindingType
  severity: FindingSeverity
  status: FindingStatus
  controlIds?: string[]
  evidenceIds?: string[]
  dueDate?: Date
  remediationPlan?: {
    description: string
    dueDate: Date
    assignee: string
    status: FindingStatus
    lastUpdated: Date
    updatedBy: string
  }
  isOverdue: boolean
  isActive: boolean
  createdBy: string
  createdAt: Date
  updatedAt?: Date
}

export interface FindingListItemDTO {
  id: string
  auditId: string
  title: string
  type: FindingType
  severity: FindingSeverity
  status: FindingStatus
  dueDate?: Date
  assignee?: string
  hasRemediationPlan: boolean
  isOverdue: boolean
  createdAt: Date
  updatedAt?: Date
}

export interface UpdateFindingStatusDTO {
  status: FindingStatus
}

export interface AddRemediationPlanDTO {
  description: string
  dueDate: Date
  assignee: string
}

export interface UpdateRemediationPlanDTO {
  description?: string
  dueDate?: Date
  assignee?: string
  status?: FindingStatus
}

export interface FindingFilterOptionsDTO {
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
}

// Audit Template DTOs
export interface CreateAuditTemplateDTO {
  name: string
  description: string
  type: AuditType
  frameworkIds?: string[]
  controlIds?: string[]
  checklistItems?: {
    description: string
    category?: string
    required: boolean
  }[]
}

export interface AuditTemplateDTO {
  id: string
  name: string
  description: string
  type: AuditType
  frameworkIds?: string[]
  controlIds?: string[]
  checklistItems?: {
    id: string
    description: string
    category?: string
    required: boolean
  }[]
  isActive: boolean
  createdBy: string
  createdAt: Date
  updatedAt?: Date
}

export interface AuditTemplateListItemDTO {
  id: string
  name: string
  type: AuditType
  frameworkCount: number
  controlCount: number
  checklistItemCount: number
  isActive: boolean
  createdAt: Date
  updatedAt?: Date
}

export interface AuditStatisticsDTO {
  totalAudits: number
  byStatus: Record<AuditStatus, number>
  byType: Record<AuditType, number>
  findings: {
    total: number
    bySeverity: Record<FindingSeverity, number>
    byStatus: Record<FindingStatus, number>
    overdue: number
  }
}
export interface CreateAuditFromTemplateDTO {
  templateId: string
  name: string
  description?: string
  leadAuditor: {
    id: string
    name: string
    organization?: string
    role?: string
    isExternal: boolean
  }
  auditTeam?: {
    id: string
    name: string
    organization?: string
    role?: string
    isExternal: boolean
  }[]
  schedule: {
    startDate: Date
    endDate: Date
  }
  scope?: string
  methodology?: string
}
