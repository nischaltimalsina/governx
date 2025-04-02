import { Result } from '../../domain/common/result'
import { IAssetRepository } from '../../domain/asset/repositories'
import { AssetListItemDTO, AssetFilterOptionsDTO } from '../dtos/asset_dtos'

/**
 * Use case for listing assets with optional filters
 */
export class ListAssetsUseCase {
  constructor(private assetRepository: IAssetRepository) {}

  /**
   * Execute the use case
   */
  public async execute(
    options?: AssetFilterOptionsDTO
  ): Promise<Result<AssetListItemDTO[], Error>> {
    // Define repository filter options
    const repoOptions: any = {}

    if (options?.types && options.types.length > 0) {
      repoOptions.types = options.types
    }

    if (options?.statuses && options.statuses.length > 0) {
      repoOptions.statuses = options.statuses
    }

    if (options?.riskLevels && options.riskLevels.length > 0) {
      repoOptions.riskLevels = options.riskLevels
    }

    if (options?.ownerId) {
      repoOptions.ownerId = options.ownerId
    }

    if (options?.controlId) {
      repoOptions.controlId = options.controlId
    }

    if (options?.tags && options.tags.length > 0) {
      repoOptions.tags = options.tags
    }

    if (options?.nearingEndOfLife !== undefined) {
      repoOptions.nearingEndOfLife = options.nearingEndOfLife
    }

    if (options?.active !== undefined) {
      repoOptions.active = options.active
    }

    if (options?.pageSize) {
      repoOptions.pageSize = options.pageSize
    }

    if (options?.pageNumber) {
      repoOptions.pageNumber = options.pageNumber
    }

    // Get assets from repository
    const assetsResult = await this.assetRepository.findAll(repoOptions)

    if (!assetsResult.isSuccess) {
      return Result.fail<AssetListItemDTO[]>(assetsResult.getError())
    }

    const assets = assetsResult.getValue()

    // Map domain entities to DTOs
    const assetDTOs: AssetListItemDTO[] = assets.map((asset) => ({
      id: asset.id,
      name: asset.name.getValue(),
      type: asset.type,
      status: asset.status,
      riskLevel: asset.riskLevel,
      owner: asset.owner
        ? {
            id: asset.owner.getUserId(),
            name: asset.owner.getName(),
          }
        : undefined,
      location: asset.location,
      endOfLifeDate: asset.endOfLifeDate,
      isNearingEndOfLife: asset.isNearingEndOfLife(),
      isEndOfLifeReached: asset.isEndOfLifeReached(),
      controlCount: asset.controlIds?.length || 0,
      tags: asset.tags,
      isActive: asset.isActive,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    }))

    return Result.ok<AssetListItemDTO[]>(assetDTOs)
  }
}
