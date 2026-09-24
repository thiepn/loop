import type { AppState } from './state';

export interface PwaViewCallbacks {
  readonly onInstall: () => void;
  readonly onUpdate: () => void;
}

export class PwaView {
  private readonly layer: HTMLElement;
  private readonly installButton: HTMLButtonElement;
  private readonly updateBanner: HTMLElement;
  private readonly offlineBadge: HTMLElement;

  public constructor(
    root: HTMLElement,
    callbacks: PwaViewCallbacks,
  ) {
    const layer = document.createElement('div');
    layer.className = 'pwa-status-layer';
    layer.innerHTML = `
      <button class="pwa-install-button" type="button" data-pwa-install hidden>
        <span aria-hidden="true">↓</span>
        Install Loop
      </button>

      <aside class="pwa-update-banner" data-pwa-update hidden>
        <div>
          <strong>Loop update ready</strong>
          <small>Apply it when you're ready.</small>
        </div>
        <button type="button" data-pwa-update-now>Update</button>
      </aside>

      <div class="pwa-offline-badge" data-pwa-offline hidden>
        <span aria-hidden="true">●</span>
        Offline
      </div>
    `;

    root.append(layer);
    this.layer = layer;

    const installButton = layer.querySelector<HTMLButtonElement>(
      '[data-pwa-install]',
    );
    const updateBanner = layer.querySelector<HTMLElement>(
      '[data-pwa-update]',
    );
    const offlineBadge = layer.querySelector<HTMLElement>(
      '[data-pwa-offline]',
    );

    if (!installButton || !updateBanner || !offlineBadge) {
      throw new Error('PWA status layer failed to mount.');
    }

    this.installButton = installButton;
    this.updateBanner = updateBanner;
    this.offlineBadge = offlineBadge;

    installButton.addEventListener(
      'click',
      callbacks.onInstall,
    );

    layer.querySelector<HTMLButtonElement>(
      '[data-pwa-update-now]',
    )?.addEventListener(
      'click',
      callbacks.onUpdate,
    );
  }

  public render(state: Readonly<AppState>): void {
    this.installButton.hidden = !(
      state.screen === 'home'
      && state.pwaInstallAvailable
      && !state.pwaInstalled
    );

    this.updateBanner.hidden = !state.pwaUpdateReady;
    this.offlineBadge.hidden = !state.pwaOffline;
  }

  public destroy(): void {
    this.layer.remove();
  }
}
