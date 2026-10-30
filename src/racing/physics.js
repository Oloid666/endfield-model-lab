import {road,project,LENGTH,WIDTH,BENDS} from './track.js';
export {LENGTH,WIDTH} from './track.js';
export const ROPES={medium:{label:'中繩',rest:4.5,max:6.5},long:{label:'長繩',rest:6,max:8.5}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const speed=b=>Math.hypot(b.vx,b.vz);
function body(s,offset,mass,radius){const p=road(s,offset);return {x:p.x,z:p.z,s,vx:0,vz:0,heading:p.heading,yaw:0,mass,radius,impact:0,spin:0,offset};}
export function createRace(){
  const state={running:false,finished:false,time:0,score:0,hits:0,wallHits:0,peak:0,ropeMode:'medium',ropeLength:4.5,tension:0,slip:0,speed:0,player:null,dragon:null,boxes:[],events:[],eventId:0};
  let contacts=new Map();
  function reset(mode=state.ropeMode){
    state.ropeMode=ROPES[mode]?mode:'medium';const config=ROPES[state.ropeMode];
    Object.assign(state,{running:false,finished:false,time:0,score:0,hits:0,wallHits:0,peak:0,ropeLength:config.rest,tension:0,slip:0,speed:0,events:[],eventId:0});contacts=new Map();
    state.player=body(8,0,1.8,.55);state.dragon=body(8-config.rest,0,1.05,.75);
    const targets=[{s:35,offset:-3.8},{s:43,offset:3.8}];
    for(const b of BENDS)for(let i=0;i<6;i++)targets.push({s:b.start+27+i*4.5,offset:-b.side*(i%2?5.3:3.8)});
    state.boxes=targets.map((t,i)=>({...body(t.s,t.offset,.7,.65),id:i,hit:false,angle:i*.23}));
  }
  function event(kind,b,strength,x=b.x,z=b.z,key=kind){
    if(strength<1.5||state.time-(contacts.get(key)??-Infinity)<.16)return;
    contacts.set(key,state.time);b.impact=Math.max(b.impact,clamp(strength/17,.12,1));
    state.events.push({id:++state.eventId,kind,who:b===state.dragon?'dragon':'player',strength:clamp(strength/22,0,1),x,z,s:b.s,at:state.time});
    if(state.events.length>12)state.events.shift();
  }
  function wall(b,notify=true){
    const p=project(b.x,b.z,b.s);b.s=p.s;b.offset=p.offset;
    const excess=Math.abs(p.offset)-(WIDTH-b.radius);
    if(excess<=0)return;
    const sign=Math.sign(p.offset),nx=p.nx*sign,nz=p.nz*sign;
    b.x-=nx*excess;b.z-=nz*excess;
    const outward=b.vx*nx+b.vz*nz;
    if(outward>0){
      b.vx-=nx*outward*1.18;b.vz-=nz*outward*1.18;
      if(notify){event('wall',b,outward,b.x+nx*b.radius,b.z+nz*b.radius,`wall:${b===state.dragon?'d':'p'}`);if(outward>3)state.wallHits++;}
    }
  }
  function collide(a,b,key,notify=true){
    const dx=b.x-a.x,dz=b.z-a.z,dist=Math.hypot(dx,dz),radius=a.radius+b.radius;
    if(dist>=radius)return;
    const nx=dist>.00001?dx/dist:1,nz=dist>.00001?dz/dist:0,ia=1/a.mass,ib=1/b.mass,total=ia+ib;
    const penetration=(radius-dist)*.85;
    a.x-=nx*penetration*ia/total;a.z-=nz*penetration*ia/total;b.x+=nx*penetration*ib/total;b.z+=nz*penetration*ib/total;
    const closing=(a.vx-b.vx)*nx+(a.vz-b.vz)*nz;
    if(closing<=0)return;
    const impulse=closing*1.22/total;
    a.vx-=nx*impulse*ia;a.vz-=nz*impulse*ia;b.vx+=nx*impulse*ib;b.vz+=nz*impulse*ib;
    b.spin+=clamp(((a.vx-b.vx)*nz-(a.vz-b.vz)*nx)*.22,-5,5);
    if(notify){
      event('box',a,closing,a.x+nx*a.radius,a.z+nz*a.radius,key);
      if(!b.hit&&closing>2.5){b.hit=true;state.hits++;state.score+=a===state.dragon?200:75;}
    }
  }
  function constrainRope(){
    const p=state.player,d=state.dragon,config=ROPES[state.ropeMode];
    const dx=d.x-p.x,dz=d.z-p.z,dist=Math.hypot(dx,dz)||1;
    if(dist<=config.max)return;
    const nx=dx/dist,nz=dz/dist,ip=1/p.mass,id=1/d.mass,total=ip+id,correction=dist-config.max;
    // Both bodies respond; this constraint only handles the final stretch limit.
    p.x+=nx*correction*ip/total;p.z+=nz*correction*ip/total;d.x-=nx*correction*id/total;d.z-=nz*correction*id/total;
    const separating=(d.vx-p.vx)*nx+(d.vz-p.vz)*nz;
    if(separating>0){p.vx+=nx*separating*ip/total;p.vz+=nz*separating*ip/total;d.vx-=nx*separating*id/total;d.vz-=nz*separating*id/total;}
  }
  function recover(){
    if(!state.running)return;
    const s=clamp(state.player.s-2,8,LENGTH-2),config=ROPES[state.ropeMode];
    state.player=body(s,0,1.8,.55);state.dragon=body(s-config.rest,0,1.05,.75);state.tension=0;state.slip=0;state.speed=0;state.ropeLength=config.rest;
  }
  function step(dt,input={}){
    if(!state.running||state.finished||dt<=0)return;
    // Callers use fixed substeps. Bound accidental long steps without advancing a large gap.
    dt=Math.min(dt,1/60);state.time+=dt;
    const p=state.player,d=state.dragon,steer=clamp(input.steer||0,-1,1),brake=!!input.brake,drift=!!input.drift,config=ROPES[state.ropeMode];
    const currentSpeed=speed(p),turn=steer*(brake?1.42:1.14)*clamp(currentSpeed/12,.35,1);
    p.yaw+=(turn-p.yaw)*(1-Math.exp(-dt*8));p.heading=wrap(p.heading+p.yaw*dt);
    const fx=Math.sin(p.heading),fz=-Math.cos(p.heading),nx=Math.cos(p.heading),nz=Math.sin(p.heading);
    let forward=p.vx*fx+p.vz*fz,lateral=p.vx*nx+p.vz*nz;
    const target=brake?4:input.boost?28:24;
    forward+=clamp((target-forward)*(brake?3.8:1.15),-45,19)*dt;
    lateral*=Math.exp(-dt*(drift?1.35:6.8));
    p.vx=fx*forward+nx*lateral;p.vz=fz*forward+nz*lateral;state.slip=Math.abs(lateral);
    // Slack rope only pulls. Spring force and damping are equal and opposite.
    const dx=d.x-p.x,dz=d.z-p.z,dist=Math.hypot(dx,dz)||1,nrx=dx/dist,nrz=dz/dist;
    const separating=(d.vx-p.vx)*nrx+(d.vz-p.vz)*nrz;
    const force=dist>config.rest?clamp((dist-config.rest)*34+separating*5.5,0,170):0;
    p.vx+=nrx*force/p.mass*dt;p.vz+=nrz*force/p.mass*dt;d.vx-=nrx*force/d.mass*dt;d.vz-=nrz*force/d.mass*dt;state.tension=force;
    d.vx*=Math.exp(-dt*.24);d.vz*=Math.exp(-dt*.24);
    for(const b of [p,d,...state.boxes]){
      b.x+=b.vx*dt;b.z+=b.vz*dt;b.impact=Math.max(0,b.impact-dt*2.8);
      if(b!==p&&b!==d){b.vx*=Math.exp(-dt*1.7);b.vz*=Math.exp(-dt*1.7);b.angle+=b.spin*dt;b.spin*=Math.exp(-dt*2);}
    }
    for(let i=0;i<3;i++){
      collide(p,d,'',false);wall(p,i===0);wall(d,i===0);constrainRope();
      for(const b of state.boxes){collide(p,b,`p:${b.id}`,i===0);collide(d,b,`d:${b.id}`,i===0);wall(b,false);}
      for(let a=0;a<state.boxes.length;a++)for(let b=a+1;b<state.boxes.length;b++)collide(state.boxes[a],state.boxes[b],'',false);
    }
    // Finish solving against the road after collisions; the final rope solve is mass weighted.
    for(let i=0;i<3;i++){wall(p,false);wall(d,false);constrainRope();}
    for(const b of [p,d]){const at=project(b.x,b.z,b.s);b.s=at.s;b.offset=at.offset;}
    if(speed(d)>1)d.heading=Math.atan2(d.vx,-d.vz);
    state.ropeLength=Math.hypot(p.x-d.x,p.z-d.z);state.speed=speed(p);state.peak=Math.max(state.peak,state.speed*3.6);
    const finish=road(LENGTH),beyond=(p.x-finish.x)*Math.sin(finish.heading)+(p.z-finish.z)*-Math.cos(finish.heading);
    if(p.s>LENGTH-1&&beyond>=0){state.finished=true;state.running=false;}
  }
  reset();return {state,reset,step,recover};
}
