import { Result } from '../../domain/common/result'
import { IReportRepository } from '../../domain/reporting/reporting_repository'
import { ReportDTO } from '../dtos/reporting_dtos'

/**
 * Use case for retrieving a report by ID
 */
export class GetReportUseCase {
  constructor(private reportRepository: IReportRepository) {}

  /**
   * Execute the use case
   * @param reportId The ID of the report to retrieve
   */
  public async execute(reportId: string): Promise<Result<ReportDTO, Error>> {
    // Get report from repository
    const reportResult = await this.reportRepository.findById(reportId)

    if (!reportResult.isSuccess) {
      return Result.fail<ReportDTO>(reportResult.getError())
    }

    const report = reportResult.getValue()

    if (!report) {
      return Result.fail<ReportDTO>(new Error(`Report with ID ${reportId} not found`))
    }

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
