/**
 * A Result class that represents the outcome of an operation, including
 * success/failure status and optional data/error values.
 */
export class Result<T, E = Error> {
  public readonly isSuccess: boolean;
  private readonly _value?: T;
  private readonly _error?: E;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this.isSuccess = isSuccess;
    this._value = value;
    this._error = error;
  }

  /**
   * Returns the value if the result is successful. Throws an error otherwise.
   */
  public getValue(): T {
    if (!this.isSuccess || this._value === undefined) {
      throw new Error('Cannot get value from failed result');
    }
    return this._value;
  }

  /**
   * Returns the error if the result is failure. Throws an error otherwise.
   */
  public getError(): E {
    if (this.isSuccess || this._error === undefined) {
      throw new Error('Cannot get error from successful result');
    }
    return this._error;
  }

  /**
   * Creates a successful result with the given value.
   */
  public static ok<T, E = Error>(value?: T): Result<T, E> {
    return new Result<T, E>(true, value);
  }

  /**
   * Creates a failed result with the given error.
   */
  public static fail<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  /**
   * Combines multiple results into one.
   * Returns the first failure if any, otherwise returns success.
   */
  public static combine<T, E = Error>(results: Result<T, E>[]): Result<T[], E> {
    const values: T[] = [];

    for (const result of results) {
      if (!result.isSuccess) {
        return Result.fail<T[], E>(result.getError());
      }
      if (result._value !== undefined) {
        values.push(result._value);
      }
    }

    return Result.ok<T[], E>(values);
  }
}
