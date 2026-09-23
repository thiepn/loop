import { EffectRack } from '../audio/EffectRack';
import { ProceduralInstrument } from '../audio/ProceduralInstrument';
import { SpatialVoice } from '../audio/SpatialVoice';
import { soundById } from '../sounds/coreCatalog';
import {
  effectAmountsAtPoint,
  type EffectFieldDocument,
} from '../world/EffectField';
import type { WorldDocument } from '../world/World';
import type { NormalizedPoint, SoundOrbDocument } from '../world/SoundOrb';
import { recommendedVoiceGain } from './MixPolicy';
import { LookaheadScheduler, type ScheduledTick } from './LookaheadScheduler';
import { MusicalTransport } from './MusicalTransport';
import { scheduleOrbPattern } from './OrbPattern';

export interface OrbActivity {
  readonly orbId: string;
  readonly time: number;
  readonly intensity: number;
}

export type OrbActivityListener = (activity: OrbActivity) => void;

interface OrbRuntime {
  orb: SoundOrbDocument;
  readonly spatial: SpatialVoice;
  readonly effects: EffectRack;
  readonly instrument: ProceduralInstrument;
}

function roleTrimDb(role: SoundOrbDocument['role']): number {
  switch (role) {
    case 'beat':
      return 1.5;
    case 'bass':
      return 0.8;
    case 'texture':
      return -3;
    case 'percussion':
      return -1;
    case 'harmony':
      return -1.2;
    case 'melody':
      return -0.5;
    case 'voice':
      return -1;
  }
}

export class PlaygroundEngine {
  public readonly transport: MusicalTransport;

  private readonly scheduler: LookaheadScheduler;
  private readonly runtimes = new Map<string, OrbRuntime>();
  private readonly activityListeners = new Set<OrbActivityListener>();
  private world: WorldDocument;
  private unsubscribeTicks: (() => void) | null = null;
  private playing = false;

  public constructor(
    private readonly context: AudioContext,
    private readonly destination: AudioNode,
    world: WorldDocument,
  ) {
    this.world = world;
    this.transport = new MusicalTransport({
      bpm: world.music.bpm,
      beatsPerBar: 4,
    });

    this.scheduler = new LookaheadScheduler(
      () => context.currentTime,
      this.transport,
      {
        intervalMs: 25,
        scheduleAheadSeconds: 0.14,
        stepsPerBeat: 4,
      },
    );

    this.syncWorld(world);
  }

  public get isPlaying(): boolean {
    return this.playing;
  }

  public subscribeActivity(listener: OrbActivityListener): () => void {
    this.activityListeners.add(listener);
    return () => {
      this.activityListeners.delete(listener);
    };
  }

  public start(): void {
    if (this.playing) {
      return;
    }

    const startTime = this.context.currentTime + 0.08;
    this.transport.start(startTime, 0);
    this.unsubscribeTicks = this.scheduler.subscribe((tick) => this.scheduleTick(tick));
    this.scheduler.start();
    this.playing = true;
  }

  public stop(): void {
    if (!this.playing) {
      return;
    }

    this.scheduler.stop();
    this.unsubscribeTicks?.();
    this.unsubscribeTicks = null;

    for (const runtime of this.runtimes.values()) {
      runtime.instrument.stopAll(this.context.currentTime + 0.015);
    }

    this.transport.stop(this.context.currentTime);
    this.playing = false;
  }

  public syncWorld(world: WorldDocument): void {
    const bpmChanged = world.music.bpm !== this.transport.bpm;
    this.world = world;

    if (bpmChanged) {
      this.transport.setBpm(world.music.bpm, this.context.currentTime);
    }

    const liveIds = new Set(world.soundOrbs.map((orb) => orb.id));

    for (const [orbId, runtime] of this.runtimes) {
      if (!liveIds.has(orbId)) {
        runtime.instrument.stopAll(this.context.currentTime + 0.01);
        runtime.effects.dispose();
        runtime.spatial.dispose();
        this.runtimes.delete(orbId);
      }
    }

    for (const orb of world.soundOrbs) {
      const existing = this.runtimes.get(orb.id);
      const amounts = effectAmountsAtPoint(world.effectFields, orb.position);

      if (existing) {
        existing.orb = orb;
        existing.spatial.setPosition(orb.position);
        existing.spatial.setMuted(orb.muted);
        existing.effects.setTempo(world.music.bpm);
        existing.effects.setAmounts(amounts);
        continue;
      }

      const spatial = new SpatialVoice(
        this.context,
        this.destination,
        orb.position,
        orb.muted,
      );

      const effects = new EffectRack(
        this.context,
        spatial.input,
        world.music.bpm,
      );
      effects.setAmounts(amounts, true);

      this.runtimes.set(orb.id, {
        orb,
        spatial,
        effects,
        instrument: new ProceduralInstrument(this.context, effects.input),
      });
    }
  }

  public updateOrbSpatial(orbId: string, position: NormalizedPoint): void {
    const runtime = this.runtimes.get(orbId);

    if (!runtime) {
      return;
    }

    runtime.spatial.setPosition(position);
    runtime.effects.setAmounts(
      effectAmountsAtPoint(this.world.effectFields, position),
    );
  }

  public previewEffectField(field: EffectFieldDocument): void {
    const fields = this.world.effectFields.some((candidate) => candidate.id === field.id)
      ? this.world.effectFields.map((candidate) => candidate.id === field.id ? field : candidate)
      : [...this.world.effectFields, field];

    for (const runtime of this.runtimes.values()) {
      runtime.effects.setAmounts(
        effectAmountsAtPoint(fields, runtime.orb.position),
      );
    }
  }

  public setOrbMuted(orbId: string, muted: boolean): void {
    const runtime = this.runtimes.get(orbId);
    if (!runtime) {
      return;
    }

    runtime.orb = {
      ...runtime.orb,
      muted,
    };
    runtime.spatial.setMuted(muted);
  }

  public dispose(): void {
    this.stop();

    for (const runtime of this.runtimes.values()) {
      runtime.instrument.stopAll();
      runtime.effects.dispose();
      runtime.spatial.dispose();
    }

    this.runtimes.clear();
    this.activityListeners.clear();
  }

  private scheduleTick(tick: ScheduledTick): void {
    const activeCount = Math.max(
      1,
      this.world.soundOrbs.filter((orb) => !orb.muted).length,
    );

    const harmony = {
      tonic: this.world.music.tonic,
      scale: this.world.music.scale,
    } as const;

    for (const orb of this.world.soundOrbs) {
      const runtime = this.runtimes.get(orb.id);
      const sound = soundById(orb.soundId);

      if (!runtime || !sound || orb.muted) {
        continue;
      }

      const gain = recommendedVoiceGain(
        sound.nominalDb,
        activeCount,
        roleTrimDb(orb.role),
      );

      const intensity = scheduleOrbPattern({
        orb,
        sound,
        tick,
        transport: this.transport,
        harmony,
        instrument: runtime.instrument,
        gain,
      });

      if (intensity === null) {
        continue;
      }

      for (const listener of this.activityListeners) {
        listener({
          orbId: orb.id,
          time: tick.time,
          intensity,
        });
      }
    }
  }
}
