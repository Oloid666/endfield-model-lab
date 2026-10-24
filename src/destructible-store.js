import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {optimizeStaticSet} from './static-batches.js';
import {buildServerRoom} from './server-room.js';

// Collect direct children produced by one construction section without touching the street.
export function collectBuildingPart(root,parts,id,before){
  const group=parts[id]||(parts[id]=new T.Group());group.name='shop-part-'+id;
  for(const child of [...root.children])if(!before.has(child)&&child!==group)group.add(child);
  if(!group.parent)root.add(group);return group;
}

function mergePart(group,r){
  group.updateWorldMatrix(true,true);const inverse=group.matrixWorld.clone().invert(),transform=new T.Matrix4(),batches=new Map();
  group.traverse(mesh=>{
    const mat=mesh.material;
    if(!mesh.isMesh||mesh.isInstancedMesh||mesh.userData.dynamic||mesh.userData.hotspot||Array.isArray(mat)||mat.transparent||mat.isShaderMaterial)return;
    const geometry=mesh.geometry.clone();transform.multiplyMatrices(inverse,mesh.matrixWorld);geometry.applyMatrix4(transform);
    const list=batches.get(mat)||[];list.push({mesh,geometry});batches.set(mat,list);
  });
  for(const [material,items]of batches){
    if(items.length>1){const geometry=mergeGeometries(items.map(n=>n.geometry),false);if(geometry){const merged=new T.Mesh(r.own(geometry),material);merged.castShadow=true;merged.receiveShadow=true;group.add(merged);for(const item of items)item.mesh.removeFromParent();}}
    for(const item of items)item.geometry.dispose();
  }
  optimizeStaticSet(group,r);
  group.traverse(n=>{if(n.isMesh){n.userData.dynamic=true;n.castShadow=!n.material?.transparent;n.receiveShadow=true;}});
}

