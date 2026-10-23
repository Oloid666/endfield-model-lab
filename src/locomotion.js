import * as T from 'three';

// Small walkable set, in metres. The street is a view, not a walking surface.
// The character never crosses the road or steps off the raised pavement.
export function makeLocomotion(root,pivot) {
  const input=new T.Vector2(),velocity=new T.Vector2();
  let enabled=false,heading=.08,phase=0,amount=0,walkDistance=0;
  let entrance={minX:-1,maxX:.6,z:1.8};
  let obstacles=[{x:-2.7,z:-.25,w:1,d:1.65},{x:.6,z:-.32,w:.8,d:1.4},{x:2.85,z:.2,w:.95,d:2.15}];
  const radius=.2;
  function free(x,z){
    if(x<-4.0||x>4.0||z<-1.72||z>3.4)return false;
    if(Math.abs(z-entrance.z)<radius+.065&&(x<entrance.minX+radius||x>entrance.maxX-radius))return false;
    for(const o of obstacles){
      const left=o.minX??o.x-o.w/2,right=o.maxX??o.x+o.w/2;
      const back=o.minZ??o.z-o.d/2,front=o.maxZ??o.z+o.d/2;
      const nearX=Math.max(left,Math.min(right,x)),nearZ=Math.max(back,Math.min(front,z));
      if((x-nearX)**2+(z-nearZ)**2<radius**2)return false;
    }
    return true;
  }
  const state={moving:false,speed:0,amount:0,phase:0,heading:.08,distance:0};
  return {state,free,
    setMove(x,z,on=true){enabled=on;input.set(Number.isFinite(x)?x:0,Number.isFinite(z)?z:0);if(input.lengthSq()>1)input.normalize();if(!on)input.set(0,0);},
    setObstacles(value){if(Array.isArray(value))obstacles=value;else if(value){obstacles=value.obstacles||value.racks||obstacles;entrance=value.entrance||entrance;}},
    teleport(x,z){if(!free(x,z))return false;root.position.set(x,.32,z);velocity.set(0,0);input.set(0,0);enabled=false;amount=0;phase=0;heading=.08;pivot.rotation.y=.08;state.moving=false;return true;},
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
        if(free(x,root.position.z))root.position.x=x;
        if(free(root.position.x,z))root.position.z=z;
      }
      const distance=Math.hypot(root.position.x-startX,root.position.z-startZ),speed=dt?distance/dt:0;
      const walking=speed>.025;
      amount=T.MathUtils.lerp(amount,walking?Math.min(1,speed/.55):0,1-Math.exp(-dt*10));
      if(walking){
        const target=Math.atan2(root.position.x-startX,root.position.z-startZ);
        let difference=Math.atan2(Math.sin(target-heading),Math.cos(target-heading));heading+=difference*(1-Math.exp(-dt*10));
        phase+=distance*12.1;walkDistance+=distance;
      }
      pivot.rotation.y=heading;
      Object.assign(state,{moving:walking||amount>.035,speed,amount,phase,heading,distance:walkDistance});
      return state;
    },
  };
}
