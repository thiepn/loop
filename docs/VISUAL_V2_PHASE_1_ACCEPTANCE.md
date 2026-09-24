# Visual V2 Phase 1 — Specification & Art Direction Lock Acceptance

## Scope
- [x] Visual V2 is explicitly defined as a post-V1 track.
- [x] V1 release-candidate runtime remains unchanged.
- [x] Phase 1 is documentation/specification only.
- [x] Existing Loop product definition remains authoritative.
- [x] Visual V2 remains a visual music playground, not a DAW or graphics editor.

## Art direction
- [x] One visual thesis is defined: music behaves like living light inside a tactile spatial universe.
- [x] World-first hierarchy is defined.
- [x] Visual effects must serve understanding, interaction, identity, hierarchy, state, or bounded delight.
- [x] Generic neon-dashboard and sci-fi-HUD direction is explicitly rejected.
- [x] Screenshot-quality target is defined.

## Scene composition
- [x] Perceptual render layers are defined.
- [x] Far / World plane / Near depth bands are defined.
- [x] Visual V2 uses 2.5D depth rather than navigable 3D.
- [x] Depth must not alter interaction geometry.

## Color and light
- [x] Existing role color families remain.
- [x] Role identity may not rely on color alone.
- [x] Composition-derived atmospheric color is allowed.
- [x] Local light is the primary unifying visual metaphor.
- [x] Bloom is explicitly restrained.
- [x] Light may not create unreadable overexposure.

## Sound Orbs
- [x] Shared Orb anatomy is defined.
- [x] Beat material identity is defined.
- [x] Percussion material identity is defined.
- [x] Bass material identity is defined.
- [x] Harmony material identity is defined.
- [x] Melody material identity is defined.
- [x] Texture material identity is defined.
- [x] Voice material identity is defined.
- [x] Musical fingerprints are defined as abstract, non-DAW information.
- [x] Label-free role recognition is an explicit target.

## Environment
- [x] World environment reacts to playback and broad musical state.
- [x] Silence is defined as an intentional visual state.
- [x] Environment reactions are presentation-only.
- [x] Background activity is bounded and subordinate to the World plane.

## Effect Fields
- [x] Space visual material is defined.
- [x] Echo visual material is defined.
- [x] Heat visual material is defined.
- [x] Frost visual material is defined.
- [x] Filter visual material is defined.
- [x] Field boundaries must match real interaction geometry.
- [x] Field intersections are part of the Visual V2 language.
- [x] Multi-overlap simplification is allowed to prevent combinatorial rendering cost.

## Motion / trails / toys
- [x] Role-specific trail identities are defined.
- [x] Trails remain bounded.
- [x] Spinner visual physics are defined.
- [x] Magnet visual physics are defined.
- [x] Repulsor visual physics are defined.
- [x] Portal transformation sequence is defined.
- [x] Toy VFX may not imply new product behavior.

## Links / listener
- [x] Links remain relationships rather than patch cables.
- [x] Link creation/activation/deletion language is defined.
- [x] Listener is defined as the visual anchor.
- [x] Listener remains distinct from Sound Orbs.
- [x] Light-packet arrival is allowed as restrained event feedback.

## Cross-system visuals
- [x] Orbs, Fields, Links, toys, trails and atmosphere may visually influence each other.
- [x] Cross-system effects are presentation-only.
- [x] Cross-system effects may not alter hit testing, musical state, history, autosave, or audio timing.

## Motion grammar
- [x] Physical motion family is defined.
- [x] Luminous motion family is defined.
- [x] Atmospheric motion family is defined.
- [x] Interface motion family is defined.
- [x] Transformative special-event family is bounded.
- [x] Timing ranges are defined.
- [x] Input must remain immediate while animation settles.

## Choreography
- [x] Playback start/stop may coordinate visual response.
- [x] Downbeats and simultaneous events may coordinate visual response.
- [x] Phrase boundaries and silence may coordinate visual response.
- [x] Recording, Magic and Snapshot events may coordinate visual response.
- [x] Existing scheduler remains the only musical timing authority.

## UI / Home / brand
- [x] UI chrome must visually recede behind the World.
- [x] Home shares the same universe as the playground.
- [x] Saved World thumbnails should derive from actual World structure.
- [x] Brand mark is constrained to Loop-native geometric primitives.
- [x] Generic audio-plugin visual language is rejected.

## Quality and performance
- [x] High profile is defined.
- [x] Balanced profile is defined.
- [x] Battery Saver profile is defined.
- [x] Ultra is explicitly optional and not part of the locked requirement.
- [x] Desktop and mobile performance goals are stated.
- [x] Particle/trail/resource bounds are required.
- [x] Visual quality may degrade before audio or interaction does.

## Accessibility
- [x] Reduce Motion remains first-class.
- [x] Reduce Particles remains first-class.
- [x] Reduce Glow remains first-class.
- [x] Reduced effects preserve semantic state feedback.
- [x] DOM controls remain semantic and focusable.
- [x] Role identity must have non-color redundancy.
- [x] High-frequency flashing is disallowed.

## State architecture
- [x] Visual runtime state is separate from WorldDocument.
- [x] Visual runtime state creates no history.
- [x] Visual runtime state creates no autosave writes.
- [x] Visual runtime state does not alter exports.
- [x] Renderer cannot become the audio clock.
- [x] Late frames may drop visual effects rather than delay sound.

## Anti-goals
- [x] No DAW visual direction.
- [x] No generic sci-fi HUD.
- [x] No particle-sandbox direction.
- [x] No visual scripting.
- [x] No shader/lighting editor.
- [x] No navigable 3D workspace.
- [x] No visual customization system that becomes a second product.

## Phase 2 readiness
- [x] Renderer responsibilities are identified.
- [x] DOM responsibilities are identified.
- [x] World-to-render adapter is required.
- [x] Visual event bridge is required.
- [x] Lifecycle/context-loss policy is required.
- [x] Quality and fallback architecture is required.
- [x] Phase 2 may begin with placeholder visuals before material polish.

## Exit condition

Phase 1 is complete when:
- this acceptance file is checked in;
- `VISUAL_V2.md` is checked in;
- the Visual V2 roadmap exists;
- README links to the new track;
- no runtime/source behavior changed;
- V1 release status remains truthful.
