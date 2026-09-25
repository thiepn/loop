# Loop — Visual V2 UI Chrome, Panels, Icons & Spatial Controls

## Status

Phase 13 implementation is present on the Visual V2 track.

## Goal

Phase 13 removes the remaining V1-era visual fragmentation from Loop's in-playground application chrome.

The playground now uses one control language across:

- top bar;
- bottom dock;
- Sound Orb selection;
- Field selection;
- toy selection;
- Link selection;
- Sound palette;
- Pattern;
- Motion;
- Effects;
- toys;
- Links;
- Remix/Magic;
- Capture;
- Snapshots and visual settings through the shared sheet system.

The creative canvas remains visually dominant.

## Loop-native icon family

A tiny internal `LoopIcons` module replaces mixed Unicode symbols and text-only actions.

The icon family covers:

- play / stop;
- add;
- Shape;
- Motion;
- Link;
- Magic;
- Change;
- mute / unmute;
- duplicate;
- delete;
- Effects;
- toys;
- close;
- retry;
- undo;
- record;
- clear;
- keep/check;
- download.

Icons share:

- 24×24 viewBox;
- rounded stroke grammar;
- currentColor inheritance;
- `aria-hidden="true"`;
- no embedded labels.

Button text remains the accessible/action label.

No third-party icon package or asset dependency is introduced.

## Top bar

The top bar remains intentionally sparse:

- Loop brand/Home action;
- World name and tempo;
- Play/Stop primary transport action.

Play/Stop now changes icon and state label together.

The chrome uses less height and lighter glass treatment than the previous V1 styling.

## Bottom dock

Add, Effects, Toys, Remix and Record share:

- icon + label composition;
- compact optical-glass body;
- one radius/border hierarchy;
- consistent hover/pressed/focus behavior.

The dock itself is a single lightweight glass strip rather than five independently floating visual styles.

On narrow screens it becomes horizontally scrollable rather than shrinking controls below useful touch size.

## Contextual Sound controls

The selected-Sound panel is now role-aware.

It receives the selected Orb's actual Sound role and changes its contextual accent:

- Beat → rose;
- Percussion → amber;
- Bass → cyan;
- Harmony → violet;
- Melody → green;
- Texture → blue;
- Voice → pink.

The panel does not recolor all controls. The accent is used sparingly for:

- left identity rail;
- panel border;
- local glow;
- hover state.

Actions now have dedicated icons:

- Shape;
- Motion;
- Link;
- Magic;
- Change;
- Mute/Unmute;
- Duplicate;
- Delete.

## Field controls

Field panels expose their real Field type to the chrome.

Accent mapping matches Phase 7 Field identity:

- Space → violet;
- Echo → cyan;
- Heat → rose;
- Frost → pale blue;
- Filter → green.

Effects dock action, Magic, Delete and close controls use the shared icon system.

## Toy controls

Toy panels expose real toy type:

- Spinner → violet;
- Magnet → green;
- Repulsor → rose;
- Portal → cyan.

Toy, Magic, Delete and close controls now use the common chrome/icon grammar.

## Link controls

Link selection receives Link type identity.

Relationship types get restrained accents while the actual Phase 9 light-path renderer remains the dominant Link visual.

Delete and close actions use common iconography.

## Shared editor sheets

Before Phase 13, palettes/editors separately repeated nearly identical CSS for:

- backdrop positioning;
- blur;
- sheet border/background;
- radius;
- shadows;
- close controls;
- header layout.

Phase 13 collapses these into shared optical-glass primitives driven by small per-editor custom properties:

- z-index;
- width;
- accent.

Editor-specific content remains independent.

## Shared typography hierarchy

Editor headers now share:

- compact uppercase eyebrow;
- 24px high-priority title;
- subdued explanatory copy;
- consistent spacing.

Contextual selection panels share:

- small semantic category;
- 13px selected-object name;
- compact secondary relationship/help copy.

This replaces multiple slightly different legacy typographic systems.

## Interaction hierarchy

Buttons now use three clear levels:

1. primary transport/keep/download actions;
2. neutral contextual/editor actions;
3. destructive actions.

Hover changes are deliberately small:

- one-pixel lift;
- local accent border/background;
- no large scale bounce.

Focus remains controlled by existing `:focus-visible` rules and modal focus management.

## Mobile spatial controls

Below 620px:

- contextual actions become an icon-first four-column grid;
- Sound action labels are hidden while the button's accessible text remains in DOM;
- icon size increases slightly;
- controls remain at least 40px high;
- bottom dock scrolls horizontally if required.

The contextual panel stays above the bottom dock and safe area.

## Landscape mobile

Short landscape viewports move the contextual panel toward the right side of the World and bound its height.

This preserves canvas visibility instead of covering the lower half of the composition.

## Forced colors / contrast

In forced-colors mode:

- panel/sheet custom glass backgrounds are removed;
- platform Canvas/CanvasText colors take over;
- structural borders remain;
- SVG icons inherit platform text color.

The semantic focus system remains unchanged.

## Reduce Motion

Existing Phase 15/V2 reduced-motion sheet/panel rules remain.

Phase 13 does not add mandatory looping chrome animation.

Hover lifts disappear naturally from touch and remain nonessential.

## Bundle consolidation

Phase 13 adds iconography while keeping the release envelope by removing duplicated V1 editor chrome.

Consolidated areas include:

- ten modal/palette backdrops;
- ten sheet shells;
- editor headers;
- close buttons;
- four contextual selection panels;
- panel action buttons;
- panel typography;
- superseded per-editor mobile overrides.

This is intentionally a replacement, not an override pile.

## State boundary

Phase 13 changes presentation only.

It does not alter:

- World schema;
- audio;
- playback;
- Pattern behavior;
- Motion;
- Field DSP;
- toy physics;
- Link semantics;
- Magic;
- capture;
- persistence;
- history;
- focus trapping;
- hit geometry of creative objects.

## Phase 14 handoff

Phase 14 — Performance / Presentation Mode can now hide or reduce one coherent chrome system instead of coordinating several generations of unrelated controls.
