import { Entity } from '../common/entity'
import { Result } from '../common/result'
import { MetricName, MetricType } from './reporting_values'

/**
 * Metric calculation method types
 */
export enum MetricCalculationMethod {
  COUNT = 'count',
  SUM = 'sum',
  AVERAGE = 'average',
  PERCENTAGE = 'percentage',
  RATIO = 'ratio',
  CUSTOM = 'custom',
}

/**
 * Metric trend directions
 */
export enum MetricTrendDirection {
  INCREASING = 'increasing',
  DECREASING = 'decreasing',
  STABLE = 'stable',
  FLUCTUATING = 'fluctuating',
}

/**
 * Metric properties interface
 */
export interface MetricProps {
  name: MetricName
  type: MetricType
  description: string
  calculationMethod: MetricCalculationMethod
  query: string // Database query or API endpoint
  unit?: string // %, count, days, etc.
  thresholds?: {
    critical?: number
    warning?: number
    target?: number
  }
  currentValue?: number
  previousValue?: number
  trend?: MetricTrendDirection
  lastCalculatedAt?: Date
  isActive: boolean
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt?: Date
}

/**
 * Metric entity representing a compliance or risk metric
 */
export class Metric extends Entity<MetricProps> {
  private readonly props: MetricProps

  private constructor(id: string, props: MetricProps) {
    super(id)
    this.props = props
  }

  // Getters
  get name(): MetricName {
    return this.props.name
  }

  get type(): MetricType {
    return this.props.type
  }

  get description(): string {
    return this.props.description
  }

  get calculationMethod(): MetricCalculationMethod {
    return this.props.calculationMethod
  }

  get query(): string {
    return this.props.query
  }

  get unit(): string | undefined {
    return this.props.unit
  }

  get thresholds(): { critical?: number; warning?: number; target?: number } | undefined {
    return this.props.thresholds ? { ...this.props.thresholds } : undefined
  }

  get currentValue(): number | undefined {
    return this.props.currentValue
  }

  get previousValue(): number | undefined {
    return this.props.previousValue
  }

  get trend(): MetricTrendDirection | undefined {
    return this.props.trend
  }

  get lastCalculatedAt(): Date | undefined {
    return this.props.lastCalculatedAt ? new Date(this.props.lastCalculatedAt) : undefined
  }

  get isActive(): boolean {
    return this.props.isActive
  }

  get createdBy(): string {
    return this.props.createdBy
  }

  get updatedBy(): string | undefined {
    return this.props.updatedBy
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt)
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt ? new Date(this.props.updatedAt) : undefined
  }

  // Business methods
  public updateDescription(description: string, userId: string): Result<void, Error> {
    if (!description || description.trim().length === 0) {
      return Result.fail<void>(new Error('Description cannot be empty'))
    }

    if (description.length > 1000) {
      return Result.fail<void>(new Error('Description cannot exceed 1000 characters'))
    }

    this.props.description = description
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateQuery(query: string, userId: string): Result<void, Error> {
    if (!query || query.trim().length === 0) {
      return Result.fail<void>(new Error('Query cannot be empty'))
    }

    this.props.query = query
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateThresholds(
    thresholds: { critical?: number; warning?: number; target?: number } | undefined,
    userId: string
  ): Result<void, Error> {
    this.props.thresholds = thresholds
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateValue(currentValue: number, userId: string): Result<void, Error> {
    // Store the current value as previous value before updating
    this.props.previousValue = this.props.currentValue
    this.props.currentValue = currentValue
    this.props.lastCalculatedAt = new Date()

    // Calculate trend
    if (this.props.previousValue !== undefined) {
      if (currentValue > this.props.previousValue) {
        this.props.trend = MetricTrendDirection.INCREASING
      } else if (currentValue < this.props.previousValue) {
        this.props.trend = MetricTrendDirection.DECREASING
      } else {
        this.props.trend = MetricTrendDirection.STABLE
      }
    }

    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public activate(): void {
    this.props.isActive = true
    this.updateTimestamp()
  }

  public deactivate(): void {
    this.props.isActive = false
    this.updateTimestamp()
  }

  private updateTimestamp(): void {
    this.props.updatedAt = new Date()
  }

  /**
   * Create a new Metric entity
   */
  public static create(
    id: string,
    props: {
      name: MetricName
      type: MetricType
      description: string
      calculationMethod: MetricCalculationMethod
      query: string
      unit?: string
      thresholds?: {
        critical?: number
        warning?: number
        target?: number
      }
      isActive?: boolean
      createdBy: string
      createdAt?: Date
    }
  ): Result<Metric, Error> {
    // Validate required properties
    if (!props.name) {
      return Result.fail<Metric>(new Error('Metric name is required'))
    }

    if (!props.type) {
      return Result.fail<Metric>(new Error('Metric type is required'))
    }

    if (!props.description) {
      return Result.fail<Metric>(new Error('Metric description is required'))
    }

    if (props.description.length > 1000) {
      return Result.fail<Metric>(new Error('Metric description cannot exceed 1000 characters'))
    }

    if (!props.calculationMethod) {
      return Result.fail<Metric>(new Error('Calculation method is required'))
    }

    if (!props.query) {
      return Result.fail<Metric>(new Error('Metric query is required'))
    }

    if (!props.createdBy) {
      return Result.fail<Metric>(new Error('Created by user ID is required'))
    }

    // Create metric with provided or default values
    const metric = new Metric(id, {
      name: props.name,
      type: props.type,
      description: props.description,
      calculationMethod: props.calculationMethod,
      query: props.query,
      unit: props.unit,
      thresholds: props.thresholds,
      isActive: props.isActive ?? true,
      createdBy: props.createdBy,
      createdAt: props.createdAt ?? new Date(),
    })

    return Result.ok<Metric>(metric)
  }
}
