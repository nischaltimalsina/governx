import mongoose, { Schema, Document } from 'mongoose';
import {
  MetricType
} from '../../../domain/reporting/reporting_values';
import {
  MetricCalculationMethod,
  MetricTrendDirection
} from '../../../domain/reporting/metric';

/**
 * Interface representing a Metric Thresholds in MongoDB
 */
export interface IMetricThresholdsDocument {
  critical?: number;
  warning?: number;
  target?: number;
}

/**
 * Interface representing a Metric document in MongoDB
 */
export interface IMetricDocument extends Document {
  _id: string;
  name: string;
  type: string;
  description: string;
  calculationMethod: string;
  query: string;
  unit?: string;
  thresholds?: IMetricThresholdsDocument;
  currentValue?: number;
  previousValue?: number;
  trend?: string;
  lastCalculatedAt?: Date;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Mongoose schema for Metric Thresholds subdocument
 */
const MetricThresholdsSchema = new Schema<IMetricThresholdsDocument>({
  critical: {
    type: Number,
  },
  warning: {
    type: Number,
  },
  target: {
    type: Number,
  },
})

/**
 * Mongoose schema for Metric collection
 */
const MetricSchema = new Schema<IMetricDocument>(
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
      enum: Object.values(MetricType),
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    calculationMethod: {
      type: String,
      enum: Object.values(MetricCalculationMethod),
      required: true,
    },
    query: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
    },
    thresholds: {
      type: MetricThresholdsSchema,
    },
    currentValue: {
      type: Number,
    },
    previousValue: {
      type: Number,
    },
    trend: {
      type: String,
      enum: Object.values(MetricTrendDirection),
    },
    lastCalculatedAt: {
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
MetricSchema.index({ name: 1 })
MetricSchema.index({ type: 1 })
MetricSchema.index({ calculationMethod: 1 })
MetricSchema.index({ lastCalculatedAt: 1 })
MetricSchema.index({ isActive: 1 })

// Create and export the model
export const MetricModel = mongoose.model<IMetricDocument>('Metric', MetricSchema)
