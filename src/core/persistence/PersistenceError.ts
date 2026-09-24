export type PersistenceErrorCode =
  | 'unavailable'
  | 'quota'
  | 'corrupt'
  | 'future-version'
  | 'invalid-backup'
  | 'unknown';

export class PersistenceError extends Error {
  public constructor(
    public readonly code: PersistenceErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'PersistenceError';
  }
}

export function classifyPersistenceError(error: unknown): PersistenceError {
  if (error instanceof PersistenceError) {
    return error;
  }

  if (
    error instanceof DOMException
    && (
      error.name === 'QuotaExceededError'
      || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )
  ) {
    return new PersistenceError(
      'quota',
      'Browser storage is full. Export a backup or remove unused Worlds.',
      { cause: error },
    );
  }

  if (error instanceof DOMException) {
    return new PersistenceError(
      'unavailable',
      `Browser storage is unavailable: ${error.message || error.name}`,
      { cause: error },
    );
  }

  if (error instanceof Error) {
    return new PersistenceError(
      'unknown',
      error.message,
      { cause: error },
    );
  }

  return new PersistenceError(
    'unknown',
    'An unknown persistence error occurred.',
  );
}
