import mongoose from 'mongoose'
import { Result } from '../common/result'
import { IAssetRepository } from './repositories'
import { Asset } from './asset'
import { AssetName, AssetType, AssetStatus, AssetOwner, AssetRiskLevel } from './asset_values'
import { IControlRepository } from '../compliance/framework_repository'

/**
 * Asset management service
 * Handles domain operations related to asset management
 */
export class AssetManagementService {
  constructor(
    private assetRepository: IAssetRepository,
    private controlRepository: IControlRepository
  ) {}

  /**
   * Create a new asset
   */
  public async createAsset(
    name: AssetName,
    type: AssetType,
    description: string,
    userId: string,
    options?: {
      status?: AssetStatus
      owner?: AssetOwner
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
  ): Promise<Result<Asset, Error>> {
    // Verify controls if provided
    if (options?.controlIds && options.controlIds.length > 0) {
      for (const controlId of options.controlIds) {
        const controlResult = await this.controlRepository.findById(controlId)

        if (!controlResult.isSuccess) {
          return Result.fail<Asset>(controlResult.getError())
        }

        const control = controlResult.getValue()

        if (!control) {
          return Result.fail<Asset>(new Error(`Control with ID ${controlId} not found`))
        }
      }
    }

    // Verify related assets if provided
    if (options?.relatedAssetIds && options.relatedAssetIds.length > 0) {
      for (const assetId of options.relatedAssetIds) {
        const assetResult = await this.assetRepository.findById(assetId)

        if (!assetResult.isSuccess) {
          return Result.fail<Asset>(assetResult.getError())
        }

        const asset = assetResult.getValue()

        if (!asset) {
          return Result.fail<Asset>(new Error(`Related asset with ID ${assetId} not found`))
        }
      }
    }

    // Create asset entity
    const assetId = new mongoose.Types.ObjectId().toString()
    const assetResult = Asset.create(assetId, {
      name,
      type,
      description,
      status: options?.status,
      owner: options?.owner,
      riskLevel: options?.riskLevel,
      location: options?.location,
      ipAddress: options?.ipAddress,
      macAddress: options?.macAddress,
      serialNumber: options?.serialNumber,
      purchaseDate: options?.purchaseDate,
      endOfLifeDate: options?.endOfLifeDate,
      tags: options?.tags,
      metadata: options?.metadata,
      controlIds: options?.controlIds,
      relatedAssetIds: options?.relatedAssetIds,
      createdBy: userId,
    })

    if (!assetResult.isSuccess) {
      return Result.fail<Asset>(assetResult.getError())
    }

    const asset = assetResult.getValue()

    // Save asset to repository
    const saveResult = await this.assetRepository.save(asset)

    if (!saveResult.isSuccess) {
      return Result.fail<Asset>(saveResult.getError())
    }

    return Result.ok<Asset>(asset)
  }

  /**
   * Assign an owner to an asset
   */
  public async assignAssetOwner(
    assetId: string,
    ownerId: string,
    ownerName: string,
    ownerDepartment: string,
    userId: string
  ): Promise<Result<Asset, Error>> {
    // Find asset
    const assetResult = await this.assetRepository.findById(assetId)

    if (!assetResult.isSuccess) {
      return Result.fail<Asset>(assetResult.getError())
    }

    const asset = assetResult.getValue()

    if (!asset) {
      return Result.fail<Asset>(new Error(`Asset with ID ${assetId} not found`))
    }

    // Create owner
    const ownerResult = AssetOwner.create(ownerId, ownerName, ownerDepartment)

    if (!ownerResult.isSuccess) {
      return Result.fail<Asset>(ownerResult.getError())
    }

    // Assign owner to asset
    const assignResult = asset.assignOwner(ownerResult.getValue(), userId)

    if (!assignResult.isSuccess) {
      return Result.fail<Asset>(assignResult.getError())
    }

    // Save updated asset
    const saveResult = await this.assetRepository.save(asset)

    if (!saveResult.isSuccess) {
      return Result.fail<Asset>(saveResult.getError())
    }

    return Result.ok<Asset>(asset)
  }

  /**
   * Link an asset to a control
   */
  public async linkAssetToControl(
    assetId: string,
    controlId: string,
    userId: string
  ): Promise<Result<Asset, Error>> {
    // Find asset
    const assetResult = await this.assetRepository.findById(assetId)

    if (!assetResult.isSuccess) {
      return Result.fail<Asset>(assetResult.getError())
    }

    const asset = assetResult.getValue()

    if (!asset) {
      return Result.fail<Asset>(new Error(`Asset with ID ${assetId} not found`))
    }

    // Verify control exists
    const controlResult = await this.controlRepository.findById(controlId)

    if (!controlResult.isSuccess) {
      return Result.fail<Asset>(controlResult.getError())
    }

    const control = controlResult.getValue()

    if (!control) {
      return Result.fail<Asset>(new Error(`Control with ID ${controlId} not found`))
    }

    // Link control to asset
    const linkResult = asset.linkControl(controlId, userId)

    if (!linkResult.isSuccess) {
      return Result.fail<Asset>(linkResult.getError())
    }

    // Save updated asset
    const saveResult = await this.assetRepository.save(asset)

    if (!saveResult.isSuccess) {
      return Result.fail<Asset>(saveResult.getError())
    }

    return Result.ok<Asset>(asset)
  }

  /**
   * Get assets nearing end of life
   */
  public async getAssetsNearingEndOfLife(
    thresholdDays: number = 90
  ): Promise<Result<Asset[], Error>> {
    // Find assets nearing end of life
    return await this.assetRepository.findAll({
      nearingEndOfLife: true,
      active: true,
    })
  }

  /**
   * Get asset inventory statistics
   */
  public async getAssetStatistics(): Promise<
    Result<
      {
        totalAssets: number
        byType: Record<AssetType, number>
        byStatus: Record<AssetStatus, number>
        byRiskLevel: Record<AssetRiskLevel, number>
        endOfLifeSummary: {
          expired: number
          expiringSoon: number
          healthy: number
        }
      },
      Error
    >
  > {
    try {
      // Get total assets
      const totalResult = await this.assetRepository.count({ active: true })
      if (!totalResult.isSuccess) {
        return Result.fail(totalResult.getError())
      }
      const totalAssets = totalResult.getValue()

      // Initialize empty statistics objects
      const byType: Partial<Record<AssetType, number>> = {}
      const byStatus: Partial<Record<AssetStatus, number>> = {}
      const byRiskLevel: Partial<Record<AssetRiskLevel, number>> = {}

      // Get assets by type
      for (const type of Object.values(AssetType)) {
        const countResult = await this.assetRepository.count({
          types: [type],
          active: true,
        })

        if (countResult.isSuccess) {
          byType[type] = countResult.getValue()
        }
      }

      // Get assets by status
      for (const status of Object.values(AssetStatus)) {
        const countResult = await this.assetRepository.count({
          statuses: [status],
          active: true,
        })

        if (countResult.isSuccess) {
          byStatus[status] = countResult.getValue()
        }
      }

      // Get assets by risk level
      for (const riskLevel of Object.values(AssetRiskLevel)) {
        const countResult = await this.assetRepository.count({
          riskLevels: [riskLevel],
          active: true,
        })

        if (countResult.isSuccess) {
          byRiskLevel[riskLevel] = countResult.getValue()
        }
      }

      // Get end of life statistics
      const now = new Date()
      const endOfLifeAssetsResult = await this.assetRepository.findAll({
        active: true,
      })

      if (!endOfLifeAssetsResult.isSuccess) {
        return Result.fail(endOfLifeAssetsResult.getError())
      }

      const assets = endOfLifeAssetsResult.getValue()
      const endOfLifeSummary = {
        expired: 0,
        expiringSoon: 0,
        healthy: 0,
      }

      for (const asset of assets) {
        if (asset.isEndOfLifeReached()) {
          endOfLifeSummary.expired++
        } else if (asset.isNearingEndOfLife(90, now)) {
          endOfLifeSummary.expiringSoon++
        } else if (asset.endOfLifeDate) {
          endOfLifeSummary.healthy++
        }
      }

      return Result.ok({
        totalAssets,
        byType: byType as Record<AssetType, number>,
        byStatus: byStatus as Record<AssetStatus, number>,
        byRiskLevel: byRiskLevel as Record<AssetRiskLevel, number>,
        endOfLifeSummary,
      })
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Error getting asset statistics')
      )
    }
  }
}
