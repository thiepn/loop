import { spatialMixForPoint } from '../world/SpatialMapping';
import type { NormalizedPoint } from '../world/SoundOrb';

export class SpatialVoice {
  private readonly gain: GainNode;
  private readonly reactiveGain: GainNode;
  private readonly panner: StereoPannerNode;
  private position: NormalizedPoint;
  private muted: boolean;

  public constructor(
    private readonly context: AudioContext,
    destination: AudioNode,
    position: NormalizedPoint,
    muted = false,
  ) {
    this.position = position;
    this.muted = muted;

    this.gain = context.createGain();
    this.reactiveGain = context.createGain();
    this.reactiveGain.gain.value = 1;
    this.panner = context.createStereoPanner();

    this.gain.connect(this.reactiveGain);
    this.reactiveGain.connect(this.panner);
    this.panner.connect(destination);

    this.applySpatialState(context.currentTime, true);
  }

  public get input(): AudioNode {
    return this.gain;
  }

  public setPosition(position: NormalizedPoint, immediate = false): void {
    this.position = position;
    this.applySpatialState(this.context.currentTime, immediate);
  }

  public setMuted(muted: boolean, immediate = false): void {
    this.muted = muted;
    this.applySpatialState(this.context.currentTime, immediate);
  }

  public schedulePush(time: number, intensity = 1): void {
    const amount = Math.max(0, Math.min(1, intensity));
    const start = Math.max(time, this.context.currentTime + 0.001);
    const minimum = 1 - amount * 0.58;

    this.reactiveGain.gain.cancelScheduledValues(start);
    this.reactiveGain.gain.setValueAtTime(1, start);
    this.reactiveGain.gain.linearRampToValueAtTime(minimum, start + 0.012);
    this.reactiveGain.gain.exponentialRampToValueAtTime(1, start + 0.22);
  }

  public dispose(): void {
    this.gain.disconnect();
    this.reactiveGain.disconnect();
    this.panner.disconnect();
  }

  private applySpatialState(now: number, immediate: boolean): void {
    const mix = spatialMixForPoint(this.position);
    const targetGain = this.muted ? 0 : mix.presence;

    this.gain.gain.cancelScheduledValues(now);
    this.panner.pan.cancelScheduledValues(now);

    if (immediate) {
      this.gain.gain.setValueAtTime(targetGain, now);
      this.panner.pan.setValueAtTime(mix.pan, now);
      return;
    }

    this.gain.gain.setTargetAtTime(targetGain, now, 0.018);
    this.panner.pan.setTargetAtTime(mix.pan, now, 0.022);
  }
}
