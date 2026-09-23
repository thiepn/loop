import { describe, expect, it } from 'vitest';
import {
  headroomCompensation,
  metadataNormalizationGain,
  recommendedVoiceGain,
} from '../src/core/music/MixPolicy';

describe('MixPolicy', () => {
  it('reduces combined level as voice count rises', () => {
    expect(headroomCompensation(1)).toBeCloseTo(1);
    expect(headroomCompensation(4)).toBeCloseTo(0.5);
    expect(headroomCompensation(16)).toBeCloseTo(0.35);
  });

  it('bounds metadata normalization corrections', () => {
    expect(metadataNormalizationGain(-40)).toBeCloseTo(10 ** (6 / 20));
    expect(metadataNormalizationGain(-2)).toBeCloseTo(10 ** (-9 / 20));
  });

  it('combines normalization, headroom, and role trim deterministically', () => {
    const gain = recommendedVoiceGain(-18, 4, -6);
    expect(gain).toBeCloseTo(0.5 * 10 ** (-6 / 20));
  });
});
