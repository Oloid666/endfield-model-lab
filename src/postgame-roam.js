import {groundPath} from './ground-path.js';
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);

// Match the existing walking map, keeping a little room for the creature's body.
export function postgameFree(p,environment={},radius=.24){
 const [x,,z]=p;
 if(x< -7+radius||x>7-radius||z< -1.72+radius||z>12-radius)return false;
 if(z<2.3&&(x< -4+radius||x>4-radius))return false;
 if(environment.intact===false)return true;
 if(Math.abs(z-1.895)<radius+.065&&(x< -.8+radius||x>.36-radius))return false;
 return !(environment.floorPlan?.obstacles||[]).some(o=>Math.abs(x-o.x)<o.w/2+radius&&Math.abs(z-o.z)<o.d/2+radius);
}

export class DragonRoam{
 constructor(){this.reset();}
 reset(){this.position=null;this.anchor=null;this.goal=null;this.path=[];this.last=null;this.nextAt=0;this.seed=711;this.heading=.9;this.mode='idle';this.lookIndex=0;this.lookAt=0;}
 random(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296;}
 update(time,hero,current,environment={}){
  const changed=!this.position||distance(this.position,current)>.55||Math.abs(this.position[1]-current[1])>.65;
  if(changed){this.position=[...current];this.anchor=[...hero];this.path=[];this.goal=null;this.nextAt=time;this.last=time;}
  const dt=Math.max(0,Math.min(.1,time-this.last));this.last=time;
  if(distance(this.anchor,hero)>2.5){this.anchor=[...hero];this.goal=null;this.nextAt=time;}
  if(dt>0&&(!this.goal||time>=this.nextAt)){
   this.goal=null;this.path=[];
   for(let i=0;i<14;i++){
    const angle=this.random()*Math.PI*2,r=1+this.random()*1.5,p=[this.anchor[0]+Math.cos(angle)*r,1.2+this.random(),this.anchor[2]+Math.sin(angle)*r];
    if(environment.intact!==false&&p[2]<2.3)p[1]=1.15+this.random()*.4;
    if(!postgameFree(p,environment,.30))continue;
    const path=groundPath(this.position,p,environment.floorPlan?.obstacles||[],environment.intact!==false,q=>postgameFree(q,environment,.30));
    if(!path.length)continue;this.goal=p;this.path=path;break;
   }
   this.nextAt=time+3+this.random()*3;
  }
  this.mode='looking';
  const p=this.position,next=this.path[0];
  if(dt>0&&next){
   const dx=next[0]-p[0],dz=next[2]-p[2],d=Math.hypot(dx,dz),nearDoor=Math.abs(p[2]-1.895)<.7&&Math.abs(p[0]+.22)<.6;
   let blocked=false;if(nearDoor&&environment.intact!==false){environment.doors?.requestPassage(time);blocked=environment.doors&&!environment.doors.isOpen;}
   if(!blocked){const move=Math.min(d,dt*(distance(hero,p)>4?1.05:.72));if(d>.001){const candidate=[p[0]+dx/d*move,p[1],p[2]+dz/d*move];if(postgameFree(candidate,environment,.27)){p[0]=candidate[0];p[2]=candidate[2];this.heading+=wrap(Math.atan2(dx,dz)-this.heading)*Math.min(1,dt*4);this.mode='flying';}else{this.path=[];this.goal=null;this.nextAt=time+1;}}if(d<.07)this.path.shift();}
   else this.mode='waiting-door';
  }
  if(dt>0){const wanted=this.goal?.[1]??Math.min(2.2,p[1]);p[1]+=(wanted-p[1])*(1-Math.exp(-dt*1.6));}
  if(time>=this.lookAt&&dt>0){this.lookIndex=(this.lookIndex+1)%5;this.lookAt=time+2.5+this.random()*2;}
  const look=[[0,2,1.5],[7.7,2.4,-.5],[1,1.2,8],[hero[0],hero[1]+1.4,hero[2]],environment.meal||[hero[0]+.6,.3,hero[2]+.6]][this.lookIndex];
  const desired=Math.atan2(look[0]-p[0],look[2]-p[2]);if(this.mode==='looking'&&dt>0)this.heading+=wrap(desired-this.heading)*(1-Math.exp(-dt*1.5));
  return {position:[...p],heading:this.heading,lookYaw:Math.max(-.55,Math.min(.55,wrap(desired-this.heading))),lookPitch:Math.max(-.20,Math.min(.2,(p[1]-look[1])*.14)),mode:this.mode,goal:this.goal&&[...this.goal]};
 }
}
