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

export interface RenderVector {
  readonly x: number;
  readonly y: number;
}

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
  readonly detailScale: number;
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
  readonly dragPosition: NormalizedPoint;
  readonly dragDelta: RenderVector;
  readonly dragStrength: number;
  readonly spotlightPosition: NormalizedPoint;
  readonly spotlightStrength: number;
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

export interface RenderTrailToyInfluence {
  readonly type: PlaygroundToyType;
  readonly amount: number;
}

export interface RenderTrailPoint {
  readonly position: NormalizedPoint;
  readonly timestampMs: number;
  readonly speed: number;
  readonly acceleration: number;
  readonly turn: number;
  readonly velocity: RenderVector;
  readonly fieldInfluence: EffectAmounts;
  readonly toyInfluence: RenderTrailToyInfluence | null;
  readonly breakBefore: boolean;
}

export interface RenderTrail {
  readonly orbId: string;
  readonly role: SoundRole;
  readonly muted: boolean;
  readonly points: readonly RenderTrailPoint[];
}

export interface RenderOrbCrossInteraction {
  readonly auraBlend: number;
  readonly neighborLight: number;
  readonly neighborDirection: RenderVector;
  readonly wakeStrength: number;
  readonly wakeDirection: RenderVector;
  readonly toyInfluence: RenderTrailToyInfluence | null;
}

export interface RenderToyCrossInteraction {
  readonly fieldInfluence: EffectAmounts;
  readonly nearbyOrbStrength: number;
  readonly nearbyOrbDirection: RenderVector;
}

export interface RenderLinkCrossInteraction {
  readonly fieldInfluence: EffectAmounts;
  readonly dominantField: EffectFieldType | null;
  readonly refractionDirection: RenderVector;
  readonly refractionStrength: number;
  readonly toyInfluence: RenderTrailToyInfluence | null;
}

export interface RenderOrbCoupling {
  readonly id: string;
  readonly orbAId: string;
  readonly orbBId: string;
  readonly roleA: SoundRole;
  readonly roleB: SoundRole;
  readonly positionA: NormalizedPoint;
  readonly positionB: NormalizedPoint;
  readonly midpoint: NormalizedPoint;
  readonly strength: number;
}

