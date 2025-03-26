import { Result } from '../common/result';

/**
 * RiskCategory enum represents the category of risk
 */
export enum RiskCategory {
  STRATEGIC = 'strategic',
  OPERATIONAL = 'operational',
  FINANCIAL = 'financial',
  COMPLIANCE = 'compliance',
  REPUTATIONAL = 'reputational',
  TECHNOLOGICAL = 'technological',
  LEGAL = 'legal',
  SECURITY = 'security',
  PRIVACY = 'privacy',
  THIRD_PARTY = 'third_party',
  OTHER = 'other'
}

/**
 * RiskStatus enum represents the status of a risk
 */
export enum RiskStatus {
  IDENTIFIED = 'identified',
  ASSESSED = 'assessed',
  MITIGATING = 'mitigating',
  ACCEPTED = 'accepted',
  TRANSFERRED = 'transferred',
  AVOIDED = 'avoided',
  CLOSED = 'closed'
}

/**
 * RiskSeverity enum represents the severity levels of a risk
 */
export enum RiskSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  NEGLIGIBLE = 'negligible'
}

/**
 * RiskLikelihood enum represents the likelihood levels of a risk occurring
 */
export enum RiskLikelihood {
  ALMOST_CERTAIN = 'almost_certain',
  LIKELY = 'likely',
  POSSIBLE = 'possible',
  UNLIKELY = 'unlikely',
  RARE = 'rare'
}

/**
 * RiskImpact enum represents the impact levels if a risk materializes
 */
export enum RiskImpact {
  SEVERE = 'severe',
  MAJOR = 'major',
  MODERATE = 'moderate',
  MINOR = 'minor',
  INSIGNIFICANT = 'insignificant'
}

/**
 * TreatmentType enum represents ways to address a risk
 */
export enum TreatmentType {
  MITIGATE = 'mitigate',
  ACCEPT = 'accept',
  TRANSFER = 'transfer',
  AVOID = 'avoid'
}

/**
 * TreatmentStatus enum represents the status of a risk treatment
 */
export enum TreatmentStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  IMPLEMENTED = 'implemented',
  VERIFIED = 'verified',
  INEFFECTIVE = 'ineffective',
  CANCELLED = 'cancelled'
}

/**
 * RiskName value object represents the name of a risk
 */
export class RiskName {
  private readonly value: string;

  private constructor(name: string) {
    this.value = name;
  }

  public getValue(): string {
    return this.value;
  }

  public static create(name: string): Result<RiskName, Error> {
    if (!name) {
      return Result.fail<RiskName>(new Error('Risk name cannot be empty'));
    }

    if (name.length < 3) {
      return Result.fail<RiskName>(new Error('Risk name must be at least 3 characters'));
    }

    if (name.length > 200) {
      return Result.fail<RiskName>(new Error('Risk name cannot exceed 200 characters'));
    }

    return Result.ok<RiskName>(new RiskName(name));
  }
}

/**
 * RiskScore value object represents the calculated risk score
 */
export class RiskScore {
  private readonly value: number;
  private readonly severity: RiskSeverity;

  private constructor(value: number, severity: RiskSeverity) {
    this.value = value;
    this.severity = severity;
  }

  public getValue(): number {
    return this.value;
  }

  public getSeverity(): RiskSeverity {
    return this.severity;
  }

  /**
   * Calculate risk score from impact and likelihood values and determine severity
   */
  public static calculate(
    impact: RiskImpact,
    likelihood: RiskLikelihood
  ): Result<RiskScore, Error> {
    // Map impact to numeric value (1-5)
    const impactValue = this.getImpactValue(impact);

    // Map likelihood to numeric value (1-5)
    const likelihoodValue = this.getLikelihoodValue(likelihood);

    // Calculate risk score (impact × likelihood)
    const scoreValue = impactValue * likelihoodValue;

    // Determine severity based on score
    const severity = this.getSeverityFromScore(scoreValue);

    return Result.ok<RiskScore>(new RiskScore(scoreValue, severity));
  }

  /**
   * Create a RiskScore directly from a numeric value
   */
  public static createFromValue(value: number): Result<RiskScore, Error> {
    if (value < 1 || value > 25) {
      return Result.fail<RiskScore>(
        new Error('Risk score must be between 1 and 25')
      );
    }

    const severity = this.getSeverityFromScore(value);
    return Result.ok<RiskScore>(new RiskScore(value, severity));
  }

  /**
   * Map impact enum to numeric value
   */
  private static getImpactValue(impact: RiskImpact): number {
    const impactMap: Record<RiskImpact, number> = {
      [RiskImpact.SEVERE]: 5,
      [RiskImpact.MAJOR]: 4,
      [RiskImpact.MODERATE]: 3,
      [RiskImpact.MINOR]: 2,
      [RiskImpact.INSIGNIFICANT]: 1
    };

    return impactMap[impact];
  }

