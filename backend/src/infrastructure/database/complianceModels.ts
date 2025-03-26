import mongoose, { Schema, Document } from 'mongoose';
import { ControlStatus, EvidenceStatus, EvidenceSource } from '../../domain/models/compliance';

// Framework Schema
export interface IFrameworkDocument extends Document {
  name: string;
  version: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FrameworkSchema = new Schema<IFrameworkDocument>({
  name: { type: String, required: true, index: true },
  version: { type: String, required: true },
  description: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Control Schema
export interface IControlDocument extends Document {
  frameworkId: mongoose.Types.ObjectId;
  code: string;
  title: string;
  description: string;
  implementationGuidance?: string;
  status: string;
  ownerId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ControlSchema = new Schema<IControlDocument>({
  frameworkId: { type: Schema.Types.ObjectId, ref: 'Framework', required: true, index: true },
  code: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  implementationGuidance: { type: String },
  status: {
    type: String,
    enum: Object.values(ControlStatus),
    default: ControlStatus.NOT_IMPLEMENTED
  },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Add compound index for framework + code
ControlSchema.index({ frameworkId: 1, code: 1 }, { unique: true });

// Evidence Schema
export interface IEvidenceDocument extends Document {
  controlIds: mongoose.Types.ObjectId[];
  title: string;
  description?: string;
  fileUrls?: string[];
  metadata: Record<string, any>;
  source: string;
  collectionDate: Date;
  expirationDate?: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const EvidenceSchema = new Schema<IEvidenceDocument>({
  controlIds: [{ type: Schema.Types.ObjectId, ref: 'Control', required: true, index: true }],
  title: { type: String, required: true },
  description: { type: String },
  fileUrls: [{ type: String }],
  metadata: { type: Schema.Types.Mixed, default: {} },
  source: {
    type: String,
    enum: Object.values(EvidenceSource),
    default: EvidenceSource.MANUAL
  },
  collectionDate: { type: Date, required: true },
  expirationDate: { type: Date },
  status: {
    type: String,
    enum: Object.values(EvidenceStatus),
    default: EvidenceStatus.PENDING
  },
}, { timestamps: true });

// Add index for expiration date to easily query expiring evidence
EvidenceSchema.index({ expirationDate: 1 });

// Create and export the models
export const FrameworkModel = mongoose.model<IFrameworkDocument>('Framework', FrameworkSchema);
export const ControlModel = mongoose.model<IControlDocument>('Control', ControlSchema);
export const EvidenceModel = mongoose.model<IEvidenceDocument>('Evidence', EvidenceSchema);
