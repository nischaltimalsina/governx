import { Result } from '../../domain/common/result'
import { IAssetRepository } from '../../domain/asset/repositories'
import { UpdateAssetTechnicalDetailsDTO, AssetDTO } from '../dtos/asset_dtos'

/**
 * Use case for updating an asset's technical details
 */
export class UpdateAssetTechnicalDetailsUseCase {
  constructor(private assetRepository: IAssetRepository) {}

  /**
   * Execute the use case
   */
  public async execute(
    assetId: string,
    request: UpdateAssetTechnicalDetailsDTO,
    userId: string
  ): Promise<Result<AssetDTO, Error>> {
    // Get asset from repository
    const assetResult = await this.assetRepository.findById(assetId)

    if (!assetResult.isSuccess) {
      return Result.fail<AssetDTO>(assetResult.getError())
    }

    const asset = assetResult.getValue()

    if (!asset) {
      return Result.fail<AssetDTO>(new Error(`Asset with ID ${assetId} not found`))
    }

    // Update asset technical details
    const updateResult = asset.updateTechnicalDetails(
      {
        location: request.location,
        ipAddress: request.ipAddress,
        macAddress: request.macAddress,
        serialNumber: request.serialNumber,
      },
      userId
    )

    if (!updateResult.isSuccess) {
      return Result.fail<AssetDTO>(updateResult.getError())
    }

    // Save updated asset
    const saveResult = await this.assetRepository.save(asset)

    if (!saveResult.isSuccess) {
      return Result.fail<AssetDTO>(saveResult.getError())
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
