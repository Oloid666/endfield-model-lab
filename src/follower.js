import * as T from 'three';

const wrap=value=>Math.atan2(Math.sin(value),Math.cos(value));

/** A small ground follower. All motion is in world metres, independent of owner parenting. */
export function makeFollower(owner,locomotion){
  const radius=.27,separation=.56,position=new T.Vector2(),target=new T.Vector2(),goal=new T.Vector2();
  const history=Array.from({length:256},()=>new T.Vector2());let historyCount=0,historyHead=0;
  let heading=.08,speed=0,gait=0,still=0,hesitation=0,wasMoving=false,route=[],routeIndex=0,routeAge=1,grid=null;
  const gridStep=.16,minX=-3.92,minZ=-1.64,columns=50,rows=32,total=columns*rows;
  const costs=new Float32Array(total),previous=new Int16Array(total),closed=new Uint8Array(total),heap=[];
  const state={mode:'idle',distance:.8,speed:0,walk:0,phase:0,heading:.08,lookYaw:0,lookPitch:-.1,blocked:false,position:[0,.325,0],target:[0,.325,0],trailPoints:0};
  const free=(x,z)=>locomotion.free(x,z,radius);
  function segment(x1,z1,x2,z2){const steps=Math.max(1,Math.ceil(Math.hypot(x2-x1,z2-z1)/.055));for(let i=1;i<=steps;i++){const x=x1+(x2-x1)*i/steps,z=z1+(z2-z1)*i/steps;if(!free(x,z)||Math.hypot(x-owner.x,z-owner.z)<separation-.002)return false;}return true;}
  function record(){
    if(!historyCount){history[0].set(owner.x,owner.z);historyCount=1;historyHead=0;return;}
    const last=history[historyHead];if(Math.hypot(owner.x-last.x,owner.z-last.y)<.035)return;
    historyHead=(historyHead+1)%history.length;history[historyHead].set(owner.x,owner.z);historyCount=Math.min(history.length,historyCount+1);
  }
  function breadcrumb(distance,out){
    let x=owner.x,z=owner.z,left=distance;
    for(let i=0;i<historyCount;i++){
      const point=history[(historyHead-i+history.length)%history.length],length=Math.hypot(point.x-x,point.y-z);
      if(length>=left&&length>.0001)return out.set(x+(point.x-x)*left/length,z+(point.y-z)*left/length);
      left-=length;x=point.x;z=point.y;
    }
    return out.set(x,z);
  }
  function chooseSide(out){
    const ownerHeading=locomotion.state.heading;
    for(const side of [-1,1])for(const gap of [.76,.65]){
      const x=owner.x+side*Math.cos(ownerHeading)*gap-Math.sin(ownerHeading)*.1,z=owner.z-side*Math.sin(ownerHeading)*gap-Math.cos(ownerHeading)*.1;
      if(free(x,z))return out.set(x,z);
    }
    return breadcrumb(.68,out);
  }
  function heapPush(index,score){
    const value={index,score};heap.push(value);let i=heap.length-1;
    while(i){const p=(i-1)>>1;if(heap[p].score<=score)break;heap[i]=heap[p];i=p;}heap[i]=value;
  }
  function heapPop(){
    const value=heap[0],last=heap.pop();if(heap.length){let i=0;while(true){let next=i*2+1;if(next>=heap.length)break;if(next+1<heap.length&&heap[next+1].score<heap[next].score)next++;if(heap[next].score>=last.score)break;heap[i]=heap[next];i=next;}heap[i]=last;}return value.index;
  }
  function makeGrid(){grid=new Uint8Array(total);for(let z=0;z<rows;z++)for(let x=0;x<columns;x++)grid[z*columns+x]=free(minX+x*gridStep,minZ+z*gridStep)?1:0;}
  function closestCell(point){
    const cx=Math.round((point.x-minX)/gridStep),cz=Math.round((point.y-minZ)/gridStep);let best=-1,distance=Infinity;
    for(let ring=0;ring<=4;ring++){
      for(let z=Math.max(0,cz-ring);z<=Math.min(rows-1,cz+ring);z++)for(let x=Math.max(0,cx-ring);x<=Math.min(columns-1,cx+ring);x++){
        const index=z*columns+x,px=minX+x*gridStep,pz=minZ+z*gridStep,d=(point.x-px)**2+(point.y-pz)**2;
        if(grid[index]&&d<distance&&segment(point.x,point.y,px,pz)){best=index;distance=d;}
      }
      if(best>=0)break;
    }
    return best;
  }
  function findRoute(destination){
    if(!grid)makeGrid();const start=closestCell(position),finish=closestCell(destination);if(start<0||finish<0)return [];
    costs.fill(Infinity);previous.fill(-1);closed.fill(0);heap.length=0;costs[start]=0;heapPush(start,0);
    const endX=finish%columns,endZ=Math.floor(finish/columns);
    while(heap.length){
      const current=heapPop();if(closed[current])continue;closed[current]=1;if(current===finish)break;
      const x=current%columns,z=Math.floor(current/columns);
      for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
        if(!dx&&!dz)continue;const xx=x+dx,zz=z+dz;if(xx<0||xx>=columns||zz<0||zz>=rows)continue;
        const next=zz*columns+xx;if(!grid[next]||closed[next]||Math.hypot(minX+xx*gridStep-owner.x,minZ+zz*gridStep-owner.z)<separation+.035)continue;
        if(dx&&dz&&(!grid[z*columns+xx]||!grid[zz*columns+x]))continue;
        const cost=costs[current]+(dx&&dz?1.414214:1);if(cost>=costs[next])continue;
        costs[next]=cost;previous[next]=current;heapPush(next,cost+Math.hypot(xx-endX,zz-endZ));
      }
    }
    if(start!==finish&&previous[finish]<0)return [];
    const path=[];for(let current=finish;current!==start&&current>=0;current=previous[current])path.push(new T.Vector2(minX+current%columns*gridStep,minZ+Math.floor(current/columns)*gridStep));path.reverse();path.push(destination.clone());return path;
  }
  function reset(){
    historyCount=0;historyHead=0;record();heading=locomotion.state.heading;position.set(owner.x-.76*Math.cos(heading),owner.z+.76*Math.sin(heading));
    if(!free(position.x,position.y)){
      let found=false;for(let ring=0;ring<5&&!found;ring++)for(let i=0;i<16;i++){
        const angle=i*Math.PI/8,gap=.65+ring*.12,x=owner.x+Math.cos(angle)*gap,z=owner.z+Math.sin(angle)*gap;
        if(free(x,z)){position.set(x,z);found=true;break;}
      }
    }
    target.copy(position);goal.copy(position);speed=0;gait=0;still=0;hesitation=0;wasMoving=false;route=[];routeIndex=0;routeAge=1;
    state.mode='idle';state.speed=0;state.walk=0;state.phase=0;state.heading=heading;state.blocked=false;publish();
  }
  function publish(){state.position[0]=position.x;state.position[1]=owner.y+.005;state.position[2]=position.y;state.target[0]=target.x;state.target[1]=owner.y+.005;state.target[2]=target.y;state.distance=Math.hypot(owner.x-position.x,owner.z-position.y);state.trailPoints=historyCount;}
  locomotion.setAvoidance((x,z)=>Math.hypot(x-position.x,z-position.y)>=separation);
  reset();
  return {state,reset,
    invalidate(){grid=null;route=[];routeAge=1;if(!free(position.x,position.y))reset();},
    update(delta,time=0){
      const dt=Math.min(.06,Math.max(0,Number.isFinite(delta)?delta:0));if(!dt){publish();return state;}
      record();routeAge+=dt;const ownerMotion=locomotion.state,ownerMoving=ownerMotion.speed>.035;
      if(ownerMoving&&!wasMoving)hesitation=state.glance?.34:.18;hesitation=Math.max(0,hesitation-dt);still=ownerMoving?0:still+dt;wasMoving=ownerMoving;
      const ownerDistance=Math.hypot(owner.x-position.x,owner.z-position.y),door=locomotion.entrance;
      const ownerAtDoor=owner.x>door.minX-.3&&owner.x<door.maxX+.3&&Math.abs(owner.z-door.z)<.65;
      const followerAtDoor=position.x>door.minX-.3&&position.x<door.maxX+.3&&Math.abs(position.y-door.z)<.65;
      const nearDoor=ownerAtDoor||followerAtDoor;
      const incoming=(position.x-owner.x)*ownerMotion.inputX+(position.y-owner.z)*ownerMotion.inputZ;
      const yielding=ownerDistance<.78&&incoming>.12;
      state.blocked=false;
      if(yielding){
        const length=Math.hypot(ownerMotion.inputX,ownerMotion.inputZ)||1,dx=ownerMotion.inputX/length,dz=ownerMotion.inputZ/length;
        target.copy(position);let found=false;
        for(const gap of [.48,.36,.24]){
          for(const side of [1,-1]){const x=position.x+dz*gap*side,z=position.y-dx*gap*side;if(free(x,z)&&Math.hypot(x-owner.x,z-owner.z)>.62&&segment(position.x,position.y,x,z)){target.set(x,z);found=true;break;}}
          if(found)break;
        }
        if(!found){const distance=Math.max(.01,ownerDistance),x=position.x+(position.x-owner.x)/distance*.3,z=position.y+(position.y-owner.z)/distance*.3;if(free(x,z)&&segment(position.x,position.y,x,z))target.set(x,z);}
        state.mode='yield';
      }else if(still>.38&&!nearDoor){chooseSide(target);state.mode='settle';}
      else {breadcrumb(nearDoor?.72:.68,target);state.mode=nearDoor?'single-file':ownerDistance>1.12?'catch-up':'follow';}
      if(!free(target.x,target.y)){
        let found=false;const tx=target.x,tz=target.y;for(let ring=1;ring<=3&&!found;ring++)for(let i=0;i<12;i++){
          const angle=i*Math.PI/6,x=tx+Math.cos(angle)*ring*.12,z=tz+Math.sin(angle)*ring*.12;
          if(free(x,z)){target.set(x,z);found=true;break;}
        }
      }
      const direct=free(target.x,target.y)&&segment(position.x,position.y,target.x,target.y);
      if(direct){goal.copy(target);route=[];routeIndex=0;}
      else {
        const end=route[route.length-1],stale=!end||end.distanceToSquared(target)>.25;
        if(routeAge>.48&&(stale||routeIndex>=route.length)){route=findRoute(target);routeIndex=0;routeAge=0;}
        while(routeIndex<route.length&&position.distanceToSquared(route[routeIndex])<.025)routeIndex++;
        if(routeIndex<route.length){
          let next=routeIndex;while(next+1<route.length&&segment(position.x,position.y,route[next+1].x,route[next+1].y))next++;
          routeIndex=next;goal.copy(route[routeIndex]);
        }else goal.copy(position);
      }
      const distance=position.distanceTo(goal),oldX=position.x,oldZ=position.y;
      let wanted=Math.min(state.mode==='catch-up'?1.3:state.mode==='settle'?.68:1.02,distance*2.5);
      if(distance<.055)wanted=0;if(hesitation>0&&ownerDistance<1.05&&!yielding){wanted=0;state.mode='hesitate';}
      speed=T.MathUtils.lerp(speed,wanted,1-Math.exp(-dt*(wanted>speed?5.2:8)));
      if(distance>.015&&speed>.005){
        const dx=(goal.x-position.x)/distance,dz=(goal.y-position.y)/distance,length=Math.min(distance,speed*dt),steps=Math.max(1,Math.ceil(length/.018));
        for(let i=0;i<steps;i++){
          const nx=position.x+dx*length/steps,nz=position.y+dz*length/steps;
          if(Math.hypot(nx-owner.x,nz-owner.z)<separation-.005){state.blocked=true;break;}
          if(free(nx,nz)){position.set(nx,nz);}
          else {
            let moved=false;if(free(nx,position.y)&&Math.hypot(nx-owner.x,position.y-owner.z)>=separation){position.x=nx;moved=true;}
            if(free(position.x,nz)&&Math.hypot(position.x-owner.x,nz-owner.z)>=separation){position.y=nz;moved=true;}
            if(!moved){state.blocked=true;routeAge=Math.max(routeAge,.5);break;}
          }
        }
      }
      const travelled=Math.hypot(position.x-oldX,position.y-oldZ),actualSpeed=travelled/dt;gait+=travelled*21;
      if(state.blocked&&actualSpeed<.01){route=[];routeIndex=0;routeAge=Math.max(routeAge,.5);}
      if(actualSpeed>.018){const movementHeading=Math.atan2(position.x-oldX,position.y-oldZ);heading+=wrap(movementHeading-heading)*(1-Math.exp(-dt*10));}
      else if(still>.55){const ownerHeading=Math.atan2(owner.x-position.x,owner.z-position.y);heading+=wrap(ownerHeading-heading)*(1-Math.exp(-dt*1.5));}
      if(actualSpeed<.015&&distance<.08&&!ownerMoving&&!yielding)state.mode='idle';else if(state.blocked&&actualSpeed<.01)state.mode='blocked';
      const glance=!ownerMoving&&still>1.5&&((time+1.4)%17)>10&&((time+1.4)%17)<12.5;
      const lookHeading=glance?Math.atan2(-2.2-position.x,-.3-position.y):Math.atan2(owner.x-position.x,owner.z-position.y);
      state.lookYaw=T.MathUtils.clamp(wrap(lookHeading-heading),-.55,.55);state.lookPitch=glance?.025:-.095;
      state.speed=actualSpeed;state.phase=gait;state.walk=T.MathUtils.lerp(state.walk,Math.min(1,actualSpeed/.72),1-Math.exp(-dt*9));state.heading=heading;state.glance=glance;publish();return state;
    },
  };
}
