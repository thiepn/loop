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

const VERTEX_SOURCE = "#version 300 es\nin vec2 a0;uniform vec2 u9;uniform vec2 u31;uniform float u32;uniform vec2 u6;uniform float u39;uniform float u23;uniform vec2 u17;uniform float u10;uniform vec2 u11;uniform float u33;uniform float u7;out vec2 v0;void main(){vec2 direction=length(u17)>0.001?normalize(u17):vec2(1.0,0.0);vec2 perpendicular=vec2(-direction.y,direction.x);float along=dot(a0,direction);float across=dot(a0,perpendicular);float stretch=u10*u7;vec2 local=direction*along*(1.0+stretch*0.16)+perpendicular*across*(1.0-stretch*0.07);float lift=1.0+u39*0.026+u23*0.055;vec2 hoverShift=u6*4.0*u7;vec2 settleShift=u11*u33*u32*0.11*u7;vec2 position=u31+hoverShift+settleShift+local*u32*lift;vec2 zeroToOne=position/u9;vec2 clip=zeroToOne*2.0-1.0;clip.y=-clip.y;gl_Position=vec4(clip,0.0,1.0);v0=a0;}";

const FRAGMENT_SOURCE = "#version 300 es\nprecision highp float;in vec2 v0;uniform vec4 u40;uniform float u43;uniform float u34;uniform float u12;uniform float u24;uniform float u35;uniform float u25;uniform float u36;uniform float u15;uniform float u44;uniform float u18;uniform float u26;uniform float u41;uniform float u23;uniform float u39;uniform float u37;uniform float u0;uniform float u42;uniform float u1;uniform float u38;uniform float u7;uniform float u19;uniform float u27;uniform float u28;uniform float u20;uniform float u16;uniform float u13;uniform float u2;uniform vec2 u8;uniform float u3;uniform vec2 u21;uniform float u22;uniform float u14;uniform float u4;uniform float u5;uniform float u29;uniform float u30[16];out vec4 o0;float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32+u44*19.7);return fract(p.x*p.y);}float materialBoundary(float angle,float time){float boundary=0.94;if(u43<0.5){boundary+=0.034*cos(angle*4.0+u15*2.0);boundary+=u42*0.065;}else if(u43<1.5){boundary=0.89+0.058*cos(angle*8.0+u44*6.28);boundary+=u42*0.025;}else if(u43<2.5){boundary=0.98+0.035*sin(angle*2.0+time*0.8+u44*5.0)+u42*0.075;}else if(u43<3.5){boundary=0.95+0.052*cos(angle*3.0+time*0.28)+u42*0.04;}else if(u43<4.5){boundary=0.90+0.024*sin(angle*5.0+u25*2.4)+u42*0.04;}else if(u43<5.5){boundary=1.00+0.035*sin(angle*3.0-time*0.22)+0.022*sin(angle*7.0+u44*9.0);}else{boundary=0.94+0.052*sin(angle*2.0+0.8+time*0.2)+0.026*sin(angle*5.0-time*0.32)+u42*0.045;}boundary+=u19*0.018;boundary+=u28*0.028*sin(angle*5.0+time*2.1);boundary-=u20*0.012*(0.5+0.5*cos(angle*8.0));boundary-=u16*0.008;float wakeAngle=atan(u21.y,u21.x);boundary+=u3*0.022*cos(angle-wakeAngle);if(u22>0.5 && u22<1.5){boundary+=u14*0.016*sin(angle*4.0+time*1.7);}else if(u22>1.5 && u22<2.5){boundary-=u14*0.018;}else if(u22>2.5 && u22<3.5){boundary+=u14*0.026;}boundary+=u4*0.012;boundary-=u5*0.008;return boundary;}void main(){float motionTime=u29*0.001*u7;vec2 q=v0;if(u43<0.5){q.y*=1.0+u42*0.07;}else if(u43>1.5 && u43<2.5){q.x*=1.0-u42*0.055;}else if(u43>3.5 && u43<4.5){q.y*=1.0-u42*0.04;}float angle=atan(q.y,q.x);float d=length(q);float boundary=materialBoundary(angle,motionTime);float body=1.0-smoothstep(boundary-0.055,boundary+0.018,d);float outside=max(0.0,d-boundary);float aura=exp(-outside*(6.0+u41*4.0))*(1.0-smoothstep(1.0,1.43+u13*0.08,d));float alpha=aura*(0.08+u34*0.08+u19*0.035+u13*0.045)+body*0.94;vec3 color=u40.rgb;float radialLight=clamp(1.18-d*0.5,0.55,1.15);color*=radialLight*(0.82+u12*0.28);color+=vec3(0.24,0.28,0.34)*max(0.0,0.34-d)*0.6;vec2 directionQ=length(q)>0.001?normalize(q):vec2(0.0);float neighborFacing=max(0.0,dot(directionQ,normalize(u8+vec2(0.0001))));color+=vec3(0.18,0.22,0.3)*u2*(0.05+neighborFacing*0.12);color+=vec3(0.22,0.24,0.34)*u13*0.035;color=mix(color,vec3(0.48,0.4,1.0),u19*0.16);color=mix(color,vec3(0.38,0.9,1.0),u27*0.12);color=mix(color,vec3(1.0,0.28,0.08),u28*0.34);color=mix(color,vec3(0.78,0.94,1.0),u20*0.42);color=mix(color,vec3(0.18,0.78,0.58),u16*0.24);if(u22>0.5 && u22<1.5)color=mix(color,vec3(0.66,0.55,0.98),u14*0.10);else if(u22>1.5 && u22<2.5)color=mix(color,vec3(0.20,0.83,0.60),u14*0.12);else if(u22>2.5 && u22<3.5)color=mix(color,vec3(0.98,0.44,0.52),u14*0.12);else if(u22>3.5)color=mix(color,vec3(0.13,0.83,0.93),u14*0.16);color*=1.0-u16*0.12;color*=1.0+u4*0.055-u5*0.04;alpha*=1.0+u4*0.025-u5*0.045;alpha*=1.0-step(3.5,u22)*u14*0.08;float stepFloat=(angle+3.14159265+(u35-0.5)*0.08)/6.2831853*16.0;int stepIndex=int(clamp(floor(stepFloat),0.0,15.0));float stepLocal=abs(fract(stepFloat)-0.5);float patternValue=u30[stepIndex];float active=step(0.0,patternValue);float patternMark=0.0;if(u43<1.5){patternMark=active*smoothstep(0.23,0.06,stepLocal)*smoothstep(0.07,0.012,abs(d-0.72));}else if(u43<5.0 || u43>5.5){float target=0.27+max(patternValue,0.0)*0.48;patternMark=active*smoothstep(0.20,0.055,stepLocal)*smoothstep(0.065,0.015,abs(d-target));}float internal=0.0;if(u43<0.5){internal=smoothstep(0.06,0.0,abs(sin(angle*4.0)*0.5+d-0.48));}else if(u43<1.5){float grain=hash21(floor((q+1.2)*13.0+motionTime*0.3));internal=step(0.82-u24*0.18,grain)*body;}else if(u43<2.5){internal=0.5+0.5*sin(d*18.0-motionTime*1.4+u44*7.0);internal*=smoothstep(boundary,0.18,d);}else if(u43<3.5){float rings=1.0-abs(sin(d*(12.0+u36*5.0)-motionTime*0.5));float petals=0.5+0.5*cos(angle*3.0+motionTime*0.32);internal=rings*petals*body;}else if(u43<4.5){float filament=abs(q.y-sin(q.x*5.2+u25*2.0+motionTime*0.8)*0.17);internal=smoothstep(0.055,0.008,filament)*body;}else if(u43<5.5){float cloud=hash21(q*7.0+motionTime*0.08)+hash21(q*15.0-motionTime*0.05)*0.5;internal=smoothstep(0.58,1.28,cloud)*body;}else{float ribbonA=abs(q.y-sin(q.x*4.0+motionTime*0.62+u44*3.0)*0.18);float ribbonB=abs(q.y-cos(q.x*3.0-motionTime*0.44)*0.28);internal=(smoothstep(0.06,0.012,ribbonA)+smoothstep(0.05,0.01,ribbonB)*0.55)*body;}color+=vec3(0.32,0.34,0.38)*(patternMark*(0.42+u38*0.58)+internal*0.20*u38);color*=1.0+u42*(0.16+u12*0.16)+u39*0.035+u23*0.075+u37*0.09;color*=1.0-u0*(1.0-u18)*0.10;alpha*=1.0-u0*(1.0-u18)*0.08;float pulseRing=u42*smoothstep(0.035,0.006,abs(d-(1.03+u1*0.24)));color+=vec3(0.34,0.38,0.46)*pulseRing;alpha=max(alpha,pulseRing*0.42);float echoRingA=u27*smoothstep(0.035,0.007,abs(d-1.10));float echoRingB=u27*smoothstep(0.04,0.009,abs(d-1.26));color+=vec3(0.32,0.88,1.0)*(echoRingA*0.28+echoRingB*0.18);alpha=max(alpha,echoRingA*0.34+echoRingB*0.22);float frostFacet=u20*(0.5+0.5*cos(angle*8.0))*body;color+=vec3(0.62,0.82,0.96)*frostFacet*0.12;if(u43>3.5 && u43<4.5){float satelliteA=smoothstep(0.105,0.025,length(q-vec2(0.98,-0.28)));float satelliteB=smoothstep(0.085,0.022,length(q-vec2(-0.88,0.44)));float satellites=(satelliteA+satelliteB)*(0.45+u24*0.55);color+=u40.rgb*satellites*u38;alpha=max(alpha,satellites*0.88);}float chargeRing=u37*smoothstep(0.032,0.005,abs(d-(1.06+u37*0.05)));color+=u40.rgb*chargeRing*0.48;alpha=max(alpha,chargeRing*0.72);float focusDash=step(0.0,sin(angle*12.0));float focusRing=u26*focusDash*smoothstep(0.022,0.004,abs(d-1.10));float selectionRing=u18*smoothstep(0.025,0.004,abs(d-1.18));color=mix(color,vec3(0.88,0.92,1.0),focusRing*0.72);color=mix(color,vec3(0.94,0.96,1.0),selectionRing*0.86);alpha=max(alpha,focusRing*0.8);alpha=max(alpha,selectionRing*0.88);if(u41>0.5){float gray=dot(color,vec3(0.299,0.587,0.114));color=mix(color,vec3(gray),0.68);alpha*=0.38;}if(d>1.44 && selectionRing<0.01)discard;o0=vec4(max(color,vec3(0.0)),clamp(alpha,0.0,1.0));}";

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
  private readonly patternData = new Float32Array(16);

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
    this.localLocation = gl.getAttribLocation(program, 'a0');
    this.resolution = requiredUniform(gl, program, 'u9');
    this.center = requiredUniform(gl, program, 'u31');
    this.radius = requiredUniform(gl, program, 'u32');
    this.hoverOffset = requiredUniform(gl, program, 'u6');
    this.hover = requiredUniform(gl, program, 'u39');
    this.grabbed = requiredUniform(gl, program, 'u23');
    this.dragDir = requiredUniform(gl, program, 'u17');
    this.dragSpeed = requiredUniform(gl, program, 'u10');
    this.settleDir = requiredUniform(gl, program, 'u11');
    this.settle = requiredUniform(gl, program, 'u33');
    this.color = requiredUniform(gl, program, 'u40');
    this.role = requiredUniform(gl, program, 'u43');
    this.energy = requiredUniform(gl, program, 'u34');
    this.brightness = requiredUniform(gl, program, 'u12');
    this.density = requiredUniform(gl, program, 'u24');
    this.groove = requiredUniform(gl, program, 'u35');
    this.contour = requiredUniform(gl, program, 'u25');
    this.spread = requiredUniform(gl, program, 'u36');
    this.variation = requiredUniform(gl, program, 'u15');
    this.seed = requiredUniform(gl, program, 'u44');
    this.selected = requiredUniform(gl, program, 'u18');
    this.focused = requiredUniform(gl, program, 'u26');
    this.muted = requiredUniform(gl, program, 'u41');
    this.charge = requiredUniform(gl, program, 'u37');
    this.sceneSelected = requiredUniform(gl, program, 'u0');
    this.pulse = requiredUniform(gl, program, 'u42');
    this.pulseProgress = requiredUniform(gl, program, 'u1');
    this.detail = requiredUniform(gl, program, 'u38');
    this.motionScale = requiredUniform(gl, program, 'u7');
    this.fxSpace = requiredUniform(gl, program, 'u19');
    this.fxEcho = requiredUniform(gl, program, 'u27');
    this.fxHeat = requiredUniform(gl, program, 'u28');
    this.fxFrost = requiredUniform(gl, program, 'u20');
    this.fxFilter = requiredUniform(gl, program, 'u16');
    this.auraBlend = requiredUniform(gl, program, 'u13');
    this.neighborLight = requiredUniform(gl, program, 'u2');
    this.neighborDir = requiredUniform(gl, program, 'u8');
    this.wakeStrength = requiredUniform(gl, program, 'u3');
    this.wakeDir = requiredUniform(gl, program, 'u21');
    this.toyType = requiredUniform(gl, program, 'u22');
    this.toyAmount = requiredUniform(gl, program, 'u14');
    this.choreoEnergy = requiredUniform(gl, program, 'u4');
    this.choreoSettle = requiredUniform(gl, program, 'u5');
    this.timeMs = requiredUniform(gl, program, 'u29');
    this.pattern = requiredUniform(gl, program, 'u30[0]');

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
      this.patternData.set(orb.material.pattern);
      gl.uniform1fv(this.pattern, this.patternData);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }

  public destroy(): void {
    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteProgram(this.program);
  }
}
