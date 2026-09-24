import type { WorldDocument } from '../world/World';

export class WorldHistory {
  private readonly past: WorldDocument[] = [];
  private readonly future: WorldDocument[] = [];
  private presentWorld: WorldDocument;

  public constructor(
    initialWorld: WorldDocument,
    private readonly maxEntries = 64,
  ) {
    this.presentWorld = initialWorld;
  }

  public get present(): WorldDocument {
    return this.presentWorld;
  }

  public get canUndo(): boolean {
    return this.past.length > 0;
  }

  public get canRedo(): boolean {
    return this.future.length > 0;
  }

  public reset(world: WorldDocument): void {
    this.past.splice(0);
    this.future.splice(0);
    this.presentWorld = world;
  }

  public record(world: WorldDocument): void {
    if (world === this.presentWorld) {
      return;
    }

    this.past.push(this.presentWorld);

    if (this.past.length > this.maxEntries) {
      this.past.splice(0, this.past.length - this.maxEntries);
    }

    this.presentWorld = world;
    this.future.splice(0);
  }

  public undo(): WorldDocument | null {
    const previous = this.past.pop();

    if (!previous) {
      return null;
    }

    this.future.push(this.presentWorld);
    this.presentWorld = previous;
    return previous;
  }

  public redo(): WorldDocument | null {
    const next = this.future.pop();

    if (!next) {
      return null;
    }

    this.past.push(this.presentWorld);
    this.presentWorld = next;
    return next;
  }
}
