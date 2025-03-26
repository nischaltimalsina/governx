import { Result } from '../../domain/common/result'
import { IDashboardRepository } from '../../domain/reporting/reporting_repository'
import { DashboardDTO } from '../dtos/reporting_dtos'

/**
 * Use case for retrieving a dashboard by ID
 */
export class GetDashboardUseCase {
  constructor(private dashboardRepository: IDashboardRepository) {}

  /**
   * Execute the use case
   * @param dashboardId The ID of the dashboard to retrieve
   */
  public async execute(dashboardId: string): Promise<Result<DashboardDTO, Error>> {
    // Get dashboard from repository
    const dashboardResult = await this.dashboardRepository.findById(dashboardId)

    if (!dashboardResult.isSuccess) {
      return Result.fail<DashboardDTO>(dashboardResult.getError())
    }

    const dashboard = dashboardResult.getValue()

    if (!dashboard) {
      return Result.fail<DashboardDTO>(new Error(`Dashboard with ID ${dashboardId} not found`))
    }

    // Map domain entity to DTO
    return Result.ok<DashboardDTO>({
      id: dashboard.id,
      name: dashboard.name.getValue(),
      type: dashboard.type,
      description: dashboard.description,
      widgets: dashboard.widgets,
      isDefault: dashboard.isDefault,
      isActive: dashboard.isActive,
      createdBy: dashboard.createdBy,
      updatedBy: dashboard.updatedBy,
      createdAt: dashboard.createdAt,
      updatedAt: dashboard.updatedAt,
    })
  }
}
