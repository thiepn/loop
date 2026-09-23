import { describe, expect, it } from 'vitest';
import { evaluateSoundCompatibility, rankCompatibleSounds } from '../src/core/sounds/Compatibility';
import type { SoundDefinition } from '../src/core/sounds/SoundDefinition';

const tonalBass: SoundDefinition = {
  id: 'test-bass',
  name: 'Test Bass',
  role: 'bass',
  description: 'Test sound',
  tags: [],
  energy: 0.6,
  brightness: 0.3,
  nominalDb: -18,
  loopBars: 1,
  sourceBpm: 120,
  tonal: {
    root: 0,
    scale: 'minor',
    safePitchShiftSemitones: 6,
  },
  source: {
    type: 'procedural',
    preset: 'warm-bass',
  },
};

describe('sound compatibility', () => {
  it('rejects the wrong musical role', () => {
    const result = evaluateSoundCompatibility(tonalBass, {
      role: 'melody',
      bpm: 120,
      harmony: { tonic: 0, scale: 'minor' },
      energy: 0.6,
    });

    expect(result).toBeNull();
  });

  it('returns tempo and pitch adaptation without changing user-facing theory', () => {
    const result = evaluateSoundCompatibility(tonalBass, {
      role: 'bass',
      bpm: 90,
      harmony: { tonic: 2, scale: 'minor' },
      energy: 0.6,
    });

    expect(result).not.toBeNull();
    expect(result?.tempoRatio).toBeCloseTo(0.75);
    expect(result?.pitchShiftSemitones).toBe(2);
    expect(result?.score).toBeGreaterThan(0.7);
  });

  it('ranks closer-energy choices above distant ones when other factors match', () => {
    const softer: SoundDefinition = {
      ...tonalBass,
      id: 'soft-bass',
      energy: 0.2,
    };

    const ranked = rankCompatibleSounds([softer, tonalBass], {
      role: 'bass',
      bpm: 120,
      harmony: { tonic: 0, scale: 'minor' },
      energy: 0.65,
    });

    expect(ranked[0]?.sound.id).toBe('test-bass');
  });
});
