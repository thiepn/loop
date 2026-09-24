import { describe, expect, it } from 'vitest';
import {
  encodeLoopBackup,
  decodeLoopBackup,
} from '../src/core/persistence/Backup';
import { MemoryWorldStorage } from '../src/core/persistence/MemoryWorldStorage';
import { WorldRepository } from '../src/core/persistence/WorldRepository';
import { createDefaultPattern } from '../src/core/music/Pattern';
import { LookaheadScheduler } from '../src/core/music/LookaheadScheduler';
import { evaluateMotionFrame } from '../src/core/music/MotionEngine';
import { MusicalTransport } from '../src/core/music/MusicalTransport';
import { soundById } from '../src/core/sounds/coreCatalog';
import {
  MAX_EFFECT_FIELDS,
  createEffectField,
  type EffectFieldType,
} from '../src/core/world/EffectField';
import {
  MAX_LINKS,
  type LinkType,
} from '../src/core/world/Link';
import { addLink } from '../src/core/world/LinkActions';
import { mutateWithMagic } from '../src/core/world/Magic';
import { createMotion, type MotionMode } from '../src/core/world/Motion';
import {
  MAX_PLAYGROUND_TOYS,
  createPlaygroundToy,
  type PlaygroundToyType,
} from '../src/core/world/PlaygroundToy';
import {
  MAX_SNAPSHOTS,
  addSnapshot,
} from '../src/core/world/Snapshot';
import {
  MAX_SOUND_ORBS,
  createSoundOrb,
} from '../src/core/world/SoundOrb';
import { createStarterWorld } from '../src/core/world/StarterWorlds';
import {
  createEmptyWorld,
  type WorldDocument,
} from '../src/core/world/World';

const PERF_BUDGET_MS = 5_000;

function measured<T>(
  label: string,
  operation: () => T,
): { readonly elapsedMs: number; readonly value: T } {
  const started = performance.now();
  const value = operation();
  const elapsedMs = performance.now() - started;
  console.info(
    `[Phase 16] ${label}: ${elapsedMs.toFixed(2)} ms`,
  );
  return { elapsedMs, value };
}

async function measuredAsync<T>(
  label: string,
  operation: () => Promise<T>,
): Promise<{ readonly elapsedMs: number; readonly value: T }> {
  const started = performance.now();
  const value = await operation();
  const elapsedMs = performance.now() - started;
  console.info(
    `[Phase 16] ${label}: ${elapsedMs.toFixed(2)} ms`,
  );
  return { elapsedMs, value };
}

