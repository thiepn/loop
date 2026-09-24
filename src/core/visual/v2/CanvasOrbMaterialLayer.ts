import type { VisualPreferences } from '../VisualQuality';
import type { SoundRole } from '../../sounds/SoundDefinition';
import {
  ROLE_RENDER_COLORS,
  renderColorCss,
  withAlpha,
  type RenderColor,
} from './RenderPalette';
import { transientOrbInteraction } from './InteractionModel';
import { renderPolicyForPreferences } from './RendererPolicy';
import { orbDiameterPixels } from './RenderMetrics';
import type {
  RenderEventSample,
  RenderOrb,
} from './RenderTypes';

interface PulseState {
  readonly amount: number;
  readonly progress: number;
}

function pulseForOrb(
  orbId: string,
  events: readonly RenderEventSample[],
): PulseState {
  let amount = 0;
  let progress = 1;

  for (const sample of events) {
    if (
      sample.event.kind !== 'orb-pulse'