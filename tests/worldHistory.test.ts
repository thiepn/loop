import { describe, expect, it } from 'vitest';
import { WorldHistory } from '../src/core/state/WorldHistory';
import { createStarterWorld } from '../src/core/world/StarterWorlds';

describe('WorldHistory', () => {
  it('records material World states and supports undo redo', () => {
    const first = createStarterWorld('beat', 100);
    const second = { ...first, name: 'Second', updatedAt: 200 };
    const third = { ...second, name: 'Third', updatedAt: 300 };
    const history = new WorldHistory(first);

    history.record(second);
    history.record(third);

    expect(history.canUndo).toBe(true);
    expect(history.undo()).toBe(second);
    expect(history.undo()).toBe(first);
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(true);
    expect(history.redo()).toBe(second);
  });

  it('clears redo when a new branch is recorded', () => {
    const first = createStarterWorld('beat', 100);
    const second = { ...first, name: 'Second' };
    const branch = { ...first, name: 'Branch' };
    const history = new WorldHistory(first);

    history.record(second);
    history.undo();
    history.record(branch);

    expect(history.canRedo).toBe(false);
    expect(history.present).toBe(branch);
  });

  it('resets history when switching Worlds', () => {
    const first = createStarterWorld('beat', 100);
    const second = createStarterWorld('chill', 200);
    const history = new WorldHistory(first);

    history.record({ ...first, name: 'Edited' });
    history.reset(second);

    expect(history.present).toBe(second);
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);
  });

  it('bounds past entries', () => {
    const base = createStarterWorld('beat', 100);
    const history = new WorldHistory(base, 2);

    history.record({ ...base, name: '1' });
    history.record({ ...base, name: '2' });
    history.record({ ...base, name: '3' });

    expect(history.undo()?.name).toBe('2');
    expect(history.undo()?.name).toBe('1');
    expect(history.undo()).toBeNull();
  });
});
