import { IDashboardRepository } from '../../domain/reporting/reporting_repository'
import { Dashboard, DashboardWidget } from '../../domain/reporting/dashboard'
import { DashboardName, DashboardType } from '../../domain/reporting/reporting_values'
import { Result } from '../../domain/common/result'
import { DashboardModel, IDashboardDocument } from './models/dashboard_schema'

/**
 * MongoDB implementation of the Dashboard repository
 */
export class MongoDashboardRepository implements IDashboardRepository {
  /**
   * Find a dashboard by ID
   */
  public async findById(id: string): Promise<Result<Dashboard | null, Error>> {
    try {
      const dashboardDoc = await DashboardModel.findById(id)

      if (!dashboardDoc) {
        return Result.ok<null>(null)
      }

      return this.mapDocumentToDomain(dashboardDoc)
    } catch (error) {
      return Result.fail<Dashboard | null>(
        error instanceof Error ? error : new Error(`Failed to find dashboard with id ${id}`)
      )
    }
  }

  /**
   * Find all dashboards with optional filters
   */
  public async findAll(options?: {
    type?: DashboardType[]
    isDefault?: boolean
    createdBy?: string
    active?: boolean
    pageSize?: number
    pageNumber?: number
  }): Promise<Result<Dashboard[], Error>> {
    try {
      // Build query
      const query: any = {}

      if (options?.type && options.type.length > 0) {
        query.type = { $in: options.type }
      }

      if (options?.isDefault !== undefined) {
        query.isDefault = options.isDefault
      }

      if (options?.createdBy) {
        query.createdBy = options.createdBy
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      // Create query with pagination
      let dashboardDocs: IDashboardDocument[]

      if (options?.pageSize && options?.pageNumber) {
        const skip = (options.pageNumber - 1) * options.pageSize
        dashboardDocs = await DashboardModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(options.pageSize)
      } else {
        dashboardDocs = await DashboardModel.find(query).sort({ createdAt: -1 })
      }

      // Map documents to domain entities
      const dashboards: Dashboard[] = []

      for (const doc of dashboardDocs) {
        const dashboardResult = await this.mapDocumentToDomain(doc)

        if (dashboardResult.isSuccess) {
          dashboards.push(dashboardResult.getValue())
        }
      }

      return Result.ok<Dashboard[]>(dashboards)
    } catch (error) {
      return Result.fail<Dashboard[]>(
        error instanceof Error ? error : new Error('Failed to find dashboards')
      )
    }
  }

  /**
   * Find default dashboard by type
   */
  public async findDefaultByType(type: DashboardType): Promise<Result<Dashboard | null, Error>> {
    try {
      const dashboardDoc = await DashboardModel.findOne({
        type,
        isDefault: true,
        isActive: true,
      })

      if (!dashboardDoc) {
        return Result.ok<null>(null)
      }

      return this.mapDocumentToDomain(dashboardDoc)
    } catch (error) {
      return Result.fail<Dashboard | null>(
        error instanceof Error
          ? error
          : new Error(`Failed to find default dashboard for type ${type}`)
      )
    }
  }

  /**
   * Save a dashboard to the repository
   */
  public async save(dashboard: Dashboard): Promise<Result<void, Error>> {
    try {
      const dashboardData = {
        name: dashboard.name.getValue(),
        type: dashboard.type,
        description: dashboard.description,
        widgets: dashboard.widgets,
        isDefault: dashboard.isDefault,
        isActive: dashboard.isActive,
        createdBy: dashboard.createdBy,
        updatedBy: dashboard.updatedBy,
        // MongoDB will handle createdAt/updatedAt
      }

      await DashboardModel.findByIdAndUpdate(dashboard.id, dashboardData, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      })

      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error
          ? error
          : new Error(`Failed to save dashboard with id ${dashboard.id}`)
      )
    }
  }

  /**
   * Delete a dashboard from the repository
   */
  public async delete(dashboardId: string): Promise<Result<void, Error>> {
    try {
      await DashboardModel.findByIdAndDelete(dashboardId)
      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error
          ? error
          : new Error(`Failed to delete dashboard with id ${dashboardId}`)
      )
    }
  }

  /**
   * Count dashboards with optional filters
   */
  public async count(options?: {
    type?: DashboardType[]
    active?: boolean
  }): Promise<Result<number, Error>> {
    try {
      // Build query
      const query: any = {}

      if (options?.type && options.type.length > 0) {
        query.type = { $in: options.type }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      const count = await DashboardModel.countDocuments(query)

      return Result.ok<number>(count)
    } catch (error) {
      return Result.fail<number>(
        error instanceof Error ? error : new Error('Failed to count dashboards')
      )
    }
  }

  /**
   * Map a MongoDB document to a domain Dashboard entity
   */
  private async mapDocumentToDomain(doc: IDashboardDocument): Promise<Result<Dashboard, Error>> {
    try {
      // Create value objects
      const nameOrError = DashboardName.create(doc.name)
      if (!nameOrError.isSuccess) {
        return Result.fail<Dashboard>(nameOrError.getError())
      }

      // Create Dashboard entity
      return Dashboard.create(doc._id.toString(), {
        name: nameOrError.getValue(),
        type: doc.type as DashboardType,
        description: doc.description,
        widgets: doc.widgets as DashboardWidget[],
        isDefault: doc.isDefault,
        isActive: doc.isActive,
        createdBy: doc.createdBy,
        createdAt: doc.createdAt,
      })
    } catch (error) {
      return Result.fail<Dashboard>(
        error instanceof Error
          ? error
          : new Error(`Failed to map dashboard document to domain: ${error}`)
      )
    }
  }
}
