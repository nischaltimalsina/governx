import mongoose, { Schema, Document, ObjectId } from 'mongoose'
import { AuditType, AuditStatus } from '../../../domain/audit/audit_values'

/**
 * Interface representing an Auditor in MongoDB
 */
export interface IAuditorDocument {
  id: string
  name: string
  organization?: string
  role?: string
  isExternal: boolean
}

/**
 * Interface representing an Audit Schedule in MongoDB
 */
export interface IAuditScheduleDocument {
  startDate: Date
  endDate: Date
}

/**
 * Interface representing an Audit document in MongoDB
 */
export interface IAuditDocument extends Document {
  _id: ObjectId
  name: string
  type: string
  status: string
  description: string
  frameworkIds: string[]
  leadAuditor: IAuditorDocument
  auditTeam?: IAuditorDocument[]
  schedule: IAuditScheduleDocument
  scope?: string
  methodology?: string
  isActive: boolean
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt?: Date
}

/**
 * Interface representing an Audit Template document in MongoDB
 */
export interface IAuditTemplateDocument extends Document {
  _id: ObjectId
  name: string
  type: string
  description: string
  frameworkId?: string
  controlIds?: string[]
  questionSections: {
    title: string
    description?: string
    questions: {
      id: string
      text: string
      guidance?: string
      controlId?: string
      responseType: string
      options?: string[]
      required: boolean
    }[]
  }[]
  isActive: boolean
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt?: Date
}

/**
 * Mongoose schema for Auditor subdocument
 */
const AuditorSchema = new Schema<IAuditorDocument>({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  organization: {
    type: String,
  },
  role: {
    type: String,
  },
  isExternal: {
    type: Boolean,
    default: false,
  },
})

/**
 * Mongoose schema for Audit Schedule subdocument
 */
const AuditScheduleSchema = new Schema<IAuditScheduleDocument>({
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
})

/**
 * Mongoose schema for Question subdocument
 */
const QuestionSchema = new Schema({
  id: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  guidance: {
    type: String,
  },
  controlId: {
    type: String,
  },
  responseType: {
    type: String,
    required: true,
    enum: ['text', 'yesno', 'multiple', 'number', 'date'],
  },
  options: {
    type: [String],
  },
  required: {
    type: Boolean,
    default: false,
  },
})

/**
 * Mongoose schema for Question Section subdocument
 */
const QuestionSectionSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
  },
  questions: {
    type: [QuestionSchema],
    default: [],
  },
})

/**
 * Mongoose schema for Audit collection
 */
const AuditSchema = new Schema<IAuditDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: Object.values(AuditType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(AuditStatus),
      required: true,
      default: AuditStatus.PLANNED,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    frameworkIds: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return Array.isArray(v) && v.length > 0
        },
        message: 'At least one framework must be specified',
      },
    },
    leadAuditor: {
      type: AuditorSchema,
      required: true,
    },
    auditTeam: {
      type: [AuditorSchema],
    },
    schedule: {
      type: AuditScheduleSchema,
      required: true,
    },
    scope: {
      type: String,
      maxlength: 5000,
    },
    methodology: {
      type: String,
      maxlength: 5000,
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

/**
 * Mongoose schema for Audit Template collection
 */
const AuditTemplateSchema = new Schema<IAuditTemplateDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: Object.values(AuditType),
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    frameworkId: {
      type: String,
    },
    controlIds: {
      type: [String],
    },
    questionSections: {
      type: [QuestionSectionSchema],
      default: [],
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
AuditSchema.index({ type: 1 })
AuditSchema.index({ status: 1 })
AuditSchema.index({ 'leadAuditor.id': 1 })
AuditSchema.index({ frameworkIds: 1 })
AuditSchema.index({ 'schedule.startDate': 1 })
AuditSchema.index({ 'schedule.endDate': 1 })
AuditSchema.index({ isActive: 1 })

// Add indexes for audit templates
AuditTemplateSchema.index({ type: 1 })
AuditTemplateSchema.index({ frameworkId: 1 })
AuditTemplateSchema.index({ isActive: 1 })

// Compound indexes for common query patterns
AuditSchema.index({ status: 1, 'schedule.endDate': 1 })
AuditSchema.index({ 'leadAuditor.id': 1, status: 1 })
AuditSchema.index({ frameworkIds: 1, status: 1 })

// Create and export the models
export const AuditModel = mongoose.model<IAuditDocument>('Audit', AuditSchema)
export const AuditTemplateModel = mongoose.model<IAuditTemplateDocument>(
  'AuditTemplate',
  AuditTemplateSchema
)
