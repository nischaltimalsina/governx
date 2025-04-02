import { Result } from '../common/result'
import { Asset } from './asset'
import { AssetType, AssetStatus, AssetRiskLevel } from './asset_values'

/**
 * Asset repository interface
 */
export interface IAssetRepository {
  /**
   * Find an asset by ID
   */
  findById(id: string): Promise<Result<Asset | null, Error>>

  /**
   * Find all assets with optional filters
   */
  findAll(options?: {
    types?: AssetType[]
    statuses?: AssetStatus[]
    riskLevels?: AssetRiskLevel[]
    ownerId?: string
    controlId?: string
    tags?: string[]
    nearingEndOfLife?: boolean
    active?: boolean
    pageSize?: number
    pageNumber?: number
  }): Promise<Result<Asset[], Error>>

  /**
   * Find assets by owner
   */
  findByOwner(
    ownerId: string,
    options?: {
      statuses?: AssetStatus[]
      active?: boolean
    }
  ): Promise<Result<Asset[], Error>>

  /**
   * Find assets by control ID
   */
  findByControlId(
    controlId: string,
    options?: {
      statuses?: AssetStatus[]
      active?: boolean
    }
  ): Promise<Result<Asset[], Error>>

  /**
   * Save an asset to the repository
   */
  save(asset: Asset): Promise<Result<void, Error>>

  /**
   * Delete an asset from the repository
   */
  delete(assetId: string): Promise<Result<void, Error>>

  /**
   * Count assets with optional filters
   */
  count(options?: {
    types?: AssetType[]
    statuses?: AssetStatus[]
    riskLevels?: AssetRiskLevel[]
    ownerId?: string
    controlId?: string
    nearingEndOfLife?: boolean
    active?: boolean
  }): Promise<Result<number, Error>>
}
