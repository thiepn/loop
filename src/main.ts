import './styles.css';
import { App } from './app/App';
import { renderFatalError } from './app/renderFatalError';

const root = document.querySelector<HTMLElement>('#app');

if (!root) {
  throw new Error('Missing #app root element.');
}

try {
  const app = new App(root);
  app.mount();

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      app.destroy();
    });
  }
} catch (error) {
  console.error('[Loop] Fatal startup error.', error);
  renderFatalError(root, error);
}
