import type { VisualPreferences } from '../VisualQuality';
import type { SoundRole } from '../../sounds/SoundDefinition';
import type {
  RenderEventSample,
  RenderScene,
} from './RenderTypes';

export interface ChoreographyFrame {
  readonly wake: number;
  readonly settle: number;
  readonly downbeat: number;
  readonly simultaneous: number;
  readonly phraseBuild: number;
  readonly phraseRelease: number;
  readonly silence: number;
  readonly reentry: number;
  readonly pressure: number;
  readonly pressurePhase: number;
  readonly bassCompression: number;
  readonly harmonyBloom: number;
  readonly roleSpread: number;
  readonly density: number;
  readonly recordStart: number;
  readonly recordStop: number;
}

export interface ObjectChoreographyEmphasis {
  readonly wake: number;
  readonly settle: number;
  readonly downbeat: number;
  readonly phrase: number;
  readonly reentry: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function fade(progress: number, power = 1.5): number {
  return Math.pow(
    Math.max(0, 1 - progress),
    power,
  );
}

function activeRole(
  scene: Readonly<RenderScene>,
  orbId: string,
): SoundRole | null {
  return scene.orbs.find(
    (orb) => orb.id === orbId,
  )?.role ?? null;
}

export function deriveChoreographyFrame(
  scene: Readonly<RenderScene>,
  samples: readonly RenderEventSample[],
  preferences: Readonly<VisualPreferences>,
): ChoreographyFrame {
  let wake = 0;
  let settle = 0;
  let downbeat = 0;
  let simultaneous = 0;
  let phraseBuild = 0;
  let phraseRelease = 0;
  let silence = 0;
  let reentry = 0;
  let pressure = 0;
  let pressurePhase = 0;
  let bassCompression = 0;
  let harmonyBloom = 0;
  let recordStart = 0;
  let recordStop = 0;
  let density = scene.orbs.length > 0
    ? scene.orbs.filter((orb) => !orb.muted).length / 12
    : 0;
  const roles = new Set<SoundRole>();

  for (const sample of samples) {
    const event = sample.event;

    if (event.kind === 'choreography-state') {
      const envelope = fade(sample.progress, 1.25)
        * event.intensity;

      switch (event.cue) {
        case 'play':
          wake = Math.max(wake, envelope);
          break;
        case 'stop':
          settle = Math.max(settle, envelope);
          break;
        case 'record-start':
          recordStart = Math.max(recordStart, envelope);
          break;
        case 'record-stop':
          recordStop = Math.max(recordStop, envelope);
          break;
      }
      continue;
    }

    if (event.kind === 'choreography-bar') {
      density = Math.max(density, event.density);

      if (event.phrasePosition === 3) {
        phraseBuild = Math.max(
          phraseBuild,
          clamp01(sample.progress)
          * (0.5 + event.density * 0.5),
        );
      }

      if (
        event.phrasePosition === 0
        && event.bar > 0
      ) {
        phraseRelease = Math.max(
          phraseRelease,
          fade(sample.progress, 1.1)
          * (0.58 + event.density * 0.42),
        );
      }

      if (event.silent) {
        silence = Math.max(
          silence,
          0.52 + sample.progress * 0.48,
        );
      }
      continue;
    }

    if (event.kind === 'choreography-hit') {
      const envelope = fade(sample.progress, 1.65)
        * event.intensity;

      density = Math.max(density, event.density);

      if (event.downbeat) {
        downbeat = Math.max(
          downbeat,
          envelope,
        );
      }

      simultaneous = Math.max(
        simultaneous,
        clamp01(
          event.simultaneousCount / 4,
        ) * envelope,
      );

      if (event.reentry) {
        reentry = Math.max(
          reentry,
          envelope,
        );
      }
      continue;
    }

    if (event.kind !== 'orb-pulse') {
      continue;
    }

    const role = activeRole(scene, event.orbId);

    if (!role) {
      continue;
    }

    roles.add(role);
    const envelope = event.intensity
      * fade(sample.progress, 1.45);

    if (role === 'bass') {
      bassCompression = Math.max(
        bassCompression,
        envelope,
      );
    }

    if (
      role === 'beat'
      || role === 'percussion'
    ) {
      if (envelope > pressure) {
        pressure = envelope;
        pressurePhase = sample.progress;
      }
    }

    if (
      role === 'harmony'
      || role === 'voice'
    ) {
      harmonyBloom = Math.max(
        harmonyBloom,
        envelope * (
          role === 'harmony' ? 1 : 0.58
        ),
      );
    }
  }

  const roleSpread = clamp01(roles.size / 5);
  const densityScale = 0.72 + clamp01(density) * 0.28;

  pressure = Math.max(
    pressure,
    downbeat * 0.62,
    simultaneous * 0.55,
    reentry * 0.52,
  ) * densityScale;

  harmonyBloom = clamp01(
    harmonyBloom
    + phraseBuild * 0.18
    + phraseRelease * 0.36
    + roleSpread * simultaneous * 0.16,
  );

  if (preferences.reduceMotion) {
    pressurePhase = 0;
  }

  return {
    wake: clamp01(Math.max(wake, reentry * 0.82)),
    settle: clamp01(Math.max(settle, silence * 0.62)),
    downbeat: clamp01(downbeat),
    simultaneous: clamp01(simultaneous),
    phraseBuild: clamp01(phraseBuild),
    phraseRelease: clamp01(phraseRelease),
    silence: clamp01(silence),
    reentry: clamp01(reentry),
    pressure: clamp01(pressure),
    pressurePhase: clamp01(pressurePhase),
    bassCompression: clamp01(bassCompression),
    harmonyBloom,
    roleSpread,
    density: clamp01(density),
    recordStart: clamp01(recordStart),
    recordStop: clamp01(recordStop),
  };
}

export function objectChoreographyEmphasis(
  samples: readonly RenderEventSample[],
): ObjectChoreographyEmphasis {
  let wake = 0;
  let settle = 0;
  let downbeat = 0;
  let phrase = 0;
  let reentry = 0;

  for (const sample of samples) {
    const event = sample.event;

    if (event.kind === 'choreography-state') {
      const envelope = fade(sample.progress, 1.2)
        * event.intensity;

      if (event.cue === 'play') {
        wake = Math.max(wake, envelope);
      } else if (event.cue === 'stop') {
        settle = Math.max(settle, envelope);
      }
      continue;
    }

    if (event.kind === 'choreography-hit') {
      const envelope = fade(sample.progress, 1.55)
        * event.intensity;

      if (event.downbeat) {
        downbeat = Math.max(downbeat, envelope);
      }

      if (event.reentry) {
        reentry = Math.max(reentry, envelope);
      }
      continue;
    }

    if (
      event.kind === 'choreography-bar'
      && event.phrasePosition === 0
      && event.bar > 0
    ) {
      phrase = Math.max(
        phrase,
        fade(sample.progress, 1.15)
        * (0.55 + event.density * 0.45),
      );
    }
  }

  return {
    wake: clamp01(wake),
    settle: clamp01(settle),
    downbeat: clamp01(downbeat),
    phrase: clamp01(phrase),
    reentry: clamp01(reentry),
  };
}

export function linkChoreographyBoost(
  samples: readonly RenderEventSample[],
): number {
  const emphasis = objectChoreographyEmphasis(samples);

  return clamp01(
    emphasis.downbeat * 0.35
    + emphasis.phrase * 0.32
    + emphasis.reentry * 0.42
    + emphasis.wake * 0.18,
  );
}
