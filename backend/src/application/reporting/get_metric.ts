import { Result } from '../../domain/common/result'
import { IMetricRepository } from '../../domain/reporting/reporting_repository'
import { MetricDTO } from '../dtos/reporting_dtos'

/**
 * Use case for retrieving a metric by ID
 */
export class GetMetricUseCase {
  constructor(private metricRepository: IMetricRepository) {}

  /**
   * Execute the use case
   * @param metricId The ID of the metric to retrieve
   */
  public async execute(metricId: string): Promise<Result<MetricDTO, Error>> {
    // Get metric from repository
    const metricResult = await this.metricRepository.findById(metricId)

    if (!metricResult.isSuccess) {
      return Result.fail<MetricDTO>(metricResult.getError())
    }

    const metric = metricResult.getValue()

    if (!metric) {
      return Result.fail<MetricDTO>(new Error(`Metric with ID ${metricId} not found`))
    }

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
