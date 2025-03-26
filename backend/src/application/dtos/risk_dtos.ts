import {
  RiskCategory,
  RiskStatus,
  RiskSeverity,
  RiskImpact,
  RiskLikelihood,
  TreatmentType,
  TreatmentStatus
} from '../../domain/risk/risk_values';

/**
 * Data Transfer Objects for risk-related use cases
 */

// Risk DTOs
export interface CreateRiskDTO {
  name: string;
  description: string;
  category: RiskCategory;
  inherentImpact: RiskImpact;
  inherentLikelihood: RiskLikelihood;
  residualImpact?: RiskImpact;
  residualLikelihood?: RiskLikelihood;
  owner?: {
    id: string;
    name: string;
    department: string;
  };
  relatedControlIds?: string[];
  relatedAssets?: string[];
  reviewPeriodMonths?: number;
  tags?: string[];
}

export interface RiskDTO {
  id: string;
  name: string;
  description: string;
  category: RiskCategory;
  status: RiskStatus;
  inherentImpact: RiskImpact;
  inherentLikelihood: RiskLikelihood;
  inherentRiskScore: {
    value: number;
    severity: RiskSeverity;
  };
  residualImpact?: RiskImpact;
  residualLikelihood?: RiskLikelihood;
  residualRiskScore?: {
    value: number;
    severity: RiskSeverity;
  };
  riskReductionPercentage?: number;
  owner?: {
    id: string;
    name: string;
    department: string;
    assignedAt: Date;
  };
  relatedControlIds?: string[];
  relatedAssets?: string[];
  reviewPeriod?: {
    months: number;
    lastReviewed?: Date;
    nextReviewDate?: Date;
    isReviewDue: boolean;
  };
  tags?: string[];
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
  controls?: RiskControlDTO[];
  treatments?: RiskTreatmentSummaryDTO[];
}

export interface RiskControlDTO {
  id: string;
  code: string;
  title: string;
  implementationStatus: string;
  frameworkId: string;
  frameworkName: string;
}

export interface RiskListItemDTO {
  id: string;
  name: string;
  category: RiskCategory;
  status: RiskStatus;
  inherentRiskScore: {
    value: number;
    severity: RiskSeverity;
  };
  residualRiskScore?: {
    value: number;
    severity: RiskSeverity;
  };
  owner?: {
    id: string;
    name: string;
  };
  isReviewDue: boolean;
  treatmentCount: number;
  tags?: string[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface UpdateRiskAssessmentDTO {
  inherentImpact: RiskImpact;
  inherentLikelihood: RiskLikelihood;
  residualImpact?: RiskImpact;
  residualLikelihood?: RiskLikelihood;
}

export interface AssignRiskOwnerDTO {
  ownerId: string;
  ownerName: string;
  ownerDepartment: string;
}

export interface SetReviewPeriodDTO {
  months: number;
}

export interface UpdateRiskStatusDTO {
  status: RiskStatus;
}

export interface UpdateRiskTagsDTO {
  tags: string[];
}

// Risk Treatment DTOs
export interface CreateRiskTreatmentDTO {
  riskId: string;
  name: string;
  description: string;
  type: TreatmentType;
  status?: TreatmentStatus;
  dueDate?: Date;
  assignee?: string;
  cost?: number;
  relatedControlIds?: string[];
}

export interface RiskTreatmentDTO {
  id: string;
  riskId: string;
  name: string;
  description: string;
  type: TreatmentType;
  status: TreatmentStatus;
  progressPercentage: number;
  dueDate?: Date;
  completedDate?: Date;
  isOverdue: boolean;
  assignee?: string;
  assigneeName?: string;
  cost?: number;
  relatedControlIds?: string[];
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface RiskTreatmentSummaryDTO {
  id: string;
  name: string;
  type: TreatmentType;
  status: TreatmentStatus;
  progressPercentage: number;
  dueDate?: Date;
  isOverdue: boolean;
}

export interface UpdateTreatmentStatusDTO {
  status: TreatmentStatus;
}

export interface UpdateTreatmentDTO {
  name?: string;
  description?: string;
  dueDate?: Date;
  assignee?: string;
  cost?: number;
}

export interface RiskFilterOptionsDTO {
  categories?: RiskCategory[];
  statuses?: RiskStatus[];
  severities?: RiskSeverity[];
  ownerId?: string;
  controlId?: string;
  assetId?: string;
  tags?: string[];
  reviewDue?: boolean;
  active?: boolean;
  search?: string;
  pageSize?: number;
  pageNumber?: number;
}

export interface TreatmentFilterOptionsDTO {
  riskId?: string;
  statuses?: TreatmentStatus[];
  assignee?: string;
  overdue?: boolean;
  active?: boolean;
  search?: string;
  pageSize?: number;
  pageNumber?: number;
}

export interface RiskStatisticsDTO {
  totalRisks: number;
  bySeverity: Record<RiskSeverity, number>;
  byStatus: Record<RiskStatus, number>;
  byCategory: Record<RiskCategory, number>;
  treatmentProgress: {
    total: number;
    implemented: number;
    inProgress: number;
    planned: number;
    implementationRate: number;
  };
}
