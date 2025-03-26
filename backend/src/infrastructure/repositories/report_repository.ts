import { IReportRepository } from '../../domain/reporting/reporting_repository'
import { Report } from '../../domain/reporting/report'
import {
  ReportName,
  ReportType,
  ReportFormat,
  ReportFilter,
  ReportSchedule,
  ReportScheduleFrequency,
} from '../../domain/reporting/reporting_values'
import { Result } from '../../domain/common/result'
import { ReportModel, IReportDocument } from './models/report_schema'

/**
 * MongoDB implementation of the Report repository
 */
export class MongoReportRepository implements IReportRepository {
  /**
   * Find a report by ID
   */
  public async findById(id: string): Promise<Result<Report | null, Error>> {
    try {
      const reportDoc = await ReportModel.findById(id)

      if (!reportDoc) {
        return Result.ok<null>(null)
      }

      return this.mapDocumentToDomain(reportDoc)
    } catch (error) {
      return Result.fail<Report | null>(
        error instanceof Error ? error : new Error(`Failed to find report with id ${id}`)
      )
    }
  }

  /**
   * Find all reports with optional filters
   */
  public async findAll(options?: {
    type?: ReportType[]
    scheduled?: boolean
    createdBy?: string
    active?: boolean
    pageSize?: number
    pageNumber?: number
  }): Promise<Result<Report[], Error>> {
    try {
      // Build query
      const query: any = {}

      if (options?.type && options.type.length > 0) {
        query.type = { $in: options.type }
      }

      if (options?.scheduled !== undefined) {
        if (options.scheduled) {
          query.schedule = { $exists: true }
        } else {
          query.schedule = { $exists: false }
        }
      }

      if (options?.createdBy) {
        query.createdBy = options.createdBy
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      // Create query with pagination
      let reportDocs: IReportDocument[]

      if (options?.pageSize && options?.pageNumber) {
        const skip = (options.pageNumber - 1) * options.pageSize
        reportDocs = await ReportModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(options.pageSize)
      } else {
        reportDocs = await ReportModel.find(query).sort({ createdAt: -1 })
      }

      // Map documents to domain entities
      const reports: Report[] = []

      for (const doc of reportDocs) {
        const reportResult = await this.mapDocumentToDomain(doc)

        if (reportResult.isSuccess) {
          reports.push(reportResult.getValue())
        }
      }

      return Result.ok<Report[]>(reports)
    } catch (error) {
      return Result.fail<Report[]>(
        error instanceof Error ? error : new Error('Failed to find reports')
      )
    }
  }

  /**
   * Find reports that are scheduled to run
   */
  public async findScheduledReports(beforeDate: Date): Promise<Result<Report[], Error>> {
    try {
      // Find reports where nextRunTime is before the given date
      const reportDocs = await ReportModel.find({
        'schedule.nextRunTime': { $lte: beforeDate },
        isActive: true,
      })

      // Map documents to domain entities
      const reports: Report[] = []

      for (const doc of reportDocs) {
        const reportResult = await this.mapDocumentToDomain(doc)

        if (reportResult.isSuccess) {
          reports.push(reportResult.getValue())
        }
      }

      return Result.ok<Report[]>(reports)
    } catch (error) {
      return Result.fail<Report[]>(
        error instanceof Error ? error : new Error('Failed to find scheduled reports')
      )
    }
  }

  /**
   * Save a report to the repository
   */
  public async save(report: Report): Promise<Result<void, Error>> {
    try {
      const reportData: any = {
        name: report.name.getValue(),
        type: report.type,
        description: report.description,
        format: report.format,
        isActive: report.isActive,
        createdBy: report.createdBy,
        updatedBy: report.updatedBy,
      }

      // Add optional fields if they exist
      if (report.filter) {
        reportData.filter = {
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
      }

      if (report.schedule) {
        reportData.schedule = {
          frequency: report.schedule.getFrequency(),
          dayOfWeek: report.schedule.getDayOfWeek(),
          dayOfMonth: report.schedule.getDayOfMonth(),
          hour: report.schedule.getHour(),
          minute: report.schedule.getMinute(),
          nextRunTime: report.schedule.getNextRunTime(),
          recipients: report.schedule.getRecipients(),
        }
      }

      if (report.templateId) {
        reportData.templateId = report.templateId
      }

      if (report.lastGeneratedAt) {
        reportData.lastGeneratedAt = report.lastGeneratedAt
      }

      if (report.lastGeneratedBy) {
        reportData.lastGeneratedBy = report.lastGeneratedBy
      }

      if (report.lastGeneratedFileUrl) {
        reportData.lastGeneratedFileUrl = report.lastGeneratedFileUrl
      }

      await ReportModel.findByIdAndUpdate(report.id, reportData, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      })

      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error ? error : new Error(`Failed to save report with id ${report.id}`)
      )
    }
  }

