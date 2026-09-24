import type { VisualPreferences } from '../VisualQuality';
import { LINK_RENDER_COLORS,ROLE_RENDER_COLORS,fieldInfluencedColor,mixRenderColor,renderColorCss,withAlpha } from './RenderPalette';
import { crossAffectedLinkPoints,curvedLinkPoints,type PixelPoint } from './LinkGeometry';
import { semanticLinkPacketDirections } from './LightModel';
import type { RenderEventSample,RenderLink,RenderLinkGhost,RenderLinkCrossInteraction } from './RenderTypes';
function colorFor(role:keyof typeof ROLE_RENDER_COLORS,type:keyof typeof LINK_RENDER_COLORS,cross:RenderLinkCrossInteraction){return fieldInfluencedColor(mixRenderColor(ROLE_RENDER_COLORS[role],LINK_RENDER_COLORS[type],.28),cross.fieldInfluence);}
function point(points:readonly PixelPoint[],p:number){if(points.length<2)return null;const s=Math.max(0,Math.min(1,p))*(points.length-1),i=Math.min(points.length-2,Math.floor(s)),f=s-i,a=points[i]!,b=points[i+1]!;return{x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f};}
export class CanvasLinkLightLayer{
 public constructor(private readonly ctx:CanvasRenderingContext2D){}
 public render(links:readonly RenderLink[],preferences:Readonly<VisualPreferences>,events:readonly RenderEventSample[],width:number,height:number,dpr:number){
  for(const l of links)this.draw(l,preferences,events,width,height,dpr,1);
  for(const s of events){if(s.event.kind!=='link-deleted')continue;this.drawGhost(s.event.link,preferences,width,height,dpr,Math.pow(1-s.progress,1.4));}
 }
 private draw(l:RenderLink,preferences:Readonly<VisualPreferences>,events:readonly RenderEventSample[],width:number,height:number,dpr:number,alpha:number){
  const pts=crossAffectedLinkPoints(curvedLinkPoints(l.id,l.source,l.target,width,height,20),l.cross,width,height);const created=events.find(s=>s.event.kind==='link-created'&&s.event.linkId===l.id);const reveal=created?Math.min(1,created.progress*1.35):1;const max=Math.max(1,Math.ceil((pts.length-1)*reveal));const a=colorFor(l.sourceRole,l.type,l.cross),b=colorFor(l.targetRole,l.type,l.cross);const grad=this.ctx.createLinearGradient(pts[0]!.x,pts[0]!.y,pts.at(-1)!.x,pts.at(-1)!.y);grad.addColorStop(0,renderColorCss(withAlpha(a,alpha)));grad.addColorStop(1,renderColorCss(withAlpha(b,alpha)));
  this.ctx.save();this.ctx.beginPath();this.ctx.moveTo(pts[0]!.x,pts[0]!.y);for(let i=1;i<=max&&i<pts.length;i++){if(l.cross.fieldInfluence.frost>.34&&i%2===0)continue;this.ctx.lineTo(pts[i]!.x,pts[i]!.y);}this.ctx.strokeStyle=grad;this.ctx.lineCap='round';this.ctx.lineJoin='round';this.ctx.lineWidth=(l.selected?3.4:2.1)*dpr;this.ctx.shadowBlur=preferences.reduceBloom?2*dpr:8*dpr;this.ctx.shadowColor=renderColorCss(withAlpha(mixRenderColor(a,b,.5),preferences.reduceBloom?.12:.3));this.ctx.stroke();this.ctx.restore();
  for(const s of events){if(s.event.kind!=='link-pulse'||s.event.linkId!==l.id)continue;for(const p of semanticLinkPacketDirections(l,s.progress)){const q=point(pts,p);if(!q)continue;const c=mixRenderColor(a,b,p);this.ctx.beginPath();this.ctx.arc(q.x,q.y,(3.2+s.event.intensity*3.5)*dpr,0,Math.PI*2);this.ctx.fillStyle=renderColorCss(withAlpha(c,(1-s.progress)*.9));this.ctx.fill();}}
 }
 private drawGhost(g:RenderLinkGhost,preferences:Readonly<VisualPreferences>,width:number,height:number,dpr:number,alpha:number){
  const pts=crossAffectedLinkPoints(curvedLinkPoints(g.id,g.source,g.target,width,height,20),g.cross,width,height),a=colorFor(g.sourceRole,g.type,g.cross),b=colorFor(g.targetRole,g.type,g.cross),grad=this.ctx.createLinearGradient(pts[0]!.x,pts[0]!.y,pts.at(-1)!.x,pts.at(-1)!.y);grad.addColorStop(0,renderColorCss(withAlpha(a,alpha)));grad.addColorStop(1,renderColorCss(withAlpha(b,alpha)));this.ctx.save();this.ctx.beginPath();this.ctx.moveTo(pts[0]!.x,pts[0]!.y);for(let i=1;i<pts.length;i++)this.ctx.lineTo(pts[i]!.x,pts[i]!.y);this.ctx.strokeStyle=grad;this.ctx.lineWidth=2.4*dpr*alpha;this.ctx.shadowBlur=preferences.reduceBloom?0:5*dpr;this.ctx.shadowColor=renderColorCss(withAlpha(mixRenderColor(a,b,.5),alpha*.3));this.ctx.stroke();this.ctx.restore();
 }
}
