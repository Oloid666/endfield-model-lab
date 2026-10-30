import {createIndoorGame,route,LENGTH,CRUISE_SPEED} from './game.js';
import {createScene} from './scene.js';
import {createRaceAudio} from '../racing/audio.js';
import './style.css';
function init(){
 const $=id=>document.getElementById(id),game=createIndoorGame(),s=game.state,view=createScene($('game'),s),audio=createRaceAudio(),keys=new Set(),touch={steer:0,brake:false};
 let lastWarning=-10;
 let paused=false,started=false,last=performance.now(),acc=0,clock=0,eventId=0,noticeEnd=0,steerId=null,brakeId=null;
 function clear(){keys.clear();touch.steer=0;touch.brake=false;steerId=brakeId=null;$('steer').querySelector('i').style.transform='';$('steer').setAttribute('aria-valuenow','0');$('brake').classList.remove('active');}
 function input(){return {steer:Math.max(-1,Math.min(1,touch.steer+(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0))),brake:touch.brake||keys.has('ArrowDown')||keys.has('KeyS')};}
 function pause(value){if(!started||s.finished)return;paused=value;clear();acc=0;$('paused').hidden=!value;$('pause').textContent=value?'繼續':'暫停';audio.setActive(!value);if(!value)void audio.unlock();}
 function start(){game.reset();s.running=true;started=true;paused=false;acc=0;eventId=0;noticeEnd=0;clear();$('intro').hidden=$('result').hidden=true;$('paused').hidden=true;$('pause').disabled=$('recover').disabled=false;$('pause').textContent='暫停';audio.setActive(true);void audio.unlock();view.pose(1,clock,true);$('start').blur();$('again').blur();}
 $('start').onclick=start;$('again').onclick=start;$('reset').onclick=()=>{if(started)start();};$('pause').onclick=()=>pause(!paused);
 $('recover').onclick=()=>{game.recover();clear();view.pose(1,clock,true);$('notice').textContent='回到安全檢查點・息壤暫停上升';noticeEnd=clock+2;};
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
   for(const e of s.events){if(e.id<=eventId)continue;eventId=e.id;noticeEnd=clock+2;$('notice').textContent=e.kind==='checkpoint'?'檢查點！息壤退回時會記住這裡':e.kind==='rescue'?'別怕，回到安全檢查點':e.kind==='goods'?(e.who==='dragon'?'龍泡泡撞飛商品 +200':'商品撞飛 +75'):'';if(e.kind==='goods')audio.hit({kind:'box',strength:.35});}
   audio.update({speed:s.speed/CRUISE_SPEED*27,slip:Math.abs(s.dragonSideSpeed)*10,tension:Math.abs(s.dragonOffset-s.offset)*60});
  }
  if(s.finished&&$('result').hidden){$('result').hidden=false;$('summary').textContent=`${s.time.toFixed(1)} 秒 · ${s.score} 分\n安全救回 ${s.recoveries} 次 · 龍泡泡也逃出來了`;$('pause').disabled=$('recover').disabled=true;clear();audio.setActive(false);}
  view.pose(dt,clock);$('stats').textContent=`${Math.round(s.s/LENGTH*100)}% · ${s.score} 分 · ${s.time.toFixed(0)} 秒`;$('progress').value=s.s;
  const margin=Math.min(route(s.s).y,route(s.dragonS).y)-s.liquid,danger=s.running&&s.riseHold<=0&&margin<.18;document.body.classList.toggle('danger',danger);if(danger&&clock-lastWarning>3){audio.hit({kind:'wall',strength:.15});lastWarning=clock;}
  $('danger').textContent=s.finished?'兩隻都抵達安全區':danger?'息壤快追上了！繼續往上走':s.riseHold>0?`息壤暫停上升 ${Math.ceil(s.riseHold)} 秒`:`息壤 ${(s.liquid*100).toFixed(0)}cm · 檢查點 ${s.checkpoint}/2`;
  if(clock>noticeEnd)$('notice').textContent='';
  }view.render();
 }
 view.pose(1,clock,true);requestAnimationFrame(frame);
 window.__indoor={get state(){return structuredClone(s);},get input(){return input();},get paused(){return paused;},get audio(){return audio.state;},version:__BUILD_VERSION__};
}
try{init();}catch(error){document.getElementById('intro').innerHTML='<h2>無法啟動3D畫面</h2><p>請使用支援 WebGL 的瀏覽器重試。</p>';console.error(error);}
