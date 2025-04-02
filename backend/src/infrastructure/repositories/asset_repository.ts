import { IAssetRepository } from '../../domain/asset/repositories'
import { Asset } from '../../domain/asset/asset'
import {
  AssetName,
  AssetType,
  AssetStatus,
  AssetOwner,
  AssetRiskLevel,
} from '../../domain/asset/asset_values'
import { Result } from '../../domain/common/result'
import { AssetModel, IAssetDocument } from './models/asset_schema'

/**
 * MongoDB implementation of the Asset repository
 */
export class MongoAssetRepository implements IAssetRepository {
  /**
   * Find an asset by ID
   */
  public async findById(id: string): Promise<Result<Asset | null, Error>> {
    try {
      const assetDoc = await AssetModel.findById(id)

      if (!assetDoc) {
        return Result.ok<null>(null)
      }

      return this.mapDocumentToDomain(assetDoc)
    } catch (error) {
      return Result.fail<Asset | null>(
        error instanceof Error ? error : new Error(`Failed to find asset with id ${id}`)
      )
    }
  }

  /**
   * Find all assets with optional filters
   */
  public async findAll(options?: {
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
  }): Promise<Result<Asset[], Error>> {
    try {
      // Build query
      const query: any = {}

      if (options?.types && options.types.length > 0) {
        query.type = { $in: options.types }
      }

      if (options?.statuses && options.statuses.length > 0) {
        query.status = { $in: options.statuses }
      }

      if (options?.riskLevels && options.riskLevels.length > 0) {
        query.riskLevel = { $in: options.riskLevels }
      }

      if (options?.ownerId) {
        query['owner.userId'] = options.ownerId
      }

      if (options?.controlId) {
        query.controlIds = options.controlId
      }

      if (options?.tags && options.tags.length > 0) {
        query.tags = { $in: options.tags }
      }

      // Handle nearing end of life filter
      if (options?.nearingEndOfLife) {
        const now = new Date()
        const thresholdDate = new Date(now)
        thresholdDate.setDate(thresholdDate.getDate() + 90) // 90 days threshold

        query.endOfLifeDate = {
          $gt: now,
          $lte: thresholdDate,
        }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      // Create query with pagination
      let assetDocs: IAssetDocument[]

      if (options?.pageSize && options?.pageNumber) {
        const skip = (options.pageNumber - 1) * options.pageSize
        assetDocs = await AssetModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(options.pageSize)
      } else {
        assetDocs = await AssetModel.find(query).sort({ createdAt: -1 })
      }

      // Map documents to domain entities
      const assets: Asset[] = []

      for (const doc of assetDocs) {
        const assetResult = await this.mapDocumentToDomain(doc)

        if (assetResult.isSuccess) {
          assets.push(assetResult.getValue())
        }
      }

      return Result.ok<Asset[]>(assets)
    } catch (error) {
      return Result.fail<Asset[]>(
        error instanceof Error ? error : new Error('Failed to find assets')
      )
    }
  }

  /**
   * Find assets by owner
   */
  public async findByOwner(
    ownerId: string,
    options?: {
      statuses?: AssetStatus[]
      active?: boolean
    }
  ): Promise<Result<Asset[], Error>> {
    try {
      // Build query
      const query: any = {
        'owner.userId': ownerId,
      }

      if (options?.statuses && options.statuses.length > 0) {
        query.status = { $in: options.statuses }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      const assetDocs = await AssetModel.find(query).sort({ createdAt: -1 })

      // Map documents to domain entities
      const assets: Asset[] = []

      for (const doc of assetDocs) {
        const assetResult = await this.mapDocumentToDomain(doc)

        if (assetResult.isSuccess) {
          assets.push(assetResult.getValue())
        }
      }

      return Result.ok<Asset[]>(assets)
    } catch (error) {
      return Result.fail<Asset[]>(
        error instanceof Error ? error : new Error(`Failed to find assets for owner ${ownerId}`)
      )
    }
  }

  /**
   * Find assets by control ID
   */
  public async findByControlId(
    controlId: string,
    options?: {
      statuses?: AssetStatus[]
      active?: boolean
    }
  ): Promise<Result<Asset[], Error>> {
    try {
      // Build query
      const query: any = {
        controlIds: controlId,
      }

      if (options?.statuses && options.statuses.length > 0) {
        query.status = { $in: options.statuses }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      const assetDocs = await AssetModel.find(query).sort({ createdAt: -1 })

      // Map documents to domain entities
      const assets: Asset[] = []

      for (const doc of assetDocs) {
        const assetResult = await this.mapDocumentToDomain(doc)

        if (assetResult.isSuccess) {
          assets.push(assetResult.getValue())
        }
      }

      return Result.ok<Asset[]>(assets)
    } catch (error) {
      return Result.fail<Asset[]>(
        error instanceof Error ? error : new Error(`Failed to find assets for control ${controlId}`)
      )
    }
  }

  /**
   * Save an asset to the repository
   */
  public async save(asset: Asset): Promise<Result<void, Error>> {
    try {
      // Prepare owner data if exists
      let ownerData = undefined

      if (asset.owner) {
        ownerData = {
          userId: asset.owner.getUserId(),
          name: asset.owner.getName(),
          department: asset.owner.getDepartment(),
          assignedAt: asset.owner.getAssignedAt(),
        }
      }

      const assetData: any = {
        name: asset.name.getValue(),
        type: asset.type,
        status: asset.status,
        description: asset.description,
        owner: ownerData,
        riskLevel: asset.riskLevel,
        location: asset.location,
        ipAddress: asset.ipAddress,
        macAddress: asset.macAddress,
        serialNumber: asset.serialNumber,
        purchaseDate: asset.purchaseDate,
        endOfLifeDate: asset.endOfLifeDate,
        tags: asset.tags,
        metadata: asset.metadata,
        controlIds: asset.controlIds,
        relatedAssetIds: asset.relatedAssetIds,
        isActive: asset.isActive,
        createdBy: asset.createdBy,
        updatedBy: asset.updatedBy,
        // MongoDB will handle createdAt/updatedAt
      }

      await AssetModel.findByIdAndUpdate(asset.id, assetData, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      })

      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error ? error : new Error(`Failed to save asset with id ${asset.id}`)
      )
    }
  }

  /**
   * Delete an asset from the repository
   */
  public async delete(assetId: string): Promise<Result<void, Error>> {
    try {
      await AssetModel.findByIdAndDelete(assetId)
      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error ? error : new Error(`Failed to delete asset with id ${assetId}`)
      )
    }
  }

