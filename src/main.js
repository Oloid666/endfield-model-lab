import {buildDragon} from './companion.js';
import {createLoading} from './loading.js';
import './style.css';
import { World } from './world.js';
import { loadActors } from './actors.js';
import { RainAudio } from './audio.js';
import { createMission } from './mission.js';
import { createExploration } from './exploration.js';

const $=s=>document.querySelector(s),loading=$('#loading'),message=$('#loading-message'),error=$('#error');
const loader=createLoading();
const audio=new RainAudio(),abort=new AbortController();let world,mission,exploration,closed=false,menuPaused=false,xaihiPromise=null,assetPaused=false;
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
listen($('#characters'),'change',e=>{if(world){world.charactersEnabled=e.target.checked;if(world.actors)world.actors.root.visible=e.target.checked;if(world.xaihi)world.xaihi.root.visible=e.target.checked&&world.missionState?.vcr;}});
listen($('#quality'),'change',e=>world?.setQuality(e.target.value));
listen($('#sound'),'change',async e=>{try{if(e.target.checked)await audio.enable();else await audio.disable();}catch{e.target.checked=false;message.textContent='雨聲無法開啟。';}});
listen(document,'visibilitychange',()=>{if(document.hidden)audio.disable();else if($('#sound').checked)audio.enable().catch(()=>{$('#sound').checked=false;});});
const buttons=[...document.querySelectorAll('[data-view]')];
listen($('.view-dock'),'click',e=>{
  const button=e.target.closest('[data-view]');if(!button)return;const view=button.dataset.view;
  if(['street','interior','detail'].includes(view)&&!button.dataset.subview){document.querySelector('.view-options')?.remove();const menu=document.createElement('div');menu.className='view-options';const items=view==='street'?[['street','正面街景'],['store','斜側街景'],['pear','梨花'],['investigate','機房']]:view==='interior'?[['interior','櫃檯'],['shelves','貨架'],['fridge','冰箱'],['oven','微波爐'],['posters','海報']]:[['story','雙人'],['detail','莊大頭'],['half','莊半身'],['left','左側'],['right','右側'],['dragon','龍泡泡']];for(const [id,label]of items){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{world.setView(id);world.manualUntil=Infinity;world.autoCamera=false;menu.remove();};menu.append(b);}document.querySelector('#app').append(menu);return;}world?.setView(view);if(world){world.manualUntil=Infinity;world.autoCamera=false;if(view==='reset')world.resetStoryCamera();}
  for(const b of buttons){const active=b.dataset.view===(view==='reset'?'street':view);b.classList.toggle('active',active);if(b.dataset.view!=='reset')b.setAttribute('aria-pressed',String(active));}
});
async function ensureXaihi(){
  if(world?.xaihi)return world.xaihi;
  if(xaihiPromise)return xaihiPromise;
  world.xaihiLoading=true;world.xaihiError=null;
  xaihiPromise=import('./xaihi.js').then(({loadXaihi})=>loadXaihi(world.scene,world.r,text=>{if(assetPaused)loader.stage(text);},abort.signal)).then(async actor=>{
    if(closed){actor.dispose();return null;}
    await world.prepareShaders(actor.root,'xaihi');if(closed){actor.dispose();return null;}
    world.xaihi=actor;world.xaihiLoading=false;
    if(assetPaused){assetPaused=false;loader.hide();mission?.setPaused(false);}
    return actor;
  }).catch(e=>{
    world.xaihiLoading=false;xaihiPromise=null;if(e.name==='AbortError')return null;
    world.xaihiError='賽希暫時沒有載入。請重新載入再試。';
    if(assetPaused)loader.fail(world.xaihiError,()=>{loader.show('重新讀取店內影像',{compact:true});ensureXaihi();});
    return null;
  });
  return xaihiPromise;
}
async function init(){
  try{
    loader.show('正在建立雨夜街角');
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    world=new World($('#scene'),{
      onZone:inside=>$('#app').classList.toggle('interior-view',inside),onFraming:close=>$('#app').classList.toggle('close-view',close),
      onManual:()=>{for(const b of buttons){b.classList.remove('active');if(b.dataset.view!=='reset')b.setAttribute('aria-pressed','false');}},
      onContextLost:()=>showError('畫面暫時中斷。可等待恢復，或重新載入。'),onContextRestored:()=>{error.hidden=true;world.start();}
    });
    world.earlyDragon=buildDragon(world.r);world.earlyDragon.root.scale.setScalar(.59);world.earlyDragon.root.position.set(-1.5,.32,2.5);world.scene.add(world.earlyDragon.root);
    world.setView('awning',true);world.tick(0,0,true);world.start();
    loader.show('街景就緒，正在請莊芳宜下班',{compact:true});
    while(!world.actors&&!closed){
      try{
        const actor=await loadActors(world.scene,world.r,text=>loader.stage(text),abort.signal,world.earlyDragon);
        if(closed){actor.dispose();return;}
        world.actors=actor;world.charactersEnabled=true;$('#characters').checked=true;$('#characters').disabled=false;
        world.earlyDragon=null;actor.teleport(-1.25,3.25);world.setView('interior',true);actor.root.visible=true;actor.setRain($('#rain').checked);actor.setObstacles(world.store.floorPlan);
      }catch(e){
        if(e.name==='AbortError'||closed)return;
        console.error('人物初始化失敗',e);
        world.scene.getObjectByName('dinner-actors')?.removeFromParent();
        await new Promise(resolve=>loader.fail(`人物暫時沒有到場：${e.message}`,resolve));
        loader.show('重新請莊芳宜下班',{compact:true});
      }
    }
    if(closed)return;
    loader.stage('正在準備人物光影');await world.prepareShaders(world.actors.root,'actors');
    if(closed)return;world.time=0;world.previous=undefined;world.tick(0,0,true);
    mission=createMission({mount:$('#app'),onCameraReset:()=>world.resetStoryCamera(),capturePhoto:()=>world.capturePhoto(),onCameraAuto:()=>world.resetStoryCamera(),getCameraAuto:()=>world.autoCamera,
      onDinner:branch=>{
        if(!branch){exploration?.setActive(false);world.director.reset();mission?.setTargets(world.director.targets);world.actors?.setMove(0,0,false);world.actors?.setObstacles(world.store.floorPlan);world.actors?.teleport(-1.25,3.25);}
        world.actors?.setDinner(branch);
      },
      onGesture:(name,node)=>world.actors?.setGesture(name,node),
      onStage:(phase,state)=>{
        if(!['ready','complete'].includes(phase))exploration?.setActive(false);
        world.director.stage(phase,state);
        if(phase==='photo-review')ensureXaihi();
        if(['rewind','flashback'].includes(phase)&&!world.xaihi){
          assetPaused=!state.paused;
          if(assetPaused){mission?.setPaused(true);loader.show('正在下載較早的店內影像',{compact:true});}
          ensureXaihi();
        }
        if(phase==='complete')world.actors?.setObstacles({obstacles:[],entrance:{minX:-4,maxX:4,z:1.8}});
        if(phase==='last'||phase==='aim-final')mission?.setTargets(world.director.targets);
      },
      onAction:event=>world.director.action?.(event),
      onAttack:event=>{const hadSign=world.store.destruction.state.progress>=44;world.director.attack(event);if(!hadSign&&event.progress>=44&&!event.finisher)mission?.holdAttack(4.4);mission?.setTargets(world.director.targets);},
      onState:state=>{world.missionState=state;$('#app').dataset.storyPhase=state.phase;}
    });
    mission.setTargets(world.director.targets);world.onClockState=value=>mission.setClockRunning(value);mission.setClockRunning(world.running&&!document.hidden);
    exploration=createExploration(world,{mount:$('#app'),signal:abort.signal,
      canWalk:()=>['ready','complete'].includes(mission.state.phase),onHotspot:kind=>mission.hotspot(kind),
      onSceneTap:ray=>{
        if(['ready','intro','complete','photo'].includes(mission.state.phase)&&world.interact(ray))return true;
        if(!['combat','aim-final'].includes(mission.state.phase))return false;
        const target=world.director.pick(ray.ray);if(target!==null)mission.selectTarget(target);return true;
      }
    });
    world.onTick=(time,delta)=>{mission.update(time);world.missionState=mission.state;if(mission.state.phase==='tour'&&mission.state.phaseElapsed>=14&&mission.state.phaseElapsed<30&&!mission.state.paused)audio.hum(mission.state.phaseElapsed);exploration.update(delta);};
    loader.hide();world.start();
    window.__rainy711={
      get switches(){return {signal:world.signalIndex||0,room:world.roomLightOn??true,door:world.store.doors.manual};},get time(){return world.time;},get renders(){return world.renderCount;},get drawCalls(){return world.renderer.info.render.calls;},get triangles(){return world.renderer.info.render.triangles;},get warmup(){return world.shaderWarmup.state;},resetCamera:()=>world.resetStoryCamera(),
      get aa(){return {msaa:world.msaaSamples,postSamples:world.composer.renderTarget1.samples,postDepth:world.composer.renderTarget1.depthBuffer,fxaa:world.fxaa.enabled,dpr:world.renderer.getPixelRatio()};},
      get metrics(){let lights=0;world.scene.traverse(n=>{if(n.isLight&&n.visible)lights++;});return {batches:world.batchStats,lights,weather:world.weather.metrics,camera:world.walkCamera.state};},
      get walkCamera(){return world.walkCamera.state;},get glassReady(){const u=world.store.glass.uniforms;return !!(u.uDepth.value?.isDepthTexture&&u.uScene.value?.isTexture&&u.uEnvironment.value?.isCubeTexture);},
      get poseData(){return world.actors?.poseData;},get idle(){return world.actors?.status;},get floorPlan(){return world.store.floorPlan;},get doors(){return {open:world.store.doors.open};},
      get mission(){return mission.state;},get story(){return mission.state;},get destruction(){return {...world.store.destruction.state,targets:world.store.destruction.targets};},get garden(){return world.garden.state;},get effects(){return world.siege.state;},
      get cinematic(){return world.director.status;},get tianshi(){return world.tianshi.state;},get microwave(){return world.microwave.state;},get connectionStage(){return world.connectionStage.state;},get xaihi(){return world.xaihi?.state||{loaded:false,loading:world.xaihiLoading,error:world.xaihiError};},
      get position(){return world.actors?.position.toArray();},get heroPosition(){return world.actors?.heroPosition;},get dragonPosition(){return world.actors?.dragonPosition;},get walking(){return exploration.active;},get minimumZoom(){return world.controls.minDistance;},projectPoint:point=>world.projectPoint(point),
      fly:(x,z)=>mission.machine.fly(x,z),finishFlight:()=>mission.machine.finishFlight(),sendPhoto:()=>mission.sendPhoto(),takePhoto:()=>mission.takePhoto(),investigate:id=>mission.investigate(id),acceptCall:()=>mission.acceptCall(),hackRotate:index=>mission.hackRotate(index),keyChunk:value=>mission.keyChunk(value),get photo(){return mission.photo;},get investigationProps(){return world.investigationProps.state;},toggleAutoCamera:()=>world.toggleAutoCamera(),
      missionStart:()=>mission.start(),missionNext:()=>mission.next(),missionChoose:id=>mission.choose(id),missionReplay:()=>mission.replay(),missionAttack:t=>mission.attack(t),missionSelectTarget:id=>mission.selectTarget(id),missionOutput:id=>mission.setOutput(id),missionPause:value=>mission.setPaused(value),
      missionKey:value=>mission.key(value),missionSubmit:()=>mission.submitLogin(),missionVerify:()=>mission.verify(),missionLever:value=>mission.setLever(value),missionHeatStart:time=>mission.heatStart(time??world.time),missionHeatStop:time=>mission.heatStop(time??world.time),missionHeatRetry:()=>mission.heatRetry(),missionHeatCancel:()=>mission.heatCancel(),
      storyNext:()=>mission.next(),storyChoose:id=>mission.choose(id),storyStart:()=>mission.start(),storyReplay:()=>mission.replay(),hotspot:kind=>mission.hotspot(kind),
      teleport(x,z){world.actors?.teleport(x,z);},move(x,z,delta){world.actors?.setMove(x,z,true);world.actors?.update(world.time,delta);},tick(t,delta=.016,render=true){world.tick(t,delta,render);},
      inspectLayout(){world.inspectLayout();},pauseForCapture(){world.stop();},resume(){world.start();},frameView:name=>world.setView(name,true),samplePose:t=>world.tick(t),
      get actorsLoaded(){return !!world.actors;},get bonesSupported(){return !!world.actors?.supported;},get camera(){return world.camera.position.toArray();},get quality(){return world.quality;},get actorsVisible(){return !!world.actors?.root.visible;},get rendererCount(){return document.querySelectorAll('canvas').length;}
    };
  }catch(e){world?.dispose();showError('無法啟動 3D 畫面。請使用支援 WebGL 2 的 Safari，然後重新載入。');console.error(e);}
}
function dispose(){closed=true;loader.dispose();abort.abort();exploration?.dispose();mission?.dispose();audio.dispose();world?.dispose();}
listen(window,'pagehide',event=>{if(!event.persisted)dispose();else world?.stop();});listen(window,'pageshow',event=>{if(event.persisted)world?.start();});
if(import.meta.hot)import.meta.hot.dispose(dispose);
init();
