import { Result } from '../../domain/common/result'
import { IAssetRepository } from '../../domain/asset/repositories'
import { AssetDTO } from '../dtos/asset_dtos'

/**
 * Use case for retrieving an asset by ID
 */
export class GetAssetUseCase {
  constructor(private assetRepository: IAssetRepository) {}

  /**
   * Execute the use case
   * @param assetId The ID of the asset to retrieve
   */
  public async execute(assetId: string): Promise<Result<AssetDTO | null, Error>> {
    // Get asset from repository
    const assetResult = await this.assetRepository.findById(assetId)

    if (!assetResult.isSuccess) {
      return Result.fail<AssetDTO | null>(assetResult.getError())
    }

    const asset = assetResult.getValue()

    if (!asset) {
      return Result.ok<null>(null)
    }

    // Map domain entity to DTO
    return Result.ok<AssetDTO>({
      id: asset.id,
      name: asset.name.getValue(),
      type: asset.type,
      status: asset.status,
      description: asset.description,
      owner: asset.owner
        ? {
            id: asset.owner.getUserId(),
            name: asset.owner.getName(),
            department: asset.owner.getDepartment(),
            assignedAt: asset.owner.getAssignedAt(),
          }
        : undefined,
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
      isNearingEndOfLife: asset.isNearingEndOfLife(),
      isEndOfLifeReached: asset.isEndOfLifeReached(),
      isActive: asset.isActive,
      createdBy: asset.createdBy,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    })
  }
}
