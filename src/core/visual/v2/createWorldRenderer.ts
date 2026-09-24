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

export function isLikelySoftwareRendererName(
  rendererName: string,
): boolean {
  const normalized = rendererName.toLowerCase();

  return normalized.includes('swiftshader')
    || normalized.includes('llvmpipe')
    || normalized.includes('lavapipe')
    || normalized.includes('software');
}

function rendererName(
  gl: WebGL2RenderingContext,
): string {
  const debug = gl.getExtension('WEBGL_debug_renderer_info');

  if (debug) {
    const value = gl.getParameter(debug.UNMASKED_RENDERER_WEBGL);

    if (typeof value === 'string') {
      return value;
    }
  }

  const fallback = gl.getParameter(gl.RENDERER);
  return typeof fallback === 'string' ? fallback : '';
}

function canUseAcceleratedWebGL2(): boolean {
  const probe = document.createElement('canvas');

  try {
    const gl = probe.getContext(
      'webgl2',
      WEBGL_CONTEXT_OPTIONS,
    );

    if (!gl) {
      return false;
    }

    const software = isLikelySoftwareRendererName(
      rendererName(gl),
    );

    gl.getExtension('WEBGL_lose_context')?.loseContext();

    return !software;
  } catch {
    return false;
  }
}

export function createWorldRenderer(
  canvas: HTMLCanvasElement,
): WorldRenderer {
  if (canUseAcceleratedWebGL2()) {
    try {
      const gl = canvas.getContext(
        'webgl2',
        WEBGL_CONTEXT_OPTIONS,
      );

      if (gl) {
        return new WebGL2WorldRenderer(canvas, gl);
      }
    } catch {
      // Canvas2D remains the bounded software fallback.
    }
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
