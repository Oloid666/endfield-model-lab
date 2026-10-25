import * as T from 'three';

const clamp=v=>T.MathUtils.clamp(v,0,1),smooth=v=>{const p=clamp(v);return p*p*(3-2*p);};

// This is the original shop lightbox, detached before either static batching pass.
export function buildSignFlight(parent,r,signPart){
  let face=null,backing=null;
  signPart?.traverse(n=>{
    if(n.userData.salvageSign)face=n;
    if(n.isMesh&&Math.abs(n.position.x)<.001&&Math.abs(n.position.y-3.1)<.001&&Math.abs(n.position.z-2.197)<.001)backing=n;
  });
  const root=new T.Group();root.name='original-711-flying-lightbox';parent.add(root);root.position.set(0,3.1,2.224);
  parent.updateMatrixWorld(true);root.updateMatrixWorld(true);
  if(face){root.attach(face);face.userData.dynamic=true;face.userData.originalSign=true;}
  if(backing){root.attach(backing);backing.userData.dynamic=true;}
  else r.box(root,'#52625d',[0,0,-.07],[2.74,.62,.12],{metalness:.65,roughness:.4});
  const metal=r.material('#344d49',{metalness:.68,roughness:.38});
  const frame=r.own(new T.InstancedMesh(r.geometry('BoxGeometry',1,1,1),metal,4)),frameDummy=new T.Object3D();root.add(frame);let frameIndex=0;
  for(const [p,s]of [[[-1.35,0,-.025],[.035,.64,.13]],[[1.35,0,-.025],[.035,.64,.13]],[[0,-.305,-.025],[2.74,.035,.13]],[[0,.305,-.025],[2.74,.035,.13]]]){frameDummy.position.fromArray(p);frameDummy.scale.fromArray(s);frameDummy.updateMatrix();frame.setMatrixAt(frameIndex++,frameDummy.matrix);}frame.instanceMatrix.needsUpdate=true;
  root.traverse(n=>{if(n.isMesh){n.userData.dynamic=true;n.castShadow=true;n.receiveShadow=true;}});
  const originalMaterial=face?.material,flightMaterial=originalMaterial?r.own(originalMaterial.clone()):null;
  if(face&&flightMaterial)face.material=flightMaterial;
  const origin=new T.Vector3(0,3.1,2.224),end=new T.Vector3(2.18,.45,3.47),launch=new T.Vector3(.52,4.08,3.63);
  const position=origin.toArray(),target=end.toArray(),duration=4.2;
  const cablesRoot=new T.Group();cablesRoot.name='snapping-sign-power-cables';parent.add(cablesRoot);
  const linePositions=new Float32Array(4*3),lineGeo=r.own(new T.BufferGeometry());lineGeo.setAttribute('position',new T.BufferAttribute(linePositions,3));
  const cableMaterial=r.own(new T.LineBasicMaterial({color:0x303a36}));
  const cables=new T.LineSegments(lineGeo,cableMaterial);cables.frustumCulled=false;cablesRoot.add(cables);
  const sparks=r.own(new T.InstancedMesh(r.geometry('OctahedronGeometry',.025,0),r.own(new T.MeshBasicMaterial({color:0xffd58a,toneMapped:false})),12));sparks.count=0;sparks.frustumCulled=false;sparks.userData.dynamic=true;parent.add(sparks);
  const dustMaterial=r.own(new T.MeshBasicMaterial({color:0x9b9b86,transparent:true,opacity:0,depthWrite:false}));
  const dust=r.own(new T.InstancedMesh(r.geometry('IcosahedronGeometry',1,1),dustMaterial,10));dust.count=0;dust.frustumCulled=false;dust.userData.dynamic=true;parent.add(dust);
  const splashMaterial=r.own(new T.MeshBasicMaterial({color:0x9bbec2,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}));
  const splash=r.mesh(r.geometry('RingGeometry',.88,1,48),splashMaterial,parent);splash.rotation.x=-Math.PI/2;splash.visible=false;splash.userData.dynamic=true;
  const dummy=new T.Object3D();let startedAt=-Infinity,time=0,elapsed=0,started=false,landed=false,impactRevision=0;
  function reset(){
    startedAt=-Infinity;elapsed=0;started=false;landed=false;impactRevision=0;root.visible=true;root.position.copy(origin);root.rotation.set(0,0,0);position.splice(0,3,...origin.toArray());
    cablesRoot.visible=false;sparks.count=dust.count=0;splash.visible=false;dustMaterial.opacity=splashMaterial.opacity=0;
    if(flightMaterial)flightMaterial.emissiveIntensity=originalMaterial.emissiveIntensity;
  }
  function pose(age){
    if(age<1.05){const p=smooth(age/1.05);root.position.lerpVectors(origin,launch,p);root.rotation.set(-.08*p,.08*p,-.2*p);}
    else if(age<3.55){
      const p=clamp((age-1.05)/2.5);root.position.lerpVectors(launch,end,p);root.position.y+=Math.sin(p*Math.PI)*.78;
      root.rotation.set(-.08-p*Math.PI*1.52,p*.24,-.2-p*.42);
    }else{
      const p=clamp((age-3.55)/.65),bounce=Math.sin(p*Math.PI)*(1-p)*.28;
      root.position.copy(end);root.position.y+=bounce;root.position.x+=(1-p)*-.13;
      root.rotation.set(-Math.PI/2+Math.sin(p*Math.PI)*(1-p)*.18,0,-.18);
    }
    position[0]=root.position.x;position[1]=root.position.y;position[2]=root.position.z;
  }
  reset();
  return {root,cablesRoot,sparks,dust,splash,
    start(t=time){if(started)return false;started=true;startedAt=t;elapsed=0;cablesRoot.visible=true;return true;},reset,
    update(t){
      time=t;if(!started)return;elapsed=Math.max(0,t-startedAt);pose(Math.min(duration,elapsed));
      if(!landed&&elapsed>=3.55){landed=true;impactRevision++;}
      cablesRoot.visible=elapsed<1.05;
      if(cablesRoot.visible){
        for(let side=0;side<2;side++){const x=side?1.08:-1.08,i=side*6;linePositions.set([x,3.2,2.16,root.position.x+x,root.position.y+.1,root.position.z-.05],i);}
        lineGeo.attributes.position.needsUpdate=true;
      }
      sparks.count=elapsed>.8&&elapsed<1.45?12:0;
      if(sparks.count){const age=elapsed-.8;for(let i=0;i<12;i++){const a=i*2.4;dummy.position.set((i%2?1:-1)*1.07+Math.cos(a)*age*.8,3.15+Math.sin(a)*age-age*age,2.2+age*.6);dummy.rotation.set(a,age*6,a);dummy.scale.setScalar(Math.max(.05,1-age));dummy.updateMatrix();sparks.setMatrixAt(i,dummy.matrix);}sparks.instanceMatrix.needsUpdate=true;}
      const after=elapsed-3.55,life=after/1.7,active=after>=0&&life<1;dust.count=active?10:0;splash.visible=active&&life<.65;
      if(active){
        dustMaterial.opacity=(1-life)*.44;for(let i=0;i<10;i++){const a=i*2.39996;dummy.position.set(end.x+Math.cos(a)*life*(.75+i%3*.4),end.y+.08+life*.55,end.z+Math.sin(a)*life*.6);dummy.rotation.set(i,0,0);dummy.scale.set(.14+life*.55,.09+life*.3,.12+life*.4);dummy.updateMatrix();dust.setMatrixAt(i,dummy.matrix);}dust.instanceMatrix.needsUpdate=true;
        splash.position.set(end.x,.331,end.z);splash.scale.setScalar(.15+life*3.8);splashMaterial.opacity=(1-life)*.4;
      }
      if(flightMaterial)flightMaterial.emissiveIntensity=elapsed<1.2?originalMaterial.emissiveIntensity:landed?.015:Math.max(.02,.3+Math.sin(elapsed*37)*.3);
    },
    presentRewind(p){
      if(!started)return;pose(elapsed*(1-smooth(p)));root.visible=true;cablesRoot.visible=false;sparks.count=dust.count=0;splash.visible=false;
      if(flightMaterial)flightMaterial.emissiveIntensity=T.MathUtils.lerp(.015,originalMaterial.emissiveIntensity,smooth(p));
    },
    showHome(){root.visible=true;root.position.copy(origin);root.rotation.set(0,0,0);cablesRoot.visible=false;sparks.count=dust.count=0;splash.visible=false;if(flightMaterial)flightMaterial.emissiveIntensity=originalMaterial.emissiveIntensity;},
    get active(){return started&&elapsed<duration;},get elapsed(){return elapsed;},duration,
    get position(){position[0]=root.position.x;position[1]=root.position.y;position[2]=root.position.z;return position;},target,
    get landed(){return landed;},
    get state(){return {started,active:started&&elapsed<duration,elapsed,duration,position:root.position.toArray(),target:[...target],landed,impactRevision,cablesAttached:started&&elapsed<1.05,originalMesh:!!face,visible:root.visible};}
  };
}
