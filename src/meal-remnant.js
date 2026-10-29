import * as T from 'three';
import {groundPath} from './ground-path.js';
export function buildMealRemnant(scene,r){
 const root=new T.Group();root.name='purple-mystery-meal';scene.add(root);root.visible=false;
 const body=new T.Group();root.add(body);
 // One continuous, asymmetrical surface: no separate balls, no vertical hopping.
 const geometry=r.own(new T.SphereGeometry(1,28,16)),positions=geometry.attributes.position,rest=positions.array.slice();
 const material=r.material('#73508e',{roughness:.56,metalness:.02,emissive:0x4d2678,emissiveIntensity:.12});
 r.mesh(geometry,material,body);
 const points=new Float32Array(30),boltGeo=r.own(new T.BufferGeometry());boltGeo.setAttribute('position',new T.BufferAttribute(points,3));const lightning=new T.Line(boltGeo,r.own(new T.LineBasicMaterial({color:0xc9a1ff,transparent:true,opacity:.55})));root.add(lightning);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let born=false,touched=-Infinity,bornAt=0,lastShape=-Infinity,mode='unborn',homeAt=null,lastTime=null,path=[],goal='',repathAt=0;
 const route=[[3.06,.33,1.65],[1.1,.33,1.65],[0,.33,1.65],[0,.33,2.65],[-.65,.33,3.48]];
 function shape(time,press){for(let i=0;i<positions.count;i++){const j=i*3,x=rest[j],y=rest[j+1],z=rest[j+2],wave=reduced?0:Math.sin(time*2.6+x*5+z*3)*.035;const lobe=1+.2*Math.sin(x*7+z*4)+.12*Math.cos(z*8-y*3);positions.setXYZ(i,x*.34*lobe+wave,(y+1)*.095*(1-press*.45)*(1+.25*Math.sin(x*5+time*2))+.012,z*.22*lobe-wave*.6);}positions.needsUpdate=true;geometry.computeVertexNormals();}
 shape(0,0);
 return {root,placeNear(feet){root.position.set(feet[0]+.6,.33,feet[2]+.6);path=[];goal='';},reset(){born=false;mode='unborn';homeAt=null;lastTime=null;path=[];goal='';touched=-Infinity;root.visible=false;lastShape=-Infinity;},tap(ray,time){if(!root.visible||!ray.intersectObject(body,true).length)return false;touched=time;return true;},update(time,state={},feet=null,environment={}){
  if(!born&&(state.mealBorn||state.phase==='meal-spawn')){born=true;bornAt=time;}
  const home=state.postgame;if(home)born=true;const wreck=!home&&(state.progress||0)>=62&&!state.vcr;root.visible=born&&(home||wreck||['heat','meal-spawn','flashback-end'].includes(state.phase));if(!root.visible)return;mode=home?'crawling':'incident';
  const age=Math.max(0,time-bornAt),crawl=reduced?0:Math.sin(age*.45)*.12,press=Math.max(0,1-(time-touched)/.8);
  if(!home)root.position.set((wreck?2.8:3.06)+crawl,wreck?.35:1.35,(wreck?4.15:.8)+crawl*.35);body.rotation.y=reduced?0:Math.sin(age*.6)*.15;
  if(!home&&!wreck&&age<.9){const p=Math.min(1,age/.9);root.position.set(3.45+(3.06-3.45)*p,1.6+(1.35-1.6)*p+Math.sin(p*Math.PI)*.18,1.25+(.8-1.25)*p);}
  const dt=lastTime===null?0:Math.max(0,Math.min(.1,time-lastTime));lastTime=time;
  if(home){
    if(homeAt!==state.homecomingAt){homeAt=state.homecomingAt;root.position.set(3.06,.33,1.65);path=[];goal='';}
    const follow=time-state.homecomingAt>=17,target=feet?[feet[0]+.6,.33,feet[2]+.6]:route[4],wanted=follow?target:route[4];
    if(!follow&&feet){route[4][0]=feet[0]+.6;route[4][2]=feet[2]+.6;}
    const key=Math.round(wanted[0]*3)+':'+Math.round(wanted[2]*3)+':'+environment.intact;
    if((goal!==key||path.length===0)&&time>=repathAt){path=groundPath(root.position.toArray(),wanted,environment.floorPlan?.obstacles||[],environment.intact!==false);goal=key;repathAt=time+.65;}
    const next=path[0];mode=follow?'following':'crawling';
    if(next&&time-state.homecomingAt>2){
      const dx=next[0]-root.position.x,dz=next[2]-root.position.z,dist=Math.hypot(dx,dz),nearDoor=Math.abs(root.position.z-1.895)<.75&&Math.abs(root.position.x+.22)<.6;
      if(nearDoor&&environment.intact!==false){environment.doors?.requestPassage(time);if(environment.doors&&!environment.doors.isOpen)mode='waiting-door';}
      if(mode!=='waiting-door') {const move=Math.min(dist,dt*.65);if(dist>.001){root.position.x+=dx/dist*move;root.position.z+=dz/dist*move;body.rotation.y=Math.atan2(dx,dz);}if(dist<.07)path.shift();}
    }
    if(Math.hypot(wanted[0]-root.position.x,wanted[2]-root.position.z)<.4)mode='idle';
    root.position.y=.33;body.scale.set(1,1,1+(reduced?0:Math.sin(time*3)*.06));
  }else body.scale.set(1,1,1);
  if(time-lastShape>=1/24||time<lastShape){shape(reduced?0:age,press);lastShape=time;}
  lightning.visible=!home&&!reduced&&age%4<.3;for(let i=0;i<10;i++){points[i*3]=-.31+i*.07;points[i*3+1]=.16+Math.sin(i*8+time*13)*.04;points[i*3+2]=.08+Math.cos(i*5)*.08;}boltGeo.attributes.position.needsUpdate=true;
 },get state(){return {born,visible:root.visible,mode,position:root.position.toArray(),shape:'crawling-lump'};}};
}
