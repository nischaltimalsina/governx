import mongoose, { Schema, Document } from 'mongoose';
import { ImplementationStatus } from '../../../domain/compliance/framework_values';

/**
 * Interface representing a Control document in MongoDB
 */
export interface IControlDocument extends Document {
  _id: string
  frameworkId: string;
  code: string;
  title: string;
  description: string;
  guidance?: string;
  implementationStatus: string;
  implementationDetails?: string;
  ownerId?: string;
  categories?: string[];
  parentControlId?: string;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Mongoose schema for Control collection
 */
const ControlSchema = new Schema<IControlDocument>(
  {
    frameworkId: {
      type: String,
      required: true,
      ref: 'Framework'
    },
    code: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000
    },
    guidance: {
      type: String,
      maxlength: 5000
    },
    implementationStatus: {
      type: String,
      enum: Object.values(ImplementationStatus),
      default: ImplementationStatus.NOT_IMPLEMENTED
    },
    implementationDetails: {
      type: String,
      maxlength: 2000
    },
    ownerId: {
      type: String,
      ref: 'User'
    },
    categories: {
      type: [String],
      default: undefined
    },
    parentControlId: {
      type: String,
      ref: 'Control'
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

// Add compound index for frameworkId and code for uniqueness
ControlSchema.index({ frameworkId: 1, code: 1 }, { unique: true });

// Add indexes for common query fields
ControlSchema.index({ frameworkId: 1, isActive: 1 });
ControlSchema.index({ implementationStatus: 1 });
ControlSchema.index({ ownerId: 1 });
ControlSchema.index({ categories: 1 });
ControlSchema.index({ parentControlId: 1 });

// Create and export the model
export const ControlModel = mongoose.model<IControlDocument>('Control', ControlSchema);
