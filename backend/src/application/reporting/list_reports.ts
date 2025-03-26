import { Result } from '../../domain/common/result'
import { IReportRepository } from '../../domain/reporting/reporting_repository'
import { ReportListItemDTO, ReportFilterOptionsDTO } from '../dtos/reporting_dtos'

/**
 * Use case for listing reports with optional filters
 */
export class ListReportsUseCase {
  constructor(private reportRepository: IReportRepository) {}

  /**
   * Execute the use case
   * @param options Filter options for reports
   */
  public async execute(
    options?: ReportFilterOptionsDTO
  ): Promise<Result<ReportListItemDTO[], Error>> {
    // Define repository filter options
    const repoOptions: any = {}

    if (options?.type && options.type.length > 0) {
      repoOptions.type = options.type
    }

    if (options?.scheduled !== undefined) {
      repoOptions.scheduled = options.scheduled
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

    // Get reports from repository
    const reportsResult = await this.reportRepository.findAll(repoOptions)

    if (!reportsResult.isSuccess) {
      return Result.fail<ReportListItemDTO[]>(reportsResult.getError())
    }

    const reports = reportsResult.getValue()

    // If search term is provided, filter results
    let filteredReports = reports
    if (options?.search) {
      const searchTerm = options.search.toLowerCase()
      filteredReports = reports.filter(
        (report) =>
          report.name.getValue().toLowerCase().includes(searchTerm) ||
          report.description.toLowerCase().includes(searchTerm)
      )
    }

    // Map domain entities to DTOs
    const reportDTOs: ReportListItemDTO[] = filteredReports.map((report) => ({
      id: report.id,
      name: report.name.getValue(),
      type: report.type,
      format: report.format,
      isScheduled: !!report.schedule,
      lastGeneratedAt: report.lastGeneratedAt,
      isActive: report.isActive,
      createdBy: report.createdBy,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    }))

    return Result.ok<ReportListItemDTO[]>(reportDTOs)
  }
}