export function makeDestructibleStore(root,r,parts,spill){
  let signMaterial=null;parts.sign?.traverse(n=>{if(n.userData.salvageSign)signMaterial=n.material;});
  const definitions=[['glass',8,1.05],['upper',27,1.4],['sign',44,1.25],['interior',62,1.1],['roof',80,1.7],['structure',97,1.35]];
  const stages=[];let progress=0,time=0;
  // Each milestone retains the real original meshes until its fall animation finishes.
  for(let i=0;i<definitions.length;i++){
    const [id,threshold,duration]=definitions[i],group=parts[id];if(!group)continue;
    mergePart(group,r);root.updateMatrixWorld(true);
    const bounds=new T.Box3().setFromObject(group),center=bounds.isEmpty()?new T.Vector3(0,2,-.5):bounds.getCenter(new T.Vector3());
    const pivot=new T.Group();pivot.name='collapse-'+id;pivot.position.copy(center);root.add(pivot);pivot.updateMatrixWorld(true);pivot.attach(group);
    const lights=[];let count=0;group.traverse(n=>{if(n.isMesh)count++;if(n.isLight)lights.push({node:n,visible:n.visible});});
    stages.push({id,index:i,threshold,duration,group,pivot,origin:center.clone(),active:false,start:0,lights,count,settled:false});
  }
  const rubble=new T.Group();rubble.name='permanent-shop-rubble';rubble.visible=false;root.add(rubble);
  const concrete=r.own(new T.MeshStandardMaterial({color:0xffffff,roughness:.9,metalness:.08}));
  const chunks=new T.InstancedMesh(r.geometry('BoxGeometry',1,1,1),concrete,108);chunks.count=0;chunks.instanceMatrix.setUsage(T.DynamicDrawUsage);chunks.frustumCulled=false;chunks.userData.dynamic=true;chunks.castShadow=true;chunks.receiveShadow=true;rubble.add(chunks);
  const dummy=new T.Object3D(),color=new T.Color(),records=[];
  let seed=71167;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const palette=['#8b9187','#b5b4a2','#5a6862','#a09b84','#435851','#688078'];
  for(let stage=0;stage<6;stage++)for(let n=0;n<18;n++){
    let x=(random()-.5)*8.3,z=-.65+(random()-.5)*4.35;if(Math.abs(x)<.95&&z>.1)x+=(x<0?-1:1)*1.12;
    const wide=n<4,w=wide?.7+random()*1.2:.13+random()*.5,h=wide?.07+random()*.13:.08+random()*.24,d=wide?.55+random()*.75:.12+random()*.44;
    const record={stage,index:records.length,start:new T.Vector3((random()-.5)*7.2,[2.3,4.7,3.3,1.45,6.15,2.1][stage],-.55+(random()-.5)*3.5),end:new T.Vector3(x,.34+h/2+random()*.35,z),scale:new T.Vector3(w,h,d),rotation:new T.Vector3((random()-.5)*.8,random()*Math.PI*2,(random()-.5)*.7),hop:.4+random()*1.2,settled:false};
    records.push(record);color.set(palette[(stage+n)%palette.length]);chunks.setColorAt(record.index,color);
  }
  chunks.instanceColor.needsUpdate=true;
  // Broken support members give the final silhouette a recognisable building footprint.
  const beams=[];
  for(let i=0;i<7;i++){
    const mesh=r.box(rubble,i%2?'#475b53':'#9c9e8e',[-3.4+i*1.08,.55+(i%3)*.16,-1.45+(i%2)*1.7],[.16,2.1+(i%3)*.55,.2],{roughness:.8,metalness:i%2?.35:0});
    mesh.rotation.set(.4+(i%3)*.24,i*.7,(-1)**i*(.8+i*.07));mesh.visible=false;mesh.userData.dynamic=true;beams.push(mesh);
  }
  const foundation=r.box(rubble,'#303d39',[0,.325,-.71],[8.45,.05,4.62],{roughness:.95});foundation.userData.dynamic=true;
  let fallenSign=null;
  if(signMaterial){const material=r.own(signMaterial.clone());material.emissiveIntensity=.015;fallenSign=r.mesh(r.geometry('PlaneGeometry',1,1),material,rubble,[2.18,.72,1.27],[2.66,.57,1]);fallenSign.rotation.set(-Math.PI/2,0,-.18);fallenSign.visible=false;fallenSign.userData.dynamic=true;}
  const server=buildServerRoom(root,r);
  const targets=[
    {id:'glass',label:'櫥窗與入口',position:[-2.5,1.7,1.9]},
    {id:'upper',label:'二樓外牆',position:[-2.4,4.5,1.82]},
    {id:'sign',label:'招牌與雨棚',position:[2.5,3.15,2.18]},
    {id:'interior',label:'機房下方樓板',position:[0,3.3,.1]},
    {id:'roof',label:'屋頂支撐',position:[1.4,5.8,.1]},
    {id:'structure',label:'最後承重結構',position:[-3.7,2.4,-.1]},
    {id:'server',label:'最後機櫃',position:server.position}
  ];
  function reset(){
    progress=0;chunks.count=0;rubble.visible=false;for(const record of records)record.settled=false;
    for(const mesh of beams)mesh.visible=false;if(fallenSign)fallenSign.visible=false;
    for(const stage of stages){stage.active=false;stage.settled=false;stage.pivot.visible=true;stage.pivot.position.copy(stage.origin);stage.pivot.rotation.set(0,0,0);for(const light of stage.lights)light.node.visible=light.visible;}
    server.reset();if(spill?.shadow)spill.shadow.needsUpdate=true;
  }
  function setProgress(value){
    const next=T.MathUtils.clamp(Number.isFinite(value)?value:0,0,99);if(next<progress)reset();progress=next;
    for(const stage of stages)if(!stage.active&&progress>=stage.threshold){stage.active=true;stage.start=time;rubble.visible=true;for(const light of stage.lights)light.node.visible=false;chunks.count=Math.max(chunks.count,(stage.index+1)*18);if(spill?.shadow)spill.shadow.needsUpdate=true;}
    server.setProgress(progress);
  }
  reset();
  return {targets,server,root:rubble,setProgress,reset,
    destroyServer:()=>server.destroy(),
    update(t,delta=0){
      time=t;let changed=false;
      for(const stage of stages){
        if(!stage.active)continue;
        const p=T.MathUtils.clamp((t-stage.start)/stage.duration,0,1),ease=p*p*(3-2*p);
        if(!stage.settled){
          stage.pivot.position.y=stage.origin.y-ease*Math.max(.5,stage.origin.y-.35);
          stage.pivot.rotation.set((stage.index%2?1:-1)*ease*.17,ease*.045,ease*(stage.index%2?-.12:.12));
          if(p>=1){stage.pivot.visible=false;stage.settled=true;if(stage.id==='roof'||stage.id==='structure')for(const beam of beams)beam.visible=true;if(stage.id==='sign'&&fallenSign)fallenSign.visible=true;}
        }
        for(let i=stage.index*18;i<(stage.index+1)*18;i++){
          const record=records[i];if(record.settled)continue;
          const q=T.MathUtils.clamp((t-stage.start)/1.65,0,1),w=1-(1-q)**2;
          dummy.position.lerpVectors(record.start,record.end,w);dummy.position.y+=Math.sin(q*Math.PI)*record.hop;
          dummy.scale.copy(record.scale);dummy.rotation.set(record.rotation.x*q,record.rotation.y*q,record.rotation.z*q);dummy.updateMatrix();chunks.setMatrixAt(i,dummy.matrix);changed=true;if(q>=1)record.settled=true;
        }
      }
      if(changed)chunks.instanceMatrix.needsUpdate=true;
      server.update(t,delta);
    },
    get state(){return {progress,stage:stages.filter(s=>s.active).length,serverAlive:server.state.alive,serverPosition:[...server.position],visibleIntact:stages.reduce((sum,s)=>sum+(s.pivot.visible?s.count:0),0),visibleDebris:rubble.visible?chunks.count+beams.filter(m=>m.visible).length+(fallenSign?.visible?1:0):0,settled:stages.every(s=>!s.active||s.settled),milestones:stages.map(s=>({id:s.id,threshold:s.threshold,active:s.active,visible:s.pivot.visible})),server:server.state};}
  };
}