function maxComplexityWorld(): WorldDocument {
  const source = createStarterWorld('weird', 100);
  const motionModes: readonly MotionMode[] = [
    'orbit',
    'bounce',
    'drift',
    'wander',
  ];

  const soundOrbs = Array.from(
    { length: MAX_SOUND_ORBS },
    (_, index) => {
      const template = source.soundOrbs[
        index % source.soundOrbs.length
      ]!;
      const sound = soundById(template.soundId);
      const pattern = sound
        ? createDefaultPattern(sound.pattern)
        : null;

      return createSoundOrb({
        id: `phase16-orb-${index}`,
        soundId: template.soundId,
        role: template.role,
        position: {
          x: 0.1 + (index % 4) * 0.25,
          y: 0.16 + Math.floor(index / 4) * 0.31,
        },
        motion: createMotion({
          mode: motionModes[index % motionModes.length]!,
          speed: 'fast',
          range: 'wide',
          seed: 10_000 + index,
        }),
        ...(pattern ? { pattern } : {}),
      });
    },
  );

  const fieldTypes: readonly EffectFieldType[] = [
    'space',
    'echo',
    'heat',
    'frost',
    'filter',
  ];
  const effectFields = fieldTypes.map((type, index) =>
    createEffectField({
      id: `phase16-field-${index}`,
      type,
      position: {
        x: 0.16 + index * 0.17,
        y: index % 2 === 0 ? 0.3 : 0.7,
      },
      radius: 0.34,
    }),
  );

  const toyTypes: readonly PlaygroundToyType[] = [
    'spinner',
    'magnet',
    'repulsor',
    'portal',
  ];
  const playgroundToys = toyTypes.map((type, index) =>
    createPlaygroundToy({
      id: `phase16-toy-${index}`,
      type,
      position: {
        x: 0.2 + (index % 2) * 0.6,
        y: 0.24 + Math.floor(index / 2) * 0.52,
      },
      radius: 0.22,
      strength: 1,
      ...(type === 'portal'
        ? { exitPosition: { x: 0.18, y: 0.82 } }
        : {}),
    }),
  );

  let world = createEmptyWorld({
    id: 'phase16-max-world',
    name: 'Phase 16 Max World',
    now: 100,
    music: {
      bpm: 138,
      tonic: 7,
      scale: 'minor-pentatonic',
      seed: 16_016,
    },
    soundOrbs,
    effectFields,
    playgroundToys,
  });

  const plannedLinks: readonly (
    readonly [LinkType, number, number]
  )[] = [
    ['copy-movement', 0, 1],
    ['copy-movement', 2, 3],
    ['copy-movement', 4, 5],
    ['copy-movement', 6, 7],
    ['copy-movement', 8, 9],
    ['copy-movement', 10, 11],
    ['take-turns', 0, 2],
    ['take-turns', 4, 6],
  ];

  for (const [type, sourceIndex, targetIndex] of plannedLinks) {
    const result = addLink(
      world,
      type,
      soundOrbs[sourceIndex]!.id,
      soundOrbs[targetIndex]!.id,
      200 + world.links.length,
    );

    if (!result.createdId) {
      throw new Error(
        `Phase 16 max World could not add ${type}: ${result.reason}`,
      );
    }

    world = result.world;
  }

  while (world.snapshots.length < MAX_SNAPSHOTS) {
    const result = addSnapshot(
      world,
      `Phase 16 Snapshot ${world.snapshots.length + 1}`,
      300 + world.snapshots.length,
    );

    if (!result.createdId) {
      throw new Error('Phase 16 max World could not add Snapshot.');
    }

    world = result.world;
  }

  return world;
}

