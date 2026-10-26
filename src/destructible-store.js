import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {optimizeStaticSet} from './static-batches.js';
import {buildServerRoom} from './server-room.js';
import {buildSignFlight} from './sign-flight.js';

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
  const signFlight=buildSignFlight(root,r,parts.sign);
  // A modest third-floor equipment room gives the last roof hit a clear silhouette.
  if(parts.roof){
    const room=new T.Group();room.name='third-floor-equipment-room';parts.roof.add(room);
    for(const [c,p,s]of [['#6f8076',[-2.4,6.45,.15],[2.45,1.35,1.45]],['#344944',[-2.4,7.15,.15],[2.63,.14,1.62]],['#233e42',[-2.4,6.54,.89],[1.9,.76,.035]],['#9cae9d',[-2.4,6.54,.918],[1.81,.65,.02]]])r.box(room,c,p,s,{roughness:.69});
    for(let i=0;i<6;i++)r.box(room,'#334a44',[-3.2+i*.32,6.54,.94],[.045,.65,.03],{metalness:.3});
    r.mesh(r.geometry('PlaneGeometry',1,1),r.label('3F · 設備管理',{width:512,height:128,font:'bold 36px sans-serif',bg:'#304941',color:'#d6d9bd'}),room,[-2.4,6.12,.945],[1.65,.2,1]);
  }
  const definitions=[['glass',8,1.05],['upper',27,1.4],['sign',44,1.25],['interior',62,1.1],['roof',80,1.7],['structure',97,1.35]];
  const stages=[],identity=new T.Quaternion();let progress=0,time=0,inputTime=0,timeOffset=0,presentation=null;
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
  const debrisPerStage=30;
  const chunks=new T.InstancedMesh(r.geometry('BoxGeometry',1,1,1),concrete,debrisPerStage*6);chunks.count=0;chunks.instanceMatrix.setUsage(T.DynamicDrawUsage);chunks.frustumCulled=false;chunks.userData.dynamic=true;chunks.castShadow=true;chunks.receiveShadow=true;rubble.add(chunks);
  const dummy=new T.Object3D(),color=new T.Color(),records=[];
  let seed=71167;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const palette=['#8b9187','#b5b4a2','#5a6862','#a09b84','#435851','#688078'];
  for(let stage=0;stage<6;stage++)for(let n=0;n<debrisPerStage;n++){
    const angle=random()*Math.PI*2,range=2.5+random()*3.3;
    let x=T.MathUtils.clamp(Math.cos(angle)*range,-5.8,5.5),z=T.MathUtils.clamp(-.65+Math.sin(angle)*range*.77,-3.45,4.15);if(Math.abs(x)<.95&&z>.1)x+=(x<0?-1:1)*1.12;
    const wide=n<4,w=wide?.7+random()*1.2:.13+random()*.5,h=wide?.07+random()*.13:.08+random()*.24,d=wide?.55+random()*.75:.12+random()*.44;
    const record={stage,index:records.length,start:new T.Vector3((random()-.5)*7.2,[2.3,4.7,3.3,1.45,6.15,2.1][stage],-.55+(random()-.5)*3.5),end:new T.Vector3(x,.34+h/2+random()*.35,z),scale:new T.Vector3(w,h,d),rotation:new T.Vector3((random()-.5)*.8,random()*Math.PI*2,(random()-.5)*.7),hop:1.05+random()*2.5,settled:false};
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
  const products=buildScatteredProducts(rubble,r,random);
  const neighbor=buildNeighborImpact(root,r);
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
  // A VCR presentation changes geometry poses only. Its logical damage and server state stay intact.
  function capturePresentation(){
    const seen=new Set(),nodes=[],materials=new Map();
    for(const owner of [...stages.map(s=>s.pivot),rubble,server.root,server.shattered,neighbor.root,signFlight.root,signFlight.cablesRoot,signFlight.sparks,signFlight.dust,signFlight.splash])owner.traverse(n=>{
      if(seen.has(n))return;seen.add(n);nodes.push({node:n,visible:n.visible,position:n.position.clone(),quaternion:n.quaternion.clone(),scale:n.scale.clone(),count:n.isInstancedMesh?n.count:null,instances:n.isInstancedMesh?n.instanceMatrix.array.slice():null});
      if(n.material){for(const material of Array.isArray(n.material)?n.material:[n.material])if(!materials.has(material))materials.set(material,{emissiveIntensity:material.emissiveIntensity,opacity:material.opacity});}
    });
    return {mode:'rewind',progress:0,sourceTime:inputTime,nodes,materials,serverY:server.root.position.y};
  }
  function beginRewind(){if(presentation)return false;presentation=capturePresentation();return true;}
  function updateRewind(value){
    if(!presentation)beginRewind();const p=T.MathUtils.clamp(Number(value)||0,0,1);presentation.mode='rewind';presentation.progress=p;
    for(const stage of stages){
      if(!stage.active)continue;const q=T.MathUtils.smoothstep(p,(5-stage.index)*.12,(5-stage.index)*.12+.3),snapshot=presentation.nodes.find(n=>n.node===stage.pivot);
      if(q<=0){stage.pivot.visible=snapshot.visible;continue;}
      stage.pivot.visible=true;stage.pivot.position.lerpVectors(snapshot.position,stage.origin,q);stage.pivot.quaternion.copy(snapshot.quaternion).slerp(identity,q);
    }
    const q=T.MathUtils.smootherstep(p,0,1),vanish=1-T.MathUtils.smoothstep(p,.65,1);
    for(let i=0;i<chunks.count;i++){const item=records[i];dummy.position.lerpVectors(item.end,item.start,q);dummy.position.y+=Math.sin(q*Math.PI)*item.hop;dummy.scale.copy(item.scale).multiplyScalar(vanish);dummy.rotation.set(item.rotation.x*(1-q),item.rotation.y*(1-q),item.rotation.z*(1-q));dummy.updateMatrix();chunks.setMatrixAt(i,dummy.matrix);}
    chunks.instanceMatrix.needsUpdate=true;rubble.visible=p<.99;products.presentRewind(p);
    server.root.position.y=T.MathUtils.lerp(presentation.serverY,3.51,q);server.root.visible=true;server.shattered.visible=false;
    signFlight.presentRewind(p);if(p>=1)for(const stage of stages)for(const light of stage.lights)light.node.visible=light.visible;
  }
  function showFlashback(){
    if(!presentation)beginRewind();updateRewind(1);presentation.mode='flashback';rubble.visible=false;signFlight.showHome();neighbor.showIntactVisual();
    for(const stage of stages){stage.pivot.visible=true;stage.pivot.position.copy(stage.origin);stage.pivot.rotation.set(0,0,0);for(const light of stage.lights)light.node.visible=light.visible;}
  }
  function restorePresent(){
    if(!presentation)return false;const stored=presentation;
    for(const item of stored.nodes){const n=item.node;n.visible=item.visible;n.position.copy(item.position);n.quaternion.copy(item.quaternion);n.scale.copy(item.scale);if(item.instances){n.count=item.count;n.instanceMatrix.array.set(item.instances);n.instanceMatrix.needsUpdate=true;}}
    for(const [material,values]of stored.materials){if(values.emissiveIntensity!==undefined)material.emissiveIntensity=values.emissiveIntensity;material.opacity=values.opacity;}
    timeOffset+=Math.max(0,inputTime-stored.sourceTime);presentation=null;if(spill?.shadow)spill.shadow.needsUpdate=true;return true;
  }
  let aftershockAt=-Infinity;
  function reset(){
    aftershockAt=-Infinity;presentation=null;timeOffset=0;time=inputTime;
    progress=0;chunks.count=0;rubble.visible=false;for(const record of records)record.settled=false;
    for(const mesh of beams)mesh.visible=false;
    for(const stage of stages){stage.active=false;stage.settled=false;stage.pivot.visible=true;stage.pivot.position.copy(stage.origin);stage.pivot.rotation.set(0,0,0);for(const light of stage.lights)light.node.visible=light.visible;}
    server.reset();products.reset();neighbor.reset();signFlight.reset();if(spill?.shadow)spill.shadow.needsUpdate=true;
  }
  function setProgress(value){
    const next=T.MathUtils.clamp(Number.isFinite(value)?value:0,0,99);if(next<progress)reset();progress=next;
    for(const stage of stages)if(!stage.active&&progress>=stage.threshold){stage.active=true;stage.start=time;rubble.visible=true;for(const light of stage.lights)light.node.visible=false;chunks.count=Math.max(chunks.count,(stage.index+1)*debrisPerStage);if(spill?.shadow)spill.shadow.needsUpdate=true;}
    if(progress>=44)signFlight.start(time);
    server.setProgress(progress);products.setProgress(progress,time);
  }
  reset();
  return {targets,server,neighbor,signFlight,root:rubble,setProgress,reset,beginRewind,updateRewind,showFlashback,restorePresent,
    destroyServer:()=>{if(server.state.alive)aftershockAt=time;return server.destroy();},
    update(t,delta=0){
      inputTime=t;if(presentation)return;time=t-timeOffset;t=time;let changed=false;
      for(const stage of stages){
        if(!stage.active)continue;
        const p=T.MathUtils.clamp((t-stage.start)/stage.duration,0,1),ease=p*p*(3-2*p);
        if(!stage.settled){
          stage.pivot.position.y=stage.origin.y-ease*Math.max(.5,stage.origin.y-.35)+(stage.id==='roof'?Math.sin(p*Math.PI)*4.2:Math.sin(p*Math.PI)*.35);
          stage.pivot.position.x=stage.origin.x+(stage.id==='roof'?Math.sin(p*Math.PI)*1.9:Math.sin(p*Math.PI)*.35*(stage.index%2?1:-1));
          stage.pivot.rotation.set((stage.index%2?1:-1)*ease*.17,ease*(stage.id==='roof'?.5:.045),ease*(stage.id==='roof'?-.62:stage.index%2?-.12:.12));
          if(p>=1){stage.pivot.visible=false;stage.settled=true;if(stage.id==='roof'||stage.id==='structure')for(const beam of beams)beam.visible=true;}
        }
        for(let i=stage.index*debrisPerStage;i<(stage.index+1)*debrisPerStage;i++){
          const record=records[i];if(record.settled)continue;
          const q=T.MathUtils.clamp((t-stage.start)/(1.95+i%4*.55),0,1),w=1-(1-q)**2;
          dummy.position.lerpVectors(record.start,record.end,w);dummy.position.y+=Math.sin(q*Math.PI)*record.hop;
          dummy.scale.copy(record.scale);dummy.rotation.set(record.rotation.x*q,record.rotation.y*q,record.rotation.z*q);dummy.updateMatrix();chunks.setMatrixAt(i,dummy.matrix);changed=true;if(q>=1)record.settled=true;
        }
      }
      // Finite aftershocks reuse the existing instance pool during the ruins tour.
      if(Number.isFinite(aftershockAt)&&t-aftershockAt>=18&&t-aftershockAt<32){for(let i=0;i<records.length;i+=5){const a=t-aftershockAt-18-(i%12)*.6;if(a<0)continue;const q=Math.min(1,a/5),record=records[i];dummy.position.copy(record.end);dummy.position.x+=Math.sin(i)*q*.45;dummy.position.z+=Math.cos(i)*q*.3;dummy.position.y+=Math.abs(Math.sin(q*Math.PI*3))*(1-q)*.28;dummy.scale.copy(record.scale);dummy.rotation.set(record.rotation.x,record.rotation.y,record.rotation.z+q*.8);dummy.updateMatrix();chunks.setMatrixAt(i,dummy.matrix);changed=true;}}
      if(changed)chunks.instanceMatrix.needsUpdate=true;
      server.update(t,delta);products.update(t);neighbor.update(t);signFlight.update(t);
    },
    get state(){return {progress,stage:stages.filter(s=>s.active).length,serverAlive:server.state.alive,serverPosition:[...server.position],visibleIntact:stages.reduce((sum,s)=>sum+(s.pivot.visible?s.count:0),0),visibleDebris:rubble.visible?chunks.count+beams.filter(m=>m.visible).length+(signFlight.landed?1:0):0,settled:stages.every(s=>!s.active||s.settled),milestones:stages.map(s=>({id:s.id,threshold:s.threshold,active:s.active,visible:s.pivot.visible})),server:server.state,products:products.state,neighbor:neighbor.state,sign:signFlight.state,presentation:presentation?.mode||'present',rewindProgress:presentation?.progress||0,thirdFloor:!!parts.roof};}
  };
}

