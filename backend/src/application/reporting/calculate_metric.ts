import { Result } from '../../domain/common/result'
import { ReportingService } from '../../domain/reporting/reporting_service'
import { MetricDTO } from '../dtos/reporting_dtos'

/**
 * Use case for calculating a metric
 */
export class CalculateMetricUseCase {
  constructor(private reportingService: ReportingService) {}

  /**
   * Execute the use case
   * @param metricId The ID of the metric to calculate
   * @param userId The ID of the user calculating the metric
   */
  public async execute(metricId: string, userId: string): Promise<Result<MetricDTO, Error>> {
    // Call domain service
    const metricResult = await this.reportingService.calculateMetric(metricId, userId)

    if (!metricResult.isSuccess) {
      return Result.fail<MetricDTO>(metricResult.getError())
    }

    const metric = metricResult.getValue()

    // Map domain entity to DTO
    return Result.ok<MetricDTO>({
      id: metric.id,
      name: metric.name.getValue(),
      type: metric.type,
      description: metric.description,
      calculationMethod: metric.calculationMethod,
      query: metric.query,
      unit: metric.unit,
      thresholds: metric.thresholds,
      currentValue: metric.currentValue,
      previousValue: metric.previousValue,
      trend: metric.trend,
      lastCalculatedAt: metric.lastCalculatedAt,
      isActive: metric.isActive,
      createdBy: metric.createdBy,
      updatedBy: metric.updatedBy,
      createdAt: metric.createdAt,
      updatedAt: metric.updatedAt,
    })
  }
}
