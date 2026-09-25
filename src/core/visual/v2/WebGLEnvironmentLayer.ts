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

const VERTEX_SOURCE = "#version 300 es\nvoid main(){vec2 position=vec2((gl_VertexID==1)?3.0:-1.0,(gl_VertexID==2)?3.0:-1.0);gl_Position=vec4(position,0.0,1.0);}";

const FRAGMENT_SOURCE = "#version 300 es\nprecision highp float;uniform vec2 u32;uniform float u40;uniform vec3 u41;uniform vec3 u35;uniform float u45;uniform float u36;uniform float u42;uniform float u39;uniform float u44;uniform float u46;uniform float u37;uniform float u47;uniform float u14;uniform float u29;uniform float u27;uniform vec2 u43;uniform vec2 u22;uniform float u10;uniform vec2 u15;uniform float u16;uniform vec4 u38;uniform float u28;uniform float u23;uniform vec2 u17;uniform float u18;uniform float u33;uniform float u12;uniform float u30;uniform float u24;uniform float u13;uniform float u1;uniform float u3;uniform float u2;uniform float u19;uniform float u20;uniform float u31;uniform float u21;uniform float u4;uniform float u6;uniform float u9;uniform float u11;uniform float u5;uniform float u0;uniform vec2 u25;uniform vec2 u34;uniform float u26;uniform vec2 u7;uniform float u8;out vec4 o0;float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32+u47*7.13);return fract(p.x*p.y);}float valueNoise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);float a=hash21(i);float b=hash21(i+vec2(1.0,0.0));float c=hash21(i+vec2(0.0,1.0));float d=hash21(i+vec2(1.0,1.0));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}float fbm(vec2 p){float value=valueNoise(p)*0.58;p=p*2.03+11.7;value+=valueNoise(p)*0.28;p=p*2.07+5.3;value+=valueNoise(p)*0.14;return value;}float starLayer(vec2 uv,float grid,float layerSeed,float radius){vec2 scaled=uv*grid;vec2 cell=floor(scaled);vec2 local=fract(scaled);float existence=hash21(cell+layerSeed);vec2 point=vec2(hash21(cell+layerSeed+17.3),hash21(cell+layerSeed+41.9));float densityGate=1.0-0.085*u14*(1.0-u42*0.42);float enabled=step(densityGate,existence);float distanceToPoint=length(local-point);return enabled*smoothstep(radius,0.0,distanceToPoint);}void main(){vec2 uv=vec2(gl_FragCoord.x/u32.x,1.0-gl_FragCoord.y/u32.y);float aspect=u32.x/max(1.0,u32.y);float awakeMotion=u27*(0.18+u45*0.82);float time=u40*0.000055*awakeMotion;vec2 parallax=(u43-0.5)*u10*u27;float pointerLocal=exp(-dot(uv-u43,uv-u43)*22.0);float dragLocal=exp(-dot(uv-u25,uv-u25)*30.0);vec2 forceDelta=uv-u17;float forceDistance=max(0.001,length(forceDelta));vec2 forceDir=forceDelta/forceDistance;vec2 forceTangent=vec2(-forceDir.y,forceDir.x);float forceLocal=exp(-forceDistance*forceDistance*24.0)*u18*u27;vec2 forceWarp=vec2(0.0);if(u33<1.5 && u33>0.5)forceWarp=forceTangent*forceLocal*0.02;else if(u33<2.5 && u33>1.5)forceWarp=-forceDir*forceLocal*0.018;else if(u33<3.5 && u33>2.5)forceWarp=forceDir*forceLocal*0.022;else if(u33>3.5)forceWarp=-forceDir*forceLocal*0.028;vec2 warpedUv=uv+u22*pointerLocal*u10*u27*0.11+u34*dragLocal*u26*u27*0.065+forceWarp;vec2 p=vec2((warpedUv.x-0.5)*aspect,warpedUv.y-0.5);vec2 hazeCenterA=vec2(-0.22*aspect+sin(time*0.73+u47*5.0)*0.08,-0.12+cos(time*0.61+1.3)*0.06)+parallax*vec2(0.20*aspect,0.20);vec2 hazeCenterB=vec2(0.25*aspect+cos(time*0.52+u47*7.0)*0.09,0.16+sin(time*0.67+2.1)*0.07)-parallax*vec2(0.32*aspect,0.32);float hazeA=exp(-dot(p-hazeCenterA,p-hazeCenterA)*3.2);float hazeB=exp(-dot(p-hazeCenterB,p-hazeCenterB)*3.8);float noise=fbm(warpedUv*3.2+vec2(time*0.13,-time*0.09)+u47*9.0);float fog=smoothstep(0.28,0.78,noise)*(0.42+u45*0.22);vec2 farUv=warpedUv+parallax*0.035;vec2 nearUv=warpedUv+parallax*0.11;float farStars=starLayer(farUv,46.0,3.1,0.085);float nearStars=starLayer(nearUv,25.0,9.7,0.075);float eventGlow=exp(-dot(uv-u15,uv-u15)*13.0)*u16;float pointerGlow=pointerLocal*u10;float dragGlow=dragLocal*u26;float spotlight=exp(-dot(uv-u7,uv-u7)*10.0)*u8;vec2 listenerP=vec2((uv.x-0.5)*aspect,uv.y-0.5);float listenerDistance=length(listenerP);float bassWave=sin(listenerDistance*31.0-u40*0.012)*exp(-listenerDistance*3.5)*u46;vec3 color=vec3(0.010,0.011,0.021);color+=u41*hazeA*(0.055+u39*0.085);color+=u35*hazeB*(0.045+u39*0.075);color+=mix(u35,u41,noise)*fog*(0.018+u39*0.026);color+=vec3(0.58,0.68,1.0)*farStars*(0.12+u45*0.07);color+=vec3(0.76,0.82,1.0)*nearStars*(0.10+u45*0.08);color+=u41*eventGlow*(0.035+u44*0.10)*(0.45+u29*0.55);color+=u35*pointerGlow*0.035;color+=mix(u41,u35,0.42)*dragGlow*0.045;color*=1.0-u8*0.045;color+=mix(u41,vec3(0.76,0.80,1.0),0.22)*spotlight*0.055;color+=mix(u35,u41,0.45)*abs(bassWave)*0.045;color+=mix(u35,vec3(1.0,0.34,0.18),u37)*u44*0.018;color+=vec3(0.18,0.018,0.045)*u36*0.16;color+=vec3(0.18,0.12,0.42)*u38.x*0.045;color+=vec3(0.04,0.34,0.42)*u38.y*(0.018+0.008*sin(time*2.0));color+=vec3(0.42,0.08,0.018)*u38.z*0.052;color+=vec3(0.16,0.34,0.46)*u38.w*0.042;color+=vec3(0.02,0.34,0.22)*u28*0.038;color+=vec3(0.28,0.24,0.48)*u23*0.028;color+=mix(u41,u35,0.5)*u12*0.025;float wakeCore=exp(-listenerDistance*3.2);float pressureRadius=0.12+u1*0.74;float pressureRing=smoothstep(0.055,0.009,abs(listenerDistance-pressureRadius));color+=mix(u41,u35,0.35)*wakeCore*(u30*0.075+u20*0.095);color+=mix(u41,u35,0.5)*pressureRing*u13*0.075;color+=u35*u21*0.05;color+=mix(u41,u35,0.5)*u3*0.022;color+=mix(u35,vec3(0.78,0.72,1.0),0.35)*u2*0.06;color+=vec3(0.32,0.04,0.09)*u4*0.04;color+=vec3(0.12,0.16,0.28)*u6*0.028;float transitionRadius=0.10+u11*0.95;float transitionWave=smoothstep(0.08,0.012,abs(listenerDistance-transitionRadius));color+=mix(u41,vec3(0.72,0.58,1.0),0.42)*transitionWave*u9*0.10;color+=vec3(0.22,0.18,0.38)*u0*0.035;color*=1.0-u5*0.035;color+=vec3(0.22,0.3,0.4)*forceLocal*0.018;float vignette=smoothstep(1.02,0.28,length(listenerP));color*=1.0-u24*0.07-u19*0.10;color*=1.0-u31*(1.0-vignette)*0.08;color*=0.82+u45*0.10+u44*0.12;color*=0.73+vignette*0.27;float grain=(hash21(gl_FragCoord.xy+u47*1000.0)-0.5)*0.0045;color+=grain;o0=vec4(max(color,vec3(0.0)),1.0);}";

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
