import type { VisualPreferences } from '../VisualQuality';
import type { SoundRole } from '../../sounds/SoundDefinition';
import { ROLE_RENDER_COLORS } from './RenderPalette';
import { transientOrbInteraction } from './InteractionModel';
import { objectChoreographyEmphasis } from './ChoreographyModel';
import { renderPolicyForPreferences } from './RendererPolicy';
import { orbDiameterPixels } from './RenderMetrics';
import type {
  RenderEventSample,
  RenderOrb,
} from './RenderTypes';

const ROLE_ID: Record<SoundRole, number> = {
  beat: 0,
  percussion: 1,
  bass: 2,
  harmony: 3,
  melody: 4,
  texture: 5,
  voice: 6,
};

const VERTEX_SOURCE = "#version 300 es\nin vec2 a_local;\nuniform vec2 u_resolution;\nuniform vec2 u_center;\nuniform float u_radius;\nuniform vec2 u_hover_offset;\nuniform float u_hover;\nuniform float u_grabbed;\nuniform vec2 u_drag_dir;\nuniform float u_drag_speed;\nuniform vec2 u_settle_dir;\nuniform float u_settle;\nuniform float u_motion_scale;\nout vec2 v_local;\nvoid main() {\nvec2 direction = length(u_drag_dir) > 0.001\n? normalize(u_drag_dir)\n: vec2(1.0, 0.0);\nvec2 perpendicular = vec2(-direction.y, direction.x);\nfloat along = dot(a_local, direction);\nfloat across = dot(a_local, perpendicular);\nfloat stretch = u_drag_speed * u_motion_scale;\nvec2 local = direction * along * (1.0 + stretch * 0.16)\n+ perpendicular * across * (1.0 - stretch * 0.07);\nfloat lift = 1.0 + u_hover * 0.026 + u_grabbed * 0.055;\nvec2 hoverShift = u_hover_offset * 4.0 * u_motion_scale;\nvec2 settleShift = u_settle_dir * u_settle * u_radius * 0.11 * u_motion_scale;\nvec2 position = u_center + hoverShift + settleShift + local * u_radius * lift;\nvec2 zeroToOne = position / u_resolution;\nvec2 clip = zeroToOne * 2.0 - 1.0;\nclip.y = -clip.y;\ngl_Position = vec4(clip, 0.0, 1.0);\nv_local = a_local;\n}";

