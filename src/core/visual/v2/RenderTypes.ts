import type { VisualPreferences } from '../VisualQuality';
import type { EffectFieldType } from '../../world/EffectField';
import type { LinkType } from '../../world/Link';
import type { PlaygroundToyType } from '../../world/PlaygroundToy';
import type { NormalizedPoint } from '../../world/SoundOrb';
import type { SoundRole } from '../../sounds/SoundDefinition';

export type RendererKind = 'webgl2' | 'canvas2d' | 'none';

export interface RenderOrb {
  readonly id: string;
  readonly role: SoundRole;
  readonly position: NormalizedPoint;
  readonly muted: boolean;
  readonly selected: boolean;
}

export interface RenderField {
  readonly id: string;
  readonly type: EffectFieldType;
  readonly position: NormalizedPoint;
  readonly radius: number;
  readonly selected: boolean;
}

export interface RenderToy {
  readonly id: string;
  readonly type: PlaygroundToyType;
  readonly position: NormalizedPoint;
  readonly radius: number;
  readonly selected: boolean;
  readonly exitPosition: NormalizedPoint | null;
}

export interface RenderLink {
  readonly id: string;
  readonly type: LinkType;
  readonly sourceOrbId: string;
  readonly targetOrbId: string;
  readonly source: NormalizedPoint;
  readonly target: NormalizedPoint;
  readonly selected: boolean;
}

export interface RenderScene {
  readonly worldId: string;
  readonly playing: boolean;
  readonly recording: boolean;
  readonly orbs: readonly RenderOrb[];
  readonly fields: readonly RenderField[];
  readonly toys: readonly RenderToy[];
  readonly links: readonly RenderLink[];
  readonly listener: NormalizedPoint;
}

export interface RenderViewport {
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
}

export type VisualTransientEvent =
  | {
      readonly kind: 'orb-pulse';
      readonly orbId: string;
      readonly intensity: number;
      readonly position: NormalizedPoint | null;
    }
  | {
      readonly kind: 'link-pulse';
      readonly linkId: string;
      readonly intensity: number;
    };

export interface RenderEventSample {
  readonly event: VisualTransientEvent;
  readonly progress: number;
}

export interface WorldRenderer {
  readonly kind: RendererKind;
  resize(viewport: RenderViewport): void;
  render(
    scene: Readonly<RenderScene>,
    preferences: Readonly<VisualPreferences>,
    events: readonly RenderEventSample[],
    timestampMs: number,
  ): void;
  restore(): void;
  destroy(): void;
}
