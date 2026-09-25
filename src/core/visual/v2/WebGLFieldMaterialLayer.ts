import type { VisualPreferences } from '../VisualQuality';
import type { EffectFieldType } from '../../world/EffectField';
import {
  FIELD_RENDER_COLORS,
} from './RenderPalette';
import { renderPolicyForPreferences } from './RendererPolicy';
import type {
  RenderField,
  RenderFieldIntersection,
} from './RenderTypes';

const TYPE_ID: Record<EffectFieldType, number> = {
  space: 0,
  echo: 1,
  heat: 2,
  frost: 3,
  filter: 4,
};

const VERTEX_SOURCE = "#version 300 es\nin vec2 a0;\nuniform vec2 u4;\nuniform vec2 u15;\nuniform vec2 u16;\nout vec2 v0;\nvoid main() {\nvec2 position = u15 + a0 * u16;\nvec2 zeroToOne = position / u4;\nvec2 clip = zeroToOne * 2.0 - 1.0;\nclip.y = -clip.y;\ngl_Position = vec4(clip, 0.0, 1.0);\nv0 = a0;\n}";

const FRAGMENT_SOURCE = "#version 300 es\nprecision highp float;\nin vec2 v0;\nuniform float u18;\nuniform float u19;\nuniform vec4 u11;\nuniform vec4 u12;\nuniform float u20;\nuniform float u0;\nuniform float u17;\nuniform float u8;\nuniform float u13;\nuniform float u9;\nuniform float u5;\nuniform float u10;\nuniform float u6;\nuniform float u7;\nuniform float u14;\nuniform float u2;\nuniform float u1;\nuniform float u3;\nout vec4 o0;\nfloat hash21(vec2 p) {\np = fract(p * vec2(123.34, 456.21));\np += dot(p, p + 45.32 + u20 * 9.7);\nreturn fract(p.x * p.y);\n}\nfloat fieldBoundary(float angle, float time) {\nfloat waveA = sin(angle * (3.0 + floor(u20 * 4.0)) + time * 0.37 + u20 * 7.0);\nfloat waveB = sin(angle * (7.0 + floor(u20 * 5.0)) - time * 0.23 + u20 * 13.0);\nfloat rough = (waveA * 0.62 + waveB * 0.38) * u0 * u2;\nfloat toyDelta = 0.0;\nif (u10 > 0.5 && u10 < 1.5) toyDelta = sin(angle * 5.0 + time * 1.5) * u6 * 0.012;\nelse if (u10 > 1.5 && u10 < 2.5) toyDelta = -u6 * 0.012;\nelse if (u10 > 2.5 && u10 < 3.5) toyDelta = u6 * 0.018;\nelse if (u10 > 3.5) toyDelta = sin(angle * 2.0) * u6 * 0.016;\nreturn 0.985 + rough + u13 * 0.024 + toyDelta;\n}\nvoid main() {\nvec2 q = v0;\nfloat d = length(q);\nfloat angle = atan(q.y, q.x);\nfloat time = u14 * 0.001 * u2;\nif (u18 > 0.5) {\nfloat edge = 1.0 - smoothstep(0.62, 1.0, d);\nif (edge <= 0.001) discard;\nvec3 mixed = mix(u11.rgb, u12.rgb, 0.5);\nfloat weave = 0.5 + 0.5 * sin((q.x + q.y) * 15.0 + time * 1.2);\nfloat pulse = 0.5 + 0.5 * cos(d * 20.0 - time * 1.5);\nvec3 color = u5 > 0.5\n? mix(mixed, vec3(0.76, 0.78, 0.96), 0.42)\n: mix(mixed, mix(u11.rgb, u12.rgb, weave), 0.34);\nfloat alpha = edge * u9 * (u5 > 0.5 ? 0.08 : 0.11 + pulse * 0.035);\no0 = vec4(color, alpha);\nreturn;\n}\nfloat boundary = fieldBoundary(angle, time);\nfloat inside = 1.0 - smoothstep(boundary - 0.04, boundary + 0.012, d);\nfloat rim = smoothstep(boundary - 0.11, boundary - 0.02, d) * inside;\nif (inside <= 0.001) discard;\nvec3 color = u11.rgb;\nfloat material = 0.0;\nfloat alpha = u11.a * (0.34 + inside * 0.66);\nif (u19 < 0.5) {\nfloat cloud = hash21(floor((q + 1.0) * (6.0 + u17 * 4.0))) * 0.55\n+ hash21(floor((q + 1.0) * 14.0 + 3.2)) * 0.45;\nfloat stars = step(0.94 - u1 * 0.035, hash21(floor((q + 1.0) * 22.0)));\nmaterial = cloud * 0.45 + stars * 0.75;\ncolor = mix(color, vec3(0.32, 0.58, 1.0), 0.18 + material * 0.22);\nalpha *= 0.62 + material * 0.38;\n} else if (u19 < 1.5) {\nfloat rings = 0.5 + 0.5 * cos(d * 34.0 - time * 2.1);\nfloat gate = smoothstep(0.72, 0.98, rings);\nmaterial = gate * (0.35 + u17 * 0.45);\ncolor = mix(color, vec3(0.45, 0.92, 1.0), material * 0.35);\nalpha *= 0.62 + material * 0.45;\n} else if (u19 < 2.5) {\nfloat turbulence = sin(q.x * 15.0 + time * 2.0 + sin(q.y * 11.0 - time))\n* cos(q.y * 13.0 - time * 1.5 + q.x * 4.0);\nmaterial = 0.5 + 0.5 * turbulence;\ncolor = mix(color, vec3(1.0, 0.2, 0.06), material * 0.48);\nalpha *= 0.68 + material * 0.4;\n} else if (u19 < 3.5) {\nfloat facets = abs(sin(angle * 6.0 + u20 * 5.0));\nfloat fractures = 1.0 - smoothstep(0.035, 0.11, abs(sin(angle * 11.0 + d * 18.0)));\nmaterial = facets * 0.35 + fractures * 0.65;\ncolor = mix(color, vec3(0.82, 0.95, 1.0), material * 0.5);\nalpha *= 0.65 + material * 0.38;\n} else {\nfloat threshold = smoothstep(-0.42, 0.48, q.x + sin(q.y * 5.0) * 0.08);\nfloat bands = 0.5 + 0.5 * sin((q.x - q.y) * 16.0 + u20 * 8.0);\nmaterial = threshold * 0.58 + bands * 0.18;\ncolor = mix(vec3(0.03, 0.2, 0.18), vec3(0.24, 0.98, 0.72), threshold);\ncolor = mix(color, vec3(0.2, 0.65, 0.98), bands * 0.16);\nalpha *= 0.55 + material * 0.38;\n}\ncolor += vec3(0.28, 0.34, 0.46) * rim * (0.09 + u3 * 0.08);\ncolor += vec3(0.24, 0.28, 0.36) * u7 * 0.055 * inside;\nfloat selectedRing = u8 * smoothstep(0.03, 0.004, abs(d - min(1.07, boundary + 0.045)));\ncolor = mix(color, vec3(0.94, 0.96, 1.0), selectedRing * 0.78);\nalpha = max(alpha, selectedRing * 0.7);\nalpha += u13 * rim * 0.11;\no0 = vec4(max(color, vec3(0.0)), clamp(alpha * inside, 0.0, 0.48));\n}";

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error('Could not allocate Field shader.');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader)
      ?? 'Unknown Field shader error.';
    gl.deleteShader(shader);
    throw new Error('Field shader compile failed: ' + message);
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
    throw new Error('Could not allocate Field program.');
  }

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program)
      ?? 'Unknown Field program error.';
    gl.deleteProgram(program);
    throw new Error('Field program link failed: ' + message);
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
    throw new Error('Missing Field uniform: ' + name);
  }

  return location;
}

