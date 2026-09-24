import type { VisualPreferences } from '../VisualQuality';
import {
  LISTENER_RENDER_COLOR,
  ROLE_RENDER_COLORS,
  fieldInfluencedColor,
  mixRenderColor,
  type RenderColor,
} from './RenderPalette';
import { renderPolicyForPreferences } from './RendererPolicy';
import type {
  RenderEventSample,
  RenderLink,
  RenderRgb,
  RenderScene,
} from './RenderTypes';

export interface LocalLightSource {
  readonly id: string;
  readonly position: { x: number; y: number };
  readonly color: RenderColor;
  readonly intensity: number;
  readonly radius: number;
}

export interface ListenerPacket {
  readonly id: string;
  readonly source: { x: number; y: number };
  readonly target: { x: number; y: number };
  readonly color: RenderColor;
  readonly progress: number;
  readonly intensity: number;
}

export interface ListenerLightState {
  readonly energy: number;
  readonly arrival: number;
  readonly color: RenderColor;
}

export interface RenderLightFrame {
  readonly localLights: readonly LocalLightSource[];
  readonly listenerPackets: readonly ListenerPacket[];
  readonly listener: ListenerLightState;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function listenerArrival(progress: number): number {
  const delta = (progress - 0.82) / 0.16;
  return Math.exp(-delta * delta * 2.3);
}

function packetProgress(progress: number): number {
  const normalized = clamp01(
    (progress - 0.06) / 0.82,
  );
  return normalized * normalized * (3 - 2 * normalized);
}

function weightedColor(
  weighted: Array<{
    color: RenderColor;
    weight: number;
  }>,
): RenderColor {
  let red = LISTENER_RENDER_COLOR[0] * 0.18;
  let green = LISTENER_RENDER_COLOR[1] * 0.18;
  let blue = LISTENER_RENDER_COLOR[2] * 0.18;
  let weight = 0.18;

  for (const item of weighted) {
    red += item.color[0] * item.weight;
    green += item.color[1] * item.weight;
    blue += item.color[2] * item.weight;
    weight += item.weight;
  }

  return [
    red / weight,
    green / weight,
    blue / weight,
    1,
  ];
}

export function semanticLinkPacketDirections(
  link: RenderLink,
  progress: number,
): readonly number[] {
  if (link.type === 'take-turns') {
    return [
      packetProgress(progress),
      1 - packetProgress(progress),
    ];
  }

  return [packetProgress(progress)];
}

export function deriveLightFrame(
  scene: Readonly<RenderScene>,
  events: readonly RenderEventSample[],
  preferences: Readonly<VisualPreferences>,
): RenderLightFrame {
  const policy = renderPolicyForPreferences(preferences);
  const localLights: LocalLightSource[] = [];
  const listenerPackets: ListenerPacket[] = [];
  const listenerColors: Array<{
    color: RenderColor;
    weight: number;
  }> = [];
  let listenerArrivalEnergy = 0;
  let listenerEventEnergy = 0;

  for (const orb of scene.orbs) {
    if (!orb.selected && !orb.focused) {
      continue;
    }

    const color = fieldInfluencedColor(
      ROLE_RENDER_COLORS[orb.role],
      orb.material.fieldInfluence,
    );
    const intensity = orb.selected ? 0.13 : 0.075;

    localLights.push({
      id: 'state:' + orb.id,
      position: orb.position,
      color,
      intensity: intensity * policy.lightScale,
      radius: orb.selected ? 0.14 : 0.1,
    });
  }

  for (const sample of events) {
    const event = sample.event;

    if (event.kind === 'orb-pulse') {
      const orb = scene.orbs.find(
        (candidate) => candidate.id === event.orbId,
      );

      if (!orb) {
        continue;
      }

      const fade = Math.pow(
        1 - sample.progress,
        1.45,
      );
      const color = fieldInfluencedColor(
        ROLE_RENDER_COLORS[orb.role],
        orb.material.fieldInfluence,
      );
      const intensity = clamp01(
        event.intensity * fade,
      );

      localLights.push({
        id: 'orb:' + orb.id,
        position: event.position ?? orb.position,
        color,
        intensity: intensity * policy.lightScale,
        radius: 0.105 + intensity * 0.075,
      });

      if (!preferences.reduceMotion) {
        listenerPackets.push({
          id: 'listener:' + orb.id,
          source: event.position ?? orb.position,
          target: scene.listener,
          color,
          progress: packetProgress(sample.progress),
          intensity: event.intensity * policy.lightScale,
        });
      }

      const arrival = listenerArrival(sample.progress)
        * event.intensity;
      listenerArrivalEnergy += arrival;
      listenerEventEnergy += event.intensity * fade * 0.22;
      listenerColors.push({
        color,
        weight: Math.max(0.02, arrival + intensity * 0.15),
      });
      continue;
    }

    if (event.kind === 'link-pulse') {
      const link = scene.links.find(
        (candidate) => candidate.id === event.linkId,
      );

      if (!link) {
        continue;
      }

      const midpoint = {
        x: (link.source.x + link.target.x) / 2,
        y: (link.source.y + link.target.y) / 2,
      };
      const color = fieldInfluencedColor(
        mixRenderColor(
          ROLE_RENDER_COLORS[link.sourceRole],
          ROLE_RENDER_COLORS[link.targetRole],
          0.5,
        ),
        link.cross.fieldInfluence,
      );
      const fade = 1 - sample.progress;

      localLights.push({
        id: 'link:' + link.id,
        position: midpoint,
        color,
        intensity: event.intensity
          * fade
          * 0.3
          * policy.lightScale,
        radius: 0.08 + event.intensity * 0.035,
      });
    }
  }

  const cappedLights = localLights
    .filter((source) => source.intensity > 0.004)
    .sort((a, b) => (
      b.intensity - a.intensity
      || a.id.localeCompare(b.id)
    ))
    .slice(0, policy.lightSourceCap);

  const cappedPackets = listenerPackets
    .sort((a, b) => (
      b.intensity - a.intensity
      || a.id.localeCompare(b.id)
    ))
    .slice(
      0,
      preferences.quality === 'high'
        ? 5
        : preferences.quality === 'balanced'
          ? 3
          : 1,
    );

  const listenerColor = weightedColor(listenerColors);
  const recordingTint = scene.recording
    ? mixRenderColor(
        listenerColor,
        [1, 0.28, 0.46, 1],
        0.4,
      )
    : listenerColor;

  return {
    localLights: cappedLights,
    listenerPackets: cappedPackets,
    listener: {
      energy: clamp01(
        (scene.playing ? 0.16 : 0.04)
        + listenerEventEnergy
        + listenerArrivalEnergy * 0.55,
      ),
      arrival: clamp01(listenerArrivalEnergy),
      color: recordingTint,
    },
  };
}

export function lightRgb(
  color: RenderColor,
): RenderRgb {
  return [color[0], color[1], color[2]];
}
