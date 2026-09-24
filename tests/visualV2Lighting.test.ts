import { describe, expect, it } from 'vitest';
import {
  deriveLightFrame,
  semanticLinkPacketDirections,
} from '../src/core/visual/v2/LightModel';
import { projectWorldToRenderScene } from '../src/core/visual/v2/SceneAdapter';
import { VisualEventBridge } from '../src/core/visual/v2/VisualEventBridge';
import { createEffectField } from '../src/core/world/EffectField';
import { createLink } from '../src/core/world/Link';
import { createSoundOrb } from '../src/core/world/SoundOrb';
import { createEmptyWorld } from '../src/core/world/World';

const HIGH = {
  quality: 'high' as const,
  reduceMotion: false,
  reduceParticles: false,
  reduceBloom: false,
};

function sceneWithLink(type: 'pulse-together' | 'take-turns' | 'follow' = 'pulse-together') {
  const beat = createSoundOrb({
    id: 'beat',
    soundId: 'beat-round-kick',
    role: 'beat',
    position: { x: 0.2, y: 0.4 },
  });
  const bass = createSoundOrb({
    id: 'bass',
    soundId: 'bass-warm',
    role: 'bass',
    position: { x: 0.8, y: 0.6 },
  });
  const link = createLink({
    id: 'link',
    type,
    sourceOrbId: beat.id,
    targetOrbId: bass.id,
  });
  const heat = createEffectField({
    id: 'heat',
    type: 'heat',
    position: { x: 0.2, y: 0.4 },
    radius: 0.24,
  });
  const world = createEmptyWorld({
    id: 'light-world',
    soundOrbs: [beat, bass],
    links: [link],
    effectFields: [heat],
  });

  return projectWorldToRenderScene(world, {
    selectedOrbId: null,
    selectedFieldId: null,
    selectedToyId: null,
    selectedLinkId: null,
    playing: true,
    recording: false,
  });
}

