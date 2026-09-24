import { describe, expect, it } from 'vitest';
import {
  PersistenceError,
  classifyPersistenceError,
} from '../src/core/persistence/PersistenceError';

describe('PersistenceError', () => {
  it('preserves an existing classified error', () => {
    const original = new PersistenceError('corrupt', 'broken');

    expect(classifyPersistenceError(original)).toBe(original);
  });

  it('classifies quota errors with actionable guidance', () => {
    const error = new DOMException(
      'Quota exceeded',
      'QuotaExceededError',
    );

    const classified = classifyPersistenceError(error);

    expect(classified.code).toBe('quota');
    expect(classified.message).toMatch(/storage is full/i);
  });

  it('wraps ordinary errors without losing the message', () => {
    const classified = classifyPersistenceError(
      new Error('disk problem'),
    );

    expect(classified.code).toBe('unknown');
    expect(classified.message).toBe('disk problem');
  });
});
