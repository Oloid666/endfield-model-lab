import {portrait as setPortrait} from './portrait.js';
import {createInvestigationUI} from './investigation-ui.js';
import './mission.css';
import {MissionMachine,METER_PERIOD} from './mission-state.js';
import {speakers,endingCaption,endingSong,reactionPools} from './mission-dialogue.js';

const E=(tag,className,text)=>{const e=document.createElement(tag);e.className=className;if(text!==undefined)e.textContent=text;return e;};
const setText=(node,text)=>{const value=String(text??'');if(node.textContent!==value)node.textContent=value;};
const runningPhases=new Set(['login','captcha','lever','ascent','director-reminder','shoe-view','pylon-link','charge','fire-ready','combat','energy','rewind','flashback','hack','credentials','heat-demo','heat','flashback-end','return','last','aim-final','finisher','landing','tour']);
const manualPhases=new Set(['intro','meal','cargo','photo-talk','photo-check','verify-talk','verified-talk','observation','credentials','briefing','energy','flashback','flashback-end','last','complete']);
const connectionPhases=new Set(['login','captcha','lever']);
const vcrPhases=new Set(['rewind','flashback','hack','credentials','heat-demo','heat','flashback-end','return']);
const phaseTitles={cargo:'02 · 萬噸土產',observation:'02 · 照片裡的異常',credentials:'VCR · 門鎖與鑰匙',intro:'01 · 先吃晚餐',purchase:'01 · 龍泡泡結帳中',ascent:'03 · 允許起飛','director-reminder':'03 · 導播補拍',choice:'01 · 今晚，吃什麼',meal:'01 · 買好晚餐',briefing:'02 · 梨花旁的燈',login:'03 · 請幫我連線',captcha:'03 · 驗證身分',lever:'03 · 接通儲能網',charge:'03 · 儲能接通','fire-ready':'04 · 發射系統',combat:'04 · 光害改善',energy:'04 · 電去哪裡了',rewind:'VCR · 倒帶中',flashback:'VCR · 三小時前', 'heat-demo':'VCR · 加熱試驗',heat:'VCR · 極速加熱', 'flashback-end':'VCR · 沒關掉的設定',return:'回到現場',last:'05 · 最後一發','aim-final':'05 · 龍泡泡，準備',finisher:'05 · 最後一擊',landing:'任務完成',tour:'武陵 · 現場紀錄',complete:'武陵 · 聽雨'};


