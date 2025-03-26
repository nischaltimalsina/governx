import { Result } from '../../domain/common/result'
import {
  ReportName,
  ReportFilter,
  ReportSchedule,
  ReportScheduleFrequency,
} from '../../domain/reporting/reporting_values'
import { ReportingService } from '../../domain/reporting/reporting_service'
import { CreateReportDTO, ReportDTO } from '../dtos/reporting_dtos'

/**
 * Use case for creating a new report
 */
export class CreateReportUseCase {
  constructor(private reportingService: ReportingService) {}

  /**
   * Execute the use case
   * @param request The report creation data
   * @param userId The ID of the user creating the report
   */
  public async execute(
    request: CreateReportDTO,
    userId: string
  ): Promise<Result<ReportDTO, Error>> {
    // Create value objects
    const nameOrError = ReportName.create(request.name)
    if (!nameOrError.isSuccess) {
      return Result.fail<ReportDTO>(nameOrError.getError())
    }

    // Create filter if provided
    let filter: ReportFilter | undefined
    if (request.filter) {
      const filterOrError = ReportFilter.create(
        request.filter.frameworkIds,
        request.filter.controlIds,
        request.filter.riskIds,
        request.filter.evidenceIds,
        request.filter.policyIds,
        request.filter.startDate,
        request.filter.endDate,
        request.filter.tags,
        request.filter.customFilters
      )

      if (!filterOrError.isSuccess) {
        return Result.fail<ReportDTO>(filterOrError.getError())
      }

      filter = filterOrError.getValue()
    }

    // Create schedule if provided
    let schedule: ReportSchedule | undefined
    if (request.schedule) {
      const scheduleOrError = ReportSchedule.create(
        request.schedule.frequency as ReportScheduleFrequency,
        request.schedule.hour,
        request.schedule.minute,
        request.schedule.recipients,
        request.schedule.dayOfWeek,
        request.schedule.dayOfMonth
      )

      if (!scheduleOrError.isSuccess) {
        return Result.fail<ReportDTO>(scheduleOrError.getError())
      }

      schedule = scheduleOrError.getValue()
    }

    // Call domain service
    const reportResult = await this.reportingService.createReport(
      nameOrError.getValue(),
      request.type,
      request.description,
      request.format,
      userId,
      {
        filter,
        schedule,
        templateId: request.templateId,
      }
    )

    if (!reportResult.isSuccess) {
      return Result.fail<ReportDTO>(reportResult.getError())
    }

    const report = reportResult.getValue()

    // Map domain entity to DTO
    return Result.ok<ReportDTO>({
      id: report.id,
      name: report.name.getValue(),
      type: report.type,
      description: report.description,
      format: report.format,
      filter: report.filter
        ? {
            frameworkIds: report.filter.getFrameworkIds(),
            controlIds: report.filter.getControlIds(),
            riskIds: report.filter.getRiskIds(),
            evidenceIds: report.filter.getEvidenceIds(),
            policyIds: report.filter.getPolicyIds(),
            startDate: report.filter.getStartDate(),
            endDate: report.filter.getEndDate(),
            tags: report.filter.getTags(),
            customFilters: report.filter.getCustomFilters(),
          }
        : undefined,
      schedule: report.schedule
        ? {
            frequency: report.schedule.getFrequency(),
            hour: report.schedule.getHour(),
            minute: report.schedule.getMinute(),
            recipients: report.schedule.getRecipients(),
            dayOfWeek: report.schedule.getDayOfWeek(),
            dayOfMonth: report.schedule.getDayOfMonth(),
            nextRunTime: report.schedule.getNextRunTime(),
          }
        : undefined,
      templateId: report.templateId,
      lastGeneratedAt: report.lastGeneratedAt,
      lastGeneratedBy: report.lastGeneratedBy,
      lastGeneratedFileUrl: report.lastGeneratedFileUrl,
      isActive: report.isActive,
      createdBy: report.createdBy,
      updatedBy: report.updatedBy,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    })
  }
}
