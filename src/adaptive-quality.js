export class AdaptiveQuality {
 constructor(){this.reset();}
 reset(){this.seconds=0;this.frames=0;this.cooldown=12;}
 sample(dt,eligible,quality){
  if(!eligible||dt<=0||dt>.5){this.seconds=0;this.frames=0;return null;}
  if(this.cooldown>0){this.cooldown-=dt;return null;}
  this.seconds+=dt;this.frames++;
  if(this.seconds<5)return null;
  const fps=this.frames/this.seconds;this.seconds=0;this.frames=0;
  const next=fps<27?(quality==='high'?'balanced':quality==='balanced'?'low':null):fps>55&&quality==='low'?'balanced':null;
  if(next)this.cooldown=20;return next;
 }
}
