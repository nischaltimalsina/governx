import { Entity } from '../common/entity';
import { Result } from '../common/result';
import {
  RiskName,
  RiskCategory,
  RiskStatus,
  RiskImpact,
  RiskLikelihood,
  RiskScore,
  RiskOwner,
  ReviewPeriod
} from './risk_values';

/**
 * Risk properties interface
 */
export interface RiskProps {
  name: RiskName;
  description: string;
  category: RiskCategory;
  status: RiskStatus;
  inherentImpact: RiskImpact;
  inherentLikelihood: RiskLikelihood;
  inherentRiskScore: RiskScore;
  residualImpact?: RiskImpact;
  residualLikelihood?: RiskLikelihood;
  residualRiskScore?: RiskScore;
  owner?: RiskOwner;
  relatedControlIds?: string[];
  relatedAssets?: string[];
  reviewPeriod?: ReviewPeriod;
  tags?: string[];
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Risk entity representing an identified risk
 */
export class Risk extends Entity<RiskProps> {
  private readonly props: RiskProps;

  private constructor(id: string, props: RiskProps) {
    super(id);
    this.props = props;
  }

  // Getters
  get name(): RiskName {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get category(): RiskCategory {
    return this.props.category;
  }

  get status(): RiskStatus {
    return this.props.status;
  }

  get inherentImpact(): RiskImpact {
    return this.props.inherentImpact;
  }

  get inherentLikelihood(): RiskLikelihood {
    return this.props.inherentLikelihood;
  }

  get inherentRiskScore(): RiskScore {
    return this.props.inherentRiskScore;
  }

  get residualImpact(): RiskImpact | undefined {
    return this.props.residualImpact;
  }

  get residualLikelihood(): RiskLikelihood | undefined {
    return this.props.residualLikelihood;
  }

  get residualRiskScore(): RiskScore | undefined {
    return this.props.residualRiskScore;
  }

  get owner(): RiskOwner | undefined {
    return this.props.owner;
  }

  get relatedControlIds(): string[] | undefined {
    return this.props.relatedControlIds ? [...this.props.relatedControlIds] : undefined;
  }

  get relatedAssets(): string[] | undefined {
    return this.props.relatedAssets ? [...this.props.relatedAssets] : undefined;
  }

  get reviewPeriod(): ReviewPeriod | undefined {
    return this.props.reviewPeriod;
  }

  get tags(): string[] | undefined {
    return this.props.tags ? [...this.props.tags] : undefined;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get updatedBy(): string | undefined {
    return this.props.updatedBy;
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt ? new Date(this.props.updatedAt) : undefined;
  }

  /**
   * Check if a risk review is due
   */
  public isReviewDue(asOfDate: Date = new Date()): boolean {
    if (!this.props.reviewPeriod) {
      return false;
    }

    return this.props.reviewPeriod.isReviewDue(asOfDate);
  }

  /**
   * Calculate risk reduction percentage between inherent and residual risk
   */
  public getRiskReductionPercentage(): number | undefined {
    if (!this.props.residualRiskScore) {
      return undefined;
    }

    const inherentScore = this.props.inherentRiskScore.getValue();
    const residualScore = this.props.residualRiskScore.getValue();

    if (inherentScore === 0) {
      return 0;
    }

    return Math.round(((inherentScore - residualScore) / inherentScore) * 100);
  }

  // Business methods
  public updateDescription(description: string, userId: string): Result<void, Error> {
    if (!description || description.trim().length === 0) {
      return Result.fail<void>(new Error('Description cannot be empty'));
    }

    if (description.length > 2000) {
      return Result.fail<void>(new Error('Description cannot exceed 2000 characters'));
    }

    this.props.description = description;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public updateStatus(status: RiskStatus, userId: string): Result<void, Error> {
    // Validate status transitions
    if (status === RiskStatus.CLOSED && !this.props.residualRiskScore) {
      return Result.fail<void>(
        new Error('Cannot close a risk without residual risk assessment')
      );
    }

    this.props.status = status;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public updateInherentRisk(
    impact: RiskImpact,
    likelihood: RiskLikelihood,
    userId: string
  ): Result<void, Error> {
    // Calculate risk score
    const scoreResult = RiskScore.calculate(impact, likelihood);

    if (!scoreResult.isSuccess) {
      return Result.fail<void>(scoreResult.getError());
    }

    this.props.inherentImpact = impact;
    this.props.inherentLikelihood = likelihood;
    this.props.inherentRiskScore = scoreResult.getValue();
    this.props.updatedBy = userId;
    this.updateTimestamp();

    // Update risk status to at least "ASSESSED" if it was only "IDENTIFIED"
    if (this.props.status === RiskStatus.IDENTIFIED) {
      this.props.status = RiskStatus.ASSESSED;
    }

    return Result.ok<void>();
  }

  public updateResidualRisk(
    impact: RiskImpact,
    likelihood: RiskLikelihood,
    userId: string
  ): Result<void, Error> {
    // Calculate risk score
    const scoreResult = RiskScore.calculate(impact, likelihood);

    if (!scoreResult.isSuccess) {
      return Result.fail<void>(scoreResult.getError());
    }

    this.props.residualImpact = impact;
    this.props.residualLikelihood = likelihood;
    this.props.residualRiskScore = scoreResult.getValue();
    this.props.updatedBy = userId;
    this.updateTimestamp();

    return Result.ok<void>();
  }

  public assignOwner(owner: RiskOwner, userId: string): Result<void, Error> {
    this.props.owner = owner;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public setReviewPeriod(reviewPeriod: ReviewPeriod, userId: string): Result<void, Error> {
    this.props.reviewPeriod = reviewPeriod;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public markReviewed(reviewDate: Date, userId: string): Result<void, Error> {
    if (!this.props.reviewPeriod) {
      return Result.fail<void>(new Error('Review period must be set before marking as reviewed'));
    }

    this.props.reviewPeriod = this.props.reviewPeriod.markReviewed(reviewDate);
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public linkControl(controlId: string, userId: string): Result<void, Error> {
    if (!controlId) {
      return Result.fail<void>(new Error('Control ID is required'));
    }

    if (!this.props.relatedControlIds) {
      this.props.relatedControlIds = [];
    }

    if (this.props.relatedControlIds.includes(controlId)) {
      return Result.fail<void>(new Error(`Risk is already linked to control ${controlId}`));
    }

    this.props.relatedControlIds.push(controlId);
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public unlinkControl(controlId: string, userId: string): Result<void, Error> {
    if (!this.props.relatedControlIds || !this.props.relatedControlIds.includes(controlId)) {
      return Result.fail<void>(new Error(`Risk is not linked to control ${controlId}`));
    }

    this.props.relatedControlIds = this.props.relatedControlIds.filter(id => id !== controlId);
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public linkAsset(assetId: string, userId: string): Result<void, Error> {
    if (!assetId) {
      return Result.fail<void>(new Error('Asset ID is required'));
    }

    if (!this.props.relatedAssets) {
      this.props.relatedAssets = [];
    }

    if (this.props.relatedAssets.includes(assetId)) {
      return Result.fail<void>(new Error(`Risk is already linked to asset ${assetId}`));
    }

    this.props.relatedAssets.push(assetId);
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public unlinkAsset(assetId: string, userId: string): Result<void, Error> {
    if (!this.props.relatedAssets || !this.props.relatedAssets.includes(assetId)) {
      return Result.fail<void>(new Error(`Risk is not linked to asset ${assetId}`));
    }

    this.props.relatedAssets = this.props.relatedAssets.filter(id => id !== assetId);
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public updateTags(tags: string[] | undefined, userId: string): Result<void, Error> {
    if (tags) {
      // Ensure tags are unique
      this.props.tags = [...new Set(tags)];
    } else {
      this.props.tags = undefined;
    }

    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  public activate(): void {
    this.props.isActive = true;
    this.updateTimestamp();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.updateTimestamp();
  }

  public closeRisk(userId: string): Result<void, Error> {
    if (!this.props.residualRiskScore) {
      return Result.fail<void>(
        new Error('Cannot close a risk without residual risk assessment')
      );
    }

    this.props.status = RiskStatus.CLOSED;
    this.props.updatedBy = userId;
    this.updateTimestamp();
    return Result.ok<void>();
  }

  private updateTimestamp(): void {
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new Risk entity
   */
  public static create(
    id: string,
    props: {
      name: RiskName;
      description: string;
      category: RiskCategory;
      status?: RiskStatus;
      inherentImpact: RiskImpact;
      inherentLikelihood: RiskLikelihood;
      residualImpact?: RiskImpact;
      residualLikelihood?: RiskLikelihood;
      owner?: RiskOwner;
      relatedControlIds?: string[];
      relatedAssets?: string[];
      reviewPeriod?: ReviewPeriod;
      tags?: string[];
      isActive?: boolean;
      createdBy: string;
      createdAt?: Date;
    }
  ): Result<Risk, Error> {
    // Validate required properties
    if (!props.name) {
      return Result.fail<Risk>(new Error('Risk name is required'));
    }

    if (!props.description) {
      return Result.fail<Risk>(new Error('Risk description is required'));
    }

    if (props.description.length > 2000) {
      return Result.fail<Risk>(new Error('Risk description cannot exceed 2000 characters'));
    }

    if (!props.category) {
      return Result.fail<Risk>(new Error('Risk category is required'));
    }

    if (!props.inherentImpact) {
      return Result.fail<Risk>(new Error('Inherent impact is required'));
    }

    if (!props.inherentLikelihood) {
      return Result.fail<Risk>(new Error('Inherent likelihood is required'));
    }

    if (!props.createdBy) {
      return Result.fail<Risk>(new Error('Created by user ID is required'));
    }

    // Calculate inherent risk score
    const inherentScoreResult = RiskScore.calculate(
      props.inherentImpact,
      props.inherentLikelihood
    );

    if (!inherentScoreResult.isSuccess) {
      return Result.fail<Risk>(inherentScoreResult.getError());
    }

    const inherentRiskScore = inherentScoreResult.getValue();

    // Calculate residual risk score if provided
    let residualRiskScore: RiskScore | undefined;

    if (props.residualImpact && props.residualLikelihood) {
      const residualScoreResult = RiskScore.calculate(
        props.residualImpact,
        props.residualLikelihood
      );

      if (!residualScoreResult.isSuccess) {
        return Result.fail<Risk>(residualScoreResult.getError());
      }

      residualRiskScore = residualScoreResult.getValue();
    }

    // Create risk with provided or default values
    const risk = new Risk(id, {
      name: props.name,
      description: props.description,
      category: props.category,
      status: props.status ?? RiskStatus.IDENTIFIED,
      inherentImpact: props.inherentImpact,
      inherentLikelihood: props.inherentLikelihood,
      inherentRiskScore,
      residualImpact: props.residualImpact,
      residualLikelihood: props.residualLikelihood,
      residualRiskScore,
      owner: props.owner,
      relatedControlIds: props.relatedControlIds ? [...props.relatedControlIds] : undefined,
      relatedAssets: props.relatedAssets ? [...props.relatedAssets] : undefined,
      reviewPeriod: props.reviewPeriod,
      tags: props.tags ? [...new Set(props.tags)] : undefined,
      isActive: props.isActive ?? true,
      createdBy: props.createdBy,
      createdAt: props.createdAt ?? new Date(),
    });

    return Result.ok<Risk>(risk);
  }
}
