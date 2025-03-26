import mongoose, { Schema, Document } from 'mongoose'
import { DashboardType } from '../../../domain/reporting/reporting_values'

/**
 * Interface representing a Dashboard Widget in MongoDB
 */
export interface IDashboardWidgetDocument {
  id: string
  title: string
  type: string
  dataSource: string
  size: {
    width: number
    height: number
  }
  position: {
    x: number
    y: number
  }
  config?: Record<string, any>
}

/**
 * Interface representing a Dashboard document in MongoDB
 */
export interface IDashboardDocument extends Document {
  _id: string
  name: string
  type: string
  description: string
  widgets: IDashboardWidgetDocument[]
  isDefault: boolean
  isActive: boolean
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt?: Date
}

/**
 * Mongoose schema for Dashboard Widget subdocument
 */
const DashboardWidgetSchema = new Schema<IDashboardWidgetDocument>({
  id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
  },
  dataSource: {
    type: String,
    required: true,
  },
  size: {
    width: {
      type: Number,
      required: true,
      min: 1,
    },
    height: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  position: {
    x: {
      type: Number,
      required: true,
      min: 0,
    },
    y: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  config: {
    type: Schema.Types.Mixed,
  },
})

/**
 * Mongoose schema for Dashboard collection
 */
const DashboardSchema = new Schema<IDashboardDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: Object.values(DashboardType),
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    widgets: {
      type: [DashboardWidgetSchema],
      default: [],
    },
    isDefault: {
      type: Boolean,
      default: false,
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
DashboardSchema.index({ name: 1 })
DashboardSchema.index({ type: 1 })
DashboardSchema.index({ isDefault: 1 })
DashboardSchema.index({ isActive: 1 })
DashboardSchema.index({ createdBy: 1 })

// Compound index for type and isDefault
DashboardSchema.index({ type: 1, isDefault: 1 })

// Create and export the model
export const DashboardModel = mongoose.model<IDashboardDocument>('Dashboard', DashboardSchema)
