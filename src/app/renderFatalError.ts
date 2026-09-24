export function renderFatalError(root: HTMLElement, error: unknown): void {
  const message = error instanceof Error ? error.message : 'Unknown startup error';

  root.innerHTML = `
    <main class="fatal-shell" role="alert">
      <section class="fatal-card">
        <div class="fatal-brand" aria-hidden="true">
          <span class="brand-mark"><span></span></span>
        </div>
        <p class="eyebrow">Loop</p>
        <h1>Something went wrong.</h1>
        <p>The playground could not start cleanly.</p>
        <button type="button" data-reload>Reload</button>
        <details>
          <summary>Technical details</summary>
          <pre></pre>
        </details>
      </section>
    </main>
  `;

  const pre = root.querySelector('pre');
  if (pre) {
    pre.textContent = message;
  }

  root.querySelector<HTMLButtonElement>('[data-reload]')?.addEventListener('click', () => {
    window.location.reload();
  });
}
