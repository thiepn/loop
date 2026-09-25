import type { VisualPreferences } from '../VisualQuality';
import { renderPolicyForPreferences } from './RendererPolicy';
import type { ChoreographyFrame } from './ChoreographyModel';
import type { TransitionFrame } from './TransitionModel';
import type {
  EnvironmentDynamics,
  RenderCrossEnvironment,
  RenderEnvironment,
  RenderFieldEnvironment,
} from './RenderTypes';

const VERTEX_SOURCE = "#version 300 es\nvoid main() {\nvec2 position = vec2(\n(gl_VertexID == 1) ? 3.0 : -1.0,\n(gl_VertexID == 2) ? 3.0 : -1.0\n);\ngl_Position = vec4(position, 0.0, 1.0);\n}";

const FRAGMENT_SOURCE = "#version 300 es\nprecision highp float;\nuniform vec2 u_resolution;\nuniform float u_time_ms;\nuniform vec3 u_primary;\nuniform vec3 u_secondary;\nuniform float u_awake;\nuniform float u_recording;\nuniform float u_density;\nuniform float u_ambience;\nuniform float u_energy;\nuniform float u_bass;\nuniform float u_transient;\nuniform float u_seed;\nuniform float u_particle_scale;\nuniform float u_bloom_scale;\nuniform float u_motion_scale;\nuniform vec2 u_pointer;\nuniform vec2 u_pointer_delta;\nuniform float u_pointer_strength;\nuniform vec2 u_event_position;\nuniform float u_event_strength;\nuniform vec4 u_field_mix;\nuniform float u_field_filter;\nuniform float u_field_overlap;\nuniform vec2 u_force_position;\nuniform float u_force_strength;\nuniform float u_force_mode;\nuniform float u_coupling_energy;\nuniform float u_choreo_wake;\nuniform float u_choreo_settle;\nuniform float u_choreo_pressure;\nuniform float u_choreo_pressure_phase;\nuniform float u_choreo_phrase_build;\nuniform float u_choreo_phrase_release;\nuniform float u_choreo_silence;\nuniform float u_choreo_reentry;\nuniform float u_choreo_bass;\nuniform float u_choreo_harmony;\nuniform float u_choreo_record_start;\nuniform float u_choreo_record_stop;\nuniform float u_transition_energy;\nuniform float u_transition_phase;\nuniform float u_transition_dissolve;\nuniform float u_transition_reconstruct;\nuniform vec2 u_drag_position;\nuniform vec2 u_drag_delta;\nuniform float u_drag_strength;\nuniform vec2 u_spotlight_position;\nuniform float u_spotlight_strength;\nout vec4 out_color;\nfloat hash21(vec2 p) {\np = fract(p * vec2(123.34, 456.21));\np += dot(p, p + 45.32 + u_seed * 7.13);\nreturn fract(p.x * p.y);\n}\nfloat valueNoise(vec2 p) {\nvec2 i = floor(p);\nvec2 f = fract(p);\nf = f * f * (3.0 - 2.0 * f);\nfloat a = hash21(i);\nfloat b = hash21(i + vec2(1.0, 0.0));\nfloat c = hash21(i + vec2(0.0, 1.0));\nfloat d = hash21(i + vec2(1.0, 1.0));\nreturn mix(mix(a, b, f.x), mix(c, d, f.x), f.y);\n}\nfloat fbm(vec2 p) {\nfloat value = valueNoise(p) * 0.58;\np = p * 2.03 + 11.7;\nvalue += valueNoise(p) * 0.28;\np = p * 2.07 + 5.3;\nvalue += valueNoise(p) * 0.14;\nreturn value;\n}\nfloat starLayer(vec2 uv, float grid, float layerSeed, float radius) {\nvec2 scaled = uv * grid;\nvec2 cell = floor(scaled);\nvec2 local = fract(scaled);\nfloat existence = hash21(cell + layerSeed);\nvec2 point = vec2(\nhash21(cell + layerSeed + 17.3),\nhash21(cell + layerSeed + 41.9)\n);\nfloat densityGate = 1.0 - 0.085 * u_particle_scale * (1.0 - u_density * 0.42);\nfloat enabled = step(densityGate, existence);\nfloat distanceToPoint = length(local - point);\nreturn enabled * smoothstep(radius, 0.0, distanceToPoint);\n}\nvoid main() {\nvec2 uv = vec2(\ngl_FragCoord.x / u_resolution.x,\n1.0 - gl_FragCoord.y / u_resolution.y\n);\nfloat aspect = u_resolution.x / max(1.0, u_resolution.y);\nfloat awakeMotion = u_motion_scale * (0.18 + u_awake * 0.82);\nfloat time = u_time_ms * 0.000055 * awakeMotion;\nvec2 parallax = (u_pointer - 0.5) * u_pointer_strength * u_motion_scale;\nfloat pointerLocal = exp(-dot(uv - u_pointer, uv - u_pointer) * 22.0);\nfloat dragLocal = exp(-dot(uv - u_drag_position, uv - u_drag_position) * 30.0);\nvec2 forceDelta = uv - u_force_position;\nfloat forceDistance = max(0.001, length(forceDelta));\nvec2 forceDir = forceDelta / forceDistance;\nvec2 forceTangent = vec2(-forceDir.y, forceDir.x);\nfloat forceLocal = exp(-forceDistance * forceDistance * 24.0) * u_force_strength * u_motion_scale;\nvec2 forceWarp = vec2(0.0);\nif (u_force_mode < 1.5 && u_force_mode > 0.5) forceWarp = forceTangent * forceLocal * 0.02;\nelse if (u_force_mode < 2.5 && u_force_mode > 1.5) forceWarp = -forceDir * forceLocal * 0.018;\nelse if (u_force_mode < 3.5 && u_force_mode > 2.5) forceWarp = forceDir * forceLocal * 0.022;\nelse if (u_force_mode > 3.5) forceWarp = -forceDir * forceLocal * 0.028;\nvec2 warpedUv = uv\n+ u_pointer_delta * pointerLocal * u_pointer_strength * u_motion_scale * 0.11\n+ u_drag_delta * dragLocal * u_drag_strength * u_motion_scale * 0.065\n+ forceWarp;\nvec2 p = vec2((warpedUv.x - 0.5) * aspect, warpedUv.y - 0.5);\nvec2 hazeCenterA = vec2(\n-0.22 * aspect + sin(time * 0.73 + u_seed * 5.0) * 0.08,\n-0.12 + cos(time * 0.61 + 1.3) * 0.06\n) + parallax * vec2(0.20 * aspect, 0.20);\nvec2 hazeCenterB = vec2(\n0.25 * aspect + cos(time * 0.52 + u_seed * 7.0) * 0.09,\n0.16 + sin(time * 0.67 + 2.1) * 0.07\n) - parallax * vec2(0.32 * aspect, 0.32);\nfloat hazeA = exp(-dot(p - hazeCenterA, p - hazeCenterA) * 3.2);\nfloat hazeB = exp(-dot(p - hazeCenterB, p - hazeCenterB) * 3.8);\nfloat noise = fbm(warpedUv * 3.2 + vec2(time * 0.13, -time * 0.09) + u_seed * 9.0);\nfloat fog = smoothstep(0.28, 0.78, noise) * (0.42 + u_awake * 0.22);\nvec2 farUv = warpedUv + parallax * 0.035;\nvec2 nearUv = warpedUv + parallax * 0.11;\nfloat farStars = starLayer(farUv, 46.0, 3.1, 0.085);\nfloat nearStars = starLayer(nearUv, 25.0, 9.7, 0.075);\nfloat eventGlow = exp(-dot(uv - u_event_position, uv - u_event_position) * 13.0) * u_event_strength;\nfloat pointerGlow = pointerLocal * u_pointer_strength;\nfloat dragGlow = dragLocal * u_drag_strength;\nfloat spotlight = exp(-dot(uv - u_spotlight_position, uv - u_spotlight_position) * 10.0) * u_spotlight_strength;\nvec2 listenerP = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);\nfloat listenerDistance = length(listenerP);\nfloat bassWave = sin(listenerDistance * 31.0 - u_time_ms * 0.012)\n* exp(-listenerDistance * 3.5) * u_bass;\nvec3 color = vec3(0.010, 0.011, 0.021);\ncolor += u_primary * hazeA * (0.055 + u_ambience * 0.085);\ncolor += u_secondary * hazeB * (0.045 + u_ambience * 0.075);\ncolor += mix(u_secondary, u_primary, noise) * fog * (0.018 + u_ambience * 0.026);\ncolor += vec3(0.58, 0.68, 1.0) * farStars * (0.12 + u_awake * 0.07);\ncolor += vec3(0.76, 0.82, 1.0) * nearStars * (0.10 + u_awake * 0.08);\ncolor += u_primary * eventGlow * (0.035 + u_energy * 0.10) * (0.45 + u_bloom_scale * 0.55);\ncolor += u_secondary * pointerGlow * 0.035;\ncolor += mix(u_primary, u_secondary, 0.42) * dragGlow * 0.045;\ncolor *= 1.0 - u_spotlight_strength * 0.045;\ncolor += mix(u_primary, vec3(0.76, 0.80, 1.0), 0.22) * spotlight * 0.055;\ncolor += mix(u_secondary, u_primary, 0.45) * abs(bassWave) * 0.045;\ncolor += mix(u_secondary, vec3(1.0, 0.34, 0.18), u_transient) * u_energy * 0.018;\ncolor += vec3(0.18, 0.018, 0.045) * u_recording * 0.16;\ncolor += vec3(0.18, 0.12, 0.42) * u_field_mix.x * 0.045;\ncolor += vec3(0.04, 0.34, 0.42) * u_field_mix.y * (0.018 + 0.008 * sin(time * 2.0));\ncolor += vec3(0.42, 0.08, 0.018) * u_field_mix.z * 0.052;\ncolor += vec3(0.16, 0.34, 0.46) * u_field_mix.w * 0.042;\ncolor += vec3(0.02, 0.34, 0.22) * u_field_filter * 0.038;\ncolor += vec3(0.28, 0.24, 0.48) * u_field_overlap * 0.028;\ncolor += mix(u_primary, u_secondary, 0.5) * u_coupling_energy * 0.025;\nfloat wakeCore = exp(-listenerDistance * 3.2);\nfloat pressureRadius = 0.12 + u_choreo_pressure_phase * 0.74;\nfloat pressureRing = smoothstep(0.055, 0.009, abs(listenerDistance - pressureRadius));\ncolor += mix(u_primary, u_secondary, 0.35) * wakeCore * (u_choreo_wake * 0.075 + u_choreo_reentry * 0.095);\ncolor += mix(u_primary, u_secondary, 0.5) * pressureRing * u_choreo_pressure * 0.075;\ncolor += u_secondary * u_choreo_harmony * 0.05;\ncolor += mix(u_primary, u_secondary, 0.5) * u_choreo_phrase_build * 0.022;\ncolor += mix(u_secondary, vec3(0.78, 0.72, 1.0), 0.35) * u_choreo_phrase_release * 0.06;\ncolor += vec3(0.32, 0.04, 0.09) * u_choreo_record_start * 0.04;\ncolor += vec3(0.12, 0.16, 0.28) * u_choreo_record_stop * 0.028;\nfloat transitionRadius = 0.10 + u_transition_phase * 0.95;\nfloat transitionWave = smoothstep(0.08, 0.012, abs(listenerDistance - transitionRadius));\ncolor += mix(u_primary, vec3(0.72, 0.58, 1.0), 0.42) * transitionWave * u_transition_energy * 0.10;\ncolor += vec3(0.22, 0.18, 0.38) * u_transition_reconstruct * 0.035;\ncolor *= 1.0 - u_transition_dissolve * 0.035;\ncolor += vec3(0.22, 0.3, 0.4) * forceLocal * 0.018;\nfloat vignette = smoothstep(1.02, 0.28, length(listenerP));\ncolor *= 1.0 - u_choreo_settle * 0.07 - u_choreo_silence * 0.10;\ncolor *= 1.0 - u_choreo_bass * (1.0 - vignette) * 0.08;\ncolor *= 0.82 + u_awake * 0.10 + u_energy * 0.12;\ncolor *= 0.73 + vignette * 0.27;\nfloat grain = (hash21(gl_FragCoord.xy + u_seed * 1000.0) - 0.5) * 0.0045;\ncolor += grain;\nout_color = vec4(max(color, vec3(0.0)), 1.0);\n}";

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
  private readonly fieldMix: WebGLUniformLocation;
  private readonly fieldFilter: WebGLUniformLocation;
  private readonly fieldOverlap: WebGLUniformLocation;
  private readonly forcePosition: WebGLUniformLocation;
  private readonly forceStrength: WebGLUniformLocation;
  private readonly forceMode: WebGLUniformLocation;
  private readonly couplingEnergy: WebGLUniformLocation;
  private readonly choreoWake: WebGLUniformLocation;
  private readonly choreoSettle: WebGLUniformLocation;
  private readonly choreoPressure: WebGLUniformLocation;
  private readonly choreoPressurePhase: WebGLUniformLocation;
  private readonly choreoPhraseBuild: WebGLUniformLocation;
  private readonly choreoPhraseRelease: WebGLUniformLocation;
  private readonly choreoSilence: WebGLUniformLocation;
  private readonly choreoReentry: WebGLUniformLocation;
  private readonly choreoBass: WebGLUniformLocation;
  private readonly choreoHarmony: WebGLUniformLocation;
  private readonly choreoRecordStart: WebGLUniformLocation;
  private readonly choreoRecordStop: WebGLUniformLocation;
  private readonly transitionEnergy: WebGLUniformLocation;
  private readonly transitionPhase: WebGLUniformLocation;
  private readonly transitionDissolve: WebGLUniformLocation;
  private readonly transitionReconstruct: WebGLUniformLocation;
  private readonly dragPosition: WebGLUniformLocation;
  private readonly dragDelta: WebGLUniformLocation;
  private readonly dragStrength: WebGLUniformLocation;
  private readonly spotlightPosition: WebGLUniformLocation;
  private readonly spotlightStrength: WebGLUniformLocation;

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
    this.fieldMix = uniform(gl, this.program, 'u_field_mix');
    this.fieldFilter = uniform(gl, this.program, 'u_field_filter');
    this.fieldOverlap = uniform(gl, this.program, 'u_field_overlap');
    this.forcePosition = uniform(gl, this.program, 'u_force_position');
    this.forceStrength = uniform(gl, this.program, 'u_force_strength');
    this.forceMode = uniform(gl, this.program, 'u_force_mode');
    this.couplingEnergy = uniform(gl, this.program, 'u_coupling_energy');
    this.choreoWake = uniform(gl, this.program, 'u_choreo_wake');
    this.choreoSettle = uniform(gl, this.program, 'u_choreo_settle');
    this.choreoPressure = uniform(gl, this.program, 'u_choreo_pressure');
    this.choreoPressurePhase = uniform(gl, this.program, 'u_choreo_pressure_phase');
    this.choreoPhraseBuild = uniform(gl, this.program, 'u_choreo_phrase_build');
    this.choreoPhraseRelease = uniform(gl, this.program, 'u_choreo_phrase_release');
    this.choreoSilence = uniform(gl, this.program, 'u_choreo_silence');
    this.choreoReentry = uniform(gl, this.program, 'u_choreo_reentry');
    this.choreoBass = uniform(gl, this.program, 'u_choreo_bass');
    this.choreoHarmony = uniform(gl, this.program, 'u_choreo_harmony');
    this.choreoRecordStart = uniform(gl, this.program, 'u_choreo_record_start');
    this.choreoRecordStop = uniform(gl, this.program, 'u_choreo_record_stop');
    this.transitionEnergy = uniform(gl, this.program, 'u_transition_energy');
    this.transitionPhase = uniform(gl, this.program, 'u_transition_phase');
    this.transitionDissolve = uniform(gl, this.program, 'u_transition_dissolve');
    this.transitionReconstruct = uniform(gl, this.program, 'u_transition_reconstruct');
    this.dragPosition = uniform(gl, this.program, 'u_drag_position');
    this.dragDelta = uniform(gl, this.program, 'u_drag_delta');
    this.dragStrength = uniform(gl, this.program, 'u_drag_strength');
    this.spotlightPosition = uniform(gl, this.program, 'u_spotlight_position');
    this.spotlightStrength = uniform(gl, this.program, 'u_spotlight_strength');
  }

  public render(
    environment: Readonly<RenderEnvironment>,
    fields: Readonly<RenderFieldEnvironment>,
    cross: Readonly<RenderCrossEnvironment>,
    choreography: Readonly<ChoreographyFrame>,
    transition: Readonly<TransitionFrame>,
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
    gl.uniform4f(
      this.fieldMix,
      fields.space,
      fields.echo,
      fields.heat,
      fields.frost,
    );
    gl.uniform1f(this.fieldFilter, fields.filter);
    gl.uniform1f(this.fieldOverlap, fields.overlap);
    gl.uniform2f(
      this.forcePosition,
      cross.forcePosition.x,
      cross.forcePosition.y,
    );
    gl.uniform1f(this.forceStrength, cross.forceStrength);
    gl.uniform1f(
      this.forceMode,
      (() => {
        switch (cross.forceType) {
          case 'spinner': return 1;
          case 'magnet': return 2;
          case 'repulsor': return 3;
          case 'portal': return 4;
          case null: return 0;
        }
      })(),
    );
    gl.uniform1f(
      this.couplingEnergy,
      cross.couplingEnergy,
    );
    gl.uniform1f(this.choreoWake, choreography.wake);
    gl.uniform1f(this.choreoSettle, choreography.settle);
    gl.uniform1f(this.choreoPressure, choreography.pressure);
    gl.uniform1f(this.choreoPressurePhase, choreography.pressurePhase);
    gl.uniform1f(this.choreoPhraseBuild, choreography.phraseBuild);
    gl.uniform1f(this.choreoPhraseRelease, choreography.phraseRelease);
    gl.uniform1f(this.choreoSilence, choreography.silence);
    gl.uniform1f(this.choreoReentry, choreography.reentry);
    gl.uniform1f(this.choreoBass, choreography.bassCompression);
    gl.uniform1f(this.choreoHarmony, choreography.harmonyBloom);
    gl.uniform1f(this.choreoRecordStart, choreography.recordStart);
    gl.uniform1f(this.choreoRecordStop, choreography.recordStop);
    gl.uniform1f(this.transitionEnergy, transition.worldEnergy);
    gl.uniform1f(
      this.transitionPhase,
      preferences.reduceMotion ? 0.5 : transition.worldPhase,
    );
    gl.uniform1f(this.transitionDissolve, transition.dissolve);
    gl.uniform1f(this.transitionReconstruct, transition.reconstruct);
    gl.uniform2f(
      this.dragPosition,
      dynamics.dragPosition.x,
      dynamics.dragPosition.y,
    );
    gl.uniform2f(
      this.dragDelta,
      dynamics.dragDelta.x,
      dynamics.dragDelta.y,
    );
    gl.uniform1f(
      this.dragStrength,
      dynamics.dragStrength,
    );
    gl.uniform2f(
      this.spotlightPosition,
      dynamics.spotlightPosition.x,
      dynamics.spotlightPosition.y,
    );
    gl.uniform1f(
      this.spotlightStrength,
      dynamics.spotlightStrength,
    );

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  public destroy(): void {
    this.gl.deleteProgram(this.program);
  }
}