describe('Visual V2 light transport', () => {
  it('creates Field-tinted local light and Orb-to-listener packet from scheduled activity', () => {
    const scene = sceneWithLink();
    const frame = deriveLightFrame(
      scene,
      [{
        event: {
          kind: 'orb-pulse',
          orbId: 'beat',
          intensity: 0.9,
          position: { x: 0.2, y: 0.4 },
        },
        progress: 0.3,
      }],
      HIGH,
    );

    expect(frame.localLights).toHaveLength(1);
    expect(frame.localLights[0]?.position)
      .toEqual({ x: 0.2, y: 0.4 });
    expect(frame.localLights[0]?.intensity).toBeGreaterThan(0);
    expect(frame.localLights[0]?.color[1])
      .toBeLessThan(0.443);
    expect(frame.listenerPackets).toHaveLength(1);
    expect(frame.listenerPackets[0]?.target)
      .toEqual(scene.listener);
    expect(frame.listener.energy).toBeGreaterThan(0.16);
  });

  it('removes travel packets under Reduce Motion while retaining arrival/light state', () => {
    const scene = sceneWithLink();
    const frame = deriveLightFrame(
      scene,
      [{
        event: {
          kind: 'orb-pulse',
          orbId: 'beat',
          intensity: 1,
          position: null,
        },
        progress: 0.78,
      }],
      {
        ...HIGH,
        reduceMotion: true,
      },
    );

    expect(frame.listenerPackets).toHaveLength(0);
    expect(frame.localLights.length).toBeGreaterThan(0);
    expect(frame.listener.arrival).toBeGreaterThan(0);
  });

  it('caps simultaneous local lights by quality', () => {
    const orbs = Array.from({ length: 12 }, (_, index) => createSoundOrb({
      id: 'orb-' + index,
      soundId: index % 2 === 0 ? 'beat-round-kick' : 'melody-soft-pluck',
      role: index % 2 === 0 ? 'beat' : 'melody',
      position: {
        x: 0.1 + (index % 4) * 0.2,
        y: 0.2 + Math.floor(index / 4) * 0.2,
      },
    }));
    const world = createEmptyWorld({ soundOrbs: orbs });
    const scene = projectWorldToRenderScene(world, {
      selectedOrbId: null,
      selectedFieldId: null,
      selectedToyId: null,
      selectedLinkId: null,
      playing: true,
      recording: false,
    });
    const events = orbs.map((orb) => ({
      event: {
        kind: 'orb-pulse' as const,
        orbId: orb.id,
        intensity: 1,
        position: orb.position,
      },
      progress: 0.1,
    }));

    expect(
      deriveLightFrame(scene, events, HIGH).localLights,
    ).toHaveLength(8);
    expect(
      deriveLightFrame(scene, events, {
        ...HIGH,
        quality: 'balanced',
      }).localLights,
    ).toHaveLength(6);
    expect(
      deriveLightFrame(scene, events, {
        ...HIGH,
        quality: 'battery',
      }).localLights,
    ).toHaveLength(4);
  });

  it('gives selected Orb more static light than focused-only Orb', () => {
    const beat = createSoundOrb({
      id: 'selected',
      soundId: 'beat-round-kick',
      role: 'beat',
      position: { x: 0.3, y: 0.5 },
    });
    const bass = createSoundOrb({
      id: 'focused',
      soundId: 'bass-warm',
      role: 'bass',
      position: { x: 0.7, y: 0.5 },
    });
    const scene = projectWorldToRenderScene(
      createEmptyWorld({ soundOrbs: [beat, bass] }),
      {
        selectedOrbId: 'selected',
        focusedOrbId: 'focused',
        selectedFieldId: null,
        selectedToyId: null,
        selectedLinkId: null,
        playing: false,
        recording: false,
      },
    );

    const frame = deriveLightFrame(scene, [], HIGH);
    const selected = frame.localLights.find(
      (light) => light.id === 'state:selected',
    );
    const focused = frame.localLights.find(
      (light) => light.id === 'state:focused',
    );

    expect(selected?.intensity).toBeGreaterThan(
      focused?.intensity ?? 0,
    );
  });

  it('tints listener state toward recording rose without changing creative state', () => {
    const scene = sceneWithLink();
    const recordingScene = {
      ...scene,
      recording: true,
    };
    const normal = deriveLightFrame(scene, [], HIGH);
    const recording = deriveLightFrame(
      recordingScene,
      [],
      HIGH,
    );

    expect(recording.listener.color)
      .not.toEqual(normal.listener.color);
    expect(recording.listener.color[0])
      .toBeGreaterThan(normal.listener.color[0]);
  });
});

describe('Visual V2 semantic Link packets', () => {
  it('uses one source-to-target packet for directed relationships', () => {
    const scene = sceneWithLink('follow');
    const link = scene.links[0]!;

    const directions = semanticLinkPacketDirections(
      link,
      0.5,
    );

    expect(directions).toHaveLength(1);
    expect(directions[0]).toBeGreaterThan(0);
    expect(directions[0]).toBeLessThan(1);
  });

  it('uses mirrored packets for Take Turns', () => {
    const scene = sceneWithLink('take-turns');
    const link = scene.links[0]!;
    const directions = semanticLinkPacketDirections(
      link,
      0.4,
    );

    expect(directions).toHaveLength(2);
    expect(directions[0]! + directions[1]!)
      .toBeCloseTo(1);
  });

  it('projects source and target roles into each rendered Link', () => {
    const scene = sceneWithLink();

    expect(scene.links[0]?.sourceRole).toBe('beat');
    expect(scene.links[0]?.targetRole).toBe('bass');
  });
});

describe('Visual V2 Link lifecycle events', () => {
  it('expires create and delete choreography automatically', () => {
    const bridge = new VisualEventBridge();
    const scene = sceneWithLink();
    const link = scene.links[0]!;

    bridge.emit({
      kind: 'link-created',
      linkId: link.id,
    }, 100);
    bridge.emit({
      kind: 'link-deleted',
      link: {
        id: link.id,
        type: link.type,
        sourceRole: link.sourceRole,
        targetRole: link.targetRole,
        source: link.source,
        target: link.target,
        cross: link.cross,
      },
    }, 100);

    expect(bridge.sample(100).samples).toHaveLength(2);
    expect(bridge.sample(800).samples).toHaveLength(0);
  });
});
