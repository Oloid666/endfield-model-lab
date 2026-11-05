export const qualityLocked=s=>['combat','aim-final','finisher','landing','heat','meal-spawn'].includes(s?.phase);
export class FrameStats{
 constructor(){this.reset();}
 reset(){this.samples=[];this.qualityChanges=0;}
 sample(seconds){if(!Number.isFinite(seconds)||seconds<=0)return;this.samples.push(seconds*1000);if(this.samples.length>240)this.samples.shift();}
 get state(){const a=[...this.samples].sort((x,y)=>x-y),sum=a.reduce((n,v)=>n+v,0);return {frames:a.length,averageMs:a.length?sum/a.length:0,p95Ms:a[Math.floor(a.length*.95)]||0,longFrames:a.filter(n=>n>100).length,qualityChanges:this.qualityChanges};}
}
