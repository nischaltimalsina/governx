import { IEvidenceRepository } from '../../domain/compliance/evidence_repository';
import { Evidence } from '../../domain/compliance/evidence';
import {
  EvidenceFilename,
  EvidenceTitle,
  EvidenceFileHash,
  EvidenceType,
  EvidenceStatus,
  EvidenceCollectionMethod,
  EvidenceValidityPeriod
} from '../../domain/compliance/evidence_values';
import { Result } from '../../domain/common/result';
import { EvidenceModel, IEvidenceDocument } from './models/evidence_schema';

/**
 * MongoDB implementation of the Evidence repository
 */
export class MongoEvidenceRepository implements IEvidenceRepository {
  /**
   * Find evidence by ID
   */
  public async findById(id: string): Promise<Result<Evidence | null, Error>> {
    try {
      const evidenceDoc = await EvidenceModel.findById(id);

      if (!evidenceDoc) {
        return Result.ok<null>(null);
      }

      return this.mapDocumentToDomain(evidenceDoc);
    } catch (error) {
      return Result.fail<Evidence | null>(
        error instanceof Error
          ? error
          : new Error(`Failed to find evidence with id ${id}`)
      );
    }
  }

  /**
   * Find all evidence with optional filters
   */
  public async findAll(options?: {
    controlId?: string;
    frameworkId?: string;
    status?: EvidenceStatus[];
    type?: EvidenceType[];
    tags?: string[];
    createdBy?: string;
    reviewerId?: string;
    startDate?: Date;
    endDate?: Date;
    active?: boolean;
    pageSize?: number;
    pageNumber?: number;
  }): Promise<Result<Evidence[], Error>> {
    try {
      // Build query
      const query: any = {};

      if (options?.controlId) {
        query.controlIds = options.controlId;
      }

      // If frameworkId is provided, we need to find all controls associated with that framework
      // and then find evidence linked to those controls
      // This would typically be handled through an aggregation pipeline in a production system
      // For simplicity, we're not implementing this here, but acknowledging it's needed

      if (options?.status && options.status.length > 0) {
        query.status = { $in: options.status };
      }

      if (options?.type && options.type.length > 0) {
        query.type = { $in: options.type };
      }

      if (options?.tags && options.tags.length > 0) {
        query.tags = { $in: options.tags };
      }

      if (options?.createdBy) {
        query.createdBy = options.createdBy;
      }

      if (options?.reviewerId) {
        query.reviewerId = options.reviewerId;
      }

      // Date range queries
      if (options?.startDate || options?.endDate) {
        query.collectedAt = {};

        if (options?.startDate) {
          query.collectedAt.$gte = options.startDate;
        }

        if (options?.endDate) {
          query.collectedAt.$lte = options.endDate;
        }
      }

      if (options?.active !== undefined) {
        query.isActive = options.active;
      }

      // Create query with pagination
      let evidenceDocs: IEvidenceDocument[];

      if (options?.pageSize && options?.pageNumber) {
        const skip = (options.pageNumber - 1) * options.pageSize;
        evidenceDocs = await EvidenceModel.find(query)
          .sort({ collectedAt: -1 })
          .skip(skip)
          .limit(options.pageSize);
      } else {
        evidenceDocs = await EvidenceModel.find(query)
          .sort({ collectedAt: -1 });
      }

      // Map documents to domain entities
      const evidenceList: Evidence[] = [];

      for (const doc of evidenceDocs) {
        const evidenceResult = await this.mapDocumentToDomain(doc);

        if (evidenceResult.isSuccess) {
          evidenceList.push(evidenceResult.getValue());
        }
      }

      return Result.ok<Evidence[]>(evidenceList);
    } catch (error) {
      return Result.fail<Evidence[]>(
        error instanceof Error
          ? error
          : new Error('Failed to find evidence')
      );
    }
  }

