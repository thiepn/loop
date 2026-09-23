import {
  isPlaybackDriverLink,
  type LinkDocument,
} from '../world/Link';
import type { WorldDocument } from '../world/World';
import type { ScheduledTick } from './LookaheadScheduler';
import type { MusicalTransport } from './MusicalTransport';

export function baseEventAllowedByLinks(
  world: WorldDocument,
  orbId: string,
  tick: ScheduledTick,
): boolean {
  if (
    world.links.some(
      (link) => (
        isPlaybackDriverLink(link.type)
        && link.targetOrbId === orbId
      ),
    )
  ) {
    return false;
  }

  const takeTurns = world.links.find(
    (link) => (
      link.type === 'take-turns'
      && (
        link.sourceOrbId === orbId
        || link.targetOrbId === orbId
      )
    ),
  );

  if (!takeTurns) {
    return true;
  }

  const sourceTurn = tick.bar % 2 === 0;

  return sourceTurn
    ? takeTurns.sourceOrbId === orbId
    : takeTurns.targetOrbId === orbId;
}

export function reactiveLinksFromSource(
  links: readonly LinkDocument[],
  sourceOrbId: string,
): readonly LinkDocument[] {
  return links.filter(
    (link) => (
      link.sourceOrbId === sourceOrbId
      && (
        link.type === 'pulse-together'
        || link.type === 'follow'
        || link.type === 'kick-pushes-bass'
      )
    ),
  );
}

export function reactiveLinkTime(
  link: LinkDocument,
  sourceEventTime: number,
  transport: MusicalTransport,
): number {
  if (link.type === 'follow') {
    return sourceEventTime + transport.secondsPerBeat / 4;
  }

  return sourceEventTime;
}

export function takeTurnsLinkForActivity(
  links: readonly LinkDocument[],
  orbId: string,
): LinkDocument | null {
  return links.find(
    (link) => (
      link.type === 'take-turns'
      && (
        link.sourceOrbId === orbId
        || link.targetOrbId === orbId
      )
    ),
  ) ?? null;
}
