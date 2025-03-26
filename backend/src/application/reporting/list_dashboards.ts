import { Result } from '../../domain/common/result'
import { IDashboardRepository } from '../../domain/reporting/reporting_repository'
import { DashboardListItemDTO, DashboardFilterOptionsDTO } from '../dtos/reporting_dtos'

/**
 * Use case for listing dashboards with optional filters
 */
export class ListDashboardsUseCase {
  constructor(private dashboardRepository: IDashboardRepository) {}

  /**
   * Execute the use case
   * @param options Filter options for dashboards
   */
  public async execute(
    options?: DashboardFilterOptionsDTO
  ): Promise<Result<DashboardListItemDTO[], Error>> {
    // Define repository filter options
    const repoOptions: any = {}

    if (options?.type && options.type.length > 0) {
      repoOptions.type = options.type
    }

    if (options?.isDefault !== undefined) {
      repoOptions.isDefault = options.isDefault
    }

    if (options?.createdBy) {
      repoOptions.createdBy = options.createdBy
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

    // Get dashboards from repository
    const dashboardsResult = await this.dashboardRepository.findAll(repoOptions)

    if (!dashboardsResult.isSuccess) {
      return Result.fail<DashboardListItemDTO[]>(dashboardsResult.getError())
    }

    const dashboards = dashboardsResult.getValue()

    // If search term is provided, filter results
    let filteredDashboards = dashboards
    if (options?.search) {
      const searchTerm = options.search.toLowerCase()
      filteredDashboards = dashboards.filter(
        (dashboard) =>
          dashboard.name.getValue().toLowerCase().includes(searchTerm) ||
          dashboard.description.toLowerCase().includes(searchTerm)
      )
    }

    // Map domain entities to DTOs
    const dashboardDTOs: DashboardListItemDTO[] = filteredDashboards.map((dashboard) => ({
      id: dashboard.id,
      name: dashboard.name.getValue(),
      type: dashboard.type,
      widgetCount: dashboard.widgets.length,
      isDefault: dashboard.isDefault,
      isActive: dashboard.isActive,
      createdBy: dashboard.createdBy,
      createdAt: dashboard.createdAt,
      updatedAt: dashboard.updatedAt,
    }))

    return Result.ok<DashboardListItemDTO[]>(dashboardDTOs)
  }
}
