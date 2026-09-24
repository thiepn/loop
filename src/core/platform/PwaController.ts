export interface PwaRuntimeState {
  readonly installAvailable: boolean;
  readonly installed: boolean;
  readonly updateReady: boolean;
  readonly offline: boolean;
}

export type PwaStateListener = (
  state: Readonly<PwaRuntimeState>,
) => void;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{
    readonly outcome: 'accepted' | 'dismissed';
    readonly platform: string;
  }>;
}

function standaloneNow(): boolean {
  const iosStandalone = (
    navigator as Navigator & { standalone?: boolean }
  ).standalone === true;

  return iosStandalone
    || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

export class PwaController {
  private stateValue: PwaRuntimeState = {
    installAvailable: false,
    installed: false,
    updateReady: false,
    offline: false,
  };

  private readonly listeners = new Set<PwaStateListener>();
  private installPrompt: BeforeInstallPromptEvent | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private reloadForUpdate = false;
  private started = false;
  private lastUpdateCheck = 0;

  private readonly onBeforeInstallPrompt = (event: Event) => {
    const promptEvent = event as BeforeInstallPromptEvent;
    promptEvent.preventDefault();
    this.installPrompt = promptEvent;
    this.patch({
      installAvailable: true,
    });
  };

  private readonly onAppInstalled = () => {
    this.installPrompt = null;
    this.patch({
      installAvailable: false,
      installed: true,
    });
  };

  private readonly onOnline = () => {
    this.patch({ offline: false });
    void this.checkForUpdate();
  };

  private readonly onOffline = () => {
    this.patch({ offline: true });
  };

  private readonly onControllerChange = () => {
    if (!this.reloadForUpdate) {
      return;
    }

    this.reloadForUpdate = false;
    window.location.reload();
  };

  private readonly onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      void this.checkForUpdate();
    }
  };

  private readonly onFocus = () => {
    void this.checkForUpdate();
  };

  public get state(): Readonly<PwaRuntimeState> {
    return this.stateValue;
  }

  public subscribe(
    listener: PwaStateListener,
    emitImmediately = true,
  ): () => void {
    this.listeners.add(listener);

    if (emitImmediately) {
      listener(this.stateValue);
    }

    return () => {
      this.listeners.delete(listener);
    };
  }

  public start(): void {
    if (this.started || typeof window === 'undefined') {
      return;
    }

    this.started = true;

    this.patch({
      installed: standaloneNow(),
      offline: navigator.onLine === false,
    });

    window.addEventListener(
      'beforeinstallprompt',
      this.onBeforeInstallPrompt,
    );
    window.addEventListener(
      'appinstalled',
      this.onAppInstalled,
    );
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
    window.addEventListener('focus', this.onFocus);
    document.addEventListener(
      'visibilitychange',
      this.onVisibilityChange,
    );

    if (
      import.meta.env.PROD
      && 'serviceWorker' in navigator
    ) {
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        this.onControllerChange,
      );

      if (document.readyState === 'complete') {
        void this.registerServiceWorker();
      } else {
        window.addEventListener(
          'load',
          () => {
            void this.registerServiceWorker();
          },
          { once: true },
        );
      }
    }
  }

  public async install(): Promise<boolean> {
    const prompt = this.installPrompt;

    if (!prompt) {
      return false;
    }

    await prompt.prompt();
    const choice = await prompt.userChoice;

    if (choice.outcome === 'accepted') {
      this.patch({
        installAvailable: false,
        installed: true,
      });
      this.installPrompt = null;
      return true;
    }

    return false;
  }

  public applyUpdate(): void {
    const waiting = this.registration?.waiting;

    if (!waiting) {
      return;
    }

    this.reloadForUpdate = true;
    waiting.postMessage({
      type: 'SKIP_WAITING',
    });
  }

  public async checkForUpdate(): Promise<void> {
    if (
      !this.registration
      || navigator.onLine === false
    ) {
      return;
    }

    const now = Date.now();

    if (now - this.lastUpdateCheck < 5 * 60 * 1000) {
      return;
    }

    this.lastUpdateCheck = now;

    try {
      await this.registration.update();
    } catch {
      // Update checks are best-effort and must never disturb play.
    }
  }

  public destroy(): void {
    if (!this.started) {
      return;
    }

    this.started = false;
    this.listeners.clear();
    this.installPrompt = null;

    window.removeEventListener(
      'beforeinstallprompt',
      this.onBeforeInstallPrompt,
    );
    window.removeEventListener(
      'appinstalled',
      this.onAppInstalled,
    );
    window.removeEventListener('online', this.onOnline);
    window.removeEventListener('offline', this.onOffline);
    window.removeEventListener('focus', this.onFocus);
    document.removeEventListener(
      'visibilitychange',
      this.onVisibilityChange,
    );

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        this.onControllerChange,
      );
    }
  }

  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register(
        `${import.meta.env.BASE_URL}sw.js`,
        {
          scope: import.meta.env.BASE_URL,
          updateViaCache: 'none',
        },
      );

      this.registration = registration;

      if (registration.waiting) {
        this.patch({ updateReady: true });
      }

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;

        if (!worker) {
          return;
        }

        worker.addEventListener('statechange', () => {
          if (
            worker.state === 'installed'
            && navigator.serviceWorker.controller
          ) {
            this.patch({ updateReady: true });
          }
        });
      });

      await this.checkForUpdate();
    } catch {
      // Offline/install support is progressive enhancement.
    }
  }

  private patch(
    patch: Partial<PwaRuntimeState>,
  ): void {
    const next = {
      ...this.stateValue,
      ...patch,
    };

    if (
      next.installAvailable === this.stateValue.installAvailable
      && next.installed === this.stateValue.installed
      && next.updateReady === this.stateValue.updateReady
      && next.offline === this.stateValue.offline
    ) {
      return;
    }

    this.stateValue = next;

    for (const listener of this.listeners) {
      listener(this.stateValue);
    }
  }
}
