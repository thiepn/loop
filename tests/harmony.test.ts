import { describe, expect, it } from 'vitest';
import {
  midiForScaleDegree,
  normalizePitchClass,
  shortestTransposition,
} from '../src/core/music/Harmony';

describe('Harmony helpers', () => {
  it('normalizes pitch classes', () => {
    expect(normalizePitchClass(13)).toBe(1);
    expect(normalizePitchClass(-1)).toBe(11);
  });

  it('uses the shortest signed transposition', () => {
    expect(shortestTransposition(0, 2)).toBe(2);
    expect(shortestTransposition(11, 0)).toBe(1);
    expect(shortestTransposition(0, 11)).toBe(-1);
  });

  it('maps scale degrees without requiring note names', () => {
    const harmony = {
      tonic: 0,
      scale: 'minor-pentatonic' as const,
    };

    expect(midiForScaleDegree(60, harmony, 0)).toBe(60);
    expect(midiForScaleDegree(60, harmony, 1)).toBe(63);
    expect(midiForScaleDegree(60, harmony, 5)).toBe(72);
  });
});
