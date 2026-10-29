import * as T from 'three';

// Metre-sized walking bounds and doorway collision.
// Postgame explicitly unlocks the bounded road; story movement stays on the pavement.
export function makeLocomotion(root,pivot) {
  const input=new T.Vector2(),velocity=new T.Vector2();
  let enabled=false,heading=.08,phase=0,amount=0,walkDistance=0,avoidance=null;
  let street=false,avoidanceEnabled=true;
  let entrance={minX:-1,maxX:.6,z:1.8};
  let obstacles=[{x:-2.7,z:-.25,w:1,d:1.65},{x:.6,z:-.32,w:.8,d:1.4},{x:2.85,z:.2,w:.95,d:2.15}];
  const radius=.2;
  function free(x,z,bodyRadius=radius){
    const edge=Math.max(0,bodyRadius-radius);
    if(x<(street?-7:-4)+edge||x>(street?7:4)-edge||z<-1.72+edge||z>(street?12:3.4)-edge)return false;
    if(street&&z<2.3&&(x<-4||x>4))return false;
    if(Math.abs(z-entrance.z)<bodyRadius+.065&&(x<entrance.minX+bodyRadius||x>entrance.maxX-bodyRadius))return false;
    for(const o of obstacles){
      const left=o.minX??o.x-o.w/2,right=o.maxX??o.x+o.w/2;
      const back=o.minZ??o.z-o.d/2,front=o.maxZ??o.z+o.d/2;
      const nearX=Math.max(left,Math.min(right,x)),nearZ=Math.max(back,Math.min(front,z));
      if((x-nearX)**2+(z-nearZ)**2<bodyRadius**2)return false;
    }
    return true;
  }
  const state={moving:false,speed:0,amount:0,phase:0,heading:.08,distance:0,inputX:0,inputZ:0};
  return {state,free,
    get entrance(){return entrance;},
    setAvoidance(fn){avoidance=fn;},setAvoidanceEnabled(value){avoidanceEnabled=!!value;},
    setMove(x,z,on=true){enabled=on;input.set(Number.isFinite(x)?x:0,Number.isFinite(z)?z:0);if(input.lengthSq()>1)input.normalize();if(!on)input.set(0,0);},
    setObstacles(value){if(Array.isArray(value))obstacles=value;else if(value){street=value.street===true;obstacles=value.obstacles||value.racks||obstacles;entrance=value.entrance||entrance;}},
    teleport(x,z){if(!free(x,z))return false;root.position.set(x,.32,z);velocity.set(0,0);input.set(0,0);enabled=false;amount=0;phase=0;heading=.08;pivot.rotation.y=.08;Object.assign(state,{moving:false,speed:0,amount:0,phase:0,heading:.08,inputX:0,inputZ:0});return true;},
    update(delta){
      const dt=Math.min(.06,Math.max(0,Number.isFinite(delta)?delta:0));
      const smooth=1-Math.exp(-dt*12),targetX=enabled?input.x*.82:0,targetZ=enabled?input.y*.82:0;
      velocity.x=T.MathUtils.lerp(velocity.x,targetX,smooth);velocity.y=T.MathUtils.lerp(velocity.y,targetZ,smooth);
      const startX=root.position.x,startZ=root.position.z;
      let nx=startX+velocity.x*dt,nz=startZ+velocity.y*dt;
      // Substeps preserve the doorway and rack collision even after a slow frame.
      const steps=Math.max(1,Math.ceil(Math.max(Math.abs(nx-startX),Math.abs(nz-startZ))/.025));
      for(let i=0;i<steps;i++){
        const x=root.position.x+velocity.x*dt/steps,z=root.position.z+velocity.y*dt/steps;
        if(free(x,root.position.z)&&(!avoidanceEnabled||!avoidance||avoidance(x,root.position.z)))root.position.x=x;
        if(free(root.position.x,z)&&(!avoidanceEnabled||!avoidance||avoidance(root.position.x,z)))root.position.z=z;
      }
      root.position.y=street&&root.position.z>4.65?0:.32;
      const distance=Math.hypot(root.position.x-startX,root.position.z-startZ),speed=dt?distance/dt:0;
      const walking=speed>.025;
      amount=T.MathUtils.lerp(amount,walking?Math.min(1,speed/.55):0,1-Math.exp(-dt*10));
      if(walking){
        const target=Math.atan2(root.position.x-startX,root.position.z-startZ);
        let difference=Math.atan2(Math.sin(target-heading),Math.cos(target-heading));heading+=difference*(1-Math.exp(-dt*10));
        phase+=distance*12.1;walkDistance+=distance;
      }
      pivot.rotation.y=heading;
      Object.assign(state,{moving:walking||amount>.035,speed,amount,phase,heading,distance:walkDistance,inputX:enabled?input.x:0,inputZ:enabled?input.y:0});
      return state;
    },
  };
}
