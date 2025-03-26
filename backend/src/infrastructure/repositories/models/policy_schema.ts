import mongoose, { Schema, Document } from 'mongoose';
import {
  PolicyType,
  PolicyStatus,
  PolicyFormat
} from '../../../domain/compliance/policy_values';

/**
 * Interface representing an Approver subdocument in MongoDB
 */
export interface IApproverDocument {
  userId: string;
  name: string;
  title: string;
  approvedAt: Date;
  comments?: string;
}

/**
 * Interface representing a Policy document in MongoDB
 */
export interface IPolicyDocument extends Document {
  _id: string;
  name: string;
  version: string;
  type: string;
  status: string;
  description: string;
  content?: string;
  documentUrl?: string;
  documentPath?: string;
  documentFormat?: string;
  relatedControlIds?: string[];
  owner: string;
  approvers?: IApproverDocument[];
  effectiveDate?: {
    startDate: Date;
    endDate?: Date;
  };
  reviewDate?: Date;
  tags?: string[];
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Mongoose schema for Approver subdocument
 */
const ApproverSchema = new Schema<IApproverDocument>({
  userId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  approvedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  comments: {
    type: String
  }
});

/**
 * Mongoose schema for Policy collection
 */
const PolicySchema = new Schema<IPolicyDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100
    },
    version: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: Object.values(PolicyType),
      required: true
    },
    status: {
      type: String,
      enum: Object.values(PolicyStatus),
      default: PolicyStatus.DRAFT
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000
    },
    content: {
      type: String
    },
    documentUrl: {
      type: String
    },
    documentPath: {
      type: String
    },
    documentFormat: {
      type: String,
      enum: Object.values(PolicyFormat)
    },
    relatedControlIds: {
      type: [String],
      default: undefined
    },
    owner: {
      type: String,
      required: true
    },
    approvers: {
      type: [ApproverSchema],
      default: undefined
    },
    effectiveDate: {
      startDate: {
        type: Date
      },
      endDate: {
        type: Date
      }
    },
    reviewDate: {
      type: Date
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

// Add compound index for name and version for uniqueness
PolicySchema.index({ name: 1, version: 1 }, { unique: true });

// Add indexes for common query fields
PolicySchema.index({ type: 1 });
PolicySchema.index({ status: 1 });
PolicySchema.index({ owner: 1 });
PolicySchema.index({ relatedControlIds: 1 });
PolicySchema.index({ "effectiveDate.startDate": 1 });
PolicySchema.index({ "effectiveDate.endDate": 1 });
PolicySchema.index({ reviewDate: 1 });
PolicySchema.index({ tags: 1 });
PolicySchema.index({ isActive: 1 });

// Create and export the model
export const PolicyModel = mongoose.model<IPolicyDocument>('Policy', PolicySchema);
