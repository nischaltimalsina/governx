import mongoose, { Schema, Document } from 'mongoose';
import {
  EvidenceType,
  EvidenceStatus,
  EvidenceCollectionMethod
} from '../../../domain/compliance/evidence_values';

/**
 * Interface representing an Evidence document in MongoDB
 */
export interface IEvidenceDocument extends Document {
  _id: string;
  title: string;
  controlIds: string[];
  filename: string;
  fileHash?: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  type: string;
  status: string;
  collectionMethod: string;
  description?: string;
  collectedAt: Date;
  validityPeriod?: {
    startDate: Date;
    endDate?: Date;
  };
  reviewerId?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Mongoose schema for Evidence collection
 */
const EvidenceSchema = new Schema<IEvidenceDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    controlIds: {
      type: [String],
      required: true,
      validate: {
        validator: function(v: string[]) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Evidence must be linked to at least one control'
      }
    },
    filename: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },
    fileHash: {
      type: String,
      sparse: true, // Allows null/undefined values, but enforces uniqueness when present
      index: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true,
      min: 1
    },
    mimeType: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: Object.values(EvidenceType),
      required: true
    },
    status: {
      type: String,
      enum: Object.values(EvidenceStatus),
      default: EvidenceStatus.PENDING
    },
    collectionMethod: {
      type: String,
      enum: Object.values(EvidenceCollectionMethod),
      required: true
    },
    description: {
      type: String,
      maxlength: 2000
    },
    collectedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    validityPeriod: {
      startDate: {
        type: Date
      },
      endDate: {
        type: Date
      }
    },
    reviewerId: {
      type: String,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    reviewNotes: {
      type: String,
      maxlength: 1000
    },
    tags: {
      type: [String]
    },
    metadata: {
      type: Schema.Types.Mixed
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
EvidenceSchema.index({ controlIds: 1 });
EvidenceSchema.index({ status: 1 });
EvidenceSchema.index({ type: 1 });
EvidenceSchema.index({ collectedAt: 1 });
EvidenceSchema.index({ 'validityPeriod.endDate': 1 });
EvidenceSchema.index({ reviewerId: 1 });
EvidenceSchema.index({ tags: 1 });
EvidenceSchema.index({ createdBy: 1 });
EvidenceSchema.index({ isActive: 1 });

// Compound indexes for common query patterns
EvidenceSchema.index({ controlIds: 1, status: 1 });
EvidenceSchema.index({ controlIds: 1, isActive: 1 });
EvidenceSchema.index({ status: 1, collectedAt: 1 });

// Create and export the model
export const EvidenceModel = mongoose.model<IEvidenceDocument>('Evidence', EvidenceSchema);