const FRAGMENT_SOURCE = "#version 300 es\nprecision highp float;\nin vec2 v_local;\nuniform vec4 u_color;\nuniform float u_role;\nuniform float u_energy;\nuniform float u_brightness;\nuniform float u_density;\nuniform float u_groove;\nuniform float u_contour;\nuniform float u_spread;\nuniform float u_variation;\nuniform float u_seed;\nuniform float u_selected;\nuniform float u_focused;\nuniform float u_muted;\nuniform float u_grabbed;\nuniform float u_hover;\nuniform float u_charge;\nuniform float u_scene_selected;\nuniform float u_pulse;\nuniform float u_pulse_progress;\nuniform float u_detail;\nuniform float u_motion_scale;\nuniform float u_fx_space;\nuniform float u_fx_echo;\nuniform float u_fx_heat;\nuniform float u_fx_frost;\nuniform float u_fx_filter;\nuniform float u_aura_blend;\nuniform float u_neighbor_light;\nuniform vec2 u_neighbor_dir;\nuniform float u_wake_strength;\nuniform vec2 u_wake_dir;\nuniform float u_toy_type;\nuniform float u_toy_amount;\nuniform float u_choreo_energy;\nuniform float u_choreo_settle;\nuniform float u_time_ms;\nuniform float u_pattern[16];\nout vec4 out_color;\nfloat hash21(vec2 p) {\np = fract(p * vec2(123.34, 456.21));\np += dot(p, p + 45.32 + u_seed * 19.7);\nreturn fract(p.x * p.y);\n}\nfloat materialBoundary(float angle, float time) {\nfloat boundary = 0.94;\nif (u_role < 0.5) {\nboundary += 0.034 * cos(angle * 4.0 + u_variation * 2.0);\nboundary += u_pulse * 0.065;\n} else if (u_role < 1.5) {\nboundary = 0.89 + 0.058 * cos(angle * 8.0 + u_seed * 6.28);\nboundary += u_pulse * 0.025;\n} else if (u_role < 2.5) {\nboundary = 0.98\n+ 0.035 * sin(angle * 2.0 + time * 0.8 + u_seed * 5.0)\n+ u_pulse * 0.075;\n} else if (u_role < 3.5) {\nboundary = 0.95\n+ 0.052 * cos(angle * 3.0 + time * 0.28)\n+ u_pulse * 0.04;\n} else if (u_role < 4.5) {\nboundary = 0.90\n+ 0.024 * sin(angle * 5.0 + u_contour * 2.4)\n+ u_pulse * 0.04;\n} else if (u_role < 5.5) {\nboundary = 1.00\n+ 0.035 * sin(angle * 3.0 - time * 0.22)\n+ 0.022 * sin(angle * 7.0 + u_seed * 9.0);\n} else {\nboundary = 0.94\n+ 0.052 * sin(angle * 2.0 + 0.8 + time * 0.2)\n+ 0.026 * sin(angle * 5.0 - time * 0.32)\n+ u_pulse * 0.045;\n}\nboundary += u_fx_space * 0.018;\nboundary += u_fx_heat * 0.028 * sin(angle * 5.0 + time * 2.1);\nboundary -= u_fx_frost * 0.012 * (0.5 + 0.5 * cos(angle * 8.0));\nboundary -= u_fx_filter * 0.008;\nfloat wakeAngle = atan(u_wake_dir.y, u_wake_dir.x);\nboundary += u_wake_strength * 0.022 * cos(angle - wakeAngle);\nif (u_toy_type > 0.5 && u_toy_type < 1.5) {\nboundary += u_toy_amount * 0.016 * sin(angle * 4.0 + time * 1.7);\n} else if (u_toy_type > 1.5 && u_toy_type < 2.5) {\nboundary -= u_toy_amount * 0.018;\n} else if (u_toy_type > 2.5 && u_toy_type < 3.5) {\nboundary += u_toy_amount * 0.026;\n}\nboundary += u_choreo_energy * 0.012;\nboundary -= u_choreo_settle * 0.008;\nreturn boundary;\n}\nvoid main() {\nfloat motionTime = u_time_ms * 0.001 * u_motion_scale;\nvec2 q = v_local;\nif (u_role < 0.5) {\nq.y *= 1.0 + u_pulse * 0.07;\n} else if (u_role > 1.5 && u_role < 2.5) {\nq.x *= 1.0 - u_pulse * 0.055;\n} else if (u_role > 3.5 && u_role < 4.5) {\nq.y *= 1.0 - u_pulse * 0.04;\n}\nfloat angle = atan(q.y, q.x);\nfloat d = length(q);\nfloat boundary = materialBoundary(angle, motionTime);\nfloat body = 1.0 - smoothstep(boundary - 0.055, boundary + 0.018, d);\nfloat outside = max(0.0, d - boundary);\nfloat aura = exp(-outside * (6.0 + u_muted * 4.0))\n* (1.0 - smoothstep(1.0, 1.43 + u_aura_blend * 0.08, d));\nfloat alpha = aura * (0.08 + u_energy * 0.08 + u_fx_space * 0.035 + u_aura_blend * 0.045) + body * 0.94;\nvec3 color = u_color.rgb;\nfloat radialLight = clamp(1.18 - d * 0.5, 0.55, 1.15);\ncolor *= radialLight * (0.82 + u_brightness * 0.28);\ncolor += vec3(0.24, 0.28, 0.34) * max(0.0, 0.34 - d) * 0.6;\nvec2 directionQ = length(q) > 0.001 ? normalize(q) : vec2(0.0);\nfloat neighborFacing = max(0.0, dot(directionQ, normalize(u_neighbor_dir + vec2(0.0001))));\ncolor += vec3(0.18, 0.22, 0.3) * u_neighbor_light * (0.05 + neighborFacing * 0.12);\ncolor += vec3(0.22, 0.24, 0.34) * u_aura_blend * 0.035;\ncolor = mix(color, vec3(0.48, 0.4, 1.0), u_fx_space * 0.16);\ncolor = mix(color, vec3(0.38, 0.9, 1.0), u_fx_echo * 0.12);\ncolor = mix(color, vec3(1.0, 0.28, 0.08), u_fx_heat * 0.34);\ncolor = mix(color, vec3(0.78, 0.94, 1.0), u_fx_frost * 0.42);\ncolor = mix(color, vec3(0.18, 0.78, 0.58), u_fx_filter * 0.24);\nif (u_toy_type > 0.5 && u_toy_type < 1.5) color = mix(color, vec3(0.66, 0.55, 0.98), u_toy_amount * 0.10);\nelse if (u_toy_type > 1.5 && u_toy_type < 2.5) color = mix(color, vec3(0.20, 0.83, 0.60), u_toy_amount * 0.12);\nelse if (u_toy_type > 2.5 && u_toy_type < 3.5) color = mix(color, vec3(0.98, 0.44, 0.52), u_toy_amount * 0.12);\nelse if (u_toy_type > 3.5) color = mix(color, vec3(0.13, 0.83, 0.93), u_toy_amount * 0.16);\ncolor *= 1.0 - u_fx_filter * 0.12;\ncolor *= 1.0 + u_choreo_energy * 0.055 - u_choreo_settle * 0.04;\nalpha *= 1.0 + u_choreo_energy * 0.025 - u_choreo_settle * 0.045;\nalpha *= 1.0 - step(3.5, u_toy_type) * u_toy_amount * 0.08;\nfloat stepFloat = (angle + 3.14159265 + (u_groove - 0.5) * 0.08) / 6.2831853 * 16.0;\nint stepIndex = int(clamp(floor(stepFloat), 0.0, 15.0));\nfloat stepLocal = abs(fract(stepFloat) - 0.5);\nfloat patternValue = u_pattern[stepIndex];\nfloat active = step(0.0, patternValue);\nfloat patternMark = 0.0;\nif (u_role < 1.5) {\npatternMark = active\n* smoothstep(0.23, 0.06, stepLocal)\n* smoothstep(0.07, 0.012, abs(d - 0.72));\n} else if (u_role < 5.0 || u_role > 5.5) {\nfloat target = 0.27 + max(patternValue, 0.0) * 0.48;\npatternMark = active\n* smoothstep(0.20, 0.055, stepLocal)\n* smoothstep(0.065, 0.015, abs(d - target));\n}\nfloat internal = 0.0;\nif (u_role < 0.5) {\ninternal = smoothstep(0.06, 0.0, abs(sin(angle * 4.0) * 0.5 + d - 0.48));\n} else if (u_role < 1.5) {\nfloat grain = hash21(floor((q + 1.2) * 13.0 + motionTime * 0.3));\ninternal = step(0.82 - u_density * 0.18, grain) * body;\n} else if (u_role < 2.5) {\ninternal = 0.5 + 0.5 * sin(d * 18.0 - motionTime * 1.4 + u_seed * 7.0);\ninternal *= smoothstep(boundary, 0.18, d);\n} else if (u_role < 3.5) {\nfloat rings = 1.0 - abs(sin(d * (12.0 + u_spread * 5.0) - motionTime * 0.5));\nfloat petals = 0.5 + 0.5 * cos(angle * 3.0 + motionTime * 0.32);\ninternal = rings * petals * body;\n} else if (u_role < 4.5) {\nfloat filament = abs(q.y - sin(q.x * 5.2 + u_contour * 2.0 + motionTime * 0.8) * 0.17);\ninternal = smoothstep(0.055, 0.008, filament) * body;\n} else if (u_role < 5.5) {\nfloat cloud = hash21(q * 7.0 + motionTime * 0.08)\n+ hash21(q * 15.0 - motionTime * 0.05) * 0.5;\ninternal = smoothstep(0.58, 1.28, cloud) * body;\n} else {\nfloat ribbonA = abs(q.y - sin(q.x * 4.0 + motionTime * 0.62 + u_seed * 3.0) * 0.18);\nfloat ribbonB = abs(q.y - cos(q.x * 3.0 - motionTime * 0.44) * 0.28);\ninternal = (smoothstep(0.06, 0.012, ribbonA) + smoothstep(0.05, 0.01, ribbonB) * 0.55) * body;\n}\ncolor += vec3(0.32, 0.34, 0.38)\n* (patternMark * (0.42 + u_detail * 0.58) + internal * 0.20 * u_detail);\ncolor *= 1.0\n+ u_pulse * (0.16 + u_brightness * 0.16)\n+ u_hover * 0.035\n+ u_grabbed * 0.075\n+ u_charge * 0.09;\ncolor *= 1.0 - u_scene_selected * (1.0 - u_selected) * 0.10;\nalpha *= 1.0 - u_scene_selected * (1.0 - u_selected) * 0.08;\nfloat pulseRing = u_pulse\n* smoothstep(0.035, 0.006, abs(d - (1.03 + u_pulse_progress * 0.24)));\ncolor += vec3(0.34, 0.38, 0.46) * pulseRing;\nalpha = max(alpha, pulseRing * 0.42);\nfloat echoRingA = u_fx_echo * smoothstep(0.035, 0.007, abs(d - 1.10));\nfloat echoRingB = u_fx_echo * smoothstep(0.04, 0.009, abs(d - 1.26));\ncolor += vec3(0.32, 0.88, 1.0) * (echoRingA * 0.28 + echoRingB * 0.18);\nalpha = max(alpha, echoRingA * 0.34 + echoRingB * 0.22);\nfloat frostFacet = u_fx_frost * (0.5 + 0.5 * cos(angle * 8.0)) * body;\ncolor += vec3(0.62, 0.82, 0.96) * frostFacet * 0.12;\nif (u_role > 3.5 && u_role < 4.5) {\nfloat satelliteA = smoothstep(0.105, 0.025, length(q - vec2(0.98, -0.28)));\nfloat satelliteB = smoothstep(0.085, 0.022, length(q - vec2(-0.88, 0.44)));\nfloat satellites = (satelliteA + satelliteB) * (0.45 + u_density * 0.55);\ncolor += u_color.rgb * satellites * u_detail;\nalpha = max(alpha, satellites * 0.88);\n}\nfloat chargeRing = u_charge\n* smoothstep(0.032, 0.005, abs(d - (1.06 + u_charge * 0.05)));\ncolor += u_color.rgb * chargeRing * 0.48;\nalpha = max(alpha, chargeRing * 0.72);\nfloat focusDash = step(0.0, sin(angle * 12.0));\nfloat focusRing = u_focused * focusDash\n* smoothstep(0.022, 0.004, abs(d - 1.10));\nfloat selectionRing = u_selected\n* smoothstep(0.025, 0.004, abs(d - 1.18));\ncolor = mix(color, vec3(0.88, 0.92, 1.0), focusRing * 0.72);\ncolor = mix(color, vec3(0.94, 0.96, 1.0), selectionRing * 0.86);\nalpha = max(alpha, focusRing * 0.8);\nalpha = max(alpha, selectionRing * 0.88);\nif (u_muted > 0.5) {\nfloat gray = dot(color, vec3(0.299, 0.587, 0.114));\ncolor = mix(color, vec3(gray), 0.68);\nalpha *= 0.38;\n}\nif (d > 1.44 && selectionRing < 0.01) discard;\nout_color = vec4(max(color, vec3(0.0)), clamp(alpha, 0.0, 1.0));\n}";

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error('Could not allocate Orb material shader.');
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader)
      ?? 'Unknown Orb material shader error.';
    gl.deleteShader(shader);
    throw new Error(
      'Orb material shader compile failed: ' + message,
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
    throw new Error('Could not allocate Orb material program.');
  }

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program)
      ?? 'Unknown Orb material program error.';
    gl.deleteProgram(program);
    throw new Error(
      'Orb material program link failed: ' + message,
    );
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
    throw new Error('Missing Orb material uniform: ' + name);
  }

  return location;
}

