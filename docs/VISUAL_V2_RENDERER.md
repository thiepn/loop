# Loop — Visual V2 Rendering Architecture

## Status

Phase 2 implementation is complete.

This document defines the runtime boundary introduced by Visual V2 Phase 2.

## Renderer choice

Loop now uses:

1. **WebGL2** as the preferred World renderer;
2. **Canvas2D** as the graphics fallback;
3. semantic DOM presentation as the final no-canvas fallback.

No third-party rendering engine is required.

This keeps the architecture small enough for Loop while providing the shader/material path required by later Visual V2 phases.

## Ownership boundary

### GPU / Canvas renderer owns

- placeholder World object bodies;
- Effect Field bodies;
- Link presentation;
- toy bodies;
- listener body;
- audio-timed transient pulse presentation;
- future atmosphere, materials, trails, lighting, refraction and post-processing.

### DOM owns

- accessible names;
- keyboard focus;
- pointer capture;
- drag/resize hit targets;
- labels;
- selection panels;
- sheets/dialogs;
- toolbars;
- semantic Link hit paths;
- onboarding;
- status announcements.

The DOM remains authoritative for interaction geometry in Phase 2.

## Runtime flow

```
WorldDocument + AppState
          ↓
  SceneAdapter
          ↓
     RenderScene
          ↓
 WorldRendererView
   ↙           ↘
WebGL2       Canvas2D
```

Transient scheduled visual activity follows a separate path:

```
existing audio scheduler
          ↓
 existing App timeout alignment
          ↓
 VisualEventBridge
          ↓
 demand-driven AnimationClock
          ↓
 renderer
```

The renderer never schedules audio.

## Scene projection

`SceneAdapter.ts` is pure.

It projects:

- Sound Orbs;
- Effect Fields;
- playground toys;
- Portal exits;
- Links;
- listener;
- selection state;
- playback/recording state;
- live Motion/manual preview positions;
- Field previews;
- toy previews.

Runtime preview values remain outside `WorldDocument`.

## Render loop policy

Visual V2 does **not** add another permanent animation loop.

The new `AnimationClock` runs only when:

- scene state invalidates;
- viewport/DPR changes;
- a preview moves;
- Motion provides a new position;
- a transient visual event remains active.

The existing Motion loop remains authoritative for live creative positions.

## Device pixel ratio

The renderer applies quality-aware DPR caps:

- High: up to 2×;
- Balanced: up to 1.5×;
- Battery Saver: 1×.

This is a graphics-only policy.

## Context loss

WebGL context loss:

1. is prevented from triggering default destructive behavior;
2. marks the renderer as unavailable;
3. exposes the existing semantic DOM visuals as a temporary fallback;
4. recreates GPU resources on `webglcontextrestored`;
5. redraws the current scene after restoration.

Context loss never alters creative state.

## Placeholder rendering

Phase 2 intentionally uses simple visual primitives:

- translucent Field ellipses;
- curved Link lines;
- role-colored Orb discs;
- simple toy discs;
- listener discs;
- expanding pulse discs.

These are architecture placeholders.

Phase 3 onward owns final visual quality.

## Diagnostics

`WorldRendererView.getDiagnostics()` exposes:

- renderer kind;
- frame count;
- average render time;
- last render time;
- context-loss count;
- current render viewport.

Diagnostics are runtime-only and are not persisted.

## Performance rules

The architecture is designed around existing Loop caps.

Phase 2 specifically avoids:

- permanent allocation-heavy animation;
- DOM layout from render frames;
- third-party scene engines;
- extra musical clocks;
- saved render state;
- expensive final shaders before profiling infrastructure exists.

## Phase 3 handoff

Phase 3 may now replace the transparent/static World background with the first true Visual V2 environment:

- deep backdrop;
- atmospheric haze;
- far/near particles;
- derived palette;
- depth bands;
- parallax;
- silence state;
- global energy response.

It should build on the renderer introduced here rather than adding another rendering surface.
