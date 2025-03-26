import { Entity } from '../common/entity'
import { Result } from '../common/result'
import { DashboardName, DashboardType } from './reporting_values'

/**
 * Dashboard widget interface
 */
export interface DashboardWidget {
  id: string
  title: string
  type: string // chart, table, metric, etc.
  dataSource: string // API endpoint or query
  size: {
    width: number // Column span (1-12 in a grid system)
    height: number // Row span or height in pixels
  }
  position: {
    x: number // Column index
    y: number // Row index
  }
  config?: Record<string, any> // Widget-specific configuration
}

/**
 * Dashboard properties interface
 */
export interface DashboardProps {
  name: DashboardName
  type: DashboardType
  description: string
  widgets: DashboardWidget[]
  isDefault: boolean
  isActive: boolean
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt?: Date
}

/**
 * Dashboard entity representing a customizable dashboard
 */
export class Dashboard extends Entity<DashboardProps> {
  private readonly props: DashboardProps

  private constructor(id: string, props: DashboardProps) {
    super(id)
    this.props = props
  }

  // Getters
  get name(): DashboardName {
    return this.props.name
  }

  get type(): DashboardType {
    return this.props.type
  }

  get description(): string {
    return this.props.description
  }

  get widgets(): DashboardWidget[] {
    return [...this.props.widgets]
  }

  get isDefault(): boolean {
    return this.props.isDefault
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

  public addWidget(widget: DashboardWidget, userId: string): Result<void, Error> {
    // Validate widget
    if (!widget.id) {
      return Result.fail<void>(new Error('Widget ID is required'))
    }

    if (!widget.title) {
      return Result.fail<void>(new Error('Widget title is required'))
    }

    if (!widget.type) {
      return Result.fail<void>(new Error('Widget type is required'))
    }

    if (!widget.dataSource) {
      return Result.fail<void>(new Error('Widget data source is required'))
    }

    // Check if widget ID already exists
    if (this.props.widgets.some((w) => w.id === widget.id)) {
      return Result.fail<void>(new Error(`Widget with ID ${widget.id} already exists`))
    }

    this.props.widgets.push(widget)
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateWidget(
    widgetId: string,
    updatedWidget: Partial<DashboardWidget>,
    userId: string
  ): Result<void, Error> {
    const widgetIndex = this.props.widgets.findIndex((w) => w.id === widgetId)

    if (widgetIndex === -1) {
      return Result.fail<void>(new Error(`Widget with ID ${widgetId} not found`))
    }

    const widget = this.props.widgets[widgetIndex]

    // Update widget properties while preserving the ones that weren't changed
    this.props.widgets[widgetIndex] = {
      ...widget,
      ...updatedWidget,
      id: widget.id, // Ensure ID remains unchanged
    }

    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public removeWidget(widgetId: string, userId: string): Result<void, Error> {
    const initialLength = this.props.widgets.length
    this.props.widgets = this.props.widgets.filter((w) => w.id !== widgetId)

    if (this.props.widgets.length === initialLength) {
      return Result.fail<void>(new Error(`Widget with ID ${widgetId} not found`))
    }

    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public setAsDefault(userId: string): Result<void, Error> {
    this.props.isDefault = true
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public unsetAsDefault(userId: string): Result<void, Error> {
    this.props.isDefault = false
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
   * Create a new Dashboard entity
   */
  public static create(
    id: string,
    props: {
      name: DashboardName
      type: DashboardType
      description: string
      widgets?: DashboardWidget[]
      isDefault?: boolean
      isActive?: boolean
      createdBy: string
      createdAt?: Date
    }
  ): Result<Dashboard, Error> {
    // Validate required properties
    if (!props.name) {
      return Result.fail<Dashboard>(new Error('Dashboard name is required'))
    }

    if (!props.type) {
      return Result.fail<Dashboard>(new Error('Dashboard type is required'))
    }

    if (!props.description) {
      return Result.fail<Dashboard>(new Error('Dashboard description is required'))
    }

    if (props.description.length > 1000) {
      return Result.fail<Dashboard>(
        new Error('Dashboard description cannot exceed 1000 characters')
      )
    }

    if (!props.createdBy) {
      return Result.fail<Dashboard>(new Error('Created by user ID is required'))
    }

    // Create dashboard with provided or default values
    const dashboard = new Dashboard(id, {
      name: props.name,
      type: props.type,
      description: props.description,
      widgets: props.widgets ?? [],
      isDefault: props.isDefault ?? false,
      isActive: props.isActive ?? true,
      createdBy: props.createdBy,
      createdAt: props.createdAt ?? new Date(),
    })

    return Result.ok<Dashboard>(dashboard)
  }
}
