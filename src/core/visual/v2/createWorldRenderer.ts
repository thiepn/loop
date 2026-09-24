import { Canvas2DWorldRenderer } from './Canvas2DWorldRenderer';
import { NullWorldRenderer } from './NullWorldRenderer';
import type { WorldRenderer } from './RenderTypes';
import { WebGL2WorldRenderer } from './WebGL2WorldRenderer';

const WEBGL_CONTEXT_OPTIONS: WebGLContextAttributes = {
  alpha: true,
  antialias: false,
  depth: false,
  stencil: false,
  premultipliedAlpha: false,
  preserveDrawingBuffer: false,
  powerPreference: 'high-performance',
};

export function createWorldRenderer(
  canvas: HTMLCanvasElement,
): WorldRenderer {
  try {
    const gl = canvas.getContext(
      'webgl2',
      WEBGL_CONTEXT_OPTIONS,
    );

    if (gl) {
      return new WebGL2WorldRenderer(canvas, gl);
    }
  } catch {
    // Canvas2D remains a supported fallback.
  }

  try {
    const context = canvas.getContext('2d', {
      alpha: true,
    });

    if (context) {
      return new Canvas2DWorldRenderer(canvas, context);
    }
  } catch {
    // A semantic DOM-only experience remains available.
  }

  return new NullWorldRenderer();
}
