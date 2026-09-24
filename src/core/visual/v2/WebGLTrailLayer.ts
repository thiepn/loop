import type { VisualPreferences } from '../VisualQuality';
import {
  smoothedTrailPoints,
  trailAgeAlpha,
  trailVisualStyle,
} from './TrailGeometry';
import type {
  RenderColor,
} from './RenderPalette';
import type {
  RenderTrail,
  RenderTrailPoint,
} from './RenderTypes';
import { renderPolicyForPreferences } from './RendererPolicy';

const VERTEX_SOURCE = '#version 300 es\n'
  + 'in vec2 a_position;\n'
  + 'in vec4 a_color;\n'
  + 'uniform vec2 u_resolution;\n'
  + 'out vec4 v_color;\n'
  + 'void main() {\n'
  + '  vec2 zeroToOne = a_position / u_resolution;\n'
  + '  vec2 clip = zeroToOne * 2.0 - 1.0;\n'
  + '  clip.y = -clip.y;\n'
  + '  gl_Position = vec4(clip, 0.0, 1.0);\n'
  + '  v_color = a_color;\n'
  + '}';

const FRAGMENT_SOURCE = '#version 300 es\n'
  + 'precision mediump float;\n'
  + 'in vec4 v_color;\n'
  + 'out vec4 out_color;\n'
  + 'void main() {\n'
  + '  out_color = v_color;\n'
  + '}';

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error('Could not allocate trail shader.');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader)
      ?? 'Unknown trail shader error.';
    gl.deleteShader(shader);
    throw new Error('Trail shader compile failed: ' + message);
  }

  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
): WebGLProgram {
  const vertex = compileShader(
    gl,
    gl.VERTEX_SHADER,
    VERTEX_SOURCE,
  );
  const fragment = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    FRAGMENT_SOURCE,
  );
  const program = gl.createProgram();

  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    throw new Error('Could not allocate trail program.');
  }

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program)
      ?? 'Unknown trail program error.';
    gl.deleteProgram(program);
    throw new Error('Trail program link failed: ' + message);
  }

  return program;
}

function requiredUniform(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
): WebGLUniformLocation {
  const location = gl.getUniformLocation(program, name);

  if (!location) {
    throw new Error('Missing trail uniform: ' + name);
  }

  return location;
}

function pushVertex(
  target: number[],
  x: number,
  y: number,
  color: RenderColor,
  alpha: number,
): void {
  target.push(
    x,
    y,
    color[0],
    color[1],
    color[2],
    color[3] * alpha,
  );
}

function pushRibbonSegment(
  target: number[],
  a: RenderTrailPoint,
  b: RenderTrailPoint,
  width: number,
  widthPx: number,
  heightPx: number,
  color: RenderColor,
  alphaA: number,
  alphaB: number,
  lateralOffsetPx: number,
): void {
  const ax = a.position.x * width;
  const ay = a.position.y * heightPx;
  const bx = b.position.x * width;
  const by = b.position.y * heightPx;
  const dx = bx - ax;
  const dy = by - ay;
  const length = Math.hypot(dx, dy);

  if (length <= 0.001) {
    return;
  }

  const nx = -dy / length;
  const ny = dx / length;
  const half = widthPx / 2;
  const offsetX = nx * lateralOffsetPx;
  const offsetY = ny * lateralOffsetPx;

  const aLeftX = ax + nx * half + offsetX;
  const aLeftY = ay + ny * half + offsetY;
  const aRightX = ax - nx * half + offsetX;
  const aRightY = ay - ny * half + offsetY;
  const bLeftX = bx + nx * half + offsetX;
  const bLeftY = by + ny * half + offsetY;
  const bRightX = bx - nx * half + offsetX;
  const bRightY = by - ny * half + offsetY;

  pushVertex(target, aLeftX, aLeftY, color, alphaA);
  pushVertex(target, aRightX, aRightY, color, alphaA);
  pushVertex(target, bLeftX, bLeftY, color, alphaB);
  pushVertex(target, bLeftX, bLeftY, color, alphaB);
  pushVertex(target, aRightX, aRightY, color, alphaA);
  pushVertex(target, bRightX, bRightY, color, alphaB);
}

function pushSpark(
  target: number[],
  point: RenderTrailPoint,
  width: number,
  height: number,
  size: number,
  color: RenderColor,
  alpha: number,
): void {
  const x = point.position.x * width;
  const y = point.position.y * height;

  pushVertex(target, x, y - size, color, alpha);
  pushVertex(target, x + size, y, color, alpha);
  pushVertex(target, x, y + size, color, alpha);
  pushVertex(target, x, y - size, color, alpha);
  pushVertex(target, x, y + size, color, alpha);
  pushVertex(target, x - size, y, color, alpha);
}

