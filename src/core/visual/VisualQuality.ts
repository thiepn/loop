export type VisualQuality =
  | 'high'
  | 'balanced'
  | 'battery';

export interface VisualPreferences {
  readonly quality: VisualQuality;
  readonly reduceMotion: boolean;
  readonly reduceParticles: boolean;
  readonly reduceBloom: boolean;
}

export interface VisualQualityProfile {
  readonly ambientParticleCount: number;
  readonly burstParticleCount: number;
  readonly trailPointLimit: number;
  readonly trailLifetimeMs: number;
  readonly bloomScale: number;
  readonly animateAmbient: boolean;
  readonly animateTrails: boolean;
}

export interface VisualEnvironmentHints {
  readonly hardwareConcurrency?: number;
  readonly deviceMemoryGb?: number;
  readonly saveData?: boolean;
  readonly prefersReducedMotion?: boolean;
}

const STORAGE_KEY = 'loop.visual-preferences.v1';

export const DEFAULT_VISUAL_PREFERENCES: VisualPreferences = {
  quality: 'balanced',
  reduceMotion: false,
  reduceParticles: false,
  reduceBloom: false,
};

export function chooseAutomaticVisualQuality(
  hints: VisualEnvironmentHints,
): VisualQuality {
  if (hints.saveData) {
    return 'battery';
  }

  const cores = hints.hardwareConcurrency ?? 6;
  const memory = hints.deviceMemoryGb ?? 6;

  if (cores <= 4 || memory <= 4) {
    return 'battery';
  }

  if (cores >= 8 && memory >= 8) {
    return 'high';
  }

  return 'balanced';
}

export function initialVisualPreferences(
  hints: VisualEnvironmentHints,
): VisualPreferences {
  const reduceMotion = Boolean(hints.prefersReducedMotion);

  return {
    quality: chooseAutomaticVisualQuality(hints),
    reduceMotion,
    reduceParticles: reduceMotion,
    reduceBloom: false,
  };
}

export function profileForVisualPreferences(
  preferences: VisualPreferences,
): VisualQualityProfile {
  const base: VisualQualityProfile = (() => {
    switch (preferences.quality) {
      case 'high':
        return {
          ambientParticleCount: 28,
          burstParticleCount: 9,
          trailPointLimit: 18,
          trailLifetimeMs: 1200,
          bloomScale: 1,
          animateAmbient: true,
          animateTrails: true,
        };

      case 'balanced':
        return {
          ambientParticleCount: 14,
          burstParticleCount: 5,
          trailPointLimit: 10,
          trailLifetimeMs: 800,
          bloomScale: 0.74,
          animateAmbient: true,
          animateTrails: true,
        };

      case 'battery':
        return {
          ambientParticleCount: 5,
          burstParticleCount: 2,
          trailPointLimit: 4,
          trailLifetimeMs: 450,
          bloomScale: 0.38,
          animateAmbient: false,
          animateTrails: false,
        };
    }
  })();

  let profile = base;

  if (preferences.reduceMotion) {
    profile = {
      ...profile,
      ambientParticleCount: Math.min(3, profile.ambientParticleCount),
      burstParticleCount: Math.min(1, profile.burstParticleCount),
      trailPointLimit: 0,
      trailLifetimeMs: 0,
      animateAmbient: false,
      animateTrails: false,
    };
  }

  if (preferences.reduceParticles) {
    profile = {
      ...profile,
      ambientParticleCount: 0,
      burstParticleCount: 0,
    };
  }

  if (preferences.reduceBloom) {
    profile = {
      ...profile,
      bloomScale: Math.min(0.3, profile.bloomScale),
    };
  }

  return profile;
}

export function readBrowserVisualHints(): VisualEnvironmentHints {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {};
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: {
      saveData?: boolean;
    };
  };

  return {
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemoryGb: nav.deviceMemory,
    saveData: nav.connection?.saveData,
    prefersReducedMotion: window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches ?? false,
  };
}

function isVisualQuality(value: unknown): value is VisualQuality {
  return value === 'high'
    || value === 'balanced'
    || value === 'battery';
}

export function loadVisualPreferences(): VisualPreferences {
  const fallback = initialVisualPreferences(
    readBrowserVisualHints(),
  );

  if (typeof localStorage === 'undefined') {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as Partial<VisualPreferences>;

    return {
      quality: isVisualQuality(parsed.quality)
        ? parsed.quality
        : fallback.quality,
      reduceMotion: typeof parsed.reduceMotion === 'boolean'
        ? parsed.reduceMotion
        : fallback.reduceMotion,
      reduceParticles: typeof parsed.reduceParticles === 'boolean'
        ? parsed.reduceParticles
        : fallback.reduceParticles,
      reduceBloom: typeof parsed.reduceBloom === 'boolean'
        ? parsed.reduceBloom
        : fallback.reduceBloom,
    };
  } catch {
    return fallback;
  }
}

export function saveVisualPreferences(
  preferences: VisualPreferences,
): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(preferences),
    );
  } catch {
    // Visual preferences are optional and must never block the app.
  }
}
