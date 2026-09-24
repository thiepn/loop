import { describe, expect, it } from 'vitest';
import { LookaheadScheduler } from '../src/core/music/LookaheadScheduler';
import { MusicalTransport } from '../src/core/music/MusicalTransport';

describe('LookaheadScheduler', () => {
  it('emits sixteenth-note ticks ahead of audio time without duplicates', () => {
    let now = 1;
    const transport = new MusicalTransport({ bpm: 120, beatsPerBar: 4 });
    transport.start(1, 0);

    const scheduler = new LookaheadScheduler(
      () => now,
      transport,
      {
        scheduleAheadSeconds: 0.3,
        stepsPerBeat: 4,
      },
    );

    const times: number[] = [];
    scheduler.subscribe((tick) => {
      times.push(tick.time);
    });

    scheduler.pulse();
    expect(times).toHaveLength(3);
    expect(times[0]).toBeCloseTo(1);
    expect(times[1]).toBeCloseTo(1.125);
    expect(times[2]).toBeCloseTo(1.25);

    now = 1.2;
    scheduler.pulse();

    expect(times).toEqual([...new Set(times)]);
    expect(times.some((time) => Math.abs(time - 1.375) < 1e-8)).toBe(true);
  });

  it('never emits stale ticks after a shorter scheduler gap', () => {
    let now = 0;
    const transport = new MusicalTransport({ bpm: 120 });
    transport.start(0, 0);

    const scheduler = new LookaheadScheduler(
      () => now,
      transport,
      {
        scheduleAheadSeconds: 0.1,
        stepsPerBeat: 4,
      },
    );

    const times: number[] = [];
    scheduler.subscribe((tick) => times.push(tick.time));

    scheduler.pulse();
    const beforeGap = times.length;

    now = 0.55;
    scheduler.pulse();

    expect(times.slice(beforeGap).every(
      (time) => time >= now - 0.002,
    )).toBe(true);
  });

  it('resynchronizes after a long main-thread gap instead of bursting old ticks', () => {
    let now = 0;
    const transport = new MusicalTransport({ bpm: 120 });
    transport.start(0, 0);

    const scheduler = new LookaheadScheduler(
      () => now,
      transport,
      {
        scheduleAheadSeconds: 0.1,
        stepsPerBeat: 4,
      },
    );

    const steps: number[] = [];
    scheduler.subscribe((tick) => steps.push(tick.absoluteStep));

    scheduler.pulse();
    now = 5;
    scheduler.pulse();

    expect(Math.min(...steps.slice(1))).toBeGreaterThanOrEqual(40);
  });
});
