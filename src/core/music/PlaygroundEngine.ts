import { EffectRack } from '../audio/EffectRack';
import { ProceduralInstrument } from '../audio/ProceduralInstrument';
import { SpatialVoice } from '../audio/SpatialVoice';
import { soundById } from '../sounds/coreCatalog';
import {
  effectAmountsAtPoint,
  type EffectFieldDocument,
} from '../world/EffectField';
import type { LinkType } from '../world/Link';
import type { PlaygroundToyDocument } from '../world/PlaygroundToy';
import type { WorldDocument } from '../world/World';
import type { NormalizedPoint, SoundOrbDocument } from '../world/SoundOrb';
import { recommendedVoiceGain } from './MixPolicy';
import {
  applyCopyMovementLinks,
  evaluateMotionFrame,
  type MotionFrame,
} from './MotionEngine';
import { LookaheadScheduler, type ScheduledTick } from './LookaheadScheduler';
import { MusicalTransport } from './MusicalTransport';
import {
  scheduleOrbPattern,
  scheduleReactiveOrbHit,
  type ScheduledOrbEvent,
} from './OrbPattern';
import {
  baseEventAllowedByLinks,
  reactiveLinkTime,
  reactiveLinksFromSource,
  takeTurnsLinkForActivity,
} from './ReactiveLinks';

export interface OrbActivity {
  readonly orbId: string;
  readonly time: number;
  readonly intensity: number;
}

export interface LinkActivity {
  readonly linkId: string;
  readonly type: LinkType;
  readonly sourceOrbId: string;
  readonly targetOrbId: string;
  readonly activeOrbId: string;
  readonly time: number;
  readonly intensity: number;
}

