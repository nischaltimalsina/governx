import { Result } from '../../domain/common/result'
import { AssetManagementService } from '../../domain/asset/asset_service'
import { AssetName, AssetOwner } from '../../domain/asset/asset_values'
import { CreateAssetDTO, AssetDTO } from '../dtos/asset_dtos'

/**
 * Use case for creating a new asset
 */
export class CreateAssetUseCase {
  constructor(private assetManagementService: AssetManagementService) {}

  /**
   * Execute the use case
   */
  public async execute(request: CreateAssetDTO, userId: string): Promise<Result<AssetDTO, Error>> {
    // Create AssetName value object
    const nameOrError = AssetName.create(request.name)
    if (!nameOrError.isSuccess) {
      return Result.fail<AssetDTO>(nameOrError.getError())
    }

    // Create owner value object if provided
    let owner
    if (request.owner) {
      const ownerOrError = AssetOwner.create(
        request.owner.id,
        request.owner.name,
        request.owner.department
      )
      if (!ownerOrError.isSuccess) {
        return Result.fail<AssetDTO>(ownerOrError.getError())
      }
      owner = ownerOrError.getValue()
    }

    // Call domain service to create asset
    const assetResult = await this.assetManagementService.createAsset(
      nameOrError.getValue(),
      request.type,
      request.description,
      userId,
      {
        status: request.status,
        owner,
        riskLevel: request.riskLevel,
        location: request.location,
        ipAddress: request.ipAddress,
        macAddress: request.macAddress,
        serialNumber: request.serialNumber,
        purchaseDate: request.purchaseDate,
        endOfLifeDate: request.endOfLifeDate,
        tags: request.tags,
        metadata: request.metadata,
        controlIds: request.controlIds,
        relatedAssetIds: request.relatedAssetIds,
      }
    )

    if (!assetResult.isSuccess) {
      return Result.fail<AssetDTO>(assetResult.getError())
    }

    const asset = assetResult.getValue()

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
