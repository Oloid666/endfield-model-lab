// Expanded room and explicit ramp layers; gameplay stays assisted at high speed.
import {COURSES} from './courses.js';
export {COURSES} from './courses.js';
export const ROOM_SCALE={horizontal:2,vertical:1.8},AVATAR_SCALE=.075,CRUISE_SPEED=2.5,MAX_SPEED=3.3,WIDTH=.8,CHECKPOINTS=[];
export let WAYPOINTS=[],FULL_LENGTH=0,LENGTH=0,SECTIONS=[],TARGETS=[];
let points=[],stops=[];
function selectCourse(id){const c=COURSES[id]||COURSES['1'];points=WAYPOINTS=c.points;stops=[0];for(let i=1;i<points.length;i++)stops.push(stops.at(-1)+Math.hypot(...points[i].map((v,j)=>v-points[i-1][j])));LENGTH=FULL_LENGTH=stops.at(-1);SECTIONS=c.sections.map(([index,label])=>({s:stops[index],label}));
 TARGETS=[2,3,4,5,7,9].filter(index=>index<stops.length-1).flatMap((index,j)=>[0,1].map(i=>({s:Math.min(LENGTH-1,stops[index]+.2+i*.35),offset:(j%2?1:-1)*(.48+i*.16),kind:i?'snack':'drink',radius:.16})));}
