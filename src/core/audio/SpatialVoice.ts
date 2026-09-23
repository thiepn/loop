import { spatialMixForPoint } from '../world/SpatialMapping';
import type { NormalizedPoint } from '../world/SoundOrb';

export class SpatialVoice {
  private readonly gain: GainNode;
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
    this.panner = context.createStereoPanner();

    this.gain.connect(this.panner);
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

  public dispose(): void {
    this.gain.disconnect();
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
