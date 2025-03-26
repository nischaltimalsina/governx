import mongoose, { Schema, Document } from 'mongoose';
import {
  RiskCategory,
  RiskStatus,
  RiskImpact,
  RiskLikelihood,
  RiskSeverity
} from '../../../domain/risk/risk_values';

/**
 * Interface representing a Risk Owner subdocument in MongoDB
 */
export interface IRiskOwnerDocument {
  userId: string;
  name: string;
  department: string;
  assignedAt: Date;
}

/**
 * Interface representing a Review Period subdocument in MongoDB
 */
export interface IReviewPeriodDocument {
  months: number;
  lastReviewed?: Date;
  nextReviewDate?: Date;
}

/**
 * Interface representing a Risk Score subdocument in MongoDB
 */
export interface IRiskScoreDocument {
  value: number;
  severity: string;
}

/**
 * Interface representing a Risk document in MongoDB
 */
export interface IRiskDocument extends Document {
  _id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  inherentImpact: string;
  inherentLikelihood: string;
  inherentRiskScore: IRiskScoreDocument;
  residualImpact?: string;
  residualLikelihood?: string;
  residualRiskScore?: IRiskScoreDocument;
  owner?: IRiskOwnerDocument;
  relatedControlIds?: string[];
  relatedAssets?: string[];
  reviewPeriod?: IReviewPeriodDocument;
  tags?: string[];
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Mongoose schema for Risk Owner subdocument
 */
const RiskOwnerSchema = new Schema<IRiskOwnerDocument>({
  userId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  assignedAt: {
    type: Date,
    required: true,
    default: Date.now
  }
});

/**
 * Mongoose schema for Review Period subdocument
 */
const ReviewPeriodSchema = new Schema<IReviewPeriodDocument>({
  months: {
    type: Number,
    required: true,
    min: 1
  },
  lastReviewed: {
    type: Date
  },
  nextReviewDate: {
    type: Date
  }
});

/**
 * Mongoose schema for Risk Score subdocument
 */
const RiskScoreSchema = new Schema<IRiskScoreDocument>({
  value: {
    type: Number,
    required: true,
    min: 1,
    max: 25
  },
  severity: {
    type: String,
    enum: Object.values(RiskSeverity),
    required: true
  }
});

/**
 * Mongoose schema for Risk collection
 */
const RiskSchema = new Schema<IRiskDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000
    },
    category: {
      type: String,
      enum: Object.values(RiskCategory),
      required: true
    },
    status: {
      type: String,
      enum: Object.values(RiskStatus),
      required: true,
      default: RiskStatus.IDENTIFIED
    },
    inherentImpact: {
      type: String,
      enum: Object.values(RiskImpact),
      required: true
    },
    inherentLikelihood: {
      type: String,
      enum: Object.values(RiskLikelihood),
      required: true
    },
    inherentRiskScore: {
      type: RiskScoreSchema,
      required: true
    },
    residualImpact: {
      type: String,
      enum: Object.values(RiskImpact)
    },
    residualLikelihood: {
      type: String,
      enum: Object.values(RiskLikelihood)
    },
    residualRiskScore: {
      type: RiskScoreSchema
    },
    owner: {
      type: RiskOwnerSchema
    },
    relatedControlIds: {
      type: [String],
      default: undefined
    },
    relatedAssets: {
      type: [String],
      default: undefined
    },
    reviewPeriod: {
      type: ReviewPeriodSchema
    },
    tags: {
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

// Add index for common query fields
RiskSchema.index({ name: 1 });
RiskSchema.index({ category: 1 });
RiskSchema.index({ status: 1 });
RiskSchema.index({ 'inherentRiskScore.severity': 1 });
RiskSchema.index({ 'residualRiskScore.severity': 1 });
RiskSchema.index({ 'owner.userId': 1 });
RiskSchema.index({ relatedControlIds: 1 });
RiskSchema.index({ relatedAssets: 1 });
RiskSchema.index({ 'reviewPeriod.nextReviewDate': 1 });
RiskSchema.index({ tags: 1 });
RiskSchema.index({ isActive: 1 });

// Create and export the model
export const RiskModel = mongoose.model<IRiskDocument>('Risk', RiskSchema);
