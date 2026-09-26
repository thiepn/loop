import { describe, expect, it } from 'vitest';
import { createEffectField } from '../src/core/world/EffectField';
import { createLink } from '../src/core/world/Link';
import { createPlaygroundToy } from '../src/core/world/PlaygroundToy';
import { createSoundOrb } from '../src/core/world/SoundOrb';
import { createEmptyWorld } from '../src/core/world/World';
import { projectWorldToRenderScene } from '../src/core/visual/v2/SceneAdapter';

function createTestWorld() {
  const beat = createSoundOrb({
    id: 'beat',
    soundId: 'beat-test',
    role: 'beat',
    position: { x: 0.2, y: 0.3 },
  });
  const bass = createSoundOrb({
    id: 'bass',
    soundId: 'bass-test',
    role: 'bass',
    position: { x: 0.8, y: 0.7 },
  });
  const field = createEffectField({
    id: 'space',
    type: 'space',
    position: { x: 0.35, y: 0.4 },
    radius: 0.18,
  });
  const toy = createPlaygroundToy({
    id: 'magnet',
    type: 'magnet',
    position: { x: 0.65, y: 0.35 },
  });
  const link = createLink({
    id: 'link',
    type: 'pulse-together',
    sourceOrbId: beat.id,
    targetOrbId: bass.id,
  });

  return createEmptyWorld({
    id: 'world',
    soundOrbs: [beat, bass],
    effectFields: [field],
    playgroundToys: [toy],
    links: [link],
  });
}

describe('Visual V2 scene adapter', () => {
  it('projects creative state without mutating the World document', () => {
    const world = createTestWorld();
    const scene = projectWorldToRenderScene(world, {
      selectedOrbId: 'beat',
      selectedFieldId: null,
      selectedToyId: null,
      selectedLinkId: 'link',
      playing: true,
      recording: false,
    });

    expect(scene.worldId).toBe('world');
    expect(scene.orbs).toHaveLength(2);
    expect(scene.orbs[0]?.selected).toBe(true);
    expect(scene.links[0]?.selected).toBe(true);
    expect(scene.listener).toEqual({ x: 0.5, y: 0.5 });
    expect(world.soundOrbs[0]?.position).toEqual({ x: 0.2, y: 0.3 });
  });

  it('reuses immutable World and Field derivations across motion frames', () => {
    const world = createTestWorld();
    const options = {
      selectedOrbId: null,
      selectedFieldId: null,
      selectedToyId: null,
      selectedLinkId: null,
      playing: true,
      recording: false,
    };
    const first = projectWorldToRenderScene(world, options);
    const second = projectWorldToRenderScene(world, {
      ...options,
      liveOrbPositions: new Map([
        ['beat', { x: 0.31, y: 0.44 }],
      ]),
    });

    expect(second.environment).toBe(first.environment);
    expect(second.fieldIntersections).toBe(first.fieldIntersections);
    expect(second.fieldEnvironment).toBe(first.fieldEnvironment);
    expect(second.fields[0]?.material).toBe(first.fields[0]?.material);
    expect(second.orbs[0]?.position).not.toEqual(first.orbs[0]?.position);
  });

  it('resolves live positions into both Orbs and Links', () => {
    const world = createTestWorld();
    const live = new Map([
      ['beat', { x: 0.42, y: 0.51 }],
    ]);

    const scene = projectWorldToRenderScene(world, {
      selectedOrbId: null,
      selectedFieldId: null,
      selectedToyId: null,
      selectedLinkId: null,
      playing: false,
      recording: false,
      liveOrbPositions: live,
    });

    expect(scene.orbs[0]?.position).toEqual({ x: 0.42, y: 0.51 });
    expect(scene.links[0]?.source).toEqual({ x: 0.42, y: 0.51 });
    expect(scene.links[0]?.target).toEqual({ x: 0.8, y: 0.7 });
  });

  it('uses preview Field and Toy documents without changing saved state', () => {
    const world = createTestWorld();
    const previewField = {
      ...world.effectFields[0]!,
      radius: 0.3,
    };
    const previewToy = {
      ...world.playgroundToys[0]!,
      position: { x: 0.1, y: 0.9 },
    };

    const scene = projectWorldToRenderScene(world, {
      selectedOrbId: null,
      selectedFieldId: 'space',
      selectedToyId: 'magnet',
      selectedLinkId: null,
      playing: false,
      recording: false,
      fieldOverrides: new Map([['space', previewField]]),
      toyOverrides: new Map([['magnet', previewToy]]),
    });

    expect(scene.fields[0]?.radius).toBe(0.3);
    expect(scene.toys[0]?.position).toEqual({ x: 0.1, y: 0.9 });
    expect(world.effectFields[0]?.radius).toBe(0.18);
    expect(world.playgroundToys[0]?.position).toEqual({ x: 0.65, y: 0.35 });
  });
});
