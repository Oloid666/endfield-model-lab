/** Real V9 prop geometry and state checks. Canvas is stubbed; this is not a GPU test. */
import * as T from 'three';
import fs from 'node:fs';
import {buildInvestigationProps} from '../src/investigation-props.js';
import {Resources} from '../src/resources.js';
import {buildTianshiGrid} from '../src/tianshi-grid.js';
import {buildMicrowave} from '../src/microwave.js';
import {buildConnectionStage} from '../src/connection-stage.js';
import {buildPearGarden} from '../src/pear-garden.js';
import {optimizeStaticSet} from '../src/static-batches.js';

const ctx=new Proxy({measureText:s=>({width:s.length*12}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:(()=>{})});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>ctx})};
const scene=new T.Scene(),r=new Resources(),grid=buildTianshiGrid(scene,r),oven=buildMicrowave(scene,r),board=buildConnectionStage(scene,r),garden=buildPearGarden(scene,r),checks=[];
function check(name,passed,detail=null){checks.push({name,passed:Boolean(passed),detail});if(!passed)throw Error(name);}
const colorDistance=(a,b)=>Math.hypot(a.r-b.r,a.g-b.g,a.b-b.b);
function advance(prop,state,seconds=2){for(let n=0;n<seconds*60;n++)prop.update(n/60,1/60,{clock:n/60,...state});}

check('Four original-style columns have separate roofs and foundations',grid.root.children.filter(n=>n.name.startsWith('tianshi-pillar-')).length===4&&grid.focusTargets.every(p=>p.height>8)&&new Set(grid.state.positions.map(p=>p.join(','))).size===4,grid.state);
advance(grid,{phase:'lever',connection:{lever:.4}});
check('Partly pulled lever lights only the first pylons',grid.state.activePylons===1&&grid.state.drawnLinks===1,grid.state);
advance(grid,{phase:'lever',connection:{lever:1}});
check('Fully pulled lever connects four visible electrical links',grid.state.activePylons===4&&grid.state.drawnLinks===4,grid.state);
advance(grid,{phase:'charge',charge:78,hero:[-1.25,4.32,15.25]});
check('Charge keeps all four sources connected to the caster',grid.state.charge===.78&&grid.state.activePylons===4&&grid.state.drawnLinks===4,grid.state);
check('Charged columns have twelve suspended rings, four energy columns and green core halos',grid.state.energyRings===12&&grid.state.energyColumns===4&&grid.state.greenHalos===4&&grid.state.emission>2.8&&grid.root.getObjectByName('tianshi-suspended-green-rings')?.isInstancedMesh&&grid.root.getObjectByName('tianshi-link-green-halo')?.isInstancedMesh,grid.state);
check('Pillar camera points focus on the upper green core and stay outside the frame',grid.focusTargets.every(p=>p.detailTarget[1]>p.base[1]+p.height*.7&&p.detailEye[2]>p.position[2]+5&&Math.abs(p.detailEye[0]-p.position[0])>3),grid.focusTargets);
const links=grid.root.getObjectByName('tianshi-charge-links'),matrix=new T.Matrix4(),center=new T.Vector3(),rotation=new T.Quaternion(),scale=new T.Vector3(),head=new T.Vector3(-1.25,5.94,15.25),axis=new T.Vector3(),near=new T.Vector3();let faceDistance=Infinity;
for(let n=0;n<links.count;n++){
  links.getMatrixAt(n,matrix);matrix.decompose(center,rotation,scale);if(scale.y===0)continue;
  axis.set(0,scale.y/2,0).applyQuaternion(rotation);const line=new T.Line3(center.clone().sub(axis),center.clone().add(axis));line.closestPointToPoint(head,true,near);faceDistance=Math.min(faceDistance,near.distanceTo(head));
}
check('Every physical electrical segment stays outside the face close-up volume',faceDistance>.9,{faceDistance});
grid.quality('low');check('Low quality retains the four-pylon design and reduces spark budget',grid.state.quality==='low'&&grid.focusTargets.length===4&&grid.state.moteBudget===8);grid.update(3,.016,{phase:'charge',charge:90});
check('Low quality keeps broad glow with only two rings per active pillar',grid.state.energyRings===8&&grid.state.energyColumns===4,grid.state);
advance(grid,{phase:'flashback'});
check('Flashback turns off present-time electrical links',grid.state.activePylons===0&&grid.state.drawnLinks===0,grid.state);

