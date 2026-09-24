function clampSample(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

function writeAscii(
  view: DataView,
  offset: number,
  value: string,
): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

export function encodePcm16Wav(
  channels: readonly Float32Array[],
  sampleRate: number,
): ArrayBuffer {
  if (channels.length === 0) {
    throw new Error('WAV export requires at least one channel.');
  }

  if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
    throw new Error('WAV export requires a valid sample rate.');
  }

  const frameCount = channels[0]?.length ?? 0;

  for (const channel of channels) {
    if (channel.length !== frameCount) {
      throw new Error('All WAV channels must have equal length.');
    }
  }

  const channelCount = channels.length;
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const dataSize = frameCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, Math.round(sampleRate), true);
  view.setUint32(
    28,
    Math.round(sampleRate) * blockAlign,
    true,
  );
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;

  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      const sample = clampSample(
        channels[channelIndex]?.[frame] ?? 0,
      );
      const intSample = sample < 0
        ? Math.round(sample * 0x8000)
        : Math.round(sample * 0x7fff);

      view.setInt16(offset, intSample, true);
      offset += bytesPerSample;
    }
  }

  return buffer;
}

export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const channels: Float32Array[] = [];

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    channels.push(buffer.getChannelData(channel));
  }

  return new Blob(
    [encodePcm16Wav(channels, buffer.sampleRate)],
    { type: 'audio/wav' },
  );
}