export class WebGLTrailLayer {
  private readonly program: WebGLProgram;
  private readonly buffer: WebGLBuffer;
  private readonly positionLocation: number;
  private readonly colorLocation: number;
  private readonly resolution: WebGLUniformLocation;

  public constructor(
    private readonly gl: WebGL2RenderingContext,
  ) {
    this.program = createProgram(gl);
    const buffer = gl.createBuffer();

    if (!buffer) {
      gl.deleteProgram(this.program);
      throw new Error('Could not allocate trail buffer.');
    }

    this.buffer = buffer;
    this.positionLocation = gl.getAttribLocation(
      this.program,
      'a_position',
    );
    this.colorLocation = gl.getAttribLocation(
      this.program,
      'a_color',
    );
    this.resolution = requiredUniform(
      gl,
      this.program,
      'u_resolution',
    );
  }

  public render(
    trails: readonly RenderTrail[],
    preferences: Readonly<VisualPreferences>,
    timestampMs: number,
    width: number,
    height: number,
    dpr: number,
  ): void {
    if (trails.length === 0 || preferences.reduceMotion) {
      return;
    }

    const detail = renderPolicyForPreferences(
      preferences,
    ).trailDetail;
    const vertices: number[] = [];

    for (const trail of trails) {
      const points = smoothedTrailPoints(
        trail.points,
        detail,
      );

      for (let index = 1; index < points.length; index += 1) {
        const a = points[index - 1]!;
        const b = points[index]!;

        if (b.breakBefore) {
          continue;
        }

        const style = trailVisualStyle(
          trail.role,
          b,
          preferences,
          timestampMs,
        );

        if (
          style.segmented
          && index % 2 === 0
        ) {
          continue;
        }

        const alphaA = trailAgeAlpha(
          a,
          timestampMs,
          preferences,
        ) * style.alpha * (trail.muted ? 0.28 : 1);
        const alphaB = trailAgeAlpha(
          b,
          timestampMs,
          preferences,
        ) * style.alpha * (trail.muted ? 0.28 : 1);

        if (alphaA <= 0.002 && alphaB <= 0.002) {
          continue;
        }

        const baseWidth = style.widthPx * dpr;

        for (
          let layer = 0;
          layer < style.layerCount;
          layer += 1
        ) {
          const layerOffset = style.layerCount > 1
            ? (layer === 0 ? -2.2 : 2.2) * dpr
            : 0;

          pushRibbonSegment(
            vertices,
            a,
            b,
            width,
            baseWidth,
            height,
            style.color,
            alphaA * (layer === 0 ? 1 : 0.72),
            alphaB * (layer === 0 ? 1 : 0.72),
            style.lateralOffsetPx * dpr + layerOffset,
          );
        }

        if (style.ghostAlpha > 0.01) {
          pushRibbonSegment(
            vertices,
            a,
            b,
            width,
            baseWidth * 0.82,
            height,
            style.color,
            alphaA * style.ghostAlpha,
            alphaB * style.ghostAlpha,
            (
              style.lateralOffsetPx
              + style.ghostOffsetPx
            ) * dpr,
          );
        }

        if (
          !preferences.reduceParticles
          && b.turn > 0.32
        ) {
          pushSpark(
            vertices,
            b,
            width,
            height,
            (2.2 + b.turn * 4.2)
              * style.sparkScale
              * dpr,
            style.color,
            alphaB * 0.72,
          );
        }
      }
    }

    if (vertices.length === 0) {
      return;
    }

    const gl = this.gl;
    const data = new Float32Array(vertices);
    const stride = 6 * Float32Array.BYTES_PER_ELEMENT;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      data,
      gl.DYNAMIC_DRAW,
    );
    gl.uniform2f(this.resolution, width, height);

    gl.enableVertexAttribArray(this.positionLocation);
    gl.vertexAttribPointer(
      this.positionLocation,
      2,
      gl.FLOAT,
      false,
      stride,
      0,
    );

    gl.enableVertexAttribArray(this.colorLocation);
    gl.vertexAttribPointer(
      this.colorLocation,
      4,
      gl.FLOAT,
      false,
      stride,
      2 * Float32Array.BYTES_PER_ELEMENT,
    );

    gl.drawArrays(
      gl.TRIANGLES,
      0,
      data.length / 6,
    );
  }

  public destroy(): void {
    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteProgram(this.program);
  }
}