  /**
   * Delete a report from the repository
   */
  public async delete(reportId: string): Promise<Result<void, Error>> {
    try {
      await ReportModel.findByIdAndDelete(reportId)
      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error ? error : new Error(`Failed to delete report with id ${reportId}`)
      )
    }
  }

  /**
   * Count reports with optional filters
   */
  public async count(options?: {
    type?: ReportType[]
    scheduled?: boolean
    active?: boolean
  }): Promise<Result<number, Error>> {
    try {
      // Build query
      const query: any = {}

      if (options?.type && options.type.length > 0) {
        query.type = { $in: options.type }
      }

      if (options?.scheduled !== undefined) {
        if (options.scheduled) {
          query.schedule = { $exists: true }
        } else {
          query.schedule = { $exists: false }
        }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      const count = await ReportModel.countDocuments(query)

      return Result.ok<number>(count)
    } catch (error) {
      return Result.fail<number>(
        error instanceof Error ? error : new Error('Failed to count reports')
      )
    }
  }

  /**
   * Map a MongoDB document to a domain Report entity
   */
  private async mapDocumentToDomain(doc: IReportDocument): Promise<Result<Report, Error>> {
    try {
      // Create value objects
      const nameOrError = ReportName.create(doc.name)
      if (!nameOrError.isSuccess) {
        return Result.fail<Report>(nameOrError.getError())
      }

      // Map filter if it exists
      let filter: ReportFilter | undefined
      if (doc.filter) {
        const filterOrError = ReportFilter.create(
          doc.filter.frameworkIds,
          doc.filter.controlIds,
          doc.filter.riskIds,
          doc.filter.evidenceIds,
          doc.filter.policyIds,
          doc.filter.startDate,
          doc.filter.endDate,
          doc.filter.tags,
          doc.filter.customFilters
        )

        if (!filterOrError.isSuccess) {
          return Result.fail<Report>(filterOrError.getError())
        }

        filter = filterOrError.getValue()
      }

      // Map schedule if it exists
      let schedule: ReportSchedule | undefined
      if (doc.schedule) {
        const scheduleOrError = ReportSchedule.create(
          doc.schedule.frequency as ReportScheduleFrequency,
          doc.schedule.hour,
          doc.schedule.minute,
          doc.schedule.recipients,
          doc.schedule.dayOfWeek,
          doc.schedule.dayOfMonth,
          doc.schedule.nextRunTime
        )

        if (!scheduleOrError.isSuccess) {
          return Result.fail<Report>(scheduleOrError.getError())
        }

        schedule = scheduleOrError.getValue()
      }

      // Create Report entity
      return Report.create(doc._id.toString(), {
        name: nameOrError.getValue(),
        type: doc.type as ReportType,
        description: doc.description,
        format: doc.format as ReportFormat,
        filter,
        schedule,
        templateId: doc.templateId,
        isActive: doc.isActive,
        createdBy: doc.createdBy,
        createdAt: doc.createdAt,
      })
    } catch (error) {
      return Result.fail<Report>(
        error instanceof Error
          ? error
          : new Error(`Failed to map report document to domain: ${error}`)
      )
    }
  }
}
