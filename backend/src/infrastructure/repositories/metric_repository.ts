import { IMetricRepository } from '../../domain/reporting/reporting_repository'
import {
  Metric,
  MetricCalculationMethod,
  MetricTrendDirection,
} from '../../domain/reporting/metric'
import { MetricName, MetricType } from '../../domain/reporting/reporting_values'
import { Result } from '../../domain/common/result'
import { MetricModel, IMetricDocument } from './models/metric_schema'

/**
 * MongoDB implementation of the Metric repository
 */
export class MongoMetricRepository implements IMetricRepository {
  /**
   * Find a metric by ID
   */
  public async findById(id: string): Promise<Result<Metric | null, Error>> {
    try {
      const metricDoc = await MetricModel.findById(id)

      if (!metricDoc) {
        return Result.ok<null>(null)
      }

      return this.mapDocumentToDomain(metricDoc)
    } catch (error) {
      return Result.fail<Metric | null>(
        error instanceof Error ? error : new Error(`Failed to find metric with id ${id}`)
      )
    }
  }

  /**
   * Find all metrics with optional filters
   */
  public async findAll(options?: {
    type?: MetricType[]
    active?: boolean
    pageSize?: number
    pageNumber?: number
  }): Promise<Result<Metric[], Error>> {
    try {
      // Build query
      const query: any = {}

      if (options?.type && options.type.length > 0) {
        query.type = { $in: options.type }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active
      }

      // Create query with pagination
      let metricDocs: IMetricDocument[]

      if (options?.pageSize && options?.pageNumber) {
        const skip = (options.pageNumber - 1) * options.pageSize
        metricDocs = await MetricModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(options.pageSize)
      } else {
        metricDocs = await MetricModel.find(query).sort({ createdAt: -1 })
      }

      // Map documents to domain entities
      const metrics: Metric[] = []

      for (const doc of metricDocs) {
        const metricResult = await this.mapDocumentToDomain(doc)

        if (metricResult.isSuccess) {
          metrics.push(metricResult.getValue())
        }
      }

      return Result.ok<Metric[]>(metrics)
    } catch (error) {
      return Result.fail<Metric[]>(
        error instanceof Error ? error : new Error('Failed to find metrics')
      )
    }
  }

  /**
   * Save a metric to the repository
   */
  public async save(metric: Metric): Promise<Result<void, Error>> {
    try {
      const metricData: any = {
        name: metric.name.getValue(),
        type: metric.type,
        description: metric.description,
        calculationMethod: metric.calculationMethod,
        query: metric.query,
        isActive: metric.isActive,
        createdBy: metric.createdBy,
        updatedBy: metric.updatedBy,
      }

      // Add optional fields if they exist
      if (metric.unit) {
        metricData.unit = metric.unit
      }

      if (metric.thresholds) {
        metricData.thresholds = {
          critical: metric.thresholds.critical,
          warning: metric.thresholds.warning,
          target: metric.thresholds.target,
        }
      }

      if (metric.currentValue !== undefined) {
        metricData.currentValue = metric.currentValue
      }

      if (metric.previousValue !== undefined) {
        metricData.previousValue = metric.previousValue
      }

      if (metric.trend) {
        metricData.trend = metric.trend
      }

      if (metric.lastCalculatedAt) {
        metricData.lastCalculatedAt = metric.lastCalculatedAt
      }

      await MetricModel.findByIdAndUpdate(metric.id, metricData, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      })

      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error ? error : new Error(`Failed to save metric with id ${metric.id}`)
      )
    }
  }

  /**
   * Delete a metric from the repository
   */
  public async delete(metricId: string): Promise<Result<void, Error>> {
    try {
      await MetricModel.findByIdAndDelete(metricId)
      return Result.ok<void>()
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error ? error : new Error(`Failed to delete metric with id ${metricId}`)
      )
    }
  }

  /**
   * Count metrics with optional filters
   */
  public async count(options?: {
    type?: MetricType[]
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

      const count = await MetricModel.countDocuments(query)

      return Result.ok<number>(count)
    } catch (error) {
      return Result.fail<number>(
        error instanceof Error ? error : new Error('Failed to count metrics')
      )
    }
  }

  /**
   * Map a MongoDB document to a domain Metric entity
   */
  private async mapDocumentToDomain(doc: IMetricDocument): Promise<Result<Metric, Error>> {
    try {
      // Create value objects
      const nameOrError = MetricName.create(doc.name)
      if (!nameOrError.isSuccess) {
        return Result.fail<Metric>(nameOrError.getError())
      }

      // Create Metric entity
      return Metric.create(doc._id.toString(), {
        name: nameOrError.getValue(),
        type: doc.type as MetricType,
        description: doc.description,
        calculationMethod: doc.calculationMethod as MetricCalculationMethod,
        query: doc.query,
        unit: doc.unit,
        thresholds: doc.thresholds,
        isActive: doc.isActive,
        createdBy: doc.createdBy,
        createdAt: doc.createdAt,
      })
    } catch (error) {
      return Result.fail<Metric>(
        error instanceof Error
          ? error
          : new Error(`Failed to map metric document to domain: ${error}`)
      )
    }
  }
}