export function createMission({mount=document.querySelector('#app'),onDinner,onGesture,onStage,onRestore,onAttack,onState,onAction,onCameraReset,capturePhoto,onCameraAuto,getCameraAuto}={}){
  if(!mount)throw Error('Mission mount is required.');
  const motionQuery=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const events=new AbortController(),listen=(target,type,fn,options={})=>target.addEventListener(type,fn,{...options,signal:events.signal});
  const root=E('section','mission-shell');root.setAttribute('aria-label','莊的晚餐與光害改善任務');
  const inspection=E('p','mission-inspection');inspection.append(E('span','','點點招牌或梨花試試。按「去買晚餐」開始故事。'),E('span','','視角重複按即可切換；拖曳旋轉，雙指縮放。'));
  const launch=E('button','mission-launch');launch.type='button';launch.append(E('span','mission-kicker','一場雨，一頓飯。'),E('span','mission-launch-title','去買晚餐'),E('span','mission-launch-arrow','↗'));
  const panel=E('div','mission-panel');panel.hidden=true;
  const comm=E('div','mission-comm');comm.hidden=true;comm.setAttribute('aria-label','弭弗的巡衛通訊');
  const portrait=E('div','mission-comm-portrait');portrait.setAttribute('role','img');portrait.setAttribute('aria-label','通訊人物肖像');const portraitImage=E('img','mission-comm-art');setPortrait(portraitImage);portraitImage.alt='';portraitImage.decoding='async';portrait.append(portraitImage);
  const commInfo=E('div','mission-comm-info');commInfo.append(E('span','mission-comm-kicker','WULING GUARD · 巡衛通訊'),E('strong','','弭弗'),E('span','mission-comm-caption','武陵巡衛隊長 · 通訊已接通'));
  const signal=E('span','mission-comm-signal');signal.setAttribute('aria-hidden','true');for(let i=0;i<13;i++){const b=E('i','');b.style.setProperty('--wave-height',`${5+(i*7%17)}px`);signal.append(b);}comm.append(portrait,commInfo,signal);
  const bar=E('div','mission-bar'),name=E('span','mission-name'),chapter=E('span','mission-chapter');bar.append(name,chapter);
  const line=E('button','mission-line');line.type='button';line.setAttribute('aria-label','顯示完整台詞或下一句');
  const text=E('span','mission-text'),next=E('span','mission-next','⌄');line.append(text,next);
  const choices=E('div','mission-choices');choices.setAttribute('aria-label','請選擇晚餐');
  const controls=E('div','mission-controls'),auto=E('button','mission-auto','自動'),skip=E('button','mission-skip','略過本段'),hint=E('span','mission-read-hint','點台詞繼續');auto.type=skip.type='button';controls.append(hint);panel.append(comm,bar,line,choices,controls);
  const combatAside=E('p','combat-aside');combatAside.hidden=true;root.append(combatAside);
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
  const completed=E('div','mission-completed'),completeText=E('span','mission-complete-text','100% · 任務完成'),replay=E('button','mission-replay','重拍這個雨夜');replay.type='button';completed.append(completeText,replay);
  const receipt=E('img','album-receipt');receipt.src=`${import.meta.env.BASE_URL}images/receipt.svg`;receipt.alt='手機相簿下一張：息壤簽收單，簽收人龍泡泡';receipt.hidden=true;root.append(receipt);
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

  const vcr=E('div','mission-vcr');vcr.hidden=true;vcr.setAttribute('aria-hidden','true');const vcrLabel=E('span','mission-vcr-label'),vcrTime=E('span','mission-vcr-timecode'),vcrSymbol=E('strong','mission-vcr-symbol');
  const vcrDeck=E('div','mission-vcr-deck'),deckHeader=E('span','mission-vcr-deck-header','WULING · ARCHIVE 711'),deckWheels=E('div','mission-vcr-wheels'),deckWheelL=E('i','mission-vcr-wheel mission-vcr-reel'),deckWheelR=E('i','mission-vcr-wheel mission-vcr-reel'),deckCaption=E('span','mission-vcr-deck-caption','磁帶影像回溯');deckWheels.append(deckWheelL,E('i','mission-vcr-tape'),deckWheelR);vcrDeck.append(deckHeader,deckWheels,deckCaption);
  const vcrScan=E('div','mission-vcr-scan'),vcrTimeline=E('div','mission-vcr-timeline'),vcrTimelineFill=E('i','mission-vcr-timeline-fill'),vcrFrame=E('span','mission-vcr-frame');vcrTimeline.append(vcrTimelineFill);vcr.append(vcrLabel,vcrTime,vcrSymbol,vcrDeck,vcrScan,vcrTimeline,vcrFrame);
  const loginAside=E('p','login-dragon-aside');root.append(loginAside);
  const assist=E('button','mission-assist','需要龍泡泡代勞嗎？跳過操作 →');assist.type='button';assist.hidden=true;listen(assist,'click',()=>{machine.assist();render(true);});root.append(assist);
  const sending=E('div','photo-sending');sending.hidden=true;sending.append(E('span','','▧'),E('strong','','照片傳送中 →'));root.append(sending);
  root.append(inspection,launch,panel,status,pause,cameraReset,combat,completed,caption,connection,vcr);mount.append(root);
  let disposed=false,lastChoices='',lastPhase='',lastFeedback=-1,lastNode='',keyLayout='',pointerPeriod=METER_PERIOD,clockRunning=true,sourceAnchor=0,performanceAnchor=performance.now(),leverPointer=null,wasAttackHeld=false;
  const pointerAnimation=pointer.animate?pointer.animate([{transform:'translateX(0%)'},{transform:'translateX(100%)'},{transform:'translateX(0%)'}],{duration:METER_PERIOD*1000,iterations:Infinity,easing:'linear'}):null;pointerAnimation?.pause();
  let investigation;
  const machine=new MissionMachine({onDinner,onGesture,onStage,onRestore,onAttack,onState:state=>{onState?.(state);if(investigation)render();},onAction});
  investigation=createInvestigationUI({mount,machine,capture:capturePhoto,onAuto:onCameraAuto,getAuto:getCameraAuto});
  const cancelSpeech=()=>{if('speechSynthesis'in window)window.speechSynthesis.cancel();};
  function resetAnchor(){sourceAnchor=machine.sourceTime;performanceAnchor=performance.now();}
  function syncPointer(s,force=false){
    if(pointerAnimation){if(pointerPeriod!==s.meterPeriod){pointerPeriod=s.meterPeriod;pointerAnimation.effect.updateTiming({duration:pointerPeriod*1000});force=true;}const wanted=(s.meterElapsed%s.meterPeriod)*1000;if(force||!clockRunning||s.paused||document.hidden||Math.abs((Number(pointerAnimation.currentTime)||0)-wanted)>120)pointerAnimation.currentTime=wanted;if(clockRunning&&!s.paused&&!document.hidden&&['combat','aim-final'].includes(s.phase))pointerAnimation.play();else pointerAnimation.pause();}
    else pointer.style.transform=`translateX(${s.meter*100}%)`;
  }
  function buildKeys(field){
    if(keyLayout===field)return;keyLayout=field;keys.replaceChildren();keys.dataset.layout=field;
    const values=field==='password'?['1314','8888','520','0000','backspace']:['boss','power','love','endfield','kiss','admin','_','backspace'];
    for(const value of values){const b=E('button','mission-key',value==='backspace'?'⌫':value==='submit'?'確認':value);b.type='button';b.dataset.key=value;if(value==='backspace')b.setAttribute('aria-label','刪除上一個字元');keys.append(b);}
  }
  function render(force=false){
    if(disposed)return;const s=machine.state,active=!['ready','complete'].includes(s.phase),isCombat=['combat','aim-final'].includes(s.phase),isCharge=['ascent','director-reminder','shoe-view','pylon-link','charge','fire-ready'].includes(s.phase),isConnection=connectionPhases.has(s.phase),isVcr=s.vcr??vcrPhases.has(s.phase),c=s.connection||s.login||{},h=s.heat||{};
    // Read the document on its reveal and itemization, then return to the people.
    assist.hidden=!s.canAssist;assist.disabled=s.paused||s.presentationLocked;sending.hidden=s.phase!=='photo-sending';receipt.hidden=s.phase!=='cargo'||!['cargo_1','cargo_3'].includes(s.nodeId);root.dataset.phase=s.phase;root.dataset.paused=String(s.paused);root.dataset.clockRunning=String(clockRunning&&!document.hidden);mount.dataset.missionPhase=s.phase;
    cameraReset.hidden=true;
    mount.classList.toggle('mission-ready',s.phase==='ready');mount.classList.toggle('mission-active',active);mount.classList.toggle('mission-running',runningPhases.has(s.phase));mount.classList.toggle('mission-complete',s.phase==='complete');mount.classList.toggle('mission-vcr-active',isVcr);
    loginAside.hidden=!['login','verify-talk'].includes(s.phase)||!s.loginAside;setText(loginAside,'龍泡泡：'+s.loginAside);
    launch.hidden=inspection.hidden=s.phase!=='ready';panel.hidden=(!s.node&&s.phase!=='choice')||isConnection||['heat','hack','photo','photo-review','photo-sending','photo-pose','walk-out','comm-request','fire-ready'].includes(s.phase)||s.phase==='aim-final';
    const inCall=['briefing','charge','energy','last'].includes(s.phase)&&s.speaker!=='dragon'&&s.speaker!=='system';comm.hidden=!inCall;portrait.hidden=false;portrait.setAttribute('aria-label',`${speakers[s.speaker]||'現場'}通訊肖像`);if(s.speaker==='mifoe'){if(portrait.dataset.speaker!=='mifoe')setPortrait(portraitImage);}else if(s.speaker==='zhuang'&&portrait.dataset.speaker!=='zhuang'){portraitImage._portraitToken=null;portraitImage.src=`${import.meta.env.BASE_URL}images/zhuang-portrait.jpg`;}portrait.dataset.speaker=s.speaker;commInfo.querySelector('strong').textContent=speakers[s.speaker]||'通訊';commInfo.querySelector('.mission-comm-caption').textContent=s.speaker==='mifoe'?'武陵巡衛隊長 · 通訊已接通':'現場回覆 · 通訊已接通';comm.setAttribute('aria-label',`${speakers[s.speaker]||'現場'}的通訊`);panel.classList.toggle('has-comm',inCall);panel.classList.toggle('dragon-aside',s.speaker==='dragon');panel.classList.toggle('system-line',s.speaker==='system');panel.dataset.mood=s.node?.mood||'calm';
    if(lastNode!==s.nodeId){panel.classList.toggle('is-angry',s.node?.mood==='anger');panel.classList.toggle('is-evidence',s.node?.mood==='evidence');lastNode=s.nodeId;}
    panel.classList.toggle('has-choices',s.phase==='choice');panel.classList.toggle('is-timed',['ascent','director-reminder','charge','landing','heat-demo','return'].includes(s.phase));
    setText(name,s.phase==='choice'?'莊芳宜':speakers[s.speaker]||'通訊');name.dataset.speaker=s.speaker||'';setText(chapter,phaseTitles[s.phase]||'');setText(text,s.phase==='choice'?'晚餐，你幫我挑。':s.text.slice(0,s.revealed));
    if(s.phase==='ready')setText(inspection.firstChild,s.phaseElapsed<6?'點點招牌或梨花試試。按「去買晚餐」開始故事。':reactionPools.waiting[Math.floor(s.phaseElapsed/10)%reactionPools.waiting.length]);
    const manual=manualPhases.has(s.phase)&&!!s.node;line.disabled=!manual||s.paused||s.presentationLocked;next.hidden=false;setText(next,s.paused?'Ⅱ 已暫停':!manual?'⌛ 演出中':s.revealed<s.text.length?'⋯ 點一下顯示全文':'▼ 點一下繼續');controls.hidden=true;setText(auto,s.auto?'自動對話：開':'自動對話');auto.setAttribute('aria-pressed',String(s.auto));auto.disabled=skip.disabled=s.paused;setText(hint,s.paused?'已暫停':'點台詞繼續');
    const choiceSignature=s.choices.map(v=>v.id).join(',');if(choiceSignature!==lastChoices){choices.replaceChildren();for(const item of s.choices){const b=E('button','mission-choice');b.type='button';b.dataset.choice=item.id;b.append(E('span','mission-choice-label',item.label),E('span','mission-choice-hint',item.hint));choices.append(b);}lastChoices=choiceSignature;}for(const b of choices.children)b.disabled=s.paused;
    status.hidden=s.phase==='terminal-deploy'||isVcr||isConnection||s.phase==='tour'||(!runningPhases.has(s.phase)&&!(s.phase==='complete'&&s.phaseElapsed<2.8));
    setText(statusTitle,s.phase==='complete'?'任務完成':isCharge?'全城儲能接通':s.phase==='last'||s.phase==='aim-final'?'摧毀最後機櫃':s.phase==='finisher'?'龍泡泡 · 最後一擊':s.phase==='landing'?'目標停止運作':'光害改善率');
    const shown=isCharge?s.charge:s.progress;setText(value,`${Math.floor(shown)}%`);statusFill.style.transform=`scaleX(${shown/100})`;pause.hidden=['ready','complete'].includes(s.phase);setText(pause,s.paused?'繼續':'暫停');pause.setAttribute('aria-pressed',String(s.paused));
    combat.hidden=!isCombat;setText(target,s.phase==='aim-final'?'最後目標 · 伺服器':`目標 · ${s.targetLabel}`);outputs.hidden=s.phase!=='combat';finalSeal.hidden=s.phase!=='aim-final';combat.classList.toggle('is-final',s.phase==='aim-final');
    if(s.phase==='aim-final'){const index=Math.min(2,Math.floor(s.phaseElapsed/3));setText(finalQuote,s.text||['不對吧？我現在是彈藥？','等一下，哪裡搞錯了。','我說的不是方向——'][index]);finalPortrait.dataset.expression=['shock','doubt','panic'][index];finalPortrait.setAttribute('aria-label',['龍泡泡錯愕','龍泡泡懷疑人生','龍泡泡慌張'][index]);}
    for(const b of outputs.children){b.setAttribute('aria-pressed',String(b.dataset.output===s.output));b.disabled=s.paused;b.title=s.outputModes.find(mode=>mode.id===b.dataset.output)?.hint||'';}
    setText(energy,s.phase==='aim-final'?'主砲耗盡 · 此發不退':`能量 ${Math.ceil(s.energy)}% · ${s.meterSettings.label} · 節奏 ${s.meterSettings.stage+1}`);
    sweet.style.left=`${50-s.meterSettings.width*100}%`;sweet.style.width=`${s.meterSettings.width*200}%`;perfect.style.left=`${50-s.meterSettings.perfect*100}%`;perfect.style.width=`${s.meterSettings.perfect*200}%`;const edge=(.5-s.meterSettings.miss)*100;meter.style.background=`linear-gradient(90deg,#62747388 0% ${edge}%,#9f956755 ${edge}% ${100-edge}%,#62747388 ${100-edge}%)`;
    setText(attack,s.presentationLocked?'裝填演出中…':s.phase==='aim-final'?'發射龍泡泡':'砲擊');attack.disabled=!s.canAttack;meter.setAttribute('aria-valuenow',String(Math.round(s.meter*100)));
    if(s.feedback&&s.feedback.number!==lastFeedback){lastFeedback=s.feedback.number;const firstHit=s.feedback.result!=='miss'&&s.hits===1;setText(combatAside,firstHit?'龍泡泡：外牆壞了！Always open，Seven Eleven～ ♪':(s.feedback.result==='miss'?reactionPools.miss:reactionPools.hit)[(s.feedback.number-1)%3]);setText(feedback,s.feedback.result==='miss'?'MISS':'命中');feedback.dataset.result=s.feedback.result;}else if(lastPhase!==s.phase){setText(feedback,s.phase==='aim-final'?'對準中央，按下發射':'按中中央，威力更強');delete feedback.dataset.result;}
    if(s.combatHoldRemaining>0)setText(feedback,'招牌正在落下……');else if(wasAttackHeld)setText(feedback,'招牌已落地。繼續砲擊。');wasAttackHeld=s.combatHoldRemaining>0;
    combatAside.hidden=s.phase!=='combat'||!s.feedback||s.clock-s.feedback.time>3;
    completed.hidden=s.phase!=='complete'||!!s.node;setText(caption,s.phase==='tour'&&s.phaseElapsed>=14&&s.phaseElapsed<30?endingSong[Math.min(3,Math.floor((s.phaseElapsed-14)/4))]:endingCaption);caption.classList.toggle('visible',s.phase==='tour'&&s.phaseElapsed>=14||s.phase==='complete'&&s.phaseElapsed<5);
    connection.hidden=!isConnection;connectionQuote.hidden=true;login.hidden=s.phase!=='login';captcha.hidden=s.phase!=='captcha';lever.hidden=s.phase!=='lever';setText(connectionHeading.lastElementChild,s.phase==='login'?(c.field==='password'?'02 / 密碼':'01 / 帳號'):s.phase==='captcha'?'03 / 身分驗證':'04 / 接通');
    if(isConnection){setText(connectionQuote,s.text||(s.phase==='login'?'莊芳宜：「我在忙。幫我連線。」':s.phase==='captcha'?'莊芳宜：「勾『我不是機器人』。」':'莊芳宜：「拉到底。」'));connectionQuote.dataset.speaker=s.speaker||'zhuang';}
    if(s.phase==='login'){const field=c.field||'account';buildKeys(field);setText(loginLabel,field==='password'?'莊：密碼 5201314。':'莊：帳號 endfield_power。');setText(loginValue,c.value||'＿');loginValue.classList.toggle('is-empty',!c.value);setText(loginExpected,field==='password'?'5201314':'endfield_power');setText(loginSubmit,field==='password'?'登入儲能網':'確認帳號');setText(loginError,c.error||(c.field==='password'?'便條：5201314。不是寫給資訊組的。':'詞塊可組合，⌫ 刪除上一塊。'));loginError.classList.toggle('is-error',!!c.error);for(const b of keys.children)b.disabled=s.paused;loginSubmit.disabled=promptReplay.disabled=s.paused;}
    captchaCheck.disabled=s.paused||!c.captchaReady;captchaCheck.setAttribute('aria-checked',String(!!c.verified));captcha.classList.toggle('is-ready',!!c.captchaReady);leverThumb.disabled=s.paused;leverThumb.setAttribute('aria-valuenow',String(Math.round((c.lever||0)*100)));leverTrack.style.setProperty('--lever',String(c.lever||0));
    vcr.hidden=!isVcr;
    if(isVcr){
      const rew=s.phase==='rewind',returning=s.phase==='return',elapsed=Math.max(0,Number(s.vcrElapsed)||0),progress=rew?Math.max(0,Math.min(1,s.rewindProgress||0)):returning?Math.max(0,Math.min(1,s.returnProgress||0)):0;
      const transport=rew?(s.rewindStage||(s.phaseElapsed<.4?'freeze':s.phaseElapsed>=6.4?'settle':'reverse')):returning?'return':'play',seconds=rew?Math.max(0,180-Math.floor(progress*180)):Math.floor(Math.max(0,elapsed-7));
      vcr.dataset.mode=rew?'rewind':returning?'return':'play';vcr.dataset.transport=transport;
      vcr.style.setProperty('--rewind-progress',String(progress));vcr.style.setProperty('--scan-offset',`${Math.round((progress*5%1)*100)}%`);vcr.style.setProperty('--tape-offset',`${Math.round(progress*1344)}px`);vcr.style.setProperty('--rewind-jitter',`${transport==='reverse'?Math.sin(progress*183)*1.1:0}px`);
      setText(vcrLabel,rew?(transport==='freeze'?'VCR · 現場鎖定':transport==='settle'?'VCR · 三小時前':'VCR · 時間倒帶'):returning?'現場接回':'CAM 02 · 店內監控');setText(vcrSymbol,rew?(transport==='freeze'?'Ⅱ HOLD':transport==='settle'?'▶ 記錄就緒':'◀◀ REW'):returning?'▶ RETURN':'● REC');
      setText(vcrTime,`21:${String(42+Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`);setText(deckCaption,transport==='freeze'?'鎖定現場畫格':transport==='settle'?'店門口 · 三小時前':returning?'重新同步現場':'磁帶影像回溯');
      const angle=motionQuery?.matches?0:(rew?-1:1)*progress*2160;deckWheelL.style.transform=`rotate(${angle}deg)`;deckWheelR.style.transform=`rotate(${angle*.89}deg)`;vcrSymbol.style.opacity=transport==='reverse'&&!motionQuery?.matches?String(.55+.45*Math.sin(progress*24*Math.PI)**2):'1';vcrTimelineFill.style.transform=`scaleX(${rew?1-progress:progress})`;setText(vcrFrame,`FRAME ${String(Math.round(seconds*30)).padStart(5,'0')}`);
    }
    investigation.update(s);
    if(lastPhase!==s.phase&&lastPhase==='login'||s.paused||document.hidden)cancelSpeech();syncPointer(s,force||lastPhase!==s.phase);lastPhase=s.phase;
  }
  function inputSource(event){if(!clockRunning||machine.paused||document.hidden)return machine.sourceTime;let stamp=Number(event?.timeStamp);if(!Number.isFinite(stamp))stamp=performance.now();if(stamp>1e12)stamp-=performance.timeOrigin;if(Math.abs(stamp-performance.now())>60000)stamp=performance.now();return sourceAnchor+(stamp-performanceAnchor)/1000;}
  function fire(event){if(event?.isPrimary===false||event?.button>0)return;event?.preventDefault();const result=machine.attack(inputSource(event));render();return result;}
  function act(method,...args){const result=machine[method](...args);render();return result;}
  function replayPrompt(){const result=machine.replayPrompt();if('speechSynthesis'in window&&'SpeechSynthesisUtterance'in window){cancelSpeech();const utterance=new SpeechSynthesisUtterance(machine.state.connection.field==='password'?'密碼，五，二，零，一，三，一，四。':'帳號，endfield，底線，power。');utterance.lang='zh-TW';utterance.rate=.88;window.speechSynthesis.speak(utterance);}render();return result;}
  listen(launch,'click',()=>{machine.start();render(true);});listen(line,'click',()=>{if(machine.state.revealed>=machine.state.text.length)onCameraReset?.();act('next');});listen(choices,'click',event=>{const b=event.target.closest('[data-choice]');if(b){machine.choose(b.dataset.choice);render(true);}});
  listen(auto,'click',()=>{machine.setAuto(!machine.auto);render();});listen(skip,'click',()=>{machine.skip();render(true);});listen(outputs,'click',event=>{const b=event.target.closest('[data-output]');if(b){machine.setOutput(b.dataset.output);render(true);}});
  listen(pause,'click',()=>{machine.setPaused(!machine.paused);resetAnchor();render(true);});listen(replay,'click',()=>{cancelSpeech();machine.replay();lastFeedback=-1;render(true);});listen(attack,'pointerdown',fire);listen(attack,'click',event=>{if(event.detail===0)fire(event);});
  listen(cameraReset,'click',()=>{onCameraReset?.();cameraReset.blur();});
  listen(keys,'click',event=>{const b=event.target.closest('[data-key]');if(!b)return;if(b.dataset.key==='submit')act('submitLogin');else if(['endfield','_','power','admin','love','boss','kiss','520','1314','0000','8888'].includes(b.dataset.key))act('keyChunk',b.dataset.key);else if(['下班','找管理員'].includes(b.dataset.key)){loginError.textContent=b.dataset.key==='下班'?'龍泡泡：這個鍵終於有人設了。':'莊：這個先別按。';}else act('key',b.dataset.key);});listen(loginSubmit,'click',()=>act('submitLogin'));listen(promptReplay,'click',replayPrompt);listen(captchaCheck,'click',()=>act('verify'));
  function moveLever(event){if(event.pointerId!==leverPointer)return;const box=leverTrack.getBoundingClientRect(),thumbWidth=leverThumb.getBoundingClientRect().width;act('setLever',Math.max(0,Math.min(1,(event.clientX-box.left-thumbWidth/2)/Math.max(1,box.width-thumbWidth))));}
  listen(leverTrack,'pointerdown',event=>{if(machine.paused||event.isPrimary===false||event.button>0)return;event.preventDefault();leverPointer=event.pointerId;leverTrack.setPointerCapture(event.pointerId);moveLever(event);});listen(leverTrack,'pointermove',moveLever);
  listen(leverTrack,'pointerup',event=>{if(event.pointerId!==leverPointer)return;moveLever(event);leverPointer=null;if(leverTrack.hasPointerCapture(event.pointerId))leverTrack.releasePointerCapture(event.pointerId);});
  listen(leverTrack,'pointercancel',event=>{if(event.pointerId!==leverPointer)return;leverPointer=null;if(machine.phase==='lever')act('setLever',0);});listen(leverThumb,'keydown',event=>{if(!['ArrowRight','ArrowLeft','Home','End','Enter',' '].includes(event.key))return;event.preventDefault();const current=machine.state.connection.lever;act('setLever',event.key==='Home'?0:['End','Enter',' '].includes(event.key)?1:Math.max(0,Math.min(1,current+(event.key==='ArrowRight'?.1:-.1))));});
  function cancelHeat(){if(machine.phase==='heat'&&machine.state.heat?.holding)act('heatCancel');else render();}
  listen(document,'keydown',event=>{
    if(machine.phase==='login'&&!machine.paused&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.target.closest('input,select,textarea,[contenteditable=true]')){const field=machine.state.connection.field;if(event.key==='Enter'){event.preventDefault();act('submitLogin');}else if(event.key==='Backspace'){event.preventDefault();act('key','backspace');}else if((field==='password'?/^[0-9]$/:/^[a-z_]$/i).test(event.key)){event.preventDefault();act('key',event.key.toLowerCase());}return;}
    if(event.code!=='Space'||event.repeat||event.target.closest('input,select,textarea,[contenteditable=true]')||(event.target!==attack&&event.target.closest('button,a,summary'))||!['combat','aim-final'].includes(machine.phase))return;fire(event);
  });
  listen(window,'blur',cancelHeat);listen(document,'visibilitychange',()=>{if(document.hidden){cancelHeat();cancelSpeech();}resetAnchor();render(true);});render(true);
  return {machine,get state(){return machine.state;},get photo(){return investigation.photo;},sendPhoto:()=>act('sendPhoto'),takePhoto:()=>investigation.snapshot(),investigate:id=>act('investigate',id),acceptCall:()=>act('acceptCall'),hackRotate:index=>act('hackRotate',index),keyChunk:value=>act('keyChunk',value),start(){machine.start();render(true);return true;},replay(){cancelSpeech();machine.replay();lastFeedback=-1;render(true);return true;},next:()=>act('next'),choose(id){const result=machine.choose(id);render(true);return result;},attack:time=>act('attack',time),selectTarget:id=>act('selectTarget',id),setTargets(targets){machine.setTargets(targets);render();},setOutput(id){const result=machine.setOutput(id);render(true);return result;},
    holdAttack:seconds=>act('holdAttack',seconds),key:value=>act('key',value),submitLogin:()=>act('submitLogin'),replayPrompt,verify:()=>act('verify'),setLever:value=>act('setLever',value),heatStart:time=>act('heatStart',time),heatStop:time=>act('heatStop',time),heatRetry:()=>act('heatRetry'),heatCancel:cancelHeat,
    setPaused(value){if(value){cancelHeat();cancelSpeech();}machine.setPaused(value);resetAnchor();render(true);},setAuto(value){machine.setAuto(value);render();},hotspot:kind=>act('hotspot',kind),update(time){machine.update(time);resetAnchor();render();},setClockRunning(value){clockRunning=Boolean(value);if(!clockRunning)cancelSpeech();resetAnchor();render(true);},
    dispose(){if(disposed)return;disposed=true;cancelSpeech();events.abort();investigation.dispose();pointerAnimation?.cancel();root.remove();for(const c of ['mission-ready','mission-active','mission-running','mission-complete','mission-vcr-active'])mount.classList.remove(c);delete mount.dataset.missionPhase;},
  };
}
