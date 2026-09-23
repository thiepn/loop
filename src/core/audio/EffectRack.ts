import type { EffectAmounts } from '../world/EffectField';

function saturationCurve(): Float32Array<ArrayBuffer> {
  const size = 1024;
  const curve = new Float32Array(
    new ArrayBuffer(size * Float32Array.BYTES_PER_ELEMENT),
  );

  for (let index = 0; index < size; index += 1) {
    const x = (index / (size - 1)) * 2 - 1;
    curve[index] = Math.tanh(x * 2.4);
  }

  return curve;
}

function smooth(
  param: AudioParam,
  value: number,
  now: number,
  timeConstant = 0.025,
): void {
  param.cancelScheduledValues(now);
  param.setTargetAtTime(value, now, timeConstant);
}

export class EffectRack {
  private readonly inputNode: GainNode;
  private readonly outputNode: GainNode;

  private readonly filterNode: BiquadFilterNode;

  private readonly heatDry: GainNode;
  private readonly heatWet: GainNode;
  private readonly heatShaper: WaveShaperNode;
  private readonly heatSum: GainNode;

  private readonly frostDry: GainNode;
  private readonly frostWet: GainNode;
  private readonly frostDelay: DelayNode;
  private readonly frostFilter: BiquadFilterNode;
  private readonly frostFeedback: GainNode;
  private readonly frostSum: GainNode;

  private readonly echoDry: GainNode;
  private readonly echoWet: GainNode;
  private readonly echoDelay: DelayNode;
  private readonly echoFilter: BiquadFilterNode;
  private readonly echoFeedback: GainNode;
  private readonly echoSum: GainNode;

  private readonly spaceDry: GainNode;
  private readonly spaceDelayA: DelayNode;
  private readonly spaceDelayB: DelayNode;
  private readonly spaceFilterA: BiquadFilterNode;
  private readonly spaceFilterB: BiquadFilterNode;
  private readonly spaceWetA: GainNode;
  private readonly spaceWetB: GainNode;
  private readonly spaceFeedbackA: GainNode;
  private readonly spaceFeedbackB: GainNode;

  private bpm: number;

  public constructor(
    private readonly context: AudioContext,
    destination: AudioNode,
    bpm: number,
  ) {
    this.bpm = bpm;

    this.inputNode = context.createGain();
    this.outputNode = context.createGain();

    this.filterNode = context.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 18000;
    this.filterNode.Q.value = 0.55;

    this.heatDry = context.createGain();
    this.heatWet = context.createGain();
    this.heatShaper = context.createWaveShaper();
    this.heatShaper.curve = saturationCurve();
    this.heatShaper.oversample = '2x';
    this.heatSum = context.createGain();

    this.frostDry = context.createGain();
    this.frostWet = context.createGain();
    this.frostDelay = context.createDelay(0.2);
    this.frostDelay.delayTime.value = 0.036;
    this.frostFilter = context.createBiquadFilter();
    this.frostFilter.type = 'bandpass';
    this.frostFilter.frequency.value = 3600;
    this.frostFilter.Q.value = 4.4;
    this.frostFeedback = context.createGain();
    this.frostFeedback.gain.value = 0;
    this.frostSum = context.createGain();

    this.echoDry = context.createGain();
    this.echoWet = context.createGain();
    this.echoDelay = context.createDelay(2);
    this.echoFilter = context.createBiquadFilter();
    this.echoFilter.type = 'lowpass';
    this.echoFilter.frequency.value = 5200;
    this.echoFilter.Q.value = 0.5;
    this.echoFeedback = context.createGain();
    this.echoFeedback.gain.value = 0;
    this.echoSum = context.createGain();

    this.spaceDry = context.createGain();
    this.spaceDelayA = context.createDelay(0.4);
    this.spaceDelayB = context.createDelay(0.4);
    this.spaceDelayA.delayTime.value = 0.071;
    this.spaceDelayB.delayTime.value = 0.113;
    this.spaceFilterA = context.createBiquadFilter();
    this.spaceFilterB = context.createBiquadFilter();
    this.spaceFilterA.type = 'lowpass';
    this.spaceFilterB.type = 'lowpass';
    this.spaceFilterA.frequency.value = 3900;
    this.spaceFilterB.frequency.value = 3200;
    this.spaceWetA = context.createGain();
    this.spaceWetB = context.createGain();
    this.spaceFeedbackA = context.createGain();
    this.spaceFeedbackB = context.createGain();

    this.inputNode.connect(this.filterNode);

    this.filterNode.connect(this.heatDry);
    this.filterNode.connect(this.heatShaper);
    this.heatShaper.connect(this.heatWet);
    this.heatDry.connect(this.heatSum);
    this.heatWet.connect(this.heatSum);

    this.heatSum.connect(this.frostDry);
    this.heatSum.connect(this.frostDelay);
    this.frostDelay.connect(this.frostFilter);
    this.frostFilter.connect(this.frostWet);
    this.frostFilter.connect(this.frostFeedback);
    this.frostFeedback.connect(this.frostDelay);
    this.frostDry.connect(this.frostSum);
    this.frostWet.connect(this.frostSum);

    this.frostSum.connect(this.echoDry);
    this.frostSum.connect(this.echoDelay);
    this.echoDelay.connect(this.echoWet);
    this.echoDelay.connect(this.echoFilter);
    this.echoFilter.connect(this.echoFeedback);
    this.echoFeedback.connect(this.echoDelay);
    this.echoDry.connect(this.echoSum);
    this.echoWet.connect(this.echoSum);

    this.echoSum.connect(this.spaceDry);
    this.spaceDry.connect(this.outputNode);

    this.echoSum.connect(this.spaceDelayA);
    this.spaceDelayA.connect(this.spaceFilterA);
    this.spaceFilterA.connect(this.spaceWetA);
    this.spaceWetA.connect(this.outputNode);
    this.spaceFilterA.connect(this.spaceFeedbackA);
    this.spaceFeedbackA.connect(this.spaceDelayA);

    this.echoSum.connect(this.spaceDelayB);
    this.spaceDelayB.connect(this.spaceFilterB);
    this.spaceFilterB.connect(this.spaceWetB);
    this.spaceWetB.connect(this.outputNode);
    this.spaceFilterB.connect(this.spaceFeedbackB);
    this.spaceFeedbackB.connect(this.spaceDelayB);

    this.outputNode.connect(destination);

    this.setTempo(bpm);
    this.setAmounts({
      space: 0,
      echo: 0,
      heat: 0,
      frost: 0,
      filter: 0,
    }, true);
  }

