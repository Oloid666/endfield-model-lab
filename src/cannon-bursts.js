import * as T from 'three';

// Fixed pools: broad layered meshes sell scale; particle count stays small.
const QUALITY={low:{smoke:4,rays:4,layers:2},balanced:{smoke:8,rays:8,layers:3},high:{smoke:12,rays:12,layers:3}};
const clamp=(v,min=0,max=1)=>T.MathUtils.clamp(Number(v)||0,min,max);
export function buildCannonBursts(scene,r,parent,{reducedMotion=false}={}){
  const root=new T.Group();root.name='cannon-layered-bursts-v9';parent.add(root);
  const up=new T.Vector3(0,1,0),direction=new T.Vector3(),dummy=new T.Object3D(),white=new T.Color(2.1,1.8,1.2),gold=new T.Color(2.6,1.35,.5),cyan=new T.Color(.3,1.6,2.1);
  const basic=(color,opacity=0)=>r.own(new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,side:T.DoubleSide,forceSinglePass:true}));
  const plane=r.geometry('PlaneGeometry',2,2),ring=r.geometry('RingGeometry',.983,1,64),sphere=r.geometry('SphereGeometry',1,12,8),cone=r.geometry('CylinderGeometry',1,.08,1,10,1,true);
  function glareMaterial(tint){return r.own(new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,forceSinglePass:true,blending:T.AdditiveBlending,toneMapped:false,
    uniforms:{uStrength:{value:0},uTint:{value:tint}},vertexShader:'varying vec2 vUv;void main(){vUv=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying vec2 vUv;uniform float uStrength;uniform vec3 uTint;void main(){float r=length(vUv);float body=pow(max(0.,1.-r),2.5);float shaft=pow(max(0.,1.-abs(vUv.y)),18.)*pow(max(0.,1.-abs(vUv.x)),.8);float core=exp(-r*14.);float a=(body*.5+shaft*.22+core*.35)*uStrength;gl_FragColor=vec4(uTint,a);}'
  }));}
  const muzzles=[];
  for(let i=0;i<4;i++){
    const group=new T.Group();group.name='cannon-muzzle-'+i;group.visible=false;root.add(group);
    const shellMat=basic(gold),coreMat=basic(white),rimMat=basic(cyan),flareMat=glareMaterial(gold);
    const shell=r.mesh(cone,shellMat,group),core=r.mesh(cone,coreMat,group),rim=r.mesh(ring,rimMat,group),flare=r.mesh(plane,flareMat,group);
    rim.rotation.x=flare.rotation.x=Math.PI/2;
    muzzles.push({group,shell,core,rim,flare,shellMat,coreMat,rimMat,flareMat,born:-Infinity,power:1,finisher:false});
  }
  const pulses=[];
  for(let i=0;i<4;i++){
    const group=new T.Group();group.name='cannon-area-impact-'+i;group.visible=false;root.add(group);
    const hotMat=basic(white),ringMat=basic(gold),coolMat=basic(cyan),flareMat=glareMaterial(gold),groundMat=glareMaterial(cyan);
    const core=r.mesh(sphere,hotMat,group),ringA=r.mesh(ring,ringMat,group),ringB=r.mesh(ring,coolMat,group),rim=r.mesh(ring,ringMat,group);
    ringB.rotation.y=Math.PI/2;rim.rotation.x=Math.PI/2;
    const flare=r.mesh(plane,flareMat,group),cross=r.mesh(plane,flareMat,group);cross.rotation.y=Math.PI/2;
    const ground=new T.Group();ground.name='street-wide-shockwave';group.add(ground);
    const floor=r.mesh(ring,ringMat,ground),floorEcho=r.mesh(ring,coolMat,ground),wash=r.mesh(plane,groundMat,ground);
    floor.rotation.x=floorEcho.rotation.x=wash.rotation.x=-Math.PI/2;
    pulses.push({group,ground,core,ringA,ringB,rim,flare,cross,floor,floorEcho,wash,hotMat,ringMat,coolMat,flareMat,groundMat,born:-Infinity,power:1,finisher:false,radius:0});
  }
  // A single InstancedMesh supplies all blast streaks across all four impacts.
  const rays=r.own(new T.InstancedMesh(r.geometry('BoxGeometry',1,1,1),basic(gold,.85),48));rays.name='pooled-blast-streaks';rays.frustumCulled=false;rays.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(rays);
  const smoke=[];
  for(let i=0;i<12;i++){
    const material=r.own(new T.ShaderMaterial({transparent:true,depthWrite:false,forceSinglePass:true,
      uniforms:{uOpacity:{value:0},uHeat:{value:0},uSeed:{value:i*.79},uTint:{value:new T.Color(i%3===0?'#7c8581':'#3c4c50')}},
      vertexShader:'varying vec2 vPuff;void main(){vPuff=uv*2.-1.;vec4 center=modelViewMatrix*vec4(0.,0.,0.,1.);vec2 extent=vec2(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz));center.xy+=position.xy*extent;gl_Position=projectionMatrix*center;}',
      fragmentShader:'varying vec2 vPuff;uniform float uOpacity;uniform float uHeat;uniform float uSeed;uniform vec3 uTint;void main(){vec2 p=vPuff;float a=atan(p.y,p.x);float edge=.8+sin(a*5.+uSeed)*.08+sin(a*9.-uSeed)*.04;float soft=1.-smoothstep(.08,edge,length(p));float billow=.8+.13*sin(p.x*7.+p.y*5.+uSeed)+.07*sin(p.y*11.-p.x*4.);vec3 shade=mix(uTint*.7,uTint*1.3,p.y*.5+.5);gl_FragColor=vec4(shade+vec3(.95,.46,.12)*uHeat,uOpacity*pow(soft,1.35)*billow);}'
    }));
    const mesh=r.mesh(plane,material,root);mesh.name='pooled-soft-smoke-'+i;mesh.visible=false;
    smoke.push({mesh,material,born:-Infinity,power:1,duration:4,index:i,center:new T.Vector3()});
  }
  // Keep the light count constant. Only its intensity changes, avoiding shader variants on shots.
  const burstLight=new T.PointLight(0xffd595,0,27,2);burstLight.name='cannon-shared-burst-light';burstLight.castShadow=false;scene.add(burstLight);
  let clock=0,quality='balanced',caps=QUALITY.balanced,muzzleHead=0,pulseHead=0,smokeHead=0,impactRevision=0,lastImpact=-Infinity,lastFire=-Infinity,lastPower=0,lastFinisher=false;
  const origin=new T.Vector3(),fireOrigin=new T.Vector3(),status={muzzles:0,pulses:0,smoke:0,rays:0,shock:0,flash:0,maxImpactRadius:0,lightIntensity:0};
  function place(out,value){if(value?.isVector3)out.copy(value);else out.fromArray(value);}
  function reset(){
    for(const item of muzzles){item.born=-Infinity;item.group.visible=false;}
    for(const item of pulses){item.born=-Infinity;item.group.visible=false;}
    for(const item of smoke){item.born=-Infinity;item.mesh.visible=false;}
    dummy.scale.setScalar(0);dummy.updateMatrix();for(let i=0;i<48;i++)rays.setMatrixAt(i,dummy.matrix);rays.instanceMatrix.needsUpdate=true;rays.visible=false;
    lastFire=lastImpact=-Infinity;lastPower=0;impactRevision=0;burstLight.intensity=0;Object.assign(status,{muzzles:0,pulses:0,smoke:0,rays:0,shock:0,flash:0,maxImpactRadius:0,lightIntensity:0});
  }
  reset();
  return {root,burstLight,
    fire(from,to,power=1,finisher=false){
      const item=muzzles[muzzleHead++%4];item.born=clock;item.power=clamp(power,.2,2);item.finisher=finisher;place(item.group.position,from);
      place(direction,to);direction.sub(item.group.position).normalize();item.group.quaternion.setFromUnitVectors(up,direction);item.group.visible=true;
      lastFire=clock;fireOrigin.copy(item.group.position);
    },
    impact(position,power=1){
      const item=pulses[pulseHead++%4];item.born=clock;item.power=clamp(power,.3,2);item.finisher=power>=1.4;place(item.group.position,position);item.group.position.z+=.05;item.group.visible=true;
      lastImpact=clock;lastPower=item.power;lastFinisher=item.finisher;origin.copy(item.group.position);impactRevision++;
      const amount=item.finisher?caps.smoke:Math.min(4,caps.smoke);
      for(let i=0;i<amount;i++){const puff=smoke[smokeHead++%12];puff.born=clock;puff.power=item.power;puff.duration=item.finisher?6.8:3.6;puff.center.copy(item.group.position);}
    },
    update(t){
      clock=t;let activeMuzzles=0,activePulses=0,activeSmoke=0,activeRays=0,maxRadius=0;
      for(const item of muzzles){
        const age=t-item.born,duration=item.finisher?.9:.5,p=age/duration,alive=p>=0&&p<1;item.group.visible=alive;if(!alive)continue;activeMuzzles++;
        const bloom=Math.sin(Math.PI*Math.sqrt(p)),size=item.power*(item.finisher?1.5:1),fade=(1-p)**1.5*(reducedMotion?.45:1);
        item.shell.position.y=.42+size*.3;item.shell.scale.set((.25+bloom*.4)*size,.9+size*.9,(.25+bloom*.4)*size);
        item.core.position.y=item.shell.position.y;item.core.scale.copy(item.shell.scale).multiplyScalar(.45);
        item.rim.position.y=.22;item.rim.scale.setScalar((.25+p*2.8)*size);item.flare.position.y=.18;item.flare.scale.setScalar((.5+bloom*1.2)*size);
        item.shellMat.opacity=fade*.19;item.coreMat.opacity=fade*.65;item.rimMat.opacity=fade*.5;item.flareMat.uniforms.uStrength.value=fade*.8;
      }
      for(let i=0;i<4;i++){
        const item=pulses[i],age=t-item.born,duration=item.finisher?1.9:1.45,p=age/duration,alive=p>=0&&p<1;item.group.visible=alive;
        if(alive){
          activePulses++;const scale=(.15+T.MathUtils.smoothstep(p,0,1)*(item.finisher?5.6:4.2))*item.power;
          item.radius=scale;maxRadius=Math.max(maxRadius,scale*1.85);
          item.ringA.scale.setScalar(scale);item.ringB.scale.setScalar(scale*.85);item.rim.scale.setScalar(scale*.65);
          item.ringB.visible=item.cross.visible=caps.layers>=3;
          const hot=(1-p)**3*(reducedMotion?.38:1);
          item.core.scale.setScalar(Math.max(.001,(1-p)**2*(item.finisher?1.65:1.05)*item.power));
          item.hotMat.opacity=hot*.72;item.ringMat.opacity=(1-p)**1.25*.66;item.coolMat.opacity=(1-p)**1.5*.5;
          item.flare.scale.setScalar((2.8+Math.sin(p*Math.PI)*1.8)*item.power);item.cross.scale.copy(item.flare.scale);item.flareMat.uniforms.uStrength.value=hot*(item.finisher?1.2:.8);
          item.ground.position.y=.235-item.group.position.y;
          item.floor.scale.setScalar(scale*1.85);item.floorEcho.scale.setScalar(Math.max(.001,scale*1.85-.8));item.floorEcho.position.y=.006;
          item.wash.position.y=.002;item.wash.scale.setScalar(scale*1.5);item.groundMat.uniforms.uStrength.value=(1-p)**2*(reducedMotion?.12:.3);
        }
        for(let j=0;j<12;j++){
          const aliveRay=alive&&j<caps.rays&&age<.95,index=i*12+j;
          if(aliveRay){
            activeRays++;const angle=j*2.39996+i,fall=clamp(age/.95),reach=(.6+age*5.4)*item.power;
            direction.set(Math.cos(angle),Math.sin(angle*1.83)*.55+.18,Math.sin(angle));direction.normalize();
            dummy.position.copy(item.group.position).addScaledVector(direction,reach);dummy.position.y-=age*age*.55;dummy.quaternion.setFromUnitVectors(up,direction);
            const length=(.4+Math.sin(fall*Math.PI)*1.6)*item.power;dummy.scale.set((.025+(j%3)*.008)*(1-fall),length,(.015+(j%2)*.01)*(1-fall));
          }else dummy.scale.setScalar(0);
          dummy.updateMatrix();rays.setMatrixAt(index,dummy.matrix);
        }
      }
      rays.visible=activeRays>0;rays.instanceMatrix.needsUpdate=true;
      for(let j=0;j<smoke.length;j++){
        const puff=smoke[(smokeHead+smoke.length-1-j)%smoke.length];
        const age=t-puff.born,p=age/puff.duration,alive=p>=0&&p<1&&activeSmoke<caps.smoke;puff.mesh.visible=alive;if(!alive)continue;activeSmoke++;
        const angle=puff.index*2.39996,radius=(.35+p*2.1)*puff.power;
        puff.mesh.position.copy(puff.center);puff.mesh.position.x+=Math.cos(angle)*radius;puff.mesh.position.z+=Math.sin(angle)*radius*.65+.3;
        puff.mesh.position.y+=.15+(puff.index%3)*.3+p*2.5;puff.mesh.scale.set((.7+Math.sin(Math.min(1,p*3)*Math.PI*.5)*1.65)*puff.power, (.7+p*1.9)*puff.power,(.65+p*1.35)*puff.power);
        puff.mesh.rotation.y=p*.25+puff.index;puff.material.uniforms.uOpacity.value=(1-T.MathUtils.smoothstep(p,.2,1))*(puff.power>=1.4?.68:.38);puff.material.uniforms.uHeat.value=Math.max(0,1-age*1.8)*.7;
      }
      const impactAge=t-lastImpact,fireAge=t-lastFire,impactWave=impactAge>=0?Math.exp(-impactAge*3.7)*(1-Math.exp(-impactAge*42))*Math.min(1.4,lastPower):0,fireKick=fireAge>=0?.24*Math.exp(-fireAge*10):0;
      const shock=clamp(impactWave+fireKick),flash=impactAge>=0?Math.exp(-impactAge*9)*Math.min(1,lastPower):0;
      if(flash>.005){burstLight.position.copy(origin);burstLight.position.y+=.45;burstLight.intensity=flash*(lastFinisher?650:360)*(reducedMotion?.25:1);}
      else if(fireAge>=0&&fireAge<.25){burstLight.position.copy(fireOrigin);burstLight.intensity=Math.exp(-fireAge*18)*90*(reducedMotion?.25:1);}
      else burstLight.intensity=0;
      Object.assign(status,{muzzles:activeMuzzles,pulses:activePulses,smoke:activeSmoke,rays:activeRays,shock:shock*(reducedMotion?.28:1),flash:flash*(reducedMotion?.25:1),maxImpactRadius:maxRadius,lightIntensity:burstLight.intensity});
    },
    quality(value){quality=QUALITY[value]?value:'balanced';caps=QUALITY[quality];},reset,
    get state(){return {...status,impactAge:Number.isFinite(lastImpact)?Math.max(0,clock-lastImpact):null,fireAge:Number.isFinite(lastFire)?Math.max(0,clock-lastFire):null,shockOrigin:origin.toArray(),impactRevision,quality,qualityCaps:{...caps},sharedLights:1,reducedMotion};},
    dispose(){burstLight.intensity=0;burstLight.removeFromParent();root.removeFromParent();},
  };
}
