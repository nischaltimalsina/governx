import { Result } from '../../domain/common/result'
import { DashboardName } from '../../domain/reporting/reporting_values'
import { ReportingService } from '../../domain/reporting/reporting_service'
import { CreateDashboardDTO, DashboardDTO } from '../dtos/reporting_dtos'
import { DashboardWidget } from '../../domain/reporting/dashboard'

/**
 * Use case for creating a new dashboard
 */
export class CreateDashboardUseCase {
  constructor(private reportingService: ReportingService) {}

  /**
   * Execute the use case
   * @param request The dashboard creation data
   * @param userId The ID of the user creating the dashboard
   */
  public async execute(
    request: CreateDashboardDTO,
    userId: string
  ): Promise<Result<DashboardDTO, Error>> {
    // Create value objects
    const nameOrError = DashboardName.create(request.name)
    if (!nameOrError.isSuccess) {
      return Result.fail<DashboardDTO>(nameOrError.getError())
    }

    // Map widgets if provided
    let widgets: DashboardWidget[] | undefined
    if (request.widgets && request.widgets.length > 0) {
      widgets = request.widgets.map((w) => ({
        id: w.id,
        title: w.title,
        type: w.type,
        dataSource: w.dataSource,
        size: w.size,
        position: w.position,
        config: w.config,
      }))
    }

    // Call domain service
    const dashboardResult = await this.reportingService.createDashboard(
      nameOrError.getValue(),
      request.type,
      request.description,
      userId,
      {
        widgets,
        isDefault: request.isDefault,
      }
    )

    if (!dashboardResult.isSuccess) {
      return Result.fail<DashboardDTO>(dashboardResult.getError())
    }

    const dashboard = dashboardResult.getValue()

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
