import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface representing a Framework document in MongoDB
 */
export interface IFrameworkDocument extends Document {
  _id: string;
  name: string;
  version: string;
  description: string;
  organization?: string;
  category?: string;
  website?: string;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Mongoose schema for Framework collection
 */
const FrameworkSchema = new Schema<IFrameworkDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    version: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000
    },
    organization: {
      type: String,
      trim: true,
      maxlength: 255
    },
    category: {
      type: String,
      trim: true,
      maxlength: 100
    },
    website: {
      type: String,
      trim: true,
      maxlength: 255
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

// Add compound index for name and version for uniqueness
FrameworkSchema.index({ name: 1, version: 1 }, { unique: true });

// Add index for common query fields
FrameworkSchema.index({ isActive: 1 });
FrameworkSchema.index({ category: 1 });
FrameworkSchema.index({ organization: 1 });

// Create and export the model
export const FrameworkModel = mongoose.model<IFrameworkDocument>('Framework', FrameworkSchema);
