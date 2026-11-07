import * as T from 'three';
import {groundPath} from './ground-path.js';
import {postgameFree} from './postgame-roam.js';
import {mealBirthFrame,MEAL_LANDING} from './meal-birth.js';
export function buildMealRemnant(scene,r){
 const root=new T.Group();root.name='purple-mystery-meal';scene.add(root);root.visible=false;
 const body=new T.Group();root.add(body);
 // One continuous, asymmetrical surface: no separate balls, no vertical hopping.
 const geometry=r.own(new T.SphereGeometry(1,28,16)),positions=geometry.attributes.position,rest=positions.array.slice();
 const colors=new Float32Array(positions.count*3),shade=new T.Color();
 for(let i=0;i<positions.count;i++){const y=rest[i*3+1];shade.set('#674079').lerp(new T.Color('#b093cf'),(y+1)*.5);shade.toArray(colors,i*3);}geometry.setAttribute('color',new T.BufferAttribute(colors,3));
 const material=r.own(new T.MeshPhysicalMaterial({color:'#ad83cf',vertexColors:true,roughness:.36,metalness:0,clearcoat:.65,clearcoatRoughness:.22,emissive:0x4d2678,emissiveIntensity:.09}));
 const surface=r.mesh(geometry,material,body);surface.frustumCulled=false;
 // The helper earns a tiny expressive hand only after the weight settles.
 const thumbs=new T.Group();thumbs.name='purple-helper-thumbs-up';body.add(thumbs);thumbs.visible=false;
 const handMat=r.material('#b294d2',{roughness:.38,emissive:0x42235a,emissiveIntensity:.08}),round=r.geometry('SphereGeometry',1,10,8);
 r.mesh(round,handMat,thumbs,[0,0,0],[.065,.055,.032]);
 for(let i=0;i<3;i++)r.mesh(round,handMat,thumbs,[-.028+i*.024,.015,.023],[.016,.027,.021]);
 const thumb=r.mesh(round,handMat,thumbs,[.050,.073,0],[.022,.075,.025]);thumb.rotation.z=-.18;
 const points=new Float32Array(30),boltGeo=r.own(new T.BufferGeometry());boltGeo.setAttribute('position',new T.BufferAttribute(points,3));const lightning=new T.Line(boltGeo,r.own(new T.LineBasicMaterial({color:0xc9a1ff,transparent:true,opacity:.55})));root.add(lightning);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let born=false,touched=-Infinity,bornAt=0,lastShape=-Infinity,mode='unborn',homeAt=null,lastTime=null,path=[],goal='',repathAt=0,settled=false,wanderAnchor=null,ownerAnchor=null,wanderGoal=null,wanderAt=0,seed=711;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 function clearWander(){settled=false;wanderAnchor=ownerAnchor=wanderGoal=null;wanderAt=0;path=[];goal='';repathAt=0;}
 const route=[[3.06,.33,1.65],[1.1,.33,1.65],[0,.33,1.65],[0,.33,2.65],[-.65,.33,3.48]];
 function shape(time,press,carrying=false,height=.2,weight=0){for(let i=0;i<positions.count;i++){const j=i*3,x=rest[j],y=rest[j+1],z=rest[j+2],wave=reduced?0:Math.sin(time*2.6+x*5+z*3)*.035;const lobe=1+.2*Math.sin(x*7+z*4)+.12*Math.cos(z*8-y*3);if(carrying){const u=(y+1)*.5,cap=u>.78,bulge=cap?1.0:Math.max(.16,1-u*2.8),wide=1+weight*.25;positions.setXYZ(i,x*.34*bulge*wide+wave*(cap?.18:.3),cap?height-(1-u)*.12:u/.78*Math.max(.04,height-.026),z*.22*bulge*wide-wave*.12);}else positions.setXYZ(i,x*.34*lobe+wave,(y+1)*.095*(1-press*.45)*(1+.25*Math.sin(x*5+time*2))+.012,z*.22*lobe-wave*.6);}positions.needsUpdate=true;geometry.computeVertexNormals();}
 shape(0,0);
 return {root,placeNear(feet){const z=Math.max(2.75,Math.min(11.4,feet[2]+.6));root.position.set(Math.max(-6.5,Math.min(6.5,feet[0]+.6)),z>4.65?.025:.33,z);clearWander();},reset(){born=false;mode='unborn';homeAt=null;lastTime=null;clearWander();seed=711;touched=-Infinity;root.visible=false;lastShape=-Infinity;},tap(ray,time){if(mode==='holding-tray')return false;if(!root.visible||!ray.intersectObject(body,true).length)return false;touched=time;return true;},update(time,state={},feet=null,environment={}){
  if(!born&&(state.mealBorn||state.phase==='meal-spawn')){born=true;bornAt=time-(state.phase==='meal-spawn'?(state.phaseElapsed||0):8);}
  const birth=mealBirthFrame(time-bornAt,reduced),birthing=state.tabletMode&&state.phase==='meal-spawn';
  const helper=state.helperPresent&&!state.vcr&&!state.postgame,home=state.postgame;const wreck=!home&&(state.progress||0)>=62&&!state.vcr;root.visible=helper||born&&(!birthing||birth.visible)&&(home||wreck||['heat','meal-spawn','flashback-end'].includes(state.phase));if(!root.visible)return;mode=home?'crawling':birthing?birth.beat:'incident';
  const age=Math.max(0,time-bornAt),crawl=reduced?0:Math.sin(age*.45)*.12,press=Math.max(0,1-(time-touched)/.8);
  const rescue=environment.rescue;let supportHeight=.55;
  thumbs.visible=false;
  if(helper){
    if(rescue){root.position.fromArray(rescue.base);supportHeight=rescue.height;if(state.phase==='meal-reclaim'&&state.trayOwner==='hero')supportHeight*=1-T.MathUtils.smootherstep(state.phaseElapsed,1.35,2.5);mode=state.trayOwner==='helper'?'holding-tray':'helping';thumbs.visible=rescue.thumb>.001;thumbs.position.set(.37,supportHeight-.10,-.03);thumbs.scale.setScalar(rescue.thumb);}
    else root.position.set(-1.25,.33,3.90);
    body.scale.set(1,1,1);
  }
  if(!home&&!helper){if(birthing)root.position.fromArray(birth.position);else root.position.set((wreck?2.45:MEAL_LANDING[0])+crawl,wreck?.33:MEAL_LANDING[1],(wreck?4.52:MEAL_LANDING[2])+crawl*.12);}body.rotation.y=reduced?0:Math.sin(age*.6)*.15;
  const dt=lastTime===null?0:Math.max(0,Math.min(.1,time-lastTime));lastTime=time;
  if(home){
    if(homeAt!==state.homecomingAt){homeAt=state.homecomingAt;if(environment.intact===false)root.position.set(2.45,.33,4.52);else if(root.position.z<1||root.position.y>1)root.position.set(2.05,.33,1.35);clearWander();}
    const follow=time-state.homecomingAt>=17,ownerDistance=feet?Math.hypot(feet[0]-root.position.x,feet[2]-root.position.z):0;
    if(settled&&(ownerDistance>2||ownerAnchor&&feet&&Math.hypot(feet[0]-ownerAnchor[0],feet[2]-ownerAnchor[2])>.5))clearWander();
    if(follow&&!settled&&(feet?ownerDistance<1.25:Math.hypot(route[4][0]-root.position.x,route[4][2]-root.position.z)<.4)){settled=true;wanderAnchor=root.position.toArray();ownerAnchor=feet&&[...feet];wanderAt=time+1+random()*2;path=[];goal='';}
    if(settled&&!wanderGoal&&time>=wanderAt&&dt>0){for(let i=0;i<12;i++){const a=random()*Math.PI*2,radius=.35+random()*.4,p=[wanderAnchor[0]+Math.cos(a)*radius,.33,wanderAnchor[2]+Math.sin(a)*radius];if(postgameFree(p,environment)&&(!feet||Math.hypot(p[0]-feet[0],p[2]-feet[2])>.6)){wanderGoal=p;break;}}wanderAt=time+1+random()*2;}
    const targets=feet?[[feet[0]+.6,.33,feet[2]+.6],[feet[0]-.6,.33,feet[2]+.6],[feet[0]+.6,.33,feet[2]-.6],[feet[0]-.6,.33,feet[2]-.6]]:route.slice(-1),target=targets.find(p=>postgameFree(p,environment))||root.position.toArray();
    const wanted=follow?(settled?(wanderGoal||root.position.toArray()):target):route[4];
    if(!follow&&feet){route[4][0]=feet[0]+.6;route[4][2]=feet[2]+.6;}
    const key=Math.round(wanted[0]*3)+':'+Math.round(wanted[2]*3)+':'+environment.intact;
    if((goal!==key||path.length===0)&&time>=repathAt&&(!settled||wanderGoal)){path=groundPath(root.position.toArray(),wanted,environment.floorPlan?.obstacles||[],environment.intact!==false,p=>postgameFree(p,environment));goal=key;repathAt=time+.65;}
    const next=path[0];mode=settled?(wanderGoal?'wandering':'idle'):follow?'following':'crawling';
    if(next&&time-state.homecomingAt>2){
      const dx=next[0]-root.position.x,dz=next[2]-root.position.z,dist=Math.hypot(dx,dz),nearDoor=Math.abs(root.position.z-1.895)<.75&&Math.abs(root.position.x+.22)<.6;
      if(nearDoor&&environment.intact!==false){environment.doors?.requestPassage(time);if(environment.doors&&!environment.doors.isOpen)mode='waiting-door';}
      if(mode!=='waiting-door') {const speed=settled?.20:ownerDistance>4?.48:.35,move=Math.min(dist,dt*speed);if(dist>.001){const p=[root.position.x+dx/dist*move,.33,root.position.z+dz/dist*move];if(postgameFree(p,environment)){root.position.x=p[0];root.position.z=p[2];body.rotation.y=Math.atan2(dx,dz);}else{path=[];goal='';repathAt=time+1;}}if(dist<.07)path.shift();}
    }
    if(Math.hypot(wanted[0]-root.position.x,wanted[2]-root.position.z)<(settled?.24:.4)){mode='idle';if(settled&&wanderGoal){wanderGoal=null;path=[];goal='';wanderAt=time+1+random()*2;}}
    root.position.y=root.position.z>4.65?.025:.33;body.scale.set(1,1,1+(reduced?0:Math.sin(time*3)*.06));
  }else if(!helper&&birthing)body.scale.fromArray(birth.scale);else if(!helper)body.scale.set(1,1,1);
  if(helper||time-lastShape>=1/24||time<lastShape){shape(reduced?0:age,press,helper,supportHeight,rescue?.press||0);lastShape=time;}
  lightning.visible=!home&&!helper&&!reduced&&age%4<.3;for(let i=0;i<10;i++){points[i*3]=-.31+i*.07;points[i*3+1]=.16+Math.sin(i*8+time*13)*.04;points[i*3+2]=.08+Math.cos(i*5)*.08;}boltGeo.attributes.position.needsUpdate=true;
 },get state(){return {born,visible:root.visible,mode,position:root.position.toArray(),shape:mode==='holding-tray'?'stretched-helper':'crawling-lump',thumbVisible:thumbs.visible};}};
}
