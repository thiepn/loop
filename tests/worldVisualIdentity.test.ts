import { describe, expect, it } from 'vitest';
import { createEffectField } from '../src/core/world/EffectField';
import { createPlaygroundToy } from '../src/core/world/PlaygroundToy';
import { createSoundOrb } from '../src/core/world/SoundOrb';
import {
  createStarterWorld,
} from '../src/core/world/StarterWorlds';
import {
  deriveWorldVisualIdentity,
} from '../src/core/world/WorldVisualIdentity';
import {
  createEmptyWorld,
} from '../src/core/world/World';

describe('World Visual V2 identity', () => {
  it('keeps starter identities stable across transient document IDs', () => {
    const first = createStarterWorld('dreamy', 0);
    const second = createStarterWorld('dreamy', 0);

    expect(first.id).not.toBe(second.id);

    const a = deriveWorldVisualIdentity(
      first,
      'starter:dreamy',
    );
    const b = deriveWorldVisualIdentity(
      second,
      'starter:dreamy',
    );

    expect(a.seed).toBe(b.seed);
    expect(a.glyphA).toBe(b.glyphA);
    expect(a.glyphB).toBe(b.glyphB);
    expect(a.glyphC).toBe(b.glyphC);
    expect(a.orbs).toEqual(b.orbs);
  });

  it('uses saved World identity to distinguish duplicated layouts', () => {
    const base = createStarterWorld('beat', 0);
    const copy = {
      ...base,
      id: 'different-world-id',
    };

    expect(
      deriveWorldVisualIdentity(base).seed,
    ).not.toBe(
      deriveWorldVisualIdentity(copy).seed,
    );
  });

  it('projects real Orb positions and role-scaled material identity', () => {
    const world = createEmptyWorld({
      id: 'visual-layout',
      soundOrbs: [
        createSoundOrb({
          id: 'bass',
          soundId: 'bass-warm',
          role: 'bass',
          position: { x: 0.23, y: 0.72 },
        }),
        createSoundOrb({
          id: 'texture',
          soundId: 'texture-air',
          role: 'texture',
          position: { x: 0.82, y: 0.31 },
        }),
      ],
    });

    const visual = deriveWorldVisualIdentity(world);

    expect(visual.orbs).toHaveLength(2);
    expect(visual.orbs[0]).toMatchObject({
      role: 'bass',
      x: 0.23,
      y: 0.72,
    });
    expect(visual.orbs[1]?.scale)
      .toBeGreaterThan(visual.orbs[0]!.scale);
  });

  it('projects Field and toy layout into thumbnail metadata', () => {
    const world = createEmptyWorld({
      id: 'visual-spatial',
      effectFields: [
        createEffectField({
          id: 'heat',
          type: 'heat',
          position: { x: 0.2, y: 0.3 },
          radius: 0.21,
        }),
      ],
      playgroundToys: [
        createPlaygroundToy({
          id: 'magnet',
          type: 'magnet',
          position: { x: 0.7, y: 0.65 },
          radius: 0.14,
          strength: 0.7,
        }),
      ],
    });

    const visual = deriveWorldVisualIdentity(world);

    expect(visual.fields[0]).toMatchObject({
      type: 'heat',
      x: 0.2,
      y: 0.3,
    });
    expect(visual.toys[0]).toMatchObject({
      type: 'magnet',
      x: 0.7,
      y: 0.65,
    });
  });

  it('caps thumbnail object detail independently from World limits', () => {
    const orbs = Array.from({ length: 12 }, (_, index) => (
      createSoundOrb({
        id: 'orb-' + index,
        soundId: 'melody-soft-pluck',
        role: 'melody',
        position: {
          x: (index % 4 + 1) / 5,
          y: (Math.floor(index / 4) + 1) / 4,
        },
      })
    ));
    const fields = Array.from({ length: 5 }, (_, index) => (
      createEffectField({
        id: 'field-' + index,
        type: ['space', 'echo', 'heat', 'frost', 'filter'][index] as
          'space' | 'echo' | 'heat' | 'frost' | 'filter',
        position: {
          x: 0.15 + index * 0.16,
          y: 0.5,
        },
        radius: 0.16,
      })
    ));
    const toys = [
      createPlaygroundToy({
        id: 'spinner',
        type: 'spinner',
        position: { x: 0.3, y: 0.7 },
        radius: 0.14,
        strength: 0.6,
      }),
      createPlaygroundToy({
        id: 'magnet',
        type: 'magnet',
        position: { x: 0.5, y: 0.7 },
        radius: 0.14,
        strength: 0.6,
      }),
      createPlaygroundToy({
        id: 'repulsor',
        type: 'repulsor',
        position: { x: 0.7, y: 0.7 },
        radius: 0.14,
        strength: 0.6,
      }),
    ];
    const world = createEmptyWorld({
      id: 'visual-dense',
      soundOrbs: orbs,
      effectFields: fields,
      playgroundToys: toys,
    });

    const visual = deriveWorldVisualIdentity(world);

    expect(visual.orbs).toHaveLength(9);
    expect(visual.fields).toHaveLength(3);
    expect(visual.toys).toHaveLength(2);
    expect(visual.density).toBeGreaterThan(0);
    expect(visual.density).toBeLessThanOrEqual(1);
  });

  it('derives primary role by count with deterministic tie-breaking', () => {
    const world = createEmptyWorld({
      id: 'visual-role',
      soundOrbs: [
        createSoundOrb({
          id: 'bass-a',
          soundId: 'bass-warm',
          role: 'bass',
          position: { x: 0.2, y: 0.2 },
        }),
        createSoundOrb({
          id: 'bass-b',
          soundId: 'bass-deep',
          role: 'bass',
          position: { x: 0.4, y: 0.2 },
        }),
        createSoundOrb({
          id: 'beat',
          soundId: 'beat-round-kick',
          role: 'beat',
          position: { x: 0.6, y: 0.2 },
        }),
      ],
    });

    expect(
      deriveWorldVisualIdentity(world).primaryRole,
    ).toBe('bass');
  });

  it('keeps all glyph angles inside one revolution', () => {
    const visual = deriveWorldVisualIdentity(
      createStarterWorld('weird', 0),
      'starter:weird',
    );

    for (const angle of [
      visual.glyphA,
      visual.glyphB,
      visual.glyphC,
    ]) {
      expect(angle).toBeGreaterThanOrEqual(0);
      expect(angle).toBeLessThan(360);
    }
  });
});
