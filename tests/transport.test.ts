import { describe, expect, it } from 'vitest';
import { MusicalTransport } from '../src/core/music/MusicalTransport';

describe('MusicalTransport', () => {
  it('converts audio time to stable musical position', () => {
    const transport = new MusicalTransport({ bpm: 120, beatsPerBar: 4 });
    transport.start(10, 0);

    expect(transport.beatAt(10)).toBe(0);
    expect(transport.beatAt(11)).toBeCloseTo(2);

    expect(transport.positionAt(12.25)).toEqual({
      absoluteBeat: 4.5,
      bar: 1,
      beatInBar: 0,
      phaseInBeat: 0.5,
    });
  });

  it('finds future quantization boundaries', () => {
    const transport = new MusicalTransport({ bpm: 120 });
    transport.start(5, 0);

    expect(transport.nextQuantizedTime(5.01, 'quarter')).toBeCloseTo(5.5);
    expect(transport.nextQuantizedTime(5.51, 'bar')).toBeCloseTo(7);
  });

  it('preserves musical position when tempo changes', () => {
    const transport = new MusicalTransport({ bpm: 120 });
    transport.start(0, 0);

    transport.setBpm(60, 1);

    expect(transport.beatAt(1)).toBeCloseTo(2);
    expect(transport.beatAt(2)).toBeCloseTo(3);
  });

  it('preserves the paused beat when restarted later', () => {
    const transport = new MusicalTransport({ bpm: 120 });
    transport.start(0, 0);

    transport.stop(1.25);
    expect(transport.beatAt(10)).toBeCloseTo(2.5);

    const pausedBeat = transport.beatAt(10);
    transport.start(10.5, pausedBeat);

    expect(transport.beatAt(10.5)).toBeCloseTo(2.5);
    expect(transport.beatAt(11)).toBeCloseTo(3.5);
  });

  it('clamps extreme tempos to the supported range', () => {
    const fast = new MusicalTransport({ bpm: 999 });
    const slow = new MusicalTransport({ bpm: 1 });

    expect(fast.bpm).toBe(220);
    expect(slow.bpm).toBe(40);
  });
});
