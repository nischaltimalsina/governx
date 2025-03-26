import { IPolicyRepository } from '../../domain/compliance/policy_repository';
import { Policy } from '../../domain/compliance/policy';
import {
  PolicyName,
  PolicyVersion,
  PolicyType,
  PolicyStatus,
  PolicyFormat,
  PolicyApprover,
  EffectiveDate
} from '../../domain/compliance/policy_values';
import { Result } from '../../domain/common/result';
import { PolicyModel, IPolicyDocument } from './models/policy_schema';

/**
 * MongoDB implementation of the Policy repository
 */
export class MongoPolicyRepository implements IPolicyRepository {
  /**
   * Find a policy by ID
   */
  public async findById(id: string): Promise<Result<Policy | null, Error>> {
    try {
      const policyDoc = await PolicyModel.findById(id);

      if (!policyDoc) {
        return Result.ok<null>(null);
      }

      return this.mapDocumentToDomain(policyDoc);
    } catch (error) {
      return Result.fail<Policy | null>(
        error instanceof Error
          ? error
          : new Error(`Failed to find policy with id ${id}`)
      );
    }
  }

  /**
   * Find a policy by name and version
   */
  public async findByNameAndVersion(
    name: PolicyName,
    version: PolicyVersion
  ): Promise<Result<Policy | null, Error>> {
    try {
      const policyDoc = await PolicyModel.findOne({
        name: name.getValue(),
        version: version.getValue()
      });

      if (!policyDoc) {
        return Result.ok<null>(null);
      }

      return this.mapDocumentToDomain(policyDoc);
    } catch (error) {
      return Result.fail<Policy | null>(
        error instanceof Error
          ? error
          : new Error(`Failed to find policy with name ${name.getValue()} and version ${version.getValue()}`)
      );
    }
  }

  /**
   * Find the latest version of a policy by name
   */
  public async findLatestByName(name: PolicyName): Promise<Result<Policy | null, Error>> {
    try {
      // Find all policies with this name, sorted by version (descending)
      const policyDocs = await PolicyModel.find({ name: name.getValue() })
        .sort({ version: -1 })
        .limit(1);

      if (!policyDocs.length) {
        return Result.ok<null>(null);
      }

      return this.mapDocumentToDomain(policyDocs[0]);
    } catch (error) {
      return Result.fail<Policy | null>(
        error instanceof Error
          ? error
          : new Error(`Failed to find latest policy with name ${name.getValue()}`)
      );
    }
  }

  /**
   * Find all policies with optional filters
   */
  public async findAll(options?: {
    type?: PolicyType[];
    status?: PolicyStatus[];
    owner?: string;
    controlId?: string;
    tags?: string[];
    effectiveOnly?: boolean;
    reviewDue?: boolean;
    active?: boolean;
    pageSize?: number;
    pageNumber?: number;
  }): Promise<Result<Policy[], Error>> {
    try {
      // Build query
      const query: any = {};

      if (options?.type && options.type.length > 0) {
        query.type = { $in: options.type };
      }

      if (options?.status && options.status.length > 0) {
        query.status = { $in: options.status };
      }

      if (options?.owner) {
        query.owner = options.owner;
      }

      if (options?.controlId) {
        query.relatedControlIds = options.controlId;
      }

      if (options?.tags && options.tags.length > 0) {
        query.tags = { $in: options.tags };
      }

      if (options?.active !== undefined) {
        query.isActive = options.active;
      }

      // Handle effectiveOnly filter
      if (options?.effectiveOnly) {
        const now = new Date();
        query['effectiveDate.startDate'] = { $lte: now };
        query.$or = [
          { 'effectiveDate.endDate': { $exists: false } },
          { 'effectiveDate.endDate': { $gte: now } }
        ];
      }

      // Handle reviewDue filter
      if (options?.reviewDue) {
        const now = new Date();
        query.reviewDate = { $lte: now };
      }

      // Create query with pagination
      let policyDocs: IPolicyDocument[];

      if (options?.pageSize && options?.pageNumber) {
        const skip = (options.pageNumber - 1) * options.pageSize;
        policyDocs = await PolicyModel.find(query)
          .sort({ name: 1, version: -1 })
          .skip(skip)
          .limit(options.pageSize);
      } else {
        policyDocs = await PolicyModel.find(query)
          .sort({ name: 1, version: -1 });
      }

      // Map documents to domain entities
      const policies: Policy[] = [];

      for (const doc of policyDocs) {
        const policyResult = await this.mapDocumentToDomain(doc);

        if (policyResult.isSuccess) {
          policies.push(policyResult.getValue());
        }
      }

      return Result.ok<Policy[]>(policies);
    } catch (error) {
      return Result.fail<Policy[]>(
        error instanceof Error
          ? error
          : new Error('Failed to find policies')
      );
    }
  }

