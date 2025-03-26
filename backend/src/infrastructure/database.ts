import mongoose from 'mongoose';
import { Result } from '../domain/common/result';

/**
 * Database connection manager
 */
export class Database {
  private static instance: Database;
  private isConnected = false;

  /**
   * Get the singleton instance
   */
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Connect to MongoDB using the connection string from environment variables
   */
  public async connect(): Promise<Result<void, Error>> {
    if (this.isConnected) {
      return Result.ok<void>();
    }

    try {
      const connectionString = process.env.MONGODB_URI;

      if (!connectionString) {
        return Result.fail<void>(new Error('MongoDB connection string not provided'));
      }

      // Set up default mongoose options
      mongoose.set('strictQuery', true);

      await mongoose.connect(connectionString);

      this.isConnected = true;
      console.log('Connected to MongoDB');

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(error instanceof Error ? error : new Error('Failed to connect to MongoDB'));
    }
  }

  /**
   * Disconnect from MongoDB
   */
  public async disconnect(): Promise<Result<void, Error>> {
    if (!this.isConnected) {
      return Result.ok<void>();
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('Disconnected from MongoDB');

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(error instanceof Error ? error : new Error('Failed to disconnect from MongoDB'));
    }
  }
}

// Export a singleton instance
export const database = Database.getInstance();
