import type { VisualPreferences } from '../VisualQuality';
import type { SoundRole } from '../../sounds/SoundDefinition';
import { ROLE_RENDER_COLORS } from './RenderPalette';
import { transientOrbInteraction } from './InteractionModel';
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

const VERTEX_SOURCE = '#version 300 es\n'
  + 'in vec2 a_local;\n'
  + 'uniform vec2 u_resolution;\n'
  + 'uniform vec2 u_center;\n'
  + 'uniform float u_radius;\n'
  + 'uniform vec2 u_hover_offset;\n'
  + 'uniform float u_hover;\n'
  + 'uniform float u_grabbed;\n'
  + 'uniform vec2 u_drag_dir;\n'
  + 'uniform float u_drag_speed;\n'
  + 'uniform vec2 u_settle_dir;\n'
  + 'uniform float u_settle;\n'
  + 'uniform float u_motion_scale;\n'
  + 'out vec2 v_local;\n'
  + 'void main() {\n'
  + '  vec2 direction = length(u_drag_dir) > 0.001\n'
  + '    ? normalize(u_drag_dir)\n'
  + '    : vec2(1.0, 0.0);\n'
  + '  vec2 perpendicular = vec2(-direction.y, direction.x);\n'
  + '  float along = dot(a_local, direction);\n'
  + '  float across = dot(a_local, perpendicular);\n'
  + '  float stretch = u_drag_speed * u_motion_scale;\n'
  + '  vec2 local = direction * along * (1.0 + stretch * 0.16)\n'
  + '    + perpendicular * across * (1.0 - stretch * 0.07);\n'
  + '  float lift = 1.0 + u_hover * 0.026 + u_grabbed * 0.055;\n'
  + '  vec2 hoverShift = u_hover_offset * 4.0 * u_motion_scale;\n'
  + '  vec2 settleShift = u_settle_dir * u_settle * u_radius * 0.11 * u_motion_scale;\n'
  + '  vec2 position = u_center + hoverShift + settleShift + local * u_radius * lift;\n'
  + '  vec2 zeroToOne = position / u_resolution;\n'
  + '  vec2 clip = zeroToOne * 2.0 - 1.0;\n'
  + '  clip.y = -clip.y;\n'
  + '  gl_Position = vec4(clip, 0.0, 1.0);\n'
  + '  v_local = a_local;\n'
  + '}';

