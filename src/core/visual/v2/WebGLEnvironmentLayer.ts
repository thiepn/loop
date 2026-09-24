import type { VisualPreferences } from '../VisualQuality';
import { renderPolicyForPreferences } from './RendererPolicy';
import type {
  EnvironmentDynamics,
  RenderEnvironment,
} from './RenderTypes';

const VERTEX_SOURCE = '#version 300 es\n'
  + 'void main() {\n'
  + '  vec2 position = vec2(\n'
  + '    (gl_VertexID == 1) ? 3.0 : -1.0,\n'
  + '    (gl_VertexID == 2) ? 3.0 : -1.0\n'
  + '  );\n'
  + '  gl_Position = vec4(position, 0.0, 1.0);\n'
  + '}';

const FRAGMENT_SOURCE = '#version 300 es\n'
  + 'precision highp float;\n'
  + 'uniform vec2 u_resolution;\n'
  + 'uniform float u_time_ms;\n'
  + 'uniform vec3 u_primary;\n'
  + 'uniform vec3 u_secondary;\n'
  + 'uniform float u_awake;\n'
  + 'uniform float u_recording;\n'
  + 'uniform float u_density;\n'
  + 'uniform float u_ambience;\n'
  + 'uniform float u_energy;\n'
  + 'uniform float u_bass;\n'
  + 'uniform float u_transient;\n'
  + 'uniform float u_seed;\n'
  + 'uniform float u_particle_scale;\n'
  + 'uniform float u_bloom_scale;\n'
  + 'uniform float u_motion_scale;\n'
  + 'uniform vec2 u_pointer;\n'
  + 'uniform vec2 u_pointer_delta;\n'
  + 'uniform float u_pointer_strength;\n'
  + 'uniform vec2 u_event_position;\n'
  + 'uniform float u_event_strength;\n'
  + 'out vec4 out_color;\n'
  + '\n'
  + 'float hash21(vec2 p) {\n'
  + '  p = fract(p * vec2(123.34, 456.21));\n'
  + '  p += dot(p, p + 45.32 + u_seed * 7.13);\n'
  + '  return fract(p.x * p.y);\n'
  + '}\n'
  + '\n'
  + 'float valueNoise(vec2 p) {\n'
  + '  vec2 i = floor(p);\n'
  + '  vec2 f = fract(p);\n'
  + '  f = f * f * (3.0 - 2.0 * f);\n'
  + '  float a = hash21(i);\n'
  + '  float b = hash21(i + vec2(1.0, 0.0));\n'
  + '  float c = hash21(i + vec2(0.0, 1.0));\n'
  + '  float d = hash21(i + vec2(1.0, 1.0));\n'
  + '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);\n'
  + '}\n'
  + '\n'
  + 'float fbm(vec2 p) {\n'
  + '  float value = valueNoise(p) * 0.58;\n'
  + '  p = p * 2.03 + 11.7;\n'
  + '  value += valueNoise(p) * 0.28;\n'
  + '  p = p * 2.07 + 5.3;\n'
  + '  value += valueNoise(p) * 0.14;\n'
  + '  return value;\n'
  + '}\n'
  + '\n'
  + 'float starLayer(vec2 uv, float grid, float layerSeed, float radius) {\n'
  + '  vec2 scaled = uv * grid;\n'
  + '  vec2 cell = floor(scaled);\n'
  + '  vec2 local = fract(scaled);\n'
  + '  float existence = hash21(cell + layerSeed);\n'
  + '  vec2 point = vec2(\n'
  + '    hash21(cell + layerSeed + 17.3),\n'
  + '    hash21(cell + layerSeed + 41.9)\n'
  + '  );\n'
  + '  float densityGate = 1.0 - 0.085 * u_particle_scale * (1.0 - u_density * 0.42);\n'
  + '  float enabled = step(densityGate, existence);\n'
  + '  float distanceToPoint = length(local - point);\n'
  + '  return enabled * smoothstep(radius, 0.0, distanceToPoint);\n'
  + '}\n'
  + '\n'
  + 'void main() {\n'
  + '  vec2 uv = vec2(\n'
  + '    gl_FragCoord.x / u_resolution.x,\n'
  + '    1.0 - gl_FragCoord.y / u_resolution.y\n'
  + '  );\n'
  + '  float aspect = u_resolution.x / max(1.0, u_resolution.y);\n'
  + '  float awakeMotion = u_motion_scale * (0.18 + u_awake * 0.82);\n'
  + '  float time = u_time_ms * 0.000055 * awakeMotion;\n'
  + '  vec2 parallax = (u_pointer - 0.5) * u_pointer_strength * u_motion_scale;\n'
  + '  float pointerLocal = exp(-dot(uv - u_pointer, uv - u_pointer) * 22.0);\n'
  + '  vec2 warpedUv = uv + u_pointer_delta * pointerLocal * u_pointer_strength * u_motion_scale * 0.11;\n'
  + '  vec2 p = vec2((warpedUv.x - 0.5) * aspect, warpedUv.y - 0.5);\n'
  + '\n'
  + '  vec2 hazeCenterA = vec2(\n'
  + '    -0.22 * aspect + sin(time * 0.73 + u_seed * 5.0) * 0.08,\n'
  + '    -0.12 + cos(time * 0.61 + 1.3) * 0.06\n'
  + '  ) + parallax * vec2(0.20 * aspect, 0.20);\n'
  + '  vec2 hazeCenterB = vec2(\n'
  + '    0.25 * aspect + cos(time * 0.52 + u_seed * 7.0) * 0.09,\n'
  + '    0.16 + sin(time * 0.67 + 2.1) * 0.07\n'
  + '  ) - parallax * vec2(0.32 * aspect, 0.32);\n'
  + '  float hazeA = exp(-dot(p - hazeCenterA, p - hazeCenterA) * 3.2);\n'
  + '  float hazeB = exp(-dot(p - hazeCenterB, p - hazeCenterB) * 3.8);\n'
  + '  float noise = fbm(warpedUv * 3.2 + vec2(time * 0.13, -time * 0.09) + u_seed * 9.0);\n'
  + '  float fog = smoothstep(0.28, 0.78, noise) * (0.42 + u_awake * 0.22);\n'
  + '\n'
  + '  vec2 farUv = warpedUv + parallax * 0.035;\n'
  + '  vec2 nearUv = warpedUv + parallax * 0.11;\n'
  + '  float farStars = starLayer(farUv, 46.0, 3.1, 0.085);\n'
  + '  float nearStars = starLayer(nearUv, 25.0, 9.7, 0.075);\n'
  + '\n'
  + '  float eventGlow = exp(-dot(uv - u_event_position, uv - u_event_position) * 13.0) * u_event_strength;\n'
  + '  float pointerGlow = pointerLocal * u_pointer_strength;\n'
  + '  vec2 listenerP = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);\n'
  + '  float listenerDistance = length(listenerP);\n'
  + '  float bassWave = sin(listenerDistance * 31.0 - u_time_ms * 0.012)\n'
  + '    * exp(-listenerDistance * 3.5) * u_bass;\n'
  + '\n'
  + '  vec3 color = vec3(0.010, 0.011, 0.021);\n'
  + '  color += u_primary * hazeA * (0.055 + u_ambience * 0.085);\n'
  + '  color += u_secondary * hazeB * (0.045 + u_ambience * 0.075);\n'
  + '  color += mix(u_secondary, u_primary, noise) * fog * (0.018 + u_ambience * 0.026);\n'
  + '  color += vec3(0.58, 0.68, 1.0) * farStars * (0.12 + u_awake * 0.07);\n'
  + '  color += vec3(0.76, 0.82, 1.0) * nearStars * (0.10 + u_awake * 0.08);\n'
  + '  color += u_primary * eventGlow * (0.035 + u_energy * 0.10) * (0.45 + u_bloom_scale * 0.55);\n'
  + '  color += u_secondary * pointerGlow * 0.035;\n'
  + '  color += mix(u_secondary, u_primary, 0.45) * abs(bassWave) * 0.045;\n'
  + '  color += vec3(1.0, 0.62, 0.72) * u_transient * 0.012;\n'
  + '  color += vec3(0.18, 0.018, 0.045) * u_recording * 0.16;\n'
  + '  color *= 0.82 + u_awake * 0.10 + u_energy * 0.12;\n'
  + '\n'
  + '  float vignette = smoothstep(1.02, 0.28, length(listenerP));\n'
  + '  color *= 0.73 + vignette * 0.27;\n'
  + '  float grain = (hash21(gl_FragCoord.xy + u_seed * 1000.0) - 0.5) * 0.0045;\n'
  + '  color += grain;\n'
  + '  out_color = vec4(max(color, vec3(0.0)), 1.0);\n'
  + '}';

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error('Could not allocate environment shader.');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader)
      ?? 'Unknown environment shader error.';
    gl.deleteShader(shader);
    throw new Error(
      'Environment shader compile failed: ' + message,
    );
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
    throw new Error('Could not allocate environment program.');
  }

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program)
      ?? 'Unknown environment program error.';
    gl.deleteProgram(program);
    throw new Error(
      'Environment program link failed: ' + message,
    );
  }

  return program;
}

