import { IRiskRepository } from '../../domain/risk/repositories';
import { Risk } from '../../domain/risk/risk';
import {
  RiskName,
  RiskCategory,
  RiskStatus,
  RiskSeverity,
  RiskImpact,
  RiskLikelihood,
  RiskScore,
  RiskOwner,
  ReviewPeriod
} from '../../domain/risk/risk_values';
import { Result } from '../../domain/common/result';
import { RiskModel, IRiskDocument } from './models/risk_schema';

/**
 * MongoDB implementation of the Risk repository
 */
export class MongoRiskRepository implements IRiskRepository {
  /**
   * Find a risk by ID
   */
  public async findById(id: string): Promise<Result<Risk | null, Error>> {
    try {
      const riskDoc = await RiskModel.findById(id);

      if (!riskDoc) {
        return Result.ok<null>(null);
      }

      return this.mapDocumentToDomain(riskDoc);
    } catch (error) {
      return Result.fail<Risk | null>(
        error instanceof Error
          ? error
          : new Error(`Failed to find risk with id ${id}`)
      );
    }
  }

  /**
   * Find all risks with optional filters
   */
  public async findAll(options?: {
    categories?: RiskCategory[];
    statuses?: RiskStatus[];
    severities?: RiskSeverity[];
    ownerId?: string;
    controlId?: string;
    assetId?: string;
    tags?: string[];
    reviewDue?: boolean;
    active?: boolean;
    pageSize?: number;
    pageNumber?: number;
  }): Promise<Result<Risk[], Error>> {
    try {
      // Build query
      const query: any = {};

      if (options?.categories && options.categories.length > 0) {
        query.category = { $in: options.categories };
      }

      if (options?.statuses && options.statuses.length > 0) {
        query.status = { $in: options.statuses };
      }

      if (options?.severities && options.severities.length > 0) {
        query['inherentRiskScore.severity'] = { $in: options.severities };
      }

      if (options?.ownerId) {
        query['owner.userId'] = options.ownerId;
      }

      if (options?.controlId) {
        query.relatedControlIds = options.controlId;
      }

      if (options?.assetId) {
        query.relatedAssets = options.assetId;
      }

      if (options?.tags && options.tags.length > 0) {
        query.tags = { $in: options.tags };
      }

      if (options?.reviewDue) {
        const now = new Date();
        query['reviewPeriod.nextReviewDate'] = { $lte: now };
      }

      if (options?.active !== undefined) {
        query.isActive = options.active;
      }

      // Create query with pagination
      let riskDocs: IRiskDocument[];

      if (options?.pageSize && options?.pageNumber) {
        const skip = (options.pageNumber - 1) * options.pageSize;
        riskDocs = await RiskModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(options.pageSize);
      } else {
        riskDocs = await RiskModel.find(query)
          .sort({ createdAt: -1 });
      }

      // Map documents to domain entities
      const risks: Risk[] = [];

      for (const doc of riskDocs) {
        const riskResult = await this.mapDocumentToDomain(doc);

        if (riskResult.isSuccess) {
          risks.push(riskResult.getValue());
        }
      }

      return Result.ok<Risk[]>(risks);
    } catch (error) {
      return Result.fail<Risk[]>(
        error instanceof Error
          ? error
          : new Error('Failed to find risks')
      );
    }
  }

  /**
   * Find risks by owner
   */
  public async findByOwner(
    ownerId: string,
    options?: {
      statuses?: RiskStatus[];
      active?: boolean;
    }
  ): Promise<Result<Risk[], Error>> {
    try {
      // Build query
      const query: any = {
        'owner.userId': ownerId
      };

      if (options?.statuses && options.statuses.length > 0) {
        query.status = { $in: options.statuses };
      }

      if (options?.active !== undefined) {
        query.isActive = options.active;
      }

      const riskDocs = await RiskModel.find(query)
        .sort({ createdAt: -1 });

      // Map documents to domain entities
      const risks: Risk[] = [];

      for (const doc of riskDocs) {
        const riskResult = await this.mapDocumentToDomain(doc);

        if (riskResult.isSuccess) {
          risks.push(riskResult.getValue());
        }
      }

      return Result.ok<Risk[]>(risks);
    } catch (error) {
      return Result.fail<Risk[]>(
        error instanceof Error
          ? error
          : new Error(`Failed to find risks for owner ${ownerId}`)
      );
    }
  }