describe('Phase 16 performance and soak certification', () => {
  it('constructs one World at every V1 structural cap', () => {
    const world = maxComplexityWorld();

    expect(world.soundOrbs).toHaveLength(MAX_SOUND_ORBS);
    expect(world.effectFields).toHaveLength(MAX_EFFECT_FIELDS);
    expect(world.playgroundToys).toHaveLength(MAX_PLAYGROUND_TOYS);
    expect(world.links).toHaveLength(MAX_LINKS);
    expect(world.snapshots).toHaveLength(MAX_SNAPSHOTS);
  });

  it('evaluates ten simulated minutes of 60 Hz max-World Motion inside the soak budget', () => {
    const world = maxComplexityWorld();
    const frames = 10 * 60 * 60;

    const { elapsedMs, value: checksum } = measured(
      `${frames.toLocaleString()} max-World Motion frames`,
      () => {
        let checksumValue = 0;

        for (let frame = 0; frame < frames; frame += 1) {
          const positions = evaluateMotionFrame(
            world,
            frame / 60,
          );

          checksumValue += positions.get(
            world.soundOrbs[frame % MAX_SOUND_ORBS]!.id,
          )?.x ?? 0;
        }

        return checksumValue;
      },
    );

    expect(Number.isFinite(checksum)).toBe(true);
    expect(elapsedMs).toBeLessThan(PERF_BUDGET_MS);
  }, 15_000);

  it('schedules ten simulated minutes at the production 25 ms pulse cadence without duplicates or stale ticks', () => {
    let now = 0;
    const transport = new MusicalTransport({
      bpm: 138,
      beatsPerBar: 4,
    });
    transport.start(0, 0);

    const scheduler = new LookaheadScheduler(
      () => now,
      transport,
      {
        intervalMs: 25,
        scheduleAheadSeconds: 0.12,
        stepsPerBeat: 4,
      },
    );

    const steps: number[] = [];
    scheduler.subscribe((tick) => {
      expect(tick.time).toBeGreaterThanOrEqual(now - 0.002);
      steps.push(tick.absoluteStep);
    });

    const { elapsedMs } = measured(
      '10-minute scheduler pulse soak',
      () => {
        const pulses = 10 * 60 * 40;

        for (let pulse = 0; pulse <= pulses; pulse += 1) {
          now = pulse * 0.025;
          scheduler.pulse();
        }
      },
    );

    expect(steps.length).toBeGreaterThan(5_000);
    expect(new Set(steps).size).toBe(steps.length);
    expect(elapsedMs).toBeLessThan(PERF_BUDGET_MS);
  }, 15_000);

  it('repeats 1,000 wild global Magic previews without structural growth', () => {
    const world = maxComplexityWorld();

    const { elapsedMs, value: final } = measured(
      '1,000 max-World Magic previews',
      () => {
        let result = world;

        for (let attempt = 0; attempt < 1_000; attempt += 1) {
          result = mutateWithMagic(
            world,
            { kind: 'world' },
            {
              intent: 'stranger',
              strength: 'wild',
              attempt,
              now: 1_000 + attempt,
            },
          ).world;
        }

        return result;
      },
    );

    expect(final.soundOrbs).toHaveLength(MAX_SOUND_ORBS);
    expect(final.effectFields).toHaveLength(MAX_EFFECT_FIELDS);
    expect(final.playgroundToys).toHaveLength(MAX_PLAYGROUND_TOYS);
    expect(final.links).toHaveLength(MAX_LINKS);
    expect(final.snapshots).toHaveLength(MAX_SNAPSHOTS);
    expect(elapsedMs).toBeLessThan(PERF_BUDGET_MS);
  }, 15_000);

  it('churns a large local library through save/list/load cycles inside the persistence soak budget', async () => {
    const base = maxComplexityWorld();
    const storage = new MemoryWorldStorage();
    const repository = new WorldRepository(storage);
    const worlds = Array.from(
      { length: 100 },
      (_, index): WorldDocument => ({
        ...base,
        id: `phase16-library-${index}`,
        name: `Phase 16 Library ${index}`,
        createdAt: 2_000 + index,
        updatedAt: 2_000 + index,
      }),
    );

    const { elapsedMs } = await measuredAsync(
      '100 max-World library save + 10 list/load passes',
      async () => {
        for (const [index, world] of worlds.entries()) {
          await repository.saveWorld(world, 3_000 + index);
        }

        for (let pass = 0; pass < 10; pass += 1) {
          const library = await repository.listLibrary();
          expect(library).toHaveLength(worlds.length);

          for (const world of worlds) {
            const loaded = await repository.loadWorld(
              world.id,
              4_000 + pass,
              false,
              false,
            );
            expect(loaded?.world.id).toBe(world.id);
          }
        }
      },
    );

    expect(elapsedMs).toBeLessThan(PERF_BUDGET_MS);
  }, 15_000);

  it('round-trips repeated max-World backups inside the serialization soak budget', () => {
    const world = maxComplexityWorld();

    const { elapsedMs, value: lastDecoded } = measured(
      '100 max-World backup encode/decode round-trips',
      () => {
        let decoded: WorldDocument | null = null;

        for (let iteration = 0; iteration < 100; iteration += 1) {
          const backup = encodeLoopBackup(
            [world],
            5_000 + iteration,
          );
          decoded = decodeLoopBackup(backup).worlds[0] ?? null;
        }

        return decoded;
      },
    );

    expect(lastDecoded?.soundOrbs).toHaveLength(MAX_SOUND_ORBS);
    expect(lastDecoded?.snapshots).toHaveLength(MAX_SNAPSHOTS);
    expect(elapsedMs).toBeLessThan(PERF_BUDGET_MS);
  }, 15_000);
});
