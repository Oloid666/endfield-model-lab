export const LENGTH=600, WIDTH=7.2;
export const center=s=>9*Math.sin(s/48)-9*Math.sin(0);
export const slope=s=>9/48*Math.cos(s/48);
export const height=s=>22-s*.035;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createRace(){
 const state={running:false,finished:false,time:0,score:0,hits:0,wallHits:0,peak:0,impact:0,impactKind:'',player:{x:0,s:0,vx:0,vs:0},dragon:{x:0,s:-3.1,vx:0,vs:0},boxes:[]};
 function reset(){Object.assign(state,{running:false,finished:false,time:0,score:0,hits:0,wallHits:0,peak:0,impact:0,impactKind:''});Object.assign(state.player,{x:0,s:0,vx:0,vs:0});Object.assign(state.dragon,{x:0,s:-3.1,vx:0,vs:0});state.boxes=Array.from({length:30},(_,i)=>{const s=55+i*17;return {s,x:center(s)+(i%3-1)*3.8,vx:0,vs:0,hit:false};});}
 function wall(b,r){const c=center(b.s),max=WIDTH-r,off=b.x-c;if(Math.abs(off)>max){b.x=c+Math.sign(off)*max;const force=Math.abs(b.vx-b.vs*slope(b.s));b.vx=b.vs*slope(b.s)-Math.sign(off)*force*.35;b.vs*=.97;if(force>2&&state.impact<.08){state.wallHits++;state.impact=.28;state.impactKind='wall';}}}
 function step(dt,input={}){
  if(!state.running||state.finished)return;
  state.time+=dt;state.impact=Math.max(0,state.impact-dt);
  const p=state.player,d=state.dragon,steer=clamp(input.steer||0,-1,1),brake=!!input.brake,drift=!!input.drift;
  const target=brake?5:input.boost?30:25;
  p.vs+=(target-p.vs)*dt*(brake?3.6:.8);
  const desired=p.vs*(slope(p.s)+steer*(drift?.91:.62));
  p.vx+=(desired-p.vx)*Math.min(1,dt*(drift?2.2:5));
  p.x+=p.vx*dt;p.s+=p.vs*dt;wall(p,.48);
  // A separate inertial body, spring/damping coupling and a bounded rope.
  let dx=p.x-d.x,dz=p.s-d.s,dist=Math.hypot(dx,dz)||1;
  const tension=Math.max(0,dist-2.9),relative=((p.vx-d.vx)*dx+(p.vs-d.vs)*dz)/dist;
  const force=tension>0?Math.max(0,44*tension+6*relative):0;
  d.vx+=dx/dist*force*dt;d.vs+=dz/dist*force*dt;
  d.vx*=Math.exp(-.65*dt);d.vs*=Math.exp(-.22*dt);d.x+=d.vx*dt;d.s+=d.vs*dt;wall(d,.63);
  dx=d.x-p.x;dz=d.s-p.s;dist=Math.hypot(dx,dz);if(dist>5){d.x=p.x+dx/dist*5;d.s=p.s+dz/dist*5;const out=((d.vx-p.vx)*dx+(d.vs-p.vs)*dz)/dist;if(out>0){d.vx-=out*dx/dist;d.vs-=out*dz/dist;}}
  for(const box of state.boxes){box.x+=box.vx*dt;box.s+=box.vs*dt;box.vx*=Math.exp(-2*dt);box.vs*=Math.exp(-2*dt);
   if(box.hit)continue;
   for(const [body,r] of [[p,1.05],[d,1.25]]){const x=box.x-body.x,z=box.s-body.s,dd=Math.hypot(x,z);if(dd<r){const speed=Math.hypot(body.vx,body.vs);if(speed<1)continue;box.hit=true;box.vx=body.vx*.8+x*3;box.vs=body.vs*.8+z*3;body.vx*=.65;body.vs*=.68;state.hits++;state.score+=body===d?200:75;state.impact=.4;state.impactKind=body===d?'dragon':'box';break;}}
  }
  state.peak=Math.max(state.peak,p.vs*3.6);if(p.s>=LENGTH){state.finished=true;state.running=false;}
 }
 reset();return {state,reset,step};
}
