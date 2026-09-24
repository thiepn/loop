import type { VisualPreferences } from '../VisualQuality';
import type { ListenerLightState } from './LightModel';

const VS='#version 300 es\nin vec2 a_local;uniform vec2 u_resolution;uniform vec2 u_center;uniform float u_radius;out vec2 v_local;void main(){vec2 pos=u_center+a_local*u_radius;vec2 p=pos/u_resolution*2.0-1.0;p.y=-p.y;gl_Position=vec4(p,0.,1.);v_local=a_local;}';
const FS='#version 300 es\nprecision highp float;in vec2 v_local;uniform vec4 u_color;uniform float u_energy;uniform float u_arrival;uniform float u_playing;uniform float u_recording;uniform float u_time;uniform float u_motion;uniform float u_particles;uniform float u_glow;out vec4 out_color;void main(){float d=length(v_local);float a=atan(v_local.y,v_local.x);float core=1.-smoothstep(.18,.34,d);float ring1=smoothstep(.018,.004,abs(d-.53));float ring2=smoothstep(.018,.004,abs(d-.78));float iris=smoothstep(.11,.025,abs(sin(a*6.+u_time*.35*u_motion)))*smoothstep(.72,.34,d)*(1.-smoothstep(.34,.55,d));float mote=0.;if(u_particles>.1){vec2 m=vec2(cos(u_time*.5*u_motion),sin(u_time*.5*u_motion))*.88;mote=smoothstep(.09,.025,length(v_local-m));}float alpha=core*.9+ring1*(.18+u_energy*.26)+ring2*(.1+u_arrival*.32)+iris*.1+mote*.55;vec3 color=u_color.rgb*(.82+u_energy*.28)+vec3(.22,.24,.34)*u_glow*(ring1+ring2);if(u_recording>.5)color=mix(color,vec3(1.,.24,.42),.34);if(d>1.02&&mote<.01)discard;out_color=vec4(color,clamp(alpha,0.,1.));}';

function sh(gl:WebGL2RenderingContext,t:number,s:string){const x=gl.createShader(t);if(!x)throw new Error('listener shader');gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS)){const m=gl.getShaderInfoLog(x)??'listener';gl.deleteShader(x);throw new Error(m);}return x;}
function prog(gl:WebGL2RenderingContext){const v=sh(gl,gl.VERTEX_SHADER,VS),f=sh(gl,gl.FRAGMENT_SHADER,FS),p=gl.createProgram();if(!p)throw new Error('listener program');gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const m=gl.getProgramInfoLog(p)??'listener';gl.deleteProgram(p);throw new Error(m);}return p;}
export class WebGLListenerLayer{
  private readonly p:WebGLProgram;private readonly b:WebGLBuffer;private readonly local:number;
  private readonly u:Record<string,WebGLUniformLocation>;
  public constructor(private readonly gl:WebGL2RenderingContext){
    this.p=prog(gl);const b=gl.createBuffer();if(!b)throw new Error('listener buffer');this.b=b;this.local=gl.getAttribLocation(this.p,'a_local');
    gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1.1,-1.1,1.1,-1.1,-1.1,1.1,-1.1,1.1,1.1,-1.1,1.1,1.1]),gl.STATIC_DRAW);
    this.u={};for(const n of ['u_resolution','u_center','u_radius','u_color','u_energy','u_arrival','u_playing','u_recording','u_time','u_motion','u_particles','u_glow']){const l=gl.getUniformLocation(this.p,n);if(!l)throw new Error('listener uniform '+n);this.u[n]=l;}
  }
  public render(position:{x:number;y:number},state:Readonly<ListenerLightState>,playing:boolean,recording:boolean,preferences:Readonly<VisualPreferences>,timestampMs:number,width:number,height:number,dpr:number):void{
    const gl=this.gl;gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(this.p);gl.bindBuffer(gl.ARRAY_BUFFER,this.b);gl.enableVertexAttribArray(this.local);gl.vertexAttribPointer(this.local,2,gl.FLOAT,false,0,0);
    gl.uniform2f(this.u.u_resolution!,width,height);gl.uniform2f(this.u.u_center!,position.x*width,position.y*height);gl.uniform1f(this.u.u_radius!,42*dpr*(1+state.energy*.08));gl.uniform4f(this.u.u_color!,state.color[0],state.color[1],state.color[2],1);gl.uniform1f(this.u.u_energy!,state.energy);gl.uniform1f(this.u.u_arrival!,state.arrival);gl.uniform1f(this.u.u_playing!,playing?1:0);gl.uniform1f(this.u.u_recording!,recording?1:0);gl.uniform1f(this.u.u_time!,timestampMs*.001);gl.uniform1f(this.u.u_motion!,preferences.reduceMotion?0:1);gl.uniform1f(this.u.u_particles!,preferences.reduceParticles?0:1);gl.uniform1f(this.u.u_glow!,preferences.reduceBloom?.2:1);gl.drawArrays(gl.TRIANGLES,0,6);
  }
  public destroy(){this.gl.deleteBuffer(this.b);this.gl.deleteProgram(this.p);}
}
