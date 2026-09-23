import type { SoundOrbDocument } from './SoundOrb';

export const MAX_LINKS = 8;

export type LinkType =
  | 'pulse-together'
  | 'take-turns'
  | 'follow'
  | 'kick-pushes-bass'
  | 'copy-movement';

export interface LinkDocument {
  readonly id: string;
  readonly type: LinkType;
  readonly sourceOrbId: string;
  readonly targetOrbId: string;
}

export interface CreateLinkOptions {
  readonly id?: string;
  readonly type: LinkType;
  readonly sourceOrbId: string;
  readonly targetOrbId: string;
}

function createLinkId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `link-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createLink(options: CreateLinkOptions): LinkDocument {
  return {
    id: options.id ?? createLinkId(),
    type: options.type,
    sourceOrbId: options.sourceOrbId,
    targetOrbId: options.targetOrbId,
  };
}

export function linkLabel(type: LinkType): string {
  switch (type) {
    case 'pulse-together':
      return 'Pulse Together';
    case 'take-turns':
      return 'Take Turns';
    case 'follow':
      return 'Follow';
    case 'kick-pushes-bass':
      return 'Kick Pushes Bass';
    case 'copy-movement':
      return 'Copy Movement';
  }
}

export function linkDescription(type: LinkType): string {
  switch (type) {
    case 'pulse-together':
      return 'Target plays whenever the source plays';
    case 'take-turns':
      return 'Source and target alternate every bar';
    case 'follow':
      return 'Target answers one step after the source';
    case 'kick-pushes-bass':
      return 'A kick hit briefly pushes the bass back';
    case 'copy-movement':
      return 'Target mirrors the source movement';
  }
}

export function isPlaybackDriverLink(type: LinkType): boolean {
  return type === 'pulse-together' || type === 'follow';
}

export function linkIsCompatible(
  type: LinkType,
  source: SoundOrbDocument,
  target: SoundOrbDocument,
): boolean {
  if (source.id === target.id) {
    return false;
  }

  switch (type) {
    case 'kick-pushes-bass':
      return (
        (source.role === 'beat' || source.role === 'percussion')
        && target.role === 'bass'
      );

    case 'pulse-together':
    case 'follow':
      return target.role !== 'texture';

    case 'take-turns':
    case 'copy-movement':
      return true;
  }
}

export function linkTouchesOrb(link: LinkDocument, orbId: string): boolean {
  return link.sourceOrbId === orbId || link.targetOrbId === orbId;
}

export function linkById(
  links: readonly LinkDocument[],
  linkId: string,
): LinkDocument | undefined {
  return links.find((link) => link.id === linkId);
}
