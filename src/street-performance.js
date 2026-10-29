import * as T from 'three';
import {songCamera} from './concert-stage.js';
import {STREET_SONGS,songFrame} from './street-songs.js';
export function createStreetPerformance({world,mission,mount,playEffect=()=>{},hum=()=>{}}){
 const r=world.r,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const dock=document.createElement('section');dock.className='street-performance';dock.hidden=true;dock.setAttribute('aria-label','龍泡泡的街角演出');
 const text=document.createElement('p'),skip=document.createElement('button');skip.textContent='略過演出';skip.type='button';dock.append(text,skip);mount.append(dock);
 const cover=document.createElement('div');cover.className='street-stage-cover';cover.hidden=true;mount.append(cover);
 const stars=new T.Group();world.scene.add(stars);stars.visible=false;
 const mat=r.own(new T.MeshBasicMaterial({color:0xffe4a0,transparent:true,depthWrite:false,toneMapped:false}));
 const shape=new T.Shape();for(let i=0;i<8;i++){const a=i*Math.PI/4,len=i%2?.025:.12;const x=Math.cos(a)*len,y=Math.sin(a)*len;if(i)shape.lineTo(x,y);else shape.moveTo(x,y);}shape.closePath();
 const geo=r.own(new T.ShapeGeometry(shape));for(let i=0;i<9;i++){const n=r.mesh(geo,mat,stars);n.userData.index=i;}
 let active=false,age=0,last=0,first=false,kind='restore',indices={collapse:0,restore:0},lines=[],onDone=null,from=null,savedCamera=null,mode='intact',snapshotReady=false,snapped=false;
 const paused=()=>document.hidden||mission.pauseReasons.some(p=>p!=='street-show');
 function setBuilding(p){const d=world.store.destruction;d.updateRewind(kind==='restore'?p:1-p);if(p===1){if(kind==='restore')d.showFlashback();else{d.restorePresent();d.beginRewind();d.updateRewind(0);}mode=kind==='restore'?'intact':'collapsed';}world.weather.invalidateReflection();}
 function finish(){if(!active)return;world.concert.reset();setBuilding(1);active=false;cover.hidden=true;mount.classList.remove('street-show-active');dock.hidden=true;stars.visible=false;mission.setPaused(false,'street-show');world.actors.setSceneAction({homecoming:true});world.actors.setCompanionAction({kind:'normal',amount:0});world.controls.enabled=true;world.autoCamera=savedCamera.auto;world.manualUntil=world.time;world.camera.position.copy(savedCamera.position);world.controls.target.copy(savedCamera.target);world.camera.fov=savedCamera.fov;world.camera.updateProjectionMatrix();world.actors.setObstacles(mode==='intact'?world.store.floorPlan:{obstacles:[],entrance:world.store.floorPlan.entrance});const done=onDone;onDone=null;done?.();}
 skip.addEventListener('click',()=>{if(!first&&age>=1&&!paused())finish();});
 const api={get active(){return active;},get state(){return {active,age,first,kind,mode,line:text.textContent,indices:{...indices},snapshotReady};},
 start({initial=false,done=()=>{}}={}){
  if(active)return false;first=initial;kind=initial||mode==='collapsed'?'restore':'collapse';lines=STREET_SONGS[kind][initial?1:indices[kind]++%4];onDone=done;
  if(!snapshotReady){world.store.destruction.beginRewind();snapshotReady=true;}
  mount.classList.add('street-show-active');if(!initial&&(world.actors.heelCenter[2]<2.7||world.remnant.state.visible&&world.remnant.state.position[2]<2.7)){cover.hidden=false;cover.style.opacity='1';if(world.actors.heelCenter[2]<2.7)world.actors.teleport(-1.25,3.25);world.remnant.placeNear(world.actors.heelCenter);}age=0;last=world.time;snapped=false;active=true;from=[...world.actors.dragonPosition];savedCamera={position:world.camera.position.clone(),target:world.controls.target.clone(),fov:world.camera.fov,auto:world.autoCamera};
  world.director.stuckReleased=true;world.director.finalBegun=false;world.setWalking(false);world.setCutaway(false);world.transition=null;world.controls.enabled=false;world.siege.reset();mission.setPaused(true,'street-show');dock.hidden=false;skip.hidden=first;world.actors.setSoot(false);return true;
 },
 tick(time,render=true){const dt=Math.max(0,Math.min(.1,time-last));last=time;if(!paused())age+=dt;
  if(!cover.hidden){cover.style.opacity=String(Math.max(0,1-age/.4));if(age>=.4)cover.hidden=true;}
  const actor=world.actors,p=Math.min(1,age/1.6),q=p*p*(3-2*p),dest=[-2.25,4.3,6.2],pos=from.map((v,i)=>v+(dest[i]-v)*q);actor.setCinematic(null);actor.setDragonProjectile(pos,0);const facing=songCamera(pos,Math.max(0,age-2.8),{portrait:world.camera.aspect<.85,reduced});const eye=age>=10&&age<=13?[0,7,23]:facing.position;actor.setDragonHeading(age>=2.8?Math.atan2(eye[0]-pos[0],eye[2]-pos[2]):.15);actor.setMove(0,0,false);actor.setSceneAction({homecoming:true,singing:age>=2.8,mealVisible:true});actor.setCompanionAction({kind:age<2.8?'snap':'normal',amount:Math.max(0,Math.min(1,(age-1.6)/.8))});actor.update(age,paused()?0:dt);
  world.portrait.fill.position.set(pos[0]+2,pos[1]+3,pos[2]+5);world.portrait.fill.target.position.set(pos[0],pos[1]+.35,pos[2]);
  if(age>=2.05&&!snapped){snapped=true;playEffect('snap');}
  stars.visible=age>=2.05&&age<3.3;stars.position.set(pos[0]+.35,pos[1]+.5,pos[2]+.2);mat.opacity=Math.max(0,1-(age-2.05)/1.25);for(const n of stars.children){const i=n.userData.index,a=i*2.4,t=Math.max(0,age-2.05);n.position.set(Math.cos(a)*t*(reduced?.1:.5),Math.sin(a)*t*(reduced?.1:.5),0);n.quaternion.copy(world.camera.quaternion);n.scale.setScalar(i? .4:1.4);}
  const frame=songFrame(lines,age);const caption=age<2.05?'龍泡泡：看我的。':age<2.8?'✦ 啪！':frame.line;if(text.textContent!==caption)text.textContent=caption;skip.disabled=age<1||paused();
  setBuilding(Math.max(0,Math.min(1,(age-2.8)/Math.max(5,frame.done?frame.end-2.8:totalDuration()-2.8))));
  const close=age>=1.1&&age<2.8;world.camera.position.set(close?pos[0]+.5:0,close?pos[1]+.5:7,close?pos[2]+(world.camera.aspect<.85?2.6:2):23);world.controls.target.set(close?pos[0]:-.4,close?pos[1]+.35:3,close?pos[2]:1.8);world.camera.fov=close?40:world.camera.aspect<.85?56:43;world.camera.updateProjectionMatrix();world.camera.lookAt(world.controls.target);
  if(age>=2.8){const shot=songCamera(pos,age-2.8,{portrait:world.camera.aspect<.85,reduced});if(age<10||age>13){world.camera.position.fromArray(shot.position);world.controls.target.fromArray(shot.target);world.camera.fov=shot.fov;world.camera.updateProjectionMatrix();world.camera.lookAt(world.controls.target);}}
  world.concert.update(pos,age,age>=2.8,world.camera,world.quality,reduced);
  if(age>=2.8&&!paused())hum(age);if(render){world.renderer.info.reset();world.composer.render();world.renderCount++;}if(frame.done&&!paused())finish();
 },prepareIntact(){
  const d=world.store.destruction;d.reset();d.setProgress(99);d.update(world.time+12,12);d.beginRewind();d.showFlashback();snapshotReady=true;mode='intact';world.weather.invalidateReflection();
 },reset(){world.concert.reset();cover.hidden=true;world.controls.enabled=true;if(active){active=false;mission.setPaused(false,'street-show');}mount.classList.remove('street-show-active');dock.hidden=true;stars.visible=false;indices={collapse:0,restore:0};mode='intact';snapshotReady=false;onDone=null;},dispose(){cover.remove();dock.remove();stars.removeFromParent();}};
 function totalDuration(){return 2.8+lines.reduce((sum,s)=>sum+Math.max(3,Array.from(s).length/5.5+1),0);}
 world.streetShow=api;return api;
}