  /**
   * Find all policies related to a control
   */
  public async findByControlId(
    controlId: string,
    options?: {
      status?: PolicyStatus[];
      active?: boolean;
    }
  ): Promise<Result<Policy[], Error>> {
    try {
      // Build query
      const query: any = {
        relatedControlIds: controlId
      };

      if (options?.status && options.status.length > 0) {
        query.status = { $in: options.status };
      }

      if (options?.active !== undefined) {
        query.isActive = options.active;
      }

      const policyDocs = await PolicyModel.find(query)
        .sort({ name: 1, version: -1 });

      // Map documents to domain entities
      const policies: Policy[] = [];

      for (const doc of policyDocs) {
        const policyResult = await this.mapDocumentToDomain(doc);

        if (policyResult.isSuccess) {
          policies.push(policyResult.getValue());
        }
      }

      return Result.ok<Policy[]>(policies);
    } catch (error) {
      return Result.fail<Policy[]>(
        error instanceof Error
          ? error
          : new Error(`Failed to find policies for control ${controlId}`)
      );
    }
  }

  /**
   * Find policies by owner
   */
  public async findByOwner(
    ownerId: string,
    options?: {
      status?: PolicyStatus[];
      active?: boolean;
    }
  ): Promise<Result<Policy[], Error>> {
    try {
      // Build query
      const query: any = {
        owner: ownerId
      };

      if (options?.status && options.status.length > 0) {
        query.status = { $in: options.status };
      }

      if (options?.active !== undefined) {
        query.isActive = options.active;
      }

      const policyDocs = await PolicyModel.find(query)
        .sort({ name: 1, version: -1 });

      // Map documents to domain entities
      const policies: Policy[] = [];

      for (const doc of policyDocs) {
        const policyResult = await this.mapDocumentToDomain(doc);

        if (policyResult.isSuccess) {
          policies.push(policyResult.getValue());
        }
      }

      return Result.ok<Policy[]>(policies);
    } catch (error) {
      return Result.fail<Policy[]>(
        error instanceof Error
          ? error
          : new Error(`Failed to find policies for owner ${ownerId}`)
      );
    }
  }

  /**
   * Check if a policy with the given name and version exists
   */
  public async exists(
    name: PolicyName,
    version: PolicyVersion
  ): Promise<Result<boolean, Error>> {
    try {
      const count = await PolicyModel.countDocuments({
        name: name.getValue(),
        version: version.getValue()
      });

      return Result.ok<boolean>(count > 0);
    } catch (error) {
      return Result.fail<boolean>(
        error instanceof Error
          ? error
          : new Error(`Failed to check if policy exists with name ${name.getValue()} and version ${version.getValue()}`)
      );
    }
  }

  /**
   * Save a policy to the repository
   */
  public async save(policy: Policy): Promise<Result<void, Error>> {
    try {
      const policyData: any = {
        name: policy.name.getValue(),
        version: policy.version.getValue(),
        type: policy.type,
        status: policy.status,
        description: policy.description,
        content: policy.content,
        documentUrl: policy.documentUrl,
        documentPath: policy.documentPath,
        documentFormat: policy.documentFormat,
        relatedControlIds: policy.relatedControlIds,
        owner: policy.owner,
        isActive: policy.isActive,
        createdBy: policy.createdBy,
        updatedBy: policy.updatedBy,
        // MongoDB will handle createdAt/updatedAt
      };

      // Add optional fields if they exist
      if (policy.approvers && policy.approvers.length > 0) {
        policyData.approvers = policy.approvers.map(approver => ({
          userId: approver.getUserId(),
          name: approver.getName(),
          title: approver.getTitle(),
          approvedAt: approver.getApprovedAt(),
          comments: approver.getComments()
        }));
      }

      if (policy.effectiveDate) {
        policyData.effectiveDate = {
          startDate: policy.effectiveDate.getStartDate(),
          endDate: policy.effectiveDate.getEndDate()
        };
      }

      if (policy.reviewDate) {
        policyData.reviewDate = policy.reviewDate;
      }

      if (policy.tags) {
        policyData.tags = policy.tags;
      }

      await PolicyModel.findByIdAndUpdate(
        policy.id,
        policyData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error
          ? error
          : new Error(`Failed to save policy with id ${policy.id}`)
      );
    }
  }