const FRAGMENT_SOURCE = '#version 300 es\n'
  + 'precision highp float;\n'
  + 'in vec2 v_local;\n'
  + 'uniform vec4 u_color;\n'
  + 'uniform float u_role;\n'
  + 'uniform float u_energy;\n'
  + 'uniform float u_brightness;\n'
  + 'uniform float u_density;\n'
  + 'uniform float u_groove;\n'
  + 'uniform float u_contour;\n'
  + 'uniform float u_spread;\n'
  + 'uniform float u_variation;\n'
  + 'uniform float u_seed;\n'
  + 'uniform float u_selected;\n'
  + 'uniform float u_focused;\n'
  + 'uniform float u_muted;\n'
  + 'uniform float u_grabbed;\n'
  + 'uniform float u_hover;\n'
  + 'uniform float u_charge;\n'
  + 'uniform float u_scene_selected;\n'
  + 'uniform float u_pulse;\n'
  + 'uniform float u_pulse_progress;\n'
  + 'uniform float u_detail;\n'
  + 'uniform float u_motion_scale;\n'
  + 'uniform float u_fx_space;\n'
  + 'uniform float u_fx_echo;\n'
  + 'uniform float u_fx_heat;\n'
  + 'uniform float u_fx_frost;\n'
  + 'uniform float u_fx_filter;\n'
  + 'uniform float u_time_ms;\n'
  + 'uniform float u_pattern[16];\n'
  + 'out vec4 out_color;\n'
  + '\n'
  + 'float hash21(vec2 p) {\n'
  + '  p = fract(p * vec2(123.34, 456.21));\n'
  + '  p += dot(p, p + 45.32 + u_seed * 19.7);\n'
  + '  return fract(p.x * p.y);\n'
  + '}\n'
  + '\n'
  + 'float materialBoundary(float angle, float time) {\n'
  + '  float boundary = 0.94;\n'
  + '  if (u_role < 0.5) {\n'
  + '    boundary += 0.034 * cos(angle * 4.0 + u_variation * 2.0);\n'
  + '    boundary += u_pulse * 0.065;\n'
  + '  } else if (u_role < 1.5) {\n'
  + '    boundary = 0.89 + 0.058 * cos(angle * 8.0 + u_seed * 6.28);\n'
  + '    boundary += u_pulse * 0.025;\n'
  + '  } else if (u_role < 2.5) {\n'
  + '    boundary = 0.98\n'
  + '      + 0.035 * sin(angle * 2.0 + time * 0.8 + u_seed * 5.0)\n'
  + '      + u_pulse * 0.075;\n'
  + '  } else if (u_role < 3.5) {\n'
  + '    boundary = 0.95\n'
  + '      + 0.052 * cos(angle * 3.0 + time * 0.28)\n'
  + '      + u_pulse * 0.04;\n'
  + '  } else if (u_role < 4.5) {\n'
  + '    boundary = 0.90\n'
  + '      + 0.024 * sin(angle * 5.0 + u_contour * 2.4)\n'
  + '      + u_pulse * 0.04;\n'
  + '  } else if (u_role < 5.5) {\n'
  + '    boundary = 1.00\n'
  + '      + 0.035 * sin(angle * 3.0 - time * 0.22)\n'
  + '      + 0.022 * sin(angle * 7.0 + u_seed * 9.0);\n'
  + '  } else {\n'
  + '    boundary = 0.94\n'
  + '      + 0.052 * sin(angle * 2.0 + 0.8 + time * 0.2)\n'
  + '      + 0.026 * sin(angle * 5.0 - time * 0.32)\n'
  + '      + u_pulse * 0.045;\n'
  + '  }\n'
  + '  boundary += u_fx_space * 0.018;\n'
  + '  boundary += u_fx_heat * 0.028 * sin(angle * 5.0 + time * 2.1);\n'
  + '  boundary -= u_fx_frost * 0.012 * (0.5 + 0.5 * cos(angle * 8.0));\n'
  + '  boundary -= u_fx_filter * 0.008;\n'
  + '  return boundary;\n'
  + '}\n'
  + '\n'
  + 'void main() {\n'
  + '  float motionTime = u_time_ms * 0.001 * u_motion_scale;\n'
  + '  vec2 q = v_local;\n'
  + '  if (u_role < 0.5) {\n'
  + '    q.y *= 1.0 + u_pulse * 0.07;\n'
  + '  } else if (u_role > 1.5 && u_role < 2.5) {\n'
  + '    q.x *= 1.0 - u_pulse * 0.055;\n'
  + '  } else if (u_role > 3.5 && u_role < 4.5) {\n'
  + '    q.y *= 1.0 - u_pulse * 0.04;\n'
  + '  }\n'
  + '\n'
  + '  float angle = atan(q.y, q.x);\n'
  + '  float d = length(q);\n'
  + '  float boundary = materialBoundary(angle, motionTime);\n'
  + '  float body = 1.0 - smoothstep(boundary - 0.055, boundary + 0.018, d);\n'
  + '  float outside = max(0.0, d - boundary);\n'
  + '  float aura = exp(-outside * (6.0 + u_muted * 4.0))\n'
  + '    * (1.0 - smoothstep(1.0, 1.43, d));\n'
  + '  float alpha = aura * (0.08 + u_energy * 0.08 + u_fx_space * 0.035) + body * 0.94;\n'
  + '\n'
  + '  vec3 color = u_color.rgb;\n'
  + '  float radialLight = clamp(1.18 - d * 0.5, 0.55, 1.15);\n'
  + '  color *= radialLight * (0.82 + u_brightness * 0.28);\n'
  + '  color += vec3(0.24, 0.28, 0.34) * max(0.0, 0.34 - d) * 0.6;\n'
  + '  color = mix(color, vec3(0.48, 0.4, 1.0), u_fx_space * 0.16);\n'
  + '  color = mix(color, vec3(0.38, 0.9, 1.0), u_fx_echo * 0.12);\n'
  + '  color = mix(color, vec3(1.0, 0.28, 0.08), u_fx_heat * 0.34);\n'
  + '  color = mix(color, vec3(0.78, 0.94, 1.0), u_fx_frost * 0.42);\n'
  + '  color = mix(color, vec3(0.18, 0.78, 0.58), u_fx_filter * 0.24);\n'
  + '  color *= 1.0 - u_fx_filter * 0.12;\n'
  + '\n'
  + '  float stepFloat = (angle + 3.14159265 + (u_groove - 0.5) * 0.08) / 6.2831853 * 16.0;\n'
  + '  int stepIndex = int(clamp(floor(stepFloat), 0.0, 15.0));\n'
  + '  float stepLocal = abs(fract(stepFloat) - 0.5);\n'
  + '  float patternValue = u_pattern[stepIndex];\n'
  + '  float active = step(0.0, patternValue);\n'
  + '\n'
  + '  float patternMark = 0.0;\n'
  + '  if (u_role < 1.5) {\n'
  + '    patternMark = active\n'
  + '      * smoothstep(0.23, 0.06, stepLocal)\n'
  + '      * smoothstep(0.07, 0.012, abs(d - 0.72));\n'
  + '  } else if (u_role < 5.0 || u_role > 5.5) {\n'
  + '    float target = 0.27 + max(patternValue, 0.0) * 0.48;\n'
  + '    patternMark = active\n'
  + '      * smoothstep(0.20, 0.055, stepLocal)\n'
  + '      * smoothstep(0.065, 0.015, abs(d - target));\n'
  + '  }\n'
  + '\n'
  + '  float internal = 0.0;\n'
  + '  if (u_role < 0.5) {\n'
  + '    internal = smoothstep(0.06, 0.0, abs(sin(angle * 4.0) * 0.5 + d - 0.48));\n'
  + '  } else if (u_role < 1.5) {\n'
  + '    float grain = hash21(floor((q + 1.2) * 13.0 + motionTime * 0.3));\n'
  + '    internal = step(0.82 - u_density * 0.18, grain) * body;\n'
  + '  } else if (u_role < 2.5) {\n'
  + '    internal = 0.5 + 0.5 * sin(d * 18.0 - motionTime * 1.4 + u_seed * 7.0);\n'
  + '    internal *= smoothstep(boundary, 0.18, d);\n'
  + '  } else if (u_role < 3.5) {\n'
  + '    float rings = 1.0 - abs(sin(d * (12.0 + u_spread * 5.0) - motionTime * 0.5));\n'
  + '    float petals = 0.5 + 0.5 * cos(angle * 3.0 + motionTime * 0.32);\n'
  + '    internal = rings * petals * body;\n'
  + '  } else if (u_role < 4.5) {\n'
  + '    float filament = abs(q.y - sin(q.x * 5.2 + u_contour * 2.0 + motionTime * 0.8) * 0.17);\n'
  + '    internal = smoothstep(0.055, 0.008, filament) * body;\n'
  + '  } else if (u_role < 5.5) {\n'
  + '    float cloud = hash21(q * 7.0 + motionTime * 0.08)\n'
  + '      + hash21(q * 15.0 - motionTime * 0.05) * 0.5;\n'
  + '    internal = smoothstep(0.58, 1.28, cloud) * body;\n'
  + '  } else {\n'
  + '    float ribbonA = abs(q.y - sin(q.x * 4.0 + motionTime * 0.62 + u_seed * 3.0) * 0.18);\n'
  + '    float ribbonB = abs(q.y - cos(q.x * 3.0 - motionTime * 0.44) * 0.28);\n'
  + '    internal = (smoothstep(0.06, 0.012, ribbonA) + smoothstep(0.05, 0.01, ribbonB) * 0.55) * body;\n'
  + '  }\n'
  + '\n'
  + '  color += vec3(0.32, 0.34, 0.38)\n'
  + '    * (patternMark * (0.42 + u_detail * 0.58) + internal * 0.20 * u_detail);\n'
  + '  color *= 1.0\n'
  + '    + u_pulse * (0.16 + u_brightness * 0.16)\n'
  + '    + u_hover * 0.035\n'
  + '    + u_grabbed * 0.075\n'
  + '    + u_charge * 0.09;\n'
  + '  color *= 1.0 - u_scene_selected * (1.0 - u_selected) * 0.10;\n'
  + '  alpha *= 1.0 - u_scene_selected * (1.0 - u_selected) * 0.08;\n'
  + '  float pulseRing = u_pulse\n'
  + '    * smoothstep(0.035, 0.006, abs(d - (1.03 + u_pulse_progress * 0.24)));\n'
  + '  color += vec3(0.34, 0.38, 0.46) * pulseRing;\n'
  + '  alpha = max(alpha, pulseRing * 0.42);\n'
  + '  float echoRingA = u_fx_echo * smoothstep(0.035, 0.007, abs(d - 1.10));\n'
  + '  float echoRingB = u_fx_echo * smoothstep(0.04, 0.009, abs(d - 1.26));\n'
  + '  color += vec3(0.32, 0.88, 1.0) * (echoRingA * 0.28 + echoRingB * 0.18);\n'
  + '  alpha = max(alpha, echoRingA * 0.34 + echoRingB * 0.22);\n'
  + '  float frostFacet = u_fx_frost * (0.5 + 0.5 * cos(angle * 8.0)) * body;\n'
  + '  color += vec3(0.62, 0.82, 0.96) * frostFacet * 0.12;\n'
  + '\n'
  + '  if (u_role > 3.5 && u_role < 4.5) {\n'
  + '    float satelliteA = smoothstep(0.105, 0.025, length(q - vec2(0.98, -0.28)));\n'
  + '    float satelliteB = smoothstep(0.085, 0.022, length(q - vec2(-0.88, 0.44)));\n'
  + '    float satellites = (satelliteA + satelliteB) * (0.45 + u_density * 0.55);\n'
  + '    color += u_color.rgb * satellites * u_detail;\n'
  + '    alpha = max(alpha, satellites * 0.88);\n'
  + '  }\n'
  + '\n'
  + '  float chargeRing = u_charge\n'
  + '    * smoothstep(0.032, 0.005, abs(d - (1.06 + u_charge * 0.05)));\n'
  + '  color += u_color.rgb * chargeRing * 0.48;\n'
  + '  alpha = max(alpha, chargeRing * 0.72);\n'
  + '  float focusDash = step(0.0, sin(angle * 12.0));\n'
  + '  float focusRing = u_focused * focusDash\n'
  + '    * smoothstep(0.022, 0.004, abs(d - 1.10));\n'
  + '  float selectionRing = u_selected\n'
  + '    * smoothstep(0.025, 0.004, abs(d - 1.18));\n'
  + '  color = mix(color, vec3(0.88, 0.92, 1.0), focusRing * 0.72);\n'
  + '  color = mix(color, vec3(0.94, 0.96, 1.0), selectionRing * 0.86);\n'
  + '  alpha = max(alpha, focusRing * 0.8);\n'
  + '  alpha = max(alpha, selectionRing * 0.88);\n'
  + '\n'
  + '  if (u_muted > 0.5) {\n'
  + '    float gray = dot(color, vec3(0.299, 0.587, 0.114));\n'
  + '    color = mix(color, vec3(gray), 0.68);\n'
  + '    alpha *= 0.38;\n'
  + '  }\n'
  + '\n'
  + '  if (d > 1.44 && selectionRing < 0.01) discard;\n'
  + '  out_color = vec4(max(color, vec3(0.0)), clamp(alpha, 0.0, 1.0));\n'
  + '}';

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
  ): void {
    if (orbs.length === 0) {
      return;
    }

    const gl = this.gl;
    const detail = renderPolicyForPreferences(preferences).orbDetail;
    const minDimension = Math.min(width, height);

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
    gl.uniform1f(this.detail, detail);
    gl.uniform1f(
      this.sceneSelected,
      orbs.some((orb) => orb.selected) ? 1 : 0,
    );

    for (const orb of orbs) {
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
