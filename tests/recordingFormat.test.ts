import { describe, expect, it } from 'vitest';
import {
  chooseRecordingFormat,
  formatForMimeType,
} from '../src/core/audio/RecordingFormat';

describe('RecordingFormat', () => {
  it('prefers WebM Opus when supported', () => {
    const chosen = chooseRecordingFormat(
      (mimeType) => mimeType === 'audio/webm;codecs=opus',
    );

    expect(chosen).toEqual({
      mimeType: 'audio/webm;codecs=opus',
      extension: 'webm',
      label: 'WebM / Opus',
    });
  });

  it('falls through to another browser-supported format', () => {
    const chosen = chooseRecordingFormat(
      (mimeType) => mimeType === 'audio/mp4',
    );

    expect(chosen?.extension).toBe('m4a');
    expect(chosen?.mimeType).toBe('audio/mp4');
  });

  it('returns null when none of the explicit preferences are supported', () => {
    expect(chooseRecordingFormat(() => false)).toBeNull();
  });

  it('derives safe download extensions from browser MIME output', () => {
    expect(formatForMimeType('audio/ogg;codecs=opus').extension).toBe('ogg');
    expect(formatForMimeType('audio/mp4').extension).toBe('m4a');
    expect(formatForMimeType('audio/webm').extension).toBe('webm');
    expect(formatForMimeType('').extension).toBe('webm');
  });
});
