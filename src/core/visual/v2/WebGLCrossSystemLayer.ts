import type { VisualPreferences } from '../VisualQuality';
import {
  ROLE_RENDER_COLORS,
} from './RenderPalette';
import { renderPolicyForPreferences } from './RendererPolicy';
import { deriveTransitionFrame } from './TransitionModel';
import type {
  RenderEventSample,
  RenderOrbCoupling,
} from './RenderTypes';

const VERTEX_SOURCE = '#version 300 es\n'
  + 'in vec2 a_local;\n'
  + 'uniform vec2 u_resolution;\n'
  + 'uniform vec2 u_center;\n'
  + 'uniform vec2 u_half_vector;\n'
  + 'uniform float u_half_width;\n'
  + 'out vec2 v_local;\n'
  + 'void main() {\n'
  + '  float length_value = max(0.001, length(u_half_vector));\n'
  + '  vec2 direction = u_half_vector / length_value;\n'
  + '  vec2 normal = vec2(-direction.y, direction.x);\n'
  + '  vec2 position = u_center\n'
  + '    + u_half_vector * a_local.x\n'
  + '    + normal * u_half_width * a_local.y;\n'
  + '  vec2 zeroToOne = position / u_resolution;\n'
  + '  vec2 clip = zeroToOne * 2.0 - 1.0;\n'
  + '  clip.y = -clip.y;\n'
  + '  gl_Position = vec4(clip, 0.0, 1.0);\n'
  + '  v_local = a_local;\n'
  + '}';

const FRAGMENT_SOURCE = '#version 300 es\n'
  + 'precision mediump float;\n'
  + 'in vec2 v_local;\n'
  + 'uniform vec4 u_color_a;\n'
  + 'uniform vec4 u_color_b;\n'
  + 'uniform float u_strength;\n'
  + 'uniform float u_pulse;\n'
  + 'out vec4 out_color;\n'
  + 'void main() {\n'
  + '  float transverse = exp(-v_local.y * v_local.y * 3.8);\n'
  + '  float ends = smoothstep(1.0, 0.42, abs(v_local.x));\n'
  + '  float core = transverse * ends;\n'
  + '  if (core <= 0.002) discard;\n'
  + '  vec3 color = mix(\n'
  + '    u_color_a.rgb,\n'
  + '    u_color_b.rgb,\n'
  + '    v_local.x * 0.5 + 0.5\n'
  + '  );\n'
  + '  color += vec3(0.22, 0.25, 0.34) * u_pulse * core;\n'
  + '  float alpha = core * u_strength * (0.055 + u_pulse * 0.08);\n'
  + '  out_color = vec4(color, alpha);\n'
  + '}';

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Could not allocate cross-system shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? 'Unknown cross-system shader error.';
    gl.deleteShader(shader);
    throw new Error('Cross-system shader compile failed: ' + message);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext): WebGLProgram {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SOURCE);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SOURCE);
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    throw new Error('Could not allocate cross-system program.');
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? 'Unknown cross-system program error.';
    gl.deleteProgram(program);
    throw new Error('Cross-system program link failed: ' + message);
  }
  return program;
}

function requiredUniform(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
): WebGLUniformLocation {
  const location = gl.getUniformLocation(program, name);
  if (!location) throw new Error('Missing cross-system uniform: ' + name);
  return location;
}

function couplingPulse(
  coupling: RenderOrbCoupling,
  events: readonly RenderEventSample[],
): number {
  let pulse = 0;
  for (const sample of events) {
    if (sample.event.kind !== 'orb-pulse') continue;
    if (
      sample.event.orbId !== coupling.orbAId
      && sample.event.orbId !== coupling.orbBId
    ) {
      continue;
    }
    pulse = Math.max(
      pulse,
      sample.event.intensity * Math.pow(1 - sample.progress, 1.4),
    );
  }
  return pulse;
}

export class WebGLCrossSystemLayer {
  private readonly program: WebGLProgram;
  private readonly buffer: WebGLBuffer;
  private readonly localLocation: number;
  private readonly resolution: WebGLUniformLocation;
  private readonly center: WebGLUniformLocation;
  private readonly halfVector: WebGLUniformLocation;
  private readonly halfWidth: WebGLUniformLocation;
  private readonly colorA: WebGLUniformLocation;
  private readonly colorB: WebGLUniformLocation;
  private readonly strength: WebGLUniformLocation;
  private readonly pulse: WebGLUniformLocation;

