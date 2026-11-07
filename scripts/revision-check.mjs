import assert from 'node:assert/strict';
import * as T from 'three';
import {Resources} from '../src/resources.js';
import {buildRossiFigurine} from '../src/rossi-figurine.js';
import {buildInvestigationProps} from '../src/investigation-props.js';
import {buildVcrEffects} from '../src/vcr-effects.js';
import {buildMealRemnant} from '../src/meal-remnant.js';
import {wireProgress} from '../src/vcr-tablet.js';
import {cinematicStoryShot,revisedStoryShot} from '../src/story-shots.js';
import {CinematicTrack} from '../src/cinematic-track.js';
import {DragonRoam,postgameFree} from '../src/postgame-roam.js';
globalThis.matchMedia=()=>({matches:false});
const ctx=new Proxy({measureText:t=>({width:t.length*16}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:(()=>{})});
globalThis.document={createElement:()=>({getContext:()=>ctx})};
const r=new Resources(),scene=new T.Scene();let count=0;const check=(name,ok)=>{assert.ok(ok,name);count++;};
const toy=buildRossiFigurine(r);check('Rossi is an actual mesh below the agreed triangle budget',toy.userData.triangles>500&&toy.userData.triangles<=1000);check('Whole figurine uses a single draw with vertex colors',toy.children.length===1&&toy.userData.draws===1&&toy.children[0].material.vertexColors);toy.traverse(n=>{if(n.isMesh)check('Toy has no downloaded textures, shadow pass or skeleton',!n.material.map&&!n.castShadow&&!n.isSkinnedMesh);});
const props=buildInvestigationProps(scene,r);props.update(0,0,{phase:'ready',progress:0});const intact=props.state.collectionPosition;props.update(1,0,{phase:'ready',progress:0,collectionDamage:99});check('Postgame collection follows real damage rather than the fake ready phase',props.state.collectionPosition[1]<.6&&props.state.collectionPosition[2]>4);props.setCollectionDamage(0);check('Reconstruction returns the same collection to its shelf',JSON.stringify(props.state.collectionPosition)===JSON.stringify(intact));
const fx=buildVcrEffects(scene,r);
for(const portrait of [true,false]){
 const context={portrait,feet:[-1.25,.32,3.25],dragon:[-2,1.4,3.5]};
 for(const [phase,extra]of [['intro',{nodeId:'intro_3',speaker:'zhuang'}],['briefing',{nodeId:'briefing_9'}],['charge',{nodeId:'charge_6',node:{}}],['meal-spawn',{phaseElapsed:6}]]){
  const s=cinematicStoryShot({phase,...extra},context,new CinematicTrack())||revisedStoryShot({phase,...extra},context);check('Revised story shot is finite and has a clear camera distance',!!s&&s.position.concat(s.target,s.fov).every(Number.isFinite)&&Math.hypot(...s.position.map((v,i)=>v-s.target[i]))>.6);
 }
 for(const age of [.2,1.6,3,4.4,5.4]){
  const state={phase:'hack',vcr:true,clock:age,tablet:{stage:'cable',age}},point=fx.path.getPointAt(wireProgress(age)).toArray();fx.update(state);const s=revisedStoryShot(state,{...context,wirePoint:point}),camera=new T.PerspectiveCamera(s.fov,portrait?390/844:844/390,.05,200);camera.position.fromArray(s.position);camera.lookAt(new T.Vector3(...s.target));camera.updateMatrixWorld();const screen=new T.Vector3(...point).project(camera);
  if(age<.4){check('Control command does not discharge energy from the computer',!fx.state.energyVisible&&s.beat==='grid-control-confirm');continue;}
  if(age<4.9)check('Energy head remains visible while its camera follows the cable',Math.abs(screen.x)<.65&&Math.abs(screen.y)<.55&&screen.z<1);
  check('Visible energy really travels on the same physical cable',fx.state.energyVisible&&fx.state.energyPosition.every((v,i)=>Math.abs(v-point[i])<1e-9));
 }
}
const environment={intact:true,floorPlan:{obstacles:[{x:-2.7,z:-.25,w:1,d:1.65},{x:.6,z:-.32,w:.8,d:1.4},{x:2.85,z:.2,w:.86,d:2.1},{x:3.15,z:-2.47,w:1.94,d:.78}]},doors:{isOpen:true,requestPassage(){}}};
const roam=new DragonRoam(),hero=[-1.25,.32,3.25];let current=[-2.4,1.5,3.5],first=null,furthest=0;
for(let i=0;i<1800;i++){const q=roam.update(i/60,hero,current,environment);current=q.position;first??=[...current];furthest=Math.max(furthest,Math.hypot(first[0]-current[0],first[2]-current[2]));check('Dragon stays inside the map and outside furniture',postgameFree(current,environment,.25));}
check('Dragon flies independently while Zhuang stands still',furthest>.8);const held=JSON.stringify(current);for(let i=0;i<40;i++)current=roam.update(1799/60,hero,current,environment).position;check('Paused clock holds free flight',JSON.stringify(current)===held);
const fromShow=[-2.25,4.3,6.2],handoff=roam.update(40,hero,fromShow,environment);check('Flight resumes from the real end of a house performance',JSON.stringify(handoff.position)===JSON.stringify(fromShow));
const indoorHero=[1.75,.32,1.2];let entered=false;for(let i=1;i<5000;i++){const q=roam.update(40+i/60,indoorHero,current,environment);current=q.position;check('Indoor return remains bounded and avoids furniture',postgameFree(current,environment,.24));entered||=current[2]<1.5;}check('Flying Dragon can use the actual entrance',entered);
const meal=buildMealRemnant(scene,r);meal.placeNear([6.9,0,11.9]);check('House-show safety placement stays inside the existing map',postgameFree(meal.state.position,{intact:false}));meal.reset();let time=0;meal.update(time,{phase:'meal-spawn',tabletMode:true});check('Purple creature is not shown before its birth beat',!meal.state.visible);meal.update(5,{phase:'meal-spawn',tabletMode:true});check('Purple creature appears at the reveal',meal.state.visible);
const home={phase:'complete',postgame:true,mealBorn:true,homecomingAt:5};let farthest=0;for(let i=0;i<6000;i++){time=5+i/60;const before=meal.state.position;meal.update(time,home,hero,environment);if(i>1){const p=meal.state.position;check('Slow creature never jumps or exceeds catch-up speed',Math.hypot(p[0]-before[0],p[2]-before[2])<=.48/60+.0001);check('Creature respects furniture and walking bounds',postgameFree(p,environment));if(i>3600)farthest=Math.max(farthest,Math.hypot(p[0]+.4,p[2]-3.4));}}
check('Purple creature actually emerges from the shop',meal.state.position[2]>2.4);const samples=[];for(let i=1;i<1800;i++){meal.update(time+i/60,home,hero,environment);if(i%60===0)samples.push(meal.state.position);}check('After arriving the creature crawls around rather than freezing',samples.some(p=>Math.hypot(p[0]-samples[0][0],p[2]-samples[0][2])>.15));
const frozen=JSON.stringify(meal.state.position);meal.update(time+1799/60,home,hero,environment);check('Pause also freezes the creature path',JSON.stringify(meal.state.position)===frozen);meal.reset();check('Restart removes the creature',!meal.state.visible&&!meal.state.born);r.dispose();console.log(`Revision: ${count} checks passed; Rossi ${toy.userData.triangles} triangles.`);
