import { Entity } from '../common/entity'
import { Result } from '../common/result'
import { AssetName, AssetType, AssetStatus, AssetOwner, AssetRiskLevel } from './asset_values'

/**
 * Asset properties interface
 */
export interface AssetProps {
  name: AssetName
  type: AssetType
  status: AssetStatus
  description: string
  owner?: AssetOwner
  riskLevel?: AssetRiskLevel
  location?: string
  ipAddress?: string
  macAddress?: string
  serialNumber?: string
  purchaseDate?: Date
  endOfLifeDate?: Date
  tags?: string[]
  metadata?: Record<string, any>
  controlIds?: string[]
  relatedAssetIds?: string[]
  isActive: boolean
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt?: Date
}

/**
 * Asset entity representing any IT or business asset
 */
export class Asset extends Entity<AssetProps> {
  private readonly props: AssetProps

  private constructor(id: string, props: AssetProps) {
    super(id)
    this.props = props
  }

  // Getters
  get name(): AssetName {
    return this.props.name
  }

  get type(): AssetType {
    return this.props.type
  }

  get status(): AssetStatus {
    return this.props.status
  }

  get description(): string {
    return this.props.description
  }

  get owner(): AssetOwner | undefined {
    return this.props.owner
  }

  get riskLevel(): AssetRiskLevel | undefined {
    return this.props.riskLevel
  }

  get location(): string | undefined {
    return this.props.location
  }

  get ipAddress(): string | undefined {
    return this.props.ipAddress
  }

  get macAddress(): string | undefined {
    return this.props.macAddress
  }

  get serialNumber(): string | undefined {
    return this.props.serialNumber
  }

  get purchaseDate(): Date | undefined {
    return this.props.purchaseDate ? new Date(this.props.purchaseDate) : undefined
  }

  get endOfLifeDate(): Date | undefined {
    return this.props.endOfLifeDate ? new Date(this.props.endOfLifeDate) : undefined
  }

  get tags(): string[] | undefined {
    return this.props.tags ? [...this.props.tags] : undefined
  }

  get metadata(): Record<string, any> | undefined {
    return this.props.metadata ? { ...this.props.metadata } : undefined
  }

  get controlIds(): string[] | undefined {
    return this.props.controlIds ? [...this.props.controlIds] : undefined
  }

