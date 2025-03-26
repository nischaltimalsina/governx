import {
  PolicyType,
  PolicyStatus,
  PolicyFormat
} from '../../domain/compliance/policy_values';

/**
 * Data Transfer Objects for policy-related use cases
 */

// Policy DTOs
export interface CreatePolicyDTO {
  name: string;
  type: PolicyType;
  description: string;
  content?: string;
  document?: {
    url?: string;
    path?: string;
    format: PolicyFormat;
  };
  owner: string;
  relatedControlIds?: string[];
  effectiveStartDate?: Date;
  effectiveEndDate?: Date;
  reviewDate?: Date;
  tags?: string[];
}

export interface PolicyDTO {
  id: string;
  name: string;
  version: string;
  type: PolicyType;
  status: PolicyStatus;
  description: string;
  content?: string;
  document?: {
    url?: string;
    path?: string;
    format: PolicyFormat;
  };
  relatedControlIds?: string[];
  owner: string;
  approvers?: ApproverDTO[];
  effectivePeriod?: {
    startDate: Date;
    endDate?: Date;
  };
  reviewDate?: Date;
  isEffective: boolean;
  isReviewDue: boolean;
  tags?: string[];
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
  controls?: PolicyControlDTO[];
}

export interface ApproverDTO {
  userId: string;
  name: string;
  title: string;
  approvedAt: Date;
  comments?: string;
}

export interface PolicyControlDTO {
  id: string;
  code: string;
  title: string;
  implementationStatus: string;
  frameworkId: string;
  frameworkName: string;
}

export interface PolicyListItemDTO {
  id: string;
  name: string;
  version: string;
  type: PolicyType;
  status: PolicyStatus;
  owner: string;
  ownerName?: string;
  effectiveStartDate?: Date;
  effectiveEndDate?: Date;
  reviewDate?: Date;
  isEffective: boolean;
  isReviewDue: boolean;
  controlCount: number;
  tags?: string[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface PolicyVersionDTO {
  id: string;
  version: string;
  status: PolicyStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateVersionDTO {
  description: string;
  content?: string;
  document?: {
    url?: string;
    path?: string;
    format: PolicyFormat;
  };
}

export interface ApprovePolicyDTO {
  approverName: string;
  approverTitle: string;
  comments?: string;
}

export interface PublishPolicyDTO {
  effectiveStartDate: Date;
  effectiveEndDate?: Date;
  reviewDate?: Date;
}

export interface LinkControlDTO {
  controlId: string;
}

export interface UpdatePolicyTagsDTO {
  tags: string[];
}

export interface PolicyFilterOptionsDTO {
  type?: PolicyType[];
  status?: PolicyStatus[];
  owner?: string;
  controlId?: string;
  tags?: string[];
  effectiveOnly?: boolean;
  reviewDue?: boolean;
  active?: boolean;
  search?: string;
  pageSize?: number;
  pageNumber?: number;
}

export interface PolicyStatsDTO {
  total: number;
  byType: Record<PolicyType, number>;
  byStatus: Record<PolicyStatus, number>;
  dueForReview: number;
  effectiveNow: number;
}