  /**
   * Find risks by control ID
   */
  public async findByControlId(
    controlId: string,
    options?: {
      statuses?: RiskStatus[];
      active?: boolean;
    }
  ): Promise<Result<Risk[], Error>> {
    try {
      // Build query
      const query: any = {
        relatedControlIds: controlId
      };

      if (options?.statuses && options.statuses.length > 0) {
        query.status = { $in: options.statuses };
      }

      if (options?.active !== undefined) {
        query.isActive = options.active;
      }

      const riskDocs = await RiskModel.find(query)
        .sort({ createdAt: -1 });

      // Map documents to domain entities
      const risks: Risk[] = [];

      for (const doc of riskDocs) {
        const riskResult = await this.mapDocumentToDomain(doc);

        if (riskResult.isSuccess) {
          risks.push(riskResult.getValue());
        }
      }

      return Result.ok<Risk[]>(risks);
    } catch (error) {
      return Result.fail<Risk[]>(
        error instanceof Error
          ? error
          : new Error(`Failed to find risks for control ${controlId}`)
      );
    }
  }

  /**
   * Save a risk to the repository
   */
  public async save(risk: Risk): Promise<Result<void, Error>> {
    try {
      const riskData: any = {
        name: risk.name.getValue(),
        description: risk.description,
        category: risk.category,
        status: risk.status,
        inherentImpact: risk.inherentImpact,
        inherentLikelihood: risk.inherentLikelihood,
        inherentRiskScore: {
          value: risk.inherentRiskScore.getValue(),
          severity: risk.inherentRiskScore.getSeverity()
        },
        relatedControlIds: risk.relatedControlIds,
        relatedAssets: risk.relatedAssets,
        tags: risk.tags,
        isActive: risk.isActive,
        createdBy: risk.createdBy,
        updatedBy: risk.updatedBy
        // MongoDB will handle createdAt/updatedAt
      };

      // Add optional fields if they exist
      if (risk.residualImpact && risk.residualLikelihood && risk.residualRiskScore) {
        riskData.residualImpact = risk.residualImpact;
        riskData.residualLikelihood = risk.residualLikelihood;
        riskData.residualRiskScore = {
          value: risk.residualRiskScore.getValue(),
          severity: risk.residualRiskScore.getSeverity()
        };
      }

      if (risk.owner) {
        riskData.owner = {
          userId: risk.owner.getUserId(),
          name: risk.owner.getName(),
          department: risk.owner.getDepartment(),
          assignedAt: risk.owner.getAssignedAt()
        };
      }

      if (risk.reviewPeriod) {
        riskData.reviewPeriod = {
          months: risk.reviewPeriod.getMonths(),
          lastReviewed: risk.reviewPeriod.getLastReviewed(),
          nextReviewDate: risk.reviewPeriod.getNextReviewDate()
        };
      }

      await RiskModel.findByIdAndUpdate(
        risk.id,
        riskData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error
          ? error
          : new Error(`Failed to save risk with id ${risk.id}`)
      );
    }
  }