// Products use four shared instance draws and one small label atlas. They remain on the wet floor.
function buildScatteredProducts(parent,r,random){
  const root=new T.Group();root.name='scattered-convenience-products';parent.add(root);
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const ctx=canvas.getContext('2d');
  const names=['牧場鮮乳','無糖綠茶','黑咖啡','鮮蔬便當','鮪魚飯糰','蛋沙拉三明治','雞蛋布丁','紅燒湯麵'];
  const colors=['#7aa9b3','#527e53','#514b42','#ad7951','#e0d5b3','#c1a761','#d5b46b','#b7654c'];
  for(let i=0;i<8;i++){
    const x=i%4*256,y=Math.floor(i/4)*256;ctx.fillStyle=colors[i];ctx.fillRect(x,y,256,256);ctx.fillStyle='#eee9d8';ctx.fillRect(x+14,y+10,228,31);ctx.fillRect(x+17,y+154,222,69);ctx.fillStyle='#344e40';ctx.textAlign='center';ctx.font='bold 18px sans-serif';ctx.fillText('WULING · SELECT',x+128,y+32);ctx.font='bold 24px sans-serif';ctx.fillText(names[i],x+128,y+185);ctx.font='15px sans-serif';ctx.fillText('READY TO ENJOY',x+128,y+210);
    ctx.fillStyle='#e7d6aa';ctx.beginPath();ctx.ellipse(x+128,y+99,64,38,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=i%2?'#69854e':'#b17a43';for(let j=0;j<5;j++)ctx.fillRect(x+85+j*18,y+78+(j%2)*15,14,28);
    ctx.fillStyle='#f7efe0';ctx.fillRect(x+45,y+233,166,16);ctx.fillStyle='#324f42';for(let b=0;b<29;b++)ctx.fillRect(x+51+b*5.1,y+235,b%3?2:3,12);
  }
  const map=r.own(new T.CanvasTexture(canvas));map.colorSpace=T.SRGBColorSpace;map.anisotropy=2;
  const material=r.own(new T.MeshStandardMaterial({map,roughness:.48,metalness:.025}));
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 instanceStoreAtlas;');
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv=vMapUv*instanceStoreAtlas.zw+instanceStoreAtlas.xy;\n#endif');
  };material.customProgramCacheKey=()=> 'rubble-products-atlas-v7';
  const triangle=new T.Shape();triangle.moveTo(-.5,-.45);triangle.lineTo(.5,-.45);triangle.lineTo(0,.45);triangle.closePath();
  const families=[new T.BoxGeometry(1,1,1),new T.CylinderGeometry(.5,.5,1,10),new T.ExtrudeGeometry(triangle,{depth:.35,bevelEnabled:false,steps:1}),new T.BoxGeometry(1,1,1)];
  const pools=families.map((geometry,i)=>{
    r.own(geometry);if(i===2){geometry.translate(0,0,-.175);const uv=geometry.getAttribute('uv');for(let n=0;n<uv.count;n++)uv.setXY(n,T.MathUtils.clamp(uv.getX(n)+.5,0,1),T.MathUtils.clamp(uv.getY(n)+.5,0,1));}
    geometry.computeBoundingBox();geometry.setAttribute('instanceStoreAtlas',new T.InstancedBufferAttribute(new Float32Array(12*4),4));
    const mesh=r.own(new T.InstancedMesh(geometry,material,12));mesh.name=['spilled-cartons','spilled-drinks','spilled-riceballs','spilled-meals'][i];mesh.count=0;mesh.frustumCulled=false;mesh.userData.dynamic=true;mesh.castShadow=true;mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(mesh);return mesh;
  });
  const records=[],dummy=new T.Object3D();let count=0,settled=0;
  for(let f=0;f<4;f++)for(let i=0;i<12;i++){
    const mesh=pools[f],sku=f===0?i%2:f===1?1+i%2:f===2?4+i%2:3+i%2*3,stage=2+Math.floor(i/4);
    mesh.geometry.attributes.instanceStoreAtlas.setXYZW(i,sku%4/4,1-(Math.floor(sku/4)+1)/2,.25,.5);
    const angle=random()*Math.PI*2,range=1.3+random()*4.3;
    const end=new T.Vector3(T.MathUtils.clamp(Math.cos(angle)*range,-5.4,5.3),.36+random()*.045,T.MathUtils.clamp(-.25+Math.sin(angle)*range*.7,-2.6,3.9));
    const scale=f===0?[.17,.34,.15]:f===1?[.15,.29,.15]:f===2?[.24,.23,.25]:[.36,.085,.26];
    const rotation=new T.Vector3(f===3?.15:Math.PI*.5+(random()-.5)*.4,random()*Math.PI*2,(random()-.5)*1.2);
    dummy.position.set(0,0,0);dummy.rotation.set(rotation.x,rotation.y,rotation.z);dummy.scale.fromArray(scale);dummy.updateMatrix();end.y=.335-mesh.geometry.boundingBox.clone().applyMatrix4(dummy.matrix).min.y;
    records.push({mesh,index:i,stage,active:false,settled:false,at:0,start:new T.Vector3((random()-.5)*5,1.1+random()*1.5,-1.5+random()*2.7),end,scale,rotation,hop:.7+random()*1.2});
  }
  return {
    reset(){count=0;settled=0;for(const mesh of pools)mesh.count=0;for(const item of records){item.active=false;item.settled=false;}},
    setProgress(progress,t){
      for(const item of records)if(!item.active&&progress>=[44,62,80][item.stage-2]){item.active=true;item.at=t;item.mesh.count=Math.max(item.mesh.count,item.index+1);count++;}
    },
    update(t){let changed=false;for(const item of records){if(!item.active||item.settled)continue;const p=T.MathUtils.clamp((t-item.at)/1.8,0,1),ease=1-(1-p)**2;dummy.position.lerpVectors(item.start,item.end,ease);dummy.position.y+=Math.sin(p*Math.PI)*item.hop;dummy.rotation.set(item.rotation.x*p,item.rotation.y*p,item.rotation.z*p);dummy.scale.fromArray(item.scale);dummy.updateMatrix();item.mesh.setMatrixAt(item.index,dummy.matrix);changed=true;if(p>=1){item.settled=true;settled++;}}if(changed)for(const mesh of pools)mesh.instanceMatrix.needsUpdate=true;},
    presentRewind(value){const p=T.MathUtils.smootherstep(value,0,1),scale=1-T.MathUtils.smoothstep(p,.6,1);for(const item of records){if(!item.active)continue;dummy.position.lerpVectors(item.end,item.start,p);dummy.position.y+=Math.sin(p*Math.PI)*item.hop;dummy.rotation.set(item.rotation.x*(1-p),item.rotation.y*(1-p),item.rotation.z*(1-p));dummy.scale.fromArray(item.scale).multiplyScalar(scale);dummy.updateMatrix();item.mesh.setMatrixAt(item.index,dummy.matrix);}for(const mesh of pools)mesh.instanceMatrix.needsUpdate=true;},
    get state(){return {visible:count,settled,families:4,labels:names};}
  };
}

