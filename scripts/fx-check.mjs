import * as T from 'three';
import fs from 'node:fs/promises';
import {Resources} from '../src/resources.js';
import {buildSiegeEffects} from '../src/siege-effects.js';

const checks=[];
const check=(name,passed,detail=null)=>checks.push({name,passed:Boolean(passed),detail});
const scene=new T.Scene(),r=new Resources(),fx=buildSiegeEffects(scene,r);
const objects=()=>{let count=0;scene.traverse(()=>count++);return count;};
const initial={resources:r.items.size,objects:objects()},idle={phase:'ready',hero:[-1,4,14],target:[0,3,1.4]};
let fragmentColors;fx.root.traverse(n=>{if(n.isInstancedMesh&&n.geometry.type==='OctahedronGeometry'&&n.instanceMatrix.count===96)fragmentColors=n.instanceColor;});
check('Fragment colours are allocated before shader preparation',fragmentColors?.count===96);
fx.update(0,0,idle);
const light=scene.getObjectByName('cannon-shared-burst-light');
check('One stable, unshadowed burst light exists before any attack',!!light&&light.isPointLight&&!light.castShadow&&scene.children.filter(n=>n.isLight).length===1);
check('Idle burst light has no output while retaining its visible shader variant',light.intensity===0&&light.visible);
check('Original particle cap stays at 72 in balanced quality',fx.state.particleLimit===72);
const combat={phase:'combat',hero:[-1,4,14],target:[0,3,1.4]};
fx.update(1,0,combat);fx.fire({from:[-1,5,14],to:[0,3,1.4],power:1});fx.update(1.1,.1,combat);
check('Fire produces a pooled muzzle cone and a visible beam',fx.state.muzzles===1&&fx.state.beams===1,fx.state);
let reused=false;fx.root.traverse(n=>{if(n.isInstancedMesh&&n.geometry.type==='OctahedronGeometry'&&n.instanceMatrix.count===96)reused=n.instanceColor===fragmentColors;});
check('First fire reuses the prepared colour attribute',reused);
check('Shot kick starts before impact',fx.state.shock>0&&fx.state.impactRevision===0);
fx.update(1.3,.2,combat);
check('Ordinary beam creates one timed impact',fx.state.impactRevision===1&&fx.state.pulses===1&&fx.state.rays>0,fx.state);
check('Impact provides bounded camera envelopes',fx.state.shock>=0&&fx.state.shock<=1&&fx.state.flash>=0&&fx.state.flash<=1);
check('Shared light illuminates the impact without allocating another light',light.intensity>0&&scene.children.filter(n=>n.isLight).length===1);
fx.update(2.1,.1,combat);
check('Street shockwave extends beyond five metres',fx.state.maxImpactRadius>5,{radius:fx.state.maxImpactRadius});
scene.updateMatrixWorld(true);
const floor=scene.getObjectByName('street-wide-shockwave');
check('Shockwave lies on the wet street even when the impact is upstairs',Math.abs(floor.getWorldPosition(new T.Vector3()).y-.235)<.001);
fx.reset();fx.update(5,0,combat);fx.fire({from:[-1,5,14],to:[0,3,1.4],finisher:true});fx.update(6.4,.1,{...combat,phase:'finisher',elapsed:3.4});
check('Finisher waits for explicit Dragon collision',fx.state.beams===1&&fx.state.pulses===0);
fx.impact([0,2,1.4],1.85);fx.update(6.5,.1,{...combat,phase:'finisher',elapsed:4.9});
check('Final blast has layered smoke within the balanced cap',fx.state.smoke===8&&fx.state.smoke<=fx.state.qualityCaps.smoke,fx.state);
fx.update(7.7,.1,idle);
check('Final blast covers at least twelve metres',fx.state.maxImpactRadius>=12,{radius:fx.state.maxImpactRadius});
for(const [quality,particles,smoke,rays]of [['low',36,4,4],['balanced',72,8,8],['high',96,12,12]]){
  fx.reset();fx.quality(quality);fx.update(10,0,combat);fx.impact([0,2,1],1.85);fx.update(10.1,.1,combat);
  check(`${quality} quality has explicit particle/smoke/streak caps`,fx.state.particleLimit===particles&&fx.state.smoke<=smoke&&fx.state.rays<=4*rays&&fx.state.qualityCaps.smoke===smoke,fx.state);
}
fx.quality('balanced');
for(let frame=0;frame<420;frame++){
  const t=20+frame/60;fx.update(t,1/60,combat);
  if(frame%10===0){fx.fire({from:[-1,5,14],to:[0,3,1.4],power:1.3});fx.impact([0,2,1.4],1.7);}
}
check('Repeated overlapping bursts keep all resources fixed',r.items.size===initial.resources&&objects()===initial.objects,{before:initial,after:{resources:r.items.size,objects:objects()}});
check('Overlapping bursts stay within four impact pools',fx.state.pulses<=4&&fx.state.muzzles<=4&&fx.state.smoke<=8);
let finite=true;scene.traverse(n=>{if(n.isInstancedMesh)for(const value of n.instanceMatrix.array)if(!Number.isFinite(value))finite=false;});
check('Pooled instance transforms stay finite',finite);
fx.reset();check('Reset clears all bursts, smoke and light output',!fx.root.visible&&fx.state.smoke===0&&fx.state.pulses===0&&fx.state.muzzles===0&&fx.state.shock===0&&light.intensity===0);
fx.dispose();check('Disposal removes the shared light and FX hierarchy',!light.parent&&!fx.root.parent);
r.dispose();check('World-owned FX resources dispose normally',r.items.size===0);
const saved=globalThis.matchMedia;globalThis.matchMedia=()=>({matches:true});
const reducedScene=new T.Scene(),rr=new Resources(),reduced=buildSiegeEffects(reducedScene,rr);reduced.update(0,0,combat);reduced.impact([0,2,1],1.85);reduced.update(.08,.08,combat);
check('Reduced motion constrains shake and flash',reduced.state.shock<=.28&&reduced.state.flash<=.25&&reduced.state.reducedMotion,reduced.state);
reduced.dispose();rr.dispose();if(saved)globalThis.matchMedia=saved;else delete globalThis.matchMedia;
const result={passed:checks.every(c=>c.passed),checks,resourceBudget:initial,references:[
 'https://threejs.org/docs/pages/InstancedMesh.html',
 'https://threejs.org/examples/webgl_points_dynamic.html',
 'https://threejs.org/examples/webgl_postprocessing_unreal_bloom.html'
],scope:'Geometry and deterministic pool checks, without GPU appearance or iPhone performance claims'};
await fs.writeFile(new URL('../artifacts/v10-fx-check.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:result.passed,checks:checks.length,failed:checks.filter(c=>!c.passed)},null,2));
if(!result.passed)process.exitCode=1;