export interface RenderCrossEnvironment {
  readonly forceType: PlaygroundToyType | null;
  readonly forcePosition: NormalizedPoint;
  readonly forceStrength: number;
  readonly couplingEnergy: number;
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

export interface RenderOrbInteraction {
  readonly hoverStrength: number;
  readonly hoverOffset: RenderVector;
  readonly grabbed: boolean;
  readonly dragVelocity: RenderVector;
  readonly dragSpeed: number;
  readonly charging: boolean;
}

export interface RenderFieldInteraction {
  readonly dragging: boolean;
  readonly resizing: boolean;
  readonly tension: number;
}

export interface RenderFieldCrossInteraction {
  readonly toyInfluence: RenderTrailToyInfluence | null;
  readonly nearbyOrbEnergy: number;
}

export interface RenderFieldMaterial {
  readonly seed: number;
  readonly edgeRoughness: number;
  readonly detail: number;
}

export interface RenderFieldIntersection {
  readonly id: string;
  readonly typeA: EffectFieldType;
  readonly typeB: EffectFieldType;
  readonly position: NormalizedPoint;
  readonly radius: number;
  readonly strength: number;
  readonly simplified: boolean;
}

export interface RenderFieldEnvironment {
  readonly space: number;
  readonly echo: number;
  readonly heat: number;
  readonly frost: number;
  readonly filter: number;
  readonly overlap: number;
}

export interface RenderOrb {
  readonly id: string;
  readonly role: SoundRole;
  readonly position: NormalizedPoint;
  readonly muted: boolean;
  readonly selected: boolean;
  readonly focused: boolean;
  readonly interaction: RenderOrbInteraction;
  readonly cross: RenderOrbCrossInteraction;
  readonly material: RenderOrbMaterial;
}

export interface RenderField {
  readonly id: string;
  readonly type: EffectFieldType;
  readonly position: NormalizedPoint;
  readonly radius: number;
  readonly selected: boolean;
  readonly interaction: RenderFieldInteraction;
  readonly cross: RenderFieldCrossInteraction;
  readonly material: RenderFieldMaterial;
}

export interface RenderToy {
  readonly id: string;
  readonly type: PlaygroundToyType;
  readonly position: NormalizedPoint;
  readonly radius: number;
  readonly selected: boolean;
  readonly exitPosition: NormalizedPoint | null;
  readonly cross: RenderToyCrossInteraction;
}

export interface RenderLink {
  readonly id: string;
  readonly type: LinkType;
  readonly sourceOrbId: string;
  readonly targetOrbId: string;
  readonly sourceRole: SoundRole;
  readonly targetRole: SoundRole;
  readonly source: NormalizedPoint;
  readonly target: NormalizedPoint;
  readonly selected: boolean;
  readonly cross: RenderLinkCrossInteraction;
}

export interface RenderLinkGhost {
  readonly id: string;
  readonly type: LinkType;
  readonly sourceRole: SoundRole;
  readonly targetRole: SoundRole;
  readonly source: NormalizedPoint;
  readonly target: NormalizedPoint;
  readonly cross: RenderLinkCrossInteraction;
}

export interface RenderScene {
  readonly worldId: string;
  readonly playing: boolean;
  readonly recording: boolean;
  readonly orbs: readonly RenderOrb[];
  readonly fields: readonly RenderField[];
  readonly fieldIntersections: readonly RenderFieldIntersection[];
  readonly fieldEnvironment: RenderFieldEnvironment;
  readonly toys: readonly RenderToy[];
  readonly links: readonly RenderLink[];
  readonly orbCouplings: readonly RenderOrbCoupling[];
  readonly crossEnvironment: RenderCrossEnvironment;
  readonly trails: readonly RenderTrail[];
  readonly listener: NormalizedPoint;
  readonly environment: RenderEnvironment;
}

export interface RenderViewport {
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
}

export type ChoreographyStateCue =
  | 'play'
  | 'stop'
  | 'record-start'
  | 'record-stop';

export type StateTransitionKind =
  | 'magic'
  | 'magic-revert'
  | 'snapshot'
  | 'undo'
  | 'redo'
  | 'delete'
  | 'portal';

export type StateTransitionObjectKind =
  | 'orb'
  | 'field'
  | 'toy'
  | 'link';

export interface StateTransitionNode {
  readonly id: string;
  readonly kind: StateTransitionObjectKind;
  readonly from: NormalizedPoint | null;
  readonly to: NormalizedPoint | null;
  readonly color: RenderRgb;
  readonly radius: number;
}

export interface StateTransitionPayload {
  readonly kind: StateTransitionKind;
  readonly key: string;
  readonly priority: number;
  readonly seed: number;
  readonly intensity: number;
  readonly origin: NormalizedPoint;
  readonly nodes: readonly StateTransitionNode[];
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
      readonly kind: 'link-created';
      readonly linkId: string;
    }
  | {
      readonly kind: 'link-deleted';
      readonly link: RenderLinkGhost;
    }
  | {
      readonly kind: 'state-transition';
      readonly transition: StateTransitionPayload;
    }
  | {
      readonly kind: 'choreography-state';
      readonly cue: ChoreographyStateCue;
      readonly intensity: number;
    }
  | {
      readonly kind: 'choreography-bar';
      readonly bar: number;
      readonly phrasePosition: number;
      readonly density: number;
      readonly silent: boolean;
      readonly durationMs: number;
    }
  | {
      readonly kind: 'choreography-hit';
      readonly bar: number;
      readonly downbeat: boolean;
      readonly simultaneousCount: number;
      readonly density: number;
      readonly reentry: boolean;
      readonly intensity: number;
    }
  | {
      readonly kind: 'pointer-disturbance';
      readonly position: NormalizedPoint;
      readonly delta: RenderVector;
      readonly intensity: number;
    }
  | {
      readonly kind: 'orb-drop';
      readonly orbId: string;
      readonly position: NormalizedPoint;
      readonly velocity: RenderVector;
      readonly intensity: number;
    }
  | {
      readonly kind: 'orb-charge';
      readonly orbId: string;
      readonly position: NormalizedPoint;
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