// Replace one existing solid background volume with a hollow room and a genuine opening.
function buildNeighborImpact(parent,r){
  const point=[-8.03,3.15,-2.23],normal=[0,0,1],root=new T.Group();root.name='neighbor-collateral-wall';parent.add(root);
  const body=[...parent.children].find(n=>n.isMesh&&Math.abs(n.position.x+8)<.01&&Math.abs(n.position.y-3.4)<.01&&Math.abs(n.position.z+5)<.01&&Math.abs(n.scale.x-4)<.01&&Math.abs(n.scale.y-7)<.01);
  const wall=body?.material||r.material('#78828a',{roughness:.8});if(body)body.removeFromParent();
  const plaster=r.material('#b1b3a2',{roughness:.91}),dark=r.material('#172e31',{roughness:.96}),brick=r.material('#7c6754',{roughness:.9});
  const intact=new T.Group();intact.name='neighbor-intact-wall-plug';root.add(intact);
  const collateral=new T.Group();collateral.name='neighbor-collateral-window-panels';root.add(collateral);
  // Existing window trim breaks with the removable central wall plug.
  for(const child of [...parent.children])if(child.isMesh&&Math.abs(child.position.x-point[0])<1.05&&Math.abs(child.position.y-point[1])<1.2&&child.position.z>-2.67&&child.position.z<-2.1)intact.attach(child);
  for(const child of [...parent.children])if(child.isMesh&&child.position.x>-9.8&&child.position.x<-6.2&&child.position.y>1.5&&child.position.y<6&&child.position.z>-2.67&&child.position.z<-2.1){child.userData.neighborWindow=true;collateral.attach(child);}
  const windowCount=collateral.children.filter(n=>n.userData.neighborWindow).length;
  for(const [p,s]of [[[-9.89,3.4,-5],[.22,7,5]],[[-6.11,3.4,-5],[.22,7,5]],[[-8,3.4,-7.4],[4,7,.2]],[[-8,-.02,-5],[4,.18,5]],[[-8,6.79,-5],[4,.22,5]]])r.mesh(r.geometry('BoxGeometry',1,1,1),wall,root,p,s);
  // Dark interior wall and a small warm room light made from emissive surfaces, no new light.
  r.mesh(r.geometry('BoxGeometry',1,1,1),dark,root,[-8,3.35,-5.1],[3.5,6.3,.12]);
  r.box(root,'#b99f74',[-8.03,2.1,-3.3],[1.95,.12,1.55],{roughness:.84});
  r.box(root,'#c9ae7b',[-9.1,4.3,-4.9],[.15,.35,.05],{emissive:0xe5c28e,emissiveIntensity:.4});
  const cx=-.03,cy=-.25,outline=[];
  for(let i=0;i<14;i++){const a=-i*Math.PI*2/14,rad=i%3===0?.72:i%2?.61:.67;outline.push([cx+Math.cos(a)*rad,cy+Math.sin(a)*rad]);}
  const shape=new T.Shape();shape.moveTo(-2,-3.5);shape.lineTo(2,-3.5);shape.lineTo(2,3.5);shape.lineTo(-2,3.5);shape.closePath();
  const hole=new T.Path();outline.forEach(([x,y],i)=>i?hole.lineTo(x,y):hole.moveTo(x,y));hole.closePath();shape.holes.push(hole);
  const collateralOutlines=[[[.55,1.1],[.7,1.03],[1.62,1.15],[1.57,2.25],[.62,2.31],[.5,1.8]],[[-1.65,-2.15],[-.75,-2.12],[-.68,-1.35],[-.81,-1.12],[-1.72,-1.19]]];
  for(const vertices of collateralOutlines){
    const cut=new T.Path();vertices.forEach(([x,y],i)=>i?cut.lineTo(x,y):cut.moveTo(x,y));cut.closePath();shape.holes.push(cut);
    const fill=new T.Shape();vertices.forEach(([x,y],i)=>i?fill.lineTo(x,y):fill.moveTo(x,y));fill.closePath();r.mesh(r.own(new T.ExtrudeGeometry(fill,{depth:.25,bevelEnabled:false,steps:1})),wall,collateral,[-8,3.4,-2.75]);
  }
  const geo=r.own(new T.ExtrudeGeometry(shape,{depth:.25,bevelEnabled:false,steps:1,curveSegments:1}));r.mesh(geo,wall,root,[-8,3.4,-2.75]);
  const plug=new T.Shape();outline.forEach(([x,y],i)=>i?plug.lineTo(x,y):plug.moveTo(x,y));plug.closePath();r.mesh(r.own(new T.ExtrudeGeometry(plug,{depth:.25,bevelEnabled:false,steps:1})),wall,intact,[-8,3.4,-2.75]);
  const broken=new T.Group();broken.name='neighbor-broken-rim';broken.visible=false;root.add(broken);
  for(let i=0;i<14;i++){
    const [x,y]=outline[i],rim=r.mesh(r.geometry('BoxGeometry',1,1,1),i%3?plaster:brick,broken,[-8+x*1.035,3.4+y*1.035,-2.465],[.25,.13,.14]);rim.rotation.z=Math.atan2(y-cy,x-cx)+Math.PI/2;
  }
  // Floor-spanning fissures radiate away from the hole and leave its centre clear for Dragon.
  const crackVertices=[];
  for(let ray=0;ray<9;ray++){
    const a=ray*Math.PI*2/9,steps=5,length=ray%2?2.35:3.55;let x0=cx+Math.cos(a)*.78,y0=cy+Math.sin(a)*.78;
    for(let step=1;step<=steps;step++){
      const distance=.78+(length-.78)*step/steps,jitter=Math.sin(ray*9+step*2.7)*.16,x1=T.MathUtils.clamp(cx+Math.cos(a)*distance+Math.sin(a)*jitter,-1.96,1.96),y1=T.MathUtils.clamp(cy+Math.sin(a)*distance+Math.cos(a)*jitter,-3.42,3.42),w=.018+(1-step/steps)*.027;
      crackVertices.push(-8+x0-w,3.4+y0,-2.485,-8+x0+w,3.4+y0,-2.485,-8+x1+w,3.4+y1,-2.485,-8+x0-w,3.4+y0,-2.485,-8+x1+w,3.4+y1,-2.485,-8+x1-w,3.4+y1,-2.485);x0=x1;y0=y1;
    }
  }
  const cracksGeo=r.own(new T.BufferGeometry());cracksGeo.setAttribute('position',new T.Float32BufferAttribute(crackVertices,3));cracksGeo.computeVertexNormals();
  const cracks=new T.Mesh(cracksGeo,r.own(new T.MeshBasicMaterial({color:0x25332e,side:T.DoubleSide})));cracks.name='neighbor-floor-spanning-cracks';broken.add(cracks);
  const balcony=new T.Group();balcony.name='neighbor-buckled-balcony';balcony.position.set(-6.88,4.38,-2.3);root.add(balcony);
  r.box(balcony,'#929e8d',[0,0,0],[1.28,.13,.63],{roughness:.85});
  for(const x of [-.53,0,.53])r.box(balcony,'#3b5149',[x,.29,.25],[.035,.57,.035],{metalness:.5,roughness:.45});
  r.box(balcony,'#3b5149',[0,.57,.25],[1.17,.035,.035],{metalness:.5,roughness:.45});
  const slab=r.box(broken,'#a1a392',[-8.95,1.47,-2.2],[1.1,.12,.65],{roughness:.86});slab.rotation.set(.23,.08,-.32);
  for(let i=0;i<6;i++){const bar=r.box(broken,'#536155',[-8.78+i*.105,1.55,-2.05],[.023,.023,.7],{roughness:.55,metalness:.6});bar.rotation.y=(i-2)*.11;}
  const rubble=r.own(new T.InstancedMesh(r.geometry('BoxGeometry',1,1,1),plaster,54));rubble.count=0;rubble.name='neighbor-wall-fragments';rubble.instanceMatrix.setUsage(T.DynamicDrawUsage);rubble.frustumCulled=false;root.add(rubble);
  const dummy=new T.Object3D(),fragments=[];let seed=2811,time=0,at=-Infinity,hit=false,settled=false;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<54;i++)fragments.push({end:new T.Vector3(-8.03+(random()-.5)*3.9,.2+random()*.16,-1.7+random()*2.7),scale:new T.Vector3(.12+random()*.37,.07+random()*.19,.09+random()*.25),rotation:new T.Vector3(random()*3,random()*4,random()*3),hop:.4+random()*.95});
  mergePart(collateral,r);const loosePanels=[];
  for(const mesh of [...collateral.children]){
    const center=new T.Box3().setFromObject(mesh).getCenter(new T.Vector3()),pivot=new T.Group();pivot.position.copy(center);collateral.add(pivot);pivot.updateMatrixWorld(true);pivot.attach(mesh);mesh.userData.dynamic=true;loosePanels.push({mesh:pivot,position:pivot.position.clone(),rotation:pivot.rotation.clone()});
  }
  balcony.traverse(n=>n.userData.dynamic=true);
  for(const owner of [broken,intact]){optimizeStaticSet(owner,r);owner.traverse(n=>{if(n.isMesh)n.userData.dynamic=true;});}
  optimizeStaticSet(root,r);
  // The external static pass must preserve plug visibility and the true hole.
  root.traverse(n=>{if(n.isMesh){n.userData.dynamic=true;n.castShadow=true;n.receiveShadow=true;}});
  function showIntactVisual(){intact.visible=true;broken.visible=false;rubble.count=0;collateral.visible=true;for(const item of loosePanels){item.mesh.visible=true;item.mesh.position.copy(item.position);item.mesh.rotation.copy(item.rotation);}balcony.position.set(-6.88,4.38,-2.3);balcony.rotation.set(0,0,0);}
  function reset(){hit=false;settled=false;at=-Infinity;showIntactVisual();}
  reset();
  // The replacement rear room must not overlap the old solid backdrop or its windows.
  for(const mesh of [...parent.children])if(mesh.isMesh&&mesh.position.z< -6.7&&Math.abs(mesh.position.x)<3.7&&mesh.position.y>0)mesh.removeFromParent();
  const fillLight=new T.PointLight(0xd5e7cb,5,5,2);fillLight.position.set(-8.03,4,-.3);root.add(fillLight);
  const worldPoint=[.8,1.5,-6.8];root.position.set(worldPoint[0]-point[0],worldPoint[1]-point[1],worldPoint[2]-point[2]);
  return {root,get position(){return worldPoint;},normal,showIntactVisual,
    align(target){root.position.set(target[0]-point[0],target[1]-point[1],target[2]-point[2]);worldPoint.splice(0,3,...target);},
    impact(){if(hit)return false;hit=true;at=time;intact.visible=false;broken.visible=true;rubble.count=fragments.length;return true;},reset,
    update(t){
      time=t;if(!hit||settled)return;const p=T.MathUtils.clamp((t-at)/1.9,0,1),ease=1-(1-p)**2;
      for(let i=0;i<fragments.length;i++){const item=fragments[i];dummy.position.set(point[0]+(i%3-1)*.4,point[1]+(i%4-1)*.7,point[2]);dummy.position.lerp(item.end,ease);dummy.position.y+=Math.sin(p*Math.PI)*item.hop;dummy.scale.copy(item.scale);dummy.rotation.set(item.rotation.x*p,item.rotation.y*p,item.rotation.z*p);dummy.updateMatrix();rubble.setMatrixAt(i,dummy.matrix);}rubble.instanceMatrix.needsUpdate=true;
      for(let i=0;i<loosePanels.length;i++){const item=loosePanels[i],q=T.MathUtils.smoothstep(p,0,.65);item.mesh.position.copy(item.position);item.mesh.position.y-=q*(1.2+i%3*.25);item.mesh.position.z+=q*(.5+i%2*.25);item.mesh.rotation.set(item.rotation.x+q*.7,item.rotation.y+q*(i%2?.3:-.4),item.rotation.z+q*(i%2?-.35:.28));item.mesh.visible=p<.65;}
      balcony.rotation.set(ease*.34,0,-ease*.24);balcony.position.y=4.38-ease*.22;
      if(p>=1){settled=true;collateral.visible=false;}
    },
    get state(){return {hit,holeVisible:hit&&!intact.visible,position:[...point],normal:[...normal],fragments:rubble.count,settled,hollow:!!body,collateralHoles:hit?2:0,fractureBranches:hit?9:0,balconyTilt:balcony.rotation.z,brokenWindows:hit?windowCount:0};}
  };
}
