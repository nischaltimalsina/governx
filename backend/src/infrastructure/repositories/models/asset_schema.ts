import mongoose, { Schema, Document } from 'mongoose'
import { AssetType, AssetStatus, AssetRiskLevel } from '../../../domain/asset/asset_values'

/**
 * Interface representing an Asset Owner subdocument in MongoDB
 */
export interface IAssetOwnerDocument {
  userId: string
  name: string
  department: string
  assignedAt: Date
}

/**
 * Interface representing an Asset document in MongoDB
 */
export interface IAssetDocument extends Document {
  _id: string
  name: string
  type: string
  status: string
  description: string
  owner?: IAssetOwnerDocument
  riskLevel?: string
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
 * Mongoose schema for Asset Owner subdocument
 */
const AssetOwnerSchema = new Schema<IAssetOwnerDocument>({
  userId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  assignedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
})

/**
 * Mongoose schema for Asset collection
 */
const AssetSchema = new Schema<IAssetDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: Object.values(AssetType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(AssetStatus),
      required: true,
      default: AssetStatus.ACTIVE,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    owner: {
      type: AssetOwnerSchema,
    },
    riskLevel: {
      type: String,
      enum: Object.values(AssetRiskLevel),
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    macAddress: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    serialNumber: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    purchaseDate: {
      type: Date,
    },
    endOfLifeDate: {
      type: Date,
    },
    tags: {
      type: [String],
      default: undefined,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    controlIds: {
      type: [String],
      default: undefined,
    },
    relatedAssetIds: {
      type: [String],
      default: undefined,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: String,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
)

// Add indexes for common query fields
AssetSchema.index({ name: 1 })
AssetSchema.index({ type: 1 })
AssetSchema.index({ status: 1 })
AssetSchema.index({ 'owner.userId': 1 })
AssetSchema.index({ riskLevel: 1 })
AssetSchema.index({ endOfLifeDate: 1 })
AssetSchema.index({ controlIds: 1 })
AssetSchema.index({ relatedAssetIds: 1 })
AssetSchema.index({ tags: 1 })
AssetSchema.index({ isActive: 1 })

// Compound indexes for common query patterns
AssetSchema.index({ type: 1, status: 1 })
AssetSchema.index({ status: 1, endOfLifeDate: 1 })
AssetSchema.index({ 'owner.userId': 1, status: 1 })
AssetSchema.index({ controlIds: 1, isActive: 1 })

// Create and export the model
export const AssetModel = mongoose.model<IAssetDocument>('Asset', AssetSchema)
