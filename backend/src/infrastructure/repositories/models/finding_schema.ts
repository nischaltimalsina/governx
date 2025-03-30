import mongoose, { ObjectId } from 'mongoose'
import { FindingType, FindingSeverity, FindingStatus } from '../../../domain/audit/audit_values'

// Define the finding document interface
export interface IFindingDocument extends mongoose.Document {
  _id: ObjectId
  auditId: string
  title: string
  description: string
  type: string
  severity: string
  status: string
  controlIds?: string[]
  evidenceIds?: string[]
  remediationPlan?: {
    description: string
    dueDate: Date
    assignee: string
    status: string
    lastUpdated: Date
    updatedBy: string
  }
  dueDate?: Date
  isActive: boolean
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt?: Date
}

// Define the finding schema
const FindingSchema = new mongoose.Schema<IFindingDocument>(
  {
    auditId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: Object.values(FindingType),
      required: true,
    },
    severity: {
      type: String,
      enum: Object.values(FindingSeverity),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(FindingStatus),
      required: true,
      default: FindingStatus.OPEN,
    },
    controlIds: {
      type: [String],
      default: undefined,
    },
    evidenceIds: {
      type: [String],
      default: undefined,
    },
    remediationPlan: {
      description: {
        type: String,
        required: function () {
          return !!this.remediationPlan
        },
      },
      dueDate: {
        type: Date,
        required: function () {
          return !!this.remediationPlan
        },
      },
      assignee: {
        type: String,
        required: function () {
          return !!this.remediationPlan
        },
      },
      status: {
        type: String,
        enum: Object.values(FindingStatus),
        required: function () {
          return !!this.remediationPlan
        },
      },
      lastUpdated: {
        type: Date,
        required: function () {
          return !!this.remediationPlan
        },
      },
      updatedBy: {
        type: String,
        required: function () {
          return !!this.remediationPlan
        },
      },
    },
    dueDate: {
      type: Date,
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
FindingSchema.index({ type: 1 })
FindingSchema.index({ severity: 1 })
FindingSchema.index({ status: 1 })
FindingSchema.index({ 'remediationPlan.assignee': 1 })
FindingSchema.index({ dueDate: 1 })
FindingSchema.index({ controlIds: 1 })
FindingSchema.index({ 'remediationPlan.dueDate': 1 })
FindingSchema.index({ isActive: 1 })

// Compound indexes for common query patterns
FindingSchema.index({ auditId: 1, status: 1 })
FindingSchema.index({ severity: 1, status: 1 })
FindingSchema.index({ 'remediationPlan.assignee': 1, status: 1 })

// Create and export the model
export const FindingModel = mongoose.model<IFindingDocument>('Finding', FindingSchema)
