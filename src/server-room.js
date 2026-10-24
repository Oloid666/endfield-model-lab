import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// A real room behind the centre window. It also supplies the last, independently powered target.
export function buildServerRoom(parent,r){
  const root=new T.Group();root.name='upstairs-server-room';root.position.set(0,3.51,.72);parent.add(root);
  const steel=r.material('#263a3e',{roughness:.38,metalness:.68}),panel=r.material('#101e25',{roughness:.48,metalness:.32});
  const rails=r.material('#8ca1a1',{roughness:.26,metalness:.8}),cyan=r.own(new T.MeshBasicMaterial({color:0x8adbd6})),green=r.own(new T.MeshBasicMaterial({color:0x8fc77a}));
  const ledMeshes=[],fans=[],shards=[];
  function box(mat,p,s,owner=root){return r.mesh(r.geometry('BoxGeometry',1,1,1),mat,owner,p,s);}
  for(const x of [-.39,.39]){
    box(steel,[x,.85,0],[.66,1.7,.59]);
    box(panel,[x,.87,.31],[.59,1.57,.025]);
    for(const dx of [-.295,.295])box(rails,[x+dx,.86,.332],[.016,1.57,.018]);
    for(let row=0;row<8;row++){
      const y=.19+row*.18;box(steel,[x,y,.337],[.54,.14,.032]);
      for(let slit=0;slit<5;slit++)box(panel,[x-.08+slit*.06,y,.358],[.034,.08,.007]);
      const led=box(row%3?green:cyan,[x-.22,y+.025,.362],[.018,.018,.01]);ledMeshes.push({mesh:led,offset:row*.37+(x>0?.6:0)});
    }
    const fan=new T.Group();fan.position.set(x,1.31,.366);root.add(fan);
    const ring=r.mesh(r.geometry('TorusGeometry',.096,.009,4,16),rails,fan);ring.rotation.x=0;
    for(let side=0;side<4;side++){const blade=box(steel,[0,0,.008],[.14,.025,.012],fan);blade.rotation.z=side*Math.PI/2+.3;}
    const blades=fan.children.filter(n=>n.isMesh&&n.geometry.type==='BoxGeometry'),geometries=blades.map(n=>{n.updateMatrix();return n.geometry.clone().applyMatrix4(n.matrix);});
    const merged=mergeGeometries(geometries,false);for(const g of geometries)g.dispose();
    if(merged){fan.add(new T.Mesh(r.own(merged),steel));for(const blade of blades)blade.removeFromParent();}
    fan.traverse(n=>n.userData.serverMoving=true);fans.push(fan);
  }
  // Independent UPS is deliberately visible below the surviving racks.
  box(steel,[0,.12,-.03],[1.55,.22,.72]);
  const ups=box(cyan,[.51,.13,.34],[.17,.047,.012]);ledMeshes.push({mesh:ups,offset:1.3});
  const strip=box(cyan,[0,1.82,-.21],[1.43,.035,.05]);
  const spill=new T.PointLight(0x8fd7e0,1.6,3.2,2);spill.position.set(0,1.37,.7);root.add(spill);
  // A short visible patch lead; it does not require a physics solver.
  for(const side of [-1,1]){
    const curve=new T.QuadraticBezierCurve3(new T.Vector3(side*.5,.3,-.3),new T.Vector3(side*.8,.7,-.39),new T.Vector3(side*.43,1.64,-.3));
    r.mesh(r.own(new T.TubeGeometry(curve,8,.012,3,false)),r.material(side<0?'#376e78':'#b09154'),root);
  }
  // Merge the static rack casing and vents. LEDs and fans retain their own small animations.
  root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),transform=new T.Matrix4(),batches=new Map();
  root.traverse(mesh=>{
    if(!mesh.isMesh||mesh.userData.serverMoving||mesh.material.isMeshBasicMaterial)return;
    const geometry=mesh.geometry.clone();transform.multiplyMatrices(inverse,mesh.matrixWorld);geometry.applyMatrix4(transform);
    const list=batches.get(mesh.material)||[];list.push({mesh,geometry});batches.set(mesh.material,list);
  });
  for(const [mat,items]of batches){const merged=mergeGeometries(items.map(n=>n.geometry),false);for(const item of items)item.geometry.dispose();if(merged){root.add(new T.Mesh(r.own(merged),mat));for(const item of items)item.mesh.removeFromParent();}}
  const shattered=new T.Group();shattered.name='server-wreckage';shattered.visible=false;parent.add(shattered);
  let seed=721;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<18;i++){
    const p=new T.Vector3((random()-.5)*1.2,.3+random()*1.6,.75+(random()-.5)*.45);
    const end=new T.Vector3((random()-.5)*3.1,.4+random()*.16,.8+(random()-.5)*1.6);
    const mesh=box(i%3?steel:rails,p.toArray(),[.16+random()*.44,.055+random()*.12,.1+random()*.35],shattered);
    shards.push({mesh,p,end,rotation:new T.Vector3(random()*3,random()*3,random()*3)});
  }
  for(const owner of [root,shattered])owner.traverse(n=>{if(n.isMesh)n.userData.dynamic=true;});
  const position=[0,4.38,1.06];let progress=0,alive=true,destroyedAt=-Infinity,time=0,lower=0;
  function reset(){progress=0;alive=true;destroyedAt=-Infinity;lower=0;root.visible=true;root.position.set(0,3.51,.72);shattered.visible=false;for(const {mesh} of ledMeshes)mesh.visible=true;for(const shard of shards){shard.mesh.position.copy(shard.p);shard.mesh.rotation.set(0,0,0);}strip.visible=true;spill.visible=true;spill.intensity=1.6;position[1]=4.38;}
  reset();
  return {root,shattered,position,
    setProgress(value){progress=value;},
    destroy(){if(!alive)return false;alive=false;destroyedAt=time;root.visible=false;spill.visible=false;for(const {mesh}of ledMeshes)mesh.visible=false;shattered.visible=true;return true;},
    reset,
    update(t,delta=0){
      time=t;
      const wanted=progress>=80?1:0;lower=T.MathUtils.damp(lower,wanted,2.6,Math.min(.1,Math.max(0,delta)));
      if(Math.abs(lower-wanted)<.001)lower=wanted;root.position.y=3.51-lower*3.17;position[1]=root.position.y+.87;
      if(alive){
        const pulse=.47+.36*Math.sin(t*5.3)+.17*Math.sin(t*11.7+1.3);spill.intensity=1.15+pulse*.9;
        cyan.color.setRGB(.31+pulse*.2,.63+pulse*.2,.72+pulse*.2);
        for(const led of ledMeshes)led.mesh.visible=Math.sin(t*3.1+led.offset)>.02;
        for(let i=0;i<fans.length;i++)fans[i].rotation.z=t*(4.2+i*.6);
      }else{
        const elapsed=Math.max(0,t-destroyedAt),p=Math.min(1,elapsed/1.05),ease=1-(1-p)**3;
        for(const shard of shards){shard.mesh.position.lerpVectors(shard.p,shard.end,ease);shard.mesh.position.y+=Math.sin(p*Math.PI)*.9;shard.mesh.rotation.set(shard.rotation.x*p,shard.rotation.y*p,shard.rotation.z*p);}
      }
    },
    get state(){return {alive,lowered:lower,position:[...position],visibleLEDs:ledMeshes.filter(n=>n.mesh.visible&&root.visible).length};}
  };
}