  public get input(): AudioNode {
    return this.inputNode;
  }

  public setTempo(bpm: number): void {
    this.bpm = Math.max(40, Math.min(220, bpm));
    const beatSeconds = 60 / this.bpm;
    const now = this.context.currentTime;

    smooth(this.echoDelay.delayTime, beatSeconds * 0.75, now, 0.04);
  }

  public setAmounts(amounts: EffectAmounts, immediate = false): void {
    const now = this.context.currentTime;
    const timeConstant = immediate ? 0.001 : 0.025;

    const filterAmount = Math.max(0, Math.min(1, amounts.filter));
    const cutoff = 18000 * (650 / 18000) ** filterAmount;
    smooth(this.filterNode.frequency, cutoff, now, timeConstant);
    smooth(this.filterNode.Q, 0.55 + filterAmount * 1.4, now, timeConstant);

    const heat = Math.max(0, Math.min(1, amounts.heat));
    smooth(this.heatDry.gain, 1 - heat * 0.16, now, timeConstant);
    smooth(this.heatWet.gain, heat * 0.62, now, timeConstant);

    const frost = Math.max(0, Math.min(1, amounts.frost));
    smooth(this.frostDry.gain, 1 - frost * 0.15, now, timeConstant);
    smooth(this.frostWet.gain, frost * 0.52, now, timeConstant);
    smooth(this.frostFeedback.gain, frost * 0.38, now, timeConstant);
    smooth(this.frostDelay.delayTime, 0.026 + frost * 0.024, now, timeConstant);
    smooth(this.frostFilter.frequency, 2800 + frost * 2200, now, timeConstant);

    const echo = Math.max(0, Math.min(1, amounts.echo));
    smooth(this.echoDry.gain, 1, now, timeConstant);
    smooth(this.echoWet.gain, echo * 0.5, now, timeConstant);
    smooth(this.echoFeedback.gain, echo * 0.4, now, timeConstant);

    const space = Math.max(0, Math.min(1, amounts.space));
    smooth(this.spaceDry.gain, 1 - space * 0.08, now, timeConstant);
    smooth(this.spaceWetA.gain, space * 0.31, now, timeConstant);
    smooth(this.spaceWetB.gain, space * 0.27, now, timeConstant);
    smooth(this.spaceFeedbackA.gain, space * 0.24, now, timeConstant);
    smooth(this.spaceFeedbackB.gain, space * 0.2, now, timeConstant);
  }

  public dispose(): void {
    const nodes: AudioNode[] = [
      this.inputNode,
      this.outputNode,
      this.filterNode,
      this.heatDry,
      this.heatWet,
      this.heatShaper,
      this.heatSum,
      this.frostDry,
      this.frostWet,
      this.frostDelay,
      this.frostFilter,
      this.frostFeedback,
      this.frostSum,
      this.echoDry,
      this.echoWet,
      this.echoDelay,
      this.echoFilter,
      this.echoFeedback,
      this.echoSum,
      this.spaceDry,
      this.spaceDelayA,
      this.spaceDelayB,
      this.spaceFilterA,
      this.spaceFilterB,
      this.spaceWetA,
      this.spaceWetB,
      this.spaceFeedbackA,
      this.spaceFeedbackB,
    ];

    for (const node of nodes) {
      node.disconnect();
    }
  }
}
