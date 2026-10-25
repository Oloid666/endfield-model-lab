import './mission.css';
import {MissionMachine,METER_PERIOD} from './mission-state.js';
import {speakers,endingCaption} from './mission-dialogue.js';

const E=(tag,className,text)=>{const e=document.createElement(tag);e.className=className;if(text!==undefined)e.textContent=text;return e;};
const setText=(node,text)=>{const value=String(text??'');if(node.textContent!==value)node.textContent=value;};
const runningPhases=new Set(['login','captcha','lever','charge','combat','energy','rewind','flashback','heat-demo','heat','flashback-end','return','last','aim-final','finisher','landing','tour']);
const manualPhases=new Set(['intro','meal','briefing','energy','flashback','flashback-end','last','complete']);
const connectionPhases=new Set(['login','captcha','lever']);
const vcrPhases=new Set(['rewind','flashback','heat-demo','heat','flashback-end','return']);
const phaseTitles={intro:'01 · 先吃晚餐',choice:'01 · 今晚，吃什麼',meal:'01 · 買好晚餐',briefing:'02 · 梨花旁的燈',login:'03 · 請幫我連線',captcha:'03 · 驗證身分',lever:'03 · 接通儲能網',charge:'03 · 儲能接通',combat:'04 · 光害改善',energy:'04 · 電去哪裡了',rewind:'VCR · 倒帶中',flashback:'VCR · 三分鐘前', 'heat-demo':'VCR · 加熱試驗',heat:'VCR · 極速加熱', 'flashback-end':'VCR · 沒關掉的設定',return:'回到現場',last:'05 · 最後一發','aim-final':'05 · 龍泡泡，準備',finisher:'05 · 最後一擊',landing:'任務完成',tour:'武陵 · 現場紀錄',complete:'武陵 · 聽雨'};


