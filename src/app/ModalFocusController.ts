const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'audio[controls]',
  'video[controls]',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) => (
    !element.closest('[hidden]')
    && element.getAttribute('aria-hidden') !== 'true'
  ));
}

export interface ModalFocusOptions {
  readonly onEscape?: () => void;
  readonly initialFocusSelector?: string;
}

export class ModalFocusController {
  private open = false;
  private previousFocus: HTMLElement | null = null;
  private readonly inertStates = new Map<HTMLElement, boolean>();

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (!this.open) {
      return;
    }

    if (event.key === 'Escape' && this.options.onEscape) {
      event.preventDefault();
      event.stopPropagation();
      this.options.onEscape();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusable = focusableElements(this.container);

    if (focusable.length === 0) {
      event.preventDefault();
      this.focusContainer();
      return;
    }

    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    const active = document.activeElement;

    if (!this.container.contains(active)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  public constructor(
    private readonly container: HTMLElement,
    private readonly options: ModalFocusOptions = {},
  ) {
    this.container.addEventListener('keydown', this.handleKeyDown);
  }

  public sync(open: boolean): void {
    if (open === this.open) {
      return;
    }

    this.open = open;

    if (open) {
      const active = document.activeElement;
      this.previousFocus = active instanceof HTMLElement
        ? active
        : null;
      this.makeBackgroundInert();

      queueMicrotask(() => {
        if (!this.open) {
          return;
        }

        const preferred = this.options.initialFocusSelector
          ? this.container.querySelector<HTMLElement>(
              this.options.initialFocusSelector,
            )
          : null;

        if (
          preferred
          && !preferred.closest('[hidden]')
          && preferred.getAttribute('aria-hidden') !== 'true'
        ) {
          preferred.focus();
          return;
        }

        const first = focusableElements(this.container)[0];
        if (first) {
          first.focus();
          return;
        }

        this.focusContainer();
      });
      return;
    }

    const previous = this.previousFocus;
    this.previousFocus = null;
    this.restoreBackground();

    queueMicrotask(() => {
      if (
        !this.open
        && previous?.isConnected
        && !previous.closest('[hidden]')
      ) {
        previous.focus();
      }
    });
  }

  public destroy(): void {
    this.open = false;
    this.previousFocus = null;
    this.restoreBackground();
    this.container.removeEventListener('keydown', this.handleKeyDown);
  }

  private makeBackgroundInert(): void {
    let activeBranch: HTMLElement | null = this.container;

    while (activeBranch?.parentElement) {
      const parent = activeBranch.parentElement;

      for (const child of parent.children) {
        if (!(child instanceof HTMLElement) || child === activeBranch) {
          continue;
        }

        if (!this.inertStates.has(child)) {
          this.inertStates.set(child, child.inert);
        }

        child.inert = true;
      }

      activeBranch = parent;

      if (activeBranch === document.body) {
        break;
      }
    }
  }

  private restoreBackground(): void {
    for (const [element, inert] of this.inertStates) {
      if (element.isConnected) {
        element.inert = inert;
      }
    }

    this.inertStates.clear();
  }

  private focusContainer(): void {
    if (!this.container.hasAttribute('tabindex')) {
      this.container.setAttribute('tabindex', '-1');
    }

    this.container.focus();
  }
}
