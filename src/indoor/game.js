// Expanded room and explicit ramp layers; gameplay stays assisted at high speed.
export const ROOM_SCALE={horizontal:2,vertical:1.8},AVATAR_SCALE=.075,CRUISE_SPEED=1.05;
const points=[[-.8,.35,1.5],[-1.35,.35,.7],[-1.35,.35,-1.45],[-3.6,.74,-1.45],[-3.6,1.62,.8],[-2.32,1.62,.85],[-2.32,1.62,-.7],[-1.6,1.66,-1.5],[-.15,1.66,-1.5],[.28,1.66,-.75],[.28,1.66,.7],[1.3,1.72,1.2],[1.95,1.72,-.5],[2.5,1.72,.95],[2.95,1.72,.95]].map(([x,y,z])=>[x*ROOM_SCALE.horizontal,y*ROOM_SCALE.vertical,z*ROOM_SCALE.horizontal]);
const stops=[0];for(let i=1;i<points.length;i++)stops.push(stops.at(-1)+Math.hypot(...points[i].map((v,j)=>v-points[i-1][j])));
export const LENGTH=stops.at(-1),WIDTH=.85,CHECKPOINTS=[stops[3],stops[7]];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function route(s,offset=0){
 const u=clamp(s,0,LENGTH);let i=stops.findIndex((v,j)=>j>0&&v>=u)-1;if(i<0)i=points.length-2;
 const a=points[i],b=points[i+1],t=(u-stops[i])/(stops[i+1]-stops[i]);
 let p=a.map((v,j)=>v+(b[j]-v)*t),v=b.map((n,j)=>n-a[j]);
 // Round each corner; overlapping coplanar ribbon triangles otherwise flicker at right angles.
 for(const k of [i,i+1]){if(k<=0||k>=points.length-1)continue;const radius=Math.min(1.2,(stops[k]-stops[k-1])*.46,(stops[k+1]-stops[k])*.46);
  if(Math.abs(u-stops[k])>radius)continue;
  const q=(u-stops[k]+radius)/(2*radius),c=points[k],before=points[k-1],after=points[k+1];
  const start=c.map((n,j)=>n+(before[j]-n)*radius/(stops[k]-stops[k-1])),end=c.map((n,j)=>n+(after[j]-n)*radius/(stops[k+1]-stops[k]));
  p=c.map((n,j)=>(1-q)**2*start[j]+2*(1-q)*q*n+q*q*end[j]);v=c.map((n,j)=>2*(1-q)*(n-start[j])+2*q*(end[j]-n));break;
 }
 const len=Math.hypot(v[0],v[2])||1;return {x:p[0]-v[2]/len*offset,y:p[1],z:p[2]+v[0]/len*offset,fx:v[0]/len,fz:v[2]/len,s:u};
}

export function createIndoorGame(){
 const state={running:false,finished:false,time:0,s:0,offset:0,speed:0,dragonS:0,dragonOffset:0,dragonSpeed:0,dragonSideSpeed:0,liquid:.396,riseHold:10,wet:0,stalled:0,score:0,recoveries:0,checkpoint:0,goods:[],events:[],eventId:0};let saved;
 function reset(){Object.assign(state,{running:false,finished:false,time:0,s:.9,offset:0,speed:0,dragonS:.05,dragonOffset:0,dragonSpeed:0,dragonSideSpeed:0,liquid:.396,riseHold:10,wet:0,stalled:0,score:0,recoveries:0,checkpoint:0,events:[],eventId:0});state.goods=Array.from({length:30},(_,i)=>({s:2+i*(LENGTH-3)/30,offset:(i%3-1)*.29,kind:i%2?'snack':'drink',hit:false,age:0,by:''}));save();}
 function save(){saved={s:state.s,liquid:Math.min(state.liquid,route(state.s).y-.18),score:state.score,hits:state.goods.map(g=>g.hit)};}
 function recover(){if(!state.running)return;state.recoveries++;Object.assign(state,{s:saved.s,offset:0,speed:0,dragonS:Math.max(0,saved.s-.8),dragonOffset:0,dragonSpeed:0,dragonSideSpeed:0,liquid:saved.liquid,riseHold:Math.max(3,state.riseHold),wet:0,stalled:0,score:saved.score,events:[]});state.goods.forEach((g,i)=>{g.hit=saved.hits[i];g.age=g.hit?3:0;});}
 function event(kind,extra={}){state.events.push({id:++state.eventId,kind,at:state.time,...extra});if(state.events.length>8)state.events.shift();}
 function step(dt,input={}){
  if(!state.running||state.finished)return;dt=Math.min(Math.max(dt,0),1/30);state.time+=dt;
  const previous=state.s,target=input.brake?0:CRUISE_SPEED;state.speed+=(target-state.speed)*(1-Math.exp(-dt*5));state.s=clamp(state.s+state.speed*dt,0,LENGTH);
  state.offset+=(clamp(input.steer||0,-1,1)*.32-state.offset)*(1-Math.exp(-dt*7));
  const gap=state.s-state.dragonS;state.dragonSpeed+=(18*(gap-.76)+6*(state.speed-state.dragonSpeed))*dt;
  state.dragonS=clamp(state.dragonS+state.dragonSpeed*dt,0,Math.max(0,state.s-.12));
  state.dragonSideSpeed+=(12*(state.offset-state.dragonOffset)-2.8*state.dragonSideSpeed)*dt;state.dragonOffset+=state.dragonSideSpeed*dt;
  if(Math.abs(state.dragonOffset)>.33){state.dragonOffset=clamp(state.dragonOffset,-.33,.33);state.dragonSideSpeed*=-.3;}
  // One-time contacts become visual debris immediately; there are no blocking goods bodies.
  for(const g of state.goods){if(g.hit){g.age+=dt;continue;}const p=Math.abs(state.s-g.s)<.16&&Math.abs(state.offset-g.offset)<.16,d=Math.abs(state.dragonS-g.s)<.19&&Math.abs(state.dragonOffset-g.offset)<.18;
   if(p||d){g.hit=true;g.age=0;g.by=d?'dragon':'player';state.score+=d?200:75;event('goods',{s:g.s,offset:g.offset,who:g.by});}}
  if(state.riseHold>0)state.riseHold=Math.max(0,state.riseHold-dt);else state.liquid+=.07*dt;
  const submerged=state.liquid>Math.min(route(state.s).y,route(state.dragonS).y)+.035;
  state.wet=submerged?state.wet+dt:0;
  if(state.wet>=1){recover();event('rescue');return;}
  // Wait for the follower before activating a higher checkpoint or the finish platform.
  if(state.checkpoint<CHECKPOINTS.length&&state.dragonS>CHECKPOINTS[state.checkpoint]+.1){state.checkpoint++;save();event('checkpoint');}
  state.stalled=!input.brake&&state.s<LENGTH-.1&&state.s-previous<.000001?state.stalled+dt:0;
  if(state.stalled>2){recover();event('rescue');return;}
  if(state.s>=LENGTH-.001&&state.dragonS>=LENGTH-.84){state.finished=true;state.running=false;event('finish');}
 }
 reset();return {state,reset,step,recover};
}
