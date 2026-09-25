import type { VisualPreferences } from '../VisualQuality';
import type { RenderLightFrame } from './LightModel';

const VERTEX = "#version 300 es\nin vec2 a_position;\nin vec2 a_local;\nin vec4 a_color;\nuniform vec2 u_resolution;\nout vec2 v_local;\nout vec4 v_color;\nvoid main(){\nvec2 p=a_position/u_resolution*2.0-1.0; p.y=-p.y;\ngl_Position=vec4(p,0.0,1.0); v_local=a_local; v_color=a_color;\n}";

const FRAGMENT = "#version 300 es\nprecision mediump float;\nin vec2 v_local; in vec4 v_color; out vec4 out_color;\nvoid main(){ float d=length(v_local); if(d>1.0) discard;\nfloat a=pow(max(0.0,1.0-d),2.2)*v_color.a;\nout_color=vec4(v_color.rgb,a); }";

function compile(gl:WebGL2RenderingContext,type:number,source:string):WebGLShader{
  const s=gl.createShader(type); if(!s) throw new Error('light shader');
  gl.shaderSource(s,source); gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const m=gl.getShaderInfoLog(s)??'light shader';gl.deleteShader(s);throw new Error(m);}
  return s;
}
function program(gl:WebGL2RenderingContext):WebGLProgram{
  const v=compile(gl,gl.VERTEX_SHADER,VERTEX); const f=compile(gl,gl.FRAGMENT_SHADER,FRAGMENT);
  const p=gl.createProgram(); if(!p) throw new Error('light program');
  gl.attachShader(p,v); gl.attachShader(p,f); gl.linkProgram(p); gl.deleteShader(v);gl.deleteShader(f);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const m=gl.getProgramInfoLog(p)??'light program';gl.deleteProgram(p);throw new Error(m);}
  return p;
}
function pushDisc(target:number[],x:number,y:number,r:number,color:readonly[number,number,number,number]){
  const c=[[-1,-1],[1,-1],[-1,1],[-1,1],[1,-1],[1,1]] as const;
  for(const [lx,ly] of c) target.push(x+lx*r,y+ly*r,lx,ly,color[0],color[1],color[2],color[3]);
}
function bezier(a:{x:number;y:number},b:{x:number;y:number},t:number){
  const cx=(a.x+b.x)/2; const cy=(a.y+b.y)/2-0.07;
  const u=1-t; return {x:u*u*a.x+2*u*t*cx+t*t*b.x,y:u*u*a.y+2*u*t*cy+t*t*b.y};
}

export class WebGLLightPropagationLayer{
  private readonly p:WebGLProgram;
  private readonly b:WebGLBuffer;
  private readonly pos:number;
  private readonly local:number;
  private readonly color:number;
  private readonly res:WebGLUniformLocation;
  public constructor(private readonly gl:WebGL2RenderingContext){
    this.p=program(gl); const b=gl.createBuffer(); if(!b) throw new Error('light buffer'); this.b=b;
    this.pos=gl.getAttribLocation(this.p,'a_position'); this.local=gl.getAttribLocation(this.p,'a_local'); this.color=gl.getAttribLocation(this.p,'a_color');
    const r=gl.getUniformLocation(this.p,'u_resolution'); if(!r) throw new Error('light resolution'); this.res=r;
  }
  public render(frame:Readonly<RenderLightFrame>,preferences:Readonly<VisualPreferences>,width:number,height:number,dpr:number):void{
    const vertices:number[]=[]; const min=Math.min(width,height); const glow=preferences.reduceBloom?.28:1;
    for(const s of frame.localLights){
      pushDisc(vertices,s.position.x*width,s.position.y*height,s.radius*min,[s.color[0],s.color[1],s.color[2],s.intensity*glow]);
    }
    if(!preferences.reduceMotion){
      for(const packet of frame.listenerPackets){
        const p=bezier(packet.source,packet.target,packet.progress);
        const r=(3.2+packet.intensity*3.2)*dpr;
        pushDisc(vertices,p.x*width,p.y*height,r,[packet.color[0],packet.color[1],packet.color[2],0.52*packet.intensity*glow]);
        const tail=bezier(packet.source,packet.target,Math.max(0,packet.progress-0.055));
        pushDisc(vertices,tail.x*width,tail.y*height,r*1.55,[packet.color[0],packet.color[1],packet.color[2],0.14*packet.intensity*glow]);
      }
    }
    if(vertices.length===0) return;
    const gl=this.gl; const data=new Float32Array(vertices); const stride=8*4;
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE); gl.useProgram(this.p); gl.bindBuffer(gl.ARRAY_BUFFER,this.b); gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW); gl.uniform2f(this.res,width,height);
    gl.enableVertexAttribArray(this.pos); gl.vertexAttribPointer(this.pos,2,gl.FLOAT,false,stride,0);
    gl.enableVertexAttribArray(this.local); gl.vertexAttribPointer(this.local,2,gl.FLOAT,false,stride,8);
    gl.enableVertexAttribArray(this.color); gl.vertexAttribPointer(this.color,4,gl.FLOAT,false,stride,16);
    gl.drawArrays(gl.TRIANGLES,0,data.length/8);
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  }
  public destroy():void{this.gl.deleteBuffer(this.b);this.gl.deleteProgram(this.p);}
}
