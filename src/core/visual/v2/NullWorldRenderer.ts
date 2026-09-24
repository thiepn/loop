import type { VisualPreferences } from '../VisualQuality';
import type {
  RenderEventSample,
  RenderScene,
  RenderViewport,
  WorldRenderer,
} from './RenderTypes';

export class NullWorldRenderer implements WorldRenderer {
  public readonly kind = 'none' as const;

  public resize(viewport: RenderViewport): void {
    void viewport;
  }

  public render(
    scene: Readonly<RenderScene>,
    preferences: Readonly<VisualPreferences>,
    events: readonly RenderEventSample[],
    timestampMs: number,
  ): void {
    void scene;
    void preferences;
    void events;
    void timestampMs;
  }

  public restore(): void {}

  public destroy(): void {}
}
