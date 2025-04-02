import { Result } from '../../domain/common/result'
import { AssetManagementService } from '../../domain/asset/asset_service'
import { LinkControlDTO, AssetDTO } from '../dtos/asset_dtos'

/**
 * Use case for linking an asset to a control
 */
export class LinkAssetToControlUseCase {
  constructor(private assetManagementService: AssetManagementService) {}

  /**
   * Execute the use case
   */
  public async execute(
    assetId: string,
    request: LinkControlDTO,
    userId: string
  ): Promise<Result<AssetDTO, Error>> {
    // Call domain service to link asset to control
    const assetResult = await this.assetManagementService.linkAssetToControl(
      assetId,
      request.controlId,
      userId
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