function uniform(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
): WebGLUniformLocation {
  const location = gl.getUniformLocation(program, name);

  if (!location) {
    throw new Error('Missing environment uniform: ' + name);
  }

  return location;
}

export class WebGLEnvironmentLayer {
  private readonly program: WebGLProgram;
  private readonly resolution: WebGLUniformLocation;
  private readonly timeMs: WebGLUniformLocation;
  private readonly primary: WebGLUniformLocation;
  private readonly secondary: WebGLUniformLocation;
  private readonly awake: WebGLUniformLocation;
  private readonly recording: WebGLUniformLocation;
  private readonly density: WebGLUniformLocation;
  private readonly ambience: WebGLUniformLocation;
  private readonly energy: WebGLUniformLocation;
  private readonly bass: WebGLUniformLocation;
  private readonly transient: WebGLUniformLocation;
  private readonly seed: WebGLUniformLocation;
  private readonly particleScale: WebGLUniformLocation;
  private readonly bloomScale: WebGLUniformLocation;
  private readonly motionScale: WebGLUniformLocation;
  private readonly pointer: WebGLUniformLocation;
  private readonly pointerDelta: WebGLUniformLocation;
  private readonly pointerStrength: WebGLUniformLocation;
  private readonly eventPosition: WebGLUniformLocation;
  private readonly eventStrength: WebGLUniformLocation;

