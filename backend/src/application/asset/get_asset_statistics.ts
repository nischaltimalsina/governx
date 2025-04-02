import { Result } from '../../domain/common/result'
import { AssetManagementService } from '../../domain/asset/asset_service'
import { AssetStatisticsDTO } from '../dtos/asset_dtos'

/**
 * Use case for getting asset inventory statistics
 */
export class GetAssetStatisticsUseCase {
  constructor(private assetManagementService: AssetManagementService) {}

  /**
   * Execute the use case
   */
  public async execute(): Promise<Result<AssetStatisticsDTO, Error>> {
    // Call domain service to get statistics
    const statisticsResult = await this.assetManagementService.getAssetStatistics()

    if (!statisticsResult.isSuccess) {
      return Result.fail<AssetStatisticsDTO>(statisticsResult.getError())
    }

    // Return the statistics DTO
    return Result.ok<AssetStatisticsDTO>(statisticsResult.getValue())
  }
}