  /**
   * Delete a policy from the repository
   */
  public async delete(policyId: string): Promise<Result<void, Error>> {
    try {
      await PolicyModel.findByIdAndDelete(policyId);
      return Result.ok<void>();
    } catch (error) {
      return Result.fail<void>(
        error instanceof Error
          ? error
          : new Error(`Failed to delete policy with id ${policyId}`)
      );
    }
  }

  /**
   * Count policies with optional filters
   */
  public async count(options?: {
    type?: PolicyType[];
    status?: PolicyStatus[];
    owner?: string;
    controlId?: string;
    effectiveOnly?: boolean;
    reviewDue?: boolean;
    active?: boolean;
  }): Promise<Result<number, Error>> {
    try {
      // Build query
      const query: any = {};

      if (options?.type && options.type.length > 0) {
        query.type = { $in: options.type };
      }

      if (options?.status && options.status.length > 0) {
        query.status = { $in: options.status };
      }

      if (options?.owner) {
        query.owner = options.owner;
      }

      if (options?.controlId) {
        query.relatedControlIds = options.controlId;
      }

      if (options?.active !== undefined) {
        query.isActive = options.active;
      }

      // Handle effectiveOnly filter
      if (options?.effectiveOnly) {
        const now = new Date();
        query['effectiveDate.startDate'] = { $lte: now };
        query.$or = [
          { 'effectiveDate.endDate': { $exists: false } },
          { 'effectiveDate.endDate': { $gte: now } }
        ];
      }

      // Handle reviewDue filter
      if (options?.reviewDue) {
        const now = new Date();
        query.reviewDate = { $lte: now };
      }

      const count = await PolicyModel.countDocuments(query);

      return Result.ok<number>(count);
    } catch (error) {
      return Result.fail<number>(
        error instanceof Error
          ? error
          : new Error('Failed to count policies')
      );
    }
  }

  /**
   * Map a MongoDB document to a domain Policy entity
   */
  private async mapDocumentToDomain(doc: IPolicyDocument): Promise<Result<Policy, Error>> {
    try {
      // Create value objects
      const nameOrError = PolicyName.create(doc.name);
      if (!nameOrError.isSuccess) {
        return Result.fail<Policy>(nameOrError.getError());
      }

      const versionOrError = PolicyVersion.create(doc.version);
      if (!versionOrError.isSuccess) {
        return Result.fail<Policy>(versionOrError.getError());
      }

      // Map approvers if they exist
      let approvers: PolicyApprover[] | undefined;
      if (doc.approvers && doc.approvers.length > 0) {
        approvers = [];
        for (const approverDoc of doc.approvers) {
          const approverOrError = PolicyApprover.create(
            approverDoc.userId,
            approverDoc.name,
            approverDoc.title,
            approverDoc.approvedAt,
            approverDoc.comments
          );

          if (!approverOrError.isSuccess) {
            return Result.fail<Policy>(approverOrError.getError());
          }

          approvers.push(approverOrError.getValue());
        }
      }

      // Map effective date if it exists
      let effectiveDate: EffectiveDate | undefined;
      if (doc.effectiveDate?.startDate) {
        const effectiveDateOrError = EffectiveDate.create(
          doc.effectiveDate.startDate,
          doc.effectiveDate.endDate
        );

        if (!effectiveDateOrError.isSuccess) {
          return Result.fail<Policy>(effectiveDateOrError.getError());
        }

        effectiveDate = effectiveDateOrError.getValue();
      }

      // Create Policy entity
      return Policy.create(doc._id.toString(), {
        name: nameOrError.getValue(),
        version: versionOrError.getValue(),
        type: doc.type as PolicyType,
        status: doc.status as PolicyStatus,
        description: doc.description,
        content: doc.content,
        documentUrl: doc.documentUrl,
        documentPath: doc.documentPath,
        documentFormat: doc.documentFormat as PolicyFormat | undefined,
        relatedControlIds: doc.relatedControlIds,
        owner: doc.owner,
        approvers,
        effectiveDate,
        reviewDate: doc.reviewDate,
        tags: doc.tags,
        isActive: doc.isActive,
        createdBy: doc.createdBy,
        createdAt: doc.createdAt
      });
    } catch (error) {
      return Result.fail<Policy>(
        error instanceof Error
          ? error
          : new Error(`Failed to map policy document to domain: ${error}`)
      );
    }
  }
}
