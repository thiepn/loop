import { describe, expect, it, vi } from 'vitest';
import { Store } from '../src/core/state/Store';

describe('Store', () => {
  it('notifies subscribers immediately and after state changes', () => {
    const store = new Store({ count: 0 });
    const listener = vi.fn();

    const unsubscribe = store.subscribe(listener);
    store.patch({ count: 1 });
    unsubscribe();
    store.patch({ count: 2 });

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, { count: 0 });
    expect(listener).toHaveBeenNthCalledWith(2, { count: 1 });
  });

  it('does not emit when a state updater returns the same object', () => {
    const state = { value: 'stable' };
    const store = new Store(state);
    const listener = vi.fn();

    store.subscribe(listener, false);
    store.setState((current) => current);

    expect(listener).not.toHaveBeenCalled();
  });
});
