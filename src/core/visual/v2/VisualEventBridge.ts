import type {
  RenderEventSample,
  VisualTransientEvent,
} from './RenderTypes';

interface QueuedVisualEvent {
  readonly event: VisualTransientEvent;
  readonly startedAtMs: number;
  readonly durationMs: number;
}

export interface VisualEventSnapshot {
  readonly samples: readonly RenderEventSample[];
  readonly hasActiveEvents: boolean;
}

function durationForEvent(event: VisualTransientEvent): number {
  switch (event.kind) {
    case 'orb-pulse':
      return 520;
    case 'link-pulse':
      return 320;
    case 'pointer-disturbance':
      return 720;
    case 'orb-drop':
      return 560;
    case 'orb-charge':
      return 900;
  }
}

export class VisualEventBridge {
  private readonly events: QueuedVisualEvent[] = [];

  public emit(
    event: VisualTransientEvent,
    startedAtMs: number,
  ): void {
    if (event.kind === 'pointer-disturbance') {
      for (let index = this.events.length - 1; index >= 0; index -= 1) {
        if (this.events[index]?.event.kind === 'pointer-disturbance') {
          this.events.splice(index, 1);
        }
      }
    }

    if (event.kind === 'orb-drop' || event.kind === 'orb-charge') {
      for (let index = this.events.length - 1; index >= 0; index -= 1) {
        const queued = this.events[index]?.event;
        if (
          queued?.kind === event.kind
          && queued.orbId === event.orbId
        ) {
          this.events.splice(index, 1);
        }
      }
    }

    this.events.push({
      event,
      startedAtMs,
      durationMs: durationForEvent(event),
    });
  }

  public sample(nowMs: number): VisualEventSnapshot {
    const samples: RenderEventSample[] = [];
    let writeIndex = 0;

    for (const queued of this.events) {
      const elapsed = Math.max(0, nowMs - queued.startedAtMs);
      const progress = elapsed / queued.durationMs;

      if (progress >= 1) {
        continue;
      }

      this.events[writeIndex] = queued;
      writeIndex += 1;
      samples.push({
        event: queued.event,
        progress: Math.max(0, Math.min(1, progress)),
      });
    }

    this.events.length = writeIndex;

    return {
      samples,
      hasActiveEvents: this.events.length > 0,
    };
  }

  public clear(): void {
    this.events.length = 0;
  }
}
