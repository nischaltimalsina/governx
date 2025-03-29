import mongoose, { Schema, Document } from 'mongoose'
import {
  AuditType,
  AuditStatus,
  FindingSeverity,
  FindingStatus,
} from '../../../domain/audit/audit_values'

/**
 * Interface representing an Audit Finding in MongoDB
 */
export interface IAuditFindingDocument {
  id: string
  title: string
  description: string
  severity: string
  status: string
  controlId?: string
  evidenceIds?: string[]
  remediation?: {
    plan?: string
    dueDate?: Date
    assigneeId?: string
    completedDate?: Date
    notes?: string
  }
  createdAt: Date
  updatedAt?: Date
}

/**
 * Interface representing an Audit Period in MongoDB
 */
export interface IAuditPeriodDocument {
  startDate: Date
  endDate: Date
}

/**
 * Interface representing a Question Section in MongoDB
 */
export interface IQuestionSectionDocument {
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
}

/**
 * Interface representing an Audit document in MongoDB
 */
export interface IAuditDocument extends Document {
  _id: string
  name: string
  type: string
  status: string
  description: string
  auditPeriod: IAuditPeriodDocument
  dueDate: Date
  auditeeId: string
  auditorId: string
  relatedFrameworkIds?: string[]
  relatedControlIds?: string[]
  findings?: IAuditFindingDocument[]
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
  _id: string
  name: string
  type: string
  description: string
  frameworkId?: string
  controlIds?: string[]
  questionSections: IQuestionSectionDocument[]
  isActive: boolean
  createdBy: string
  updatedBy?: string
  createdAt: Date
  updatedAt?: Date
}

/**
 * Mongoose schema for Audit Finding subdocument
 */
const AuditFindingSchema = new Schema<IAuditFindingDocument>({
  id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  severity: {
    type: String,
    enum: Object.values(FindingSeverity),
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(FindingStatus),
    required: true,
  },
  controlId: {
    type: String,
  },
  evidenceIds: {
    type: [String],
  },
  remediation: {
    plan: {
      type: String,
      maxlength: 2000,
    },
    dueDate: {
      type: Date,
    },
    assigneeId: {
      type: String,
    },
    completedDate: {
      type: Date,
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
})

/**
 * Mongoose schema for Audit Period subdocument
 */
const AuditPeriodSchema = new Schema<IAuditPeriodDocument>({
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
const QuestionSectionSchema = new Schema<IQuestionSectionDocument>({
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
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    auditPeriod: {
      type: AuditPeriodSchema,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    auditeeId: {
      type: String,
      required: true,
    },
    auditorId: {
      type: String,
      required: true,
    },
    relatedFrameworkIds: {
      type: [String],
    },
    relatedControlIds: {
      type: [String],
    },
    findings: {
      type: [AuditFindingSchema],
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
AuditSchema.index({ auditeeId: 1 })
AuditSchema.index({ auditorId: 1 })
AuditSchema.index({ dueDate: 1 })
AuditSchema.index({ relatedFrameworkIds: 1 })
AuditSchema.index({ relatedControlIds: 1 })
AuditSchema.index({ 'auditPeriod.startDate': 1 })
AuditSchema.index({ 'auditPeriod.endDate': 1 })
AuditSchema.index({ isActive: 1 })

// Add indexes for audit templates
AuditTemplateSchema.index({ type: 1 })
AuditTemplateSchema.index({ frameworkId: 1 })
AuditTemplateSchema.index({ isActive: 1 })

// Compound indexes for common query patterns
AuditSchema.index({ status: 1, dueDate: 1 })
AuditSchema.index({ auditorId: 1, status: 1 })
AuditSchema.index({ auditeeId: 1, status: 1 })

// Create and export the models
export const AuditModel = mongoose.model<IAuditDocument>('Audit', AuditSchema)
export const AuditTemplateModel = mongoose.model<IAuditTemplateDocument>(
  'AuditTemplate',
  AuditTemplateSchema
)
