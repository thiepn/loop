export interface PlatformCapabilities {
  readonly audio: boolean;
  readonly webgl2: boolean;
  readonly indexedDb: boolean;
  readonly serviceWorker: boolean;
  readonly pointerEvents: boolean;
}

export function detectCapabilities(): PlatformCapabilities {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      audio: false,
      webgl2: false,
      indexedDb: false,
      serviceWorker: false,
      pointerEvents: false,
    };
  }

  const canvas = document.createElement('canvas');

  return {
    audio: Boolean(window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext),
    webgl2: Boolean(canvas.getContext('webgl2')),
    indexedDb: 'indexedDB' in window,
    serviceWorker: 'serviceWorker' in navigator,
    pointerEvents: 'PointerEvent' in window,
  };
}