  /**
   * Map likelihood enum to numeric value
   */
  private static getLikelihoodValue(likelihood: RiskLikelihood): number {
    const likelihoodMap: Record<RiskLikelihood, number> = {
      [RiskLikelihood.ALMOST_CERTAIN]: 5,
      [RiskLikelihood.LIKELY]: 4,
      [RiskLikelihood.POSSIBLE]: 3,
      [RiskLikelihood.UNLIKELY]: 2,
      [RiskLikelihood.RARE]: 1
    };

    return likelihoodMap[likelihood];
  }

  /**
   * Determine severity based on risk score
   */
  private static getSeverityFromScore(score: number): RiskSeverity {
    if (score >= 20) {
      return RiskSeverity.CRITICAL;
    } else if (score >= 15) {
      return RiskSeverity.HIGH;
    } else if (score >= 8) {
      return RiskSeverity.MEDIUM;
    } else if (score >= 3) {
      return RiskSeverity.LOW;
    } else {
      return RiskSeverity.NEGLIGIBLE;
    }
  }
}

/**
 * RiskOwner value object represents the owner of a risk
 */
export class RiskOwner {
  private readonly userId: string;
  private readonly name: string;
  private readonly department: string;
  private readonly assignedAt: Date;

  private constructor(
    userId: string,
    name: string,
    department: string,
    assignedAt: Date
  ) {
    this.userId = userId;
    this.name = name;
    this.department = department;
    this.assignedAt = assignedAt;
  }

  public getUserId(): string {
    return this.userId;
  }

  public getName(): string {
    return this.name;
  }

  public getDepartment(): string {
    return this.department;
  }

  public getAssignedAt(): Date {
    return new Date(this.assignedAt);
  }

  public static create(
    userId: string,
    name: string,
    department: string,
    assignedAt: Date = new Date()
  ): Result<RiskOwner, Error> {
    if (!userId) {
      return Result.fail<RiskOwner>(new Error('Owner user ID is required'));
    }

    if (!name) {
      return Result.fail<RiskOwner>(new Error('Owner name is required'));
    }

    if (!department) {
      return Result.fail<RiskOwner>(new Error('Owner department is required'));
    }

    return Result.ok<RiskOwner>(
      new RiskOwner(userId, name, department, assignedAt)
    );
  }
}

/**
 * ReviewPeriod value object represents how often a risk should be reviewed
 */
export class ReviewPeriod {
  private readonly months: number;
  private readonly lastReviewed?: Date;
  private readonly nextReviewDate?: Date;

  private constructor(
    months: number,
    lastReviewed?: Date,
    nextReviewDate?: Date
  ) {
    this.months = months;
    this.lastReviewed = lastReviewed;
    this.nextReviewDate = nextReviewDate;
  }

  public getMonths(): number {
    return this.months;
  }

  public getLastReviewed(): Date | undefined {
    return this.lastReviewed ? new Date(this.lastReviewed) : undefined;
  }

  public getNextReviewDate(): Date | undefined {
    return this.nextReviewDate ? new Date(this.nextReviewDate) : undefined;
  }

  /**
   * Check if risk review is due
   */
  public isReviewDue(asOfDate: Date = new Date()): boolean {
    if (!this.nextReviewDate) {
      return false;
    }

    return asOfDate >= this.nextReviewDate;
  }

  /**
   * Update the last reviewed date and calculate next review date
   */
  public markReviewed(reviewDate: Date = new Date()): ReviewPeriod {
    // Calculate next review date
    const nextReview = new Date(reviewDate);
    nextReview.setMonth(nextReview.getMonth() + this.months);

    return new ReviewPeriod(this.months, reviewDate, nextReview);
  }

  public static create(
    months: number,
    lastReviewed?: Date,
    nextReviewDate?: Date
  ): Result<ReviewPeriod, Error> {
    if (months <= 0) {
      return Result.fail<ReviewPeriod>(
        new Error('Review period must be a positive number of months')
      );
    }

    // If lastReviewed is provided but nextReviewDate is not,
    // calculate the nextReviewDate
    let calculatedNextReview = nextReviewDate;

    if (lastReviewed && !nextReviewDate) {
      calculatedNextReview = new Date(lastReviewed);
      calculatedNextReview.setMonth(calculatedNextReview.getMonth() + months);
    }

    return Result.ok<ReviewPeriod>(
      new ReviewPeriod(months, lastReviewed, calculatedNextReview)
    );
  }
}
