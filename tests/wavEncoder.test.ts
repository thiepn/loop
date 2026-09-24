import { describe, expect, it } from 'vitest';
import { encodePcm16Wav } from '../src/core/audio/WavEncoder';

function ascii(view: DataView, offset: number, length: number): string {
  return Array.from(
    { length },
    (_, index) => String.fromCharCode(view.getUint8(offset + index)),
  ).join('');
}

describe('WavEncoder', () => {
  it('writes a valid mono PCM16 WAV header', () => {
    const buffer = encodePcm16Wav(
      [new Float32Array([0, 0.5, -0.5, 1])],
      48_000,
    );
    const view = new DataView(buffer);

    expect(ascii(view, 0, 4)).toBe('RIFF');
    expect(ascii(view, 8, 4)).toBe('WAVE');
    expect(ascii(view, 12, 4)).toBe('fmt ');
    expect(ascii(view, 36, 4)).toBe('data');
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(48_000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true)).toBe(8);
    expect(buffer.byteLength).toBe(52);
  });

  it('interleaves stereo channels and calculates byte rate', () => {
    const buffer = encodePcm16Wav(
      [
        new Float32Array([1, 0]),
        new Float32Array([-1, 0.5]),
      ],
      44_100,
    );
    const view = new DataView(buffer);

    expect(view.getUint16(22, true)).toBe(2);
    expect(view.getUint16(32, true)).toBe(4);
    expect(view.getUint32(28, true)).toBe(176_400);
    expect(view.getUint32(40, true)).toBe(8);

    expect(view.getInt16(44, true)).toBe(32_767);
    expect(view.getInt16(46, true)).toBe(-32_768);
  });

  it('clamps samples outside the legal range', () => {
    const buffer = encodePcm16Wav(
      [new Float32Array([2, -2])],
      48_000,
    );
    const view = new DataView(buffer);

    expect(view.getInt16(44, true)).toBe(32_767);
    expect(view.getInt16(46, true)).toBe(-32_768);
  });

  it('rejects mismatched channel lengths and invalid sample rates', () => {
    expect(() => encodePcm16Wav(
      [
        new Float32Array([0]),
        new Float32Array([0, 1]),
      ],
      48_000,
    )).toThrow(/equal length/i);

    expect(() => encodePcm16Wav(
      [new Float32Array([0])],
      0,
    )).toThrow(/sample rate/i);
  });
});