interface PulseState {
  readonly amount: number;
  readonly progress: number;
}

function pulseForOrb(
  orbId: string,
  events: readonly RenderEventSample[],
): PulseState {
  let amount = 0;
  let progress = 1;

  for (const sample of events) {
    if (
      sample.event.kind !== 'orb-pulse'
      || sample.event.orbId !== orbId
    ) {
      continue;
    }

    const candidate = sample.event.intensity
      * Math.pow(1 - sample.progress, 1.65);

    if (candidate > amount) {
      amount = candidate;
      progress = sample.progress;
    }
  }

  return { amount, progress };
}

export class WebGLOrbMaterialLayer {
  private readonly program: WebGLProgram;
  private readonly buffer: WebGLBuffer;
  private readonly localLocation: number;
  private readonly resolution: WebGLUniformLocation;
  private readonly center: WebGLUniformLocation;
  private readonly radius: WebGLUniformLocation;
  private readonly hoverOffset: WebGLUniformLocation;
  private readonly hover: WebGLUniformLocation;
  private readonly grabbed: WebGLUniformLocation;
  private readonly dragDir: WebGLUniformLocation;
  private readonly dragSpeed: WebGLUniformLocation;
  private readonly settleDir: WebGLUniformLocation;
  private readonly settle: WebGLUniformLocation;
  private readonly color: WebGLUniformLocation;
  private readonly role: WebGLUniformLocation;
  private readonly energy: WebGLUniformLocation;
  private readonly brightness: WebGLUniformLocation;
  private readonly density: WebGLUniformLocation;
  private readonly groove: WebGLUniformLocation;
  private readonly contour: WebGLUniformLocation;
  private readonly spread: WebGLUniformLocation;
  private readonly variation: WebGLUniformLocation;
  private readonly seed: WebGLUniformLocation;
  private readonly selected: WebGLUniformLocation;
  private readonly focused: WebGLUniformLocation;
  private readonly muted: WebGLUniformLocation;
  private readonly charge: WebGLUniformLocation;
  private readonly sceneSelected: WebGLUniformLocation;
  private readonly pulse: WebGLUniformLocation;
  private readonly pulseProgress: WebGLUniformLocation;
  private readonly detail: WebGLUniformLocation;
  private readonly motionScale: WebGLUniformLocation;
  private readonly fxSpace: WebGLUniformLocation;
  private readonly fxEcho: WebGLUniformLocation;
  private readonly fxHeat: WebGLUniformLocation;
  private readonly fxFrost: WebGLUniformLocation;
  private readonly fxFilter: WebGLUniformLocation;
  private readonly auraBlend: WebGLUniformLocation;
  private readonly neighborLight: WebGLUniformLocation;
  private readonly neighborDir: WebGLUniformLocation;
  private readonly wakeStrength: WebGLUniformLocation;
  private readonly wakeDir: WebGLUniformLocation;
  private readonly toyType: WebGLUniformLocation;
  private readonly toyAmount: WebGLUniformLocation;
  private readonly choreoEnergy: WebGLUniformLocation;
  private readonly choreoSettle: WebGLUniformLocation;
  private readonly timeMs: WebGLUniformLocation;
  private readonly pattern: WebGLUniformLocation;