  /**
   * Find evidence by control ID
   */
  public async findByControlId(
    controlId: string,
    options?: {
      status?: EvidenceStatus[];
      active?: boolean;
    }
  ): Promise<Result<Evidence[], Error>> {
    try {
      // Build query
      const query: any = {
        controlIds: controlId
      };

      if (options?.status && options.status.length > 0) {
        query.status = { $in: options.status };
      }

      if (options?.active !== undefined) {
        query.isActive = options.active;
      }

      const evidenceDocs = await EvidenceModel.find(query)
        .sort({ collectedAt: -1 });

      // Map documents to domain entities
      const evidenceList: Evidence[] = [];

      for (const doc of evidenceDocs) {
        const evidenceResult = await this.mapDocumentToDomain(doc);

        if (evidenceResult.isSuccess) {
          evidenceList.push(evidenceResult.getValue());
        }
      }

      return Result.ok<Evidence[]>(evidenceList);
    } catch (error) {
      return Result.fail<Evidence[]>(
        error instanceof Error
          ? error
          : new Error(`Failed to find evidence for control ${controlId}`)
      );
    }
  }

  /**
   * Find evidence by framework ID
   * Note: This is a more complex query that would ideally use an aggregation pipeline
   * For simplicity, this implementation is a placeholder
   */
  public async findByFrameworkId(
    frameworkId: string,
    options?: {
      status?: EvidenceStatus[];
      active?: boolean;
      pageSize?: number;
      pageNumber?: number;
    }
  ): Promise<Result<Evidence[], Error>> {
    try {
      // In a real implementation, we would:
      // 1. Find all controls belonging to the framework
      // 2. Use those control IDs to find all related evidence

      // For now, we'll return an empty result with a note that this is not fully implemented
      console.log(`Finding evidence by frameworkId ${frameworkId} is not fully implemented`);

      return Result.ok<Evidence[]>([]);
    } catch (error) {
      return Result.fail<Evidence[]>(
        error instanceof Error
          ? error
          : new Error(`Failed to find evidence for framework ${frameworkId}`)
      );
    }
  }

  /**
   * Save evidence to repository
   */
  public async save(evidence: Evidence): Promise<Result<void, Error>> {
    try {
      const evidenceData = {
        title: evidence.title.getValue(),
        controlIds: evidence.controlIds,
        filename: evidence.filename.getValue(),
        fileHash: evidence.fileHash?.getValue(),
        filePath: evidence.filePath,
        fileSize: evidence.fileSize,
        mimeType: evidence.mimeType,
        type: evidence.type,
        status: evidence.status,
        collectionMethod: evidence.collectionMethod,
        description: evidence.description,
        collectedAt: evidence.collectedAt,
        validityPeriod: evidence.validityPeriod ? {
          startDate: evidence.validityPeriod.getStartDate(),
          endDate: evidence.validityPeriod.getEndDate()
        } : undefined,
        reviewerId: evidence.reviewerId,
        reviewedAt: evidence.reviewedAt,
        reviewNotes: evidence.reviewNotes,
        tags: evidence.tags,
        metadata: evidence.metadata,
        isActive: evidence.isActive,
        createdBy: evidence.createdBy,
        updatedBy: evidence.updatedBy
        // MongoDB will handle createdAt/updatedAt
      };

      await EvidenceModel.findByIdAndUpdate(
        evidence.id,
        evidenceData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error
          ? error
          : new Error(`Failed to save evidence with id ${evidence.id}`)
      );
    }
  }

