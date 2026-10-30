import * as T from 'three';
import {createCameraDirector} from './camera-director.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Resources} from '../resources.js';
import {buildInterior} from '../interior.js';
import {createSurfaces} from '../surfaces.js';
import {buildDragon} from '../companion.js';
import {route,LENGTH,WIDTH,CHECKPOINTS,ROOM_SCALE,AVATAR_SCALE,CRUISE_SPEED} from './game.js';
export function createScene(canvas,state){
 const r=new Resources(),scene=new T.Scene(),renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
 scene.background=new T.Color('#9faf9d');scene.add(new T.HemisphereLight('#fff8de','#314f44',2.3));const sun=new T.DirectionalLight('#ffe4bb',2.2);sun.position.set(-2,8,4);scene.add(sun);
 const camera=new T.PerspectiveCamera(75,1,.008,60),root=new T.Group(),room=new T.Group();scene.add(root);root.add(room);room.scale.set(ROOM_SCALE.horizontal,ROOM_SCALE.vertical,ROOM_SCALE.horizontal);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 r.box(room,'#c7c9b4',[0,.15,-.5],[8.5,.3,5]);r.box(room,'#355d4a',[0,1.6,-3.1],[8.5,2.6,.12]);
 const glass=r.own(new T.MeshStandardMaterial({color:'#adc7be',transparent:true,opacity:.1,depthWrite:false}));buildInterior(room,r,createSurfaces(r),glass,[]);
 // Dollhouse cutaway: no roof or foreground wall. The existing shelves remain visible.
 r.mesh(r.geometry('PlaneGeometry',2,.4),r.label('武陵711・高架疾走',{font:'bold 55px sans-serif'}),room,[0,2.7,-3]);
 // Bake static fixtures into material batches; retain instanced stock and transparent glass.
 scene.updateMatrixWorld(true);const batches=new Map();
 for(const m of [...room.children]){if(!m.isMesh||m.isInstancedMesh||Array.isArray(m.material)||m.material.transparent)continue;const list=batches.get(m.material)||[];list.push(m);batches.set(m.material,list);}
 for(const [material,meshes] of batches){if(meshes.length<2)continue;const gs=meshes.map(m=>m.geometry.clone().applyMatrix4(m.matrixWorld)),merged=mergeGeometries(gs);if(merged){r.mesh(r.own(merged),material,root);meshes.forEach(m=>m.removeFromParent());}gs.forEach(g=>g.dispose());}
 const trackWidth=s=>WIDTH+Math.max(...state.goods.map(g=>.85*Math.exp(-(((s-g.s)/1.15)**2))));
 const verts=[],indices=[];const count=Math.ceil(LENGTH/.04);
 for(let i=0;i<=count;i++){const s=i/count*LENGTH;for(const side of [-1,1]){const p=route(s,side*trackWidth(s)/2);verts.push(p.x,p.y,p.z);}if(i<count){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}}
 const geo=r.own(new T.BufferGeometry());geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();const mat=r.material('#c2b687',{side:T.DoubleSide,roughness:.8,emissive:'#847647',emissiveIntensity:.15});r.mesh(geo,mat,root);
 for(let s=0;s<LENGTH;s+=.32){for(const side of [-1,1]){const p=route(s,side*(trackWidth(s)/2-.02));r.box(root,'#61b6ab',[p.x,p.y+.018,p.z],[.035,.02,.035],{emissive:'#59b8a2',emissiveIntensity:.7});}if(Math.floor(s/.32)%3===0){const p=route(s),m=r.mesh(r.geometry('PlaneGeometry',.12,.16),r.label('↑',{width:64,height:64,font:'bold 50px sans-serif',bg:'#bdac73',color:'#244a42'}),root,[p.x,p.y+.008,p.z]);m.rotation.set(-Math.PI/2,0,Math.atan2(-p.fx,-p.fz));}}
 for(const [i,s] of [LENGTH].entries()){
  // Paint follows the ramp rather than putting a horizontal block through the racers.
  const vertices=[];for(const at of [Math.max(0,s-.12),Math.min(LENGTH,s+.12)])for(const side of [-1,1]){const p=route(at,side*WIDTH/2);vertices.push(p.x,p.y+.006,p.z);}
  const mark=r.own(new T.BufferGeometry());mark.setAttribute('position',new T.Float32BufferAttribute(vertices,3));mark.setIndex([0,1,2,1,3,2]);mark.computeVertexNormals();r.mesh(mark,r.material('#ddc47c',{side:T.DoubleSide}),root);
  const p=route(s,-WIDTH/2-.15);r.mesh(r.geometry('PlaneGeometry',.48,.16),r.label('低貨架・終點',{width:256,height:64,font:'bold 40px sans-serif'}),root,[p.x,p.y+.45,p.z]);r.box(root,'#425f54',[p.x,p.y+.22,p.z],[.02,.44,.02]);
 }
 const end=route(LENGTH);r.box(root,'#b49a69',[end.x,end.y-.22,end.z],[1.4,.4,1.1]);for(const x of [-.5,.5])for(const z of [-.35,.35])r.box(root,'#486358',[end.x+x,(.54+end.y-.42)/2,end.z+z],[.06,Math.max(.05,end.y-.42-.54),.06]);
 // Camera collision uses only static solid scenery, never the actors or flying goods.
 const cameraSolids=[];root.updateMatrixWorld(true);root.traverse(m=>{if(m.isMesh&&!Array.isArray(m.material)&&!m.material.transparent&&(m.geometry===geo||m.geometry.type!=='PlaneGeometry'))cameraSolids.push(m);});
 const cameraRay=new T.Raycaster(),rayStart=new T.Vector3(),rayDirection=new T.Vector3(),probe=new T.Vector3();
 let cameraMode='auto',shotState={shot:'close',blend:0,reason:'直道'};const director=createCameraDirector(),previousCamera=new T.Vector3(),wideTarget=new T.Vector3();
 function blocked(from,to){rayStart.set(from.x,from.y+.07,from.z);rayDirection.copy(to).sub(rayStart);const length=rayDirection.length();cameraRay.set(rayStart,rayDirection.normalize());cameraRay.far=Math.max(0,length-.025);return cameraRay.intersectObjects(cameraSolids,false).length>0;}
 const player=new T.Group();root.add(player);const blobGeo=r.own(new T.SphereGeometry(1,20,12));const pos=blobGeo.attributes.position;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),l=1+.18*Math.sin(x*6+z*4);pos.setXYZ(i,x*.085*l,(y+1)*.03,z*.12*l);}blobGeo.computeVertexNormals();const blob=r.mesh(blobGeo,r.material('#8956b2',{roughness:.4}),player);
 const dragon=buildDragon(r);root.add(dragon.root);dragon.root.scale.setScalar(AVATAR_SCALE);
 const harness=r.mesh(r.geometry('TorusGeometry',.57,.045,6,20),r.material('#ccae68'),dragon.root,[0,.6,0]);harness.rotation.x=Math.PI/2;
 const ropeGeo=r.own(new T.BufferGeometry());ropeGeo.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(51),3));const rope=new T.Line(ropeGeo,r.own(new T.LineBasicMaterial({color:'#e4b756'})));rope.frustumCulled=false;root.add(rope);
 const packs=state.goods.map(g=>{const group=new T.Group();group.scale.setScalar(1.5);root.add(group);if(g.kind==='drink'){r.mesh(r.geometry('CylinderGeometry',.055,.055,.19,10),r.material('#548b9c'),group,[0,.1,0]);r.cylinder(group,'#eee7ca',[0,.2,0],.04,.02);}else r.box(group,'#d7ac65',[0,.08,0],[.13,.16,.08]);r.mesh(r.geometry('PlaneGeometry',.085,.05),r.label(g.kind==='drink'?'醇乳':'脆餅',{width:128,height:64,font:'bold 40px sans-serif'}),group,[0,.1,.057]);return group;});
 const trailGeo=r.own(new T.BufferGeometry()),trailData=new Float32Array(24*2*3);trailGeo.setAttribute('position',new T.BufferAttribute(trailData,3));const trail=new T.LineSegments(trailGeo,r.own(new T.LineBasicMaterial({color:'#e4e4c4',transparent:true,opacity:.45})));trail.frustumCulled=false;root.add(trail);
 const halos=state.goods.map(g=>{const p=route(g.s,g.offset),m=r.mesh(r.geometry('RingGeometry',g.radius+.03,g.radius+.055,24),r.own(new T.MeshBasicMaterial({color:'#ffb04f',transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false})),root,[p.x,p.y+.012,p.z]);m.rotation.x=-Math.PI/2;return m;});
 const hintGeo=r.own(new T.BufferGeometry());hintGeo.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(6),3));const hintLine=new T.Line(hintGeo,r.own(new T.LineDashedMaterial({color:'#ffce7b',dashSize:.055,gapSize:.045,transparent:true,opacity:.55})));hintLine.frustumCulled=false;root.add(hintLine);
 const sparksGeo=r.own(new T.BufferGeometry()),sparksData=new Float32Array(24*3);sparksGeo.setAttribute('position',new T.BufferAttribute(sparksData,3));const sparks=new T.Points(sparksGeo,r.own(new T.PointsMaterial({color:'#ffd27f',size:.025,transparent:true,opacity:.9})));sparks.frustumCulled=false;root.add(sparks);
 let latestHit=null,hitAt=-10,shake=0;
 function hit(event,clock){latestHit=event;hitAt=clock;shake=reduced?0:event.strength*.025;}
 const look=new T.Vector3(),target=new T.Vector3();let fx=0,fz=-1;
 function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
 function pose(dt,clock,snap=false){
  const p=route(state.s,state.offset),d={...route(state.dragonS),x:state.dragonX,z:state.dragonZ};
  player.position.set(p.x,p.y+.012,p.z);player.rotation.y=Math.atan2(-p.fx,-p.fz);blob.scale.set(.5*(1+state.playerImpact*.3),.5*(1-state.playerImpact*.35),.5*(1+state.speed*.35));
  dragon.update(clock,{allowIdleEmote:false,action:state.dragonImpact>.15?{kind:'shock',amount:state.dragonImpact}:null});dragon.root.position.set(d.x,d.y+.012,d.z);dragon.root.rotation.set(state.dragonImpact*.35,Math.atan2(-state.dragonVX,-state.dragonVZ),reduced?0:Math.sin(Math.max(0,clock-hitAt)*14)*state.dragonImpact*1.6);dragon.root.scale.set(AVATAR_SCALE*(1+state.dragonImpact*.1),AVATAR_SCALE*(1-state.dragonImpact*.2),AVATAR_SCALE);
  const a=ropeGeo.attributes.position;for(let i=0;i<17;i++){const t=i/16;a.setXYZ(i,p.x+(d.x-p.x)*t,Math.max(p.y+.025+(d.y+.05-p.y-.025)*t-Math.sin(t*Math.PI)*.012,route(state.s+(state.dragonS-state.s)*t).y+.018),p.z+(d.z-p.z)*t);}a.needsUpdate=true;
  trail.visible=!reduced&&state.running&&state.speed>.4;for(let i=0;i<24;i++){const start=Math.max(0,state.s-((i%12)*.15)),side=i<12?-1:1;for(let j=0;j<2;j++){const q=route(Math.max(0,start-j*.12),side*(WIDTH/2-.06)),k=(i*2+j)*3;trailData[k]=q.x;trailData[k+1]=q.y+.02;trailData[k+2]=q.z;}}trailGeo.attributes.position.needsUpdate=true;
  packs.forEach((m,i)=>{const g=state.goods[i],p=route(g.s,g.offset),age=g.age;m.visible=!g.hit||age<.9;halos[i].visible=false;halos[i].material.opacity=.55+Math.sin(clock*5)*.15;
   m.position.set(g.x+(g.hit?g.vx*age*.65:0),p.y+(g.hit?age*(.9+(g.by==='dragon'?.4:0))-age*age*.8:0),g.z+(g.hit?g.vz*age*.65:0));m.rotation.set(g.hit?age*8:0,g.hit?age*4:0,g.hit?age*5:0);
  });
  hintLine.visible=false;
  if(hintLine.visible){const p=state.goods[0],h=hintGeo.attributes.position;h.setXYZ(0,d.x,d.y+.08,d.z);h.setXYZ(1,p.x,route(p.s).y+.06,p.z);h.needsUpdate=true;hintLine.computeLineDistances();}
  const age=clock-hitAt;sparks.visible=!!latestHit&&age<.35;
  if(sparks.visible){const event=latestHit,yy=route(event.s).y;for(let i=0;i<24;i++){sparksData[i*3]=event.x+Math.sin(i*31)*age*.8;sparksData[i*3+1]=yy+.08+Math.abs(Math.cos(i*9))*age-age*age;sparksData[i*3+2]=event.z+Math.cos(i*23)*age*.8;}sparksGeo.attributes.position.needsUpdate=true;}

  previousCamera.copy(camera.position);
  const dir=route(Math.min(LENGTH,state.s+.55)),alpha=snap?1:1-Math.exp(-dt*6);fx+=(dir.fx-fx)*alpha;fz+=(dir.fz-fz)*alpha;const len=Math.hypot(fx,fz)||1,portrait=camera.aspect<1,nfx=fx/len,nfz=fz/len;
  const cx=p.x*.45+d.x*.55,cz=p.z*.45+d.z*.55,span=Math.abs((p.x-d.x)*-nfz+(p.z-d.z)*nfx);
  const ahead=route(Math.min(LENGTH,state.s+.8));look.set(cx+nfx*.5,(p.y+d.y+ahead.y)/3+.05,cz+nfz*.5);
  const now=route(state.s+.1),preview=route(Math.min(LENGTH,state.s+Math.max(.6,state.speed*.9+.3)));
  const bend=Math.acos(T.MathUtils.clamp(now.fx*preview.fx+now.fz*preview.fz,-1,1)),grade=Math.abs(preview.slope-now.slope)*.8;
  shotState=director.update({mode:cameraMode,bend,grade,span,dt,snap});
  const blend=shotState.blend;
  camera.fov=T.MathUtils.lerp(reduced?68:65+Math.min(1,state.speed/CRUISE_SPEED)*5,reduced?73:70+Math.min(1,state.speed/CRUISE_SPEED)*5,blend);camera.updateProjectionMatrix();
  // Compute the close chase, then blend toward a higher, wider look at the whole bend.
  const rear=Math.max(0,(cx-p.x)*nfx+(cz-p.z)*nfz,(cx-d.x)*nfx+(cz-d.z)*nfz);
  let back=rear+.82+Math.max(0,span-.25)*.6,up=portrait?.38:.31;
  target.set(cx-nfx*back,Math.max(p.y,d.y)+up,cz-nfz*back);
  for(let i=0;i<9;i++){
   camera.position.copy(target);camera.lookAt(look);camera.updateMatrixWorld();
   let fits=true;for(const actor of [p,d])for(const y of [.015,.12]){probe.set(actor.x,actor.y+y,actor.z).project(camera);if(Math.abs(probe.x)>.86||probe.y<-.59||probe.y>.56||probe.z>1)fits=false;}
   if(fits)break;back+=.14;up+=.02;target.set(cx-nfx*back,Math.max(p.y,d.y)+up,cz-nfz*back);
  }
  const farBack=(portrait?2.05:1.65)+span*.55;
  wideTarget.set(cx-nfx*farBack,Math.max(p.y,d.y)+(portrait?1.25:.95)+span*.2,cz-nfz*farBack);
  target.lerp(wideTarget,blend);
  look.set(cx+nfx*(.5+blend*.5),(p.y+d.y+ahead.y)/3+.05,cz+nfz*(.5+blend*.5));
  target.x=T.MathUtils.clamp(target.x,-8.1,8.1);target.z=T.MathUtils.clamp(target.z,-6.8,6.0);
  // Temporarily rise if a ramp or fixture blocks the line to either character.
  for(let i=0;i<10&&(blocked(p,target)||blocked(d,target));i++)target.y+=.15;
  camera.position.copy(previousCamera).lerp(target,snap?1:1-Math.exp(-dt*10));camera.lookAt(look);shake*=Math.exp(-dt*18);camera.position.x+=Math.sin(clock*90)*shake;
  if(!state.running&&!state.finished){const start=route(.9);camera.position.set(start.x+2.5,start.y+1.1,start.z+4.2);camera.lookAt(start.x,start.y-.7,start.z+.2);camera.fov=60;camera.updateProjectionMatrix();}
  camera.updateMatrixWorld();

 }
 resize();return {resize,pose,hit,dispose(){r.dispose();renderer.dispose();root.clear();scene.clear();},setCameraMode(mode){cameraMode=['auto','wide','close'].includes(mode)?mode:'auto';},get cameraState(){const p=route(state.s,state.offset),d={...route(state.dragonS),x:state.dragonX,z:state.dragonZ};return {mode:cameraMode,...shotState,position:camera.position.toArray(),fov:camera.fov,actors:[p,d].map(a=>[.015,.12].map(y=>new T.Vector3(a.x,a.y+y,a.z).project(camera).toArray()))};},reset(){director.reset();latestHit=null;hitAt=-10;shake=0;fx=0;fz=-1;},render:()=>renderer.render(scene,camera)};
}
