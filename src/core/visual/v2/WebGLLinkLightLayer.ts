import { DynamicVertexBuffer } from './DynamicVertexBuffer';
import type { VisualPreferences } from '../VisualQuality';
import {
  LINK_RENDER_COLORS,
  ROLE_RENDER_COLORS,
  fieldInfluencedColor,
  mixRenderColor,
  type RenderColor,
} from './RenderPalette';
import {
  crossAffectedLinkPoints,
  curvedLinkPoints,
  type PixelPoint,
} from './LinkGeometry';
import { semanticLinkPacketDirections } from './LightModel';
import { linkChoreographyBoost } from './ChoreographyModel';
import type {
  RenderEventSample,
  RenderLink,
  RenderLinkGhost,
  RenderLinkCrossInteraction,
} from './RenderTypes';

const VS='#version 300 es\nin vec2 a_position;in vec4 a_color;uniform vec2 u_resolution;out vec4 v_color;void main(){vec2 p=a_position/u_resolution*2.-1.;p.y=-p.y;gl_Position=vec4(p,0.,1.);v_color=a_color;}';
const FS='#version 300 es\nprecision mediump float;in vec4 v_color;out vec4 out_color;void main(){out_color=v_color;}';
function sh(gl:WebGL2RenderingContext,t:number,s:string){const x=gl.createShader(t);if(!x)throw new Error("link shader");gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS)){const m=gl.getShaderInfoLog(x)??"link";gl.deleteShader(x);throw new Error(m);}return x;}
function prog(gl:WebGL2RenderingContext){const v=sh(gl,gl.VERTEX_SHADER,VS),f=sh(gl,gl.FRAGMENT_SHADER,FS),p=gl.createProgram();if(!p)throw new Error("link program");gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const m=gl.getProgramInfoLog(p)??"link";gl.deleteProgram(p);throw new Error(m);}return p;}
function colorFor(role: keyof typeof ROLE_RENDER_COLORS,type:keyof typeof LINK_RENDER_COLORS,cross:RenderLinkCrossInteraction){return fieldInfluencedColor(mixRenderColor(ROLE_RENDER_COLORS[role],LINK_RENDER_COLORS[type],.28),cross.fieldInfluence);}
function pushV(t:number[],x:number,y:number,c:RenderColor,a:number){t.push(x,y,c[0],c[1],c[2],c[3]*a);}
function ribbon(t:number[],a:PixelPoint,b:PixelPoint,w:number,c1:RenderColor,c2:RenderColor,alpha:number){const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy);if(l<.01)return;const nx=-dy/l*w/2,ny=dx/l*w/2;pushV(t,a.x+nx,a.y+ny,c1,alpha);pushV(t,a.x-nx,a.y-ny,c1,alpha);pushV(t,b.x+nx,b.y+ny,c2,alpha);pushV(t,b.x+nx,b.y+ny,c2,alpha);pushV(t,a.x-nx,a.y-ny,c1,alpha);pushV(t,b.x-nx,b.y-ny,c2,alpha);}
function diamond(t:number[],p:PixelPoint,r:number,c:RenderColor,a:number){pushV(t,p.x,p.y-r,c,a);pushV(t,p.x+r,p.y,c,a);pushV(t,p.x,p.y+r,c,a);pushV(t,p.x,p.y-r,c,a);pushV(t,p.x,p.y+r,c,a);pushV(t,p.x-r,p.y,c,a);}
function pathPoint(points:readonly PixelPoint[],progress:number):PixelPoint|null{if(points.length<2)return null;const scaled=Math.max(0,Math.min(1,progress))*(points.length-1);const i=Math.min(points.length-2,Math.floor(scaled));const f=scaled-i;const a=points[i]!,b=points[i+1]!;return{x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f};}
function createdProgress(id:string,events:readonly RenderEventSample[]){for(const s of events)if(s.event.kind==='link-created'&&s.event.linkId===id)return s.progress;return null;}
function pulseProgress(id:string,events:readonly RenderEventSample[]){
  return events.filter(
    (s): s is RenderEventSample & {event:{kind:'link-pulse';linkId:string;intensity:number}} =>
      s.event.kind==='link-pulse'&&s.event.linkId===id,
  );
}
function ghostLinks(events:readonly RenderEventSample[]){return events.filter((s):s is RenderEventSample & {event:{kind:'link-deleted';link:RenderLinkGhost}}=>s.event.kind==='link-deleted');}

