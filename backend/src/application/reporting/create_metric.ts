import { Result } from '../../domain/common/result'
import { MetricName } from '../../domain/reporting/reporting_values'
import { ReportingService } from '../../domain/reporting/reporting_service'
import { CreateMetricDTO, MetricDTO } from '../dtos/reporting_dtos'

/**
 * Use case for creating a new metric
 */
export class CreateMetricUseCase {
  constructor(private reportingService: ReportingService) {}

  /**
   * Execute the use case
   * @param request The metric creation data
   * @param userId The ID of the user creating the metric
   */
  public async execute(
    request: CreateMetricDTO,
    userId: string
  ): Promise<Result<MetricDTO, Error>> {
    // Create value objects
    const nameOrError = MetricName.create(request.name)
    if (!nameOrError.isSuccess) {
      return Result.fail<MetricDTO>(nameOrError.getError())
    }

    // Call domain service
    const metricResult = await this.reportingService.createMetric(
      nameOrError.getValue(),
      request.type,
      request.description,
      request.calculationMethod,
      request.query,
      userId,
      {
        unit: request.unit,
        thresholds: request.thresholds,
      }
    )

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
