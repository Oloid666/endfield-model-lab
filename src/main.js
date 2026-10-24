import './style.css';
import { World } from './world.js';
import { loadActors } from './actors.js';
import { RainAudio } from './audio.js';
import { createMission } from './mission.js';
import { createExploration } from './exploration.js';

const $=s=>document.querySelector(s),loading=$('#loading'),message=$('#loading-message'),error=$('#error');
const audio=new RainAudio(),abort=new AbortController();let world,mission,exploration,closed=false,menuPaused=false;
const listen=(element,type,fn)=>element.addEventListener(type,fn,{signal:abort.signal});
function showError(text){$('#error-message').textContent=text;error.hidden=false;loading.hidden=true;}
function menu(open){
  $('#settings').hidden=!open;$('#menu-toggle').setAttribute('aria-expanded',String(open));$('#menu-toggle').setAttribute('aria-label',open?'關閉設定':'開啟設定');
  if(open)exploration?.setActive(false);
  if(open&&mission&&!mission.state.paused){menuPaused=true;mission.setPaused(true);}
  else if(!open&&menuPaused){menuPaused=false;mission?.setPaused(false);}
}
listen($('#menu-toggle'),'click',()=>menu($('#settings').hidden));listen($('#menu-close'),'click',()=>menu(false));
listen(document,'keydown',e=>{if(e.key==='Escape')menu(false);});listen($('#retry'),'click',()=>location.reload());
listen($('#rain'),'change',e=>{if(world){world.weather.root.visible=e.target.checked;world.actors?.setRain(e.target.checked);world.store.glass.uniforms.uRain.value=e.target.checked?1:0;world.wet.setRain(e.target.checked);}});
listen($('#characters'),'change',e=>{if(world?.actors)world.actors.root.visible=e.target.checked;});
listen($('#quality'),'change',e=>world?.setQuality(e.target.value));
listen($('#sound'),'change',async e=>{try{if(e.target.checked)await audio.enable();else await audio.disable();}catch{e.target.checked=false;message.textContent='雨聲無法開啟。';}});
listen(document,'visibilitychange',()=>{if(document.hidden)audio.disable();else if($('#sound').checked)audio.enable().catch(()=>{$('#sound').checked=false;});});
const buttons=[...document.querySelectorAll('[data-view]')];
listen($('.view-dock'),'click',e=>{
  const button=e.target.closest('[data-view]');if(!button)return;const view=button.dataset.view;
  world?.setView(view);if(world)world.manualUntil=world.time+14;
  for(const b of buttons){const active=b.dataset.view===(view==='reset'?'street':view);b.classList.toggle('active',active);if(b.dataset.view!=='reset')b.setAttribute('aria-pressed',String(active));}
});
async function init(){
  try{
    world=new World($('#scene'),{
      onZone:inside=>$('#app').classList.toggle('interior-view',inside),onFraming:close=>$('#app').classList.toggle('close-view',close),
      onManual:()=>{for(const b of buttons){b.classList.remove('active');if(b.dataset.view!=='reset')b.setAttribute('aria-pressed','false');}},
      onContextLost:()=>showError('畫面暫時中斷。可等待恢復，或重新載入。'),onContextRestored:()=>{error.hidden=true;world.start();}
    });world.start();
    try{
      world.actors=await loadActors(world.scene,world.r,text=>message.textContent=text,abort.signal);
      if(closed){world.dispose();return;}
      world.actors.root.visible=$('#characters').checked;world.actors.setRain($('#rain').checked);world.actors.setObstacles(world.store.floorPlan);world.time=0;world.previous=undefined;
    }catch(e){
      if(e.name==='AbortError')return;$('#characters').checked=false;$('#characters').disabled=true;$('#characters').parentElement.title=e.message;
      console.warn(e);const note=document.createElement('p');note.className='control-tip';note.textContent='人物暫時沒有載入。請重新整理後再試。';$('#settings').append(note);
    }
    mission=createMission({mount:$('#app'),
      onDinner:branch=>{
        if(!branch){exploration?.setActive(false);world.director.reset();mission?.setTargets(world.director.targets);world.actors?.setMove(0,0,false);world.actors?.setObstacles(world.store.floorPlan);world.actors?.teleport(-1.25,2.48);}
        world.actors?.setDinner(branch);
      },
      onGesture:(name,node)=>world.actors?.setGesture(name,node),
      onStage:(phase,state)=>{
        if(!['ready','complete'].includes(phase))exploration?.setActive(false);
        world.director.stage(phase,state);
        if(phase==='complete')world.actors?.setObstacles({obstacles:[],entrance:{minX:-4,maxX:4,z:1.8}});
        if(phase==='last'||phase==='aim-final')mission?.setTargets(world.director.targets);
      },
      onAttack:event=>{world.director.attack(event);mission?.setTargets(world.director.targets);},
      onState:state=>{world.missionState=state;$('#app').dataset.storyPhase=state.phase;}
    });
    mission.setTargets(world.director.targets);world.onClockState=value=>mission.setClockRunning(value);mission.setClockRunning(world.running&&!document.hidden);
    exploration=createExploration(world,{mount:$('#app'),signal:abort.signal,
      canWalk:()=>['ready','complete'].includes(mission.state.phase),onHotspot:kind=>mission.hotspot(kind),
      onSceneTap:ray=>{
        if(!['combat','aim-final'].includes(mission.state.phase))return false;
        const target=world.director.pick(ray);if(target!==null)mission.selectTarget(target);return true;
      }
    });
    world.onTick=(time,delta)=>{mission.update(time);world.missionState=mission.state;exploration.update(delta);};
    loading.classList.add('done');
    window.__rainy711={
      get time(){return world.time;},get renders(){return world.renderCount;},get drawCalls(){return world.renderer.info.render.calls;},get triangles(){return world.renderer.info.render.triangles;},
      get aa(){return {msaa:world.msaaSamples,postSamples:world.composer.renderTarget1.samples,postDepth:world.composer.renderTarget1.depthBuffer,fxaa:world.fxaa.enabled,dpr:world.renderer.getPixelRatio()};},
      get metrics(){let lights=0;world.scene.traverse(n=>{if(n.isLight&&n.visible)lights++;});return {batches:world.batchStats,lights,weather:world.weather.metrics,camera:world.walkCamera.state};},
      get walkCamera(){return world.walkCamera.state;},get glassReady(){const u=world.store.glass.uniforms;return !!(u.uDepth.value?.isDepthTexture&&u.uScene.value?.isTexture&&u.uEnvironment.value?.isCubeTexture);},
      get poseData(){return world.actors?.poseData;},get idle(){return world.actors?.status;},get floorPlan(){return world.store.floorPlan;},get doors(){return {open:world.store.doors.open};},
      get mission(){return mission.state;},get story(){return mission.state;},get destruction(){return {...world.store.destruction.state,targets:world.store.destruction.targets};},get garden(){return world.garden.state;},get effects(){return world.siege.state;},
      get position(){return world.actors?.position.toArray();},get heroPosition(){return world.actors?.heroPosition;},get dragonPosition(){return world.actors?.dragonPosition;},get walking(){return exploration.active;},get minimumZoom(){return world.controls.minDistance;},projectPoint:point=>world.projectPoint(point),
      missionStart:()=>mission.start(),missionNext:()=>mission.next(),missionChoose:id=>mission.choose(id),missionReplay:()=>mission.replay(),missionAttack:t=>mission.attack(t),missionSelectTarget:id=>mission.selectTarget(id),missionPause:value=>mission.setPaused(value),
      storyNext:()=>mission.next(),storyChoose:id=>mission.choose(id),storyStart:()=>mission.start(),storyReplay:()=>mission.replay(),hotspot:kind=>mission.hotspot(kind),
      teleport(x,z){world.actors?.teleport(x,z);},move(x,z,delta){world.actors?.setMove(x,z,true);world.actors?.update(world.time,delta);},tick(t,delta=.016,render=true){world.tick(t,delta,render);},
      inspectLayout(){world.inspectLayout();},pauseForCapture(){world.stop();},resume(){world.start();},frameView:name=>world.setView(name,true),samplePose:t=>world.tick(t),
      get actorsLoaded(){return !!world.actors;},get bonesSupported(){return !!world.actors?.supported;},get camera(){return world.camera.position.toArray();},get quality(){return world.quality;},get actorsVisible(){return !!world.actors?.root.visible;},get rendererCount(){return document.querySelectorAll('canvas').length;}
    };
  }catch(e){world?.dispose();showError('無法啟動 3D 畫面。請使用支援 WebGL 2 的 Safari，然後重新載入。');console.error(e);}
}
function dispose(){closed=true;abort.abort();exploration?.dispose();mission?.dispose();audio.dispose();world?.dispose();}
listen(window,'pagehide',event=>{if(!event.persisted)dispose();else world?.stop();});listen(window,'pageshow',event=>{if(event.persisted)world?.start();});
if(import.meta.hot)import.meta.hot.dispose(dispose);
init();
