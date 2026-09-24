import { describe, expect, it } from 'vitest';
import {
  deriveChoreographyFrame,
  linkChoreographyBoost,
  objectChoreographyEmphasis,
} from '../src/core/visual/v2/ChoreographyModel';
import { projectWorldToRenderScene } from '../src/core/visual/v2/SceneAdapter';
import { VisualEventBridge } from '../src/core/visual/v2/VisualEventBridge';
import { createSoundOrb } from '../src/core/world/SoundOrb';
import { createEmptyWorld } from '../src/core/world/World';

const PREFS = {
  quality: 'high' as const,
  reduceMotion: false,
  reduceParticles: false,
  reduceBloom: false,
};

function scene() {
  const orbs = [
    createSoundOrb({
      id: 'beat',
      soundId: 'beat-round-kick',
      role: 'beat',
      position: { x: 0.25, y: 0.45 },
    }),
    createSoundOrb({
      id: 'bass',
      soundId: 'bass-warm',
      role: 'bass',
      position: { x: 0.4, y: 0.55 },
    }),
    createSoundOrb({
      id: 'harmony',
      soundId: 'harmony-dream',
      role: 'harmony',
      position: { x: 0.6, y: 0.42 },
    }),
    createSoundOrb({
      id: 'melody',
      soundId: 'melody-soft-pluck',
      role: 'melody',
      position: { x: 0.76, y: 0.56 },
    }),
  ];

  return projectWorldToRenderScene(
    createEmptyWorld({
      id: 'choreography-world',
      soundOrbs: orbs,
    }),
    {
      selectedOrbId: null,
      selectedFieldId: null,
      selectedToyId: null,
      selectedLinkId: null,
      playing: true,
      recording: false,
    },
  );
}

describe('Visual V2 musical choreography', () => {
  it('creates a bounded play wake and stop settle', () => {
    const current = scene();
    const wake = deriveChoreographyFrame(
      current,
      [{
        event: {
          kind: 'choreography-state',
          cue: 'play',
          intensity: 1,
        },
        progress: 0.2,
      }],
      PREFS,
    );
    const settle = deriveChoreographyFrame(
      current,
      [{
        event: {
          kind: 'choreography-state',
          cue: 'stop',
          intensity: 1,
        },
        progress: 0.2,
      }],
      PREFS,
    );

    expect(wake.wake).toBeGreaterThan(0);
    expect(wake.settle).toBe(0);
    expect(settle.settle).toBeGreaterThan(0);
    expect(settle.wake).toBe(0);
  });

  it('uses bar 3 as phrase build and the next phrase boundary as release', () => {
    const current = scene();
    const build = deriveChoreographyFrame(
      current,
      [{
        event: {
          kind: 'choreography-bar',
          bar: 3,
          phrasePosition: 3,
          density: 0.5,
          silent: false,
          durationMs: 2000,
        },
        progress: 0.75,
      }],
      PREFS,
    );
    const release = deriveChoreographyFrame(
      current,
      [{
        event: {
          kind: 'choreography-bar',
          bar: 4,
          phrasePosition: 0,
          density: 0.5,
          silent: false,
          durationMs: 2000,
        },
        progress: 0.1,
      }],
      PREFS,
    );

    expect(build.phraseBuild).toBeGreaterThan(0.4);
    expect(build.phraseRelease).toBe(0);
    expect(release.phraseRelease).toBeGreaterThan(0.5);
  });

  it('does not treat initial bar zero as a phrase release', () => {
    const frame = deriveChoreographyFrame(
      scene(),
      [{
        event: {
          kind: 'choreography-bar',
          bar: 0,
          phrasePosition: 0,
          density: 0.4,
          silent: false,
          durationMs: 2000,
        },
        progress: 0.05,
      }],
      PREFS,
    );

    expect(frame.phraseRelease).toBe(0);
  });

  it('combines downbeat and simultaneous density into a bounded pressure cue', () => {
    const frame = deriveChoreographyFrame(
      scene(),
      [{
        event: {
          kind: 'choreography-hit',
          bar: 5,
          downbeat: true,
          simultaneousCount: 3,
          density: 0.75,
          reentry: false,
          intensity: 1,
        },
        progress: 0.1,
      }],
      PREFS,
    );

    expect(frame.downbeat).toBeGreaterThan(0);
    expect(frame.simultaneous).toBeGreaterThan(0);
    expect(frame.pressure).toBeGreaterThan(0);
    expect(frame.pressure).toBeLessThanOrEqual(1);
    expect(frame.density).toBeGreaterThanOrEqual(0.75);
  });

  it('settles a silent bar and gives re-entry higher wake priority', () => {
    const frame = deriveChoreographyFrame(
      scene(),
      [
        {
          event: {
            kind: 'choreography-bar',
            bar: 8,
            phrasePosition: 0,
            density: 0.3,
            silent: true,
            durationMs: 2000,
          },
          progress: 0.2,
        },
        {
          event: {
            kind: 'choreography-hit',
            bar: 8,
            downbeat: true,
            simultaneousCount: 0,
            density: 0.3,
            reentry: true,
            intensity: 0.9,
          },
          progress: 0.1,
        },
      ],
      PREFS,
    );

    expect(frame.silence).toBeGreaterThan(0);
    expect(frame.settle).toBeGreaterThan(0);
    expect(frame.reentry).toBeGreaterThan(0);
    expect(frame.wake).toBeGreaterThan(frame.settle);
  });

  it('derives bass compression and harmony bloom from real role activity', () => {
    const frame = deriveChoreographyFrame(
      scene(),
      [
        {
          event: {
            kind: 'orb-pulse',
            orbId: 'bass',
            intensity: 0.9,
            position: null,
          },
          progress: 0.12,
        },
        {
          event: {
            kind: 'orb-pulse',
            orbId: 'harmony',
            intensity: 0.8,
            position: null,
          },
          progress: 0.2,
        },
      ],
      PREFS,
    );

    expect(frame.bassCompression).toBeGreaterThan(0);
    expect(frame.harmonyBloom).toBeGreaterThan(0);
    expect(frame.roleSpread).toBeGreaterThan(0);
  });

  it('uses beat/percussion activity for expanding pressure phase', () => {
    const frame = deriveChoreographyFrame(
      scene(),
      [{
        event: {
          kind: 'orb-pulse',
          orbId: 'beat',
          intensity: 1,
          position: null,
        },
        progress: 0.42,
      }],
      PREFS,
    );

    expect(frame.pressure).toBeGreaterThan(0);
    expect(frame.pressurePhase).toBeCloseTo(0.42);
  });

  it('removes pressure travel under Reduce Motion without removing the cue', () => {
    const frame = deriveChoreographyFrame(
      scene(),
      [{
        event: {
          kind: 'orb-pulse',
          orbId: 'beat',
          intensity: 1,
          position: null,
        },
        progress: 0.42,
      }],
      {
        ...PREFS,
        reduceMotion: true,
      },
    );

    expect(frame.pressure).toBeGreaterThan(0);
    expect(frame.pressurePhase).toBe(0);
  });

  it('exposes recording start and stop cues independently', () => {
    const start = deriveChoreographyFrame(
      scene(),
      [{
        event: {
          kind: 'choreography-state',
          cue: 'record-start',
          intensity: 1,
        },
        progress: 0.15,
      }],
      PREFS,
    );
    const stop = deriveChoreographyFrame(
      scene(),
      [{
        event: {
          kind: 'choreography-state',
          cue: 'record-stop',
          intensity: 1,
        },
        progress: 0.15,
      }],
      PREFS,
    );

    expect(start.recordStart).toBeGreaterThan(0);
    expect(start.recordStop).toBe(0);
    expect(stop.recordStop).toBeGreaterThan(0);
  });

  it('provides one shared object emphasis for wake/downbeat/phrase choreography', () => {
    const emphasis = objectChoreographyEmphasis([
      {
        event: {
          kind: 'choreography-state',
          cue: 'play',
          intensity: 1,
        },
        progress: 0.2,
      },
      {
        event: {
          kind: 'choreography-hit',
          bar: 4,
          downbeat: true,
          simultaneousCount: 2,
          density: 0.6,
          reentry: false,
          intensity: 0.8,
        },
        progress: 0.1,
      },
      {
        event: {
          kind: 'choreography-bar',
          bar: 4,
          phrasePosition: 0,
          density: 0.6,
          silent: false,
          durationMs: 2000,
        },
        progress: 0.1,
      },
    ]);

    expect(emphasis.wake).toBeGreaterThan(0);
    expect(emphasis.downbeat).toBeGreaterThan(0);
    expect(emphasis.phrase).toBeGreaterThan(0);
    expect(linkChoreographyBoost([])).toBe(0);
    expect(linkChoreographyBoost([
      {
        event: {
          kind: 'choreography-hit',
          bar: 4,
          downbeat: true,
          simultaneousCount: 2,
          density: 0.6,
          reentry: true,
          intensity: 1,
        },
        progress: 0.1,
      },
    ])).toBeGreaterThan(0);
  });
});

