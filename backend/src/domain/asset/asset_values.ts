import { Result } from '../common/result'

/**
 * AssetType enum represents the type of asset
 */
export enum AssetType {
  SERVER = 'server',
  WORKSTATION = 'workstation',
  NETWORK_DEVICE = 'network_device',
  MOBILE_DEVICE = 'mobile_device',
  APPLICATION = 'application',
  DATABASE = 'database',
  CLOUD_SERVICE = 'cloud_service',
  STORAGE = 'storage',
  IOT_DEVICE = 'iot_device',
  VIRTUAL_MACHINE = 'virtual_machine',
  CONTAINER = 'container',
  PERIPHERAL = 'peripheral',
  OTHER = 'other',
}

/**
 * AssetStatus enum represents the current status of an asset
 */
export enum AssetStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  DECOMMISSIONED = 'decommissioned',
  LOST = 'lost',
  STOLEN = 'stolen',
  RESERVED = 'reserved',
  PENDING = 'pending',
}

/**
 * AssetRiskLevel enum represents the risk level assigned to an asset
 */
export enum AssetRiskLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  NEGLIGIBLE = 'negligible',
}

/**
 * AssetName value object represents the name of an asset
 */
export class AssetName {
  private readonly value: string

  private constructor(name: string) {
    this.value = name
  }

  public getValue(): string {
    return this.value
  }

  public static create(name: string): Result<AssetName, Error> {
    if (!name) {
      return Result.fail<AssetName>(new Error('Asset name cannot be empty'))
    }

    if (name.length < 3) {
      return Result.fail<AssetName>(new Error('Asset name must be at least 3 characters'))
    }

    if (name.length > 200) {
      return Result.fail<AssetName>(new Error('Asset name cannot exceed 200 characters'))
    }

    return Result.ok<AssetName>(new AssetName(name))
  }
}

/**
 * AssetOwner value object represents the owner of an asset
 */
export class AssetOwner {
  private readonly userId: string
  private readonly name: string
  private readonly department: string
  private readonly assignedAt: Date

  private constructor(userId: string, name: string, department: string, assignedAt: Date) {
    this.userId = userId
    this.name = name
    this.department = department
    this.assignedAt = assignedAt
  }

  public getUserId(): string {
    return this.userId
  }

  public getName(): string {
    return this.name
  }

  public getDepartment(): string {
    return this.department
  }

  public getAssignedAt(): Date {
    return new Date(this.assignedAt)
  }

  public static create(
    userId: string,
    name: string,
    department: string,
    assignedAt: Date = new Date()
  ): Result<AssetOwner, Error> {
    if (!userId) {
      return Result.fail<AssetOwner>(new Error('Owner user ID is required'))
    }

    if (!name) {
      return Result.fail<AssetOwner>(new Error('Owner name is required'))
    }

    if (!department) {
      return Result.fail<AssetOwner>(new Error('Owner department is required'))
    }

    return Result.ok<AssetOwner>(new AssetOwner(userId, name, department, assignedAt))
  }
}
