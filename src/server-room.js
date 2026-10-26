import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// A real room behind the centre window. It also supplies the last, independently powered target.
export function buildServerRoom(parent,r){
  const root=new T.Group();root.name='upstairs-server-room';root.position.set(0,3.51,.72);parent.add(root);
  const steel=r.material('#263a3e',{roughness:.38,metalness:.68}),panel=r.material('#101e25',{roughness:.48,metalness:.32});
  const rails=r.material('#8ca1a1',{roughness:.26,metalness:.8}),cyan=r.own(new T.MeshBasicMaterial({color:0x8adbd6}));
  const books=r.material('#98797e',{roughness:.8}),paper=r.material('#d4ceb8',{roughness:.9});
  for(let i=0;i<36;i++){const b=r.box(root,i%3?'#a493aa':'#75979a',[-1.15+(i%3)*.22,.06+Math.floor(i/3)*.065,-.1],[.2,.055,.35]);b.rotation.y=(i%4-.5)*.1;}
  r.box(root,'#b4b7ac',[1.1,.35,-.1],[.65,.65,.55]);r.box(root,'#18373b',[1.1,.69,0],[.5,.05,.3]);for(let i=0;i<8;i++)r.box(root,'#e1d9be',[1.1,.72+i*.008,.15],[.27,.006,.33]);
  for(let i=0;i<9;i++){const curve=new T.CatmullRomCurve3([new T.Vector3(-.5+i*.12,.2,0),new T.Vector3(-.8+i*.12,.05,.6),new T.Vector3(1.1,.12+i*.04,-.2)]);r.mesh(r.own(new T.TubeGeometry(curve,8,.009,4,false)),i%2?steel:rails,root);}
  const shards=[],ledRecords=[],ledTime={value:0};
  function box(mat,p,s,owner=root){return r.mesh(r.geometry('BoxGeometry',1,1,1),mat,owner,p,s);}
  const labelMaterial=r.label('SERVER 01    /    UPLINK 02',{width:1024,height:128,bg:'#101d22',color:'#c9d5c8',font:'bold 38px monospace'});
  for(const x of [-.39,.39]){
    // Open 19-inch rack frames, rectangular 1U/2U blades, handles and separate patch switch.
    box(panel,[x,.85,-.04],[.65,1.75,.77]);
    box(panel,[x,.89,.358],[.57,1.6,.035]);
    for(const dx of [-.306,.306]){
      box(steel,[x+dx,.87,.38],[.032,1.74,.06]);
      for(let hole=0;hole<19;hole++)box(rails,[x+dx,.12+hole*.083,.414],[.012,.017,.007]);
    }
    for(const y of [.06,1.71])box(steel,[x,y,.375],[.65,.05,.07]);
    r.mesh(r.geometry('PlaneGeometry',1,1),labelMaterial,root,[x,1.57,.423],[.54,.075,1]);
    for(let row=0;row<12;row++){
      const y=.21+row*.103,unit=row%4===0;
      box(steel,[x,y,.396],[.55,.086,.034]);
      for(const side of [-1,1]){
        box(rails,[x+side*.251,y,.422],[.018,.058,.028]);
        box(rails,[x+side*.224,y,.435],[.046,.013,.013]);
      }
      // Repeating drive caddies read as rack equipment, never a luminous desktop fan.
      for(let bay=0;bay<4;bay++){
        const bx=x-.15+bay*.092;box(panel,[bx,y,.421],[.078,.061,.014]);
        for(let slit=0;slit<3;slit++)box(rails,[bx-.021+slit*.021,y+.006,.431],[.005,.035,.005]);
      }
      ledRecords.push({p:[x-.188,y-.018,.436],color:row%5===0?0xe0ae58:0x8ac281,offset:row*.37+(x>0?.6:0)});
      if(unit)ledRecords.push({p:[x+.196,y+.018,.436],color:0x8ed4ca,offset:row*.59});
    }
    box(steel,[x,1.43,.407],[.55,.095,.05]);
    for(let port=0;port<8;port++){
      box(rails,[x-.217+port*.062,1.43,.436],[.046,.035,.015]);
      box(panel,[x-.217+port*.062,1.43,.446],[.033,.023,.006]);
    }
    // Service loops hang from the patch panel in distinct restrained cable colours.
    for(let cable=0;cable<4;cable++){
      const px=x-.2+cable*.13,curve=new T.CubicBezierCurve3(new T.Vector3(px,1.43,.46),new T.Vector3(px+.11,1.07,.56),new T.Vector3(px-.08,.72,.54),new T.Vector3(px,.82+cable*.085,.435));
      r.mesh(r.own(new T.TubeGeometry(curve,10,.009,3,false)),r.material(['#687e91','#987348','#7d9482','#88758e'][cable],{roughness:.48}),root);
    }
  }
  // Independent UPS is deliberately visible below the surviving racks.
  box(steel,[0,.12,-.03],[1.55,.22,.72]);
  box(panel,[.51,.13,.366],[.2,.07,.012]);ledRecords.push({p:[.51,.13,.378],color:0x8adbd6,offset:1.3});
  for(let i=0;i<7;i++)box(panel,[-.45+i*.09,.12,.366],[.045,.08,.009]);
  const strip=box(cyan,[0,1.82,-.21],[1.43,.035,.05]);
  const spill=new T.PointLight(0x8fd7e0,1.6,3.2,2);spill.position.set(0,1.37,.7);root.add(spill);
  // A short visible patch lead; it does not require a physics solver.
  for(const side of [-1,1]){
    const curve=new T.QuadraticBezierCurve3(new T.Vector3(side*.5,.3,-.3),new T.Vector3(side*.8,.7,-.39),new T.Vector3(side*.43,1.64,-.3));
    r.mesh(r.own(new T.TubeGeometry(curve,8,.012,3,false)),r.material(side<0?'#376e78':'#b09154'),root);
  }
  // All status lamps share one instance draw and pulse on the scene clock.
  const ledMaterial=r.own(new T.MeshBasicMaterial({color:0xffffff,vertexColors:true,toneMapped:false}));
  ledMaterial.onBeforeCompile=shader=>{shader.uniforms.uServerTime=ledTime;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uServerTime;');shader.vertexShader=shader.vertexShader.replace('#include <color_vertex>','#include <color_vertex>\n#ifdef USE_INSTANCING_COLOR\nvColor*=.28+.72*step(-.08,sin(uServerTime*3.1+instanceMatrix[3].y*9.7+instanceMatrix[3].x*2.7));\n#endif');};
  ledMaterial.customProgramCacheKey=()=> 'server-status-led-v7';
  const ledMesh=r.own(new T.InstancedMesh(r.geometry('BoxGeometry',1,1,1),ledMaterial,ledRecords.length)),dummy=new T.Object3D(),ledColor=new T.Color();
  for(let i=0;i<ledRecords.length;i++){dummy.position.fromArray(ledRecords[i].p);dummy.scale.set(.014,.009,.008);dummy.updateMatrix();ledMesh.setMatrixAt(i,dummy.matrix);ledMesh.setColorAt(i,ledColor.setHex(ledRecords[i].color));}ledMesh.instanceMatrix.needsUpdate=true;ledMesh.instanceColor.needsUpdate=true;ledMesh.name='rack-network-status-lamps';root.add(ledMesh);
  // Merge the static rack casing, drive caddies, switch ports and patch leads.
  root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),transform=new T.Matrix4(),batches=new Map();
  root.traverse(mesh=>{
    if(!mesh.isMesh||mesh.isInstancedMesh||mesh.material.isMeshBasicMaterial)return;
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
  function reset(){progress=0;alive=true;destroyedAt=-Infinity;lower=0;root.visible=true;root.position.set(0,3.51,.72);shattered.visible=false;ledMesh.visible=true;for(const shard of shards){shard.mesh.position.copy(shard.p);shard.mesh.rotation.set(0,0,0);}strip.visible=true;spill.visible=true;spill.intensity=1.6;position[1]=4.38;}
  reset();
  return {root,shattered,position,
    setProgress(value){progress=value;},
    destroy(){if(!alive)return false;alive=false;destroyedAt=time;root.visible=false;spill.visible=false;ledMesh.visible=false;shattered.visible=true;return true;},
    reset,
    update(t,delta=0){
      time=t;
      const wanted=progress>=80?1:0;lower=T.MathUtils.damp(lower,wanted,2.6,Math.min(.1,Math.max(0,delta)));
      if(Math.abs(lower-wanted)<.001)lower=wanted;root.position.y=3.51-lower*3.17;position[1]=root.position.y+.87;
      if(alive){
        const pulse=.47+.36*Math.sin(t*5.3)+.17*Math.sin(t*11.7+1.3);spill.intensity=1.15+pulse*.9;
        cyan.color.setRGB(.31+pulse*.2,.63+pulse*.2,.72+pulse*.2);
        ledTime.value=t;
      }else{
        const elapsed=Math.max(0,t-destroyedAt),p=Math.min(1,elapsed/1.05),ease=1-(1-p)**3;
        for(const shard of shards){shard.mesh.position.lerpVectors(shard.p,shard.end,ease);shard.mesh.position.y+=Math.sin(p*Math.PI)*.9;shard.mesh.rotation.set(shard.rotation.x*p,shard.rotation.y*p,shard.rotation.z*p);}
      }
    },
    get state(){return {alive,lowered:lower,position:[...position],visibleLEDs:alive&&root.visible&&ledMesh.visible?ledRecords.length:0,rackUnits:24,networkPorts:16,style:'19-inch rackmount blades, patch switches and UPS'};}
  };
}