export type OrbActivityListener = (activity: OrbActivity) => void;
export type LinkActivityListener = (activity: LinkActivity) => void;

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
  private readonly linkActivityListeners = new Set<LinkActivityListener>();
  private readonly manualPositionOverrides = new Map<string, NormalizedPoint>();
  private readonly effectFieldPreviewOverrides = new Map<string, EffectFieldDocument>();
  private readonly toyPreviewOverrides = new Map<string, PlaygroundToyDocument>();
  private lastMotionFrame: MotionFrame = new Map();
  private lastMotionTimeSeconds = 0;
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

  public subscribeLinkActivity(listener: LinkActivityListener): () => void {
    this.linkActivityListeners.add(listener);

    return () => {
      this.linkActivityListeners.delete(listener);
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

    const motionFrame = this.lastMotionTimeSeconds > 0
      ? evaluateMotionFrame(world, this.lastMotionTimeSeconds)
      : new Map<string, NormalizedPoint>();

    this.lastMotionFrame = motionFrame;

    const liveIds = new Set(world.soundOrbs.map((orb) => orb.id));

    for (const [orbId, runtime] of this.runtimes) {
      if (!liveIds.has(orbId)) {
        runtime.instrument.stopAll(this.context.currentTime + 0.01);
        runtime.effects.dispose();
        runtime.spatial.dispose();
        this.manualPositionOverrides.delete(orbId);
        this.runtimes.delete(orbId);
      }
    }

    for (const orb of world.soundOrbs) {
      const existing = this.runtimes.get(orb.id);
      const position = this.manualPositionOverrides.get(orb.id)
        ?? motionFrame.get(orb.id)
        ?? orb.position;
      const amounts = effectAmountsAtPoint(this.effectiveEffectFields(), position);

      if (existing) {
        existing.orb = orb;
        existing.spatial.setPosition(position);
        existing.spatial.setMuted(orb.muted);
        existing.effects.setTempo(world.music.bpm);
        existing.effects.setAmounts(amounts);
        continue;
      }

      const spatial = new SpatialVoice(
        this.context,
        this.destination,
        position,
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

  public updateOrbSpatial(
    orbId: string,
    position: NormalizedPoint,
  ): MotionFrame {
    const runtime = this.runtimes.get(orbId);
    this.manualPositionOverrides.set(orbId, position);

    const updates = new Map<string, NormalizedPoint>([
      [orbId, position],
    ]);

    if (runtime) {
      runtime.spatial.setPosition(position);
      runtime.effects.setAmounts(
        effectAmountsAtPoint(this.effectiveEffectFields(), position),
      );
    }

    const copyFrame = new Map<string, NormalizedPoint>();

    for (const orb of this.world.soundOrbs) {
      copyFrame.set(
        orb.id,
        orb.id === orbId
          ? position
          : this.lastMotionFrame.get(orb.id) ?? orb.position,
      );
    }

    applyCopyMovementLinks(this.world, copyFrame);

    for (const link of this.world.links) {
      if (link.type !== 'copy-movement' || link.sourceOrbId !== orbId) {
        continue;
      }

      const copiedPosition = copyFrame.get(link.targetOrbId);
      const targetRuntime = this.runtimes.get(link.targetOrbId);

      if (!copiedPosition) {
        continue;
      }

      updates.set(link.targetOrbId, copiedPosition);

      if (targetRuntime) {
        targetRuntime.spatial.setPosition(copiedPosition);
        targetRuntime.effects.setAmounts(
          effectAmountsAtPoint(
            this.effectiveEffectFields(),
            copiedPosition,
          ),
        );
      }
    }

    return updates;
  }

  public releaseOrbMotionOverride(orbId: string): void {
    this.manualPositionOverrides.delete(orbId);
  }

  public tickMotion(timeSeconds: number): MotionFrame {
    this.lastMotionTimeSeconds = Math.max(0, timeSeconds);
    const computed = evaluateMotionFrame(
      this.worldWithToyPreviews(),
      this.lastMotionTimeSeconds,
    );
    const resolved = new Map<string, NormalizedPoint>();

    for (const orb of this.world.soundOrbs) {
      const position = this.manualPositionOverrides.get(orb.id)
        ?? computed.get(orb.id)
        ?? orb.position;

      resolved.set(orb.id, position);

      const runtime = this.runtimes.get(orb.id);

      if (!runtime) {
        continue;
      }

      runtime.spatial.setPosition(position);
      runtime.effects.setAmounts(
        effectAmountsAtPoint(this.effectiveEffectFields(), position),
      );
    }

    this.lastMotionFrame = resolved;
    return resolved;
  }

  public previewPlaygroundToy(toy: PlaygroundToyDocument): void {
    this.toyPreviewOverrides.set(toy.id, toy);

    if (this.lastMotionTimeSeconds > 0) {
      this.tickMotion(this.lastMotionTimeSeconds);
    }
  }

  public releasePlaygroundToyPreview(toyId: string): void {
    this.toyPreviewOverrides.delete(toyId);
  }

  public previewEffectField(field: EffectFieldDocument): void {
    this.effectFieldPreviewOverrides.set(field.id, field);
    const fields = this.effectiveEffectFields();

    for (const runtime of this.runtimes.values()) {
      const position = this.manualPositionOverrides.get(runtime.orb.id)
        ?? this.lastMotionFrame.get(runtime.orb.id)
        ?? runtime.orb.position;

      runtime.effects.setAmounts(
        effectAmountsAtPoint(fields, position),
      );
    }
  }

  public releaseEffectFieldPreview(fieldId: string): void {
    this.effectFieldPreviewOverrides.delete(fieldId);
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

    this.manualPositionOverrides.clear();
    this.effectFieldPreviewOverrides.clear();
    this.toyPreviewOverrides.clear();
    this.runtimes.clear();
    this.activityListeners.clear();
    this.linkActivityListeners.clear();
  }

  private effectiveEffectFields(): readonly EffectFieldDocument[] {
    if (this.effectFieldPreviewOverrides.size === 0) {
      return this.world.effectFields;
    }

    return this.world.effectFields.map(
      (field) => this.effectFieldPreviewOverrides.get(field.id) ?? field,
    );
  }

  private worldWithToyPreviews(): WorldDocument {
    if (this.toyPreviewOverrides.size === 0) {
      return this.world;
    }

    return {
      ...this.world,
      playgroundToys: this.world.playgroundToys.map(
        (toy) => this.toyPreviewOverrides.get(toy.id) ?? toy,
      ),
    };
  }

  private emitOrbActivity(activity: OrbActivity): void {
    for (const listener of this.activityListeners) {
      listener(activity);
    }
  }

  private emitLinkActivity(activity: LinkActivity): void {
    for (const listener of this.linkActivityListeners) {
      listener(activity);
    }
  }

  private gainForOrb(
    orb: SoundOrbDocument,
    activeCount: number,
  ): number | null {
    const sound = soundById(orb.soundId);

    if (!sound) {
      return null;
    }

    return recommendedVoiceGain(
      sound.nominalDb,
      activeCount,
      roleTrimDb(orb.role),
    );
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
    const baseEvents = new Map<string, ScheduledOrbEvent>();

    for (const orb of this.world.soundOrbs) {
      const runtime = this.runtimes.get(orb.id);
      const sound = soundById(orb.soundId);

      if (
        !runtime
        || !sound
        || orb.muted
        || !baseEventAllowedByLinks(this.world, orb.id, tick)
      ) {
        continue;
      }

      const gain = this.gainForOrb(orb, activeCount);

      if (gain === null) {
        continue;
      }

      const event = scheduleOrbPattern({
        orb,
        sound,
        tick,
        transport: this.transport,
        harmony,
        instrument: runtime.instrument,
        gain,
      });

      if (!event) {
        continue;
      }

      baseEvents.set(orb.id, event);
      this.emitOrbActivity({
        orbId: orb.id,
        time: event.time,
        intensity: event.intensity,
      });

      const takeTurns = takeTurnsLinkForActivity(
        this.world.links,
        orb.id,
      );

      if (takeTurns) {
        this.emitLinkActivity({
          linkId: takeTurns.id,
          type: takeTurns.type,
          sourceOrbId: takeTurns.sourceOrbId,
          targetOrbId: takeTurns.targetOrbId,
          activeOrbId: orb.id,
          time: event.time,
          intensity: event.intensity,
        });
      }
    }

    const reactiveDedupe = new Set<string>();

    for (const [sourceOrbId, sourceEvent] of baseEvents) {
      for (const link of reactiveLinksFromSource(
        this.world.links,
        sourceOrbId,
      )) {
        const target = this.world.soundOrbs.find(
          (orb) => orb.id === link.targetOrbId,
        );
        const targetRuntime = target
          ? this.runtimes.get(target.id)
          : undefined;

        if (!target || !targetRuntime || target.muted) {
          continue;
        }

        const eventTime = reactiveLinkTime(
          link,
          sourceEvent.time,
          this.transport,
        );

        if (link.type === 'kick-pushes-bass') {
          targetRuntime.spatial.schedulePush(
            eventTime,
            Math.max(0.45, sourceEvent.intensity),
          );

          this.emitLinkActivity({
            linkId: link.id,
            type: link.type,
            sourceOrbId: link.sourceOrbId,
            targetOrbId: link.targetOrbId,
            activeOrbId: target.id,
            time: eventTime,
            intensity: sourceEvent.intensity,
          });
          continue;
        }

        const targetSound = soundById(target.soundId);
        const targetGain = this.gainForOrb(target, activeCount);

        if (!targetSound || targetGain === null) {
          continue;
        }

        const dedupeKey = `${target.id}:${Math.round(eventTime * 10000)}`;

        if (reactiveDedupe.has(dedupeKey)) {
          continue;
        }

        reactiveDedupe.add(dedupeKey);

        const stepOffset = link.type === 'follow' ? 1 : 0;
        const targetStep = (tick.stepInBar + stepOffset) % 16;
        const reactiveEvent = scheduleReactiveOrbHit({
          orb: target,
          sound: targetSound,
          time: eventTime,
          step: targetStep,
          transport: this.transport,
          harmony,
          instrument: targetRuntime.instrument,
          gain: targetGain,
          intensity: sourceEvent.intensity,
        });

        if (!reactiveEvent) {
          continue;
        }

        this.emitOrbActivity({
          orbId: target.id,
          time: reactiveEvent.time,
          intensity: reactiveEvent.intensity,
        });

        this.emitLinkActivity({
          linkId: link.id,
          type: link.type,
          sourceOrbId: link.sourceOrbId,
          targetOrbId: link.targetOrbId,
          activeOrbId: target.id,
          time: reactiveEvent.time,
          intensity: reactiveEvent.intensity,
        });
      }
    }
  }
}
