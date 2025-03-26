import mongoose, { Schema, Document } from 'mongoose';
import {
  TreatmentType,
  TreatmentStatus
} from '../../../domain/risk/risk_values';

/**
 * Interface representing a Risk Treatment document in MongoDB
 */
export interface IRiskTreatmentDocument extends Document {
  _id: string
  riskId: string
  name: string
  description: string
  type: string
  status: string
  dueDate?: Date
  completedDate?: Date
  assignee?: string
  cost?: number
  relatedControlIds?: string[]
  isActive: boolean
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt?: Date
}

/**
 * Mongoose schema for Risk Treatment collection
 */
const RiskTreatmentSchema = new Schema<IRiskTreatmentDocument>(
  {
    riskId: {
      type: String,
      required: true,
      ref: 'Risk'
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000
    },
    type: {
      type: String,
      enum: Object.values(TreatmentType),
      required: true
    },
    status: {
      type: String,
      enum: Object.values(TreatmentStatus),
      required: true,
      default: TreatmentStatus.PLANNED
    },
    dueDate: {
      type: Date
    },
    completedDate: {
      type: Date
    },
    assignee: {
      type: String,
      ref: 'User'
    },
    cost: {
      type: Number,
      min: 0
    },
    relatedControlIds: {
      type: [String],
      default: undefined
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: String,
      required: true
    },
    updatedBy: {
      type: String
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt fields
  }
);

// Add indexes for common query fields
RiskTreatmentSchema.index({ riskId: 1 });
RiskTreatmentSchema.index({ type: 1 });
RiskTreatmentSchema.index({ status: 1 });
RiskTreatmentSchema.index({ dueDate: 1 });
RiskTreatmentSchema.index({ assignee: 1 });
RiskTreatmentSchema.index({ relatedControlIds: 1 });
RiskTreatmentSchema.index({ isActive: 1 });

// Compound indexes for common query patterns
RiskTreatmentSchema.index({ riskId: 1, status: 1 });
RiskTreatmentSchema.index({ assignee: 1, status: 1 });
RiskTreatmentSchema.index({ dueDate: 1, status: 1 });

// Create and export the model
export const RiskTreatmentModel = mongoose.model<IRiskTreatmentDocument>('RiskTreatment', RiskTreatmentSchema);