  /**
   * Delete a risk from the repository
   */
  public async delete(riskId: string): Promise<Result<void, Error>> {
    try {
      await RiskModel.findByIdAndDelete(riskId);
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error
          ? error
          : new Error(`Failed to delete risk with id ${riskId}`)
      );
    }
  }

  /**
   * Count risks with optional filters
   */
  public async count(options?: {
    categories?: RiskCategory[];
    statuses?: RiskStatus[];
    severities?: RiskSeverity[];
    ownerId?: string;
    controlId?: string;
    assetId?: string;
    reviewDue?: boolean;
    active?: boolean;
  }): Promise<Result<number, Error>> {
    try {
      // Build query
      const query: any = {};

      if (options?.categories && options.categories.length > 0) {
        query.category = { $in: options.categories };
      }

      if (options?.statuses && options.statuses.length > 0) {
        query.status = { $in: options.statuses };
      }

      if (options?.severities && options.severities.length > 0) {
        query['inherentRiskScore.severity'] = { $in: options.severities };
      }

      if (options?.ownerId) {
        query['owner.userId'] = options.ownerId;
      }

      if (options?.controlId) {
        query.relatedControlIds = options.controlId;
      }

      if (options?.assetId) {
        query.relatedAssets = options.assetId;
      }

      if (options?.reviewDue) {
        const now = new Date();
        query['reviewPeriod.nextReviewDate'] = { $lte: now };
      }

      if (options?.active !== undefined) {
        query.isActive = options.active;
      }

      const count = await RiskModel.countDocuments(query);

      return Result.ok<number>(count);
    } catch (error) {
      return Result.fail<number>(
        error instanceof Error
          ? error
          : new Error('Failed to count risks')
      );
    }
  }

  /**
   * Map a MongoDB document to a domain Risk entity
   */
  private async mapDocumentToDomain(doc: IRiskDocument): Promise<Result<Risk, Error>> {
    try {
      // Create value objects
      const nameOrError = RiskName.create(doc.name);
      if (!nameOrError.isSuccess) {
        return Result.fail<Risk>(nameOrError.getError());
      }

      // Create risk scores
      const inherentScoreOrError = RiskScore.createFromValue(doc.inherentRiskScore.value);
      if (!inherentScoreOrError.isSuccess) {
        return Result.fail<Risk>(inherentScoreOrError.getError());
      }

      // Create optional value objects if they exist
      let residualRiskScore: RiskScore | undefined;
      if (doc.residualRiskScore) {
        const residualScoreOrError = RiskScore.createFromValue(doc.residualRiskScore.value);
        if (!residualScoreOrError.isSuccess) {
          return Result.fail<Risk>(residualScoreOrError.getError());
        }
        residualRiskScore = residualScoreOrError.getValue();
      }

      // Create owner if it exists
      let owner: RiskOwner | undefined;
      if (doc.owner) {
        const ownerOrError = RiskOwner.create(
          doc.owner.userId,
          doc.owner.name,
          doc.owner.department,
          doc.owner.assignedAt
        );
        if (!ownerOrError.isSuccess) {
          return Result.fail<Risk>(ownerOrError.getError());
        }
        owner = ownerOrError.getValue();
      }

      // Create review period if it exists
      let reviewPeriod: ReviewPeriod | undefined;
      if (doc.reviewPeriod) {
        const reviewPeriodOrError = ReviewPeriod.create(
          doc.reviewPeriod.months,
          doc.reviewPeriod.lastReviewed,
          doc.reviewPeriod.nextReviewDate
        );
        if (!reviewPeriodOrError.isSuccess) {
          return Result.fail<Risk>(reviewPeriodOrError.getError());
        }
        reviewPeriod = reviewPeriodOrError.getValue();
      }

      // Create Risk entity
      return Risk.create(doc._id.toString(), {
        name: nameOrError.getValue(),
        description: doc.description,
        category: doc.category as RiskCategory,
        status: doc.status as RiskStatus,
        inherentImpact: doc.inherentImpact as RiskImpact,
        inherentLikelihood: doc.inherentLikelihood as RiskLikelihood,
        residualImpact: doc.residualImpact as RiskImpact | undefined,
        residualLikelihood: doc.residualLikelihood as RiskLikelihood | undefined,
        owner,
        relatedControlIds: doc.relatedControlIds,
        relatedAssets: doc.relatedAssets,
        reviewPeriod,
        tags: doc.tags,
        isActive: doc.isActive,
        createdBy: doc.createdBy,
        createdAt: doc.createdAt
      });
    } catch (error) {
      return Result.fail<Risk>(
        error instanceof Error
          ? error
          : new Error(`Failed to map risk document to domain: ${error}`)
      );
    }
  }
}