  public constructor(
    private readonly gl: WebGL2RenderingContext,
  ) {
    this.program = createProgram(gl);
    this.resolution = uniform(gl, this.program, 'u_resolution');
    this.timeMs = uniform(gl, this.program, 'u_time_ms');
    this.primary = uniform(gl, this.program, 'u_primary');
    this.secondary = uniform(gl, this.program, 'u_secondary');
    this.awake = uniform(gl, this.program, 'u_awake');
    this.recording = uniform(gl, this.program, 'u_recording');
    this.density = uniform(gl, this.program, 'u_density');
    this.ambience = uniform(gl, this.program, 'u_ambience');
    this.energy = uniform(gl, this.program, 'u_energy');
    this.bass = uniform(gl, this.program, 'u_bass');
    this.transient = uniform(gl, this.program, 'u_transient');
    this.seed = uniform(gl, this.program, 'u_seed');
    this.particleScale = uniform(gl, this.program, 'u_particle_scale');
    this.bloomScale = uniform(gl, this.program, 'u_bloom_scale');
    this.motionScale = uniform(gl, this.program, 'u_motion_scale');
    this.pointer = uniform(gl, this.program, 'u_pointer');
    this.pointerDelta = uniform(gl, this.program, 'u_pointer_delta');
    this.pointerStrength = uniform(gl, this.program, 'u_pointer_strength');
    this.eventPosition = uniform(gl, this.program, 'u_event_position');
    this.eventStrength = uniform(gl, this.program, 'u_event_strength');
  }

  public render(
    environment: Readonly<RenderEnvironment>,
    dynamics: Readonly<EnvironmentDynamics>,
    preferences: Readonly<VisualPreferences>,
    timestampMs: number,
    width: number,
    height: number,
    playing: boolean,
    recording: boolean,
  ): void {
    const gl = this.gl;
    const policy = renderPolicyForPreferences(preferences);

    gl.disable(gl.BLEND);
    gl.useProgram(this.program);
    gl.uniform2f(this.resolution, width, height);
    gl.uniform1f(this.timeMs, timestampMs);
    gl.uniform3f(
      this.primary,
      environment.primary[0],
      environment.primary[1],
      environment.primary[2],
    );
    gl.uniform3f(
      this.secondary,
      environment.secondary[0],
      environment.secondary[1],
      environment.secondary[2],
    );
    gl.uniform1f(this.awake, playing ? 1 : 0);
    gl.uniform1f(this.recording, recording ? 1 : 0);
    gl.uniform1f(this.density, environment.density);
    gl.uniform1f(this.ambience, environment.ambience);
    gl.uniform1f(this.energy, dynamics.energy);
    gl.uniform1f(this.bass, dynamics.bassPressure);
    gl.uniform1f(this.transient, dynamics.transient);
    gl.uniform1f(this.seed, environment.seed);
    gl.uniform1f(
      this.particleScale,
      policy.particleScale * environment.particleDensity,
    );
    gl.uniform1f(this.bloomScale, policy.bloomScale);
    gl.uniform1f(
      this.motionScale,
      preferences.reduceMotion ? 0 : 1,
    );
    gl.uniform2f(
      this.pointer,
      dynamics.pointerPosition.x,
      dynamics.pointerPosition.y,
    );
    gl.uniform2f(
      this.pointerDelta,
      dynamics.pointerDelta.x,
      dynamics.pointerDelta.y,
    );
    gl.uniform1f(
      this.pointerStrength,
      dynamics.pointerStrength,
    );
    gl.uniform2f(
      this.eventPosition,
      dynamics.eventPosition.x,
      dynamics.eventPosition.y,
    );
    gl.uniform1f(
      this.eventStrength,
      dynamics.eventStrength,
    );

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  public destroy(): void {
    this.gl.deleteProgram(this.program);
  }
}
