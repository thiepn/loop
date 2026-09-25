import { describe, expect, it } from 'vitest';
import {
  deriveDelightFrame,
  EMPTY_DELIGHT_FRAME,
} from '../src/core/visual/v2/DelightModel';
import { projectWorldToRenderScene } from '../src/core/visual/v2/SceneAdapter';
import { createSoundOrb } from '../src/core/world/SoundOrb';
import { createEmptyWorld } from '../src/core/world/World';
import type { RenderEventSample } from '../src/core/visual/v2/RenderTypes';
import type { VisualPreferences } from '../src/core/visual/VisualQuality';

const HIGH = {
  quality: 'high' as const,
  reduceMotion: false,
  reduceParticles: false,
  reduceBloom: false,
};
const VIEWPORT = [1200, 800, 1.5] as const;

function scene(playing = true) {
  return projectWorldToRenderScene(
    createEmptyWorld({
      id: 'delight-world',
      music: { seed: 164 },
      soundOrbs: [
        ['beat', 'beat-round-kick', 'beat', 0.2, 0.35],
        ['bass', 'bass-warm', 'bass', 0.38, 0.68],
        ['harmony', 'harmony-dream', 'harmony', 0.62, 0.3],
        ['melody', 'melody-soft-pluck', 'melody', 0.8, 0.62],
      ].map(([id, soundId, role, x, y]) => createSoundOrb({
        id: id as string,
        soundId: soundId as string,
        role: role as 'beat' | 'bass' | 'harmony' | 'melody',
        position: { x: x as number, y: y as number },
      })),
    }),
    {
      selectedOrbId: null,
      selectedFieldId: null,
      selectedToyId: null,
      selectedLinkId: null,
      playing,
      recording: false,
    },
  );
}

function samples(
  bar: number,
  options: {
    silent?: boolean;
    simultaneousCount?: number;
    progress?: number;
  } = {},
): readonly RenderEventSample[] {
  return [
    {
      event: {
        kind: 'choreography-bar',
        bar,
        phrasePosition: bar % 4,
        density: 0.55,
        silent: options.silent ?? false,
        durationMs: 2000,
      },
      progress: options.progress ?? 0.35,
    },
    {
      event: {
        kind: 'choreography-hit',
        bar,
        downbeat: true,
        simultaneousCount: options.simultaneousCount ?? 3,
        density: 0.55,
        reentry: false,
        intensity: 0.9,
      },
      progress: 0.12,
    },
    {
      event: {
        kind: 'orb-pulse',
        orbId: 'beat',
        intensity: 0.9,
        position: null,
      },
      progress: 0.1,
    },
    {
      event: {
        kind: 'orb-pulse',
        orbId: 'bass',
        intensity: 0.8,
        position: null,
      },
      progress: 0.16,
    },
  ];
}

function frame(
  bar: number,
  preferences: VisualPreferences = HIGH,
  options: Parameters<typeof samples>[1] = {},
) {
  return deriveDelightFrame(
    scene(),
    samples(bar, options),
    preferences,
    ...VIEWPORT,
  );
}

describe('Visual V2 Phase 16 delight', () => {
  it('is deterministic for the same World and scheduler cue', () => {
    expect(frame(48)).toEqual(frame(48));
  });

  it('keeps delight rare instead of firing on every bar', () => {
    let rareBars = 0;

    for (let bar = 0; bar < 512; bar += 1) {
      if (frame(bar).mask !== 0) {
        rareBars += 1;
      }
    }

    expect(rareBars).toBeGreaterThan(0);
    expect(rareBars).toBeLessThan(120);
  });

  it('creates every rare delight family over a long deterministic run', () => {
    let mask = 0;

    for (let bar = 0; bar < 2048; bar += 1) {
      mask |= frame(bar).mask;
    }

    expect(mask & 15).toBe(15);
  });

  it('uses silent bars for bounded settle dust', () => {
    const result = frame(12, HIGH, {
      silent: true,
      progress: 0.6,
    });

    expect(result.mask & 16).toBe(16);
    expect(result.dots).toHaveLength(8);
    expect(result.dots.every((dot) => dot.color[3] <= 1)).toBe(true);
  });

  it('suppresses particle delight under Reduce Particles', () => {
    for (let bar = 0; bar < 512; bar += 1) {
      const result = frame(
        bar,
        { ...HIGH, reduceParticles: true },
        { silent: true },
      );

      expect(result.mask & (2 | 8 | 16)).toBe(0);
    }
  });

  it('suppresses travel-heavy delight under Reduce Motion', () => {
    for (let bar = 0; bar < 256; bar += 1) {
      const result = frame(
        bar,
        { ...HIGH, reduceMotion: true },
      );

      expect(result.mask).toBe(0);
    }
  });

  it('keeps silence settle static under Reduce Motion', () => {
    const preferences = { ...HIGH, reduceMotion: true };
    const early = frame(
      20,
      preferences,
      { silent: true, progress: 0.2 },
    );
    const late = frame(
      20,
      preferences,
      { silent: true, progress: 0.8 },
    );

    expect(early.mask).toBe(16);
    expect(late.dots).toEqual(early.dots);
  });

  it('uses Battery Saver as a no-rare-motion profile', () => {
    for (let bar = 0; bar < 256; bar += 1) {
      const result = frame(
        bar,
        { ...HIGH, quality: 'battery' },
      );

      expect(result.mask & 15).toBe(0);
    }
  });

  it('returns no delight when playback is stopped', () => {
    expect(
      deriveDelightFrame(
        scene(false),
        samples(8, { silent: true }),
        HIGH,
        ...VIEWPORT,
      ),
    ).toBe(EMPTY_DELIGHT_FRAME);
  });

  it('does not mutate creative/render scene state', () => {
    const current = scene();
    const before = JSON.stringify(current);

    deriveDelightFrame(
      current,
      samples(24),
      HIGH,
      ...VIEWPORT,
    );

    expect(JSON.stringify(current)).toBe(before);
  });
});
