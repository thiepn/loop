export interface RecordingFormat {
  readonly mimeType: string;
  readonly extension: string;
  readonly label: string;
}

const CANDIDATES: readonly RecordingFormat[] = [
  {
    mimeType: 'audio/webm;codecs=opus',
    extension: 'webm',
    label: 'WebM audio',
  },
  {
    mimeType: 'audio/ogg;codecs=opus',
    extension: 'ogg',
    label: 'Ogg audio',
  },
  {
    mimeType: 'audio/mp4',
    extension: 'm4a',
    label: 'MPEG-4 audio',
  },
  {
    mimeType: 'audio/webm',
    extension: 'webm',
    label: 'WebM audio',
  },
  {
    mimeType: 'audio/ogg',
    extension: 'ogg',
    label: 'Ogg audio',
  },
];

export function formatForMimeType(mimeType: string): RecordingFormat {
  const normalized = mimeType.toLowerCase();

  if (normalized.includes('ogg')) {
    return {
      mimeType,
      extension: 'ogg',
      label: 'Ogg audio',
    };
  }

  if (normalized.includes('mp4') || normalized.includes('aac')) {
    return {
      mimeType,
      extension: 'm4a',
      label: 'MPEG-4 audio',
    };
  }

  if (normalized.includes('webm')) {
    return {
      mimeType,
      extension: 'webm',
      label: 'WebM audio',
    };
  }

  return {
    mimeType: mimeType || 'audio/webm',
    extension: 'webm',
    label: 'Audio file',
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
