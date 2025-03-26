import { Result } from '../../domain/common/result'
import { IMetricRepository } from '../../domain/reporting/reporting_repository'
import { MetricListItemDTO, MetricFilterOptionsDTO } from '../dtos/reporting_dtos'

/**
 * Use case for listing metrics with optional filters
 */
export class ListMetricsUseCase {
  constructor(private metricRepository: IMetricRepository) {}

  /**
   * Execute the use case
   * @param options Filter options for metrics
   */
  public async execute(
    options?: MetricFilterOptionsDTO
  ): Promise<Result<MetricListItemDTO[], Error>> {
    // Define repository filter options
    const repoOptions: any = {}

    if (options?.type && options.type.length > 0) {
      repoOptions.type = options.type
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

    // Get metrics from repository
    const metricsResult = await this.metricRepository.findAll(repoOptions)

    if (!metricsResult.isSuccess) {
      return Result.fail<MetricListItemDTO[]>(metricsResult.getError())
    }

    const metrics = metricsResult.getValue()

    // If search term is provided, filter results
    let filteredMetrics = metrics
    if (options?.search) {
      const searchTerm = options.search.toLowerCase()
      filteredMetrics = metrics.filter(
        (metric) =>
          metric.name.getValue().toLowerCase().includes(searchTerm) ||
          metric.description.toLowerCase().includes(searchTerm)
      )
    }

    // Map domain entities to DTOs
    const metricDTOs: MetricListItemDTO[] = filteredMetrics.map((metric) => ({
      id: metric.id,
      name: metric.name.getValue(),
      type: metric.type,
      calculationMethod: metric.calculationMethod,
      currentValue: metric.currentValue,
      unit: metric.unit,
      trend: metric.trend,
      lastCalculatedAt: metric.lastCalculatedAt,
      isActive: metric.isActive,
      createdAt: metric.createdAt,
      updatedAt: metric.updatedAt,
    }))

    return Result.ok<MetricListItemDTO[]>(metricDTOs)
  }
}