  public constructor(private readonly gl: WebGL2RenderingContext) {
    this.program = createProgram(gl);
    const buffer = gl.createBuffer();
    if (!buffer) {
      gl.deleteProgram(this.program);
      throw new Error('Could not allocate cross-system buffer.');
    }
    this.buffer = buffer;
    this.localLocation = gl.getAttribLocation(this.program, 'a_local');
    this.resolution = requiredUniform(gl, this.program, 'u_resolution');
    this.center = requiredUniform(gl, this.program, 'u_center');
    this.halfVector = requiredUniform(gl, this.program, 'u_half_vector');
    this.halfWidth = requiredUniform(gl, this.program, 'u_half_width');
    this.colorA = requiredUniform(gl, this.program, 'u_color_a');
    this.colorB = requiredUniform(gl, this.program, 'u_color_b');
    this.strength = requiredUniform(gl, this.program, 'u_strength');
    this.pulse = requiredUniform(gl, this.program, 'u_pulse');

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1,
      ]),
      gl.STATIC_DRAW,
    );
  }

  public render(
    couplings: readonly RenderOrbCoupling[],
    preferences: Readonly<VisualPreferences>,
    events: readonly RenderEventSample[],
    width: number,
    height: number,
    dpr: number,
  ): void {
    const transitions = deriveTransitionFrame(
      events,
      preferences,
    );

    if (
      couplings.length === 0
      && transitions.beams.length === 0
    ) {
      return;
    }

    const policy = renderPolicyForPreferences(preferences);
    const gl = this.gl;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(this.localLocation);
    gl.vertexAttribPointer(this.localLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(this.resolution, width, height);

    for (const coupling of couplings) {
      const ax = coupling.positionA.x * width;
      const ay = coupling.positionA.y * height;
      const bx = coupling.positionB.x * width;
      const by = coupling.positionB.y * height;
      const halfX = (bx - ax) / 2;
      const halfY = (by - ay) / 2;
      const length = Math.hypot(halfX, halfY);

      if (length <= 3 * dpr) continue;

      const colorA = ROLE_RENDER_COLORS[coupling.roleA];
      const colorB = ROLE_RENDER_COLORS[coupling.roleB];
      const pulse = couplingPulse(coupling, events);
      const glowScale = preferences.reduceBloom
        ? 0.42
        : 0.75 + policy.bloomScale * 0.25;
      const strength = coupling.strength * glowScale;
      const widthPx = (
        10
        + coupling.strength * 18
        + pulse * 7
      ) * dpr;

      gl.uniform2f(
        this.center,
        (ax + bx) / 2,
        (ay + by) / 2,
      );
      gl.uniform2f(this.halfVector, halfX, halfY);
      gl.uniform1f(this.halfWidth, widthPx);
      gl.uniform4f(
        this.colorA,
        colorA[0],
        colorA[1],
        colorA[2],
        colorA[3],
      );
      gl.uniform4f(
        this.colorB,
        colorB[0],
        colorB[1],
        colorB[2],
        colorB[3],
      );
      gl.uniform1f(this.strength, strength);
      gl.uniform1f(this.pulse, pulse);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    for (const beam of transitions.beams) {
      const ax = beam.from.x * width;
      const ay = beam.from.y * height;
      const bx = beam.to.x * width;
      const by = beam.to.y * height;
      const halfX = (bx - ax) / 2;
      const halfY = (by - ay) / 2;

      gl.uniform2f(
        this.center,
        (ax + bx) / 2,
        (ay + by) / 2,
      );
      gl.uniform2f(
        this.halfVector,
        halfX,
        halfY,
      );
      gl.uniform1f(
        this.halfWidth,
        Math.max(
          2 * dpr,
          beam.width * Math.min(width, height),
        ),
      );
      gl.uniform4f(
        this.colorA,
        beam.color[0],
        beam.color[1],
        beam.color[2],
        1,
      );
      gl.uniform4f(
        this.colorB,
        beam.color[0],
        beam.color[1],
        beam.color[2],
        1,
      );
      gl.uniform1f(
        this.strength,
        beam.strength * (
          preferences.reduceBloom ? 0.52 : 1
        ),
      );
      gl.uniform1f(this.pulse, 0.65);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }

  public destroy(): void {
    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteProgram(this.program);
  }
}
