import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Resources} from '../resources.js';
import {buildInterior} from '../interior.js';
import {createSurfaces} from '../surfaces.js';
import {buildDragon} from '../companion.js';
import {route,LENGTH,WIDTH,CHECKPOINTS,ROOM_SCALE,AVATAR_SCALE,CRUISE_SPEED} from './game.js';
export function createScene(canvas,state){
 const r=new Resources(),scene=new T.Scene(),renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
 scene.background=new T.Color('#9faf9d');scene.add(new T.HemisphereLight('#fff8de','#314f44',2.3));const sun=new T.DirectionalLight('#ffe4bb',2.2);sun.position.set(-2,8,4);scene.add(sun);
 const camera=new T.PerspectiveCamera(75,1,.008,60),root=new T.Group(),room=new T.Group();scene.add(root);root.add(room);room.scale.set(ROOM_SCALE.horizontal,ROOM_SCALE.vertical,ROOM_SCALE.horizontal);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 r.box(room,'#c7c9b4',[0,.15,-.5],[8.5,.3,5]);r.box(room,'#355d4a',[0,1.6,-3.1],[8.5,2.6,.12]);
 const glass=r.own(new T.MeshStandardMaterial({color:'#adc7be',transparent:true,opacity:.1,depthWrite:false}));buildInterior(room,r,createSurfaces(r),glass,[]);
 // Dollhouse cutaway: no roof or foreground wall. The existing shelves remain visible.
 r.mesh(r.geometry('PlaneGeometry',2,.4),r.label('武陵711・晚餐大逃亡',{font:'bold 55px sans-serif'}),room,[0,2.7,-3]);
 // Bake static fixtures into material batches; retain instanced stock and transparent glass.
 scene.updateMatrixWorld(true);const batches=new Map();
 for(const m of [...room.children]){if(!m.isMesh||m.isInstancedMesh||Array.isArray(m.material)||m.material.transparent)continue;const list=batches.get(m.material)||[];list.push(m);batches.set(m.material,list);}
 for(const [material,meshes] of batches){if(meshes.length<2)continue;const gs=meshes.map(m=>m.geometry.clone().applyMatrix4(m.matrixWorld)),merged=mergeGeometries(gs);if(merged){r.mesh(r.own(merged),material,root);meshes.forEach(m=>m.removeFromParent());}gs.forEach(g=>g.dispose());}
 const hatch=r.box(room,'#315651',[-.6,.315,1],[.5,.025,.4]);
 const verts=[],indices=[];const count=Math.ceil(LENGTH/.04);
 for(let i=0;i<=count;i++){const s=i/count*LENGTH;for(const side of [-1,1]){const p=route(s,side*WIDTH/2);verts.push(p.x,p.y,p.z);}if(i<count){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}}
 const geo=r.own(new T.BufferGeometry());geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();const mat=r.material('#c2b687',{side:T.DoubleSide,roughness:.8});r.mesh(geo,mat,root);
 for(let s=0;s<LENGTH;s+=.32){for(const side of [-1,1]){const p=route(s,side*(WIDTH/2-.02));r.box(root,'#61b6ab',[p.x,p.y+.018,p.z],[.035,.02,.035],{emissive:'#59b8a2',emissiveIntensity:.7});}if(Math.floor(s/.32)%3===0){const p=route(s),m=r.mesh(r.geometry('PlaneGeometry',.12,.16),r.label('↑',{width:64,height:64,font:'bold 50px sans-serif',bg:'#bdac73',color:'#244a42'}),root,[p.x,p.y+.008,p.z]);m.rotation.set(-Math.PI/2,0,Math.atan2(-p.fx,-p.fz));}}
 for(const [i,s] of [...CHECKPOINTS,LENGTH].entries()){
  // Paint follows the ramp rather than putting a horizontal block through the racers.
  const vertices=[];for(const at of [Math.max(0,s-.12),Math.min(LENGTH,s+.12)])for(const side of [-1,1]){const p=route(at,side*WIDTH/2);vertices.push(p.x,p.y+.006,p.z);}
  const mark=r.own(new T.BufferGeometry());mark.setAttribute('position',new T.Float32BufferAttribute(vertices,3));mark.setIndex([0,1,2,1,3,2]);mark.computeVertexNormals();r.mesh(mark,r.material('#ddc47c',{side:T.DoubleSide}),root);
  const p=route(s,-WIDTH/2-.15);r.mesh(r.geometry('PlaneGeometry',.48,.16),r.label(i===2?'安全區':`檢查點 ${i+1}`,{width:256,height:64,font:'bold 40px sans-serif'}),root,[p.x,p.y+.45,p.z]);r.box(root,'#425f54',[p.x,p.y+.22,p.z],[.02,.44,.02]);
 }
 const end=route(LENGTH);r.box(root,'#b49a69',[end.x,end.y-.22,end.z],[1.4,.4,1.1]);
 const liquid=r.mesh(r.geometry('PlaneGeometry',16.9,9.9,32,24),r.material('#739c8c',{transparent:true,opacity:.88,roughness:.3,metalness:.2,side:T.DoubleSide}),root,[0,.396,-1]);liquid.rotation.x=-Math.PI/2;const base=liquid.geometry.attributes.position.array.slice();
 const leak=r.mesh(r.geometry('CylinderGeometry',.15,.25,.35,12),r.material('#81b7a0',{transparent:true,opacity:.8}),room,[-.6,.4,1]);
 const player=new T.Group();root.add(player);const blobGeo=r.own(new T.SphereGeometry(1,20,12));const pos=blobGeo.attributes.position;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),l=1+.18*Math.sin(x*6+z*4);pos.setXYZ(i,x*.085*l,(y+1)*.03,z*.12*l);}blobGeo.computeVertexNormals();const blob=r.mesh(blobGeo,r.material('#8956b2',{roughness:.4}),player);
 const dragon=buildDragon(r);root.add(dragon.root);dragon.root.scale.setScalar(AVATAR_SCALE);
 const harness=r.mesh(r.geometry('TorusGeometry',.57,.045,6,20),r.material('#ccae68'),dragon.root,[0,.6,0]);harness.rotation.x=Math.PI/2;
 const ropeGeo=r.own(new T.BufferGeometry());ropeGeo.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(51),3));const rope=new T.Line(ropeGeo,r.own(new T.LineBasicMaterial({color:'#e4b756'})));rope.frustumCulled=false;root.add(rope);
 const packs=state.goods.map(g=>{const group=new T.Group();group.scale.setScalar(1.5);root.add(group);if(g.kind==='drink'){r.mesh(r.geometry('CylinderGeometry',.055,.055,.19,10),r.material('#548b9c'),group,[0,.1,0]);r.cylinder(group,'#eee7ca',[0,.2,0],.04,.02);}else r.box(group,'#d7ac65',[0,.08,0],[.13,.16,.08]);r.mesh(r.geometry('PlaneGeometry',.085,.05),r.label(g.kind==='drink'?'醇乳':'脆餅',{width:128,height:64,font:'bold 40px sans-serif'}),group,[0,.1,.057]);return group;});
 const trailGeo=r.own(new T.BufferGeometry()),trailData=new Float32Array(24*2*3);trailGeo.setAttribute('position',new T.BufferAttribute(trailData,3));const trail=new T.LineSegments(trailGeo,r.own(new T.LineBasicMaterial({color:'#e4e4c4',transparent:true,opacity:.45})));trail.frustumCulled=false;root.add(trail);
 const look=new T.Vector3(),target=new T.Vector3();let fx=0,fz=-1;
 function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
 function pose(dt,clock,snap=false){
  const p=route(state.s,state.offset),d=route(state.dragonS,state.dragonOffset);
  player.position.set(p.x,p.y+.012,p.z);player.rotation.y=Math.atan2(-p.fx,-p.fz);blob.scale.set(.5,.5*(1+Math.sin(clock*8)*.035),.5*(1+state.speed*.35));
  dragon.update(clock,{allowIdleEmote:false});dragon.root.position.set(d.x,d.y+.012,d.z);dragon.root.rotation.y=Math.atan2(-d.fx,-d.fz);
  const a=ropeGeo.attributes.position;for(let i=0;i<17;i++){const t=i/16;a.setXYZ(i,p.x+(d.x-p.x)*t,Math.max(p.y+.025+(d.y+.05-p.y-.025)*t-Math.sin(t*Math.PI)*.012,route(state.s+(state.dragonS-state.s)*t).y+.018),p.z+(d.z-p.z)*t);}a.needsUpdate=true;
  trail.visible=!reduced&&state.running&&state.speed>.4;for(let i=0;i<24;i++){const start=Math.max(0,state.s-((i%12)*.15)),side=i<12?-1:1;for(let j=0;j<2;j++){const q=route(Math.max(0,start-j*.12),side*(WIDTH/2-.06)),k=(i*2+j)*3;trailData[k]=q.x;trailData[k+1]=q.y+.02;trailData[k+2]=q.z;}}trailGeo.attributes.position.needsUpdate=true;
  packs.forEach((m,i)=>{const g=state.goods[i],p=route(g.s,g.offset),age=g.age;m.visible=!g.hit||age<1.15;const side=g.offset>=0?1:-1;m.position.set(p.x+(g.hit?p.fz*side*age*.7:0),p.y+(g.hit?.75*age-.5*age*age:0),p.z-(g.hit?p.fx*side*age*.7:0));m.rotation.set(g.hit?age*5:0,g.hit?age*3:0,g.hit?side*age*4:0);});
  liquid.position.y=state.liquid;const lp=liquid.geometry.attributes.position;for(let i=0;i<lp.count;i++)lp.setZ(i,base[i*3+2]+Math.sin(base[i*3]*4+clock*1.4)*.006);lp.needsUpdate=true;
  leak.scale.y=.8+Math.sin(clock*3)*.12;leak.visible=state.running;hatch.visible=true;
  const dir=route(Math.min(LENGTH,state.s+.9)),alpha=snap?1:1-Math.exp(-dt*6);fx+=(dir.fx-fx)*alpha;fz+=(dir.fz-fz)*alpha;const len=Math.hypot(fx,fz)||1,portrait=camera.aspect<1,back=(portrait?1.25:1.0)+Math.abs(state.dragonOffset-state.offset)*.6;
  const cx=p.x*.6+d.x*.4,cz=p.z*.6+d.z*.4;
  // Stay inside the open dollhouse and frame both characters, even across ramps.
  target.set(cx-fx/len*back,Math.max(p.y,d.y)+(portrait?.73:.53),cz-fz/len*back);
  target.x=T.MathUtils.clamp(target.x,-8.1,8.1);target.z=T.MathUtils.clamp(target.z,-3.8,7.6);
  camera.position.lerp(target,snap?1:1-Math.exp(-dt*9));const ahead=route(Math.min(LENGTH,state.s+1));look.set(cx+fx/len*.6,(p.y+d.y+ahead.y)/3+.05,cz+fz/len*.6);camera.lookAt(look);camera.fov=reduced?77:71+Math.min(1,state.speed/CRUISE_SPEED)*10;camera.updateProjectionMatrix();
 }
 resize();return {resize,pose,render:()=>renderer.render(scene,camera)};
}
