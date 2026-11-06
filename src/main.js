import {createSettingsLayout} from './ui-settings.js';
import {createFeedbackService,createFeedbackDialog} from './feedback.js';
import {createGA4,createRainAnalytics} from './analytics.js';
import {readPreferences,savePreferences} from './preferences.js';
import {createStreetPerformance} from './street-performance.js';
import {createViewControls} from './view-controls.js';
import {createDebugTravel} from './debug-travel.js';
import './debug-travel.css';
import {ChapterProgress} from './chapter-progress.js';
import {CHAPTERS} from './mission-state.js';
import {buildDragon} from './companion.js';
import {createLoading} from './loading.js';
import './style.css';
import { World } from './world.js';
import { loadActors } from './actors.js';
import { RainAudio } from './audio.js';
import { createMission } from './mission.js';
import { createExploration } from './exploration.js';
import { createBonus } from './bonus.js';
import './presentation.css';
import './responsive.css';
import './ui-refinement.css';
document.querySelector('#app').classList.add('ui-refined');

const $=s=>document.querySelector(s),loading=$('#loading'),message=$('#loading-message'),error=$('#error');
let preferenceStorage;try{preferenceStorage=localStorage;}catch{}
const preferences=readPreferences(preferenceStorage),saveSettings=()=>savePreferences(preferenceStorage,preferences);
$('#rain').checked=preferences.rain;$('#quality').value=preferences.quality;$('#app').style.setProperty('--dialogue-size',preferences.textSize+'px');
const ga4=createGA4({measurementId:import.meta.env.VITE_GA4_MEASUREMENT_ID,production:import.meta.env.PROD,version:__BUILD_VERSION__});
const analytics=createRainAnalytics(ga4.send);ga4.pageView();
const loader=createLoading();
const audio=new RainAudio(),abort=new AbortController();let world,mission,exploration,bonus,closed=false,menuPaused=false,xaihiPromise=null,assetPaused=false;
const feedback=createFeedbackService({version:__BUILD_VERSION__,context:()=>({phase:mission?.state.phase||'ready',play_mode:analytics.state.run?analytics.state.playMode:'unknown'}),onSent:()=>analytics.bonus('feedback')});
let feedbackDialog,fxPreparing=null,debugTravel,settingsLayout;
const fxNotice=document.createElement('p');fxNotice.className='fx-preparing';fxNotice.setAttribute('role','status');fxNotice.textContent='正在準備爆炸效果，等一下就開砲…';fxNotice.hidden=true;$('#app').append(fxNotice);
async function prepareBattle(){
 if(fxPreparing||world.shaderWarmup.state.completed.includes('battle-effects')&&world.battleDrawWarm)return;
 mission?.setPaused(true,'effects');fxNotice.hidden=false;
 fxPreparing=(async()=>{try{
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  if(!closed){await world.prepareShaders(world.siege.root,'battle-effects');await world.prepareShaders(world.store.destruction.root,'battle-rubble');await world.prepareShaders(world.store.destruction.signFlight.cablesRoot,'sign-cables');world.prepareBattleFrame();}
 }catch(e){if(!closed){world.setQuality('low',true);console.warn('爆炸效果改用輕量模式',e.message);}}
 finally{fxNotice.hidden=true;fxPreparing=null;if(!closed)mission?.setPaused(false,'effects');}})();
}
const listen=(element,type,fn)=>element.addEventListener(type,fn,{signal:abort.signal});
function showError(text){$('#error-message').textContent=text;error.hidden=false;loading.hidden=true;}
function menu(open){
  $('#settings').hidden=!open;$('#menu-toggle').setAttribute('aria-expanded',String(open));$('#menu-toggle').setAttribute('aria-label',open?'關閉設定':'開啟設定');
  if(open){exploration?.setActive(false);for(const b of document.querySelectorAll('[data-chapter]'))b.disabled=!debugTravel?.state.unlocked&&!chapters.data.unlocked.includes(b.dataset.chapter);}
  if(mission)mission.setPaused(open,'menu');
  settingsLayout?.setOpen(open);
}
listen($('#menu-toggle'),'click',()=>menu($('#settings').hidden));listen($('#menu-close'),'click',()=>menu(false));
listen(document,'keydown',e=>{if(e.key==='Escape')menu(false);});listen($('#retry'),'click',()=>location.reload());
listen($('#rain'),'change',e=>{preferences.rain=e.target.checked;saveSettings();if(world){world.weather.root.visible=e.target.checked;world.actors?.setRain(e.target.checked);world.store.glass.uniforms.uRain.value=e.target.checked?1:0;world.wet.setRain(e.target.checked);}});
listen($('#characters'),'change',e=>{if(world){world.charactersEnabled=e.target.checked;if(world.actors)world.actors.root.visible=e.target.checked;if(world.xaihi)world.xaihi.root.visible=e.target.checked&&world.missionState?.vcr;}});
listen($('#quality'),'change',e=>{preferences.quality=e.target.value;saveSettings();world?.setQuality(e.target.value);});
listen($('#sound'),'change',async e=>{try{if(e.target.checked)await audio.enable();else await audio.disable();}catch{e.target.checked=false;message.textContent='雨聲無法開啟。';}});
listen(document,'visibilitychange',()=>{if(document.hidden)audio.disable();else if($('#sound').checked)audio.enable().catch(()=>{$('#sound').checked=false;});});
const reactionBubble=document.createElement('p');reactionBubble.className='dragon-reaction-bubble';reactionBubble.hidden=true;$('#app').append(reactionBubble);let reactionBubbleUntil=0;
function placeExplosionCaption(){
 if(!world?.actors)return;
 const view=world.container.getBoundingClientRect(),head=world.actors.headPosition,feet=world.actors.heroPosition;
 const points=[];for(const p of [head,feet])for(const dx of [-.5,.5])for(const dz of [-.35,.35]){const q=world.projectPoint([p[0]+dx,p[1],p[2]+dz]);if(q[2]<1)points.push({x:view.x+(q[0]+1)*view.width/2,y:view.y+(1-q[1])*view.height/2});}
 if(!points.length)return;
 const subject={left:Math.min(...points.map(p=>p.x))-12,right:Math.max(...points.map(p=>p.x))+12,top:Math.min(...points.map(p=>p.y))-18,bottom:Math.max(...points.map(p=>p.y))+12};
 const obstacles=[subject,...[...document.querySelectorAll('.masthead,.mission-status,.mission-panel,.mission-combat')].filter(n=>n.getClientRects().length).map(n=>n.getBoundingClientRect())];
 const width=reactionBubble.offsetWidth,height=reactionBubble.offsetHeight,top=Math.max(view.top+12,document.querySelector('.masthead').getBoundingClientRect().bottom+8),bottom=view.bottom-height-12;
 const xs=[view.left+12,view.right-width-12,(view.left+view.right-width)/2],ys=[top,subject.top-height-14,subject.bottom+14,bottom];let best=null;
 for(const x of xs)for(const raw of ys){const y=Math.max(top,Math.min(bottom,raw));let score=0;for(const [i,o]of obstacles.entries())score+=Math.max(0,Math.min(x+width,o.right)-Math.max(x,o.left))*Math.max(0,Math.min(y+height,o.bottom)-Math.max(y,o.top))*(i===0?10:1);if(!best||score<best.score)best={x,y,score};}
 reactionBubble.style.left=`${best.x+width/2}px`;reactionBubble.style.top=`${best.y+height}px`;
}
const buttons=[...document.querySelectorAll('[data-view]')];
const viewControls=createViewControls(()=>world,()=>mission,abort.signal,()=>exploration?.setActive(false));
let chapterStorage;try{chapterStorage=localStorage;}catch{}
for(const key of ['rainy711.epilogue.v3','rainy711.chapters.v1','rainy711.bonus.v1'])try{localStorage.removeItem(key);}catch{}
const chapters=new ChapterProgress();let restoring=false;
async function ensureXaihi(){
  if(world?.xaihi)return world.xaihi;
  if(xaihiPromise)return xaihiPromise;
  world.xaihiLoading=true;world.xaihiError=null;
  xaihiPromise=import('./xaihi.js').then(({loadXaihi})=>loadXaihi(world.scene,world.r,text=>{if(assetPaused)loader.stage(text);},abort.signal,data=>{if(assetPaused)loader.download(data);})).then(async actor=>{
    if(closed){actor.dispose();return null;}
    if(assetPaused)loader.progress(90);await world.prepareShaders(actor.root,'xaihi');await world.prepareShaders(world.director.vcrEffects.root,'vcr-effects');if(closed){actor.dispose();return null;}
    world.xaihi=actor;world.xaihiLoading=false;
    if(assetPaused){assetPaused=false;loader.hide();mission?.setPaused(false,'asset');}
    return actor;
  }).catch(e=>{
    world.xaihiLoading=false;xaihiPromise=null;if(e.name==='AbortError')return null;
    world.xaihiError='塞西暫時沒有載入。請重新載入再試。';
    if(assetPaused)loader.fail(world.xaihiError,()=>{loader.show('重新讀取店內影像',{compact:true});ensureXaihi();});
    return null;
  });
  return xaihiPromise;
}
async function init(){
  try{
    loader.show('WebGL 2 渲染器初始化');
    const renderer=loader.boot($('#scene'));
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    world=new World($('#scene'),{renderer,
      onZone:inside=>$('#app').classList.toggle('interior-view',inside),onFraming:close=>$('#app').classList.toggle('close-view',close),
      onManual:()=>{for(const b of buttons){b.classList.remove('active');if(b.dataset.view!=='reset')b.setAttribute('aria-pressed','false');}},
      onContextLost:()=>{mission?.setPaused(true,'context');showError('畫面暫時中斷。可等待恢復，或重新載入。');},onContextRestored:()=>{error.hidden=true;mission?.setPaused(false,'context');world.start();}
    });
    world.showExplosionShout=()=>{if($('#sound').checked)audio.effect('explosion');world.actors?.setGesture('point',{speaker:'zhuang'});reactionBubble.dataset.speaker='zhuang';reactionBubble.textContent='莊方宜：Explosion！';reactionBubble.hidden=false;reactionBubbleUntil=world.time+.72;placeExplosionCaption();};
    world.setQuality(preferences.quality);world.weather.root.visible=preferences.rain;world.wet.setRain(preferences.rain);world.store.glass.uniforms.uRain.value=preferences.rain?1:0;
    loader.bind(world);world.earlyDragon=buildDragon(world.r);world.earlyDragon.root.scale.setScalar(.59);world.earlyDragon.root.position.set(-1.5,.32,2.5);world.scene.add(world.earlyDragon.root);
    world.setView('awning',true);world.tick(0,0,true);world.start();
    loader.show('街景就緒，正在請莊方宜下班');
    while(!world.actors&&!closed){
      try{
        const actor=await loadActors(world.scene,world.r,text=>loader.stage(text),abort.signal,world.earlyDragon,data=>loader.download(data));loader.progress(80);
        if(closed){actor.dispose();return;}
        world.actors=actor;world.charactersEnabled=true;$('#characters').checked=true;$('#characters').disabled=false;
        world.earlyDragon=null;actor.teleport(-1.25,3.25);world.setView('front',true);actor.root.visible=true;actor.setRain($('#rain').checked);actor.setObstacles(world.store.floorPlan);
      }catch(e){
        if(e.name==='AbortError'||closed)return;
        console.error('人物初始化失敗',e);
        world.scene.getObjectByName('dinner-actors')?.removeFromParent();
        await new Promise(resolve=>loader.fail(`人物暫時沒有到場：${e.message}`,resolve));
        loader.show('重新請莊方宜下班');
      }
    }
    if(closed)return;
    loader.progress(90);loader.stage('正在準備人物光影');await world.prepareShaders(world.actors.root,'actors');loader.rendererInfo(world.shaderWarmup.state,world.renderer.getPixelRatio());
    if(closed)return;world.time=0;world.previous=undefined;world.tick(0,0,true);
    mission=createMission({tabletMode:true,mount:$('#app'),onCameraReset:()=>{world.actors?.cancelReaction();reactionBubble.hidden=true;world.resetStoryCamera();},capturePhoto:()=>{if($('#sound').checked)audio.effect('shutter');return world.capturePhoto();},onCameraAuto:()=>world.resetStoryCamera(),getCameraAuto:()=>world.autoCamera,
      onDinner:branch=>{
        if(!branch){if(!restoring)debugTravel?.reset();analytics.start(debugTravel?.jumping||debugTravel?.state.unlocked?'shortcut':restoring?'chapter_replay':'normal');}
        if(!branch){world.streetShow?.reset();world.store.doors.reset();bonus?.resetEnding();exploration?.setActive(false);world.director.reset();world.remnant.reset();mission?.setTargets(world.director.targets);world.actors?.setMove(0,0,false);world.syncWalkingEnvironment(true,{postgame:false});world.actors?.teleport(-1.25,3.25);}
        world.actors?.setDinner(branch);
      },
      onRestore:(id,state)=>{if(['rewind','last'].includes(id)){world.store.destruction.setProgress(99);world.store.destruction.update(state.clock+8,8);}world.director.finalBegun=false;},
      onGesture:(name,node)=>{world.actors?.setGesture(name,node);const cue={'book-open':'book','dragon-capture':'tractor','meal-born':'slime','meal-arrival':'slime'}[node?.event];if(cue&&$('#sound').checked)audio.effect(cue);},
      onStage:(phase,state)=>{
        analytics.stage(phase);
        if(!['ready','complete'].includes(phase))exploration?.setActive(false);
        world.director.stage(phase,state);if($('#sound').checked){const cue={'photo-return':'flight','photo-flight':'handover'}[phase];if(cue)audio.effect(cue);}if(!restoring&&!debugTravel?.state.unlocked)chapters.reach(phase,state.branch);
        if(phase==='fire-ready'||phase==='aim-final')prepareBattle();
        if(phase==='charge'&&!fxPreparing)prepareBattle();
        if(phase==='photo-review')ensureXaihi();
        if(['rewind','flashback'].includes(phase)&&!world.xaihi){
          assetPaused=!state.paused;
          if(assetPaused){mission?.setPaused(true,'asset');loader.show('正在下載較早的店內影像',{compact:true});}
          ensureXaihi();
        }
        if(phase==='complete'&&!state.postgame)world.actors?.setObstacles({obstacles:[],entrance:{minX:-4,maxX:4,z:1.8}});
        if(phase==='last'||phase==='aim-final')mission?.setTargets(world.director.targets);
      },
      onAction:event=>{if(event.type==='tablet-step'){analytics.tablet(event.value);if(event.value==='cable'&&$('#sound').checked)audio.effect('grid-connect');}world.director.action?.(event);if($('#sound').checked&&['photo-send','heat-start','key','grid-connect'].includes(event.type))audio.effect(event.type);},
      onAttack:event=>{if($('#sound').checked)audio.effect(event.finisher?'stamp':'shot');world.resetStoryCamera();const hadSign=world.store.destruction.state.progress>=44;world.director.attack(event);if(!hadSign&&event.progress>=44&&!event.finisher)mission?.holdAttack(4.4);mission?.setTargets(world.director.targets);},
      onState:state=>{world.missionState=state;const resume=document.querySelector('.chapter-resume');if(resume&&state.phase!=='ready'&&!state.paused)resume.hidden=true;$('#app').dataset.storyPhase=state.phase;$('#app').classList.toggle('postgame-free',!!state.postgame);}
    });
    mission.setTargets(world.director.targets);world.onClockState=value=>mission.setClockRunning(value);mission.setClockRunning(world.running&&!document.hidden);
    exploration=createExploration(world,{mount:$('#app'),signal:abort.signal,
      canWalk:()=>!bonus?.active&&mission.state.postgame,canMove:()=>!mission.state.paused&&!world.streetShow?.active,onHotspot:kind=>mission.hotspot(kind),
      onSceneTap:ray=>{
        if(mission.state.tablet&&!mission.state.paused){const action=world.xaihi?.tabletTap(ray);if(action){mission.machine.tabletAction(action);return true;}}
        if(bonus?.handleTap(ray))return true;
        if(!mission.state.paused&&!mission.state.presentationLocked&&(mission.state.phase==='ready'||mission.state.postgame&&!mission.state.node)){
          const first=ray.intersectObjects([world.actors?.root,world.store.root].filter(Boolean),true).find(h=>{for(let n=h.object;n;n=n.parent)if(!n.visible)return false;return h.object.material?.visible!==false;});
          if(first?.object.userData.hotspot==='dragon'){const text=world.actors.reactDragon(world.time,['ready','complete'].includes(mission.state.phase));if(text){reactionBubble.dataset.speaker='dragon';reactionBubble.textContent=text;reactionBubbleUntil=world.time+2;reactionBubble.hidden=false;}return true;}
        }
        if(!mission.state.paused&&world.remnant.tap(ray,mission.state.clock))return true;
        if(!mission.state.presentationLocked&&!['finisher','photo-return','photo-sending'].includes(mission.state.phase)&&world.interact(ray))return true;
        if(!['combat','aim-final'].includes(mission.state.phase))return false;
        const target=world.director.pick(ray.ray);if(target!==null)mission.selectTarget(target);return true;
      }
    });
    createStreetPerformance({world,mission,mount:$('#app'),playEffect:k=>{if($('#sound').checked)audio.effect(k);},hum:t=>{if($('#sound').checked)audio.hum(t);}});
    bonus=createBonus({feedback,analyticsEnabled:ga4.enabled,onAnalytics:(action,value)=>{if(action==='shortcut'){debugTravel?.unlock();analytics.shortcut();}else analytics.bonus(action,value);},mount:$('#app'),world,mission,exploration,roomAudio:()=>audio.ambience('upstairs',preferences.rain),playEffect:kind=>{if($('#sound').checked&&!document.hidden)audio.effect(kind);}});
    world.onTick=(time,delta)=>{world.syncWalkingEnvironment();mission.machine.doorOpen=world.store.doors.open;mission.update(time);world.missionState=mission.state;audio.duck(!!mission.state.node);audio.ambience(mission.state.vcr?'shop':world.camera.position.z<2?'shop':'street',preferences.rain);if(mission.state.phase==='tour'&&mission.state.phaseElapsed>=14&&mission.state.phaseElapsed<30&&!mission.state.paused)audio.hum(mission.state.phaseElapsed);exploration.update(delta);bonus.update();viewControls.update();debugTravel?.update();analytics.tick(performance.now(),{visible:!document.hidden,paused:mission.pauseReasons.some(reason=>reason!=='bonus')});
      if(!reactionBubble.hidden){if(time>=reactionBubbleUntil||mission.state.paused||bonus.active){reactionBubble.hidden=true;world.actors?.cancelReaction();}else if(reactionBubble.dataset.speaker==='zhuang'){placeExplosionCaption();}else{const p=reactionBubble.dataset.speaker==='zhuang'?world.actors.heroPosition:world.actors.dragonPosition,q=world.projectPoint([p[0],p[1]+1.1,p[2]]),rect=world.container.getBoundingClientRect();reactionBubble.style.left=`${Math.max(100,Math.min(innerWidth-100,rect.x+(q[0]+1)*rect.width/2))}px`;reactionBubble.style.top=`${Math.max(150,Math.min(innerHeight*.55,rect.y+(1-q[1])*rect.height/2))}px`;}}
};
    loader.progress(99);await loader.finish();world.time=0;world.previous=undefined;world.tick(0,0,false);loader.hide();analytics.ready();world.frameStats.reset();world.start();
    const resume=document.createElement('button');resume.className='chapter-resume';resume.textContent='繼續上次 · '+CHAPTERS.find(c=>c.id===chapters.data.chapter).label;resume.hidden=chapters.data.chapter==='intro';$('#app').append(resume);
    const restore=id=>{if(bonus.active)return;restoring=true;menu(false);world.autoCamera=true;world.manualUntil=world.time;mission.machine.restoreChapter(id,chapters.data.branch);restoring=false;world.resetStoryCamera();resume.hidden=true;};
    resume.addEventListener('click',()=>{if(!mission.state.paused)restore(chapters.data.chapter);},{signal:abort.signal});
    const autoDialogue=document.createElement('button');autoDialogue.textContent='自動對話：關';autoDialogue.addEventListener('click',()=>{mission.machine.setAuto(!mission.state.auto);autoDialogue.textContent=mission.state.auto?'自動對話：開':'自動對話：關';},{signal:abort.signal});$('#settings').append(autoDialogue);
    let dialogueSize=preferences.textSize;const textSize=document.createElement('button');textSize.textContent='字幕字級：'+dialogueSize;textSize.addEventListener('click',()=>{dialogueSize={18:22,22:26,26:18}[dialogueSize];preferences.textSize=dialogueSize;saveSettings();$('#app').style.setProperty('--dialogue-size',dialogueSize+'px');textSize.textContent='字幕字級：'+dialogueSize;},{signal:abort.signal});$('#settings').append(textSize);
    const volumeRow=document.createElement('label');volumeRow.className='setting-row';volumeRow.textContent='音量';const volume=document.createElement('input');volume.type='range';volume.min=0;volume.max=100;volume.value=preferences.volume*100;volume.setAttribute('aria-label','雨聲與音效音量');volume.addEventListener('input',()=>{preferences.volume=Number(volume.value)/100;audio.setVolume(preferences.volume);saveSettings();},{signal:abort.signal});volumeRow.append(volume);$('#settings').append(volumeRow);audio.setVolume(preferences.volume);
    if(ga4.enabled){const note=document.createElement('p');note.className='control-tip';note.textContent='本站使用 Google Analytics 統計造訪、遊玩進度與星等回饋；不傳送照片、遊戲帳密輸入或對話內容。';$('#settings').append(note);}
    feedbackDialog=createFeedbackDialog({service:feedback,onOpen:()=>mission.setPaused(true,'feedback'),onClose:()=>mission.setPaused(false,'feedback')});
    const feedbackButton=document.createElement('button');feedbackButton.textContent='意見與問題回報';feedbackButton.addEventListener('click',()=>{menu(false);feedbackDialog.open();},{signal:abort.signal});$('#settings').append(feedbackButton);
    const version=document.createElement('small');version.textContent='版本：'+__BUILD_VERSION__;$('#settings').append(version);
    const restartNight=document.createElement('button');restartNight.textContent='重新開始雨夜';restartNight.addEventListener('click',()=>{menu(false);mission.replay();},{signal:abort.signal});$('#settings').append(restartNight);
    const resetCameraButton=document.createElement('button');resetCameraButton.textContent='立即回到演出';resetCameraButton.addEventListener('click',()=>{world.resetStoryCamera();menu(false);},{signal:abort.signal});$('#settings').append(resetCameraButton);
    const chapterMenu=document.createElement('section');chapterMenu.className='chapter-menu';const heading=document.createElement('h3');heading.textContent='章節接續／重看';chapterMenu.append(heading);$('#settings').append(chapterMenu);for(const c of CHAPTERS){const b=document.createElement('button');b.textContent=c.label;b.dataset.chapter=c.id;b.disabled=!chapters.data.unlocked.includes(c.id);b.addEventListener('click',()=>restore(c.id),{signal:abort.signal});chapterMenu.append(b);}
    settingsLayout=createSettingsLayout($('#settings'),abort.signal);
    debugTravel=createDebugTravel({mount:$('#app'),mission,signal:abort.signal,isPerforming:()=>!!world.streetShow.active||mission.state.presentationLocked||['combat','finisher','landing','tour','rewind'].includes(mission.state.phase),onJump:async (id,isCurrent)=>{
      const born=mission.state.mealBorn;
      if(['fridge','nikke','birth','chapter:rewind'].includes(id)){mission.setPaused(true,'debug-load');try{if(!await ensureXaihi())throw Error('塞西尚未載入');}finally{mission.setPaused(false,'debug-load');}}
      if(!isCurrent())return;
      bonus.leaveForDebug();menu(false);exploration.setActive(false);for(const reason of ['manual','background','debug-menu'])mission.setPaused(false,reason);
      restoring=true;
      try{
        if(id.startsWith('chapter:'))mission.machine.restoreChapter(id.slice(8));
        else if(['fridge','nikke','birth','figurine'].includes(id))mission.machine.restoreDebugPoint(id);
        else {
          mission.machine.restoreChapter(id==='first-restore'?'last':'intro');
          if(id==='first-restore'){world.director.finalBegun=true;mission.machine.phaseTo('finisher');bonus.debugFirstRestore();}
          else if(id==='street')bonus.debugStreet(born);
          else bonus.debugRoom(id);
        }
        analytics.shortcut();world.missionState=mission.state;world.resetStoryCamera();world.cameraSafety.sync();world.syncWalkingEnvironment(true);world.tick(world.time,0,true);
      }finally{restoring=false;}
    }});
    const backgroundResume=document.createElement('button');backgroundResume.className='background-resume';backgroundResume.textContent='已暫停 · 繼續';backgroundResume.hidden=true;$('#app').append(backgroundResume);
    listen(document,'visibilitychange',()=>{if(document.hidden){analytics.tick(performance.now(),{visible:false});analytics.flush();mission.setPaused(true,'background');}else if(mission.pauseReasons.includes('background'))backgroundResume.hidden=true;});
    backgroundResume.addEventListener('click',()=>{mission.setPaused(false,'background');backgroundResume.hidden=true;},{signal:abort.signal});
    window.__rainy711={
      get debug(){return debugTravel.state;},debugJump:id=>debugTravel.go(id),
      get staging(){return {show:world.streetShow?.state,shopping:mission.state.shopping,remnant:world.remnant.state,tractor:world.director.captureFx.root.visible,microphone:!!world.actors?.root.getObjectByName('floating-singing-microphone')?.visible,phone:world.photoPhone?.position.toArray()};},get loading(){return loader.state;},get bonus(){return bonus.state;},get chapters(){return chapters.data;},restoreChapter:id=>restore(id),assist:()=>mission.machine.assist(),
      get switches(){return {signal:world.signalIndex||0,room:world.roomLightOn??true,door:world.store.doors.manual};},get time(){return world.time;},get renders(){return world.renderCount;},get drawCalls(){return world.renderer.info.render.calls;},get triangles(){return world.renderer.info.render.triangles;},get warmup(){return world.shaderWarmup.state;},resetCamera:()=>world.resetStoryCamera(),
      get aa(){return {msaa:world.msaaSamples,postSamples:world.composer.renderTarget1.samples,postDepth:world.composer.renderTarget1.depthBuffer,fxaa:world.fxaa.enabled,dpr:world.renderer.getPixelRatio()};},
      get shaders(){return world.renderer.info.programs.map(p=>({id:p.id,name:p.name,uses:p.usedTimes}));},get devices(){return world.director.vcrEffects.state;},get performance(){return {...world.frameStats.state,battlePrepared:!!world.battleDrawWarm,drawCalls:world.renderer.info.render.calls,triangles:world.renderer.info.render.triangles,geometries:world.renderer.info.memory.geometries,textures:world.renderer.info.memory.textures,programs:world.renderer.info.programs.length};},get metrics(){let lights=0;world.scene.traverse(n=>{if(n.isLight&&n.visible)lights++;});return {batches:world.batchStats,lights,weather:world.weather.metrics,camera:world.walkCamera.state};},
      get cameraPose(){return {position:world.camera.position.toArray(),target:world.controls.target.toArray(),fov:world.camera.fov,photoOrigin:world.photoCamera.origin.toArray()};},get walkCamera(){return world.walkCamera.state;},get glassReady(){const u=world.store.glass.uniforms;return !!(u.uDepth.value?.isDepthTexture&&u.uScene.value?.isTexture&&u.uEnvironment.value?.isCubeTexture);},
      get poseData(){return world.actors?.poseData;},get idle(){return world.actors?.status;},get floorPlan(){return world.store.floorPlan;},get doors(){return {open:world.store.doors.open};},
      get mission(){return mission.state;},get story(){return mission.state;},get destruction(){return {...world.store.destruction.state,targets:world.store.destruction.targets};},get garden(){return world.garden.state;},get effects(){return world.siege.state;},
      get cinematic(){return world.director.status;},get tianshi(){return world.tianshi.state;},get microwave(){return world.microwave.state;},get connectionStage(){return world.connectionStage.state;},get xaihi(){return world.xaihi?.state||{loaded:false,loading:world.xaihiLoading,error:world.xaihiError};},
      get position(){return world.actors?.position.toArray();},get headPosition(){return world.actors?.headPosition;},get heroPosition(){return world.actors?.heroPosition;},get dragonPosition(){return world.actors?.dragonPosition;},get walking(){return exploration.active;},get minimumZoom(){return world.controls.minDistance;},projectPoint:point=>world.projectPoint(point),cameraOcclusion:point=>world.cameraOcclusion(point),
      fly:(x,z)=>mission.machine.fly(x,z),finishFlight:()=>mission.machine.finishFlight(),sendPhoto:()=>mission.sendPhoto(),takePhoto:()=>mission.takePhoto(),investigate:id=>mission.investigate(id),acceptCall:()=>mission.acceptCall(),tabletAction:id=>mission.machine.tabletAction(id),hackRotate:index=>mission.hackRotate(index),keyChunk:value=>mission.keyChunk(value),get photo(){return mission.photo;},get photoViewer(){return mission.viewer;},get investigationProps(){return world.investigationProps.state;},toggleAutoCamera:()=>world.toggleAutoCamera(),
      missionStart:()=>mission.start(),missionNext:()=>mission.next(),missionChoose:id=>mission.choose(id),missionReplay:()=>mission.replay(),missionAttack:t=>mission.attack(t),missionSelectTarget:id=>mission.selectTarget(id),missionOutput:id=>mission.setOutput(id),missionPause:value=>mission.setPaused(value),
      missionKey:value=>mission.key(value),missionSubmit:()=>mission.submitLogin(),missionVerify:()=>mission.verify(),missionLever:value=>mission.setLever(value),missionHeatStart:time=>mission.heatStart(time??world.time),missionHeatStop:time=>mission.heatStop(time??world.time),missionHeatRetry:()=>mission.heatRetry(),missionHeatCancel:()=>mission.heatCancel(),
      storyNext:()=>mission.next(),storyChoose:id=>mission.choose(id),storyStart:()=>mission.start(),storyReplay:()=>mission.replay(),hotspot:kind=>mission.hotspot(kind),
      teleport(x,z){world.actors?.teleport(x,z);},move(x,z,delta){world.actors?.setMove(x,z,true);world.actors?.update(world.time,delta);},tick(t,delta=.016,render=true){world.tick(t,delta,render);},
      inspectLayout(){world.inspectLayout();},pauseForCapture(){world.stop();},resume(){world.start();},frameView:name=>world.setView(name,true),samplePose:t=>world.tick(t),
      get actorsLoaded(){return !!world.actors;},get bonesSupported(){return !!world.actors?.supported;},get camera(){return world.camera.position.toArray();},get quality(){return world.quality;},get actorsVisible(){return !!world.actors?.root.visible;},get rendererCount(){return document.querySelectorAll('canvas').length;}
    };
  }catch(e){analytics.fail('scene');loader.dispose();world?.dispose();showError('無法啟動 3D 畫面。請使用支援 WebGL 2 的 Safari，然後重新載入。');console.error(e);}
}
function dispose(){feedbackDialog?.dispose();debugTravel?.dispose();closed=true;loader.dispose();abort.abort();bonus?.dispose();exploration?.dispose();mission?.dispose();audio.dispose();world?.dispose();}
listen(window,'pagehide',event=>{analytics.tick(performance.now(),{visible:false});analytics.flush();if(!event.persisted)dispose();else world?.stop();});listen(window,'pageshow',event=>{if(event.persisted)world?.start();});
if(import.meta.hot)import.meta.hot.dispose(dispose);
init();
