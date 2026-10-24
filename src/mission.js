import './mission.css';
import {MissionMachine,METER_PERIOD} from './mission-state.js';
import {speakers,endingCaption} from './mission-dialogue.js';

const E=(tag,className,text)=>{const e=document.createElement(tag);e.className=className;if(text!==undefined)e.textContent=text;return e;};
const runningPhases=new Set(['charge','combat','last','aim-final','finisher','landing']);
const manualPhases=new Set(['intro','meal','briefing','last','complete']);
const phaseTitles={intro:'01 · 先吃晚餐',choice:'01 · 今晚，吃什麼',meal:'01 · 買好晚餐',briefing:'02 · 梨花旁的燈',charge:'03 · 儲能接通',combat:'04 · 光害改善',last:'05 · 最後一發', 'aim-final':'05 · 龍泡泡，準備',finisher:'05 · 最後一擊',landing:'任務完成',complete:'武陵 · 聽雨'};

export function createMission({mount=document.querySelector('#app'),onDinner,onGesture,onStage,onAttack,onState}={}){
  if(!mount)throw Error('Mission mount is required.');
  const events=new AbortController(),listen=(target,type,fn)=>target.addEventListener(type,fn,{signal:events.signal});
  const root=E('section','mission-shell');root.setAttribute('aria-label','莊的晚餐與光害改善任務');
  const launch=E('button','mission-launch');launch.type='button';launch.append(E('span','mission-kicker','一場雨，一頓飯。'),E('span','mission-launch-title','開始今晚的故事'),E('span','mission-launch-arrow','↗'));
  const panel=E('div','mission-panel');panel.hidden=true;
  const bar=E('div','mission-bar'),name=E('span','mission-name'),chapter=E('span','mission-chapter');bar.append(name,chapter);
  const line=E('button','mission-line');line.type='button';line.setAttribute('aria-label','顯示完整台詞或下一句');
  const text=E('span','mission-text'),next=E('span','mission-next','⌄');line.append(text,next);
  const choices=E('div','mission-choices');choices.setAttribute('aria-label','請選擇晚餐');
  const controls=E('div','mission-controls'),auto=E('button','mission-auto','自動'),skip=E('button','mission-skip','略過本段'),hint=E('span','mission-read-hint','點台詞繼續');auto.type=skip.type='button';controls.append(auto,skip,hint);panel.append(bar,line,choices,controls);
  const status=E('div','mission-status'),statusTitle=E('span','mission-status-title','儲能接通'),value=E('strong','mission-progress-value','0%'),statusTrack=E('div','mission-status-track'),statusFill=E('i','mission-status-fill');statusTrack.append(statusFill);status.append(statusTitle,value,statusTrack);
  const pause=E('button','mission-pause','暫停');pause.type='button';pause.setAttribute('aria-label','暫停故事與任務');
  const combat=E('div','mission-combat'),target=E('span','mission-target','點建築選目標'),feedback=E('span','mission-feedback','按中中央，威力更強');
  const meter=E('div','mission-meter');meter.setAttribute('role','meter');meter.setAttribute('aria-label','砲擊力度，中央最強');meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','100');
  const sweet=E('i','mission-sweet'),perfect=E('i','mission-perfect'),pointer=E('i','mission-pointer');meter.append(sweet,perfect,pointer);
  const attack=E('button','mission-attack','砲擊');attack.type='button';
  const legend=E('div','mission-meter-legend');legend.append(E('span','','MISS'),E('span','','中央重擊'),E('span','','MISS'));
  const energy=E('span','mission-energy','主砲能量 100%');combat.append(target,feedback,meter,legend,energy,attack);
  const completed=E('div','mission-completed'),completeText=E('span','mission-complete-text','100% · 任務完成'),replay=E('button','mission-replay','重新選餐');replay.type='button';completed.append(completeText,replay);
  const caption=E('p','mission-caption',endingCaption);caption.setAttribute('aria-hidden','true');
  root.append(launch,panel,status,pause,combat,completed,caption);mount.append(root);
  let disposed=false,lastChoices='',lastPhase='',lastFeedback=-1,clockRunning=true,sourceAnchor=0,performanceAnchor=performance.now();
  const pointerAnimation=pointer.animate?pointer.animate([{transform:'translateX(0%)'},{transform:'translateX(100%)'},{transform:'translateX(0%)'}],{duration:METER_PERIOD*1000,iterations:Infinity,easing:'linear'}):null;
  pointerAnimation?.pause();
  const machine=new MissionMachine({onDinner,onGesture,onStage,onAttack,onState});
  function syncPointer(s,force=false){
    if(pointerAnimation){
      const wanted=(s.meterElapsed%METER_PERIOD)*1000;
      if(force||!clockRunning||s.paused||document.hidden||Math.abs((Number(pointerAnimation.currentTime)||0)-wanted)>120)pointerAnimation.currentTime=wanted;
      if(clockRunning&&!s.paused&&!document.hidden&&['combat','aim-final'].includes(s.phase))pointerAnimation.play();else pointerAnimation.pause();
    }else pointer.style.transform=`translateX(${s.meter*100}%)`;
  }
  function render(force=false){
    if(disposed)return;const s=machine.state,active=!['ready','complete'].includes(s.phase),isCombat=['combat','aim-final'].includes(s.phase),isCharge=s.phase==='charge';
    root.dataset.phase=s.phase;root.dataset.paused=String(s.paused);mount.dataset.missionPhase=s.phase;
    mount.classList.toggle('mission-ready',s.phase==='ready');mount.classList.toggle('mission-active',active);mount.classList.toggle('mission-running',runningPhases.has(s.phase));mount.classList.toggle('mission-complete',s.phase==='complete');
    launch.hidden=s.phase!=='ready';panel.hidden=!s.node&&s.phase!=='choice';
    panel.classList.toggle('has-choices',s.phase==='choice');panel.classList.toggle('is-timed',['charge','landing'].includes(s.phase));
    name.textContent=s.phase==='choice'?'莊芳宜':speakers[s.speaker]||'通訊';name.dataset.speaker=s.speaker||'';chapter.textContent=phaseTitles[s.phase]||'';
    text.textContent=s.phase==='choice'?'晚餐，你幫我挑。':s.text.slice(0,s.revealed);
    const manual=manualPhases.has(s.phase)&&!!s.node;line.disabled=!manual||s.paused;next.hidden=!manual;
    controls.hidden=!manual;auto.textContent=s.auto?'自動：開':'自動';auto.setAttribute('aria-pressed',String(s.auto));auto.disabled=s.paused;skip.disabled=s.paused;
    hint.textContent=s.paused?'已暫停':'點台詞繼續';
    const choiceSignature=s.choices.map(v=>v.id).join(',');
    if(choiceSignature!==lastChoices){choices.replaceChildren();for(const item of s.choices){const b=E('button','mission-choice');b.type='button';b.dataset.choice=item.id;b.append(E('span','mission-choice-label',item.label),E('span','mission-choice-hint',item.hint));choices.append(b);}lastChoices=choiceSignature;}
    for(const b of choices.children)b.disabled=s.paused;
    status.hidden=!runningPhases.has(s.phase)&&!(s.phase==='complete'&&s.phaseElapsed<2.8);statusTitle.textContent=s.phase==='complete'?'任務完成':isCharge?'全城儲能接通':s.phase==='last'||s.phase==='aim-final'?'摧毀最後機櫃':s.phase==='finisher'?'龍泡泡 · 最後一擊':s.phase==='landing'?'目標停止運作':'任務進度';
    const shown=isCharge?s.charge:s.progress;value.textContent=`${Math.floor(shown)}%`;statusFill.style.transform=`scaleX(${shown/100})`;
    pause.hidden=['ready','complete'].includes(s.phase);pause.textContent=s.paused?'繼續':'暫停';pause.setAttribute('aria-pressed',String(s.paused));
    combat.hidden=!isCombat;target.textContent=s.phase==='aim-final'?'最後目標 · 伺服器':`目標 · ${s.targetLabel}`;
    energy.textContent=s.phase==='aim-final'?'主砲耗盡 · 最後一發':`主砲能量 ${Math.ceil(s.energy)}%`;
    attack.textContent=s.phase==='aim-final'?'發射龍泡泡':'砲擊';attack.disabled=!s.canAttack;
    meter.setAttribute('aria-valuenow',String(Math.round(s.meter*100)));
    if(s.feedback&&s.feedback.number!==lastFeedback){lastFeedback=s.feedback.number;const labels={miss:'MISS · 重新聚焦',hit:'命中',strong:'強擊',perfect:'完美重擊'};feedback.textContent=labels[s.feedback.result];feedback.dataset.result=s.feedback.result;}
    else if(lastPhase!==s.phase){feedback.textContent=s.phase==='aim-final'?'按中金色中央，發射龍泡泡':'按中中央，威力更強';delete feedback.dataset.result;}
    completed.hidden=s.phase!=='complete'||!!s.node;caption.classList.toggle('visible',s.phase==='complete'&&s.phaseElapsed>=3&&s.phaseElapsed<10);
    syncPointer(s,force||lastPhase!==s.phase);lastPhase=s.phase;
  }
  function inputSource(event){
    if(!clockRunning||machine.paused||document.hidden)return machine.sourceTime;
    let stamp=Number(event?.timeStamp);if(!Number.isFinite(stamp))stamp=performance.now();if(stamp>1e12)stamp-=performance.timeOrigin;
    if(Math.abs(stamp-performance.now())>60000)stamp=performance.now();
    return sourceAnchor+(stamp-performanceAnchor)/1000;
  }
  function fire(event){if(event?.isPrimary===false||event?.button>0)return;event?.preventDefault();const result=machine.attack(inputSource(event));render();return result;}
  listen(launch,'click',()=>{machine.start();render(true);});listen(line,'click',()=>{machine.next();render();});
  listen(choices,'click',event=>{const button=event.target.closest('[data-choice]');if(button){machine.choose(button.dataset.choice);render(true);}});
  listen(auto,'click',()=>{machine.setAuto(!machine.auto);render();});listen(skip,'click',()=>{machine.skip();render(true);});
  listen(pause,'click',()=>{machine.setPaused(!machine.paused);sourceAnchor=machine.sourceTime;performanceAnchor=performance.now();render(true);});
  listen(replay,'click',()=>{machine.replay();lastFeedback=-1;render(true);});listen(attack,'pointerdown',fire);
  // VoiceOver activates controls with a synthesized click; physical pointers use pointerdown.
  listen(attack,'click',event=>{if(event.detail===0)fire(event);});
  listen(document,'keydown',event=>{if(event.code!=='Space'||event.repeat||event.target.closest('input,select,textarea,[contenteditable=true]')||(event.target!==attack&&event.target.closest('button,a,summary'))||!['combat','aim-final'].includes(machine.phase))return;fire(event);});
  listen(document,'visibilitychange',()=>{sourceAnchor=machine.sourceTime;performanceAnchor=performance.now();render(true);});
  render(true);
  const api={machine,get state(){return machine.state;},start(){machine.start();render(true);return true;},replay(){machine.replay();lastFeedback=-1;render(true);return true;},next(){const result=machine.next();render();return result;},choose(id){const result=machine.choose(id);render(true);return result;},
    attack(time){const result=machine.attack(time);render();return result;},selectTarget(id){const result=machine.selectTarget(id);render();return result;},setTargets(targets){machine.setTargets(targets);render();},
    setPaused(value){machine.setPaused(value);sourceAnchor=machine.sourceTime;performanceAnchor=performance.now();render(true);},setAuto(value){machine.setAuto(value);render();},
    hotspot(kind){const result=machine.hotspot(kind);render();return result;},update(time){machine.update(time);sourceAnchor=machine.sourceTime;performanceAnchor=performance.now();render();},
    setClockRunning(value){clockRunning=Boolean(value);sourceAnchor=machine.sourceTime;performanceAnchor=performance.now();render(true);},
    dispose(){if(disposed)return;disposed=true;events.abort();pointerAnimation?.cancel();root.remove();for(const c of ['mission-ready','mission-active','mission-running','mission-complete'])mount.classList.remove(c);delete mount.dataset.missionPhase;},
  };
  return api;
}
