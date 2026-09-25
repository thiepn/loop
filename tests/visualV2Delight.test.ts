import { describe, expect, it } from 'vitest';
import {
  deriveDelightFrame,
  EMPTY_DELIGHT_FRAME,
} from '../src/core/visual/v2/DelightModel';
import { projectWorldToRenderScene } from '../src/core/visual/v2/SceneAdapter';
import { createSoundOrb } from '../src/core/world/SoundOrb';
import { createEmptyWorld } from '../src/core/world/World';
import type { RenderEventSample } from '../src/core/visual/v2/RenderTypes';

const HIGH = {
  quality: 'high' as const,
  reduceMotion: false,
  reduceParticles: false,
  reduceBloom: false,
};

function createScene(playing = true) {
  return projectWorldToRenderScene(
    createEmptyWorld({
      id: 'delight-world',
      music: { seed: 164 },
      soundOrbs: [
        createSoundOrb({
          id: 'beat',
          soundId: 'beat-round-kick',
          role: 'beat',
          position: { x: 0.2, y: 0.35 },
        }),
        createSoundOrb({
          id: 'bass',
          soundId: 'bass-warm',
          role: 'bass',
          position: { x: 0.38, y: 0.68 },
        }),
        createSoundOrb({
          id: 'harmony',
          soundId: 'harmony-dream',
          role: 'harmony',
          position: { x: 0.62, y: 0.3 },
        }),
        createSoundOrb({
          id: 'melody',
          soundId: 'melody-soft-pluck',
          role: 'melody',
          position: { x: 0.8, y: 0.62 },
        }),
      ],
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
  const progress = options.progress ?? 0.35;

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
      progress,
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
  ];
}

describe('Visual V2 Phase 16 delight model', () => {
  it('is deterministic for the same World, bar and scheduler samples', () => {
    const scene = createScene();
    const input = samples(48);

    expect(
      deriveDelightFrame(scene, input, HIGH),
    ).toEqual(
      deriveDelightFrame(scene, input, HIGH),
    );
  });

  it('keeps rare events bounded instead of firing every bar', () => {
    const scene = createScene();
    let rareBars = 0;

    for (let bar = 0; bar < 512; bar += 1) {
      const frame = deriveDelightFrame(
        scene,
        samples(bar),
        HIGH,
      );

      if (
        frame.constellation
        || frame.mote
        || frame.alignment
        || frame.orbit
      ) {
        rareBars += 1;
      }
    }

    expect(rareBars).toBeGreaterThan(0);
    expect(rareBars).toBeLessThan(120);
  });

  it('uses silence bars for a bounded settle-dust cue', () => {
    const frame = deriveDelightFrame(
      createScene(),
      samples(12, {
        silent: true,
        progress: 0.6,
      }),
      HIGH,
    );

    expect(frame.silenceDust).not.toBeNull();
    expect(frame.silenceDust?.points.length).toBe(8);
    expect(frame.silenceDust?.strength).toBeGreaterThan(0);
    expect(frame.silenceDust?.strength).toBeLessThanOrEqual(1);
  });

  it('suppresses particle delight when Reduce Particles is enabled', () => {
    const scene = createScene();
    let foundParticleMoment = false;

    for (let bar = 0; bar < 1024; bar += 1) {
      const normal = deriveDelightFrame(
        scene,
        samples(bar, { silent: true }),
        HIGH,
      );
      const reduced = deriveDelightFrame(
        scene,
        samples(bar, { silent: true }),
        {
          ...HIGH,
          reduceParticles: true,
        },
      );

      if (normal.mote || normal.orbit || normal.silenceDust) {
        foundParticleMoment = true;
      }

      expect(reduced.mote).toBeNull();
      expect(reduced.orbit).toBeNull();
      expect(reduced.silenceDust).toBeNull();
    }

    expect(foundParticleMoment).toBe(true);
  });

  it('suppresses travel-heavy rare events for Reduce Motion', () => {
    const scene = createScene();

    for (let bar = 0; bar < 256; bar += 1) {
      const frame = deriveDelightFrame(
        scene,
        samples(bar),
        {
          ...HIGH,
          reduceMotion: true,
        },
      );

      expect(frame.constellation).toBeNull();
      expect(frame.mote).toBeNull();
      expect(frame.alignment).toBeNull();
      expect(frame.orbit).toBeNull();
    }
  });

  it('keeps silence feedback static and restrained under Reduce Motion', () => {
    const frame = deriveDelightFrame(
      createScene(),
      samples(20, {
        silent: true,
        progress: 0.8,
      }),
      {
        ...HIGH,
        reduceMotion: true,
      },
    );

    expect(frame.silenceDust).not.toBeNull();
    expect(frame.silenceDust?.strength).toBeCloseTo(0.22);
  });

  it('uses Battery Saver as a no-rare-motion profile', () => {
    const scene = createScene();

    for (let bar = 0; bar < 256; bar += 1) {
      const frame = deriveDelightFrame(
        scene,
        samples(bar),
        {
          ...HIGH,
          quality: 'battery',
        },
      );

      expect(frame.constellation).toBeNull();
      expect(frame.mote).toBeNull();
      expect(frame.alignment).toBeNull();
      expect(frame.orbit).toBeNull();
    }
  });

  it('returns no delight when playback is stopped', () => {
    expect(
      deriveDelightFrame(
        createScene(false),
        samples(8, { silent: true }),
        HIGH,
      ),
    ).toBe(EMPTY_DELIGHT_FRAME);
  });

  it('never requires creative-state mutation to derive a frame', () => {
    const scene = createScene();
    const before = JSON.stringify(scene);
    deriveDelightFrame(scene, samples(24), HIGH);

    expect(JSON.stringify(scene)).toBe(before);
  });
});
