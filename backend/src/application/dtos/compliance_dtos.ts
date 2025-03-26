import {
  ImplementationStatus,
  AssessmentResult,
  EvidenceStatus
} from '../../domain/compliance/values';

/**
 * Data Transfer Objects for compliance-related use cases
 */

// Framework DTOs
export interface CreateFrameworkDTO {
  name: string;
  version: string;
  description: string;
  organization?: string;
  category?: string;
  website?: string;
  isActive?: boolean;
}

export interface FrameworkDTO {
  id: string;
  name: string;
  version: string;
  description: string;
  organization?: string;
  category?: string;
  website?: string;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
  controlStats?: {
    totalControls: number;
    implementedControls: number;
    partiallyImplementedControls: number;
    notImplementedControls: number;
    notApplicableControls: number;
    implementationRate: number;
  };
}

export interface FrameworkListItemDTO {
  id: string;
  name: string;
  version: string;
  organization?: string;
  category?: string;
  isActive: boolean;
  controlCount: number;
  implementationRate: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface UpdateFrameworkDTO {
  description?: string;
  organization?: string;
  category?: string;
  website?: string;
  isActive?: boolean;
}

// Control DTOs
export interface CreateControlDTO {
  frameworkId: string;
  code: string;
  title: string;
  description: string;
  guidance?: string;
  implementationStatus?: ImplementationStatus;
  implementationDetails?: string;
  ownerId?: string;
  categories?: string[];
  parentControlId?: string;
  isActive?: boolean;
}

export interface ControlDTO {
  id: string;
  frameworkId: string;
  code: string;
  title: string;
  description: string;
  guidance?: string;
  implementationStatus: ImplementationStatus;
  implementationDetails?: string;
  ownerId?: string;
  categories?: string[];
  parentControlId?: string;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
  relatedControls?: RelatedControlDTO[];
  evidenceCount?: number;
}

export interface RelatedControlDTO {
  id: string;
  frameworkId: string;
  code: string;
  title: string;
  relationship: 'parent' | 'child' | 'reference';
}

export interface ControlListItemDTO {
  id: string;
  frameworkId: string;
  code: string;
  title: string;
  implementationStatus: ImplementationStatus;
  categories?: string[];
  ownerId?: string;
  isActive: boolean;
  updatedAt?: Date;
}

export interface UpdateControlDTO {
  title?: string;
  description?: string;
  guidance?: string;
  categories?: string[];
  isActive?: boolean;
}

export interface UpdateControlImplementationDTO {
  implementationStatus: ImplementationStatus;
  implementationDetails?: string;
}

export interface AssignControlOwnerDTO {
  ownerId: string;
}

// Framework compliance status DTO
export interface FrameworkComplianceStatusDTO {
  frameworkId: string;
  frameworkName: string;
  frameworkVersion: string;
  totalControls: number;
  implementedControls: number;
  partiallyImplementedControls: number;
  notImplementedControls: number;
  notApplicableControls: number;
  implementationRate: number;
}

// Control filter options DTO
export interface ControlFilterOptionsDTO {
  frameworkId?: string;
  implementationStatus?: ImplementationStatus[];
  categories?: string[];
  ownerId?: string;
  isActive?: boolean;
  search?: string;
}
