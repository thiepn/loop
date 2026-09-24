export interface RecordingFormat {
  readonly mimeType: string;
  readonly extension: string;
  readonly label: string;
}

const CANDIDATES: readonly RecordingFormat[] = [
  {
    mimeType: 'audio/webm;codecs=opus',
    extension: 'webm',
    label: 'WebM / Opus',
  },
  {
    mimeType: 'audio/ogg;codecs=opus',
    extension: 'ogg',
    label: 'Ogg / Opus',
  },
  {
    mimeType: 'audio/mp4',
    extension: 'm4a',
    label: 'MPEG-4 Audio',
  },
  {
    mimeType: 'audio/webm',
    extension: 'webm',
    label: 'WebM Audio',
  },
  {
    mimeType: 'audio/ogg',
    extension: 'ogg',
    label: 'Ogg Audio',
  },
];

export function formatForMimeType(mimeType: string): RecordingFormat {
  const normalized = mimeType.toLowerCase();

  if (normalized.includes('ogg')) {
    return {
      mimeType,
      extension: 'ogg',
      label: 'Ogg Audio',
    };
  }

  if (normalized.includes('mp4') || normalized.includes('aac')) {
    return {
      mimeType,
      extension: 'm4a',
      label: 'MPEG-4 Audio',
    };
  }

  if (normalized.includes('webm')) {
    return {
      mimeType,
      extension: 'webm',
      label: 'WebM Audio',
    };
  }

  return {
    mimeType: mimeType || 'audio/webm',
    extension: 'webm',
    label: 'Browser Audio',
  };
}

export function chooseRecordingFormat(
  support: (mimeType: string) => boolean,
): RecordingFormat | null {
  for (const candidate of CANDIDATES) {
    if (support(candidate.mimeType)) {
      return candidate;
    }
  }

  return null;
}
