import { describe, expect, it } from 'vitest';
import { createEffectField } from '../src/core/world/EffectField';
import { createSoundOrb } from '../src/core/world/SoundOrb';
import { createEmptyWorld } from '../src/core/world/World';
import { presentationCameraForWorld } from '../src/core/visual/v2/PresentationCamera';

function frame(
  world: ReturnType<typeof createEmptyWorld>,
  timestampMs = 0,
  reduceMotion = false,
) {
  return presentationCameraForWorld(world, {
    width: 1440,
    height: 900,
    quality: 'high',
    reduceMotion,
    playing: true,
    recording: false,
    timestampMs,
  });
}

describe('Visual V2 presentation camera', () => {
  it('keeps an empty World listener-centered', () => {
    const result = frame(createEmptyWorld());
    expect(result.center).toEqual({ x: 0.5, y: 0.5 });
    expect(result.zoom).toBeGreaterThanOrEqual(1);
  });

  it('leans sparse framing toward the composition without losing the listener', () => {
    const world = createEmptyWorld({
      soundOrbs: [
        createSoundOrb({
          id: 'left',
          soundId: 'test',
          role: 'beat',
          position: { x: 0.24, y: 0.34 },
        }),
        createSoundOrb({
          id: 'near',
          soundId: 'test',
          role: 'bass',
          position: { x: 0.34, y: 0.5 },
        }),
      ],
    });
    const result = frame(world);

    expect(result.zoom).toBeGreaterThan(1);
    expect(result.center.x).toBeLessThan(0.5);
    expect(result.center.x).toBeGreaterThan(0.4);
  });

  it('refuses to zoom into edge-spanning content', () => {
    const world = createEmptyWorld({
      soundOrbs: [
        createSoundOrb({
          id: 'left',
          soundId: 'test',
          role: 'beat',
          position: { x: 0.08, y: 0.5 },
        }),
        createSoundOrb({
          id: 'right',
          soundId: 'test',
          role: 'bass',
          position: { x: 0.92, y: 0.5 },
        }),
      ],
      effectFields: [
        createEffectField({
          id: 'edge',
          type: 'space',
          position: { x: 0.5, y: 0.82 },
          radius: 0.14,
        }),
      ],
    });
    const result = frame(world);

    expect(result.zoom).toBeCloseTo(1, 4);
    expect(result.center).toEqual({ x: 0.5, y: 0.5 });
  });

  it('caps ultrawide zoom more aggressively', () => {
    const world = createEmptyWorld({
      soundOrbs: [
        createSoundOrb({
          id: 'focus',
          soundId: 'test',
          role: 'beat',
          position: { x: 0.5, y: 0.42 },
        }),
      ],
    });
    const standard = presentationCameraForWorld(world, {
      width: 1440,
      height: 900,
      quality: 'high',
      reduceMotion: false,
      playing: true,
      recording: false,
      timestampMs: 0,
    });
    const ultrawide = presentationCameraForWorld(world, {
      width: 3440,
      height: 1440,
      quality: 'high',
      reduceMotion: false,
      playing: true,
      recording: false,
      timestampMs: 0,
    });

    expect(ultrawide.zoom).toBeLessThanOrEqual(1.12);
    expect(ultrawide.zoom).toBeLessThanOrEqual(standard.zoom);
  });

  it('makes Reduce Motion framing time-invariant', () => {
    const world = createEmptyWorld({
      soundOrbs: [
        createSoundOrb({
          id: 'focus',
          soundId: 'test',
          role: 'beat',
          position: { x: 0.42, y: 0.38 },
        }),
      ],
    });

    expect(frame(world, 0, true)).toEqual(frame(world, 120000, true));
  });
});
