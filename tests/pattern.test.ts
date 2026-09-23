import { describe, expect, it } from 'vitest';
import {
  createDefaultPattern,
  densityForPattern,
  grooveOffsetBeats,
  setMelodyNote,
  setPatternDensity,
  setPatternGroove,
  setRhythmStep,
  varyPattern,
  type MelodyPatternDocument,
  type RhythmPatternDocument,
} from '../src/core/music/Pattern';

describe('Pattern', () => {
  it('creates 16-step rhythm defaults', () => {
    const pattern = createDefaultPattern('kick-steady');

    expect(pattern?.kind).toBe('rhythm');
    if (pattern?.kind !== 'rhythm') {
      throw new Error('Expected rhythm pattern.');
    }

    expect(pattern.steps).toHaveLength(16);
    expect(pattern.steps[0]).toBe(true);
    expect(pattern.steps[8]).toBe(true);
  });

  it('creates scale-degree melody defaults without note names', () => {
    const pattern = createDefaultPattern('melody-spark');

    expect(pattern?.kind).toBe('melody');
    if (pattern?.kind !== 'melody') {
      throw new Error('Expected melody pattern.');
    }

    expect(pattern.notes).toHaveLength(16);
    expect(pattern.notes[3]).toBe(4);
    expect(pattern.notes[15]).toBe(2);
  });

  it('paints rhythm steps immutably', () => {
    const base = createDefaultPattern('kick-steady') as RhythmPatternDocument;
    const next = setRhythmStep(base, 4, true);

    expect(base.steps[4]).toBe(false);
    expect(next.steps[4]).toBe(true);
  });

  it('paints and clamps melody degrees', () => {
    const base = createDefaultPattern('melody-spark') as MelodyPatternDocument;
    const next = setMelodyNote(base, 2, 99);

    expect(next.notes[2]).toBe(6);
  });

  it('applies bounded density levels', () => {
    const base = createDefaultPattern('hat-eighths') as RhythmPatternDocument;
    const sparse = setPatternDensity(base, 'sparse', 10);
    const busy = setPatternDensity(base, 'busy', 10);

    expect(densityForPattern(sparse)).toBe('sparse');
    expect(densityForPattern(busy)).toBe('busy');
  });

  it('stores friendly groove choices and offsets only offbeats', () => {
    const base = createDefaultPattern('shaker-offbeats')!;
    const straight = setPatternGroove(base, 'straight');
    const bounce = setPatternGroove(base, 'bounce');

    expect(straight.groove).toBe('straight');
    expect(bounce.groove).toBe('bounce');
    expect(grooveOffsetBeats('bounce', 0)).toBe(0);
    expect(grooveOffsetBeats('bounce', 1)).toBeGreaterThan(0);
  });

  it('generates deterministic successive variations from the same state', () => {
    const base = createDefaultPattern('bass-pulse')!;
    const first = varyPattern(base, 42);
    const again = varyPattern(base, 42);
    const second = varyPattern(first, 42);

    expect(first).toEqual(again);
    expect(second.variation).toBe(first.variation + 1);
    expect(second).not.toEqual(first);
  });
});
