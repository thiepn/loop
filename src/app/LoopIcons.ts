export type LoopIconName =
  | 'play'
  | 'stop'
  | 'add'
  | 'shape'
  | 'motion'
  | 'link'
  | 'magic'
  | 'swap'
  | 'mute'
  | 'sound'
  | 'copy'
  | 'trash'
  | 'effects'
  | 'toys'
  | 'close'
  | 'retry'
  | 'undo'
  | 'record'
  | 'clear'
  | 'check'
  | 'download';

const ICONS: Record<LoopIconName, string> = {
  play: '<path d="m9 7 8 5-8 5Z" fill="currentColor" stroke="none"/>',
  stop: '<rect x="8" y="8" width="8" height="8" rx="1.5" fill="currentColor" stroke="none"/>',
  add: '<path d="M12 5v14M5 12h14"/>',
  shape: '<path d="M5 15c2-6 4 2 7-5s4 4 7-2"/>',
  motion: '<path d="M5 15c2-7 7-7 9-2s3 4 5 1"/><path d="m16 10 3 4-4 2"/>',
  link: '<path d="M9 15 7 17a3 3 0 0 1-4-4l3-3a3 3 0 0 1 4 0M15 9l2-2a3 3 0 0 1 4 4l-3 3a3 3 0 0 1-4 0M8 16l8-8"/>',
  magic: '<path d="m12 3 1.1 3.4L16.5 7.5l-3.4 1.1L12 12l-1.1-3.4-3.4-1.1 3.4-1.1ZM18 13l.8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8Z"/>',
  swap: '<path d="M7 7h11l-3-3M17 17H6l3 3"/>',
  mute: '<path d="M5 10v4h3l4 3V7L8 10Z"/><path d="m16 10 4 4m0-4-4 4"/>',
  sound: '<path d="M5 10v4h3l4 3V7L8 10Z"/><path d="M15 9c1.5 1.5 1.5 4.5 0 6M18 7c3 3 3 7 0 10"/>',
  copy: '<rect x="8" y="8" width="10" height="10" rx="2"/><path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/>',
  trash: '<path d="M5 7h14M9 7V4h6v3M8 10v7m4-7v7m4-7v7M6 7l1 13h10l1-13"/>',
  effects: '<circle cx="12" cy="12" r="6"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
  toys: '<path d="M12 4v16M4 12h16M6.5 6.5l11 11m0-11-11 11"/><circle cx="12" cy="12" r="2"/>',
  close: '<path d="m7 7 10 10M17 7 7 17"/>',
  retry: '<path d="M19 8V4l-2 2a8 8 0 1 0 2 8"/>',
  undo: '<path d="m8 7-4 4 4 4M4 11h9a6 6 0 0 1 6 6"/>',
  record: '<circle cx="12" cy="12" r="5" fill="currentColor" stroke="none"/>',
  clear: '<path d="m5 16 8-10 6 5-7 9H8Z"/><path d="m10 10 6 5"/>',
  check: '<path d="m5 12 4 4 10-10"/>',
  download: '<path d="M12 4v11m-4-4 4 4 4-4M5 20h14"/>',
};

export function loopIcon(name: LoopIconName): string {
  return '<svg class="loop-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
    + ICONS[name]
    + '</svg>';
}