  /**
   * Delete evidence from repository
   */
  public async delete(evidenceId: string): Promise<Result<void, Error>> {
    try {
      await EvidenceModel.findByIdAndDelete(evidenceId);
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error
          ? error
          : new Error(`Failed to delete evidence with id ${evidenceId}`)
      );
    }
  }

  /**
   * Count evidence with optional filters
   */
  public async count(options?: {
    controlId?: string;
    frameworkId?: string;
    status?: EvidenceStatus[];
    type?: EvidenceType[];
    active?: boolean;
  }): Promise<Result<number, Error>> {
    try {
      // Build query
      const query: any = {};

      if (options?.controlId) {
        query.controlIds = options.controlId;
      }

      // Framework ID handling would be similar to findByFrameworkId

      if (options?.status && options.status.length > 0) {
        query.status = { $in: options.status };
      }

      if (options?.type && options.type.length > 0) {
        query.type = { $in: options.type };
      }

      if (options?.active !== undefined) {
        query.isActive = options.active;
      }

      const count = await EvidenceModel.countDocuments(query);

      return Result.ok<number>(count);
    } catch (error) {
      return Result.fail<number>(
        error instanceof Error
          ? error
          : new Error('Failed to count evidence')
      );
    }
  }

  /**
   * Check if evidence exists with the given file hash
   */
  public async existsByHash(fileHash: string): Promise<Result<boolean, Error>> {
    try {
      const count = await EvidenceModel.countDocuments({ fileHash });
      return Result.ok<boolean>(count > 0);
    } catch (error) {
      return Result.fail<boolean>(
        error instanceof Error
          ? error
          : new Error(`Failed to check if evidence exists with hash ${fileHash}`)
      );
    }
  }

  /**
   * Find evidence by file hash
   */
  public async findByFileHash(fileHash: string): Promise<Result<Evidence | null, Error>> {
    try {
      const evidenceDoc = await EvidenceModel.findOne({ fileHash });

      if (!evidenceDoc) {
        return Result.ok<null>(null);
      }

      return this.mapDocumentToDomain(evidenceDoc);
    } catch (error) {
      return Result.fail<Evidence | null>(
        error instanceof Error
          ? error
          : new Error(`Failed to find evidence with hash ${fileHash}`)
      );
    }
  }

  /**
   * Map a MongoDB document to a domain Evidence entity
   */
  private async mapDocumentToDomain(doc: IEvidenceDocument): Promise<Result<Evidence, Error>> {
    try {
      // Create value objects
      const titleOrError = EvidenceTitle.create(doc.title);
      if (!titleOrError.isSuccess) {
        return Result.fail<Evidence>(titleOrError.getError());
      }

      const filenameOrError = EvidenceFilename.create(doc.filename);
      if (!filenameOrError.isSuccess) {
        return Result.fail<Evidence>(filenameOrError.getError());
      }

      // Create optional value objects
      let fileHashObj: EvidenceFileHash | undefined;
      if (doc.fileHash) {
        const fileHashOrError = EvidenceFileHash.create(doc.fileHash);
        if (!fileHashOrError.isSuccess) {
          return Result.fail<Evidence>(fileHashOrError.getError());
        }
        fileHashObj = fileHashOrError.getValue();
      }

      let validityPeriodObj: EvidenceValidityPeriod | undefined;
      if (doc.validityPeriod?.startDate) {
        const validityPeriodOrError = EvidenceValidityPeriod.create(
          doc.validityPeriod.startDate,
          doc.validityPeriod.endDate
        );
        if (!validityPeriodOrError.isSuccess) {
          return Result.fail<Evidence>(validityPeriodOrError.getError());
        }
        validityPeriodObj = validityPeriodOrError.getValue();
      }

      // Create Evidence entity
      return Evidence.create(doc._id.toString(), {
        title: titleOrError.getValue(),
        controlIds: doc.controlIds,
        filename: filenameOrError.getValue(),
        fileHash: fileHashObj,
        filePath: doc.filePath,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        type: doc.type as EvidenceType,
        status: doc.status as EvidenceStatus,
        collectionMethod: doc.collectionMethod as EvidenceCollectionMethod,
        description: doc.description,
        collectedAt: doc.collectedAt,
        validityPeriod: validityPeriodObj,
        tags: doc.tags,
        metadata: doc.metadata,
        isActive: doc.isActive,
        createdBy: doc.createdBy,
        createdAt: doc.createdAt
      });
    } catch (error) {
      return Result.fail<Evidence>(
        error instanceof Error
          ? error
          : new Error(`Failed to map evidence document to domain: ${error}`)
      );
    }
  }
}
