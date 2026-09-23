export type StoreListener<T> = (state: Readonly<T>) => void;
export type StateUpdater<T> = (state: Readonly<T>) => T;

export class Store<T> {
  private state: T;
  private readonly listeners = new Set<StoreListener<T>>();

  public constructor(initialState: T) {
    this.state = initialState;
  }

  public getState(): Readonly<T> {
    return this.state;
  }

  public setState(next: T | StateUpdater<T>): void {
    const nextState = typeof next === 'function'
      ? (next as StateUpdater<T>)(this.state)
      : next;

    if (Object.is(nextState, this.state)) {
      return;
    }

    this.state = nextState;
    this.emit();
  }

  public patch(patch: Partial<T>): void {
    this.setState({
      ...this.state,
      ...patch,
    });
  }

  public subscribe(listener: StoreListener<T>, emitImmediately = true): () => void {
    this.listeners.add(listener);

    if (emitImmediately) {
      listener(this.state);
    }

    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
