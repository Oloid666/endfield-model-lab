// Gameplay reference: 部長と峠 https://oichikonnyaku.com/touge/
// Original implementation; no reference-game source or assets used.
import {createRace,ROPES} from './physics.js';
import {LENGTH,nextBend} from './track.js';
import {createRaceScene} from './scene.js';
import {createRaceAudio} from './audio.js';
import './style.css';

function init(){
  const $=id=>document.getElementById(id),race=createRace(),state=race.state;
  const view=createRaceScene($('game'),state),audio=createRaceAudio(),keys=new Set(),touch={steer:0,brake:false,drift:false};
  let paused=false,started=false,acc=0,last=performance.now(),clock=0,lastEvent=0,hitSlow=0,noticeUntil=0;
  let steerPointer=null;const pedalPointers={brake:null,drift:null};
  function releaseSteer(){steerPointer=null;touch.steer=0;$('steer').querySelector('i').style.transform='';$('steer').setAttribute('aria-valuenow','0');}
  function clearInput(){keys.clear();releaseSteer();touch.brake=touch.drift=false;for(const id of ['brake','drift']){pedalPointers[id]=null;$(id).classList.remove('active');}}
  function input(){return {steer:Math.max(-1,Math.min(1,touch.steer+(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0))),brake:touch.brake||keys.has('ArrowDown')||keys.has('KeyS'),drift:touch.drift||keys.has('Space'),boost:keys.has('ArrowUp')||keys.has('KeyW')};}
  function setPause(value){
    if(!started||state.finished)return;paused=value;clearInput();acc=0;hitSlow=0;
    $('pause').textContent=value?'繼續':'暫停';$('pause').setAttribute('aria-pressed',String(value));$('paused').hidden=!value;
    audio.setActive(!value);if(!value)void audio.unlock();
  }
  function resetVisuals(){lastEvent=0;hitSlow=0;noticeUntil=0;acc=0;clearInput();view.reset();view.pose(1,clock,true);$('impact').textContent='';}
  function start(){
    race.reset();state.running=true;started=true;paused=false;resetVisuals();
    $('intro').hidden=true;$('result').hidden=true;$('paused').hidden=true;$('pause').disabled=false;$('recover').disabled=false;
    $('pause').textContent='暫停';$('pause').setAttribute('aria-pressed','false');audio.setActive(true);void audio.unlock();
    $('start').blur();$('again').blur();
  }
  $('start').onclick=start;$('again').onclick=start;$('reset').onclick=()=>{if(started)start();};$('pause').onclick=()=>setPause(!paused);
  $('recover').onclick=()=>{if(!started||state.finished)return;race.recover();resetVisuals();};
  $('rope').onclick=()=>{
    const mode=state.ropeMode==='medium'?'long':'medium';race.reset(mode);
    $('rope').textContent=`${ROPES[mode].label} ${ROPES[mode].rest}m ⇄`;
    $('rope').setAttribute('aria-label',`目前${ROPES[mode].label}，${ROPES[mode].rest}公尺；點按切換繩長，遊玩中會重跑`);
    if(started)start();else resetVisuals();
  };
  $('sound').onclick=()=>{const muted=!audio.state.muted;audio.setMuted(muted);$('sound').textContent=muted?'聲音 關':'聲音 開';$('sound').setAttribute('aria-pressed',String(!muted));if(!muted)void audio.unlock();};
  addEventListener('keydown',e=>{
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD'].includes(e.code)){
      e.preventDefault();if(started&&!paused&&!state.finished)keys.add(e.code);
    }
    if(e.code==='Escape'&&!e.repeat)setPause(!paused);
  });addEventListener('keyup',e=>keys.delete(e.code));
  addEventListener('blur',()=>setPause(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)setPause(true);});
  addEventListener('pagehide',()=>{clearInput();audio.setActive(false);});
  function steerMove(e){const b=$('steer').getBoundingClientRect();touch.steer=Math.max(-1,Math.min(1,(e.clientX-b.left-b.width/2)/(b.width*.36)));$('steer').querySelector('i').style.transform=`translateX(${touch.steer*b.width*.32}px)`;$('steer').setAttribute('aria-valuenow',String(Math.round(touch.steer*100)));}
  $('steer').onpointerdown=e=>{if(!state.running||paused||steerPointer!==null)return;steerPointer=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);steerMove(e);};
  $('steer').onpointermove=e=>{if(e.pointerId===steerPointer)steerMove(e);};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])$('steer').addEventListener(type,e=>{if(e.pointerId===steerPointer)releaseSteer();});
  for(const id of ['brake','drift']){
    const el=$(id);el.onpointerdown=e=>{if(!state.running||paused||pedalPointers[id]!==null)return;pedalPointers[id]=e.pointerId;el.setPointerCapture(e.pointerId);touch[id]=true;el.classList.add('active');};
    for(const type of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(type,e=>{if(e.pointerId!==pedalPointers[id])return;pedalPointers[id]=null;touch[id]=false;el.classList.remove('active');});
  }
  addEventListener('resize',()=>{view.resize();view.pose(1,clock,true);});
  $('progress').max=LENGTH;
  function hud(){
    $('stats').textContent=`${Math.round(state.speed*3.6)} km/h · ${state.score} 分 · ${state.time.toFixed(1)} 秒`;$('progress').value=state.player.s;
    const bend=nextBend(state.player.s);
    $('hint').textContent=!started?'切換繩長可比較甩動手感':state.finished?'':bend&&bend.start-state.player.s<40?`${bend.label}${state.player.s<bend.start?`・${Math.max(0,Math.round(bend.start-state.player.s))}m`:'・反打救回'} · 彎前煞車`:'直線加速 · 龍泡泡撞箱 +200';
    if(clock>noticeUntil)$('impact').textContent='';
  }
  function frame(now){
    requestAnimationFrame(frame);const dt=Math.max(0,Math.min((now-last)/1000,.06));last=now;
    if(!paused){
      clock+=dt;if(state.running){acc+=dt*(hitSlow>0?.35:1);hitSlow=Math.max(0,hitSlow-dt);
        while(acc>=1/120){race.step(1/120,input());acc-=1/120;}
        for(const event of state.events){if(event.id<=lastEvent)continue;lastEvent=event.id;view.hit(event,clock);audio.hit(event);
          if(event.strength>.5)hitSlow=.045;
          $('impact').textContent=event.kind==='wall'?'擦撞護欄':event.who==='dragon'?'龍泡泡撞擊！':'碰撞貨箱';noticeUntil=clock+.55;
        }
        audio.update(state);
      }
      if(state.finished&&$('result').hidden){
        $('result').hidden=false;$('summary').textContent=`${ROPES[state.ropeMode].label} · ${state.time.toFixed(1)} 秒 · ${state.score} 分\n撞倒 ${state.hits} 箱 · 最高 ${Math.round(state.peak)} km/h`;
        $('pause').disabled=true;$('recover').disabled=true;clearInput();audio.setActive(false);
      }
      view.pose(dt,clock);hud();
    }
    view.render();
  }
  view.pose(1,clock,true);hud();requestAnimationFrame(frame);
  // Read-only diagnostics, isolated from the rain-night game.
  window.__racing={get state(){return structuredClone(state);},get input(){return input();},get paused(){return paused;},get audio(){return audio.state;},version:__BUILD_VERSION__};
}
try{init();}catch(error){document.getElementById('intro').innerHTML='<h2>無法啟動3D畫面</h2><p>請確認瀏覽器支援 WebGL，或改用其他瀏覽器重試。</p>';console.error(error);}
