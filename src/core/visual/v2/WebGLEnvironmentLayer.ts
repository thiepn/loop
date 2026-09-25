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

const FRAGMENT_SOURCE = "#version 300 es\nprecision highp float;\nuniform vec2 u32;\nuniform float u40;\nuniform vec3 u41;\nuniform vec3 u35;\nuniform float u45;\nuniform float u36;\nuniform float u42;\nuniform float u39;\nuniform float u44;\nuniform float u46;\nuniform float u37;\nuniform float u47;\nuniform float u14;\nuniform float u29;\nuniform float u27;\nuniform vec2 u43;\nuniform vec2 u22;\nuniform float u10;\nuniform vec2 u15;\nuniform float u16;\nuniform vec4 u38;\nuniform float u28;\nuniform float u23;\nuniform vec2 u17;\nuniform float u18;\nuniform float u33;\nuniform float u12;\nuniform float u30;\nuniform float u24;\nuniform float u13;\nuniform float u1;\nuniform float u3;\nuniform float u2;\nuniform float u19;\nuniform float u20;\nuniform float u31;\nuniform float u21;\nuniform float u4;\nuniform float u6;\nuniform float u9;\nuniform float u11;\nuniform float u5;\nuniform float u0;\nuniform vec2 u25;\nuniform vec2 u34;\nuniform float u26;\nuniform vec2 u7;\nuniform float u8;\nout vec4 o0;\nfloat hash21(vec2 p) {\np = fract(p * vec2(123.34, 456.21));\np += dot(p, p + 45.32 + u47 * 7.13);\nreturn fract(p.x * p.y);\n}\nfloat valueNoise(vec2 p) {\nvec2 i = floor(p);\nvec2 f = fract(p);\nf = f * f * (3.0 - 2.0 * f);\nfloat a = hash21(i);\nfloat b = hash21(i + vec2(1.0, 0.0));\nfloat c = hash21(i + vec2(0.0, 1.0));\nfloat d = hash21(i + vec2(1.0, 1.0));\nreturn mix(mix(a, b, f.x), mix(c, d, f.x), f.y);\n}\nfloat fbm(vec2 p) {\nfloat value = valueNoise(p) * 0.58;\np = p * 2.03 + 11.7;\nvalue += valueNoise(p) * 0.28;\np = p * 2.07 + 5.3;\nvalue += valueNoise(p) * 0.14;\nreturn value;\n}\nfloat starLayer(vec2 uv, float grid, float layerSeed, float radius) {\nvec2 scaled = uv * grid;\nvec2 cell = floor(scaled);\nvec2 local = fract(scaled);\nfloat existence = hash21(cell + layerSeed);\nvec2 point = vec2(\nhash21(cell + layerSeed + 17.3),\nhash21(cell + layerSeed + 41.9)\n);\nfloat densityGate = 1.0 - 0.085 * u14 * (1.0 - u42 * 0.42);\nfloat enabled = step(densityGate, existence);\nfloat distanceToPoint = length(local - point);\nreturn enabled * smoothstep(radius, 0.0, distanceToPoint);\n}\nvoid main() {\nvec2 uv = vec2(\ngl_FragCoord.x / u32.x,\n1.0 - gl_FragCoord.y / u32.y\n);\nfloat aspect = u32.x / max(1.0, u32.y);\nfloat awakeMotion = u27 * (0.18 + u45 * 0.82);\nfloat time = u40 * 0.000055 * awakeMotion;\nvec2 parallax = (u43 - 0.5) * u10 * u27;\nfloat pointerLocal = exp(-dot(uv - u43, uv - u43) * 22.0);\nfloat dragLocal = exp(-dot(uv - u25, uv - u25) * 30.0);\nvec2 forceDelta = uv - u17;\nfloat forceDistance = max(0.001, length(forceDelta));\nvec2 forceDir = forceDelta / forceDistance;\nvec2 forceTangent = vec2(-forceDir.y, forceDir.x);\nfloat forceLocal = exp(-forceDistance * forceDistance * 24.0) * u18 * u27;\nvec2 forceWarp = vec2(0.0);\nif (u33 < 1.5 && u33 > 0.5) forceWarp = forceTangent * forceLocal * 0.02;\nelse if (u33 < 2.5 && u33 > 1.5) forceWarp = -forceDir * forceLocal * 0.018;\nelse if (u33 < 3.5 && u33 > 2.5) forceWarp = forceDir * forceLocal * 0.022;\nelse if (u33 > 3.5) forceWarp = -forceDir * forceLocal * 0.028;\nvec2 warpedUv = uv\n+ u22 * pointerLocal * u10 * u27 * 0.11\n+ u34 * dragLocal * u26 * u27 * 0.065\n+ forceWarp;\nvec2 p = vec2((warpedUv.x - 0.5) * aspect, warpedUv.y - 0.5);\nvec2 hazeCenterA = vec2(\n-0.22 * aspect + sin(time * 0.73 + u47 * 5.0) * 0.08,\n-0.12 + cos(time * 0.61 + 1.3) * 0.06\n) + parallax * vec2(0.20 * aspect, 0.20);\nvec2 hazeCenterB = vec2(\n0.25 * aspect + cos(time * 0.52 + u47 * 7.0) * 0.09,\n0.16 + sin(time * 0.67 + 2.1) * 0.07\n) - parallax * vec2(0.32 * aspect, 0.32);\nfloat hazeA = exp(-dot(p - hazeCenterA, p - hazeCenterA) * 3.2);\nfloat hazeB = exp(-dot(p - hazeCenterB, p - hazeCenterB) * 3.8);\nfloat noise = fbm(warpedUv * 3.2 + vec2(time * 0.13, -time * 0.09) + u47 * 9.0);\nfloat fog = smoothstep(0.28, 0.78, noise) * (0.42 + u45 * 0.22);\nvec2 farUv = warpedUv + parallax * 0.035;\nvec2 nearUv = warpedUv + parallax * 0.11;\nfloat farStars = starLayer(farUv, 46.0, 3.1, 0.085);\nfloat nearStars = starLayer(nearUv, 25.0, 9.7, 0.075);\nfloat eventGlow = exp(-dot(uv - u15, uv - u15) * 13.0) * u16;\nfloat pointerGlow = pointerLocal * u10;\nfloat dragGlow = dragLocal * u26;\nfloat spotlight = exp(-dot(uv - u7, uv - u7) * 10.0) * u8;\nvec2 listenerP = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);\nfloat listenerDistance = length(listenerP);\nfloat bassWave = sin(listenerDistance * 31.0 - u40 * 0.012)\n* exp(-listenerDistance * 3.5) * u46;\nvec3 color = vec3(0.010, 0.011, 0.021);\ncolor += u41 * hazeA * (0.055 + u39 * 0.085);\ncolor += u35 * hazeB * (0.045 + u39 * 0.075);\ncolor += mix(u35, u41, noise) * fog * (0.018 + u39 * 0.026);\ncolor += vec3(0.58, 0.68, 1.0) * farStars * (0.12 + u45 * 0.07);\ncolor += vec3(0.76, 0.82, 1.0) * nearStars * (0.10 + u45 * 0.08);\ncolor += u41 * eventGlow * (0.035 + u44 * 0.10) * (0.45 + u29 * 0.55);\ncolor += u35 * pointerGlow * 0.035;\ncolor += mix(u41, u35, 0.42) * dragGlow * 0.045;\ncolor *= 1.0 - u8 * 0.045;\ncolor += mix(u41, vec3(0.76, 0.80, 1.0), 0.22) * spotlight * 0.055;\ncolor += mix(u35, u41, 0.45) * abs(bassWave) * 0.045;\ncolor += mix(u35, vec3(1.0, 0.34, 0.18), u37) * u44 * 0.018;\ncolor += vec3(0.18, 0.018, 0.045) * u36 * 0.16;\ncolor += vec3(0.18, 0.12, 0.42) * u38.x * 0.045;\ncolor += vec3(0.04, 0.34, 0.42) * u38.y * (0.018 + 0.008 * sin(time * 2.0));\ncolor += vec3(0.42, 0.08, 0.018) * u38.z * 0.052;\ncolor += vec3(0.16, 0.34, 0.46) * u38.w * 0.042;\ncolor += vec3(0.02, 0.34, 0.22) * u28 * 0.038;\ncolor += vec3(0.28, 0.24, 0.48) * u23 * 0.028;\ncolor += mix(u41, u35, 0.5) * u12 * 0.025;\nfloat wakeCore = exp(-listenerDistance * 3.2);\nfloat pressureRadius = 0.12 + u1 * 0.74;\nfloat pressureRing = smoothstep(0.055, 0.009, abs(listenerDistance - pressureRadius));\ncolor += mix(u41, u35, 0.35) * wakeCore * (u30 * 0.075 + u20 * 0.095);\ncolor += mix(u41, u35, 0.5) * pressureRing * u13 * 0.075;\ncolor += u35 * u21 * 0.05;\ncolor += mix(u41, u35, 0.5) * u3 * 0.022;\ncolor += mix(u35, vec3(0.78, 0.72, 1.0), 0.35) * u2 * 0.06;\ncolor += vec3(0.32, 0.04, 0.09) * u4 * 0.04;\ncolor += vec3(0.12, 0.16, 0.28) * u6 * 0.028;\nfloat transitionRadius = 0.10 + u11 * 0.95;\nfloat transitionWave = smoothstep(0.08, 0.012, abs(listenerDistance - transitionRadius));\ncolor += mix(u41, vec3(0.72, 0.58, 1.0), 0.42) * transitionWave * u9 * 0.10;\ncolor += vec3(0.22, 0.18, 0.38) * u0 * 0.035;\ncolor *= 1.0 - u5 * 0.035;\ncolor += vec3(0.22, 0.3, 0.4) * forceLocal * 0.018;\nfloat vignette = smoothstep(1.02, 0.28, length(listenerP));\ncolor *= 1.0 - u24 * 0.07 - u19 * 0.10;\ncolor *= 1.0 - u31 * (1.0 - vignette) * 0.08;\ncolor *= 0.82 + u45 * 0.10 + u44 * 0.12;\ncolor *= 0.73 + vignette * 0.27;\nfloat grain = (hash21(gl_FragCoord.xy + u47 * 1000.0) - 0.5) * 0.0045;\ncolor += grain;\no0 = vec4(max(color, vec3(0.0)), 1.0);\n}";

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
    this.resolution = uniform(gl, this.program, 'u32');
    this.timeMs = uniform(gl, this.program, 'u40');
    this.primary = uniform(gl, this.program, 'u41');
    this.secondary = uniform(gl, this.program, 'u35');
    this.awake = uniform(gl, this.program, 'u45');
    this.recording = uniform(gl, this.program, 'u36');
    this.density = uniform(gl, this.program, 'u42');
    this.ambience = uniform(gl, this.program, 'u39');
    this.energy = uniform(gl, this.program, 'u44');
    this.bass = uniform(gl, this.program, 'u46');
    this.transient = uniform(gl, this.program, 'u37');
    this.seed = uniform(gl, this.program, 'u47');
    this.particleScale = uniform(gl, this.program, 'u14');
    this.bloomScale = uniform(gl, this.program, 'u29');
    this.motionScale = uniform(gl, this.program, 'u27');
    this.pointer = uniform(gl, this.program, 'u43');
    this.pointerDelta = uniform(gl, this.program, 'u22');
    this.pointerStrength = uniform(gl, this.program, 'u10');
    this.eventPosition = uniform(gl, this.program, 'u15');
    this.eventStrength = uniform(gl, this.program, 'u16');
    this.fieldMix = uniform(gl, this.program, 'u38');
    this.fieldFilter = uniform(gl, this.program, 'u28');
    this.fieldOverlap = uniform(gl, this.program, 'u23');
    this.forcePosition = uniform(gl, this.program, 'u17');
    this.forceStrength = uniform(gl, this.program, 'u18');
    this.forceMode = uniform(gl, this.program, 'u33');
    this.couplingEnergy = uniform(gl, this.program, 'u12');
    this.choreoWake = uniform(gl, this.program, 'u30');
    this.choreoSettle = uniform(gl, this.program, 'u24');
    this.choreoPressure = uniform(gl, this.program, 'u13');
    this.choreoPressurePhase = uniform(gl, this.program, 'u1');
    this.choreoPhraseBuild = uniform(gl, this.program, 'u3');
    this.choreoPhraseRelease = uniform(gl, this.program, 'u2');
    this.choreoSilence = uniform(gl, this.program, 'u19');
    this.choreoReentry = uniform(gl, this.program, 'u20');
    this.choreoBass = uniform(gl, this.program, 'u31');
    this.choreoHarmony = uniform(gl, this.program, 'u21');
    this.choreoRecordStart = uniform(gl, this.program, 'u4');
    this.choreoRecordStop = uniform(gl, this.program, 'u6');
    this.transitionEnergy = uniform(gl, this.program, 'u9');
    this.transitionPhase = uniform(gl, this.program, 'u11');
    this.transitionDissolve = uniform(gl, this.program, 'u5');
    this.transitionReconstruct = uniform(gl, this.program, 'u0');
    this.dragPosition = uniform(gl, this.program, 'u25');
    this.dragDelta = uniform(gl, this.program, 'u34');
    this.dragStrength = uniform(gl, this.program, 'u26');
    this.spotlightPosition = uniform(gl, this.program, 'u7');
    this.spotlightStrength = uniform(gl, this.program, 'u8');
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
