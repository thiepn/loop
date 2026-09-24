import type { VisualPreferences } from '../VisualQuality';
import { renderColorCss, withAlpha } from './RenderPalette';
import type { RenderLightFrame } from './LightModel';

function bezier(a:{x:number;y:number},b:{x:number;y:number},t:number){
  const cx=(a.x+b.x)/2; const cy=(a.y+b.y)/2-0.07;
  const u=1-t; return {x:u*u*a.x+2*u*t*cx+t*t*b.x,y:u*u*a.y+2*u*t*cy+t*t*b.y};
}
export class CanvasLightPropagationLayer{
  public constructor(private readonly context:CanvasRenderingContext2D){}
  public render(frame:Readonly<RenderLightFrame>,preferences:Readonly<VisualPreferences>,width:number,height:number,dpr:number):void{
    const ctx=this.context; const min=Math.min(width,height);
    ctx.save(); ctx.globalCompositeOperation='lighter';
    for(const s of frame.localLights){
      const x=s.position.x*width,y=s.position.y*height,r=s.radius*min;
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,renderColorCss(withAlpha(s.color,s.intensity*0.52)));
      g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    }
    if(!preferences.reduceMotion){
      for(const packet of frame.listenerPackets){
        const p=bezier(packet.source,packet.target,packet.progress);
        ctx.beginPath();ctx.arc(p.x*width,p.y*height,(3.2+packet.intensity*3.2)*dpr,0,Math.PI*2);
        ctx.fillStyle=renderColorCss(withAlpha(packet.color,0.65*packet.intensity));ctx.fill();
      }
    }
    ctx.restore();
  }
}