board.update(1,1/60,{phase:'login',clock:1,connection:{field:'account',lastKey:'e',keyNumber:1,keyAt:.84}});
check('Account keyboard exposes 29 physical keys and a pressed key',board.state.visible&&board.state.keys===29&&board.state.pressed,board.state);
const e=board.keyPosition('e'),back=board.keyPosition('BACKSPACE');
check('Letter and backspace foot targets are distinct real key locations',Math.abs(e[0]-back[0])>.1||Math.abs(e[2]-back[2])>.1,{e,back});
board.update(2,1/60,{phase:'login',clock:2,connection:{field:'password',lastKey:'5',keyNumber:2,keyAt:1.84}});
check('Password changes to a 12-key numeric pad',board.state.keys===12&&board.state.field==='password'&&board.state.pressed,board.state);
check('Uppercase verification target lands on the checkbox',board.keyPosition('VERIFY').every((v,i)=>v===board.keyPosition('verify')[i])&&Math.abs(board.keyPosition('VERIFY')[0]-board.state.position[0])>.7,board.keyPosition('VERIFY'));
board.update(3,1/60,{phase:'lever',clock:3,connection:{lever:0}});scene.updateMatrixWorld(true);
const moving=board.root.getObjectByName('dragon-connection-lever-handle');
const leverStart=moving?.getWorldPosition(new T.Vector3());
check('Lever has a separate visible moving handle after static batching',moving&&moving.children.some(mesh=>mesh.isMesh),{children:moving?.children.length});
optimizeStaticSet(board.root,r);
board.update(4,1/60,{phase:'lever',clock:4,connection:{lever:1}});scene.updateMatrixWorld(true);
const leverEnd=moving.getWorldPosition(new T.Vector3());
check('Handle survives the scene batch and physically travels 2.36 metres',moving.children.some(mesh=>mesh.isMesh)&&Math.abs(leverEnd.x-leverStart.x-2.36)<.0001,{start:leverStart.toArray(),end:leverEnd.toArray()});
check('Companion pull target follows the handle',Math.abs(board.leverPosition(1)[0]-board.leverPosition(0)[0]-2.36)<.0001);

