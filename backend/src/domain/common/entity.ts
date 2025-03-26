/**
 * Base Entity class that all domain entities should extend.
 * Provides common functionality for identity and equality.
 */
export abstract class Entity<T> {
  protected readonly _id: string;

  constructor(id: string) {
    this._id = id;
  }

  get id(): string {
    return this._id;
  }

  /**
   * Equality check based on identity, not structural equality.
   * Two entities are equal if they have the same identity, regardless of other attributes.
   */
  public equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    return this._id === entity._id;
  }
}
