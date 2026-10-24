import * as T from 'three';
import { WalkCamera } from '../src/walk-camera.js';
import fs from 'node:fs';

const checks=[];function check(name,passed,detail=null){checks.push({name,passed,detail});}
function setup(z=2.8){
  const camera=new T.PerspectiveCamera(37,390/844,.04,100);camera.position.set(10,8,16);
  const controls={target:new T.Vector3(-.22,1.3,z)},owner=new T.Vector3(-.22,.32,z),zones=[];
  const follow=new WalkCamera(camera,controls,zone=>{if(zones.at(-1)!==zone)zones.push(zone);});follow.setEnabled(true,owner);
  const crossings=[];let previous=camera.position.z;
  function step(manual=false){follow.update(owner,1/60,manual);if(!manual&&(previous-1.895)*(camera.position.z-1.895)<0)crossings.push({camera:camera.position.toArray(),ownerZ:owner.z,inRoom:follow.inRoom});previous=camera.position.z;}
  return {camera,controls,owner,follow,zones,crossings,step};
}
const test=setup(),{camera,controls,owner,follow,zones,crossings,step}=test;
for(let n=0;n<450;n++){if(n<300)owner.z=Math.max(-.9,owner.z-.014);step();}
check('Deep entry reaches a stable indoor camera',follow.inside&&follow.inRoom&&follow.stage===''&&camera.position.y<2.8&&camera.position.z<1.8&&camera.fov>70,{camera:camera.position.toArray(),owner:owner.toArray(),fov:camera.fov,state:follow.state});

// Proxy bounds cover a 1.94m character and a companion on either side in portrait.
camera.lookAt(controls.target);camera.updateMatrixWorld(true);
const points=[new T.Vector3(owner.x,.32,owner.z+.25),new T.Vector3(owner.x,2.26,owner.z+.25)];
for(const side of [-1,1]){points.push(new T.Vector3(owner.x+side*1.04,.325,owner.z-.1),new T.Vector3(owner.x+side*.76,1.15,owner.z-.1));}
const projected=points.map(point=>point.project(camera).toArray());
check('Portrait indoor frame includes the character and either-side companion',projected.every(p=>Math.abs(p[0])<.98&&Math.abs(p[1])<.98&&p[2]>-1&&p[2]<1),{projected});

// A chosen street view remains under manual control for the complete caller lock.
follow.onZone(false);camera.position.set(10,8,16);controls.target.set(-.22,1.3,2.8);const manualFov=camera.fov;
const manualStart=camera.position.clone();owner.x+=.1;
for(let n=0;n<840;n++)step(true);
check('Manual view is preserved for fourteen seconds',Math.abs(camera.position.x-manualStart.x-.1)<1e-8&&Math.abs(camera.position.z-manualStart.z)<1e-8&&camera.fov===manualFov&&!follow.automatic&&zones.at(-1)===false,{camera:camera.position.toArray()});
for(let n=0;n<360;n++)step();
check('Automatic resume restores the interior UI and a portal route',zones.at(-1)===true&&follow.inRoom&&follow.stage===''&&camera.position.z<1.8);

for(let n=0;n<450;n++){if(n<280)owner.z=Math.min(2.8,owner.z+.014);step();}
check('Exit returns to the street camera and clears the interior UI',!follow.inside&&!follow.inRoom&&follow.stage===''&&camera.position.z>5&&zones.at(-1)===false,{camera:camera.position.toArray(),state:follow.state});
check('Every camera crossing uses the clear entrance below the lintel',crossings.length>=3&&crossings.every(({camera:p})=>p[0]>-.9&&p[0]<.5&&p[1]<2.61),crossings);
check('The camera enters only once there is floor behind the character',crossings.filter(c=>c.inRoom).every(c=>c.ownerZ<-.4),crossings.filter(c=>c.inRoom));

const shallow=setup(1.4);for(let n=0;n<540;n++)shallow.step();
const shallowGap=shallow.camera.position.z-shallow.owner.z;
const lookAngle=Math.atan2(shallow.camera.position.y-shallow.controls.target.y,Math.hypot(shallow.camera.position.x-shallow.controls.target.x,shallow.camera.position.z-shallow.controls.target.z))*180/Math.PI;
check('Stopping just inside the door keeps a usable camera distance',shallow.follow.inside&&!shallow.follow.inRoom&&shallowGap>2.2&&shallow.camera.position.y<2.61&&lookAngle<30,{camera:shallow.camera.position.toArray(),ownerZ:shallow.owner.z,gap:shallowGap,downwardAngleDegrees:lookAngle,fov:shallow.camera.fov});
shallow.camera.lookAt(shallow.controls.target);shallow.camera.updateMatrixWorld(true);
const entranceBounds=[new T.Vector3(shallow.owner.x-1.04,.325,shallow.owner.z-.1),new T.Vector3(shallow.owner.x+1.04,.325,shallow.owner.z-.1)].map(p=>p.project(shallow.camera).toArray());
check('Portrait doorway frame leaves room for either-side companion',entranceBounds.every(p=>Math.abs(p[0])<.98&&Math.abs(p[1])<.98),entranceBounds);
for(let n=0;n<360;n++){shallow.owner.z=1.4+Math.sin(n/30)*.12;shallow.step();}
check('Shallow movement does not force repeated portal crossings',!shallow.follow.inRoom&&shallow.crossings.length===0&&shallow.camera.position.z>3.8);

const before=camera.position.clone();owner.x+=.1;step(true);
check('Manual walking still translates the camera with the owner',Math.abs(camera.position.x-before.x-.1)<1e-8&&Math.abs(camera.position.z-before.z)<1e-8);
follow.setEnabled(false,owner);const stop=camera.position.clone();owner.z-=.1;step();
check('Disabling walking clears the zone and leaves the camera still',camera.position.distanceTo(stop)<1e-10&&zones.at(-1)===false);
const result={passed:checks.every(c=>c.passed),kind:'Node actual camera-path, portrait proxy framing and portal-clearance checks; no GPU or iPhone test',checks:checks.length,results:checks,zones};
fs.writeFileSync('artifacts/v5-camera-check.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:result.passed,checks:checks.length,failed:checks.filter(c=>!c.passed)},null,2));if(!result.passed)process.exitCode=1;
