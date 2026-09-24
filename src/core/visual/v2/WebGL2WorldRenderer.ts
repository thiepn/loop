import type { VisualPreferences } from '../VisualQuality';
import {
  LINK_RENDER_COLORS,
  LISTENER_RENDER_COLOR,
  ROLE_RENDER_COLORS,
  TOY_RENDER_COLORS,
  fieldInfluencedColor,
  withAlpha,
  type RenderColor,
} from './RenderPalette';
import {
  crossAffectedLinkPoints,
  curvedLinkPoints,
} from './LinkGeometry';
import { deriveEnvironmentDynamics } from './EnvironmentModel';
import { WebGLCrossSystemLayer } from './WebGLCrossSystemLayer';
import { WebGLEnvironmentLayer } from './WebGLEnvironmentLayer';
import { WebGLFieldMaterialLayer } from './WebGLFieldMaterialLayer';
import { WebGLOrbMaterialLayer } from './WebGLOrbMaterialLayer';
import { WebGLTrailLayer } from './WebGLTrailLayer';
import {
  listenerDiameterPixels,
  orbDiameterPixels,
  toyDiameterPixels,
} from './RenderMetrics';
import type {
  RenderEventSample,
  RenderScene,
  RenderViewport,
  WorldRenderer,
} from './RenderTypes';

interface ProgramResources {
  readonly program: WebGLProgram;
  readonly buffer: WebGLBuffer;
  readonly positionLocation: number;
  readonly colorLocation: number;
  readonly resolutionLocation: WebGLUniformLocation;
}

interface DiscProgramResources extends ProgramResources {
  readonly localLocation: number;
}

const DISC_VERTEX_SOURCE = '#version 300 es\n'
  + 'in vec2 a_position;\n'
  + 'in vec2 a_local;\n'
  + 'in vec4 a_color;\n'
  + 'uniform vec2 u_resolution;\n'
  + 'out vec2 v_local;\n'
  + 'out vec4 v_color;\n'
  + 'void main() {\n'
  + '  vec2 zeroToOne = a_position / u_resolution;\n'
  + '  vec2 clip = zeroToOne * 2.0 - 1.0;\n'
  + '  clip.y = -clip.y;\n'
  + '  gl_Position = vec4(clip, 0.0, 1.0);\n'
  + '  v_local = a_local;\n'
  + '  v_color = a_color;\n'
  + '}';

const DISC_FRAGMENT_SOURCE = '#version 300 es\n'
  + 'precision mediump float;\n'
  + 'in vec2 v_local;\n'
  + 'in vec4 v_color;\n'
  + 'out vec4 out_color;\n'
  + 'void main() {\n'
  + '  float distance_to_center = length(v_local);\n'
  + '  if (distance_to_center > 1.0) discard;\n'
  + '  float edge = 1.0 - smoothstep(0.82, 1.0, distance_to_center);\n'
  + '  float body = 0.82 + (1.0 - distance_to_center) * 0.18;\n'
  + '  out_color = vec4(v_color.rgb * body, v_color.a * edge);\n'
  + '}';

const LINE_VERTEX_SOURCE = '#version 300 es\n'
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

const LINE_FRAGMENT_SOURCE = '#version 300 es\n'
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
    throw new Error('Could not allocate WebGL shader.');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? 'Unknown shader error.';
    gl.deleteShader(shader);
    throw new Error('WebGL shader compile failed: ' + message);
  }

  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
): WebGLProgram {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();

  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    throw new Error('Could not allocate WebGL program.');
  }

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? 'Unknown program error.';
    gl.deleteProgram(program);
    throw new Error('WebGL program link failed: ' + message);
  }

  return program;
}

function requiredBuffer(
  gl: WebGL2RenderingContext,
): WebGLBuffer {
  const buffer = gl.createBuffer();

  if (!buffer) {
    throw new Error('Could not allocate WebGL buffer.');
  }

  return buffer;
}

function requiredUniform(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
): WebGLUniformLocation {
  const location = gl.getUniformLocation(program, name);

  if (!location) {
    throw new Error('Missing WebGL uniform: ' + name);
  }

  return location;
}

function pushDisc(
  target: number[],
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  color: RenderColor,
): void {
  const corners = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ] as const;

  for (const [localX, localY] of corners) {
    target.push(
      x + localX * radiusX,
      y + localY * radiusY,
      localX,
      localY,
      color[0],
      color[1],
      color[2],
      color[3],
    );
  }
}

