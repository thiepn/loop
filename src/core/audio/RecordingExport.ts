import { audioBufferToWavBlob } from './WavEncoder';

export async function convertRecordingToWav(
  context: BaseAudioContext,
  blob: Blob,
): Promise<Blob | null> {
  try {
    const bytes = await blob.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(bytes.slice(0));
    return audioBufferToWavBlob(audioBuffer);
  } catch {
    return null;
  }
}
