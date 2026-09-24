import type { SoundRole } from '../core/sounds/SoundDefinition';
import {
  profileForVisualPreferences,
  type VisualPreferences,
  type VisualQuality,
} from '../core/visual/VisualQuality';
import type { NormalizedPoint } from '../core/world/SoundOrb';
import type { AppState } from './state';

export interface VisualSystemCallbacks {
  readonly onOpenSettings: () => void;
  readonly onCloseSettings: () => void;
  readonly onQuality: (quality: VisualQuality) => void;
  readonly onReduceMotion: (value: boolean) => void;
  readonly onReduceParticles: (value: boolean) => void;
  readonly onReduceBloom: (value: boolean) => void;
}

interface TrailState {
  readonly nodes: HTMLElement[];
  lastPosition: NormalizedPoint | null;
}

const ROLE_COLORS: Record<SoundRole, string> = {
  beat: '#fb7185',
  percussion: '#fbbf24',
  bass: '#22d3ee',
  harmony: '#a78bfa',
  melody: '#34d399',
  texture: '#60a5fa',
  voice: '#f472b6',
};

function distance(
  a: NormalizedPoint,
  b: NormalizedPoint,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export class VisualSystemView {
  private readonly shell: HTMLElement;
  private readonly ambientLayer: HTMLElement;
  private readonly trailLayer: HTMLElement;
  private readonly burstLayer: HTMLElement;
  private readonly settingsButton: HTMLButtonElement;
  private readonly settingsBackdrop: HTMLElement;
  private readonly qualityButtons = new Map<VisualQuality, HTMLButtonElement>();
  private readonly reduceMotionInput: HTMLInputElement;
  private readonly reduceParticlesInput: HTMLInputElement;
  private readonly reduceBloomInput: HTMLInputElement;
  private readonly trails = new Map<string, TrailState>();
  private readonly positions = new Map<string, NormalizedPoint>();
  private readonly cleanupTimers = new Set<ReturnType<typeof setTimeout>>();
  private roles = new Map<string, SoundRole>();
  private preferences: VisualPreferences = {
    quality: 'balanced',
    reduceMotion: false,
    reduceParticles: false,
    reduceBloom: false,
  };

  public constructor(
    root: HTMLElement,
    callbacks: VisualSystemCallbacks,
  ) {
    const shell = root.querySelector<HTMLElement>('.playground-shell');
    const canvas = root.querySelector<HTMLElement>('[data-canvas]');
    const topbarActions = root.querySelector<HTMLElement>('[data-topbar-actions]');
    const playButton = topbarActions?.querySelector<HTMLElement>('[data-play]');

    if (!shell || !canvas || !topbarActions || !playButton) {
      throw new Error('Visual system requires the playground shell.');
    }

    this.shell = shell;
    const effectsLayer = document.createElement('div');
    effectsLayer.className = 'visual-effects-layer';
    effectsLayer.setAttribute('aria-hidden', 'true');

    const ambientLayer = document.createElement('div');
    ambientLayer.className = 'ambient-particle-layer';

    const trailLayer = document.createElement('div');
    trailLayer.className = 'motion-trail-layer';

    const burstLayer = document.createElement('div');
    burstLayer.className = 'orb-burst-layer';

    effectsLayer.append(
      ambientLayer,
      trailLayer,
      burstLayer,
    );
    canvas.prepend(effectsLayer);

    this.ambientLayer = ambientLayer;
    this.trailLayer = trailLayer;
    this.burstLayer = burstLayer;

    const settingsButton = document.createElement('button');
    settingsButton.type = 'button';
    settingsButton.className = 'visual-settings-button';
    settingsButton.setAttribute('aria-label', 'Visual settings');
    settingsButton.title = 'Visual settings';
    settingsButton.innerHTML = '<span aria-hidden="true">✺</span>';
    settingsButton.addEventListener('click', callbacks.onOpenSettings);
    topbarActions.insertBefore(settingsButton, playButton);
    this.settingsButton = settingsButton;

    const settingsBackdrop = document.createElement('div');
    settingsBackdrop.className = 'visual-settings-backdrop';
    settingsBackdrop.hidden = true;
    settingsBackdrop.innerHTML = `
      <section class="visual-settings-sheet" role="dialog" aria-modal="true" aria-labelledby="visual-settings-title">
        <header class="visual-settings-header">
          <div>
            <span>Visual experience</span>
            <h2 id="visual-settings-title">How alive should Loop feel?</h2>
            <p>These settings only change visuals. Audio stays exactly the same.</p>
          </div>
          <button class="visual-settings-close" type="button" data-visual-close aria-label="Close visual settings">×</button>
        </header>

        <div class="visual-quality-grid" data-visual-quality></div>

        <div class="visual-accessibility-list">
          <label>
            <span>
              <strong>Reduce motion</strong>
              <small>Keep state feedback, remove travel-heavy animation</small>
            </span>
            <input type="checkbox" data-reduce-motion />
          </label>

          <label>
            <span>
              <strong>Reduce particles</strong>
              <small>Remove ambient and burst particles</small>
            </span>
            <input type="checkbox" data-reduce-particles />
          </label>

          <label>
            <span>
              <strong>Reduce glow</strong>
              <small>Lower bloom and luminous depth</small>
            </span>
            <input type="checkbox" data-reduce-bloom />
          </label>
        </div>
      </section>
    `;
    shell.append(settingsBackdrop);
    this.settingsBackdrop = settingsBackdrop;

    const qualityGrid = settingsBackdrop.querySelector<HTMLElement>(
      '[data-visual-quality]',
    );
    const reduceMotionInput = settingsBackdrop.querySelector<HTMLInputElement>(
      '[data-reduce-motion]',
    );
    const reduceParticlesInput = settingsBackdrop.querySelector<HTMLInputElement>(
      '[data-reduce-particles]',
    );
    const reduceBloomInput = settingsBackdrop.querySelector<HTMLInputElement>(
      '[data-reduce-bloom]',
    );

    if (
      !qualityGrid
      || !reduceMotionInput
      || !reduceParticlesInput
      || !reduceBloomInput
    ) {
      throw new Error('Visual settings failed to mount.');
    }

    this.reduceMotionInput = reduceMotionInput;
    this.reduceParticlesInput = reduceParticlesInput;
    this.reduceBloomInput = reduceBloomInput;

    const qualityChoices: readonly {
      readonly id: VisualQuality;
      readonly label: string;
      readonly description: string;
    }[] = [
      {
        id: 'high',
        label: 'High',
        description: 'Longer trails, more particles and bloom',
      },
      {
        id: 'balanced',
        label: 'Balanced',
        description: 'The default mix of detail and efficiency',
      },
      {
        id: 'battery',
        label: 'Battery Saver',
        description: 'Minimal extras, same musical interaction',
      },
    ];

    for (const choice of qualityChoices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'visual-quality-choice';
      button.dataset.visualQuality = choice.id;
      button.innerHTML = `
        <span class="visual-quality-art" aria-hidden="true"></span>
        <span>
          <strong>${choice.label}</strong>
          <small>${choice.description}</small>
        </span>
      `;
      button.addEventListener('click', () => callbacks.onQuality(choice.id));
      qualityGrid.append(button);
      this.qualityButtons.set(choice.id, button);
    }

    settingsBackdrop.querySelector<HTMLButtonElement>(
      '[data-visual-close]',
    )?.addEventListener('click', callbacks.onCloseSettings);

    settingsBackdrop.addEventListener('pointerdown', (event) => {
      if (event.target === settingsBackdrop) {
        callbacks.onCloseSettings();
      }
    });

    reduceMotionInput.addEventListener('change', () => {
      callbacks.onReduceMotion(reduceMotionInput.checked);
    });
    reduceParticlesInput.addEventListener('change', () => {
      callbacks.onReduceParticles(reduceParticlesInput.checked);
    });
    reduceBloomInput.addEventListener('change', () => {
      callbacks.onReduceBloom(reduceBloomInput.checked);
    });
  }

  public render(state: Readonly<AppState>): void {
    this.preferences = {
      quality: state.visualQuality,
      reduceMotion: state.visualReduceMotion,
      reduceParticles: state.visualReduceParticles,
      reduceBloom: state.visualReduceBloom,
    };

    this.roles = new Map(
      state.world.soundOrbs.map((orb) => [orb.id, orb.role]),
    );

    const liveIds = new Set(state.world.soundOrbs.map((orb) => orb.id));

    for (const orb of state.world.soundOrbs) {
      if (!this.positions.has(orb.id)) {
        this.positions.set(orb.id, orb.position);
      }
    }

    for (const orbId of [...this.positions.keys()]) {
      if (!liveIds.has(orbId)) {
        this.clearOrb(orbId);
      }
    }

    this.shell.dataset.visualQuality = state.visualQuality;
    this.shell.dataset.reduceMotion = String(state.visualReduceMotion);
    this.shell.dataset.reduceParticles = String(state.visualReduceParticles);
    this.shell.dataset.reduceBloom = String(state.visualReduceBloom);

    this.settingsBackdrop.hidden = !state.visualSettingsOpen;
    this.settingsButton.setAttribute(
      'aria-expanded',
      String(state.visualSettingsOpen),
    );

    for (const [quality, button] of this.qualityButtons) {
      button.classList.toggle(
        'is-active',
        state.visualQuality === quality,
      );
    }

    this.reduceMotionInput.checked = state.visualReduceMotion;
    this.reduceParticlesInput.checked = state.visualReduceParticles;
    this.reduceBloomInput.checked = state.visualReduceBloom;

    this.syncAmbientParticles();
    this.pruneTrails(state);
  }

  public previewOrbPosition(
    orbId: string,
    position: NormalizedPoint,
    motionActive: boolean,
  ): void {
    this.positions.set(orbId, position);

    if (!motionActive) {
      return;
    }

    const profile = profileForVisualPreferences(this.preferences);

    if (!profile.animateTrails || profile.trailPointLimit <= 0) {
      return;
    }

    const role = this.roles.get(orbId);
    if (!role) {
      return;
    }

    let trail = this.trails.get(orbId);

    if (!trail) {
      trail = {
        nodes: [],
        lastPosition: null,
      };
      this.trails.set(orbId, trail);
    }

    if (
      trail.lastPosition
      && distance(trail.lastPosition, position) < 0.012
    ) {
      return;
    }

    trail.lastPosition = position;

    const point = document.createElement('span');
    point.className = 'motion-trail-point';
    point.dataset.role = role;
    point.style.left = `${position.x * 100}%`;
    point.style.top = `${position.y * 100}%`;
    point.style.setProperty('--trail-color', ROLE_COLORS[role]);
    point.style.setProperty(
      '--trail-lifetime',
      `${profile.trailLifetimeMs}ms`,
    );
    this.trailLayer.append(point);
    trail.nodes.push(point);

    while (trail.nodes.length > profile.trailPointLimit) {
      trail.nodes.shift()?.remove();
    }

    const timer = setTimeout(() => {
      this.cleanupTimers.delete(timer);
      point.remove();

      const current = this.trails.get(orbId);
      if (!current) {
        return;
      }

      const nodeIndex = current.nodes.indexOf(point);

      if (nodeIndex >= 0) {
        current.nodes.splice(nodeIndex, 1);
      }
    }, profile.trailLifetimeMs + 80);

    this.cleanupTimers.add(timer);
  }

  public pulseOrb(
    orbId: string,
    intensity: number,
    livePosition?: NormalizedPoint,
  ): void {
    const role = this.roles.get(orbId);
    const position = livePosition ?? this.positions.get(orbId);

    if (livePosition) {
      this.positions.set(orbId, livePosition);
    }

    if (!role || !position) {
      return;
    }

    const profile = profileForVisualPreferences(this.preferences);
    const count = profile.burstParticleCount;

    if (count <= 0) {
      return;
    }

    const amount = Math.max(0.2, Math.min(1, intensity));
    const radius = role === 'bass'
      ? 34
      : role === 'texture'
        ? 40
        : role === 'percussion'
          ? 24
          : 30;

    for (let index = 0; index < count; index += 1) {
      const particle = document.createElement('span');
      particle.className = 'orb-burst-particle';
      particle.dataset.role = role;
      particle.style.left = `${position.x * 100}%`;
      particle.style.top = `${position.y * 100}%`;
      particle.style.setProperty('--burst-color', ROLE_COLORS[role]);

      const angle = (
        (Math.PI * 2 * index) / count
        + ((orbId.length * 0.37) % 1)
      );
      const spread = radius * (
        0.65
        + ((index * 37 + orbId.length) % 10) / 22
      );
      particle.style.setProperty(
        '--burst-x',
        `${Math.cos(angle) * spread * amount}px`,
      );
      particle.style.setProperty(
        '--burst-y',
        `${Math.sin(angle) * spread * amount}px`,
      );

      this.burstLayer.append(particle);

      const timer = setTimeout(() => {
        this.cleanupTimers.delete(timer);
        particle.remove();
      }, this.preferences.reduceMotion ? 220 : 520);

      this.cleanupTimers.add(timer);
    }
  }

  public clearOrb(orbId: string): void {
    this.clearTrail(orbId);
    this.positions.delete(orbId);
  }

  public destroy(): void {
    for (const timer of this.cleanupTimers) {
      clearTimeout(timer);
    }

    this.cleanupTimers.clear();

    for (const trail of this.trails.values()) {
      for (const node of trail.nodes) {
        node.remove();
      }
    }

    this.trails.clear();
    this.positions.clear();
    this.ambientLayer.parentElement?.remove();
    this.settingsButton.remove();
    this.settingsBackdrop.remove();
  }

  private syncAmbientParticles(): void {
    const profile = profileForVisualPreferences(this.preferences);
    const desired = profile.ambientParticleCount;
    const current = this.ambientLayer.children.length;

    if (current > desired) {
      while (this.ambientLayer.children.length > desired) {
        this.ambientLayer.lastElementChild?.remove();
      }
      return;
    }

    for (let index = current; index < desired; index += 1) {
      const particle = document.createElement('span');
      particle.className = 'ambient-particle';

      const x = (index * 37 + 17) % 97;
      const y = (index * 61 + 29) % 91;
      const size = 1 + (index % 3);
      const delay = -(index % 11) * 0.73;
      const duration = 9 + (index % 7) * 1.6;

      particle.style.left = `${x}%`;
      particle.style.top = `${y}%`;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.animationDelay = `${delay}s`;
      particle.style.animationDuration = `${duration}s`;

      this.ambientLayer.append(particle);
    }
  }

  private pruneTrails(state: Readonly<AppState>): void {
    const liveIds = new Set(
      state.world.soundOrbs.map((orb) => orb.id),
    );

    for (const orbId of [...this.trails.keys()]) {
      if (!liveIds.has(orbId)) {
        this.clearOrb(orbId);
      }
    }

    const profile = profileForVisualPreferences(this.preferences);

    if (profile.trailPointLimit <= 0) {
      for (const orbId of [...this.trails.keys()]) {
        this.clearTrail(orbId);
      }
    }
  }

  private clearTrail(orbId: string): void {
    const trail = this.trails.get(orbId);
    if (!trail) {
      return;
    }

    for (const node of trail.nodes) {
      node.remove();
    }

    this.trails.delete(orbId);
  }
}
