import {createIndoorGame,route,LENGTH,CRUISE_SPEED} from './game.js';
import {createScene} from './scene.js';
import {createRaceAudio} from '../racing/audio.js';
import './style.css';
function init(){
 const $=id=>document.getElementById(id),game=createIndoorGame(),s=game.state,view=createScene($('game'),s),audio=createRaceAudio(),keys=new Set(),touch={steer:0,brake:false};
 let paused=false,started=false,last=performance.now(),acc=0,clock=0,eventId=0,noticeEnd=0,steerId=null,brakeId=null;
 function clear(){keys.clear();touch.steer=0;touch.brake=false;steerId=brakeId=null;$('steer').querySelector('i').style.transform='';$('steer').setAttribute('aria-valuenow','0');$('brake').classList.remove('active');}
 function input(){return {steer:Math.max(-1,Math.min(1,touch.steer+(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0))),brake:touch.brake||keys.has('ArrowDown')||keys.has('KeyS')};}
 function pause(value){if(!started||s.finished)return;paused=value;clear();acc=0;$('paused').hidden=!value;$('pause').textContent=value?'繼續':'暫停';audio.setActive(!value);if(!value)void audio.unlock();}
 function start(){game.reset();s.running=true;started=true;paused=false;acc=0;eventId=0;noticeEnd=0;clear();view.reset();$('intro').hidden=$('result').hidden=true;$('paused').hidden=true;$('pause').disabled=$('recover').disabled=false;$('pause').textContent='暫停';audio.setActive(true);void audio.unlock();view.pose(1,clock,true);$('start').blur();$('again').blur();}
 $('start').onclick=start;$('again').onclick=start;$('reset').onclick=()=>{if(started)start();};$('pause').onclick=()=>pause(!paused);
 $('recover').onclick=()=>{game.recover();clear();view.pose(1,clock,true);$('notice').textContent='已扶正・繼續甩撞';noticeEnd=clock+2;};
 $('camera').onclick=()=>{const mode={auto:'close',close:'wide',wide:'auto'}[view.cameraState.mode];view.setCameraMode(mode);$('camera').textContent=`鏡頭：${{auto:'自動',close:'近追',wide:'全景'}[mode]} ⇄`;$('camera').setAttribute('aria-label',`目前${{auto:'自動',close:'近追',wide:'全景'}[mode]}鏡頭；點按切換自動、近追與全景`);view.pose(.016,clock,true);};
 $('sound').onclick=()=>{const muted=!audio.state.muted;audio.setMuted(muted);$('sound').textContent=muted?'聲音 關':'聲音 開';$('sound').setAttribute('aria-pressed',String(!muted));if(!muted)void audio.unlock();};
 addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowDown','KeyA','KeyD','KeyS'].includes(e.code)){e.preventDefault();if(s.running&&!paused)keys.add(e.code);}if(e.code==='Escape'&&!e.repeat)pause(!paused);});addEventListener('keyup',e=>keys.delete(e.code));
 addEventListener('blur',()=>pause(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true);});addEventListener('pagehide',()=>{clear();audio.setActive(false);});
 function move(e){const r=$('steer').getBoundingClientRect();touch.steer=Math.max(-1,Math.min(1,(e.clientX-r.x-r.width/2)/(r.width*.36)));$('steer').querySelector('i').style.transform=`translateX(${touch.steer*r.width*.32}px)`;$('steer').setAttribute('aria-valuenow',String(Math.round(touch.steer*100)));}
 $('steer').onpointerdown=e=>{if(!s.running||paused||steerId!==null)return;steerId=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);move(e);};$('steer').onpointermove=e=>{if(e.pointerId===steerId)move(e);};
 for(const type of ['pointerup','pointercancel','lostpointercapture'])$('steer').addEventListener(type,e=>{if(e.pointerId===steerId){steerId=null;touch.steer=0;$('steer').querySelector('i').style.transform='';$('steer').setAttribute('aria-valuenow','0');}});
 $('brake').onpointerdown=e=>{if(!s.running||paused||brakeId!==null)return;brakeId=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);touch.brake=true;$('brake').classList.add('active');};for(const type of ['pointerup','pointercancel','lostpointercapture'])$('brake').addEventListener(type,e=>{if(e.pointerId===brakeId){brakeId=null;touch.brake=false;$('brake').classList.remove('active');}});
 addEventListener('resize',()=>{view.resize();view.pose(1,clock,true);});$('progress').max=LENGTH;
 function frame(now){requestAnimationFrame(frame);const dt=Math.max(0,Math.min((now-last)/1000,.25));last=now;
  if(!paused){clock+=dt;if(s.running){acc+=dt;while(acc>=1/120){game.step(1/120,input());acc-=1/120;}
   for(const e of s.events){if(e.id<=eventId)continue;eventId=e.id;noticeEnd=clock+.85;
    if(e.kind==='goods'){view.hit(e,clock);audio.hit({kind:e.who==='dragon'?'box':'wall',strength:e.strength,combo:e.who==='dragon'?e.combo:0});$('notice').textContent=e.who==='dragon'?`龍泡泡命中 +${e.points}${e.combo>1?' · '+e.combo+'連擊！':''}`:'主角碰撞 +10・試著甩龍泡泡';}
    else $('notice').textContent=e.kind==='rescue'?'已扶正，繼續試！':'';
   }

   audio.update({speed:s.speed/CRUISE_SPEED*27,slip:Math.abs(s.dragonSideSpeed)*10,tension:s.tension*4});
  }
  if(s.finished&&$('result').hidden){$('result').hidden=false;$('summary').textContent=`龍泡泡命中 ${s.goals}/3 組 · ${s.passed?'達標！':'兩組達標，再試一次！'}\n${s.time.toFixed(1)} 秒 · ${s.score} 分 · 最高 ${s.maxCombo} 連擊\n① ${s.groups[0]?'✓':'—'}　② ${s.goods.filter(g=>g.group===1&&g.by==='dragon').length}/2　③ ${s.groups[2]?'✓':'—'}`;$('pause').disabled=$('recover').disabled=true;clear();audio.setActive(false);}
  view.pose(dt,clock);$('stats').textContent=`${Math.round(s.s/LENGTH*100)}% · ${s.score} 分 · ${s.time.toFixed(0)} 秒`;$('progress').value=s.s;$('goals').textContent=`龍泡泡命中 ${s.goals}/3 組${s.combo>1?' · ×'+s.combo+' 連擊':''}`;
  $('danger').textContent=s.finished?'再試一次，練到能指定撞哪邊':s.s<7?'左右蓄力 → 反向甩出，撞橙色目標':s.s<16?'② 左右各一個・兩個都由龍泡泡撞中':'③ 商品群・連撞把倍率疊起來！';

  if(clock>noticeEnd)$('notice').textContent='';
  }view.render();
 }
 view.pose(1,clock,true);requestAnimationFrame(frame);
 window.__indoor={get state(){return structuredClone(s);},get input(){return input();},get paused(){return paused;},get audio(){return audio.state;},get camera(){return view.cameraState;},version:__BUILD_VERSION__};
}
try{init();}catch(error){document.getElementById('intro').innerHTML='<h2>無法啟動3D畫面</h2><p>請使用支援 WebGL 的瀏覽器重試。</p>';console.error(error);}