export class WebGLLinkLightLayer{
 private readonly p:WebGLProgram;private readonly b:WebGLBuffer;private readonly pos:number;private readonly color:number;private readonly res:WebGLUniformLocation;private readonly v:number[]=[];private readonly uploader:DynamicVertexBuffer;
 public constructor(private readonly gl:WebGL2RenderingContext){this.p=prog(gl);const b=gl.createBuffer();if(!b)throw new Error("link buffer");this.b=b;this.uploader=new DynamicVertexBuffer(gl,b);this.pos=gl.getAttribLocation(this.p,'a_position');this.color=gl.getAttribLocation(this.p,'a_color');const r=gl.getUniformLocation(this.p,'u_resolution');if(!r)throw new Error("link res");this.res=r;}
 public render(links:readonly RenderLink[],preferences:Readonly<VisualPreferences>,events:readonly RenderEventSample[],width:number,height:number,dpr:number):void{
  const v=this.v;v.length=0;const boost=linkChoreographyBoost(events);
  for(const link of links)this.pushLink(v,link,preferences,events,width,height,dpr,1,boost);
  for(const sample of ghostLinks(events)){const g=sample.event.link;this.pushGhost(v,g,preferences,width,height,dpr,Math.pow(1-sample.progress,1.4));}
  if(v.length===0)return;const gl=this.gl,length=this.uploader.upload(v),stride=6*4;gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(this.p);gl.uniform2f(this.res,width,height);gl.enableVertexAttribArray(this.pos);gl.vertexAttribPointer(this.pos,2,gl.FLOAT,false,stride,0);gl.enableVertexAttribArray(this.color);gl.vertexAttribPointer(this.color,4,gl.FLOAT,false,stride,8);gl.drawArrays(gl.TRIANGLES,0,length/6);
 }
 private pushLink(v:number[],link:RenderLink,preferences:Readonly<VisualPreferences>,events:readonly RenderEventSample[],width:number,height:number,dpr:number,alpha:number,boost:number){
  const points=crossAffectedLinkPoints(curvedLinkPoints(link.id,link.source,link.target,width,height,20),link.cross,width,height);
  const created=createdProgress(link.id,events);const reveal=created===null?1:Math.min(1,created*1.35);
  const max=Math.max(1,Math.ceil((points.length-1)*reveal));
  const a=colorFor(link.sourceRole,link.type,link.cross),b=colorFor(link.targetRole,link.type,link.cross);
  const selected=link.selected?1:0;const baseW=(selected?3.4:2.1)*dpr*(1+link.cross.fieldInfluence.space*.16)*(1+boost*.08);const glowW=baseW*(preferences.reduceBloom?1.8:3.3)*(1+boost*.18);
  for(let i=1;i<=max&&i<points.length;i++){if(link.cross.fieldInfluence.frost>.34&&i%2===0)continue;const t0=(i-1)/(points.length-1),t1=i/(points.length-1),c0=mixRenderColor(a,b,t0),c1=mixRenderColor(a,b,t1);ribbon(v,points[i-1]!,points[i]!,glowW,c0,c1,alpha*(preferences.reduceBloom?.08:.13)*(1+boost*.25));ribbon(v,points[i-1]!,points[i]!,baseW,c0,c1,alpha*(selected?.9:.62)*(1+boost*.12));}
  for(const sample of pulseProgress(link.id,events)){for(const p of semanticLinkPacketDirections(link,sample.progress)){const pt=pathPoint(points,p);if(!pt)continue;const c=mixRenderColor(a,b,p);diamond(v,pt,(3.4+sample.event.intensity*3.6)*dpr,c,(1-sample.progress)*.9);}}
 }
 private pushGhost(v:number[],g:RenderLinkGhost,preferences:Readonly<VisualPreferences>,width:number,height:number,dpr:number,alpha:number){
  const points=crossAffectedLinkPoints(curvedLinkPoints(g.id,g.source,g.target,width,height,20),g.cross,width,height);const a=colorFor(g.sourceRole,g.type,g.cross),b=colorFor(g.targetRole,g.type,g.cross);
  for(let i=1;i<points.length;i++){const t0=(i-1)/(points.length-1),t1=i/(points.length-1);ribbon(v,points[i-1]!,points[i]!,2.4*dpr*alpha,mixRenderColor(a,b,t0),mixRenderColor(a,b,t1),alpha*(preferences.reduceBloom?.28:.48));}
 }
 public destroy(){this.gl.deleteBuffer(this.b);this.gl.deleteProgram(this.p);}
}