export class WebGLFieldMaterialLayer {
  private readonly program: WebGLProgram;
  private readonly buffer: WebGLBuffer;
  private readonly localLocation: number;
  private readonly resolution: WebGLUniformLocation;
  private readonly center: WebGLUniformLocation;
  private readonly radius: WebGLUniformLocation;
  private readonly kind: WebGLUniformLocation;
  private readonly type: WebGLUniformLocation;
  private readonly colorA: WebGLUniformLocation;
  private readonly colorB: WebGLUniformLocation;
  private readonly seed: WebGLUniformLocation;
  private readonly edgeRoughness: WebGLUniformLocation;
  private readonly detail: WebGLUniformLocation;
  private readonly selected: WebGLUniformLocation;
  private readonly tension: WebGLUniformLocation;
  private readonly strength: WebGLUniformLocation;
  private readonly simplified: WebGLUniformLocation;
  private readonly toyType: WebGLUniformLocation;
  private readonly toyAmount: WebGLUniformLocation;
  private readonly orbEnergy: WebGLUniformLocation;
  private readonly timeMs: WebGLUniformLocation;
  private readonly motionScale: WebGLUniformLocation;
  private readonly particleScale: WebGLUniformLocation;
  private readonly bloomScale: WebGLUniformLocation;

  public constructor(
    private readonly gl: WebGL2RenderingContext,
  ) {
    this.program = createProgram(gl);
    const buffer = gl.createBuffer();

    if (!buffer) {
      gl.deleteProgram(this.program);
      throw new Error('Could not allocate Field buffer.');
    }

    this.buffer = buffer;
    this.localLocation = gl.getAttribLocation(
      this.program,
      'a0',
    );
    this.resolution = requiredUniform(gl, this.program, 'u4');
    this.center = requiredUniform(gl, this.program, 'u15');
    this.radius = requiredUniform(gl, this.program, 'u16');
    this.kind = requiredUniform(gl, this.program, 'u18');
    this.type = requiredUniform(gl, this.program, 'u19');
    this.colorA = requiredUniform(gl, this.program, 'u11');
    this.colorB = requiredUniform(gl, this.program, 'u12');
    this.seed = requiredUniform(gl, this.program, 'u20');
    this.edgeRoughness = requiredUniform(gl, this.program, 'u0');
    this.detail = requiredUniform(gl, this.program, 'u17');
    this.selected = requiredUniform(gl, this.program, 'u8');
    this.tension = requiredUniform(gl, this.program, 'u13');
    this.strength = requiredUniform(gl, this.program, 'u9');
    this.simplified = requiredUniform(gl, this.program, 'u5');
    this.toyType = requiredUniform(gl, this.program, 'u10');
    this.toyAmount = requiredUniform(gl, this.program, 'u6');
    this.orbEnergy = requiredUniform(gl, this.program, 'u7');
    this.timeMs = requiredUniform(gl, this.program, 'u14');
    this.motionScale = requiredUniform(gl, this.program, 'u2');
    this.particleScale = requiredUniform(gl, this.program, 'u1');
    this.bloomScale = requiredUniform(gl, this.program, 'u3');

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.14, -1.14,
        1.14, -1.14,
        -1.14, 1.14,
        -1.14, 1.14,
        1.14, -1.14,
        1.14, 1.14,
      ]),
      gl.STATIC_DRAW,
    );
  }

  public render(
    fields: readonly RenderField[],
    intersections: readonly RenderFieldIntersection[],
    preferences: Readonly<VisualPreferences>,
    timestampMs: number,
    width: number,
    height: number,
    detailScale: number,
  ): void {
    if (fields.length === 0) {
      return;
    }

    const gl = this.gl;
    const policy = renderPolicyForPreferences(preferences);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(this.localLocation);
    gl.vertexAttribPointer(
      this.localLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0,
    );
    gl.uniform2f(this.resolution, width, height);
    gl.uniform1f(this.timeMs, timestampMs);
    gl.uniform1f(
      this.motionScale,
      preferences.reduceMotion ? 0 : 1,
    );
    gl.uniform1f(
      this.particleScale,
      preferences.reduceParticles ? 0 : policy.particleScale,
    );
    gl.uniform1f(this.bloomScale, policy.bloomScale);

    for (const field of fields) {
      const color = FIELD_RENDER_COLORS[field.type];

      gl.uniform1f(this.kind, 0);
      gl.uniform1f(this.type, TYPE_ID[field.type]);
      gl.uniform2f(
        this.center,
        field.position.x * width,
        field.position.y * height,
      );
      gl.uniform2f(
        this.radius,
        field.radius * width,
        field.radius * height,
      );
      gl.uniform4f(
        this.colorA,
        color[0],
        color[1],
        color[2],
        color[3],
      );
      gl.uniform4f(
        this.colorB,
        color[0],
        color[1],
        color[2],
        color[3],
      );
      gl.uniform1f(this.seed, field.material.seed);
      gl.uniform1f(
        this.edgeRoughness,
        field.material.edgeRoughness
          * Math.max(
            policy.fieldDetail * detailScale,
            field.selected ? 0.92 : 0,
          ),
      );
      gl.uniform1f(
        this.detail,
        field.material.detail
          * Math.max(
            policy.fieldDetail * detailScale,
            field.selected ? 0.92 : 0,
          ),
      );
      gl.uniform1f(this.selected, field.selected ? 1 : 0);
      gl.uniform1f(
        this.tension,
        field.interaction.tension,
      );
      gl.uniform1f(this.strength, 1);
      gl.uniform1f(this.simplified, 0);
      gl.uniform1f(
        this.toyType,
        (() => {
          switch (field.cross.toyInfluence?.type ?? null) {
            case 'spinner': return 1;
            case 'magnet': return 2;
            case 'repulsor': return 3;
            case 'portal': return 4;
            case null: return 0;
          }
        })(),
      );
      gl.uniform1f(
        this.toyAmount,
        field.cross.toyInfluence?.amount ?? 0,
      );
      gl.uniform1f(
        this.orbEnergy,
        field.cross.nearbyOrbEnergy,
      );
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    for (const intersection of intersections) {
      const a = FIELD_RENDER_COLORS[intersection.typeA];
      const b = FIELD_RENDER_COLORS[intersection.typeB];

      gl.uniform1f(this.kind, 1);
      gl.uniform1f(this.type, -1);
      gl.uniform2f(
        this.center,
        intersection.position.x * width,
        intersection.position.y * height,
      );
      gl.uniform2f(
        this.radius,
        intersection.radius * width * 1.25,
        intersection.radius * height * 1.25,
      );
      gl.uniform4f(this.colorA, a[0], a[1], a[2], a[3]);
      gl.uniform4f(this.colorB, b[0], b[1], b[2], b[3]);
      gl.uniform1f(this.seed, intersection.strength);
      gl.uniform1f(this.edgeRoughness, 0);
      gl.uniform1f(
        this.detail,
        policy.fieldDetail * detailScale,
      );
      gl.uniform1f(this.selected, 0);
      gl.uniform1f(this.tension, 0);
      gl.uniform1f(this.strength, intersection.strength);
      gl.uniform1f(
        this.simplified,
        intersection.simplified ? 1 : 0,
      );
      gl.uniform1f(this.toyType, 0);
      gl.uniform1f(this.toyAmount, 0);
      gl.uniform1f(this.orbEnergy, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }

  public destroy(): void {
    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteProgram(this.program);
  }
}
