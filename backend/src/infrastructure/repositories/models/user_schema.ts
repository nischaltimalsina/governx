import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../../../domain/auth/entities';

/**
 * Interface representing a User document in MongoDB
 */
export interface IUserDocument extends Document {
  _id: string
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for User collection
 */
const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    roles: {
      type: [String],
      enum: Object.values(UserRole),
      required: true,
      default: [UserRole.STANDARD_USER],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Add index for email field for faster lookups
UserSchema.index({ email: 1 });

// Create and export the model
export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);
