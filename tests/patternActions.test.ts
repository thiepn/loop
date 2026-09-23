import { describe, expect, it } from 'vitest';
import { effectivePattern } from '../src/core/music/Pattern';
import { soundById } from '../src/core/sounds/coreCatalog';
import {
  clearOrbPattern,
  paintMelodyNote,
  paintRhythmStep,
  setOrbPatternDensity,
  setOrbPatternGroove,
  varyOrbPattern,
} from '../src/core/world/PatternActions';
import { createStarterWorld } from '../src/core/world/StarterWorlds';

describe('PatternActions', () => {
  it('materializes an edited rhythm pattern onto the orb', () => {
    const world = createStarterWorld('beat', 100);
    const kick = world.soundOrbs.find((orb) => orb.role === 'beat');
    expect(kick).toBeDefined();

    const next = paintRhythmStep(world, kick!.id, 4, true, 200);
    const edited = next.soundOrbs.find((orb) => orb.id === kick!.id);

    expect(edited?.pattern?.kind).toBe('rhythm');
    if (edited?.pattern?.kind === 'rhythm') {
      expect(edited.pattern.steps[4]).toBe(true);
    }
  });

  it('keeps melody painting scale-degree based', () => {
    const world = createStarterWorld('dreamy', 100);
    const melody = world.soundOrbs.find((orb) => orb.role === 'melody');
    expect(melody).toBeDefined();

    const next = paintMelodyNote(world, melody!.id, 5, 6, 200);
    const edited = next.soundOrbs.find((orb) => orb.id === melody!.id);

    expect(edited?.pattern?.kind).toBe('melody');
    if (edited?.pattern?.kind === 'melody') {
      expect(edited.pattern.notes[5]).toBe(6);
    }
  });

  it('updates density groove and variation through World state', () => {
    const world = createStarterWorld('dance', 100);
    const hats = world.soundOrbs.find((orb) => orb.soundId === 'perc-glass-hat');
    expect(hats).toBeDefined();

    const dense = setOrbPatternDensity(world, hats!.id, 'busy', 200);
    const grooved = setOrbPatternGroove(dense, hats!.id, 'loose', 300);
    const varied = varyOrbPattern(grooved, hats!.id, 400);
    const edited = varied.soundOrbs.find((orb) => orb.id === hats!.id);

    expect(edited?.pattern?.groove).toBe('loose');
    expect(edited?.pattern?.variation).toBe(1);
  });

  it('clears an editable pattern without deleting the orb', () => {
    const world = createStarterWorld('beat', 100);
    const kick = world.soundOrbs.find((orb) => orb.role === 'beat');
    expect(kick).toBeDefined();

    const cleared = clearOrbPattern(world, kick!.id, 200);
    const edited = cleared.soundOrbs.find((orb) => orb.id === kick!.id);
    const sound = edited ? soundById(edited.soundId) : undefined;
    expect(edited).toBeDefined();
    expect(sound).toBeDefined();

    const effective = effectivePattern(edited!.pattern, sound!);
    expect(effective?.kind).toBe('rhythm');
    if (effective?.kind === 'rhythm') {
      expect(effective.steps.some(Boolean)).toBe(false);
    }
  });

  it('ignores pattern editing for texture-only orbs', () => {
    const world = createStarterWorld('chill', 100);
    const texture = world.soundOrbs.find((orb) => orb.role === 'texture');
    expect(texture).toBeDefined();

    const next = varyOrbPattern(world, texture!.id, 200);

    expect(next).toBe(world);
  });
});