export function createMission({mount=document.querySelector('#app'),onDinner,onGesture,onStage,onAttack,onState,onAction,onCameraReset}={}){
  if(!mount)throw Error('Mission mount is required.');
  const motionQuery=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const events=new AbortController(),listen=(target,type,fn,options={})=>target.addEventListener(type,fn,{...options,signal:events.signal});
  const root=E('section','mission-shell');root.setAttribute('aria-label','莊的晚餐與光害改善任務');
  const inspection=E('p','mission-inspection');inspection.append(E('span','','先看看她。故事會等你。'),E('span','','拖曳旋轉，雙指放大。準備好再開始。'));
  const launch=E('button','mission-launch');launch.type='button';launch.append(E('span','mission-kicker','一場雨，一頓飯。'),E('span','mission-launch-title','去買晚餐'),E('span','mission-launch-arrow','↗'));
  const panel=E('div','mission-panel');panel.hidden=true;
  const comm=E('div','mission-comm');comm.hidden=true;comm.setAttribute('aria-label','弭弗的巡衛通訊');
  const portrait=E('div','mission-comm-portrait');portrait.setAttribute('role','img');portrait.setAttribute('aria-label','弭弗二創通訊肖像');portrait.style.backgroundImage=`url("${import.meta.env.BASE_URL}images/mifu-portrait-a-source.png")`;const portraitImage=E('img','mission-comm-art');portraitImage.src=`${import.meta.env.BASE_URL}images/mifu-portrait-a-source.png`;portraitImage.alt='';portraitImage.decoding='async';portrait.append(portraitImage);
  const commInfo=E('div','mission-comm-info');commInfo.append(E('span','mission-comm-kicker','WULING GUARD · 巡衛通訊'),E('strong','','弭弗'),E('span','mission-comm-caption','武陵巡衛隊長 · 通訊已接通'));
  const signal=E('span','mission-comm-signal');signal.setAttribute('aria-hidden','true');for(let i=0;i<13;i++){const b=E('i','');b.style.setProperty('--wave-height',`${5+(i*7%17)}px`);signal.append(b);}comm.append(portrait,commInfo,signal);
  const bar=E('div','mission-bar'),name=E('span','mission-name'),chapter=E('span','mission-chapter');bar.append(name,chapter);
  const line=E('button','mission-line');line.type='button';line.setAttribute('aria-label','顯示完整台詞或下一句');
  const text=E('span','mission-text'),next=E('span','mission-next','⌄');line.append(text,next);
  const choices=E('div','mission-choices');choices.setAttribute('aria-label','請選擇晚餐');
  const controls=E('div','mission-controls'),auto=E('button','mission-auto','自動'),skip=E('button','mission-skip','略過本段'),hint=E('span','mission-read-hint','點台詞繼續');auto.type=skip.type='button';controls.append(auto,skip,hint);panel.append(comm,bar,line,choices,controls);
  const status=E('div','mission-status'),statusTitle=E('span','mission-status-title'),value=E('strong','mission-progress-value','0%'),statusTrack=E('div','mission-status-track'),statusFill=E('i','mission-status-fill');statusTrack.append(statusFill);status.append(statusTitle,value,statusTrack);
  const pause=E('button','mission-pause','暫停');pause.type='button';pause.setAttribute('aria-label','暫停故事與任務');
  const cameraReset=E('button','mission-camera-reset','↺ 鏡頭');cameraReset.type='button';cameraReset.setAttribute('aria-label','回到本段預設演出鏡頭');cameraReset.title='回到本段預設演出鏡頭';
  const combat=E('div','mission-combat'),target=E('span','mission-target'),feedback=E('span','mission-feedback');
  const meter=E('div','mission-meter');meter.setAttribute('role','meter');meter.setAttribute('aria-label','砲擊力度，中央最強');meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax','100');
  const sweet=E('i','mission-sweet'),perfect=E('i','mission-perfect'),pointer=E('i','mission-pointer');meter.append(sweet,perfect,pointer);
  const attack=E('button','mission-attack','砲擊');attack.type='button';
  const legend=E('div','mission-meter-legend');legend.append(E('span','','MISS'),E('span','','中央重擊'),E('span','','MISS'));
  const energy=E('span','mission-energy');combat.append(target,feedback,meter,legend,energy,attack);
  const outputs=E('div','mission-outputs');outputs.setAttribute('aria-label','選擇砲擊出力');
  for(const mode of [{id:'steady',label:'穩壓',hint:'寬判定'},{id:'strong',label:'強攻',hint:'威力 +20%'},{id:'overload',label:'過載',hint:'威力 +50%'}]){const b=E('button','mission-output');b.type='button';b.dataset.output=mode.id;b.append(E('span','',mode.label),E('small','',mode.hint));outputs.append(b);}
  const finalSeal=E('div','mission-final-seal'),finalPortrait=E('div','mission-dragon-portrait');finalPortrait.setAttribute('role','img');finalPortrait.setAttribute('aria-label','龍泡泡錯愕的表情');finalPortrait.style.backgroundImage=`url("${import.meta.env.BASE_URL}images/dragon-reactions.png")`;
  const finalWords=E('div','mission-final-words'),finalQuote=E('p','mission-final-quote');finalWords.append(E('span','mission-final-label','龍泡泡 · 終末彈'),finalQuote);finalSeal.append(finalPortrait,finalWords);combat.prepend(finalSeal,outputs);
  const completed=E('div','mission-completed'),completeText=E('span','mission-complete-text','100% · 任務完成'),replay=E('button','mission-replay','重新選餐');replay.type='button';completed.append(completeText,replay);
  const caption=E('p','mission-caption',endingCaption);caption.setAttribute('aria-hidden','true');

  const connection=E('section','mission-connect');connection.hidden=true;connection.setAttribute('aria-label','天師樁儲能網接入');
  const connectionHeading=E('div','mission-connect-heading');connectionHeading.append(E('span','','武陵儲能網'),E('span','mission-connect-step'));
  const connectionQuote=E('p','mission-connect-quote');connectionQuote.setAttribute('aria-live','polite');
  const login=E('div','mission-login'),loginLabel=E('span','mission-login-label'),loginValue=E('div','mission-login-value'),loginExpected=E('span','mission-login-expected');loginValue.setAttribute('aria-live','polite');
  const loginPrompt=E('div','mission-login-prompt'),promptReplay=E('button','mission-prompt-replay','↻ 重聽');promptReplay.type='button';promptReplay.setAttribute('aria-label','重聽帳號或密碼');loginPrompt.append(loginLabel,promptReplay);
  const keys=E('div','mission-keyboard');keys.setAttribute('role','group');keys.setAttribute('aria-label','點按鍵帽，龍泡泡會跟著踩下');
  const loginSubmit=E('button','mission-login-submit','確認帳號');loginSubmit.type='button';
  const loginError=E('p','mission-login-error');loginError.setAttribute('role','status');loginError.setAttribute('aria-live','polite');login.append(loginPrompt,loginValue,loginExpected,keys,loginError,loginSubmit);
  const captcha=E('div','mission-captcha'),captchaCheck=E('button','mission-captcha-check');captchaCheck.type='button';captchaCheck.setAttribute('role','checkbox');captchaCheck.setAttribute('aria-checked','false');captchaCheck.append(E('i','mission-captcha-box'),E('span','','我不是機器人'));
  const captchaBrand=E('div','mission-captcha-brand');captchaBrand.append(E('span','','⟳'),E('small','','reCAPTCHA'));captcha.append(captchaCheck,captchaBrand);
  const lever=E('div','mission-lever'),leverTrack=E('div','mission-lever-track'),leverThumb=E('button','mission-lever-thumb','→'),leverLabel=E('span','mission-lever-label','向右拉，接通天師樁');leverThumb.type='button';leverThumb.setAttribute('role','slider');leverThumb.setAttribute('aria-label','向右拉動接入拉桿');leverThumb.setAttribute('aria-valuemin','0');leverThumb.setAttribute('aria-valuemax','100');leverTrack.append(leverLabel,leverThumb);lever.append(leverTrack,E('p','mission-lever-tip','龍泡泡已就位。拉到底，讓全城供電。'));
  connection.append(connectionHeading,connectionQuote,login,captcha,lever);

  const heat=E('section','mission-heat');heat.hidden=true;heat.setAttribute('aria-label','賽希的極速加熱');
  const heatHeading=E('div','mission-connect-heading');heatHeading.append(E('span','','極速加熱'),E('span','mission-heat-round','01 / 03'));
  const heatSteps=E('div','mission-heat-steps');heatSteps.setAttribute('aria-label','三段短脈衝');for(let i=0;i<3;i++){const step=E('span','mission-heat-step');step.append(E('i','',String(i+1)),E('span','','0.10 秒'));heatSteps.append(step);}
  const heatReadout=E('div','mission-heat-readout'),heatTime=E('strong','','0.00'),heatUnit=E('span','','秒');heatReadout.append(heatTime,heatUnit);
  const heatCondition=E('span','mission-heat-condition','等待送電'),heatTotal=E('span','mission-heat-total','合計 0.00 / 0.30 秒'),heatHint=E('p','mission-heat-hint','按住送電，綠格鬆手。連穩三段。');
  const heatMeter=E('div','mission-heat-meter');heatMeter.setAttribute('role','meter');heatMeter.setAttribute('aria-label','本段送電進度，綠格內鬆手');heatMeter.setAttribute('aria-valuemin','0');heatMeter.setAttribute('aria-valuemax','20');
  const heatFill=E('i','mission-heat-fill'),heatWindow=E('i','mission-heat-window'),heatTarget=E('i','mission-heat-target'),heatNeedle=E('i','mission-heat-needle');heatMeter.append(heatFill,heatWindow,heatTarget,heatNeedle);
  const heatLegend=E('div','mission-heat-legend');heatLegend.append(E('span','','太早'),E('strong','','綠格鬆手'),E('span','','過熱'));
  const heatActions=E('div','mission-heat-actions'),heatHold=E('button','mission-heat-hold','按住送電'),heatRetry=E('button','mission-heat-retry','重試本段');heatHold.type=heatRetry.type='button';heatHold.setAttribute('aria-label','按住送電，在綠格內放開斷電');heatHold.setAttribute('aria-pressed','false');heatActions.append(heatHold,heatRetry);heat.append(heatHeading,heatSteps,heatReadout,heatCondition,heatTotal,heatMeter,heatLegend,heatHint,heatActions);
  const vcr=E('div','mission-vcr');vcr.hidden=true;vcr.setAttribute('aria-hidden','true');const vcrLabel=E('span','mission-vcr-label'),vcrTime=E('span','mission-vcr-timecode'),vcrSymbol=E('strong','mission-vcr-symbol');
  const vcrDeck=E('div','mission-vcr-deck'),deckHeader=E('span','mission-vcr-deck-header','WULING · ARCHIVE 711'),deckWheels=E('div','mission-vcr-wheels'),deckWheelL=E('i','mission-vcr-wheel mission-vcr-reel'),deckWheelR=E('i','mission-vcr-wheel mission-vcr-reel'),deckCaption=E('span','mission-vcr-deck-caption','磁帶影像回溯');deckWheels.append(deckWheelL,E('i','mission-vcr-tape'),deckWheelR);vcrDeck.append(deckHeader,deckWheels,deckCaption);
  const vcrScan=E('div','mission-vcr-scan'),vcrTimeline=E('div','mission-vcr-timeline'),vcrTimelineFill=E('i','mission-vcr-timeline-fill'),vcrFrame=E('span','mission-vcr-frame');vcrTimeline.append(vcrTimelineFill);vcr.append(vcrLabel,vcrTime,vcrSymbol,vcrDeck,vcrScan,vcrTimeline,vcrFrame);
  root.append(inspection,launch,panel,status,pause,cameraReset,combat,completed,caption,connection,heat,vcr);mount.append(root);
  let disposed=false,lastChoices='',lastPhase='',lastFeedback=-1,lastNode='',keyLayout='',pointerPeriod=METER_PERIOD,clockRunning=true,sourceAnchor=0,performanceAnchor=performance.now(),leverPointer=null,heatPointer=null,heatRetryArmed=false,wasAttackHeld=false,lastHeatRound=-1,heatDuration=2500;
  const pointerAnimation=pointer.animate?pointer.animate([{transform:'translateX(0%)'},{transform:'translateX(100%)'},{transform:'translateX(0%)'}],{duration:METER_PERIOD*1000,iterations:Infinity,easing:'linear'}):null;pointerAnimation?.pause();
  const heatNeedleAnimation=heatNeedle.animate?heatNeedle.animate([{transform:'translateX(0%)'},{transform:'translateX(100%)'}],{duration:heatDuration,fill:'both',easing:'linear'}):null;
  const heatFillAnimation=heatFill.animate?heatFill.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:heatDuration,fill:'both',easing:'linear'}):null;
  heatNeedleAnimation?.pause();heatFillAnimation?.pause();
  const machine=new MissionMachine({onDinner,onGesture,onStage,onAttack,onState,onAction});
  const cancelSpeech=()=>{if('speechSynthesis'in window)window.speechSynthesis.cancel();};
  function resetAnchor(){sourceAnchor=machine.sourceTime;performanceAnchor=performance.now();}
  function syncPointer(s,force=false){
    if(pointerAnimation){if(pointerPeriod!==s.meterPeriod){pointerPeriod=s.meterPeriod;pointerAnimation.effect.updateTiming({duration:pointerPeriod*1000});force=true;}const wanted=(s.meterElapsed%s.meterPeriod)*1000;if(force||!clockRunning||s.paused||document.hidden||Math.abs((Number(pointerAnimation.currentTime)||0)-wanted)>120)pointerAnimation.currentTime=wanted;if(clockRunning&&!s.paused&&!document.hidden&&['combat','aim-final'].includes(s.phase))pointerAnimation.play();else pointerAnimation.pause();}
    else pointer.style.transform=`translateX(${s.meter*100}%)`;
  }
  function syncHeatPointer(s,force=false){
    const h=s.heat||{},span=Number(h.pulseSpan)||.2,rate=Number(h.rate)||.08,pulse=Math.max(0,Number(h.pulseTime)||0),duration=span/rate*1000,round=Number(h.round)||0;
    const animations=[heatNeedleAnimation,heatFillAnimation],wanted=Math.min(duration,pulse/rate*1000);
    if(heatDuration!==duration){heatDuration=duration;for(const animation of animations)animation?.effect.updateTiming({duration});force=true;}
    if(lastHeatRound!==round){lastHeatRound=round;force=true;}
    for(const animation of animations){
      if(!animation)continue;
      if(force||!h.holding||!clockRunning||s.paused||document.hidden||Math.abs((Number(animation.currentTime)||0)-wanted)>100)animation.currentTime=wanted;
      if(s.phase==='heat'&&h.holding&&clockRunning&&!s.paused&&!document.hidden)animation.play();else animation.pause();
    }
    if(!heatNeedleAnimation)heatNeedle.style.transform=`translateX(${Math.min(1,pulse/span)*100}%)`;
    if(!heatFillAnimation)heatFill.style.transform=`scaleX(${Math.min(1,pulse/span)})`;
  }
  function buildKeys(field){
    if(keyLayout===field)return;keyLayout=field;keys.replaceChildren();keys.dataset.layout=field;
    const values=field==='password'?['1','2','3','4','5','6','7','8','9','backspace','0','submit']:[...'abcdefghijklmnopqrstuvwxyz','_','backspace'];
    for(const value of values){const b=E('button','mission-key',value==='backspace'?'⌫':value==='submit'?'確認':value);b.type='button';b.dataset.key=value;if(value==='backspace')b.setAttribute('aria-label','刪除上一個字元');keys.append(b);}
  }
  function render(force=false){
    if(disposed)return;const s=machine.state,active=!['ready','complete'].includes(s.phase),isCombat=['combat','aim-final'].includes(s.phase),isCharge=s.phase==='charge',isConnection=connectionPhases.has(s.phase),isVcr=s.vcr??vcrPhases.has(s.phase),c=s.connection||s.login||{},h=s.heat||{};
    root.dataset.phase=s.phase;root.dataset.paused=String(s.paused);root.dataset.clockRunning=String(clockRunning&&!document.hidden);mount.dataset.missionPhase=s.phase;
    cameraReset.hidden=typeof onCameraReset!=='function'||s.phase==='ready';
    mount.classList.toggle('mission-ready',s.phase==='ready');mount.classList.toggle('mission-active',active);mount.classList.toggle('mission-running',runningPhases.has(s.phase));mount.classList.toggle('mission-complete',s.phase==='complete');mount.classList.toggle('mission-vcr-active',isVcr);
    launch.hidden=inspection.hidden=s.phase!=='ready';panel.hidden=(!s.node&&s.phase!=='choice')||isConnection||s.phase==='heat'||s.phase==='aim-final';
    comm.hidden=s.speaker!=='mifoe';panel.classList.toggle('has-comm',s.speaker==='mifoe');panel.dataset.mood=s.node?.mood||'calm';
    if(lastNode!==s.nodeId){panel.classList.toggle('is-angry',s.node?.mood==='anger');panel.classList.toggle('is-evidence',s.node?.mood==='evidence');lastNode=s.nodeId;}
    panel.classList.toggle('has-choices',s.phase==='choice');panel.classList.toggle('is-timed',['charge','landing','heat-demo','return'].includes(s.phase));
    setText(name,s.phase==='choice'?'莊芳宜':speakers[s.speaker]||'通訊');name.dataset.speaker=s.speaker||'';setText(chapter,phaseTitles[s.phase]||'');setText(text,s.phase==='choice'?'晚餐，你幫我挑。':s.text.slice(0,s.revealed));
    const manual=manualPhases.has(s.phase)&&!!s.node;line.disabled=!manual||s.paused;next.hidden=!manual;controls.hidden=!manual;setText(auto,s.auto?'自動：開':'自動');auto.setAttribute('aria-pressed',String(s.auto));auto.disabled=skip.disabled=s.paused;setText(hint,s.paused?'已暫停':'點台詞繼續');
    const choiceSignature=s.choices.map(v=>v.id).join(',');if(choiceSignature!==lastChoices){choices.replaceChildren();for(const item of s.choices){const b=E('button','mission-choice');b.type='button';b.dataset.choice=item.id;b.append(E('span','mission-choice-label',item.label),E('span','mission-choice-hint',item.hint));choices.append(b);}lastChoices=choiceSignature;}for(const b of choices.children)b.disabled=s.paused;
    status.hidden=isVcr||isConnection||s.phase==='tour'||(!runningPhases.has(s.phase)&&!(s.phase==='complete'&&s.phaseElapsed<2.8));
    setText(statusTitle,s.phase==='complete'?'任務完成':isCharge?'全城儲能接通':s.phase==='last'||s.phase==='aim-final'?'摧毀最後機櫃':s.phase==='finisher'?'龍泡泡 · 最後一擊':s.phase==='landing'?'目標停止運作':'任務進度');
    const shown=isCharge?s.charge:s.progress;setText(value,`${Math.floor(shown)}%`);statusFill.style.transform=`scaleX(${shown/100})`;pause.hidden=['ready','complete'].includes(s.phase);setText(pause,s.paused?'繼續':'暫停');pause.setAttribute('aria-pressed',String(s.paused));
    combat.hidden=!isCombat;setText(target,s.phase==='aim-final'?'最後目標 · 伺服器':`目標 · ${s.targetLabel}`);outputs.hidden=s.phase!=='combat';finalSeal.hidden=s.phase!=='aim-final';combat.classList.toggle('is-final',s.phase==='aim-final');
    if(s.phase==='aim-final'){const index=Math.min(2,Math.floor(s.phaseElapsed/3));setText(finalQuote,s.text||['不對吧？我現在是彈藥？','等一下，哪裡搞錯了。','我說的不是方向——'][index]);finalPortrait.dataset.expression=['shock','doubt','panic'][index];finalPortrait.setAttribute('aria-label',['龍泡泡錯愕','龍泡泡懷疑人生','龍泡泡慌張'][index]);}
    for(const b of outputs.children){b.setAttribute('aria-pressed',String(b.dataset.output===s.output));b.disabled=s.paused;b.title=s.outputModes.find(mode=>mode.id===b.dataset.output)?.hint||'';}
    setText(energy,s.phase==='aim-final'?'主砲耗盡 · 此發不退':`能量 ${Math.ceil(s.energy)}% · ${s.meterSettings.label} · 節奏 ${s.meterSettings.stage+1}`);
    sweet.style.left=`${50-s.meterSettings.width*100}%`;sweet.style.width=`${s.meterSettings.width*200}%`;perfect.style.left=`${50-s.meterSettings.perfect*100}%`;perfect.style.width=`${s.meterSettings.perfect*200}%`;const edge=(.5-s.meterSettings.miss)*100;meter.style.background=`linear-gradient(90deg,#62747388 0% ${edge}%,#9f956755 ${edge}% ${100-edge}%,#62747388 ${100-edge}%)`;
    setText(attack,s.phase==='aim-final'?'發射龍泡泡':'砲擊');attack.disabled=!s.canAttack;meter.setAttribute('aria-valuenow',String(Math.round(s.meter*100)));
    if(s.feedback&&s.feedback.number!==lastFeedback){lastFeedback=s.feedback.number;setText(feedback,{miss:'MISS · 重新聚焦',hit:'命中',strong:'強擊',perfect:'完美重擊'}[s.feedback.result]);feedback.dataset.result=s.feedback.result;}else if(lastPhase!==s.phase){setText(feedback,s.phase==='aim-final'?'對準中央，按下發射':'按中中央，威力更強');delete feedback.dataset.result;}
    if(s.combatHoldRemaining>0)setText(feedback,'招牌正在落下……');else if(wasAttackHeld)setText(feedback,'招牌已落地。繼續砲擊。');wasAttackHeld=s.combatHoldRemaining>0;
    completed.hidden=s.phase!=='complete'||!!s.node;caption.classList.toggle('visible',s.phase==='tour'&&s.phaseElapsed<4);
    connection.hidden=!isConnection;connectionQuote.hidden=s.phase==='login';login.hidden=s.phase!=='login';captcha.hidden=s.phase!=='captcha';lever.hidden=s.phase!=='lever';setText(connectionHeading.lastElementChild,s.phase==='login'?(c.field==='password'?'02 / 密碼':'01 / 帳號'):s.phase==='captcha'?'03 / 身分驗證':'04 / 接通');
    if(isConnection){setText(connectionQuote,s.text||(s.phase==='login'?'莊芳宜：「我在忙。幫我連線。」':s.phase==='captcha'?'莊芳宜：「勾『我不是機器人』。」':'莊芳宜：「拉到底。」'));connectionQuote.dataset.speaker=s.speaker||'zhuang';}
    if(s.phase==='login'){const field=c.field||'account';buildKeys(field);setText(loginLabel,field==='password'?'莊：密碼 5201314。':'莊：帳號 endfield_power。');setText(loginValue,c.value||'＿');loginValue.classList.toggle('is-empty',!c.value);setText(loginExpected,field==='password'?'5201314':'endfield_power');setText(loginSubmit,field==='password'?'登入儲能網':'確認帳號');setText(loginError,c.error||'點鍵帽，龍泡泡會替你踩下。');loginError.classList.toggle('is-error',!!c.error);for(const b of keys.children)b.disabled=s.paused;loginSubmit.disabled=promptReplay.disabled=s.paused;}
    captchaCheck.disabled=s.paused||!c.captchaReady;captchaCheck.setAttribute('aria-checked',String(!!c.verified));captcha.classList.toggle('is-ready',!!c.captchaReady);leverThumb.disabled=s.paused;leverThumb.setAttribute('aria-valuenow',String(Math.round((c.lever||0)*100)));leverTrack.style.setProperty('--lever',String(c.lever||0));
    heat.hidden=s.phase!=='heat';
    if(s.phase==='heat'){
      const heatStatus=h.status||'ready',round=Math.min(2,Math.max(0,Number(h.round)||0)),completed=Math.min(3,Math.max(0,Number(h.completed)||0)),pulse=Math.max(0,Number(h.pulseTime)||0),span=Number(h.pulseSpan)||.2;
      heat.dataset.status=heatStatus;heat.dataset.round=String(round);heat.dataset.result=h.lastResult||'';setText(heatHeading.lastElementChild,`${String(round+1).padStart(2,'0')} / 03`);
      for(let i=0;i<heatSteps.children.length;i++){const step=heatSteps.children[i];step.classList.toggle('is-done',i<completed);step.classList.toggle('is-current',i===round&&completed<3);step.setAttribute('aria-current',i===round?'step':'false');setText(step.firstElementChild,i<completed?'✓':String(i+1));}
      setText(heatTime,pulse.toFixed(2));setText(heatTotal,`合計 ${Math.min(.3,Number(h.electricalTime)||0).toFixed(2)} / 0.30 秒`);
      setText(heatCondition,heatStatus==='ready'?(completed?`第 ${round+1} 段準備`:'每段 0.10 秒'):heatStatus==='heating'?'綠格鬆手':{cold:'太早，未穩定',burnt:'過熱，燒焦了',won:'三段完成'}[heatStatus]);
      setText(heatHint,heatStatus==='cold'?'重試本段；前面已穩住的會保留。':heatStatus==='burnt'?'換份便當，三段重新來。下次早一點放開。':heatStatus==='heating'?'看白線進綠格，再放開。每段只送 0.10 秒。':completed?`第 ${completed} 段穩了。再按住送電，這段更快。`:'按住送電，綠格鬆手。連穩三段，共 0.30 秒。');
      const low=Number(h.successMin)||.075,high=Number(h.successMax)||.125;heatWindow.style.left=`${low/span*100}%`;heatWindow.style.width=`${(high-low)/span*100}%`;heatTarget.style.left=`${(Number(h.pulseTarget)||.1)/span*100}%`;
      heatMeter.setAttribute('aria-valuenow',String(Math.round(pulse*100)));heatMeter.setAttribute('aria-valuetext',`第 ${round+1} 段，${pulse.toFixed(2)} 秒，目標 0.10 秒`);
      const heatFailed=['cold','burnt','won'].includes(heatStatus);
      setText(heatHold,h.holding?'放開斷電':heatPointer!==null?'放開結束':completed?'按住下一段':'按住送電');heatHold.setAttribute('aria-pressed',String(!!h.holding));heatHold.setAttribute('aria-disabled',String(s.paused||heatFailed));heatHold.disabled=s.paused||(heatFailed&&heatPointer===null);
      setText(heatRetry,heatStatus==='burnt'?'換份重來':'重試本段');heatRetry.hidden=false;heatRetry.disabled=s.paused||!['cold','burnt'].includes(heatStatus);
    }
    vcr.hidden=!isVcr;
    if(isVcr){
      const rew=s.phase==='rewind',returning=s.phase==='return',elapsed=Math.max(0,Number(s.vcrElapsed)||0),progress=rew?Math.max(0,Math.min(1,s.rewindProgress||0)):returning?Math.max(0,Math.min(1,s.returnProgress||0)):0;
      const transport=rew?(s.rewindStage||(s.phaseElapsed<.4?'freeze':s.phaseElapsed>=6.4?'settle':'reverse')):returning?'return':'play',seconds=rew?Math.max(0,180-Math.floor(progress*180)):Math.floor(Math.max(0,elapsed-7));
      vcr.dataset.mode=rew?'rewind':returning?'return':'play';vcr.dataset.transport=transport;
      vcr.style.setProperty('--rewind-progress',String(progress));vcr.style.setProperty('--scan-offset',`${Math.round((progress*5%1)*100)}%`);vcr.style.setProperty('--tape-offset',`${Math.round(progress*1344)}px`);vcr.style.setProperty('--rewind-jitter',`${transport==='reverse'?Math.sin(progress*183)*1.1:0}px`);
      setText(vcrLabel,rew?(transport==='freeze'?'VCR · 現場鎖定':transport==='settle'?'VCR · 三分鐘前':'VCR · 時間倒帶'):returning?'現場接回':'CAM 02 · 店內監控');setText(vcrSymbol,rew?(transport==='freeze'?'Ⅱ HOLD':transport==='settle'?'▶ 記錄就緒':'◀◀ REW'):returning?'▶ RETURN':'● REC');
      setText(vcrTime,`21:${String(42+Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`);setText(deckCaption,transport==='freeze'?'鎖定現場畫格':transport==='settle'?'店門口 · 三分鐘前':returning?'重新同步現場':'磁帶影像回溯');
      const angle=motionQuery?.matches?0:(rew?-1:1)*progress*2160;deckWheelL.style.transform=`rotate(${angle}deg)`;deckWheelR.style.transform=`rotate(${angle*.89}deg)`;vcrSymbol.style.opacity=transport==='reverse'&&!motionQuery?.matches?String(.55+.45*Math.sin(progress*24*Math.PI)**2):'1';vcrTimelineFill.style.transform=`scaleX(${rew?1-progress:progress})`;setText(vcrFrame,`FRAME ${String(Math.round(seconds*30)).padStart(5,'0')}`);
    }
    if(lastPhase!==s.phase&&lastPhase==='login'||s.paused||document.hidden)cancelSpeech();syncPointer(s,force||lastPhase!==s.phase);syncHeatPointer(s,force||lastPhase!==s.phase);lastPhase=s.phase;
  }
  function inputSource(event){if(!clockRunning||machine.paused||document.hidden)return machine.sourceTime;let stamp=Number(event?.timeStamp);if(!Number.isFinite(stamp))stamp=performance.now();if(stamp>1e12)stamp-=performance.timeOrigin;if(Math.abs(stamp-performance.now())>60000)stamp=performance.now();return sourceAnchor+(stamp-performanceAnchor)/1000;}
  function fire(event){if(event?.isPrimary===false||event?.button>0)return;event?.preventDefault();const result=machine.attack(inputSource(event));render();return result;}
  function act(method,...args){const result=machine[method](...args);render();return result;}
  function replayPrompt(){const result=machine.replayPrompt();if('speechSynthesis'in window&&'SpeechSynthesisUtterance'in window){cancelSpeech();const utterance=new SpeechSynthesisUtterance(machine.state.connection.field==='password'?'密碼，五，二，零，一，三，一，四。':'帳號，endfield，底線，power。');utterance.lang='zh-TW';utterance.rate=.88;window.speechSynthesis.speak(utterance);}render();return result;}
  listen(launch,'click',()=>{machine.start();render(true);});listen(line,'click',()=>act('next'));listen(choices,'click',event=>{const b=event.target.closest('[data-choice]');if(b){machine.choose(b.dataset.choice);render(true);}});
  listen(auto,'click',()=>{machine.setAuto(!machine.auto);render();});listen(skip,'click',()=>{machine.skip();render(true);});listen(outputs,'click',event=>{const b=event.target.closest('[data-output]');if(b){machine.setOutput(b.dataset.output);render(true);}});
  listen(pause,'click',()=>{machine.setPaused(!machine.paused);resetAnchor();render(true);});listen(replay,'click',()=>{cancelSpeech();machine.replay();lastFeedback=-1;render(true);});listen(attack,'pointerdown',fire);listen(attack,'click',event=>{if(event.detail===0)fire(event);});
  listen(cameraReset,'click',()=>{onCameraReset?.();cameraReset.blur();});
  listen(keys,'click',event=>{const b=event.target.closest('[data-key]');if(!b)return;if(b.dataset.key==='submit')act('submitLogin');else act('key',b.dataset.key);});listen(loginSubmit,'click',()=>act('submitLogin'));listen(promptReplay,'click',replayPrompt);listen(captchaCheck,'click',()=>act('verify'));
  function moveLever(event){if(event.pointerId!==leverPointer)return;const box=leverTrack.getBoundingClientRect(),thumbWidth=leverThumb.getBoundingClientRect().width;act('setLever',Math.max(0,Math.min(1,(event.clientX-box.left-thumbWidth/2)/Math.max(1,box.width-thumbWidth))));}
  listen(leverTrack,'pointerdown',event=>{if(machine.paused||event.isPrimary===false||event.button>0)return;event.preventDefault();leverPointer=event.pointerId;leverTrack.setPointerCapture(event.pointerId);moveLever(event);});listen(leverTrack,'pointermove',moveLever);
  listen(leverTrack,'pointerup',event=>{if(event.pointerId!==leverPointer)return;moveLever(event);leverPointer=null;if(leverTrack.hasPointerCapture(event.pointerId))leverTrack.releasePointerCapture(event.pointerId);});
  listen(leverTrack,'pointercancel',event=>{if(event.pointerId!==leverPointer)return;leverPointer=null;if(machine.phase==='lever')act('setLever',0);});listen(leverThumb,'keydown',event=>{if(!['ArrowRight','ArrowLeft','Home','End','Enter',' '].includes(event.key))return;event.preventDefault();const current=machine.state.connection.lever;act('setLever',event.key==='Home'?0:['End','Enter',' '].includes(event.key)?1:Math.max(0,Math.min(1,current+(event.key==='ArrowRight'?.1:-.1))));});
  function heatBegin(event){if(event?.isPrimary===false||event?.button>0||heatHold.disabled||machine.state.heat.status!=='ready')return;event?.preventDefault();if(event?.pointerId!==undefined){heatPointer=event.pointerId;heatHold.setPointerCapture(event.pointerId);}act('heatStart',inputSource(event));}
  function heatEnd(event){if(event?.pointerId!==undefined&&event.pointerId!==heatPointer)return;event?.preventDefault();heatPointer=null;act('heatStop',inputSource(event));}
  function cancelHeat(){heatPointer=null;if(machine.phase==='heat'&&machine.state.heat?.holding)act('heatCancel');else render();}
  listen(heatHold,'pointerdown',heatBegin);listen(heatHold,'pointerup',heatEnd);listen(heatHold,'pointercancel',cancelHeat);listen(heatHold,'lostpointercapture',()=>{if(heatPointer!==null&&machine.state.heat?.holding)cancelHeat();});
  listen(heatHold,'click',event=>{if(event.detail===0&&!heatHold.disabled){if(machine.state.heat.holding)heatEnd(event);else heatBegin(event);}});listen(heatHold,'keydown',event=>{if(['Space','Enter'].includes(event.code)&&!event.repeat)heatBegin(event);});listen(heatHold,'keyup',event=>{if(['Space','Enter'].includes(event.code))heatEnd(event);});listen(heatRetry,'pointerdown',event=>{heatRetryArmed=event.isPrimary!==false&&!(event.button>0);});listen(heatRetry,'pointercancel',()=>{heatRetryArmed=false;});listen(heatRetry,'click',event=>{if(event.detail!==0&&!heatRetryArmed)return;heatRetryArmed=false;act('heatRetry');});
  listen(document,'keydown',event=>{
    if(machine.phase==='login'&&!machine.paused&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.target.closest('input,select,textarea,[contenteditable=true]')){const field=machine.state.connection.field;if(event.key==='Enter'){event.preventDefault();act('submitLogin');}else if(event.key==='Backspace'){event.preventDefault();act('key','backspace');}else if((field==='password'?/^[0-9]$/:/^[a-z_]$/i).test(event.key)){event.preventDefault();act('key',event.key.toLowerCase());}return;}
    if(event.code!=='Space'||event.repeat||event.target.closest('input,select,textarea,[contenteditable=true]')||(event.target!==attack&&event.target.closest('button,a,summary'))||!['combat','aim-final'].includes(machine.phase))return;fire(event);
  });
  listen(window,'blur',cancelHeat);listen(document,'visibilitychange',()=>{if(document.hidden){cancelHeat();cancelSpeech();}resetAnchor();render(true);});render(true);
  return {machine,get state(){return machine.state;},start(){machine.start();render(true);return true;},replay(){cancelSpeech();machine.replay();lastFeedback=-1;render(true);return true;},next:()=>act('next'),choose(id){const result=machine.choose(id);render(true);return result;},attack:time=>act('attack',time),selectTarget:id=>act('selectTarget',id),setTargets(targets){machine.setTargets(targets);render();},setOutput(id){const result=machine.setOutput(id);render(true);return result;},
    holdAttack:seconds=>act('holdAttack',seconds),key:value=>act('key',value),submitLogin:()=>act('submitLogin'),replayPrompt,verify:()=>act('verify'),setLever:value=>act('setLever',value),heatStart:time=>act('heatStart',time),heatStop:time=>act('heatStop',time),heatRetry:()=>act('heatRetry'),heatCancel:cancelHeat,
    setPaused(value){if(value){cancelHeat();cancelSpeech();}machine.setPaused(value);resetAnchor();render(true);},setAuto(value){machine.setAuto(value);render();},hotspot:kind=>act('hotspot',kind),update(time){machine.update(time);resetAnchor();render();},setClockRunning(value){clockRunning=Boolean(value);if(!clockRunning)cancelSpeech();resetAnchor();render(true);},
    dispose(){if(disposed)return;disposed=true;cancelSpeech();events.abort();pointerAnimation?.cancel();heatNeedleAnimation?.cancel();heatFillAnimation?.cancel();root.remove();for(const c of ['mission-ready','mission-active','mission-running','mission-complete','mission-vcr-active'])mount.classList.remove(c);delete mount.dataset.missionPhase;},
  };
}
