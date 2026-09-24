import type { VisualPreferences } from '../VisualQuality';
import { renderColorCss, withAlpha } from './RenderPalette';
import type { ListenerLightState } from './LightModel';
export class CanvasListenerLayer{
  public constructor(private readonly ctx:CanvasRenderingContext2D){}
  public render(position:{x:number;y:number},state:Readonly<ListenerLightState>,playing:boolean,recording:boolean,preferences:Readonly<VisualPreferences>,timestampMs:number,width:number,height:number,dpr:number){
    const x=position.x*width,y=position.y*height,r=42*dpr*(1+state.energy*.08),ctx=this.ctx,playBoost=playing?.04:0;
    ctx.save();
    const g=ctx.createRadialGradient(x,y,0,x,y,r*.95);g.addColorStop(0,renderColorCss(withAlpha(state.color,.82)));g.addColorStop(.45,renderColorCss(withAlpha(state.color,.12+state.energy*.14+playBoost)));g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=renderColorCss(withAlpha(recording?[1,.24,.42,1]:state.color,.22+state.energy*.22));ctx.lineWidth=Math.max(1,dpr);
    for(const scale of [.53,.78]){ctx.beginPath();ctx.arc(x,y,r*scale,0,Math.PI*2);ctx.stroke();}
    const time=preferences.reduceMotion?0:timestampMs*.001*.35;ctx.strokeStyle=renderColorCss(withAlpha(state.color,.15));for(let i=0;i<6;i++){const a=i/6*Math.PI*2+time;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r*.25,y+Math.sin(a)*r*.25);ctx.lineTo(x+Math.cos(a)*r*.46,y+Math.sin(a)*r*.46);ctx.stroke();}
    if(!preferences.reduceParticles){const a=time*1.4;ctx.beginPath();ctx.arc(x+Math.cos(a)*r*.88,y+Math.sin(a)*r*.88,Math.max(1,2*dpr),0,Math.PI*2);ctx.fillStyle=renderColorCss(withAlpha(state.color,.7));ctx.fill();}
    ctx.restore();
  }
}