function pushLineSegment(
  target: number[],
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: RenderColor,
): void {
  target.push(
    fromX,
    fromY,
    color[0],
    color[1],
    color[2],
    color[3],
    toX,
    toY,
    color[0],
    color[1],
    color[2],
    color[3],
  );
}

export class WebGL2WorldRenderer implements WorldRenderer {
  public readonly kind = 'webgl2' as const;
  private disc: DiscProgramResources | null = null;
  private line: ProgramResources | null = null;
  private environment: WebGLEnvironmentLayer | null = null;
  private crossLayer: WebGLCrossSystemLayer | null = null;
  private fieldLayer: WebGLFieldMaterialLayer | null = null;
  private trailLayer: WebGLTrailLayer | null = null;
  private orbMaterial: WebGLOrbMaterialLayer | null = null;
  private viewport: RenderViewport = {
    width: 1,
    height: 1,
    dpr: 1,
  };

  public constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly gl: WebGL2RenderingContext,
  ) {
    this.initializeResources();
  }

  public resize(viewport: RenderViewport): void {
    this.viewport = viewport;
    this.canvas.width = Math.max(1, Math.round(viewport.width * viewport.dpr));
    this.canvas.height = Math.max(1, Math.round(viewport.height * viewport.dpr));
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  public render(
    scene: Readonly<RenderScene>,
    preferences: Readonly<VisualPreferences>,
    events: readonly RenderEventSample[],
    timestampMs: number,
  ): void {
    const disc = this.disc;
    const line = this.line;

    if (!disc || !line || this.gl.isContextLost()) {
      return;
    }

    const width = this.canvas.width;
    const height = this.canvas.height;
    const dpr = this.viewport.dpr;
    const minDimension = Math.min(width, height);
    const dynamics = deriveEnvironmentDynamics(
      scene,
      events,
      preferences,
    );
    const discVertices: number[] = [];
    const lineVertices: number[] = [];

    for (const linkItem of scene.links) {
      const points = crossAffectedLinkPoints(
        curvedLinkPoints(
          linkItem.id,
          linkItem.source,
          linkItem.target,
          width,
          height,
        ),
        linkItem.cross,
        width,
        height,
      );
      const base = fieldInfluencedColor(
        LINK_RENDER_COLORS[linkItem.type],
        linkItem.cross.fieldInfluence,
      );
      const color = withAlpha(
        base,
        linkItem.selected ? 0.95 : base[3],
      );
      const frost = linkItem.cross.fieldInfluence.frost;
      const echo = linkItem.cross.fieldInfluence.echo;
      const directionX = linkItem.target.x - linkItem.source.x;
      const directionY = linkItem.target.y - linkItem.source.y;
      const directionLength = Math.hypot(directionX, directionY) || 1;
      const normalX = -directionY / directionLength;
      const normalY = directionX / directionLength;
      const ghostOffset = echo * 6 * dpr;

      for (let index = 1; index < points.length; index += 1) {
        const from = points[index - 1];
        const to = points[index];

        if (!from || !to) {
          continue;
        }

        if (frost > 0.34 && index % 2 === 0) {
          continue;
        }

        pushLineSegment(
          lineVertices,
          from.x,
          from.y,
          to.x,
          to.y,
          color,
        );

        if (echo > 0.08) {
          pushLineSegment(
            lineVertices,
            from.x + normalX * ghostOffset,
            from.y + normalY * ghostOffset,
            to.x + normalX * ghostOffset,
            to.y + normalY * ghostOffset,
            withAlpha(
              color,
              color[3] * echo * 0.34,
            ),
          );
        }
      }
    }

    for (const toy of scene.toys) {
      const [diameterX, diameterY] = toyDiameterPixels(
        toy.radius,
        width,
        height,
      );
      const color = fieldInfluencedColor(
        TOY_RENDER_COLORS[toy.type],
        toy.cross.fieldInfluence,
      );
      const responseScale = 1
        + toy.cross.nearbyOrbStrength * 0.08;

      if (toy.selected) {
        pushDisc(
          discVertices,
          toy.position.x * width,
          toy.position.y * height,
          diameterX * 0.62 * responseScale,
          diameterY * 0.62 * responseScale,
          [1, 1, 1, 0.14],
        );
      }

      if (toy.cross.nearbyOrbStrength > 0.04) {
        pushDisc(
          discVertices,
          toy.position.x * width,
          toy.position.y * height,
          diameterX * 0.58 * responseScale,
          diameterY * 0.58 * responseScale,
          withAlpha(
            color,
            0.05 + toy.cross.nearbyOrbStrength * 0.08,
          ),
        );
      }

      pushDisc(
        discVertices,
        toy.position.x * width,
        toy.position.y * height,
        diameterX * 0.5 * responseScale,
        diameterY * 0.5 * responseScale,
        color,
      );

      if (toy.type === 'portal' && toy.exitPosition) {
        pushDisc(
          discVertices,
          toy.exitPosition.x * width,
          toy.exitPosition.y * height,
          diameterX * 0.42,
          diameterY * 0.42,
          fieldInfluencedColor(
            [0.957, 0.447, 0.714, 0.72],
            toy.cross.fieldInfluence,
          ),
        );
      }
    }

    const listenerDiameter = listenerDiameterPixels(dpr);
    pushDisc(
      discVertices,
      scene.listener.x * width,
      scene.listener.y * height,
      listenerDiameter * 0.75,
      listenerDiameter * 0.75,
      withAlpha(
        LISTENER_RENDER_COLOR,
        scene.playing ? 0.14 : 0.07,
      ),
    );
    pushDisc(
      discVertices,
      scene.listener.x * width,
      scene.listener.y * height,
      listenerDiameter * 0.5,
      listenerDiameter * 0.5,
      LISTENER_RENDER_COLOR,
    );

    for (const sample of events) {
      this.pushEventDiscs(
        discVertices,
        sample,
        scene,
        width,
        height,
        minDimension,
        dpr,
      );
    }

    const gl = this.gl;
    gl.disable(gl.DEPTH_TEST);
    gl.clearColor(0.01, 0.011, 0.021, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    this.environment?.render(
      scene.environment,
      scene.fieldEnvironment,
      scene.crossEnvironment,
      dynamics,
      preferences,
      timestampMs,
      width,
      height,
      scene.playing,
      scene.recording,
    );

    this.fieldLayer?.render(
      scene.fields,
      scene.fieldIntersections,
      preferences,
      timestampMs,
      width,
      height,
    );

    this.crossLayer?.render(
      scene.orbCouplings,
      preferences,
      events,
      width,
      height,
      dpr,
    );

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    if (lineVertices.length > 0) {
      this.drawLines(line, lineVertices, width, height);
    }

    this.trailLayer?.render(
      scene.trails,
      preferences,
      timestampMs,
      width,
      height,
      dpr,
    );

    if (discVertices.length > 0) {
      this.drawDiscs(disc, discVertices, width, height);
    }

    this.orbMaterial?.render(
      scene.orbs,
      preferences,
      events,
      timestampMs,
      width,
      height,
      dpr,
    );
  }

  public restore(): void {
    this.releaseResources();
    this.initializeResources();
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  public destroy(): void {
    this.releaseResources();
  }

  private initializeResources(): void {
    const gl = this.gl;
    const discProgram = createProgram(
      gl,
      DISC_VERTEX_SOURCE,
      DISC_FRAGMENT_SOURCE,
    );
    const lineProgram = createProgram(
      gl,
      LINE_VERTEX_SOURCE,
      LINE_FRAGMENT_SOURCE,
    );

    this.disc = {
      program: discProgram,
      buffer: requiredBuffer(gl),
      positionLocation: gl.getAttribLocation(discProgram, 'a_position'),
      localLocation: gl.getAttribLocation(discProgram, 'a_local'),
      colorLocation: gl.getAttribLocation(discProgram, 'a_color'),
      resolutionLocation: requiredUniform(gl, discProgram, 'u_resolution'),
    };

    this.line = {
      program: lineProgram,
      buffer: requiredBuffer(gl),
      positionLocation: gl.getAttribLocation(lineProgram, 'a_position'),
      colorLocation: gl.getAttribLocation(lineProgram, 'a_color'),
      resolutionLocation: requiredUniform(gl, lineProgram, 'u_resolution'),
    };

    this.environment = new WebGLEnvironmentLayer(gl);
    this.crossLayer = new WebGLCrossSystemLayer(gl);
    this.fieldLayer = new WebGLFieldMaterialLayer(gl);
    this.trailLayer = new WebGLTrailLayer(gl);
    this.orbMaterial = new WebGLOrbMaterialLayer(gl);
  }

  private releaseResources(): void {
    this.environment?.destroy();
    this.environment = null;
    this.crossLayer?.destroy();
    this.crossLayer = null;
    this.fieldLayer?.destroy();
    this.fieldLayer = null;
    this.trailLayer?.destroy();
    this.trailLayer = null;
    this.orbMaterial?.destroy();
    this.orbMaterial = null;

    if (this.disc) {
      this.gl.deleteBuffer(this.disc.buffer);
      this.gl.deleteProgram(this.disc.program);
      this.disc = null;
    }

    if (this.line) {
      this.gl.deleteBuffer(this.line.buffer);
      this.gl.deleteProgram(this.line.program);
      this.line = null;
    }
  }

  private drawDiscs(
    resources: DiscProgramResources,
    vertices: readonly number[],
    width: number,
    height: number,
  ): void {
    const gl = this.gl;
    const data = new Float32Array(vertices);
    const stride = 8 * Float32Array.BYTES_PER_ELEMENT;

    gl.useProgram(resources.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, resources.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.uniform2f(resources.resolutionLocation, width, height);

    gl.enableVertexAttribArray(resources.positionLocation);
    gl.vertexAttribPointer(
      resources.positionLocation,
      2,
      gl.FLOAT,
      false,
      stride,
      0,
    );

    gl.enableVertexAttribArray(resources.localLocation);
    gl.vertexAttribPointer(
      resources.localLocation,
      2,
      gl.FLOAT,
      false,
      stride,
      2 * Float32Array.BYTES_PER_ELEMENT,
    );

    gl.enableVertexAttribArray(resources.colorLocation);
    gl.vertexAttribPointer(
      resources.colorLocation,
      4,
      gl.FLOAT,
      false,
      stride,
      4 * Float32Array.BYTES_PER_ELEMENT,
    );

    gl.drawArrays(gl.TRIANGLES, 0, data.length / 8);
  }

  private drawLines(
    resources: ProgramResources,
    vertices: readonly number[],
    width: number,
    height: number,
  ): void {
    const gl = this.gl;
    const data = new Float32Array(vertices);
    const stride = 6 * Float32Array.BYTES_PER_ELEMENT;

    gl.useProgram(resources.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, resources.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.uniform2f(resources.resolutionLocation, width, height);

    gl.enableVertexAttribArray(resources.positionLocation);
    gl.vertexAttribPointer(
      resources.positionLocation,
      2,
      gl.FLOAT,
      false,
      stride,
      0,
    );

    gl.enableVertexAttribArray(resources.colorLocation);
    gl.vertexAttribPointer(
      resources.colorLocation,
      4,
      gl.FLOAT,
      false,
      stride,
      2 * Float32Array.BYTES_PER_ELEMENT,
    );

    gl.drawArrays(gl.LINES, 0, data.length / 6);
  }

  private pushEventDiscs(
    target: number[],
    sample: RenderEventSample,
    scene: Readonly<RenderScene>,
    width: number,
    height: number,
    minDimension: number,
    dpr: number,
  ): void {
    const fade = 1 - sample.progress;
    const event = sample.event;

    if (event.kind === 'orb-pulse') {
      const orb = scene.orbs.find(
        (candidate) => candidate.id === event.orbId,
      );

      if (!orb) {
        return;
      }

      const position = event.position ?? orb.position;
      const diameter = orbDiameterPixels(
        orb.role,
        minDimension,
        dpr,
      );
      const radius = diameter * 0.58 * (1 + sample.progress * 0.9);

      pushDisc(
        target,
        position.x * width,
        position.y * height,
        radius,
        radius,
        withAlpha(
          ROLE_RENDER_COLORS[orb.role],
          fade * 0.22 * event.intensity,
        ),
      );
      return;
    }

    if (
      event.kind === 'pointer-disturbance'
      || event.kind === 'orb-drop'
      || event.kind === 'orb-charge'
    ) {
      return;
    }

    const link = scene.links.find(
      (candidate) => candidate.id === event.linkId,
    );

    if (!link) {
      return;
    }

    const points = crossAffectedLinkPoints(
      curvedLinkPoints(
        link.id,
        link.source,
        link.target,
        width,
        height,
        12,
      ),
      link.cross,
      width,
      height,
    );
    const midpoint = points[Math.floor(points.length / 2)];

    if (!midpoint) {
      return;
    }

    const radius = (8 + sample.progress * 16) * dpr;
    pushDisc(
      target,
      midpoint.x,
      midpoint.y,
      radius,
      radius,
      withAlpha(
        fieldInfluencedColor(
          LINK_RENDER_COLORS[link.type],
          link.cross.fieldInfluence,
        ),
        fade * 0.5 * event.intensity,
      ),
    );
  }
}
