import * as T from 'three';
import {optimizeStaticSet} from './static-batches.js';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
const sources=[[-12.8,2.1,-9.6],[-6.1,1.6,-16.5],[6.7,2.3,-15.3],[13.6,1.6,-8.3]];
const heights=[8.6,12.3,10.4,9.3];

// Original-style segmented columns: structural grey, green xiranite, suspended gaps.
// This is a small original street set, not an imported recreation of the official array.
export function buildTianshiGrid(scene,r){
  const reducedMotion=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root=new T.Group();root.name='wuling-tianshi-grid-v8';scene.add(root);
  const box=r.geometry('BoxGeometry',1,1,1),stone=r.material('#b7c0b6',{roughness:.77,metalness:.06}),edge=r.material('#3e514e',{roughness:.55,metalness:.4});
  const deep=r.material('#203a39',{roughness:.55,metalness:.4}),copper=r.material('#8e9b7f',{roughness:.4,metalness:.6});
  const pillars=[],dummy=new T.Object3D(),a=new T.Vector3(),b=new T.Vector3(),direction=new T.Vector3(),up=new T.Vector3(0,1,0),hero=new T.Vector3(-1.25,5,9);
  const glowMaterial=()=>r.own(new T.MeshStandardMaterial({color:0x5aaf88,emissive:0x48efb0,emissiveIntensity:.16,roughness:.27,metalness:.18}));
  const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;const ctx=glowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,1,32,32,31);gradient.addColorStop(0,'rgba(255,255,255,.8)');gradient.addColorStop(.3,'rgba(255,255,255,.28)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const glowMap=r.own(new T.CanvasTexture(glowCanvas)),auraMaterial=r.own(new T.SpriteMaterial({map:glowMap,color:new T.Color(.2,1.5,.82),transparent:true,opacity:.54,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));
  const addBox=(owner,mat,p,s)=>r.mesh(box,mat,owner,p,s);
  for(let n=0;n<sources.length;n++){
    const owner=new T.Group(),fixed=new T.Group(),crown=new T.Group();owner.name='tianshi-pillar-'+(n+1);owner.position.fromArray(sources[n]);owner.add(fixed,crown);root.add(owner);
    const h=heights[n],glow=glowMaterial(),greenRecords=[];
    // A roof podium gives the distant column an actual architectural foundation.
    addBox(fixed,deep,[0,-sources[n][1]/2,0],[3.1,sources[n][1],2.8]);
    addBox(fixed,edge,[0,-.08,0],[3.45,.23,3.08]);
    for(const x of [-1.1,0,1.1])for(const z of [-1.42,1.42])addBox(fixed,copper,[x,-.47,z],[.5,.13,.015]);
    addBox(fixed,edge,[0,.18,0],[1.48,.37,1.48]);
    addBox(fixed,stone,[0,.49,0],[1.17,.26,1.17]);
    addBox(fixed,deep,[0,.78,0],[.76,.34,.76]);
    const lower=.95,shaft=h-1.58,sections=4;
    for(let segment=0;segment<sections;segment++){
      const segmentHeight=shaft/sections-.12,y=lower+shaft*(segment+.5)/sections;
      for(const x of [-.295,.295])for(const z of [-.295,.295])addBox(fixed,stone,[x,y,z],[.225,segmentHeight,.225]);
      for(const x of [-.46,.46])addBox(fixed,edge,[x,y,0],[.054,segmentHeight,.63]);
      for(const z of [-.46,.46])addBox(fixed,edge,[0,y,z],[.63,segmentHeight,.054]);
      const collar=lower+shaft*(segment+1)/sections-.055;
      addBox(fixed,edge,[0,collar,0],[1.04,.075,1.04]);
      greenRecords.push({p:[0,collar+.047,.475],s:[.49,.035,.025]},{p:[0,collar+.047,-.475],s:[.49,.035,.025]});
    }
    for(let i=0;i<14;i++){
      const y=1.05+i*(shaft-.3)/13;addBox(fixed,copper,[0,y,.405],[.11,.035,.035]);
      if(i%2===0)greenRecords.push({p:[0,y,.433],s:[.055,.067,.018]});
    }
    // A central faceted spine is visible through the open structural cage.
    const core=r.mesh(r.geometry('OctahedronGeometry',.2,0),glow,owner,[0,h*.51,0],[.8,shaft*1.6,.8]);
    const halo=new T.Sprite(auraMaterial);halo.name='tianshi-green-core-aura';halo.position.set(0,h*.75,0);halo.scale.set(0,0,1);owner.add(halo);
    crown.position.set(0,h,0);
    addBox(crown,edge,[0,0,0],[1.65,.15,1.65]);
    addBox(crown,stone,[0,.18,0],[1.39,.18,1.39]);
    for(const side of [-1,1]){
      addBox(crown,edge,[side*.76,.22,0],[.44,.15,.47]);
      addBox(crown,edge,[0,.22,side*.76],[.47,.15,.44]);
      addBox(crown,stone,[side*.48,.45,0],[.2,.46,.23]);
      addBox(crown,stone,[0,.45,side*.48],[.23,.46,.2]);
      greenRecords.push({p:[side*.51,h-.14,.49],s:[.22,.17,.08]},{p:[side*.49,h+.77,.49],s:[.14,.18,.05]});
    }
    const emitters=r.own(new T.InstancedMesh(box,glow,greenRecords.length));emitters.name='tianshi-green-insulators';owner.add(emitters);
    greenRecords.forEach((record,i)=>{dummy.position.fromArray(record.p);dummy.rotation.set(0,0,0);dummy.scale.fromArray(record.s);dummy.updateMatrix();emitters.setMatrixAt(i,dummy.matrix);});
    emitters.instanceMatrix.needsUpdate=true;emitters.computeBoundingSphere();
    optimizeStaticSet(fixed,r);optimizeStaticSet(crown,r);
    owner.traverse(node=>{if(node.isMesh){node.userData.dynamic=true;node.castShadow=false;node.receiveShadow=false;}});
    pillars.push({owner,crown,core,halo,glow,h,strength:0,source:new T.Vector3(sources[n][0],sources[n][1]+h*.78,sources[n][2])});
  }
  const maxSegments=12,beamMaterial=r.own(new T.MeshBasicMaterial({color:new T.Color(.3,1.8,1.02),transparent:true,opacity:.63,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));
  const beamGeo=r.geometry('CylinderGeometry',1,1,1,5,1,true),beams=r.own(new T.InstancedMesh(beamGeo,beamMaterial,pillars.length*maxSegments));
  beams.name='tianshi-charge-links';beams.instanceMatrix.setUsage(T.DynamicDrawUsage);beams.frustumCulled=false;beams.userData.dynamic=true;root.add(beams);
  const linkGlow=r.own(new T.InstancedMesh(beamGeo,r.own(new T.MeshBasicMaterial({color:new T.Color(.1,1.4,.7),transparent:true,opacity:.1,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false})),pillars.length*maxSegments));linkGlow.name='tianshi-link-green-halo';linkGlow.instanceMatrix.setUsage(T.DynamicDrawUsage);linkGlow.frustumCulled=false;linkGlow.userData.dynamic=true;root.add(linkGlow);
  const motes=r.own(new T.InstancedMesh(r.geometry('OctahedronGeometry',1,0),beamMaterial,32));motes.instanceMatrix.setUsage(T.DynamicDrawUsage);motes.frustumCulled=false;motes.userData.dynamic=true;root.add(motes);
  const ringMaterial=r.own(new T.MeshBasicMaterial({color:new T.Color(.22,1.8,.85),transparent:true,opacity:.65,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));
  const rings=r.own(new T.InstancedMesh(r.geometry('TorusGeometry',.85,.018,4,48),ringMaterial,12));rings.name='tianshi-suspended-green-rings';rings.instanceMatrix.setUsage(T.DynamicDrawUsage);rings.frustumCulled=false;rings.userData.dynamic=true;root.add(rings);
  const columns=r.own(new T.InstancedMesh(r.geometry('CylinderGeometry',.64,.24,1,12,1,true),r.own(new T.MeshBasicMaterial({color:new T.Color(.12,1.3,.64),transparent:true,opacity:.12,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,toneMapped:false})),4));columns.name='tianshi-green-energy-columns';columns.instanceMatrix.setUsage(T.DynamicDrawUsage);columns.frustumCulled=false;columns.userData.dynamic=true;root.add(columns);
  const lowSigns=pillars.map((p,i)=>{const m=r.mesh(r.geometry('PlaneGeometry',1,1),r.label('⚡ LOW',{width:256,height:128,bg:'#183c39',color:'#f2b66d',font:'bold 42px sans-serif'}),root,[sources[i][0],sources[i][1]+p.h+1,sources[i][2]],[2,1,1]);m.visible=false;return m;});
  let quality='balanced',segmentCount=10,motesPerPylon=5,ringsPerPylon=3,phase='ready',charge=0,activeCount=0;
  const connected=[false,false,false,false];
  function path(pillar,p,clock,out){
    const s=pillar.source,side=s.x<0?-1:1;
    // Approach below the caster, then wrap behind the lower outer halo.
    // A direct source-to-chest segment crosses her eyes in the front close-up.
    if(p<.7){
      const q=p/.7,one=1-q;
      out.set(s.x*one+(hero.x+side*4.2)*q,s.y*one+(hero.y-.65)*q+Math.sin(q*Math.PI)*.8,s.z*one+(hero.z-4)*q);
    }else if(p<.87){
      const q=(p-.7)/.17,one=1-q;
      out.set(hero.x+side*(4.2*one+3*q),hero.y-.65+.25*q,hero.z-4*one+1.8*q);
    }else{
      const q=(p-.87)/.13,one=1-q;
      out.set(hero.x+side*(3*one+1.75*q),hero.y-.4+.8*q,hero.z+1.8*one+1.55*q);
    }
    const tremor=Math.sin(p*29+clock*18+pillar.h)*.085*Math.sin(p*Math.PI);
    out.x+=tremor;out.z+=Math.cos(p*37-clock*13+pillar.h)*.075*Math.sin(p*Math.PI);return out;
  }
  function hideInstances(){dummy.scale.setScalar(0);dummy.updateMatrix();for(const mesh of [beams,linkGlow,motes,rings,columns]){for(let i=0;i<mesh.count;i++)mesh.setMatrixAt(i,dummy.matrix);mesh.instanceMatrix.needsUpdate=true;}}
  hideInstances();
  return {root,
    focusTargets:pillars.map((p,i)=>({id:'tianshi-'+i,position:[p.source.x,p.source.y,p.source.z],base:[...sources[i]],height:p.h,detailTarget:[p.source.x,p.source.y+.35,p.source.z],detailEye:[p.source.x+(i<2?-3.8:4.2),p.source.y+2.7,p.source.z+6.3]})),
    reset(){phase='ready';charge=0;activeCount=0;connected.fill(false);for(const p of pillars){p.strength=0;p.glow.emissiveIntensity=.16;p.crown.position.y=p.h;p.halo.scale.set(0,0,1);}hideInstances();},
    quality(value){quality=['low','balanced','high'].includes(value)?value:'balanced';segmentCount=quality==='low'?6:quality==='high'?12:10;motesPerPylon=quality==='low'?2:quality==='high'?8:5;ringsPerPylon=quality==='low'?2:3;},
    update(t,delta,state={}){
      phase=state.phase||'ready';const clock=phase==='ready'?t:Number.isFinite(state.clock)?state.clock:t;
      for(const m of lowSigns){m.visible=['energy','last','return'].includes(phase)&&Math.sin(clock*4)>.05;}charge=clamp((state.charge||0)/100);if(state.hero)hero.fromArray(state.hero);
      const lever=clamp(state.connection?.lever??0),casting=['charge','combat','energy','last','aim-final','finisher','landing','tour'].includes(phase);
      const linking=phase==='lever'?lever:casting?1:0;
      activeCount=0;
      for(let i=0;i<pillars.length;i++){
        const depleted=['energy','last','return'].includes(phase);const p=pillars[i],wanted=casting?(depleted?.08:1):clamp((linking-i*.18)*2.6);
        p.strength=T.MathUtils.damp(p.strength,wanted,5,Math.min(.1,Math.max(0,delta)));
        if(Math.abs(p.strength-wanted)<.001)p.strength=wanted;connected[i]=p.strength>.6;if(connected[i])activeCount++;
        const pulse=reducedMotion?1:1+Math.sin(clock*2.4+i)*.11;
        p.glow.emissiveIntensity=.13+p.strength*(2.9+charge*1.4)*pulse;
        p.crown.position.y=p.h+(reducedMotion?0:Math.sin(clock*.7+i)*.08)*p.strength;p.core.rotation.y=clock*(reducedMotion?.025:.12);
        p.halo.scale.set((2.7+charge)*p.strength,(3.8+charge)*p.strength,1);
        p.halo.visible=p.strength>.01;
        dummy.position.set(sources[i][0],sources[i][1]+p.h*.51,sources[i][2]);dummy.rotation.set(0,0,0);dummy.scale.set(p.strength,p.h*.86,p.strength);dummy.updateMatrix();columns.setMatrixAt(i,dummy.matrix);
        for(let ring=0;ring<3;ring++){
          dummy.position.set(sources[i][0],sources[i][1]+p.h*(.49+ring*.185)+(reducedMotion?0:Math.sin(clock*.7+i+ring)*.1)*p.strength,sources[i][2]);
          dummy.rotation.set(-Math.PI/2+(reducedMotion?0:Math.sin(clock*.3+i+ring)*.16),clock*(reducedMotion?.03:.12)*(ring%2?-1:1),i*.7);
          const scale=ring<ringsPerPylon?p.strength*(.86+ring*.17):0;dummy.scale.setScalar(scale);dummy.updateMatrix();rings.setMatrixAt(i*3+ring,dummy.matrix);
        }
        const visible=p.strength>.01&&(casting||phase==='lever')&&phase!=='landing'&&phase!=='tour';
        for(let segment=0;segment<maxSegments;segment++){
          const index=i*maxSegments+segment;
          if(visible&&segment<segmentCount){
            path(p,segment/segmentCount,clock,a);path(p,(segment+1)/segmentCount,clock,b);
            direction.copy(b).sub(a);const length=direction.length();direction.normalize();dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,direction);
            const width=(.014+(reducedMotion?.003:.008*Math.sin(clock*4+i)**2))*p.strength;dummy.scale.set(width,length,width);
          }else dummy.scale.setScalar(0);
          dummy.updateMatrix();beams.setMatrixAt(index,dummy.matrix);
          dummy.scale.x*=4.5;dummy.scale.z*=4.5;dummy.updateMatrix();linkGlow.setMatrixAt(index,dummy.matrix);
        }
        for(let j=0;j<8;j++){
          const index=i*8+j;if(visible&&j<motesPerPylon){const progress=((clock*(reducedMotion?.13:.29)+j/motesPerPylon+i*.11)%1+1)%1;path(p,progress,clock,dummy.position);dummy.rotation.set(clock+i,j,clock*.7);dummy.scale.setScalar(.07*p.strength*(.4+Math.sin(progress*Math.PI)));}else dummy.scale.setScalar(0);dummy.updateMatrix();motes.setMatrixAt(index,dummy.matrix);
        }
      }
      for(const mesh of [beams,linkGlow,motes,rings,columns])mesh.instanceMatrix.needsUpdate=true;beams.visible=linkGlow.visible=motes.visible=(casting||phase==='lever')&&activeCount>0;rings.visible=columns.visible=activeCount>0;
    },
    get state(){return {phase,quality,reducedMotion,charge,activePylons:activeCount,connected:[...connected],positions:sources.map(p=>[...p]),originalStyle:true,drawnLinks:beams.visible?activeCount:0,greenHalos:activeCount,energyRings:activeCount*ringsPerPylon,energyColumns:activeCount,moteBudget:motesPerPylon*4,emission:Math.max(...pillars.map(p=>p.glow.emissiveIntensity))};}
  };
}
