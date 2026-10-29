import {BonusProgress,LESSONS,CLASS_MOTTO,LESSON_NOTES,ClassCourse,lessonCardCount} from './bonus-data.js';
import {ClaimsNegotiation,APPLICATION_FIELDS,SETTLEMENT_STAMPS} from './claims-negotiation.js';
import {createBonusRoom} from './bonus-room.js';
import {lessonFrame,StampSequence,SmoothMeter} from './bonus-presentation.js';
import './bonus.css';

const E=(tag,cls='',text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const visible=node=>{for(let p=node;p;p=p.parent)if(!p.visible)return false;return node.material?.visible!==false;};
export function pickBonusSign(world,ray){
 // Test the nearest visible surface, so signs cannot be tapped through walls.
 world.scene.updateMatrixWorld(true);
 for(const hit of ray.intersectObjects([world.store.root,world.actors?.root].filter(Boolean),true)){
  const n=hit.object;if(!visible(n))continue;
  if(n.userData.bonusSign||n.userData.originalSign){const box=new (world.camera.position.constructor)();n.getWorldPosition(box);if(box.z>1)return true;}
  if(!n.material?.transparent)return false;
 }
 return false;
}
export function createBonus({mount,world,mission,exploration,playEffect=()=>{},roomAudio=()=>{}}){
 let storage;try{storage=window.localStorage;}catch{/* Ephemeral mode. */}
 const progress=new BonusProgress(),negotiation=new ClaimsNegotiation(),events=new AbortController(),stampSequence=new StampSequence(),course=new ClassCourse(),deathMeter=new SmoothMeter();
 progress.data.unlocked=false;
 let active=false,route='claims',lessonIndex=0,pageIndex=0,room=null,snapshot=null,busy=false,disposed=false,transitionAnimation=null,exportUrl=null,exportBlob=null;
 let responseIndex=0,lessonAt=0,lessonKey='',lastReveal=-1,dialogOpener=null,dialogScroll=0,stampPhase='',stampKind='class',dialogKind='',objectionKey='',objectionAnimation=null;
 let saved=null,claimsLockedUntil=0,claimsControlsKey='';
 const externallyPaused=()=>document.hidden||mission.pauseReasons.some(reason=>reason!=='bonus');
 let flowStage=saved?.stage||'claims',endingAge=0,whispered=false,answerAt=null,lastEpilogueClock=null,epilogueStep=0,thanksStep=0,skippedRating=false,rebuilt=false;
 const epilogue=E('section','epilogue-prompt');epilogue.hidden=true;epilogue.setAttribute('aria-live','polite');const epilogueText=E('p'),epilogueGo=E('button','','繼續');epilogueGo.type='button';epilogue.append(epilogueText,epilogueGo);mount.append(epilogue);
 epilogueGo.addEventListener('click',()=>{if(externallyPaused()||mission.state.phaseElapsed<1.55)return;if(epilogueStep<2){epilogueStep++;updateEpilogue();}else if(rebuilt)open(true);else world.streetShow.start({initial:true,done:()=>{rebuilt=true;epilogueStep=3;updateEpilogue();}});},{signal:events.signal});
 const entry=E('button','bonus-entry','等等，二樓還不能拆');if(saved&&flowStage!=='done'){progress.data.unlocked=true;entry.textContent='繼續未完成的任務';}entry.type='button';entry.hidden=true;entry.dataset.action='open';
 const toast=E('p','bonus-toast');toast.hidden=true;toast.setAttribute('role','status');
 const root=E('section','bonus-ui');root.hidden=true;root.setAttribute('aria-label','等等，二樓還不能拆');
 const header=E('header','bonus-header'),title=E('span','bonus-room-name'),nav=E('div','bonus-nav');
 const panel=E('section','bonus-panel'),toolbar=E('div','bonus-reading-tools'),content=E('div','bonus-content');content.tabIndex=-1;panel.append(toolbar,content);
 const classMeter=E('section','bonus-class-meter');classMeter.hidden=true;const deathLabel=E('span','','笑點死亡率 0%');deathLabel.setAttribute('aria-live','polite');
 const readingMeter=E('div','bonus-lesson-progress'),readingLabel=E('span'),readingTrack=E('div','bonus-lesson-track'),readingFill=E('i');readingMeter.hidden=true;readingTrack.setAttribute('role','progressbar');readingTrack.setAttribute('aria-label','全部題目進度');readingTrack.setAttribute('aria-valuemin','0');readingTrack.setAttribute('aria-valuemax','100');readingTrack.append(readingFill);readingMeter.append(readingLabel,readingTrack);classMeter.append(deathLabel,readingMeter);panel.prepend(classMeter);
 const classDock=E('footer','bonus-class-dock'),classPrimary=E('button','bonus-primary','開講 →'),classContinue=E('button','bonus-class-continue','繼續看 →');classDock.hidden=true;classPrimary.type=classContinue.type='button';classPrimary.dataset.action='class-next';classContinue.dataset.action='class-continue';classContinue.hidden=true;classDock.append(classContinue,classPrimary);
 const claimsDock=E('footer','bonus-class-dock bonus-claims-dock'),claimsPrimary=E('button','bonus-primary','開始調解 →');claimsDock.hidden=true;claimsPrimary.type='button';claimsPrimary.dataset.action='claims-next';claimsDock.append(claimsPrimary);
 const objection=E('div','bonus-objection','異議あり！');objection.hidden=true;objection.setAttribute('aria-hidden','true');
 const curtain=E('div','bonus-curtain');curtain.setAttribute('aria-hidden','true');
 const dialog=E('dialog','bonus-dialog');dialog.setAttribute('aria-label','附件與出處');
 root.append(header,panel,classDock,claimsDock,objection,curtain,dialog);header.append(title,nav);mount.append(entry,toast,root);
 function button(parent,text,action,value,cls='') {const b=E('button',cls,text);b.type='button';b.dataset.action=action;if(value!==undefined)b.dataset.value=value;parent.append(b);return b;}
 function heading(kicker,text,description){content.append(E('p','bonus-kicker',kicker),E('h2','',text));if(description)content.append(E('p','bonus-description',description));}
 function focusContent(){content.focus({preventScroll:true});content.scrollTop=0;panel.scrollTop=0;}
 function reducedMotion(){return matchMedia('(prefers-reduced-motion: reduce)').matches;}
 function preferences(){mount.classList.toggle('bonus-reading',active&&progress.data.reading);root.style.setProperty('--bonus-text-size',`${progress.data.textSize}px`);root.dataset.textSize=String(progress.data.textSize);toolbar.replaceChildren();button(toolbar,progress.data.reading?'看演出':'專心閱讀','reading');button(toolbar,`字級 ${progress.data.textSize} · 調整`,'text-size');toolbar.hidden=true;}
 function isClassRoute(){return ['classroom','lesson','class-wait','class-stamping','class-result'].includes(route);}
 function isClaimsRoute(){return ['claims','negotiation','settlement-result'].includes(route);}
 function renderClaimsControls(){
  const key=`${active}:${route}:${negotiation.phase}:${externallyPaused()}:${world.time<claimsLockedUntil}`;if(key===claimsControlsKey)return;claimsControlsKey=key;
  const show=active&&isClaimsRoute();claimsDock.hidden=!show;root.classList.toggle('bonus-claims-flow',show);root.dataset.claimsPhase=route==='claims'?'welcome':negotiation.phase;
  claimsPrimary.disabled=externallyPaused()||world.time<claimsLockedUntil||route==='negotiation'&&['choice','stamp'].includes(negotiation.phase);
  claimsPrimary.textContent=world.time<claimsLockedUntil?'承辦反應中…':route==='claims'?'開始調解 →':route==='settlement-result'?'看看隔壁空房':negotiation.phase==='choice'?'請填寫申請單':negotiation.phase==='stamp'?'合作辦理中…':'繼續 →';
 }
 function showClaimsMenu(){
  const d=modal('理賠選單');dialogKind='claims-menu';d.dataset.kind='claims-menu';
  button(d,progress.data.reading?'切回演出':'專心閱讀','reading');button(d,`字級 ${progress.data.textSize} · 調整`,'text-size');
  if(negotiation.summary.length){const details=E('details');details.append(E('summary','','本次申請單'));negotiation.summary.forEach(t=>details.append(E('p','',t)));d.append(details);}
  if(route==='settlement-result')button(d,'保存結案圖片','export');
  button(d,'重新調解','claims-reset');button(d,'返回街景','close');button(d,'重新開始雨夜','restart-night');
 }
 function resetClaims(){claimsLockedUntil=0;stampSequence.cancel();negotiation.reset();objectionKey='';objectionAnimation?.cancel();objection.hidden=true;room.resetPaper();route='negotiation';render();focusContent();}
 function advanceClaims(){
  if(world.time<claimsLockedUntil)return;
  if(route==='claims'){resetClaims();return;}
  if(route==='settlement-result'){flowStage=flowStage==='done'?'done':'class';travel('class-invite');return;}
  if(route!=='negotiation'||!negotiation.next())return;
  if(negotiation.phase==='stamp')startSettlementStamp(world.time);if(negotiation.cue?.event==='policyholder')claimsLockedUntil=world.time+1.5;
  render();panel.scrollTop=0;claimsPrimary.focus({preventScroll:true});
 }
 function presentNegotiation(){
  const cue=negotiation.cue;
  room.negotiate(negotiation.state,world.time);
  if(cue?.event==='objection'){
   const key=String(negotiation.round);
   if(key!==objectionKey){objectionKey=key;objection.hidden=false;objectionAnimation?.cancel();
    objectionAnimation=objection.animate(reducedMotion()?[{opacity:1},{opacity:1,offset:.8},{opacity:0}]:[{opacity:0,transform:'translateX(-30%) rotate(-5deg) scale(.9)'},{opacity:1,transform:'translateX(0) rotate(-5deg) scale(1.04)',offset:.15},{opacity:1,offset:.75},{opacity:0}],{duration:reducedMotion()?700:1100,fill:'forwards'});
    objectionAnimation.onfinish=()=>{objection.hidden=true;};playEffect('objection');
   }
  }else{objectionAnimation?.cancel();objection.hidden=true;}
 }
 function saveFlow(){
  if(!active)return;
  const state={version:3,stage:flowStage,route,lessonIndex,pageIndex,responseIndex,course:course.saved,negotiation:negotiation.state,rating:selectedRating};
  saved=state;
 }
 function persistCourse(){progress.data.course=null;progress.save();saveFlow();}
 let selectedRating=Number.isInteger(saved?.rating)&&saved.rating>=1&&saved.rating<=5?saved.rating:0;
 function restoreFlow(){
  if(!saved)return false;
  for(const l of LESSONS){const count=Math.min(lessonCardCount(l.id),Math.max(0,Number(saved.course?.steps?.[l.id])||0));for(let i=0;i<count;i++)course.confirm(l.id,i);}
  course.stamped=course.eligible&&saved.course?.stamped===true;
  // Reconstruct through public actions rather than trusting serialized cue indices.
  negotiation.reset();const n=saved.negotiation;
  for(let i=0;n&&i<90;i++){
   if(negotiation.phase===n.phase&&negotiation.field===n.field&&negotiation.line===n.line&&negotiation.stampIndex===n.stampIndex)break;
   if(negotiation.phase==='choice'){if(!negotiation.select(n.choices?.[APPLICATION_FIELDS[negotiation.field].id]))break;}
   else if(negotiation.phase==='stamp')negotiation.finishStamp();else if(!negotiation.next())break;
  }
  if(!['claims','class','ending','done'].includes(flowStage))flowStage='claims';
  route=flowStage==='done'?'rating-result':flowStage==='ending'?'final':flowStage==='class'?(course.stamped?'class-result':course.eligible?'class-wait':'classroom'):negotiation.phase==='complete'?'settlement-result':n?'negotiation':'claims';
  lessonIndex=Math.max(0,Math.min(LESSONS.length-1,Number(saved.lessonIndex)||0));
  if(flowStage==='class'&&!course.eligible&&saved.route==='lesson'){selectLesson(LESSONS[lessonIndex].id,true);}
  if(route==='negotiation'&&negotiation.phase==='stamp')startSettlementStamp(world.time);
  deathMeter.reset(world.time);deathMeter.set(course.percentage,world.time,true);return true;
 }

 function resetClass(){course.reset();persistCourse();deathMeter.reset(world.time);lessonIndex=pageIndex=responseIndex=0;stampSequence.cancel();ensureRoom().resetPaper();}
 function selectLesson(id,resume=false){lessonIndex=LESSONS.findIndex(l=>l.id===id);if(lessonIndex<0)lessonIndex=0;const steps=resume?Math.min(course.steps[LESSONS[lessonIndex].id]||0,lessonCardCount(id)-1):0;const last=1+LESSONS[lessonIndex].analysis.length;pageIndex=Math.min(last,steps);enterLessonPage();responseIndex=Math.max(0,steps-last);route='lesson';}
 function renderClassControls(){
  const show=active&&(isClassRoute()||route==='class-invite');classDock.hidden=!show;classMeter.hidden=!active||!isClassRoute();root.classList.toggle('bonus-class-flow',show);root.dataset.classStage=route;classContinue.hidden=true;
  readingMeter.hidden=route!=='lesson';if(route==='lesson'){const pct=Math.floor(LESSONS.reduce((sum,l)=>sum+Math.min(course.steps[l.id]||0,lessonCardCount(l.id)),0)/LESSONS.reduce((sum,l)=>sum+lessonCardCount(l.id),0)*100);readingLabel.textContent=`全部題目進度 ${pct}%`;readingTrack.setAttribute('aria-valuenow',String(pct));readingFill.style.transform=`scaleX(${pct/100})`;}
  classPrimary.disabled=['class-wait','class-stamping'].includes(route);
  classPrimary.textContent=route==='class-invite'?'來上課吧 →':route==='classroom'?(course.stamped?(course.next()?'繼續看（自由）→':'查看死亡證明'):'開講 →'):route==='class-result'?'交出最後的評分':route==='class-wait'?'笑點正在死亡…':route==='class-stamping'?'正在蓋章…':'繼續 →';
 }
 function showClassMenu(){
  const d=modal('課堂選單');dialogKind='class-menu';d.dataset.kind='class-menu';
  if(route==='lesson'){button(d,'上一段','prev');button(d,'看黑板','board');button(d,'出處與劇內設定','sources');}
  button(d,progress.data.reading?'切回演出':'專心閱讀','reading');button(d,`字級 ${progress.data.textSize} · 調整`,'text-size');
  const details=E('details','bonus-class-catalog');details.append(E('summary','','八題課程 · 已讀重看'));LESSONS.filter(l=>course.completed.includes(l.id)).forEach(l=>button(details,`${course.completed.includes(l.id)?'本堂 ✓ ':progress.data.read.includes(l.id)?'讀過 · ':''}${l.title}`,'lesson-id',l.id));d.append(details);
  if(course.stamped)button(d,'查看死亡證明','class-certificate');button(d,'返回街景','close');button(d,'重新開始雨夜','restart-night');button(d,'重新上課 · 死亡條歸零','class-reset',undefined,'bonus-text-button');
 }
 function advanceClass(){
  if(route==='class-invite'){dispatch('class-start');return;}
  if(route==='class-result'){if(flowStage==='done'){route='rating-result';render();return;}flowStage='ending';endingAge=0;route='rating';render();return;}
  if(route==='classroom'){
   if(course.eligible&&!course.stamped)route='class-wait';
   else if(course.next())selectLesson(course.next(LESSONS[lessonIndex].id));
   else route='class-result';
  }else if(route==='lesson'){
   const l=LESSONS[lessonIndex],last=1+l.analysis.length,cursor=pageIndex<last?pageIndex:last+responseIndex;
   course.confirm(l.id,cursor);persistCourse();deathMeter.set(course.percentage,world.time,reducedMotion());
   if(cursor+1>=lessonCardCount(l.id)){
    progress.mark('read',l.id);
    if(course.eligible&&!course.stamped)route='class-wait';
    else if(course.next())selectLesson(course.next(LESSONS[lessonIndex].id));
    else route='class-result';
   }else if(pageIndex<last){pageIndex++;enterLessonPage();}else responseIndex++;
  }else return;
  render();panel.scrollTop=0;classPrimary.focus({preventScroll:true});syncClass(world.time);
 }
 function syncClass(time){
  if(!isClassRoute())return;
  deathMeter.set(course.percentage,time,reducedMotion());const value=deathMeter.value(time),display=Math.min(100,Math.round(value));
  deathLabel.textContent=`笑點死亡率 ${display}%`;
  if(route==='class-wait'&&value>=99.99){
   stampKind='class';stampSequence.start(time,reducedMotion());stampPhase='';route='class-stamping';room.resetPaper();room.board('笑點已死亡',['手術成功，笑點死亡。','本教室不提供笑點復活服務。'],0,time,true,'graduation');room.perform('dismissed');room.stamp(time,'笑點已死亡');render();classPrimary.focus({preventScroll:true});
  }
 }
 function lessonTurns(){return LESSONS[lessonIndex].aside?LESSONS[lessonIndex].aside.split('\n'):[];}
 function enterLessonPage(){lessonAt=world.time;lastReveal=-1;responseIndex=0;lessonKey=`${lessonIndex}:${pageIndex}:${lessonAt}`;}
 function updateEpilogue(){const lines=['莊：龍泡泡，等等。你片尾曲太早唱了。','莊：還不能下班喔。','龍泡泡：啊，對吼！二樓還不能拆。','龍泡泡：跟我進二樓，還有任務。'];epilogueText.textContent=lines[epilogueStep];epilogueGo.textContent=epilogueStep===3?'跟上龍泡泡':epilogueStep===2?'還沒演完？':'繼續';}
 function enterFreeStreet(shortcut=false){
  exploration.setActive(false);flowStage='done';rebuilt=true;progress.data.unlocked=true;progress.taps=0;progress.save();
  if(shortcut){world.streetShow.reset();world.director.reset();world.streetShow.prepareIntact();}
  world.director.stuckReleased=true;world.director.finalBegun=false;world.siege.reset();
  world.actors.setObstacles({...world.store.floorPlan,street:true});world.actors.teleport(-1.25,3.25);world.actors.setCinematic(null);world.actors.setDragonProjectile(null);world.actors.setSoot(false);
  mission.machine.epiloguePending=false;mission.machine.returnToStreet();world.missionState=mission.state;world.weather.invalidateReflection();world.setView('story',true);
 }
 function updateEntry(){entry.textContent=mission.state.postgame?'進入二樓劇情':entry.textContent;entry.disabled=mission.state.paused||!!world.streetShow?.active;entry.hidden=active||!progress.data.unlocked||!['ready','complete'].includes(mission.state.phase)||(mission.state.phase==='complete'&&flowStage!=='done'&&!rebuilt);}
 function ensureRoom(){if(!room)room=createBonusRoom();return room;}
 function notice(text){toast.textContent=text;toast.hidden=false;toast.getAnimations().forEach(a=>a.cancel());const a=toast.animate([{opacity:1},{opacity:1,offset:.85},{opacity:0}],{duration:4200,fill:'forwards'});a.onfinish=()=>{toast.hidden=true;};}
 function setExterior(){
  world.setCutaway(false);world.camera.position.set(1,6.2,13);world.camera.fov=46;world.controls.target.set(0,4.5,1.5);world.camera.lookAt(world.controls.target);world.camera.updateProjectionMatrix();
 }
 function open(fromEnding=false,skipTravel=false){
  if(fromEnding===true)progress.unlock();
  if(active||busy||mission.state.paused||world.streetShow?.active||!progress.data.unlocked||!['ready','complete'].includes(mission.state.phase))return;
  if(mission.state.postgame&&world.streetShow.state.mode==='collapsed'){world.streetShow.start({done:()=>open(false,skipTravel)});return;}
  snapshot={time:world.time,position:world.camera.position.clone(),quaternion:world.camera.quaternion.clone(),target:world.controls.target.clone(),fov:world.camera.fov,currentView:world.currentView,autoCamera:world.autoCamera,manualUntil:world.manualUntil,transition:world.transition,cutaway:world.cutawayActive,walking:exploration.active,paused:mission.state.paused,controls:world.controls.enabled,inert:[]};
  exploration.setActive(false);mission.setPaused(true,'bonus');world.transition=null;world.controls.enabled=false;active=true;
  for(const node of mount.children){if([root,entry,toast,epilogue,world.container].includes(node)||node.classList.contains('background-resume'))continue;snapshot.inert.push([node,node.inert]);node.inert=true;}
  rebuildButton.hidden=true;mount.classList.add('bonus-active');root.hidden=false;toast.hidden=true;epilogue.hidden=true;route='claims';ensureRoom();if(mission.state.postgame){route='claims';}else restoreFlow();world.resize();render();updateEntry();focusContent();if(!skipTravel&&['claims','negotiation'].includes(route))travel(route,true);else {ensureRoom().setMode(isClassRoute()?'classroom':'claims');room.enter(world.time);}
 }
 function close(){
  if(!active||busy)return;dialog.close();if(exportUrl){URL.revokeObjectURL(exportUrl);exportUrl=null;exportBlob=null;}
  saveFlow();stampSequence.cancel();objectionAnimation?.cancel();objection.hidden=true;active=false;root.hidden=true;mount.classList.remove('bonus-active','bonus-reading');for(const [node,inert]of snapshot.inert)node.inert=inert;
  world.setCutaway(snapshot.cutaway);if(flowStage==='done'&&mission.state.phase==='complete')world.director.stuckReleased=true;exploration.setActive(snapshot.walking);
  world.currentView=snapshot.currentView;world.autoCamera=snapshot.autoCamera;world.manualUntil=Number.isFinite(snapshot.manualUntil)?snapshot.manualUntil+world.time-snapshot.time:snapshot.manualUntil;world.transition=snapshot.transition?{...snapshot.transition,start:snapshot.transition.start+world.time-snapshot.time}:null;world.controls.enabled=snapshot.controls;
  world.resize();world.camera.position.copy(snapshot.position);world.camera.quaternion.copy(snapshot.quaternion);world.camera.fov=snapshot.fov;world.controls.target.copy(snapshot.target);world.camera.updateProjectionMatrix();
  // Consume the source-clock gap while still paused, then restore its prior state.
  mission.update(world.time);mission.setPaused(false,'bonus');
  if(flowStage==='done'&&mission.state.phase==='complete'&&!mission.state.postgame){
    enterFreeStreet();
  }
  updateEntry();entry.textContent=flowStage==='done'?'重看二樓故事':'等等，二樓還不能拆';entry.focus();snapshot=null;
 }
 async function travel(destination,fromStreet=false){
  if(busy||disposed||externallyPaused())return;stampSequence.cancel();objectionAnimation?.cancel();objection.hidden=true;busy=true;root.setAttribute('aria-busy','true');dialog.close();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let covered=false;
  try{
   // Rewind the ruined storefront visually; restore its logical damage afterward.
   const indoor=!fromStreet&&!!room&&['claims','negotiation','settlement-result','class-invite','classroom','lesson','class-result'].includes(route);
   if(!indoor){route='exterior';setExterior();title.textContent='二樓 · 進場';}
   if(!reduced&&!covered){transitionAnimation=curtain.animate([{opacity:0},{opacity:0,offset:.35},{opacity:1}],{duration:650,fill:'forwards'});await transitionAnimation.finished;}
   if(disposed)return;if(destination==='street'){world.store.destruction.reset();rebuilt=true;progress.data.unlocked=false;progress.taps=0;busy=false;close();return;}route=destination;

   if(destination==='rooms')setExterior();else {ensureRoom().setMode(destination==='classroom'||destination==='lesson'||destination==='class-invite'?'classroom':'claims');if(destination==='classroom'||destination==='claims'||destination==='class-invite')room.enter(world.time);}
   render();focusContent();
   if(!reduced){transitionAnimation=curtain.animate([{opacity:1},{opacity:0}],{duration:300,fill:'forwards'});await transitionAnimation.finished;}
  }catch(e){if(e.name!=='AbortError')throw e;}finally{busy=false;root.removeAttribute('aria-busy');}
 }
 function render(){
  saveFlow();content.replaceChildren();nav.replaceChildren();preferences();renderClassControls();renderClaimsControls();
  panel.scrollTop=0;root.dataset.route=route;
  title.textContent=route==='class-invite'?'二樓 · 隔壁空房':isClassRoute()?'二樓 · 笑點小學堂':isClaimsRoute()?'二樓 · 理賠調解會':'雨夜 · 謝幕';
  if(isClassRoute())button(nav,'☰ 選單','class-menu');else if(isClaimsRoute())button(nav,'☰ 選單','claims-menu');else{button(nav,'選單','final-menu');}
  if(route==='warning'){
   heading('課後時間','這裡會把包袱拆開來講。','包含完整劇情與結尾解析。還沒看完主線的話，可以先回去吃晚餐。');button(content,'知道了，樓上請','confirm',undefined,'bonus-primary');return;
  }
  if(route==='class-invite'){
   ensureRoom().setMode('classroom');room.setFocus('wide');room.perform('explain');room.board('隔壁空房',[],0,world.time,false,'class-invite');
   heading('理賠結案 · 隔壁空房','龍泡泡','還有一間空房間，這樣有點浪費。\n啊，我想到了。來上課吧，我當老師！');if(flowStage==='done')button(content,'返回雨夜街角','close');return;
  }
  if(route==='final'||route==='rating'||route==='rating-result'){
   if(route==='final'){ensureRoom().setMode('classroom');room.board('下課',[],0,world.time,false,'true-fin');room.perform('gone');heading('AFTER HOURS','Fin.');button(content,'回雨夜街角','close',undefined,'bonus-primary');return;}
   if(route==='rating-result'){
    ensureRoom().setMode('classroom');room.perform(['whisper','bow','wave'][thanksStep]);room.board(thanksStep===2?'886！':'課後悄悄話',[],0,world.time,false,'thanks-'+thanksStep);
    const lines=['偷偷跟你說，正面 711 招牌按七下，可以開啟通關後的雨夜街角喔～','感謝您的回饋，雖然沒有人會看～','886！'];
    heading('龍泡泡 · 謝幕','龍泡泡',lines[thanksStep]);button(content,thanksStep===2?'揮手告別':'繼續','thanks-next',undefined,'bonus-primary');return;
   }
   heading('笑點小學堂 · 結業','請給分。');const stars=E('div','rating-stars');stars.setAttribute('role','group');stars.setAttribute('aria-label','一至五星評分');
   for(let i=1;i<=5;i++){const b=button(stars,i<=selectedRating?'★':'☆','rate',String(i));b.setAttribute('aria-label',`${i} 星`);b.setAttribute('aria-pressed',String(i===selectedRating));}content.append(stars);
   const submit=button(content,selectedRating?'送出評分':'先選一顆到五顆星','rate-submit',undefined,'bonus-primary');submit.disabled=!selectedRating;button(content,'略過','rate-skip',undefined,'bonus-text-button');return;
  }
  if(route==='classroom'){
   ensureRoom().board(CLASS_MOTTO[2],CLASS_MOTTO.slice(0,2),Math.max(0,1-course.percentage/100),world.time,false,'welcome');room.setFocus('wide');room.perform('explain');
   heading('龍泡泡主講','笑點小學堂','八題嚴肅解析，附笑點死亡證明。請一路按下方繼續。');
   content.append(E('p','bonus-description','按下方「繼續」往下聽，選篇、字級和出處都在右上選單。'));return;
  }
  if(route==='lesson'){
   const l=LESSONS[lessonIndex],last=l.analysis.length+1,turns=lessonTurns(),reaction=pageIndex===last;
   content.append(E('h2','',l.title));
   let text,kicker;
   if(pageIndex===0){if(l.id==='lino'){const frame=E('div','bonus-poster-recap'),poster=E('img');poster.src=`${import.meta.env.BASE_URL}images/store-posters.png`;poster.alt='梨諾說沒有洗腦 · 食品衛生海報';frame.append(poster);content.append(frame);}kicker='原句回顧';text=l.recap;room.setFocus('wide');const image=world.sceneStills?.[l.id]||world.sceneStills?.[l.id==='compute'||l.id==='pear'?'taste':l.id];if(image){const still=E('img','bonus-recap-still');still.src=image;still.alt=l.title+' · 本次劇情畫面';content.append(still);}}
   else if(!reaction){kicker='解析';text=l.analysis[pageIndex-1];room.setFocus(pageIndex===2?'board-side':'board');}
   else {kicker='課後吐槽';text=turns[responseIndex];room.setFocus('reaction');}
   const boardTitle=pageIndex===0?l.board:reaction?'講師補充':LESSON_NOTES[l.id][pageIndex-1]||l.board;
   const notes=reaction?[l.diagnosis]:pageIndex===0?LESSON_NOTES[l.id].slice(0,2):[];
   room.board(boardTitle,notes,Math.max(0,1-course.percentage/100),lessonAt,false,lessonKey);
   room.perform(reaction?(text.startsWith('莊：')?'interrupted':responseIndex===turns.length-1&&lessonIndex===LESSONS.length-1?'dismissed':'awkward'):'explain');
   content.append(E('p','bonus-section-label',kicker),E('p',reaction?'bonus-reading bonus-spoken':'bonus-reading',text));
   syncLesson(world.time);return;
  }
  if(route==='class-wait'||route==='class-stamping'){
   heading('解剖報告 · 正在結業','笑點搶救無效');const label=E('p','bonus-stamp-progress',route==='class-wait'?'解析完成 · 死亡率持續上升':'抬章 · 開立死亡證明');label.setAttribute('role','status');content.append(label);return;
  }
  if(route==='class-result'){
   room.board('笑點已死亡',['手術成功，笑點死亡。','八題解析，全部完成。'],0,world.time,false,'certificate');room.perform('dismissed');
   heading('笑點小學堂 · 結業','手術成功，笑點已死亡');const paper=E('article','bonus-paper');paper.append(E('p','bonus-document-id','死亡證明 · 龍泡泡簽發'),E('h3','','笑點已死亡'),E('p','',`已完成 ${course.completedCount} 篇解剖。死亡率 100%。`),E('p','','死因：講得太清楚。'),E('strong','bonus-stamp','笑點已死亡'));content.append(paper);return;
  }
  if(route==='claims'){
   room.negotiate(null,world.time);
   heading('武陵 · 理賠調解','711 雷擊與建物損失案','龍泡泡代申請理賠出險，保險代表現場審核。請嚴肅填寫。');
   content.append(E('p','bonus-response','龍泡泡：阿莊料事如神，知道保險公司一定有意見。\n我來示範怎麼跟他們打交道。'));return;
  }
  if(route==='negotiation'){
   const f=APPLICATION_FIELDS[negotiation.field],cue=negotiation.cue;
   presentNegotiation();
   if(negotiation.phase==='choice'){
    heading(`保險申請單 · ${negotiation.field+1} / ${APPLICATION_FIELDS.length}`,f.label,`請詳述${f.label}。`);
    const choices=E('fieldset','bonus-claim-choices');choices.append(E('legend','sr-only',f.label));
    f.options.forEach(o=>{const b=button(choices,o.text,'claims-select',o.id);b.prepend(E('span','bonus-option-id',o.id));});content.append(choices);
   }else if(negotiation.phase==='stamp'){
    heading('武陵 · 長期合作','同意。三項一起辦。');const status=E('p','bonus-stamp-progress','抬章 · '+SETTLEMENT_STAMPS[negotiation.stampIndex]);status.setAttribute('role','status');content.append(status);
    const stamps=E('div','bonus-settlement-stamps');SETTLEMENT_STAMPS.forEach((text,i)=>stamps.append(E('strong',i<negotiation.stampIndex?'bonus-stamp':'bonus-stamp bonus-stamp-pending',text)));content.append(stamps);
   }else{
    heading(negotiation.phase==='read'?`保險申請單 · ${f.label}`:negotiation.phase==='objection'?'保險代表 · 異議':negotiation.phase==='business'?'龍泡泡 · 後面的生意':'要保資料',cue.speaker);
    const line=E('p','bonus-reading bonus-spoken',cue.text);line.setAttribute('aria-live','polite');content.append(line);
    if(cue.event==='policyholder'){const card=E('article','bonus-policyholder');card.append(E('small','','要保人'),E('strong','','莊芳宜'));content.replaceChild(card,line);}
   }
   return;
  }
  if(route==='settlement-result'){
   room.negotiate(negotiation.state,world.time);heading('711 雷擊與建物損失案 · 結案','皆大歡喜。Happy Ending.');
   const paper=E('article','bonus-paper');paper.append(E('p','bonus-document-id','WUL-711-01 · 戲內文件'),E('h3','','理賠暨長期合作確認單'));
   resultRows().forEach(text=>paper.append(E('p','',text)));const stamps=E('div','bonus-settlement-stamps');SETTLEMENT_STAMPS.forEach(text=>stamps.append(E('strong','bonus-stamp',text)));paper.append(stamps);content.append(paper,E('p','bonus-response','保險代表：同意！理賠、新產險、長期合作，一起辦理。'));
  }
 }
 function resultRows(){return ['要保人：莊芳宜',...negotiation.summary,'合作事項：每月幾噸息壤，新的產險，長期合作。','辦理結果：保險公司同意，皆大歡喜。'];}
 function modal(titleText){dialog.dataset.kind='';dialogKind='';if(!dialog.open){dialogOpener=document.activeElement;dialogScroll=panel.scrollTop;}dialog.replaceChildren();const bar=E('div','bonus-dialog-heading');bar.append(E('h3','',titleText));button(bar,'關閉','dialog-close');dialog.append(bar);if(!dialog.open)dialog.showModal();return dialog;}
 function showSources(){const l=LESSONS[lessonIndex],d=modal('出處與劇內設定');d.append(E('p','', '台詞回顧引用目前版本的劇本；情節解析是本作品的解讀。未核實的社群口號、事件或歌詞來源不指定作者／作品。'));for(const source of l.sources){const a=E('a','',`${source.label} ↗`);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';d.append(a);}if(!l.sources.length)d.append(E('p','','本章以劇內鋪陳與回收為主，沒有新增外部來源主張。'));}
 function exportPaper(){
  if(exportUrl)URL.revokeObjectURL(exportUrl);exportUrl=null;exportBlob=null;
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1500;const c=canvas.getContext('2d');
  c.fillStyle='#eee6cd';c.fillRect(0,0,1080,1500);c.strokeStyle='#36594a';c.lineWidth=5;c.strokeRect(45,45,990,1410);c.fillStyle='#28483e';c.font='bold 48px sans-serif';c.fillText('武陵事故處理單',90,145);c.font='26px sans-serif';c.fillText('WUL-711-01 / 理賠暨長期合作 / 戲內文件',90,205);let y=285;
  for(const line of ['711 雷擊與建物損失案',...resultRows()]){let part='';for(const ch of line){if(c.measureText(part+ch).width>880){c.fillText(part,90,y);part='';y+=44;}part+=ch;}c.fillText(part,90,y);y+=58;}
  SETTLEMENT_STAMPS.forEach((text,i)=>{c.save();c.translate(245+i*300,1310);c.rotate(-.08);c.strokeStyle=c.fillStyle='#a34b3b';c.lineWidth=5;c.strokeRect(-130,-55,260,100);c.font='bold 44px sans-serif';c.fillText(text,-98,10);c.restore();});
  const d=modal('保存事故處理單'),exportRevision=negotiation.revision;dialogKind='export';d.append(E('p','','可下載圖片；手機也可以長按圖片保存。'));
  canvas.toBlob(blob=>{if(!blob||disposed||!dialog.open||dialogKind!=='export'||route!=='settlement-result'||negotiation.revision!==exportRevision)return;exportBlob=blob;exportUrl=URL.createObjectURL(blob);const img=E('img','bonus-export');img.src=exportUrl;img.alt='本次理賠結案書';const a=E('a','bonus-download','下載結案書 PNG');a.href=exportUrl;a.download='WUL-711-01-settled.png';d.append(a,img);if(navigator.share&&navigator.canShare?.({files:[new File([blob],'WUL-711-01.png',{type:'image/png'})]}))button(d,'分享圖片','share');},'image/png');
 }
 function syncLesson(time){
  if(route!=='lesson')return;
  const state=lessonFrame(time-lessonAt,false,reducedMotion());
  if(state.reveal!==lastReveal){if(lastReveal>=0&&!reducedMotion())playEffect('chalk');lastReveal=state.reveal;}
 }
 function startSettlementStamp(time){
  stampKind='settlement';stampPhase='';stampSequence.start(time,reducedMotion());room.stamp(time,SETTLEMENT_STAMPS[negotiation.stampIndex]);
 }
 function advanceStamp(time){
  if(route!=='class-stamping'&&!(route==='negotiation'&&negotiation.phase==='stamp'))return;
  const beat=stampSequence.advance(time);if(beat.impact)playEffect('stamp');
  const status=stampKind==='class'?'笑點已死亡':SETTLEMENT_STAMPS[negotiation.stampIndex];
  if(beat.phase!==stampPhase){stampPhase=beat.phase;const label=content.querySelector('.bonus-stamp-progress');if(label)label.textContent={lifting:'抬章 · '+status,impact:'落印 · '+status,printing:'確認 · '+status,complete:'辦理完成'}[beat.phase]||'處理中';}
  if(beat.done){
   if(stampKind==='class'){course.certify();persistCourse();route='class-result';render();classPrimary.focus({preventScroll:true});}
   else{negotiation.finishStamp();if(negotiation.phase==='complete'){progress.data.claimsSettled=true;progress.save();route='settlement-result';}else startSettlementStamp(time);render();claimsPrimary.focus({preventScroll:true});}
  }
 }
 async function dispatch(action,value){
  if(busy||disposed||externallyPaused()&&!['close','dialog-close'].includes(action))return;
  if((['class-stamping','class-wait'].includes(route)||route==='negotiation'&&negotiation.phase==='stamp')&&!['close','reading','text-size','class-menu','claims-menu','class-rooms','claims-reset','dialog-close'].includes(action))return;
  switch(action){
   case 'final-menu':{const d=modal('雨夜選單');button(d,'返回街角','close');button(d,'重新開始雨夜','restart-night');if(flowStage==='done'){button(d,'重看笑點課程','review-class');button(d,'重看理賠調解會','review-claims');button(d,'修改評分','rate-again');}return;}
   case 'review-class':dialog.close();await travel('classroom');selectLesson(LESSONS[0].id);render();return;
   case 'review-claims':dialog.close();ensureRoom();resetClaims();await travel('claims');return;
   case 'rate-again':dialog.close();route='rating';render();return;
   case 'rate':selectedRating=Number(value);render();return;
   case 'rate-submit':if(!selectedRating)return;thanksStep=0;skippedRating=false;route='rating-result';render();return;
   case 'rate-skip':thanksStep=0;skippedRating=true;route='rating-result';render();return;
   case 'thanks-next':thanksStep+=skippedRating&&thanksStep===0?2:1;if(thanksStep>2){flowStage='done';route='final';}render();return;
   case 'class-start':if(route==='class-invite'){resetClass();route='classroom';render();focusContent();return;}resetClass();await travel('classroom');return;
   case 'claims-menu':showClaimsMenu();return;
   case 'claims-next':advanceClaims();return;
   case 'claims-reset':dialog.close();resetClaims();return;
   case 'claims-select':if(world.time<claimsLockedUntil||route!=='negotiation'||!negotiation.select(value))return;claimsLockedUntil=world.time+1;render();panel.scrollTop=0;claimsPrimary.focus({preventScroll:true});return;
   case 'class-next':advanceClass();return;
   case 'class-menu':showClassMenu();return;
   case 'class-certificate':if(!course.stamped)return;dialog.close();route='class-result';render();classPrimary.focus({preventScroll:true});return;
   case 'class-rooms':return;
   case 'class-continue':if(!course.next())return;selectLesson(course.next(LESSONS[lessonIndex].id));render();panel.scrollTop=0;classPrimary.focus({preventScroll:true});return;
   case 'class-reset':resetClass();dialog.close();route='classroom';room.resetPaper();render();classPrimary.focus({preventScroll:true});return;
   case 'lesson-id':dialog.close();selectLesson(value);render();panel.scrollTop=0;classPrimary.focus({preventScroll:true});return;
   case 'reading':progress.data.reading=!progress.data.reading;progress.save();preferences();if(['class-menu','claims-menu'].includes(dialogKind)){if(dialogKind==='class-menu')showClassMenu();else showClaimsMenu();dialog.querySelector('[data-action=reading]')?.focus({preventScroll:true});}else toolbar.querySelector('[data-action=reading]')?.focus({preventScroll:true});return;
   case 'text-size':progress.data.textSize={18:22,22:26,26:18}[progress.data.textSize];progress.save();preferences();if(['class-menu','claims-menu'].includes(dialogKind)){if(dialogKind==='class-menu')showClassMenu();else showClaimsMenu();dialog.querySelector('[data-action=text-size]')?.focus({preventScroll:true});}else toolbar.querySelector('[data-action=text-size]')?.focus({preventScroll:true});return;
   case 'open':open();return;
   case 'close':close();return;
   case 'restart-night':close();mission.replay();return;
   case 'confirm':progress.data.warned=true;progress.save();route='rooms';break;
   case 'rooms':await travel('rooms');return;
   case 'classroom':if(route==='lesson'){route='classroom';break;}await travel('classroom');return;
   case 'claims':await travel('claims');return;
   case 'lesson':lessonIndex=Number(value);if(!LESSONS[lessonIndex])return;pageIndex=0;route='lesson';enterLessonPage();break;
   case 'next':pageIndex=Math.min(LESSONS[lessonIndex].analysis.length+1,pageIndex+1);enterLessonPage();break;
   case 'prev':dialog.close();if(pageIndex===1+LESSONS[lessonIndex].analysis.length&&responseIndex>0)responseIndex--;else{pageIndex=Math.max(0,pageIndex-1);enterLessonPage();}break;
   case 'response-next':responseIndex=Math.min(lessonTurns().length-1,responseIndex+1);if(responseIndex===lessonTurns().length-1)progress.mark('read',LESSONS[lessonIndex].id);break;
   case 'next-lesson':if(responseIndex<lessonTurns().length-1)return;if(lessonIndex===LESSONS.length-1)route='classroom';else{lessonIndex++;pageIndex=0;enterLessonPage();}break;
   case 'board':dialog.close();progress.data.reading=false;progress.save();preferences();room.setFocus('board');syncLesson(world.time);return;
   case 'sources':showSources();return;
   case 'dialog-close':dialog.close();return;
   case 'export':if(route==='settlement-result')exportPaper();return;
   case 'share':if(exportBlob){try{await navigator.share({files:[new File([exportBlob],'WUL-711-01.png',{type:'image/png'})]});}catch{/* Download remains available after cancellation. */}}return;
   default:return;
  }
  render();focusContent();
 }
 root.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)dispatch(b.dataset.action,b.dataset.value);},{signal:events.signal});
 entry.addEventListener('click',()=>open(),{signal:events.signal});
 dialog.addEventListener('close',()=>{panel.scrollTop=dialogScroll;if(dialogOpener?.isConnected)dialogOpener.focus({preventScroll:true});},{signal:events.signal});
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();},{signal:events.signal});
 document.addEventListener('visibilitychange',()=>{if(!active)return;for(const a of root.getAnimations({subtree:true})){if(document.hidden&&a.playState==='running'){a.pause();a._backgroundPaused=true;}}},{signal:events.signal});
 root.addEventListener('keydown',e=>{if(!active)return;if(e.key==='Escape'&&!dialog.open){e.preventDefault();close();}if(e.key==='Tab'&&!dialog.open){const nodes=[...root.querySelectorAll('button,a[href]')].filter(n=>!n.disabled&&n.getClientRects().length);if(!nodes.length)return;const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===content)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}},{signal:events.signal});
 const api={get active(){return active;},get state(){return {active,route,busy,lesson:LESSONS[lessonIndex].id,page:pageIndex,response:responseIndex,room:room?.state||null,presentation:lessonFrame(world.time-lessonAt,course.eligible,reducedMotion()),stampPhase,taps:progress.taps,...structuredClone(progress.data),course:{...course.saved,completed:course.completed,percentage:course.percentage,display:deathMeter.value(world.time)},negotiation:negotiation.state};},
  resetEnding(){course.reset();negotiation.reset();selectedRating=0;claimsLockedUntil=0;progress.data.claimsSettled=false;progress.data.unlocked=false;progress.data.read=[];progress.taps=0;flowStage='claims';epilogueStep=0;rebuilt=false;epilogue.hidden=true;entry.hidden=true;rebuildButton.hidden=true;progress.save();mount.classList.remove('bonus-unlocked','epilogue-pending');saved=null;},
  handleTap(ray){if(active)return true;const allowed=['ready','complete'].includes(mission.state.phase);if(!allowed){progress.tap(false,mission.state.phase);return false;}const sign=pickBonusSign(world,ray);if(sign){world.flashUntil=world.time+.45;world.pulseLight?.();}if(progress.tap(sign,mission.state.phase)){enterFreeStreet(true);notice('雨夜街角已開放：散步、拆屋復原與二樓劇情。');mount.classList.add('bonus-unlocked');const flash=world.container.animate([{filter:'brightness(1)'},{filter:'brightness(1.7)'},{filter:'brightness(1)'}],{duration:320});flash.onfinish=()=>mount.classList.remove('bonus-unlocked');updateEntry();}return sign;},
  update(){
   const s=mission.state;mission.machine.epiloguePending=flowStage!=='done';
   if(!['ready','complete'].includes(s.phase))progress.taps=0;

   epilogue.hidden=active||s.phase!=='complete'||flowStage==='done'||world.streetShow?.active||s.phaseElapsed<1.2;
   mount.classList.toggle('epilogue-pending',s.phase==='complete'&&flowStage!=='done'&&!rebuilt);
   if(!epilogue.hidden)updateEpilogue();
   updateEntry();
  },
  tick(time,renderFrame=true){roomAudio();if(externallyPaused()){const gap=lastEpilogueClock===null?0:Math.max(0,time-lastEpilogueClock);if(stampSequence.active)stampSequence.at+=gap;lessonAt+=gap;claimsLockedUntil+=gap;deathMeter.at+=gap;room?.shiftClock(gap);lastEpilogueClock=time;return;}for(const a of root.getAnimations({subtree:true}))if(a._backgroundPaused){a._backgroundPaused=false;a.play();}if(lastEpilogueClock===null)lastEpilogueClock=time;const dt=document.hidden?0:Math.max(0,time-lastEpilogueClock);lastEpilogueClock=time;syncClass(time);advanceStamp(time);syncLesson(time);if(isClaimsRoute())renderClaimsControls();if(!renderFrame)return;world.renderer.info.reset();if(['classroom','lesson','claims','negotiation','settlement-result','class-wait','class-stamping','class-result','rating','rating-result','final','class-invite'].includes(route)){ensureRoom().render(world.renderer,time,world.container.clientWidth,world.container.clientHeight);}else world.composer.render();world.renderCount++;},
  dispose(){disposed=true;transitionAnimation?.cancel();objectionAnimation?.cancel();toast.getAnimations().forEach(a=>a.cancel());dialog.close();events.abort();if(active){busy=false;close();}room?.dispose();if(exportUrl)URL.revokeObjectURL(exportUrl);root.remove();entry.remove();toast.remove();epilogue.remove();rebuildButton.remove();}};
 const rebuildButton=E('button','postgame-toggle','切換崩塌後');rebuildButton.type='button';rebuildButton.hidden=true;mount.append(rebuildButton);
 rebuildButton.addEventListener('click',()=>{if(mission.state.postgame&&!active&&!mission.state.paused&&!world.streetShow.active){if(world.streetShow.start())rebuildButton.disabled=true;}},{signal:events.signal});
 const update=api.update;api.update=()=>{update();rebuildButton.hidden=!mission.state.postgame||active;rebuildButton.disabled=!!world.streetShow?.active||mission.state.paused;rebuildButton.textContent=world.streetShow?.state.mode==='collapsed'?'復原房子':'拆掉房子';};world.bonus=api;updateEntry();return api;
}