selectCourse('1');
export const sectionAt=s=>SECTIONS.findLast(section=>s>=section.s)||SECTIONS[0];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function route(s,offset=0){
 const u=clamp(s,0,FULL_LENGTH);let i=stops.findIndex((v,j)=>j>0&&v>=u)-1;if(i<0)i=points.length-2;
 const a=points[i],b=points[i+1],t=(u-stops[i])/(stops[i+1]-stops[i]);
 let p=a.map((v,j)=>v+(b[j]-v)*t),v=b.map((n,j)=>n-a[j]);
 for(const k of [i,i+1]){if(k<=0||k>=points.length-1)continue;const radius=Math.min(1.25,(stops[k]-stops[k-1])*.46,(stops[k+1]-stops[k])*.46);
  if(Math.abs(u-stops[k])>radius)continue;
  const q=(u-stops[k]+radius)/(2*radius),c=points[k],before=points[k-1],after=points[k+1];
  const start=c.map((n,j)=>n+(before[j]-n)*radius/(stops[k]-stops[k-1])),end=c.map((n,j)=>n+(after[j]-n)*radius/(stops[k+1]-stops[k]));
  p=c.map((n,j)=>(1-q)**2*start[j]+2*(1-q)*q*n+q*q*end[j]);v=c.map((n,j)=>2*(1-q)*(n-start[j])+2*q*(end[j]-n));break;
 }
 const len=Math.hypot(v[0],v[2])||1;return {x:p[0]-v[2]/len*offset,y:p[1],z:p[2]+v[0]/len*offset,fx:v[0]/len,fz:v[2]/len,s:u,slope:v[1]/(Math.hypot(...v)||1)};
}
export function curvatureAt(s){const a=route(s-.18),b=route(s+.18);return Math.atan2(a.fx*b.fz-a.fz*b.fx,a.fx*b.fx+a.fz*b.fz)/.36;}
export function speedStep(speed,slope,dt,{brake=false,entry=0}={}){
 // Gravity and drag change momentum. There is no pull toward a fixed cruising speed.
 const acceleration=-9.8*slope-.13-.045*speed*speed-(brake?9:0);
 let next=clamp(speed+acceleration*dt,0,MAX_SPEED);
 if(!brake){const minimum=slope>.02?Math.max(1.55,entry*.85):1.55;if(next<minimum)next=Math.min(minimum,next+2.8*dt);}
 return next;
}
// Only search around the current route layer. A swing must not jump to a nearby upper/lower track.
function projectDragon(x,z,hint,dt){
 const reach=Math.max(.045,dt*4),lo=Math.max(0,hint-reach),hi=Math.min(LENGTH+.6,hint+reach);
 let best=Infinity,at=hint;
 for(let i=0;i<=12;i++){const s=lo+(hi-lo)*i/12,p=route(s),distance=(p.x-x)**2+(p.z-z)**2;if(distance<best){best=distance;at=s;}}
 const p=route(at);return {s:at,offset:(x-p.x)*-p.fz+(z-p.z)*p.fx};
}
const P_MASS=1.8,D_MASS=.9,REST=.7,MAX_ROPE=1.22;
export function createIndoorGame(){
 const state={course:'1',running:false,finished:false,time:0,s:.9,offset:0,speed:1.65,sideSpeed:0,dragonS:0,dragonOffset:0,dragonSpeed:0,dragonSideSpeed:0,dragonX:0,dragonZ:0,dragonVX:0,dragonVZ:0,tension:0,ropeLength:REST,playerImpact:0,dragonImpact:0,score:0,recoveries:0,wallHits:0,peakSpeed:1.65,curvature:0,uphillEntry:0,uphill:false,uphillFloor:0,goods:[],events:[],eventId:0,combo:0,maxCombo:0,lastDragonHit:-Infinity,passed:false};
 let previousPX=0,previousPZ=0,slowTime=0,lastWall=-10;
 function placeFollower(){const d=route(Math.max(0,state.s-REST));Object.assign(state,{dragonS:d.s,dragonOffset:0,dragonX:d.x,dragonZ:d.z,dragonVX:d.fx*state.speed,dragonVZ:d.fz*state.speed,dragonSpeed:state.speed,dragonSideSpeed:0,tension:0,ropeLength:REST});const p=route(state.s,state.offset);previousPX=p.x;previousPZ=p.z;}
 function reset(course=state.course){state.course=COURSES[course]?course:'1';selectCourse(state.course);Object.assign(state,{running:false,finished:false,time:0,s:.9,offset:0,speed:1.65,sideSpeed:0,score:0,recoveries:0,wallHits:0,peakSpeed:1.65,curvature:0,uphillEntry:0,uphill:false,uphillFloor:0,combo:0,maxCombo:0,lastDragonHit:-Infinity,passed:false,events:[],eventId:0,playerImpact:0,dragonImpact:0});state.goods=TARGETS.map((t,i)=>{const p=route(t.s,t.offset);return {...t,id:i,x:p.x,z:p.z,hit:false,age:0,by:'',vx:0,vz:0};});slowTime=0;lastWall=-10;placeFollower();}
 function event(kind,extra={}){state.events.push({id:++state.eventId,kind,at:state.time,...extra});if(state.events.length>16)state.events.shift();}
 function recover(){if(!state.running)return;state.recoveries++;state.offset=0;state.speed=0;state.sideSpeed=0;state.combo=0;state.playerImpact=state.dragonImpact=0;slowTime=0;placeFollower();event('rescue');}

 function step(dt,input={}){
  if(!state.running||state.finished)return;dt=clamp(dt,0,1/60);if(!dt)return;state.time+=dt;
  state.playerImpact=Math.max(0,state.playerImpact-dt*3);state.dragonImpact=Math.max(0,state.dragonImpact-dt*2.5);
  if(state.time-state.lastDragonHit>2)state.combo=0;
  const steer=clamp(input.steer||0,-1,1),before=route(state.s,state.offset),frame=route(state.s);
  // Lateral force, not a lane-position target: releasing damps velocity without recentering.
  const curve=curvatureAt(state.s);state.curvature=curve;state.sideSpeed+=(steer*7-curve*state.speed*state.speed*.35)*dt;state.sideSpeed*=Math.exp(-dt*(steer?1.8:3.8));
  if(frame.slope>.02&&!state.uphill)state.uphillEntry=state.speed;state.uphill=frame.slope>.02;state.uphillFloor=state.uphill?Math.max(1.55,state.uphillEntry*.85):0;
  state.speed=speedStep(state.speed,frame.slope,dt,{brake:!!input.brake,entry:state.uphillEntry});
  const dx=state.dragonX-before.x,dz=state.dragonZ-before.z,dist=Math.hypot(dx,dz)||1,nx=dx/dist,nz=dz/dist;
  const pvx=frame.fx*state.speed-frame.fz*state.sideSpeed,pvz=frame.fz*state.speed+frame.fx*state.sideSpeed;
  const separating=(state.dragonVX-pvx)*nx+(state.dragonVZ-pvz)*nz;
  const force=dist>REST?clamp((dist-REST)*28+separating*2.6,0,35):0;state.tension=force;
  state.speed+=(nx*frame.fx+nz*frame.fz)*force/P_MASS*dt;
  state.sideSpeed+=(-nx*frame.fz+nz*frame.fx)*force/P_MASS*dt;
  state.dragonVX-=nx*force/D_MASS*dt;state.dragonVZ-=nz*force/D_MASS*dt;
  const df=route(state.dragonS),gravity=-9.8*df.slope;state.dragonVX+=df.fx*gravity*dt;state.dragonVZ+=df.fz*gravity*dt;
  state.dragonVX*=Math.exp(-dt*.18);state.dragonVZ*=Math.exp(-dt*.18);
  state.s=clamp(state.s+state.speed*dt,.3,LENGTH);state.offset+=state.sideSpeed*dt;
  const edge=WIDTH/2-.065;
  if(Math.abs(state.offset)>edge){const sign=Math.sign(state.offset),impact=Math.abs(state.sideSpeed);state.offset=sign*edge;state.sideSpeed=-sign*impact*.18;
   state.speed*=Math.exp(-dt*(.7+Math.min(1.2,Math.abs(curve)*state.speed*.5)));
   if(impact>.25&&state.time-lastWall>.2){lastWall=state.time;state.wallHits++;state.playerImpact=Math.min(.5,impact*.25);const at=route(state.s,state.offset);event('wall',{who:'player',s:state.s,x:at.x,z:at.z,strength:clamp(impact*.25,.12,.5)});}
  }
  state.dragonX+=state.dragonVX*dt;state.dragonZ+=state.dragonVZ*dt;
  let p=route(state.s,state.offset);
  // A compliant, two-body maximum stretch constraint, used only beyond the spring's range.
  for(let i=0;i<2;i++){
   const x=state.dragonX-p.x,z=state.dragonZ-p.z,len=Math.hypot(x,z)||1;
   if(len>MAX_ROPE){const error=len-MAX_ROPE,px=x/len*error/3,pz=z/len*error/3,f=route(state.s);state.s=clamp(state.s+px*f.fx+pz*f.fz,.3,LENGTH);state.offset=clamp(state.offset-px*f.fz+pz*f.fx,-edge,edge);state.dragonX-=x/len*error*2/3;state.dragonZ-=z/len*error*2/3;p=route(state.s,state.offset);}
  }
  let d=projectDragon(state.dragonX,state.dragonZ,state.dragonS,dt);state.dragonS=d.s;state.dragonOffset=d.offset;
  // Soft side boundary gives the follower room to swing, without an invisible wall at the player lane.
  if(Math.abs(d.offset)>.98){const f=route(d.s),sign=Math.sign(d.offset),over=Math.abs(d.offset)-.98;state.dragonX+=f.fz*sign*over;state.dragonZ-=f.fx*sign*over;const outward=(-f.fz*state.dragonVX+f.fx*state.dragonVZ)*sign;if(outward>0){state.dragonVX+=f.fz*sign*outward*1.2;state.dragonVZ-=f.fx*sign*outward*1.2;}state.dragonOffset=sign*.98;}
  // Prevent the two characters passing through each other under hard braking.
  const ax=state.dragonX-p.x,az=state.dragonZ-p.z,apart=Math.hypot(ax,az)||.001;
  if(apart<.16){state.dragonX+=ax/apart*(.16-apart);state.dragonZ+=az/apart*(.16-apart);}
  for(const g of state.goods){
   if(g.hit){g.age+=dt;continue;}
   const dd=Math.hypot(state.dragonX-g.x,state.dragonZ-g.z),pd=Math.hypot(p.x-g.x,p.z-g.z);
   const who=dd<g.radius+.07&&Math.abs(state.dragonS-g.s)<.65?'dragon':pd<g.radius+.045&&Math.abs(state.s-g.s)<.4?'player':null;
   if(!who)continue;
   const bx=who==='dragon'?state.dragonX:p.x,bz=who==='dragon'?state.dragonZ:p.z,dist=Math.hypot(g.x-bx,g.z-bz)||1,cx=(g.x-bx)/dist,cz=(g.z-bz)/dist;
   const vx=who==='dragon'?state.dragonVX:(p.x-previousPX)/dt,vz=who==='dragon'?state.dragonVZ:(p.z-previousPZ)/dt;
   const normalSpeed=Math.max(.15,vx*cx+vz*cz),impulse=normalSpeed*1.25/(1/(who==='dragon'?D_MASS:P_MASS)+1/.3);
   if(who==='dragon'){state.dragonVX-=cx*impulse/D_MASS;state.dragonVZ-=cz*impulse/D_MASS;state.dragonImpact=clamp(normalSpeed,.35,1);state.combo=state.time-state.lastDragonHit<=2?Math.min(5,state.combo+1):1;state.lastDragonHit=state.time;state.maxCombo=Math.max(state.maxCombo,state.combo);state.score+=100*state.combo;}
   else{const f=route(state.s),oldSpeed=state.speed;state.speed-=impulse/P_MASS*(cx*f.fx+cz*f.fz);state.speed=Math.max(oldSpeed*.75,state.speed);state.sideSpeed-=impulse/P_MASS*(-cx*f.fz+cz*f.fx);state.playerImpact=clamp(normalSpeed,.2,1);state.score+=10;}
   // Resolve a single contact, then debris leaves collision simulation permanently.
   g.hit=true;g.by=who;g.age=0;g.vx=vx+cx*impulse/.3;g.vz=vz+cz*impulse/.3;
   event('goods',{who,s:g.s,x:g.x,z:g.z,group:g.group,strength:clamp(normalSpeed/1.4,.2,1),combo:state.combo,points:who==='dragon'?100*state.combo:10});
  }
  p=route(state.s,state.offset);previousPX=p.x;previousPZ=p.z;
  const f=route(state.dragonS);state.dragonSpeed=state.dragonVX*f.fx+state.dragonVZ*f.fz;state.dragonSideSpeed=-state.dragonVX*f.fz+state.dragonVZ*f.fx;
  state.ropeLength=Math.hypot(p.x-state.dragonX,p.z-state.dragonZ);state.speed=clamp(state.speed,0,MAX_SPEED);state.peakSpeed=Math.max(state.peakSpeed,state.speed);const dv=Math.hypot(state.dragonVX,state.dragonVZ);if(dv>5.5){state.dragonVX*=5.5/dv;state.dragonVZ*=5.5/dv;}
  slowTime=!input.brake&&state.speed<.035&&state.s<LENGTH-.2?slowTime+dt:0;
  if(slowTime>2){recover();return;}
  if(state.s>=LENGTH-.03){state.finished=true;state.running=false;state.passed=true;event('finish');}
 }
 reset();return {state,reset,step,recover};
}