  /**
   * Count assets with optional filters
   */
  public async count(options?: {
    types?: AssetType[]
    statuses?: AssetStatus[]
    riskLevels?: AssetRiskLevel[]
    ownerId?: string
    controlId?: string
    nearingEndOfLife?: boolean
    active?: boolean
  }): Promise<Result<number, Error>> {
    try {
      // Build query
      const query: any = {}

      if (options?.types && options.types.length > 0) {
        query.type = { $in: options.types }
      }

      if (options?.statuses && options.statuses.length > 0) {
        query.status = { $in: options.statuses }
      }

      if (options?.riskLevels && options.riskLevels.length > 0) {
        query.riskLevel = { $in: options.riskLevels }
      }

      if (options?.ownerId) {
        query['owner.userId'] = options.ownerId
      }

      if (options?.controlId) {
        query.controlIds = options.controlId
      }

      // Handle nearing end of life filter
      if (options?.nearingEndOfLife) {
        const now = new Date()
        const thresholdDate = new Date(now)
        thresholdDate.setDate(thresholdDate.getDate() + 90) // 90 days threshold

        query.endOfLifeDate = {
          $gt: now,
          $lte: thresholdDate,
        }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      const count = await AssetModel.countDocuments(query)

      return Result.ok<number>(count)
    } catch (error) {
      return Result.fail<number>(
        error instanceof Error ? error : new Error('Failed to count assets')
      )
    }
  }

  /**
   * Map a MongoDB document to a domain Asset entity
   */
  private async mapDocumentToDomain(doc: IAssetDocument): Promise<Result<Asset, Error>> {
    try {
      // Create value objects
      const nameOrError = AssetName.create(doc.name)
      if (!nameOrError.isSuccess) {
        return Result.fail<Asset>(nameOrError.getError())
      }

      // Create owner if exists
      let owner: AssetOwner | undefined
      if (doc.owner) {
        const ownerOrError = AssetOwner.create(
          doc.owner.userId,
          doc.owner.name,
          doc.owner.department,
          doc.owner.assignedAt
        )
        if (!ownerOrError.isSuccess) {
          return Result.fail<Asset>(ownerOrError.getError())
        }
        owner = ownerOrError.getValue()
      }

      // Create Asset entity
      return Asset.create(doc._id.toString(), {
        name: nameOrError.getValue(),
        type: doc.type as AssetType,
        status: doc.status as AssetStatus,
        description: doc.description,
        owner,
        riskLevel: doc.riskLevel as AssetRiskLevel | undefined,
        location: doc.location,
        ipAddress: doc.ipAddress,
        macAddress: doc.macAddress,
        serialNumber: doc.serialNumber,
        purchaseDate: doc.purchaseDate,
        endOfLifeDate: doc.endOfLifeDate,
        tags: doc.tags,
        metadata: doc.metadata,
        controlIds: doc.controlIds,
        relatedAssetIds: doc.relatedAssetIds,
        isActive: doc.isActive,
        createdBy: doc.createdBy,
        createdAt: doc.createdAt,
      })
    } catch (error) {
      return Result.fail<Asset>(
        error instanceof Error
          ? error
          : new Error(`Failed to map asset document to domain: ${error}`)
      )
    }
  }
}
