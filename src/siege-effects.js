import * as T from 'three';

// All geometry, materials and pools are created once. The caller supplies the scene clock.
export function buildSiegeEffects(scene,r){
  const root=new T.Group();root.name='tian-shi-charge';scene.add(root);root.visible=false;
  const up=new T.Vector3(0,1,0),direction=new T.Vector3(),middle=new T.Vector3(),hero=new T.Vector3(),target=new T.Vector3(),dragon=new T.Vector3(),dummy=new T.Object3D();
  const gold=new T.Color(1.65,.78,.25),white=new T.Color(1.8,1.48,.89),cyan=new T.Color(.22,.68,.79),petal=new T.Color(1.18,1.08,.91),color=new T.Color();
  const glow=(value,opacity=1)=>r.own(new T.MeshBasicMaterial({color:value,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,side:T.DoubleSide}));
  const ringGeo=r.geometry('TorusGeometry',1,.008,5,96),wideRingGeo=r.geometry('RingGeometry',.965,1,96);
  const chargeRoot=new T.Group(),groundRoot=new T.Group(),targetRoot=new T.Group();root.add(chargeRoot,groundRoot,targetRoot);
  const rings=[];
  for(let i=0;i<5;i++){
    const group=new T.Group(),material=glow(i===1?white:gold,.7);chargeRoot.add(group);
    const ring=r.mesh(ringGeo,material,group);ring.scale.setScalar(.78+i*.38);
    const tickPositions=[];
    for(let j=0;j<12;j++){
      const a=j/12*Math.PI*2,outer=.9+i*.38,inner=outer+(j%3===0?.11:.045);
      tickPositions.push(Math.cos(a)*outer,Math.sin(a)*outer,0,Math.cos(a)*inner,Math.sin(a)*inner,0);
    }
    const tickGeo=r.own(new T.BufferGeometry());tickGeo.setAttribute('position',new T.Float32BufferAttribute(tickPositions,3));group.add(new T.LineSegments(tickGeo,r.own(new T.LineBasicMaterial({color:gold,transparent:true,opacity:.8,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}))));
    group.rotation.x=i*.23;group.rotation.y=(i-1)*.18;rings.push({group,material});
  }
  const floorRings=[];
  for(let i=0;i<3;i++){
    const material=glow(i===1?cyan:gold,.55),mesh=r.mesh(wideRingGeo,material,groundRoot);mesh.rotation.x=-Math.PI/2;floorRings.push({mesh,material});
  }
  const routeGeo=r.own(new T.BufferGeometry()),routePositions=new Float32Array(5*4*3),routeAlong=new Float32Array(5*4);
  for(let i=0;i<5;i++)routeAlong.set([0,.53,.53,1],i*4);
  routeGeo.setAttribute('position',new T.BufferAttribute(routePositions,3));routeGeo.setAttribute('aAlong',new T.BufferAttribute(routeAlong,1));
  const routeMat=r.own(new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,
    uniforms:{uTime:{value:0},uCharge:{value:0}},
    vertexShader:'attribute float aAlong;varying float vAlong;void main(){vAlong=aAlong;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform float uTime;uniform float uCharge;varying float vAlong;void main(){float flow=pow(.5+.5*cos((vAlong-uTime*.32)*31.4159),10.0);vec3 color=mix(vec3(.17,.62,.79),vec3(1.8,.95,.3),uCharge);gl_FragColor=vec4(color,(.12+flow*.68)*uCharge);}'
  }));
  const routes=new T.LineSegments(routeGeo,routeMat);routes.frustumCulled=false;root.add(routes);
  const cityAnchors=[[-9,3],[-6,10],[3,11],[8,5],[7,-4]];
  const targetMat=glow(gold,.75),targetRing=r.mesh(ringGeo,targetMat,targetRoot);targetRing.scale.setScalar(.53);
  for(const side of [-1,1])for(const vertical of [-1,1]){
    const g=new T.Group();g.position.set(side*.68,vertical*.48,0);targetRoot.add(g);
    r.mesh(r.geometry('BoxGeometry',1,1,1),targetMat,g,[side*-.09,0,0],[.2,.022,.018]);
    r.mesh(r.geometry('BoxGeometry',1,1,1),targetMat,g,[0,vertical*-.08,0],[.022,.18,.018]);
  }
  // Six lightning ribbons are reused as energy climbs from the puddles into the casting hand.
  const boltPositions=new Float32Array(6*15*2*3),boltGeo=r.own(new T.BufferGeometry());
  boltGeo.setAttribute('position',new T.BufferAttribute(boltPositions,3));
  const boltMaterial=r.own(new T.LineBasicMaterial({color:new T.Color(.5,1.35,1.8),transparent:true,opacity:.75,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));
  const bolts=new T.LineSegments(boltGeo,boltMaterial);bolts.frustumCulled=false;root.add(bolts);
  const smoke=[];
  for(let i=0;i<12;i++){
    const material=r.own(new T.MeshBasicMaterial({color:i%3===0?0x52616b:0x293942,transparent:true,opacity:0,depthWrite:false}));
    const mesh=r.mesh(r.geometry('SphereGeometry',1,10,8),material,root);mesh.visible=false;
    smoke.push({mesh,material,born:-Infinity,duration:6,power:1,center:new T.Vector3(),index:i});
  }
  const beamGeo=r.geometry('CylinderGeometry',1,1,1,8,1,true),beams=[];
  for(let i=0;i<4;i++){
    const group=new T.Group(),outerMaterial=glow(gold,0),coreMaterial=glow(white,0);root.add(group);group.visible=false;
    const outer=r.mesh(beamGeo,outerMaterial,group),core=r.mesh(beamGeo,coreMaterial,group);
    beams.push({group,outer,core,outerMaterial,coreMaterial,from:new T.Vector3(),to:new T.Vector3(),born:-Infinity,duration:.7,power:1,finisher:false,impacted:false});
  }
  const pulses=[];
  for(let i=0;i<4;i++){
    const group=new T.Group(),ringMaterial=glow(gold,0),coreMaterial=glow(white,0);root.add(group);group.visible=false;
    const ring=r.mesh(wideRingGeo,ringMaterial,group),floor=r.mesh(wideRingGeo,ringMaterial,group),rim=r.mesh(wideRingGeo,ringMaterial,group),core=r.mesh(r.geometry('SphereGeometry',1,14,10),coreMaterial,group);
    floor.rotation.x=-Math.PI/2;rim.rotation.y=Math.PI/2;pulses.push({group,ring,floor,rim,core,ringMaterial,coreMaterial,born:-Infinity,power:1});
  }
  const maxParticles=96,particles=new T.InstancedMesh(r.geometry('OctahedronGeometry',1,0),r.own(new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.82,depthWrite:false,toneMapped:false})),maxParticles);
  particles.frustumCulled=false;root.add(particles);
  const origins=new Float32Array(maxParticles*3),velocities=new Float32Array(maxParticles*3),births=new Float64Array(maxParticles),lifetimes=new Float32Array(maxParticles),sizes=new Float32Array(maxParticles);
  births.fill(-Infinity);let particleHead=0,beamHead=0,pulseHead=0,clock=0,quality='balanced',particleLimit=72,lastEmission=-Infinity;particles.count=particleLimit;
  const summary={active:false,phase:'',beams:0,particles:0,pulses:0,charge:0,quality:'balanced',particleLimit,smoke:0,geometryAllocatedPerFrame:0};
  function emit(position,power=1,count=18){
    const px=position.x??position[0],py=position.y??position[1],pz=position.z??position[2];
    for(let j=0;j<count;j++){
      const index=particleHead++%particleLimit,i=index*3,seed=(index*.61803398875+j*.38196601125)%1,angle=seed*Math.PI*2;
      origins[i]=px;origins[i+1]=py;origins[i+2]=pz;velocities[i]=Math.cos(angle)*(.8+seed*1.4)*power;velocities[i+1]=(.6+(1-seed)*1.5)*power;velocities[i+2]=Math.sin(angle)*(.6+seed)*power;
      births[index]=clock;lifetimes[index]=.7+seed*1.1;sizes[index]=(.016+seed*.025)*Math.min(power,1.6);
      color.copy(j%3===0?petal:j%3===1?white:gold);particles.setColorAt(index,color);
    }
    if(particles.instanceColor)particles.instanceColor.needsUpdate=true;
  }
  function impact(position,power=1){
    const pulse=pulses[pulseHead++%pulses.length];pulse.born=clock;pulse.power=Math.max(.3,power);if(position.isVector3)pulse.group.position.copy(position);else pulse.group.position.fromArray(position);pulse.group.position.z+=.04;pulse.group.visible=true;root.visible=true;
    emit(position,power,quality==='low'?14:quality==='high'?42:30);
    const amount=power>=1.4?(quality==='low'?6:12):3;
    for(let i=0;i<amount;i++){
      const item=smoke[i];item.born=clock;item.power=power;item.duration=power>=1.4?6.3:2.2;
      if(position.isVector3)item.center.copy(position);else item.center.fromArray(position);
    }
  }
  function reset(){
    for(const beam of beams){beam.born=-Infinity;beam.group.visible=false;}
    for(const pulse of pulses){pulse.born=-Infinity;pulse.group.visible=false;}
    for(const item of smoke){item.born=-Infinity;item.mesh.visible=false;}bolts.visible=false;births.fill(-Infinity);root.visible=false;chargeRoot.visible=groundRoot.visible=targetRoot.visible=routes.visible=false;lastEmission=-Infinity;summary.active=false;summary.beams=summary.particles=summary.pulses=summary.smoke=0;
    dummy.scale.setScalar(0);dummy.updateMatrix();for(let i=0;i<maxParticles;i++)particles.setMatrixAt(i,dummy.matrix);particles.instanceMatrix.needsUpdate=true;
  }
  reset();
  return {root,
    get state(){return {...summary};},
    fire({from,to,power=1,finisher=false,duration=finisher?2.9:.7}={}){
      if(!from||!to)return;const beam=beams[beamHead++%beams.length];beam.from.fromArray(from);beam.to.fromArray(to);beam.born=clock;beam.duration=Math.max(.15,duration);beam.power=T.MathUtils.clamp(power,.2,2);beam.finisher=finisher;beam.impacted=false;beam.group.visible=true;root.visible=true;
      emit(from,finisher?.55:.35,finisher?12:5);
    },
    impact,
    update(t,delta,state={}){
      if(!Number.isFinite(t))return;clock=t;
      const phase=state.phase||'',charge=T.MathUtils.clamp(Number(state.charge)||0,0,1),casting=['charge','combat','last','aim-final','finisher','landing'].includes(phase);
      if(!casting&&!root.visible){summary.phase=phase;summary.charge=charge;return;}
      if(state.hero)hero.fromArray(state.hero);if(state.target)target.fromArray(state.target);if(state.dragon)dragon.fromArray(state.dragon);
      const strength=phase==='charge'?charge:phase==='landing'?1-T.MathUtils.smootherstep(Number(state.elapsed)||0,0,2.8):casting?1:0;
      chargeRoot.visible=casting&&strength>.01;groundRoot.visible=casting&&strength>.01;routes.visible=phase==='charge'&&charge>.025;targetRoot.visible=phase==='combat'||phase==='aim-final';bolts.visible=casting&&strength>.13;boltMaterial.opacity=strength*(.42+Math.sin(t*23)*.12);
      chargeRoot.position.copy(hero);chargeRoot.position.y+=1.05;chargeRoot.position.z+=.18;
      for(let i=0;i<rings.length;i++){
        const item=rings[i],reveal=T.MathUtils.smoothstep(strength,i*.12,i*.12+.32);item.group.visible=reveal>.005&&(quality!=='low'||i<2);item.group.scale.setScalar(.2+reveal*.8);item.group.rotation.z=t*(i%2?-.19:.13)+(i/5)*Math.PI;item.group.position.z=(i-2)*.24;item.group.rotation.y=Math.sin(t*.23+i)*.12;item.material.opacity=(.32+i*.055)*reveal;
      }
      groundRoot.position.set(hero.x,Number.isFinite(state.ground?.[1])?state.ground[1]:.205,hero.z);
      for(let i=0;i<floorRings.length;i++){const item=floorRings[i];item.mesh.scale.setScalar((.8+i*.4)*(.55+strength*.45));item.mesh.rotation.z=t*.12*(i%2?1:-1);item.material.opacity=strength*(.28-i*.035);}
      for(let i=0;i<cityAnchors.length;i++){
        const [x,z]=cityAnchors[i],offset=i*12,jointX=x*.48+hero.x*.52,jointZ=z*.48+hero.z*.52;
        routePositions.set([x,.208,z,jointX,.208,jointZ,jointX,.208,jointZ,hero.x,.208,hero.z],offset);
      }
      for(let k=0;k<6;k++)for(let segment=0;segment<15;segment++)for(let side=0;side<2;side++){
        const p=(segment+side)/15,a=k*Math.PI/3+t*.24,radius=(1-p)*(1.25+strength*1.6),jitter=Math.sin((segment+side)*13.7+t*31+k)*.13*strength;
        const index=(k*30+segment*2+side)*3;
        boltPositions[index]=hero.x+Math.cos(a)*radius+jitter;
        boltPositions[index+1]=.24+(hero.y+.8-.24)*p+Math.sin(p*Math.PI)*.6;
        boltPositions[index+2]=hero.z+Math.sin(a)*radius+jitter*.7;
      }
      boltGeo.attributes.position.needsUpdate=true;
      routeGeo.attributes.position.needsUpdate=true;routeMat.uniforms.uTime.value=t;routeMat.uniforms.uCharge.value=charge;
      targetRoot.position.copy(target);targetRoot.position.z+=.19;targetRing.rotation.z=t*.2;targetMat.opacity=.55+Math.sin(t*3)*.12;
      let activeBeams=0,activePulses=0,activeParticles=0,activeSmoke=0;
      for(const beam of beams){
        const age=t-beam.born,life=age/beam.duration,alive=life>=0&&life<1;beam.group.visible=alive;if(!alive)continue;activeBeams++;
        const head=beam.finisher?T.MathUtils.smootherstep(life,0,1):Math.min(1,life/.26),tail=beam.finisher?Math.max(0,head-.22):Math.max(0,(life-.4)/.6);
        direction.copy(beam.to).sub(beam.from);const total=direction.length();direction.normalize();middle.copy(beam.from).addScaledVector(direction,total*(head+tail)*.5);
        beam.group.position.copy(middle);beam.group.quaternion.setFromUnitVectors(up,direction);const length=Math.max(.015,total*(head-tail)),fade=Math.sin(life*Math.PI)*(.65+beam.power*.25),radius=(beam.finisher?.43:.2)*beam.power;
        beam.outer.scale.set(radius,length,radius);beam.core.scale.set(radius*.24,length,radius*.24);beam.outerMaterial.opacity=fade*.37;beam.coreMaterial.opacity=fade*.98;
        if(!beam.finisher&&!beam.impacted&&life>=.26){beam.impacted=true;impact(beam.to,beam.power);}
      }
      for(const pulse of pulses){
        const age=t-pulse.born,life=age/1.25,alive=life>=0&&life<1;pulse.group.visible=alive;if(!alive)continue;activePulses++;
        const scale=(.12+T.MathUtils.smoothstep(life,0,1)*2.8)*pulse.power;pulse.ring.scale.setScalar(scale);pulse.floor.scale.setScalar(scale*1.3);pulse.rim.scale.setScalar(scale*.85);pulse.core.scale.setScalar(Math.max(.001,(1-life)**2*.8*pulse.power));pulse.ringMaterial.opacity=(1-life)*.65;pulse.coreMaterial.opacity=(1-life)*(1-life)*.8;
      }
      if(phase==='finisher'&&state.dragon&&Number(state.elapsed)>2&&Number(state.elapsed)<5&&t-lastEmission>.045){emit(dragon,.25,quality==='low'?1:2);lastEmission=t;}
      for(let i=0;i<maxParticles;i++){
        const age=t-births[i],life=age/lifetimes[i],alive=i<particleLimit&&life>=0&&life<1,index=i*3;
        if(alive){
          activeParticles++;dummy.position.set(origins[index]+velocities[index]*age,origins[index+1]+velocities[index+1]*age-age*age*.85,origins[index+2]+velocities[index+2]*age);dummy.rotation.set(age*1.7+i,age*.8,age*2.2);const size=sizes[i]*(1-life)*(1-life);dummy.scale.set(size,size*.48,size*1.7);
        }else dummy.scale.setScalar(0);
        dummy.updateMatrix();particles.setMatrixAt(i,dummy.matrix);
      }
      for(const item of smoke){
        const age=t-item.born,life=age/item.duration,alive=life>=0&&life<1;item.mesh.visible=alive;if(!alive)continue;activeSmoke++;
        const a=item.index*2.39996,radius=(.22+life*1.7)*item.power;
        item.mesh.position.copy(item.center);item.mesh.position.x+=Math.cos(a)*radius;item.mesh.position.z+=Math.sin(a)*radius*.55+.4;
        item.mesh.position.y+=.2+item.index%3*.28+life*1.6;
        item.mesh.scale.setScalar((.45+Math.sin(Math.min(1,life*3)*Math.PI*.5)*1.35)*item.power*(.8+item.index%3*.13));
        item.material.opacity=(1-T.MathUtils.smoothstep(life,.25,1))*(item.power>=1.4?.76:.34);
      }
      particles.instanceMatrix.needsUpdate=true;particles.visible=activeParticles>0;
      root.visible=casting||activeBeams>0||activePulses>0||activeParticles>0||activeSmoke>0;Object.assign(summary,{active:root.visible,phase,beams:activeBeams,particles:activeParticles,pulses:activePulses,smoke:activeSmoke,charge,quality,particleLimit});
    },
    quality(value){quality=['low','balanced','high'].includes(value)?value:'balanced';particleLimit=quality==='low'?36:quality==='high'?96:72;particles.count=particleLimit;summary.quality=quality;summary.particleLimit=particleLimit;},
    reset,
    dispose(){root.removeFromParent();},
  };
}
