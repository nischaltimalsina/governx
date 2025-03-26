import {
  EvidenceType,
  EvidenceStatus,
  EvidenceCollectionMethod
} from '../../domain/compliance/evidence_values';

/**
 * Data Transfer Objects for evidence-related use cases
 */

// Evidence DTOs
export interface CreateEvidenceDTO {
  title: string;
  controlIds: string[];
  file: {
    filename: string;
    path: string;
    size: number;
    mimeType: string;
    hash?: string;
  };
  type: EvidenceType;
  description?: string;
  collectionMethod?: EvidenceCollectionMethod;
  validityStartDate?: Date;
  validityEndDate?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface EvidenceDTO {
  id: string;
  title: string;
  controlIds: string[];
  file: {
    filename: string;
    path: string;
    size: number;
    mimeType: string;
    hash?: string;
  };
  type: EvidenceType;
  status: EvidenceStatus;
  collectionMethod: EvidenceCollectionMethod;
  description?: string;
  collectedAt: Date;
  validityPeriod?: {
    startDate: Date;
    endDate?: Date;
  };
  review?: {
    reviewerId: string;
    reviewedAt: Date;
    notes?: string;
  };
  tags?: string[];
  metadata?: Record<string, any>;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
  controls?: EvidenceControlDTO[];
}

export interface EvidenceControlDTO {
  id: string;
  code: string;
  title: string;
  implementationStatus: string;
  frameworkId: string;
  frameworkName: string | undefined;
}

export interface EvidenceListItemDTO {
  id: string;
  title: string;
  type: EvidenceType;
  status: EvidenceStatus;
  filename: string;
  controlCount: number;
  tags?: string[];
  collectedAt: Date;
  createdBy: string;
  updatedAt?: Date;
}

export interface ReviewEvidenceDTO {
  status: EvidenceStatus;
  notes?: string;
}

export interface LinkControlDTO {
  controlId: string;
}

export interface UpdateEvidenceTagsDTO {
  tags: string[];
}

export interface UpdateEvidenceMetadataDTO {
  metadata: Record<string, any>;
}

export interface EvidenceFilterOptionsDTO {
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
  search?: string;
}

export interface EvidenceStatsDTO {
  frameworkId: string;
  frameworkName: string;
  totalEvidence: number;
  approvedEvidence: number;
  pendingEvidence: number;
  rejectedEvidence: number;
  expiredEvidence: number;
  approvalRate: number;
}
