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

const VERTEX_SOURCE = '#version 300 es\n'
  + 'in vec2 a_local;\n'
  + 'uniform vec2 u_resolution;\n'
  + 'uniform vec2 u_center;\n'
  + 'uniform vec2 u_radius;\n'
  + 'out vec2 v_local;\n'
  + 'void main() {\n'
  + '  vec2 position = u_center + a_local * u_radius;\n'
  + '  vec2 zeroToOne = position / u_resolution;\n'
  + '  vec2 clip = zeroToOne * 2.0 - 1.0;\n'
  + '  clip.y = -clip.y;\n'
  + '  gl_Position = vec4(clip, 0.0, 1.0);\n'
  + '  v_local = a_local;\n'
  + '}';

const FRAGMENT_SOURCE = '#version 300 es\n'
  + 'precision highp float;\n'
  + 'in vec2 v_local;\n'
  + 'uniform float u_kind;\n'
  + 'uniform float u_type;\n'
  + 'uniform vec4 u_color_a;\n'
  + 'uniform vec4 u_color_b;\n'
  + 'uniform float u_seed;\n'
  + 'uniform float u_edge_roughness;\n'
  + 'uniform float u_detail;\n'
  + 'uniform float u_selected;\n'
  + 'uniform float u_tension;\n'
  + 'uniform float u_strength;\n'
  + 'uniform float u_simplified;\n'
  + 'uniform float u_toy_type;\n'
  + 'uniform float u_toy_amount;\n'
  + 'uniform float u_orb_energy;\n'
  + 'uniform float u_time_ms;\n'
  + 'uniform float u_motion_scale;\n'
  + 'uniform float u_particle_scale;\n'
  + 'uniform float u_bloom_scale;\n'
  + 'out vec4 out_color;\n'
  + '\n'
  + 'float hash21(vec2 p) {\n'
  + '  p = fract(p * vec2(123.34, 456.21));\n'
  + '  p += dot(p, p + 45.32 + u_seed * 9.7);\n'
  + '  return fract(p.x * p.y);\n'
  + '}\n'
  + '\n'
  + 'float fieldBoundary(float angle, float time) {\n'
  + '  float waveA = sin(angle * (3.0 + floor(u_seed * 4.0)) + time * 0.37 + u_seed * 7.0);\n'
  + '  float waveB = sin(angle * (7.0 + floor(u_seed * 5.0)) - time * 0.23 + u_seed * 13.0);\n'
  + '  float rough = (waveA * 0.62 + waveB * 0.38) * u_edge_roughness * u_motion_scale;\n'
  + '  float toyDelta = 0.0;\n'
  + '  if (u_toy_type > 0.5 && u_toy_type < 1.5) toyDelta = sin(angle * 5.0 + time * 1.5) * u_toy_amount * 0.012;\n'
  + '  else if (u_toy_type > 1.5 && u_toy_type < 2.5) toyDelta = -u_toy_amount * 0.012;\n'
  + '  else if (u_toy_type > 2.5 && u_toy_type < 3.5) toyDelta = u_toy_amount * 0.018;\n'
  + '  else if (u_toy_type > 3.5) toyDelta = sin(angle * 2.0) * u_toy_amount * 0.016;\n'
  + '  return 0.985 + rough + u_tension * 0.024 + toyDelta;\n'
  + '}\n'
  + '\n'
  + 'void main() {\n'
  + '  vec2 q = v_local;\n'
  + '  float d = length(q);\n'
  + '  float angle = atan(q.y, q.x);\n'
  + '  float time = u_time_ms * 0.001 * u_motion_scale;\n'
  + '\n'
  + '  if (u_kind > 0.5) {\n'
  + '    float edge = 1.0 - smoothstep(0.62, 1.0, d);\n'
  + '    if (edge <= 0.001) discard;\n'
  + '    vec3 mixed = mix(u_color_a.rgb, u_color_b.rgb, 0.5);\n'
  + '    float weave = 0.5 + 0.5 * sin((q.x + q.y) * 15.0 + time * 1.2);\n'
  + '    float pulse = 0.5 + 0.5 * cos(d * 20.0 - time * 1.5);\n'
  + '    vec3 color = u_simplified > 0.5\n'
  + '      ? mix(mixed, vec3(0.76, 0.78, 0.96), 0.42)\n'
  + '      : mix(mixed, mix(u_color_a.rgb, u_color_b.rgb, weave), 0.34);\n'
  + '    float alpha = edge * u_strength * (u_simplified > 0.5 ? 0.08 : 0.11 + pulse * 0.035);\n'
  + '    out_color = vec4(color, alpha);\n'
  + '    return;\n'
  + '  }\n'
  + '\n'
  + '  float boundary = fieldBoundary(angle, time);\n'
  + '  float inside = 1.0 - smoothstep(boundary - 0.04, boundary + 0.012, d);\n'
  + '  float rim = smoothstep(boundary - 0.11, boundary - 0.02, d) * inside;\n'
  + '  if (inside <= 0.001) discard;\n'
  + '\n'
  + '  vec3 color = u_color_a.rgb;\n'
  + '  float material = 0.0;\n'
  + '  float alpha = u_color_a.a * (0.34 + inside * 0.66);\n'
  + '\n'
  + '  if (u_type < 0.5) {\n'
  + '    float cloud = hash21(floor((q + 1.0) * (6.0 + u_detail * 4.0))) * 0.55\n'
  + '      + hash21(floor((q + 1.0) * 14.0 + 3.2)) * 0.45;\n'
  + '    float stars = step(0.94 - u_particle_scale * 0.035, hash21(floor((q + 1.0) * 22.0)));\n'
  + '    material = cloud * 0.45 + stars * 0.75;\n'
  + '    color = mix(color, vec3(0.32, 0.58, 1.0), 0.18 + material * 0.22);\n'
  + '    alpha *= 0.62 + material * 0.38;\n'
  + '  } else if (u_type < 1.5) {\n'
  + '    float rings = 0.5 + 0.5 * cos(d * 34.0 - time * 2.1);\n'
  + '    float gate = smoothstep(0.72, 0.98, rings);\n'
  + '    material = gate * (0.35 + u_detail * 0.45);\n'
  + '    color = mix(color, vec3(0.45, 0.92, 1.0), material * 0.35);\n'
  + '    alpha *= 0.62 + material * 0.45;\n'
  + '  } else if (u_type < 2.5) {\n'
  + '    float turbulence = sin(q.x * 15.0 + time * 2.0 + sin(q.y * 11.0 - time))\n'
  + '      * cos(q.y * 13.0 - time * 1.5 + q.x * 4.0);\n'
  + '    material = 0.5 + 0.5 * turbulence;\n'
  + '    color = mix(color, vec3(1.0, 0.2, 0.06), material * 0.48);\n'
  + '    alpha *= 0.68 + material * 0.4;\n'
  + '  } else if (u_type < 3.5) {\n'
  + '    float facets = abs(sin(angle * 6.0 + u_seed * 5.0));\n'
  + '    float fractures = 1.0 - smoothstep(0.035, 0.11, abs(sin(angle * 11.0 + d * 18.0)));\n'
  + '    material = facets * 0.35 + fractures * 0.65;\n'
  + '    color = mix(color, vec3(0.82, 0.95, 1.0), material * 0.5);\n'
  + '    alpha *= 0.65 + material * 0.38;\n'
  + '  } else {\n'
  + '    float threshold = smoothstep(-0.42, 0.48, q.x + sin(q.y * 5.0) * 0.08);\n'
  + '    float bands = 0.5 + 0.5 * sin((q.x - q.y) * 16.0 + u_seed * 8.0);\n'
  + '    material = threshold * 0.58 + bands * 0.18;\n'
  + '    color = mix(vec3(0.03, 0.2, 0.18), vec3(0.24, 0.98, 0.72), threshold);\n'
  + '    color = mix(color, vec3(0.2, 0.65, 0.98), bands * 0.16);\n'
  + '    alpha *= 0.55 + material * 0.38;\n'
  + '  }\n'
  + '\n'
  + '  color += vec3(0.28, 0.34, 0.46) * rim * (0.09 + u_bloom_scale * 0.08);\n'
  + '  color += vec3(0.24, 0.28, 0.36) * u_orb_energy * 0.055 * inside;\n'
  + '  float selectedRing = u_selected * smoothstep(0.03, 0.004, abs(d - min(1.07, boundary + 0.045)));\n'
  + '  color = mix(color, vec3(0.94, 0.96, 1.0), selectedRing * 0.78);\n'
  + '  alpha = max(alpha, selectedRing * 0.7);\n'
  + '  alpha += u_tension * rim * 0.11;\n'
  + '  out_color = vec4(max(color, vec3(0.0)), clamp(alpha * inside, 0.0, 0.48));\n'
  + '}';

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
      'a_local',
    );
    this.resolution = requiredUniform(gl, this.program, 'u_resolution');
    this.center = requiredUniform(gl, this.program, 'u_center');
    this.radius = requiredUniform(gl, this.program, 'u_radius');
    this.kind = requiredUniform(gl, this.program, 'u_kind');
    this.type = requiredUniform(gl, this.program, 'u_type');
    this.colorA = requiredUniform(gl, this.program, 'u_color_a');
    this.colorB = requiredUniform(gl, this.program, 'u_color_b');
    this.seed = requiredUniform(gl, this.program, 'u_seed');
    this.edgeRoughness = requiredUniform(gl, this.program, 'u_edge_roughness');
    this.detail = requiredUniform(gl, this.program, 'u_detail');
    this.selected = requiredUniform(gl, this.program, 'u_selected');
    this.tension = requiredUniform(gl, this.program, 'u_tension');
    this.strength = requiredUniform(gl, this.program, 'u_strength');
    this.simplified = requiredUniform(gl, this.program, 'u_simplified');
    this.toyType = requiredUniform(gl, this.program, 'u_toy_type');
    this.toyAmount = requiredUniform(gl, this.program, 'u_toy_amount');
    this.orbEnergy = requiredUniform(gl, this.program, 'u_orb_energy');
    this.timeMs = requiredUniform(gl, this.program, 'u_time_ms');
    this.motionScale = requiredUniform(gl, this.program, 'u_motion_scale');
    this.particleScale = requiredUniform(gl, this.program, 'u_particle_scale');
    this.bloomScale = requiredUniform(gl, this.program, 'u_bloom_scale');

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
        field.material.edgeRoughness * policy.fieldDetail,
      );
      gl.uniform1f(
        this.detail,
        field.material.detail * policy.fieldDetail,
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
      gl.uniform1f(this.detail, policy.fieldDetail);
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
