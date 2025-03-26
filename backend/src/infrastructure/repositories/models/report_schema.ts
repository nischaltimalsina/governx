import mongoose, { Schema, Document } from 'mongoose'
import {
  ReportType,
  ReportFormat,
  ReportScheduleFrequency,
} from '../../../domain/reporting/reporting_values'

/**
 * Interface representing a Report Filter subdocument in MongoDB
 */
export interface IReportFilterDocument {
  frameworkIds?: string[]
  controlIds?: string[]
  riskIds?: string[]
  evidenceIds?: string[]
  policyIds?: string[]
  startDate?: Date
  endDate?: Date
  tags?: string[]
  customFilters?: Record<string, any>
}

/**
 * Interface representing a Report Schedule subdocument in MongoDB
 */
export interface IReportScheduleDocument {
  frequency: string
  dayOfWeek?: number
  dayOfMonth?: number
  hour: number
  minute: number
  nextRunTime: Date
  recipients: string[]
}

/**
 * Interface representing a Report document in MongoDB
 */
export interface IReportDocument extends Document {
  _id: string
  name: string
  type: string
  description: string
  format: string
  filter?: IReportFilterDocument
  schedule?: IReportScheduleDocument
  templateId?: string
  lastGeneratedAt?: Date
  lastGeneratedBy?: string
  lastGeneratedFileUrl?: string
  isActive: boolean
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt?: Date
}

/**
 * Mongoose schema for Report Filter subdocument
 */
const ReportFilterSchema = new Schema<IReportFilterDocument>({
  frameworkIds: {
    type: [String],
    default: undefined,
  },
  controlIds: {
    type: [String],
    default: undefined,
  },
  riskIds: {
    type: [String],
    default: undefined,
  },
  evidenceIds: {
    type: [String],
    default: undefined,
  },
  policyIds: {
    type: [String],
    default: undefined,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  tags: {
    type: [String],
    default: undefined,
  },
  customFilters: {
    type: Schema.Types.Mixed,
  },
})

/**
 * Mongoose schema for Report Schedule subdocument
 */
const ReportScheduleSchema = new Schema<IReportScheduleDocument>({
  frequency: {
    type: String,
    enum: Object.values(ReportScheduleFrequency),
    required: true,
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6,
  },
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 31,
  },
  hour: {
    type: Number,
    required: true,
    min: 0,
    max: 23,
  },
  minute: {
    type: Number,
    required: true,
    min: 0,
    max: 59,
  },
  nextRunTime: {
    type: Date,
    required: true,
  },
  recipients: {
    type: [String],
    required: true,
    validate: [arrayMinLength, 'At least one recipient is required'],
  },
})

function arrayMinLength(val: any[]) {
  return val.length > 0
}

/**
 * Mongoose schema for Report collection
 */
const ReportSchema = new Schema<IReportDocument>(
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
      enum: Object.values(ReportType),
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    format: {
      type: String,
      enum: Object.values(ReportFormat),
      required: true,
    },
    filter: {
      type: ReportFilterSchema,
    },
    schedule: {
      type: ReportScheduleSchema,
    },
    templateId: {
      type: String,
    },
    lastGeneratedAt: {
      type: Date,
    },
    lastGeneratedBy: {
      type: String,
    },
    lastGeneratedFileUrl: {
      type: String,
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
ReportSchema.index({ name: 1 })
ReportSchema.index({ type: 1 })
ReportSchema.index({ 'schedule.nextRunTime': 1 })
ReportSchema.index({ isActive: 1 })
ReportSchema.index({ createdBy: 1 })

// Create and export the model
export const ReportModel = mongoose.model<IReportDocument>('Report', ReportSchema)
