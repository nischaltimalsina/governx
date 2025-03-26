import { Result } from '../../domain/common/result'
import { ReportingService } from '../../domain/reporting/reporting_service'
import { GenerateReportResultDTO } from '../dtos/reporting_dtos'

/**
 * Use case for generating a report
 */
export class GenerateReportUseCase {
  constructor(private reportingService: ReportingService) {}

  /**
   * Execute the use case
   * @param reportId The ID of the report to generate
   * @param userId The ID of the user generating the report
   */
  public async execute(
    reportId: string,
    userId: string
  ): Promise<Result<GenerateReportResultDTO, Error>> {
    // Call domain service
    const result = await this.reportingService.generateReport(reportId, userId)

    if (!result.isSuccess) {
      return Result.fail<GenerateReportResultDTO>(result.getError())
    }

    const { report, fileUrl } = result.getValue()

    // Map domain entity to DTO
    return Result.ok<GenerateReportResultDTO>({
      report: {
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
      },
      fileUrl,
    })
  }
}