describe('Visual V2 choreography event budget', () => {
  it('coalesces bar/state events while allowing hit cues to overlap', () => {
    const bridge = new VisualEventBridge();

    bridge.emit({
      kind: 'choreography-state',
      cue: 'play',
      intensity: 1,
    }, 0);
    bridge.emit({
      kind: 'choreography-state',
      cue: 'stop',
      intensity: 1,
    }, 20);
    bridge.emit({
      kind: 'choreography-bar',
      bar: 1,
      phrasePosition: 1,
      density: 0.4,
      silent: false,
      durationMs: 2000,
    }, 0);
    bridge.emit({
      kind: 'choreography-bar',
      bar: 2,
      phrasePosition: 2,
      density: 0.5,
      silent: false,
      durationMs: 2000,
    }, 20);
    bridge.emit({
      kind: 'choreography-hit',
      bar: 2,
      downbeat: true,
      simultaneousCount: 1,
      density: 0.5,
      reentry: false,
      intensity: 0.8,
    }, 20);

    const samples = bridge.sample(20).samples;

    expect(
      samples.filter(
        (sample) => sample.event.kind === 'choreography-state',
      ),
    ).toHaveLength(1);
    expect(
      samples.filter(
        (sample) => sample.event.kind === 'choreography-bar',
      ),
    ).toHaveLength(1);
    expect(
      samples.filter(
        (sample) => sample.event.kind === 'choreography-hit',
      ),
    ).toHaveLength(1);
  });

  it('uses the scheduler-derived bar duration and expires it automatically', () => {
    const bridge = new VisualEventBridge();

    bridge.emit({
      kind: 'choreography-bar',
      bar: 3,
      phrasePosition: 3,
      density: 0.5,
      silent: false,
      durationMs: 1800,
    }, 100);

    expect(bridge.sample(1000).samples).toHaveLength(1);
    expect(bridge.sample(2000).samples).toHaveLength(0);
  });
});