check('Opening microwave is charred and in extreme warming mode',oven.state.charred===1&&oven.state.warming&&oven.state.display==='極速保溫'&&oven.state.position[2]>1,oven.state);
check('Fixed oven housing uses fewer draw meshes after its build-time batches',oven.state.batches.meshesAfter<=oven.state.batches.meshesBefore-12&&oven.oven.getObjectByName('microwave-live-shell')&&oven.oven.getObjectByName('microwave-live-trim'),oven.state.batches);
scene.updateMatrixWorld(true);const door=oven.root.getObjectByName('microwave-glazed-door'),doorDirection=new T.Vector3(0,0,1).transformDirection(door.matrixWorld),rear=oven.root.getObjectByName('microwave-vented-rear'),rearScars=oven.root.getObjectByName('microwave-rear-burn-scars');
check('Microwave door faces the shop aisle and keeps its original world centre',doorDirection.z<-.99&&Math.abs(oven.root.rotation.y-Math.PI)<.0001&&oven.state.position.every((v,i)=>Math.abs(v-[3.45,1.6,1.43][i])<.0001),{doorDirection:doorDirection.toArray(),position:oven.state.position});
let ventHits=0;const ovenMeshes=[];oven.oven.traverse(node=>{if(node.isMesh)ovenMeshes.push(node);});
for(let row=0;row<3;row++)for(let col=0;col<8;col++){
  const point=oven.oven.localToWorld(new T.Vector3(-.335+col*.095,-.09+row*.08,-.325)),ray=new T.Raycaster(point.clone().add(new T.Vector3(0,0,.2)),new T.Vector3(0,0,-1)),hit=ray.intersectObjects(ovenMeshes,false)[0];
  if(hit&&hit.distance>.19&&hit.distance<.198)ventHits++;
}
check('Street-facing back retains 24 physical vents and six scorch marks after batching',rear&&ventHits===24&&rearScars.children.length===6,{ventHits,scars:rearScars.children.length});
const shellMaterial=oven.oven.getObjectByName('microwave-live-shell').material,charredShell=shellMaterial.color.clone();
let seenArc=false;for(let n=0;n<120;n++){oven.update(n/60,1/60,{phase:'ready',clock:n/60});seenArc ||= oven.state.arcs>0;}
check('Opening charred oven emits intermittent electrical arcs',seenArc,oven.state);
const arcMeshes=oven.root.getObjectByName('microwave-live-electric-arcs'),arcMatrix=new T.Matrix4(),arcPosition=new T.Vector3(),arcScale=new T.Vector3(),arcRotation=new T.Quaternion();let rearArc=false,frontArc=false;
for(let n=0;n<120;n++){
  oven.update(n/60,1/60,{phase:'ready',clock:n/60});if(!oven.state.arcActive)continue;
  for(let segment=0;segment<arcMeshes.count;segment++){arcMeshes.getMatrixAt(segment,arcMatrix);arcMatrix.decompose(arcPosition,arcRotation,arcScale);if(arcScale.y>0){rearArc ||= arcPosition.z<-.33;frontArc ||= arcPosition.z>.35;}}
}
check('Idle faults remain visible from both street rear and interior door',rearArc&&frontArc,{rearArc,frontArc});
oven.update(2,.016,{phase:'flashback',clock:2,progress:99});
check('Earlier CCTV shows the same clean oven above its intact cabinet',oven.state.charred===0&&!oven.state.wreck&&oven.state.counterVisible&&oven.state.display==='03:00',oven.state);
check('Batched shell keeps its live clean colour and independent display/soot visibility',colorDistance(shellMaterial.color,charredShell)>.5&&oven.oven.getObjectByName('microwave-display-clean').visible&&!oven.oven.getObjectByName('microwave-display-warm').visible&&!oven.oven.getObjectByName('microwave-burn-scars').visible);
oven.update(3,.016,{phase:'heat-demo',clock:3,progress:99,heat:{demoIndex:0,demoProgress:.9}});const firstBurn=oven.state.charred;
oven.update(3.01,.016,{phase:'heat-demo',clock:3.01,progress:99,heat:{demoIndex:1,demoProgress:0}});
check('Second failed heating keeps the first attempt burn scars',firstBurn===1&&oven.state.charred>=.85,oven.state);
oven.update(4,.016,{phase:'heat',clock:4,heat:{holding:true,progress:.7,status:'heating'}});
check('Player power input creates four strong arcs and steam',oven.state.arcs===4&&oven.state.steam>0,oven.state);
check('Microwave fault has a thick white core and a distinct green halo layer',oven.state.arcCoreRadius>=.015&&oven.state.arcHaloRadius>=oven.state.arcCoreRadius*3.5&&oven.root.getObjectByName('microwave-fault-halo')?.isInstancedMesh,oven.state);
oven.quality('low');oven.update(4.1,.016,{phase:'heat',clock:4.1,heat:{holding:true,progress:.7,status:'heating'}});
check('Low quality keeps the exaggerated fault but cuts arc segments',oven.state.arcSegments===5&&oven.state.arcs===4&&oven.state.arcCoreRadius>=.015,oven.state);
oven.quality('high');oven.update(4.2,.016,{phase:'heat',clock:4.2,heat:{holding:true,progress:.7,status:'heating'}});
check('High quality adds curve segments without creating extra arc pools',oven.state.arcSegments===9&&arcMeshes.count===36,oven.state);
oven.update(5,.016,{phase:'heat',clock:5,heat:{status:'burnt',progress:1}});
check('Burnt input darkens food and produces smoke',oven.state.food==='burnt'&&oven.state.steam===7,oven.state);
oven.update(6,.016,{phase:'flashback-end',clock:6,progress:99,heat:{status:'won',progress:1}});
check('Successful meal leaves fast-warming mode and power diversion on',oven.state.warming&&oven.state.display==='極速保溫'&&oven.state.food==='hot',oven.state);
check('Batched shell returns to charred paint without swallowing animated descendants',colorDistance(shellMaterial.color,charredShell)<.0001&&oven.oven.getObjectByName('microwave-display-warm').visible&&!oven.oven.getObjectByName('microwave-display-clean').visible&&oven.oven.getObjectByName('microwave-burn-scars').visible&&oven.oven.getObjectByName('microwave-meal').visible);
advance(oven,{phase:'return',progress:99});
check('Present wreck lowers oven, hides cabinet and hides the whole meal',oven.state.wreck&&!oven.state.counterVisible&&oven.state.position[1]<.6&&!oven.oven.getObjectByName('microwave-meal').visible,oven.state);