  public constructor(
    private readonly gl: WebGL2RenderingContext,
  ) {
    const program = createProgram(gl);
    const buffer = gl.createBuffer();

    if (!buffer) {
      gl.deleteProgram(program);
      throw new Error('Could not allocate Orb material buffer.');
    }

    this.program = program;
    this.buffer = buffer;
    this.localLocation = gl.getAttribLocation(program, 'a_local');
    this.resolution = requiredUniform(gl, program, 'u_resolution');
    this.center = requiredUniform(gl, program, 'u_center');
    this.radius = requiredUniform(gl, program, 'u_radius');
    this.hoverOffset = requiredUniform(gl, program, 'u_hover_offset');
    this.hover = requiredUniform(gl, program, 'u_hover');
    this.grabbed = requiredUniform(gl, program, 'u_grabbed');
    this.dragDir = requiredUniform(gl, program, 'u_drag_dir');
    this.dragSpeed = requiredUniform(gl, program, 'u_drag_speed');
    this.settleDir = requiredUniform(gl, program, 'u_settle_dir');
    this.settle = requiredUniform(gl, program, 'u_settle');
    this.color = requiredUniform(gl, program, 'u_color');
    this.role = requiredUniform(gl, program, 'u_role');
    this.energy = requiredUniform(gl, program, 'u_energy');
    this.brightness = requiredUniform(gl, program, 'u_brightness');
    this.density = requiredUniform(gl, program, 'u_density');
    this.groove = requiredUniform(gl, program, 'u_groove');
    this.contour = requiredUniform(gl, program, 'u_contour');
    this.spread = requiredUniform(gl, program, 'u_spread');
    this.variation = requiredUniform(gl, program, 'u_variation');
    this.seed = requiredUniform(gl, program, 'u_seed');
    this.selected = requiredUniform(gl, program, 'u_selected');
    this.focused = requiredUniform(gl, program, 'u_focused');
    this.muted = requiredUniform(gl, program, 'u_muted');
    this.charge = requiredUniform(gl, program, 'u_charge');
    this.sceneSelected = requiredUniform(gl, program, 'u_scene_selected');
    this.pulse = requiredUniform(gl, program, 'u_pulse');
    this.pulseProgress = requiredUniform(gl, program, 'u_pulse_progress');
    this.detail = requiredUniform(gl, program, 'u_detail');
    this.motionScale = requiredUniform(gl, program, 'u_motion_scale');
    this.fxSpace = requiredUniform(gl, program, 'u_fx_space');
    this.fxEcho = requiredUniform(gl, program, 'u_fx_echo');
    this.fxHeat = requiredUniform(gl, program, 'u_fx_heat');
    this.fxFrost = requiredUniform(gl, program, 'u_fx_frost');
    this.fxFilter = requiredUniform(gl, program, 'u_fx_filter');
    this.auraBlend = requiredUniform(gl, program, 'u_aura_blend');
    this.neighborLight = requiredUniform(gl, program, 'u_neighbor_light');
    this.neighborDir = requiredUniform(gl, program, 'u_neighbor_dir');
    this.wakeStrength = requiredUniform(gl, program, 'u_wake_strength');
    this.wakeDir = requiredUniform(gl, program, 'u_wake_dir');
    this.toyType = requiredUniform(gl, program, 'u_toy_type');
    this.toyAmount = requiredUniform(gl, program, 'u_toy_amount');
    this.choreoEnergy = requiredUniform(gl, program, 'u_choreo_energy');
    this.choreoSettle = requiredUniform(gl, program, 'u_choreo_settle');
    this.timeMs = requiredUniform(gl, program, 'u_time_ms');
    this.pattern = requiredUniform(gl, program, 'u_pattern[0]');

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.48, -1.48,
        1.48, -1.48,
        -1.48, 1.48,
        -1.48, 1.48,
        1.48, -1.48,
        1.48, 1.48,
      ]),
      gl.STATIC_DRAW,
    );
  }

  public render(
    orbs: readonly RenderOrb[],
    preferences: Readonly<VisualPreferences>,
    events: readonly RenderEventSample[],
    timestampMs: number,
    width: number,
    height: number,
    dpr: number,
    detailScale: number,
  ): void {
    if (orbs.length === 0) {
      return;
    }

    const gl = this.gl;
    const baseDetail = Math.min(
      1,
      renderPolicyForPreferences(preferences).orbDetail * detailScale,
    );
    const minDimension = Math.min(width, height);
    const choreography = objectChoreographyEmphasis(events);
    const choreographyEnergy = Math.min(
      1,
      choreography.wake * 0.55
      + choreography.downbeat * 0.28
      + choreography.phrase * 0.42
      + choreography.reentry * 0.62,
    );

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
    gl.uniform1f(this.choreoEnergy, choreographyEnergy);
    gl.uniform1f(this.choreoSettle, choreography.settle);
    gl.uniform1f(
      this.sceneSelected,
      orbs.some((orb) => orb.selected) ? 1 : 0,
    );

    for (const orb of orbs) {
      gl.uniform1f(
        this.detail,
        Math.max(
          baseDetail,
          orb.selected || orb.focused ? 0.92 : 0,
        ),
      );
      const diameter = orbDiameterPixels(
        orb.role,
        minDimension,
        dpr,
      );
      const base = ROLE_RENDER_COLORS[orb.role];
      const pulse = pulseForOrb(orb.id, events);
      const transient = transientOrbInteraction(
        orb.id,
        events,
      );

      gl.uniform2f(
        this.center,
        orb.position.x * width,
        orb.position.y * height,
      );
      gl.uniform1f(this.radius, diameter * 0.52);
      gl.uniform2f(
        this.hoverOffset,
        orb.interaction.hoverOffset.x,
        orb.interaction.hoverOffset.y,
      );
      gl.uniform1f(
        this.hover,
        orb.interaction.hoverStrength,
      );
      gl.uniform1f(
        this.grabbed,
        orb.interaction.grabbed ? 1 : 0,
      );
      gl.uniform2f(
        this.dragDir,
        orb.interaction.dragVelocity.x,
        orb.interaction.dragVelocity.y,
      );
      gl.uniform1f(
        this.dragSpeed,
        orb.interaction.dragSpeed,
      );
      gl.uniform2f(
        this.settleDir,
        transient.settleDirection.x,
        transient.settleDirection.y,
      );
      gl.uniform1f(this.settle, transient.settle);
      gl.uniform4f(
        this.color,
        base[0],
        base[1],
        base[2],
        base[3],
      );
      gl.uniform1f(this.role, ROLE_ID[orb.role]);
      gl.uniform1f(this.energy, orb.material.energy);
      gl.uniform1f(this.brightness, orb.material.brightness);
      gl.uniform1f(this.density, orb.material.density);
      gl.uniform1f(this.groove, orb.material.groove);
      gl.uniform1f(this.contour, orb.material.contour);
      gl.uniform1f(this.spread, orb.material.spread);
      gl.uniform1f(this.variation, orb.material.variation);
      gl.uniform1f(this.seed, orb.material.seed);
      gl.uniform1f(
        this.fxSpace,
        orb.material.fieldInfluence.space,
      );
      gl.uniform1f(
        this.fxEcho,
        orb.material.fieldInfluence.echo,
      );
      gl.uniform1f(
        this.fxHeat,
        orb.material.fieldInfluence.heat,
      );
      gl.uniform1f(
        this.fxFrost,
        orb.material.fieldInfluence.frost,
      );
      gl.uniform1f(
        this.fxFilter,
        orb.material.fieldInfluence.filter,
      );
      gl.uniform1f(this.auraBlend, orb.cross.auraBlend);
      gl.uniform1f(this.neighborLight, orb.cross.neighborLight);
      gl.uniform2f(
        this.neighborDir,
        orb.cross.neighborDirection.x,
        orb.cross.neighborDirection.y,
      );
      gl.uniform1f(this.wakeStrength, orb.cross.wakeStrength);
      gl.uniform2f(
        this.wakeDir,
        orb.cross.wakeDirection.x,
        orb.cross.wakeDirection.y,
      );
      gl.uniform1f(
        this.toyType,
        (() => {
          switch (orb.cross.toyInfluence?.type ?? null) {
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
        orb.cross.toyInfluence?.amount ?? 0,
      );
      gl.uniform1f(this.selected, orb.selected ? 1 : 0);
      gl.uniform1f(this.focused, orb.focused ? 1 : 0);
      gl.uniform1f(this.muted, orb.muted ? 1 : 0);
      gl.uniform1f(
        this.charge,
        Math.max(
          transient.charge,
          orb.interaction.charging ? 0.72 : 0,
        ),
      );
      gl.uniform1f(this.pulse, pulse.amount);
      gl.uniform1f(this.pulseProgress, pulse.progress);
      gl.uniform1fv(
        this.pattern,
        new Float32Array(orb.material.pattern),
      );

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }

  public destroy(): void {
    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteProgram(this.program);
  }
}
