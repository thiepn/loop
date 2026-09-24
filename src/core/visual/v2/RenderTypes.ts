import type { VisualPreferences } from '../VisualQuality';
import type {
  EffectAmounts,
  EffectFieldType,
} from '../../world/EffectField';
import type { LinkType } from '../../world/Link';
import type { PlaygroundToyType } from '../../world/PlaygroundToy';
import type { NormalizedPoint } from '../../world/SoundOrb';
import type { SoundRole } from '../../sounds/SoundDefinition';

export type RendererKind = 'webgl2' | 'canvas2d' | 'none';

export type RenderRgb = readonly [
  red: number,
  green: number,
  blue: number,
];

export interface RenderEnvironment {
  readonly primary: RenderRgb;
  readonly secondary: RenderRgb;
  readonly density: number;
  readonly ambience: number;
  readonly particleDensity: number;
  readonly seed: number;
}

export interface EnvironmentDynamics {
  readonly energy: number;
  readonly bassPressure: number;
  readonly transient: number;
  readonly eventPosition: NormalizedPoint;
  readonly eventStrength: number;
  readonly pointerPosition: NormalizedPoint;
  readonly pointerDelta: NormalizedPoint;
  readonly pointerStrength: number;
}

export interface EnvironmentParticle {
  readonly x: number;
  readonly y: number;
  readonly depth: number;
  readonly size: number;
  readonly alpha: number;
  readonly phase: number;
  readonly near: boolean;
}

export interface RenderOrbMaterial {
  readonly energy: number;
  readonly brightness: number;
  readonly density: number;
  readonly groove: number;
  readonly contour: number;
  readonly spread: number;
  readonly variation: number;
  readonly seed: number;
  readonly pattern: readonly number[];
  readonly fieldInfluence: EffectAmounts;
}

export interface RenderOrb {
  readonly id: string;
  readonly role: SoundRole;
  readonly position: NormalizedPoint;
  readonly muted: boolean;
  readonly selected: boolean;
  readonly focused: boolean;
  readonly material: RenderOrbMaterial;
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
  readonly environment: RenderEnvironment;
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
    }
  | {
      readonly kind: 'pointer-disturbance';
      readonly position: NormalizedPoint;
      readonly delta: NormalizedPoint;
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
