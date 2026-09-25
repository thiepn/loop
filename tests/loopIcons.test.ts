import { describe, expect, it } from 'vitest';
import {
  loopIcon,
  type LoopIconName,
} from '../src/app/LoopIcons';

const ICONS: readonly LoopIconName[] = [
  'play',
  'stop',
  'add',
  'shape',
  'motion',
  'link',
  'magic',
  'swap',
  'mute',
  'sound',
  'copy',
  'trash',
  'effects',
  'toys',
  'close',
  'retry',
  'undo',
  'record',
  'clear',
  'check',
  'download',
];

describe('Loop Visual V2 iconography', () => {
  it('renders every chrome icon through one accessible SVG primitive', () => {
    for (const name of ICONS) {
      const icon = loopIcon(name);

      expect(icon).toContain('<svg');
      expect(icon).toContain('class="loop-icon"');
      expect(icon).toContain('aria-hidden="true"');
      expect(icon).toContain('viewBox="0 0 24 24"');
      expect(icon).toContain('</svg>');
    }
  });

  it('keeps all icon names visually non-empty and bounded', () => {
    for (const name of ICONS) {
      const icon = loopIcon(name);

      expect(icon.length).toBeGreaterThan(120);
      expect(icon.length).toBeLessThan(700);
      expect(icon).toMatch(/<(path|rect|circle)/);
    }
  });

  it('keeps semantic state icons distinct', () => {
    expect(loopIcon('play')).not.toBe(loopIcon('stop'));
    expect(loopIcon('mute')).not.toBe(loopIcon('sound'));
    expect(loopIcon('record')).not.toBe(loopIcon('stop'));
    expect(loopIcon('magic')).not.toBe(loopIcon('retry'));
  });

  it('does not place text labels inside decorative icon SVGs', () => {
    for (const name of ICONS) {
      const icon = loopIcon(name);

      expect(icon).not.toContain('<text');
      expect(icon).not.toContain('role="img"');
      expect(icon).not.toContain('aria-label');
    }
  });
});
