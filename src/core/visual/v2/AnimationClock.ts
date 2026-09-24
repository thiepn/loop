export type AnimationFrameHandler = (
  timestampMs: number,
) => boolean;

export type RequestFrame = (
  callback: FrameRequestCallback,
) => number;

export type CancelFrame = (
  handle: number,
) => void;

export class AnimationClock {
  private frameRequest: number | null = null;

  public constructor(
    private readonly onFrame: AnimationFrameHandler,
    private readonly requestFrame: RequestFrame = (callback) => requestAnimationFrame(callback),
    private readonly cancelFrame: CancelFrame = (handle) => cancelAnimationFrame(handle),
  ) {}

  public get scheduled(): boolean {
    return this.frameRequest !== null;
  }

  public invalidate(): void {
    if (this.frameRequest !== null) {
      return;
    }

    this.frameRequest = this.requestFrame((timestamp) => {
      this.frameRequest = null;
      const keepAlive = this.onFrame(timestamp);

      if (keepAlive && this.frameRequest === null) {
        this.invalidate();
      }
    });
  }

  public destroy(): void {
    if (this.frameRequest !== null) {
      this.cancelFrame(this.frameRequest);
      this.frameRequest = null;
    }
  }
}
