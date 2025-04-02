import { AssetType, AssetStatus, AssetRiskLevel } from '../../domain/asset/asset_values'

/**
 * Data Transfer Objects for asset-related use cases
 */

// Asset DTOs
export interface CreateAssetDTO {
  name: string
  type: AssetType
  description: string
  status?: AssetStatus
  owner?: {
    id: string
    name: string
    department: string
  }
  riskLevel?: AssetRiskLevel
  location?: string
  ipAddress?: string
  macAddress?: string
  serialNumber?: string
  purchaseDate?: Date
  endOfLifeDate?: Date
  tags?: string[]
  metadata?: Record<string, any>
  controlIds?: string[]
  relatedAssetIds?: string[]
}

export interface AssetDTO {
  id: string
  name: string
  type: AssetType
  status: AssetStatus
  description: string
  owner?: {
    id: string
    name: string
    department: string
    assignedAt: Date
  }
  riskLevel?: AssetRiskLevel
  location?: string
  ipAddress?: string
  macAddress?: string
  serialNumber?: string
  purchaseDate?: Date
  endOfLifeDate?: Date
  tags?: string[]
  metadata?: Record<string, any>
  controlIds?: string[]
  relatedAssetIds?: string[]
  isNearingEndOfLife: boolean
  isEndOfLifeReached: boolean
  isActive: boolean
  createdBy: string
  createdAt: Date
  updatedAt?: Date
}

export interface AssetListItemDTO {
  id: string
  name: string
  type: AssetType
  status: AssetStatus
  riskLevel?: AssetRiskLevel
  owner?: {
    id: string
    name: string
  }
  location?: string
  endOfLifeDate?: Date
  isNearingEndOfLife: boolean
  isEndOfLifeReached: boolean
  controlCount: number
  tags?: string[]
  isActive: boolean
  createdAt: Date
  updatedAt?: Date
}

export interface UpdateAssetStatusDTO {
  status: AssetStatus
}

export interface UpdateAssetRiskLevelDTO {
  riskLevel: AssetRiskLevel
}

export interface AssignAssetOwnerDTO {
  ownerId: string
  ownerName: string
  ownerDepartment: string
}

export interface UpdateAssetTechnicalDetailsDTO {
  location?: string
  ipAddress?: string
  macAddress?: string
  serialNumber?: string
}

export interface UpdateAssetLifecycleDatesDTO {
  purchaseDate?: Date
  endOfLifeDate?: Date
}

export interface UpdateAssetTagsDTO {
  tags: string[]
}

export interface UpdateAssetMetadataDTO {
  metadata: Record<string, any>
}

export interface LinkControlDTO {
  controlId: string
}

export interface LinkAssetDTO {
  assetId: string
}

export interface AssetFilterOptionsDTO {
  types?: AssetType[]
  statuses?: AssetStatus[]
  riskLevels?: AssetRiskLevel[]
  ownerId?: string
  controlId?: string
  tags?: string[]
  nearingEndOfLife?: boolean
  active?: boolean
  search?: string
  pageSize?: number
  pageNumber?: number
}

export interface AssetStatisticsDTO {
  totalAssets: number
  byType: Record<AssetType, number>
  byStatus: Record<AssetStatus, number>
  byRiskLevel: Record<AssetRiskLevel, number>
  endOfLifeSummary: {
    expired: number
    expiringSoon: number
    healthy: number
  }
}