  get relatedAssetIds(): string[] | undefined {
    return this.props.relatedAssetIds ? [...this.props.relatedAssetIds] : undefined
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

  /**
   * Check if an asset is nearing end of life
   */
  public isNearingEndOfLife(thresholdDays: number = 90, asOfDate: Date = new Date()): boolean {
    if (!this.props.endOfLifeDate) {
      return false
    }

    const thresholdDate = new Date(asOfDate)
    thresholdDate.setDate(thresholdDate.getDate() + thresholdDays)

    return this.props.endOfLifeDate <= thresholdDate && this.props.endOfLifeDate > asOfDate
  }

  /**
   * Check if an asset has reached end of life
   */
  public isEndOfLifeReached(asOfDate: Date = new Date()): boolean {
    if (!this.props.endOfLifeDate) {
      return false
    }

    return this.props.endOfLifeDate <= asOfDate
  }

  // Business methods
  public updateDescription(description: string, userId: string): Result<void, Error> {
    if (!description || description.trim().length === 0) {
      return Result.fail<void>(new Error('Description cannot be empty'))
    }

    if (description.length > 2000) {
      return Result.fail<void>(new Error('Description cannot exceed 2000 characters'))
    }

    this.props.description = description
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateStatus(status: AssetStatus, userId: string): Result<void, Error> {
    this.props.status = status
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateRiskLevel(riskLevel: AssetRiskLevel, userId: string): Result<void, Error> {
    this.props.riskLevel = riskLevel
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public assignOwner(owner: AssetOwner, userId: string): Result<void, Error> {
    this.props.owner = owner
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateTechnicalDetails(
    details: {
      location?: string
      ipAddress?: string
      macAddress?: string
      serialNumber?: string
    },
    userId: string
  ): Result<void, Error> {
    if (details.location !== undefined) {
      this.props.location = details.location
    }

    if (details.ipAddress !== undefined) {
      this.props.ipAddress = details.ipAddress
    }

    if (details.macAddress !== undefined) {
      this.props.macAddress = details.macAddress
    }

    if (details.serialNumber !== undefined) {
      this.props.serialNumber = details.serialNumber
    }

    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateLifecycleDates(
    dates: {
      purchaseDate?: Date
      endOfLifeDate?: Date
    },
    userId: string
  ): Result<void, Error> {
    if (dates.purchaseDate !== undefined) {
      this.props.purchaseDate = dates.purchaseDate
    }

    if (dates.endOfLifeDate !== undefined) {
      this.props.endOfLifeDate = dates.endOfLifeDate
    }

    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateTags(tags: string[] | undefined, userId: string): Result<void, Error> {
    if (tags) {
      // Ensure tags are unique
      this.props.tags = [...new Set(tags)]
    } else {
      this.props.tags = undefined
    }

    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public updateMetadata(
    metadata: Record<string, any> | undefined,
    userId: string
  ): Result<void, Error> {
    this.props.metadata = metadata ? { ...metadata } : undefined
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public linkControl(controlId: string, userId: string): Result<void, Error> {
    if (!controlId) {
      return Result.fail<void>(new Error('Control ID is required'))
    }

    if (!this.props.controlIds) {
      this.props.controlIds = []
    }

    if (this.props.controlIds.includes(controlId)) {
      return Result.fail<void>(new Error(`Asset is already linked to control ${controlId}`))
    }

    this.props.controlIds.push(controlId)
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public unlinkControl(controlId: string, userId: string): Result<void, Error> {
    if (!this.props.controlIds || !this.props.controlIds.includes(controlId)) {
      return Result.fail<void>(new Error(`Asset is not linked to control ${controlId}`))
    }

    this.props.controlIds = this.props.controlIds.filter((id) => id !== controlId)
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public linkRelatedAsset(assetId: string, userId: string): Result<void, Error> {
    if (!assetId) {
      return Result.fail<void>(new Error('Asset ID is required'))
    }

    if (assetId === this.id) {
      return Result.fail<void>(new Error('Cannot link an asset to itself'))
    }

    if (!this.props.relatedAssetIds) {
      this.props.relatedAssetIds = []
    }

    if (this.props.relatedAssetIds.includes(assetId)) {
      return Result.fail<void>(new Error(`Asset is already linked to asset ${assetId}`))
    }

    this.props.relatedAssetIds.push(assetId)
    this.props.updatedBy = userId
    this.updateTimestamp()
    return Result.ok<void>()
  }

  public unlinkRelatedAsset(assetId: string, userId: string): Result<void, Error> {
    if (!this.props.relatedAssetIds || !this.props.relatedAssetIds.includes(assetId)) {
      return Result.fail<void>(new Error(`Asset is not linked to asset ${assetId}`))
    }

    this.props.relatedAssetIds = this.props.relatedAssetIds.filter((id) => id !== assetId)
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
   * Create a new Asset entity
   */
  public static create(
    id: string,
    props: {
      name: AssetName
      type: AssetType
      description: string
      status?: AssetStatus
      owner?: AssetOwner
      riskLevel?: AssetRiskLevel
      location?: string
      ipAddress?: string
      macAddress?: string
      serialNumber?: string
      purchaseDate?: Date
      endOfLifeDate?: Date
      tags?: string[]
      metadata?: Record<string, any>
      controlIds?: string[]
      relatedAssetIds?: string[]
      isActive?: boolean
      createdBy: string
      createdAt?: Date
    }
  ): Result<Asset, Error> {
    // Validate required properties
    if (!props.name) {
      return Result.fail<Asset>(new Error('Asset name is required'))
    }

    if (!props.type) {
      return Result.fail<Asset>(new Error('Asset type is required'))
    }

    if (!props.description) {
      return Result.fail<Asset>(new Error('Asset description is required'))
    }

    if (props.description.length > 2000) {
      return Result.fail<Asset>(new Error('Asset description cannot exceed 2000 characters'))
    }

    if (!props.createdBy) {
      return Result.fail<Asset>(new Error('Created by user ID is required'))
    }

    // Validate dates if provided
    if (props.purchaseDate && props.endOfLifeDate && props.purchaseDate > props.endOfLifeDate) {
      return Result.fail<Asset>(new Error('End of life date must be after purchase date'))
    }

    // Create asset with provided or default values
    const asset = new Asset(id, {
      name: props.name,
      type: props.type,
      status: props.status ?? AssetStatus.ACTIVE,
      description: props.description,
      owner: props.owner,
      riskLevel: props.riskLevel,
      location: props.location,
      ipAddress: props.ipAddress,
      macAddress: props.macAddress,
      serialNumber: props.serialNumber,
      purchaseDate: props.purchaseDate,
      endOfLifeDate: props.endOfLifeDate,
      tags: props.tags ? [...new Set(props.tags)] : undefined,
      metadata: props.metadata ? { ...props.metadata } : undefined,
      controlIds: props.controlIds ? [...props.controlIds] : undefined,
      relatedAssetIds: props.relatedAssetIds ? [...props.relatedAssetIds] : undefined,
      isActive: props.isActive ?? true,
      createdBy: props.createdBy,
      createdAt: props.createdAt ?? new Date(),
    })

    return Result.ok<Asset>(asset)
  }
}