garden.update(7,1/60,{protected:true});const petals=garden.root.getObjectByName('pear-falling-petals'),petalStart=new T.Matrix4(),petalEnd=new T.Matrix4();petals.getMatrixAt(0,petalStart);garden.update(8,1/60,{protected:true});petals.getMatrixAt(0,petalEnd);
check('A small fixed petal pool drifts out of the courtyard without altering the flowering canopy',garden.state.petalPool===96&&garden.state.fallingPetals===48&&garden.state.escapedPetals>0&&garden.state.blossoms===2700&&!petalStart.equals(petalEnd),garden.state);
garden.update(8.1,1/60,{protected:true,fxShock:1,impactRevision:1});garden.update(9.1,1/60,{protected:true,fxShock:.3,impactRevision:1});
check('One cannon impact emits a bounded petal gust and keeps the pear trees intact',garden.state.gustPetals===24&&garden.state.fallingPetals===72&&garden.state.fallingPetals<=garden.state.petalPool&&garden.state.trees===3&&garden.state.blossoms===2700&&garden.state.petalBounds.minY>=.29,garden.state);
const fixedPetals=petalEnd.clone();petals.getMatrixAt(0,fixedPetals);garden.update(9.1,0,{protected:true,fxShock:.3,impactRevision:1});petals.getMatrixAt(0,petalEnd);
check('Pausing the story clock freezes drifting petal geometry',fixedPetals.equals(petalEnd));
garden.update(13,1/60,{protected:true,impactRevision:1});check('Impact petal gust ends without removing the normal falling petals',garden.state.gustPetals===0&&garden.state.fallingPetals===48,garden.state);
garden.quality('low');garden.update(14,1/60,{});check('Low quality reduces petal and canopy budgets',garden.state.fallingPetals===20&&garden.state.blossoms===1400,garden.state);
garden.quality('high');garden.update(15,1/60,{fxShock:1,impactRevision:2});check('High quality caps both normal and gust petals at the fixed ninety-six-instance pool',garden.state.fallingPetals===96&&garden.state.gustPetals===32&&garden.state.blossoms===3600,garden.state);

const details=buildInvestigationProps(scene,r);
details.update(0,0,{phase:'ready'});
check('Opening has physical CCTV and three purple food marks',details.state.cctv&&details.state.pixels===48&&details.root.getObjectByName('store-cctv'));
details.update(1,0,{phase:'flashback'});check('Earlier recording starts without food stains',details.state.pixels===0);
details.update(2,.016,{phase:'heat',heat:{failures:1}});check('First failed meal creates a fixed pixel burst',details.state.bursts===1&&details.state.pixels===48);
for(let n=2;n<9;n++)details.update(n,.016,{phase:'heat',heat:{failures:n}});
check('Repeated failures cap the food pool',details.state.pixels===96&&details.state.bursts===3);
details.reset();details.update(0,0,{phase:'ready'});check('Replay restores original evidence stains',details.state.bursts===0&&details.state.pixels===48);
const itemCount=r.items.size,geometryCount=r.geometries.size,materialCount=r.materials.size;
for(let n=0;n<600;n++){
  const state={phase:'charge',clock:n/60,charge:n/6,hero:[-1.25,4.32,15.25],connection:{lever:1}};
  grid.update(n/60,1/60,state);oven.update(n/60,1/60,state);board.update(n/60,1/60,state);details.update(n/60,1/60,{phase:'heat',heat:{failures:2}});garden.update(n/60,1/60,{protected:true,fxShock:n%60===0?1:0,impactRevision:Math.floor(n/60)+1});
}
check('Ten seconds of updates create no new tracked graphics resources',r.items.size===itemCount&&r.geometries.size===geometryCount&&r.materials.size===materialCount,{items:itemCount,geometryCount,materialCount});
grid.reset();oven.reset();board.reset();garden.reset();
check('Replay resets pylons, restores charred oven height and hides terminal',grid.state.activePylons===0&&grid.state.drawnLinks===0&&oven.state.charred===1&&Math.abs(oven.state.position[1]-1.6)<.001&&!board.state.visible,{grid:grid.state,microwave:oven.state,board:board.state});
check('Replay ends the impact gust and removes the pear protection glow',garden.state.gustPetals===0&&!garden.state.protected&&garden.state.shield===0,garden.state);
let disposed=0;for(const item of r.items)item.addEventListener?.('dispose',()=>disposed++);const expectedDisposals=[...r.items].filter(item=>typeof item.dispose==='function').length;
r.dispose();check('Every owned disposable graphics resource receives dispose',disposed===expectedDisposals&&r.items.size===0,{disposed,expectedDisposals});
fs.writeFileSync('artifacts/v10-props-check.json',JSON.stringify({kind:'actual-geometry-with-stubbed-canvas',checks},null,2)+'\n');
console.log(`V10 props: ${checks.length} checks passed.`);
