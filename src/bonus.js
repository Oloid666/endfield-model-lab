import {BonusProgress,ClaimTrial,LESSONS,CLASS_MOTTO,EVIDENCE,CLAIM_FIELDS,LESSON_NOTES,CLAIM_CLUES,CLAIM_DECLARATIONS,ClassCourse,CLASS_REQUIRED,lessonCardCount} from './bonus-data.js';
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
  if(n.userData.bonusSign||n.userData.originalSign)return true;
  if(!n.material?.transparent)return false;
 }
 return false;
}
export function createBonus({mount,world,mission,exploration,playEffect=()=>{}}){
 let storage;try{storage=window.localStorage;}catch{/* Ephemeral mode. */}
 const progress=new BonusProgress(storage),trial=new ClaimTrial(),events=new AbortController(),stampSequence=new StampSequence(),course=new ClassCourse(progress.data.course),deathMeter=new SmoothMeter();
 let active=false,route='rooms',lessonIndex=0,pageIndex=0,room=null,snapshot=null,busy=false,disposed=false,transitionAnimation=null,exportUrl=null,exportBlob=null;
 let responseIndex=0,lessonAt=0,lessonKey='',boardExpanded=false,lastReveal=-1,dialogOpener=null,dialogScroll=0,dialogSelection=false,stampPhase='',stampKind='claim',dialogKind='';
 const entry=E('button','bonus-entry','二周目 · 樓上請 ↗');entry.type='button';entry.hidden=true;entry.dataset.action='open';
 const toast=E('p','bonus-toast');toast.hidden=true;toast.setAttribute('role','status');
 const root=E('section','bonus-ui');root.hidden=true;root.setAttribute('aria-label','二周目・樓上請');
 const header=E('header','bonus-header'),title=E('span','bonus-room-name'),nav=E('div','bonus-nav');
 const panel=E('section','bonus-panel'),toolbar=E('div','bonus-reading-tools'),content=E('div','bonus-content');content.tabIndex=-1;panel.append(toolbar,content);
 const classMeter=E('section','bonus-class-meter');classMeter.hidden=true;const deathLabel=E('span','','笑點死亡率 0%'),deathTrack=E('div','bonus-death-track'),deathFill=E('i'),deathHint=E('small');deathTrack.setAttribute('role','progressbar');deathTrack.setAttribute('aria-label','笑點死亡率');deathTrack.setAttribute('aria-valuemin','0');deathTrack.setAttribute('aria-valuemax','100');deathTrack.append(deathFill);classMeter.append(deathLabel,deathTrack,deathHint);panel.prepend(classMeter);
 const classDock=E('footer','bonus-class-dock'),classPrimary=E('button','bonus-primary','開講 →'),classContinue=E('button','bonus-class-continue','繼續看 →');classDock.hidden=true;classPrimary.type=classContinue.type='button';classPrimary.dataset.action='class-next';classContinue.dataset.action='class-continue';classContinue.hidden=true;classDock.append(classContinue,classPrimary);
 const boardCaption=E('aside','bonus-board-caption');boardCaption.hidden=true;boardCaption.setAttribute('aria-label','黑板重點');
 const curtain=E('div','bonus-curtain');curtain.setAttribute('aria-hidden','true');
 const dialog=E('dialog','bonus-dialog');dialog.setAttribute('aria-label','附件與出處');
 root.append(header,panel,boardCaption,classDock,curtain,dialog);header.append(title,nav);mount.append(entry,toast,root);
 function button(parent,text,action,value,cls='') {const b=E('button',cls,text);b.type='button';b.dataset.action=action;if(value!==undefined)b.dataset.value=value;parent.append(b);return b;}
 function heading(kicker,text,description){content.append(E('p','bonus-kicker',kicker),E('h2','',text));if(description)content.append(E('p','bonus-description',description));}
 function focusContent(){content.focus({preventScroll:true});content.scrollTop=0;panel.scrollTop=0;}
 function reducedMotion(){return matchMedia('(prefers-reduced-motion: reduce)').matches;}
 function preferences(){mount.classList.toggle('bonus-reading',active&&progress.data.reading);root.style.setProperty('--bonus-text-size',`${progress.data.textSize}px`);root.dataset.textSize=String(progress.data.textSize);toolbar.replaceChildren();button(toolbar,progress.data.reading?'看演出':'專心閱讀','reading');button(toolbar,`字級 ${progress.data.textSize} · 調整`,'text-size');toolbar.hidden=!active||['warning','rooms'].includes(route)||isClassRoute();}
 function isClassRoute(){return ['classroom','lesson','class-wait','class-stamping','class-result'].includes(route);}
 function persistCourse(){progress.data.course=course.saved;progress.save();}
 function selectLesson(id,resume=false){lessonIndex=LESSONS.findIndex(l=>l.id===id);if(lessonIndex<0)lessonIndex=0;const steps=resume?Math.min(course.steps[LESSONS[lessonIndex].id]||0,lessonCardCount(id)-1):0;pageIndex=Math.min(4,steps);enterLessonPage();responseIndex=Math.max(0,steps-4);route='lesson';}
 function renderClassControls(){
  const show=active&&isClassRoute();classDock.hidden=classMeter.hidden=!show;root.classList.toggle('bonus-class-flow',show);root.dataset.classStage=route;classContinue.hidden=route!=='class-result'||!course.next();
  classPrimary.disabled=['class-wait','class-stamping'].includes(route);
  classPrimary.textContent=route==='classroom'?(course.stamped?(course.next()?'繼續看（自由）→':'查看死亡證明'):'開講 →'):route==='class-result'?'下課 · 完成 ✓':route==='class-wait'?'笑點正在死亡…':route==='class-stamping'?'正在蓋章…':'繼續 →';
 }
 function showClassMenu(){
  const d=modal('課堂選單');dialogKind='class-menu';d.dataset.kind='class-menu';
  if(route==='lesson'){button(d,'上一段','prev');button(d,'看黑板','board');button(d,'出處與劇內設定','sources');}
  button(d,progress.data.reading?'切回演出':'專心閱讀','reading');button(d,`字級 ${progress.data.textSize} · 調整`,'text-size');
  const details=E('details','bonus-class-catalog');details.append(E('summary','','自由選篇（不必全部看）'));LESSONS.forEach(l=>button(details,`${course.completed.includes(l.id)?'✓ ':''}${l.title}`,'lesson-id',l.id));d.append(details);
  if(course.stamped)button(d,'查看死亡證明','class-certificate');button(d,'選其他房間','class-rooms');button(d,'返回街景','close');button(d,'重新上課 · 死亡條歸零','class-reset',undefined,'bonus-text-button');
 }
 function advanceClass(){
  if(route==='class-result'){close();return;}
  if(route==='classroom'){
   if(course.eligible&&!course.stamped)route='class-wait';
   else if(course.next())selectLesson(course.next(),true);
   else route='class-result';
  }else if(route==='lesson'){
   const l=LESSONS[lessonIndex],cursor=pageIndex<4?pageIndex:4+responseIndex;
   course.confirm(l.id,cursor);persistCourse();deathMeter.set(course.percentage,world.time,reducedMotion());
   if(cursor+1>=lessonCardCount(l.id)){
    progress.mark('read',l.id);
    if(course.eligible&&!course.stamped)route='class-wait';
    else if(course.next())selectLesson(course.next(),true);
    else route='class-result';
   }else if(pageIndex<4){pageIndex++;enterLessonPage();}else responseIndex++;
  }else return;
  render();panel.scrollTop=0;classPrimary.focus({preventScroll:true});syncClass(world.time);
 }
 function syncClass(time){
  if(!isClassRoute())return;
  deathMeter.set(course.percentage,time,reducedMotion());const value=deathMeter.value(time),display=Math.min(100,Math.round(value));
  deathFill.style.transform=`scaleX(${value/100})`;deathTrack.setAttribute('aria-valuenow',String(display));deathLabel.textContent=`笑點死亡率 ${display}%`;deathHint.textContent=course.stamped?'死亡證明已開立 · 剩下的自由看':`已解剖 ${Math.min(course.completed.length,CLASS_REQUIRED)} / ${CLASS_REQUIRED} 篇 · 不必全部看完`;
  if(route==='class-wait'&&value>=99.99){
   stampKind='class';stampSequence.start(time,reducedMotion());stampPhase='';route='class-stamping';room.resetPaper();room.board('笑點已死亡',['手術成功，笑點死亡。','本教室不提供笑點復活服務。'],0,time,true,'graduation');room.perform('dismissed');room.stamp(time,'笑點已死亡');render();classPrimary.focus({preventScroll:true});
  }
 }
 function lessonTurns(){return LESSONS[lessonIndex].aside.split('\n');}
 function enterLessonPage(){lessonAt=world.time;lastReveal=-1;responseIndex=0;boardExpanded=false;lessonKey=`${lessonIndex}:${pageIndex}:${lessonAt}`;}
 function keepPosition(action,value){const y=panel.scrollTop;render();panel.scrollTop=y;const node=[...root.querySelectorAll('[data-action]')].find(n=>n.dataset.action===action&&n.dataset.value===value);node?.focus({preventScroll:true});}
 function updateEntry(){entry.hidden=active||!progress.data.unlocked||!['ready','complete'].includes(mission.state.phase);}
 function ensureRoom(){if(!room)room=createBonusRoom();return room;}
 function notice(text){toast.textContent=text;toast.hidden=false;toast.getAnimations().forEach(a=>a.cancel());const a=toast.animate([{opacity:1},{opacity:1,offset:.85},{opacity:0}],{duration:4200,fill:'forwards'});a.onfinish=()=>{toast.hidden=true;};}
 function setExterior(){
  world.setCutaway(false);world.camera.position.set(1,6.2,13);world.camera.fov=46;world.controls.target.set(0,4.5,1.5);world.camera.lookAt(world.controls.target);world.camera.updateProjectionMatrix();
 }
 function open(){
  if(active||busy||!progress.data.unlocked||!['ready','complete'].includes(mission.state.phase))return;
  snapshot={time:world.time,position:world.camera.position.clone(),quaternion:world.camera.quaternion.clone(),target:world.controls.target.clone(),fov:world.camera.fov,currentView:world.currentView,autoCamera:world.autoCamera,manualUntil:world.manualUntil,transition:world.transition,cutaway:world.cutawayActive,walking:exploration.active,paused:mission.state.paused,controls:world.controls.enabled,inert:[]};
  exploration.setActive(false);mission.setPaused(true);world.transition=null;world.controls.enabled=false;active=true;
  for(const node of mount.children){if([root,entry,toast,world.container].includes(node))continue;snapshot.inert.push([node,node.inert]);node.inert=true;}
  mount.classList.add('bonus-active');root.hidden=false;toast.hidden=true;route=progress.data.warned?'rooms':'warning';setExterior();world.resize();render();updateEntry();focusContent();
 }
 function close(){
  if(!active||busy)return;dialog.close();if(exportUrl){URL.revokeObjectURL(exportUrl);exportUrl=null;exportBlob=null;}
  stampSequence.cancel();active=false;root.hidden=true;mount.classList.remove('bonus-active','bonus-reading');for(const [node,inert]of snapshot.inert)node.inert=inert;
  world.setCutaway(snapshot.cutaway);exploration.setActive(snapshot.walking);
  world.currentView=snapshot.currentView;world.autoCamera=snapshot.autoCamera;world.manualUntil=Number.isFinite(snapshot.manualUntil)?snapshot.manualUntil+world.time-snapshot.time:snapshot.manualUntil;world.transition=snapshot.transition?{...snapshot.transition,start:snapshot.transition.start+world.time-snapshot.time}:null;world.controls.enabled=snapshot.controls;
  world.resize();world.camera.position.copy(snapshot.position);world.camera.quaternion.copy(snapshot.quaternion);world.camera.fov=snapshot.fov;world.controls.target.copy(snapshot.target);world.camera.updateProjectionMatrix();
  // Consume the source-clock gap while still paused, then restore its prior state.
  mission.update(world.time);mission.setPaused(snapshot.paused);updateEntry();entry.focus();snapshot=null;
 }
 async function travel(destination){
  if(busy||disposed)return;busy=true;root.setAttribute('aria-busy','true');dialog.close();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  try{
   // Show the two side windows before changing the cutaway stage.
   route='exterior';setExterior();title.textContent='二樓 · 左室教室／右室理賠';
   if(!reduced){transitionAnimation=curtain.animate([{opacity:0},{opacity:0,offset:.35},{opacity:1}],{duration:650,fill:'forwards'});await transitionAnimation.finished;}
   if(disposed)return;route=destination;
   if(destination==='rooms')setExterior();else ensureRoom().setMode(destination==='classroom'||destination==='lesson'?'classroom':'claims');
   render();focusContent();
   if(!reduced){transitionAnimation=curtain.animate([{opacity:1},{opacity:0}],{duration:300,fill:'forwards'});await transitionAnimation.finished;}
  }catch(e){if(e.name!=='AbortError')throw e;}finally{busy=false;root.removeAttribute('aria-busy');}
 }
 function render(){
  content.replaceChildren();nav.replaceChildren();preferences();renderClassControls();boardCaption.hidden=true;
  title.textContent=route==='rooms'||route==='warning'?'二周目 · 樓上請':isClassRoute()?'二樓左室 · 笑點解析小教室':'二樓右室 · 理賠中心';
  if(isClassRoute())button(nav,'☰ 選單','class-menu');else{if(route!=='warning'&&route!=='rooms')button(nav,'選房','rooms');button(nav,'返回街景','close');}
  if(route==='warning'){
   heading('課後時間','這裡會把包袱拆開來講。','包含完整劇情與結尾解析。還沒看完主線的話，可以先回去吃晚餐。');button(content,'知道了，樓上請','confirm',undefined,'bonus-primary');return;
  }
  if(route==='rooms'){
   heading('711 · AFTER HOURS','樓上還沒下班',mission.state.phase==='complete'?'龍泡泡：樓都沒了，課還在。左室上課，右室理賠。':'中央機房仍在值班。左右兩間，今晚加開。');
   const cards=E('div','bonus-cards');content.append(cards);
   for(const [name,action,desc,number]of [['笑點解析小教室','classroom','龍泡泡授課。八堂解析，附笑點死亡證明。','01 / 左室'],['事故調查暨理賠中心','claims','同一案件，兩種玩法。先試辦，再決定要怎麼辦。','02 / 右室']]){const card=E('article','bonus-card');card.append(E('small','',number),E('h3','',name),E('p','',desc));button(card,'進入 →',action);cards.append(card);}return;
  }
  if(route==='classroom'){
   ensureRoom().board('笑點解析小教室',CLASS_MOTTO,Math.max(0,1-course.percentage/100),world.time,false,'welcome');room.setFocus('wide');room.perform('explain');
   heading('龍泡泡主講 · 輕鬆聽三篇','笑點解析小教室',course.stamped?'上次的死亡證明還有效。想繼續看，再按下方就好。':'解釋笑話就像解剖青蛙。看滿三篇就能結業，其餘自由看。');
   content.append(E('p','bonus-description','拇指留在下方，按「繼續」就能一路聽完。選篇、字級和出處都收在右上選單。'));return;
  }
  if(route==='lesson'){
   const l=LESSONS[lessonIndex],last=l.analysis.length+1,turns=lessonTurns(),reaction=pageIndex===last;
   heading(`課程 ${lessonIndex+1} / ${LESSONS.length} · ${pageIndex+1} / ${last+1}`,l.title);
   let text,kicker;
   if(pageIndex===0){kicker='原句回顧';text=l.recap;room.setFocus('wide');}
   else if(!reaction){kicker=`逐步解析 ${pageIndex} / ${l.analysis.length}`;text=l.analysis[pageIndex-1];room.setFocus(pageIndex===2?'board':'teacher');}
   else {kicker=`下課前的最後一刀 · ${responseIndex+1} / ${turns.length}`;text=turns[responseIndex];room.setFocus('reaction');}
   const notes=reaction?[l.diagnosis,'繼續解剖，笑點逐漸死亡。']:pageIndex===0?['回顧原句','鋪陳 → 反差 → 回收']: [LESSON_NOTES[l.id][pageIndex-1],`第 ${pageIndex} 刀：${['鋪陳','反差','回收'][pageIndex-1]}`,'笑點仍在搶救中。'];
   room.board(l.board,notes,Math.max(0,1-course.percentage/100),lessonAt,false,lessonKey);
   room.perform(reaction?(text.startsWith('莊：')?'interrupted':responseIndex===turns.length-1&&lessonIndex===7?'dismissed':'awkward'):'explain');
   content.append(E('p','bonus-section-label',kicker),E('p',reaction?'bonus-reading bonus-spoken':'bonus-reading',text));
   syncLesson(world.time);return;
  }
  if(route==='class-wait'||route==='class-stamping'){
   heading('解剖報告 · 正在結業','笑點搶救無效');const label=E('p','bonus-stamp-progress',route==='class-wait'?'解析完成 · 死亡率持續上升':'抬章 · 開立死亡證明');label.setAttribute('role','status');content.append(label);return;
  }
  if(route==='class-result'){
   room.board('笑點已死亡',['手術成功，笑點死亡。','剩下的解析，自由繼續看。'],0,world.time,false,'certificate');room.perform('dismissed');
   heading('笑點解析小教室 · 結業','手術成功，笑點已死亡');const paper=E('article','bonus-paper');paper.append(E('p','bonus-document-id','死亡證明 · 龍泡泡簽發'),E('h3','','笑點已死亡'),E('p','',`已完成 ${course.completed.length} 篇解剖。死亡率 100%。`),E('p','','死因：講得太清楚。'),E('strong','bonus-stamp','笑點已死亡'));content.append(paper,E('p','bonus-description',course.next()?`莊：可以下課了？\n龍泡泡：可以。剩下 ${LESSONS.length-course.completed.length} 篇，想聽再聽。`:'龍泡泡：全部講完了。連復活的希望也解釋掉了。'));return;
  }
  if(route==='claims'){
   heading('武陵 · 試辦櫃檯','711 雷擊與建物損失案','同一份申請、同一組證據。兩種辦法都能玩，沒有倒數。');
   const cards=E('div','bonus-cards');content.append(cards);
   for(const [id,name,desc]of [['A','找矛盾，再蓋章','翻證據，指出申報不符的地方。約 3 分鐘。'],['B','荒謬填單，看反應','自己選原因、責任人和損失範圍。約 2 分鐘。']]){const card=E('article','bonus-card');card.append(E('small','',`${id}${progress.data.finished.includes(id)?' · 已試辦':''}`),E('h3','',name),E('p','',desc));button(card,'開始試辦 →','trial',id);cards.append(card);}
   if(['A','B'].every(id=>progress.data.finished.includes(id))){const f=E('div','bonus-preference');f.append(E('p','','兩版都辦過了，你比較喜歡？'));for(const [id,text]of [['A','找矛盾'],['B','填單'],['both','兩種都保留']]){const b=button(f,text,'preference',id);b.setAttribute('aria-pressed',String(progress.data.preference===id));}f.append(E('small','','選擇只記在這台裝置，方便下次回報。'));content.append(f);}return;
  }
  if(route==='trial'){
   heading(`試辦 ${trial.mode} · WUL-711-01`,trial.mode==='A'?'把矛盾指出來':'請協助填寫事故資料');
   const evidence=E('div','bonus-evidence');content.append(evidence);EVIDENCE.forEach(e=>button(evidence,e.title,'evidence',e.id));
   if(trial.mode==='A'){
    content.append(E('p','bonus-description','選申報欄位，翻附件點出原句或照片位置，最後提出矛盾。'));
    const fields=E('div','bonus-fields');content.append(fields);
    for(const [id,text]of Object.entries(CLAIM_DECLARATIONS)){const b=button(fields,`${trial.found.includes(id)?'✓ ':''}${text}`,'compare-field',id);b.setAttribute('aria-pressed',String(trial.field===id));b.disabled=trial.found.includes(id);}
    if(trial.field){
     const pair=E('section','bonus-comparison');pair.setAttribute('aria-label','申報與證據對照');pair.append(E('p','bonus-section-label','正在核對的申報'),E('blockquote','',CLAIM_DECLARATIONS[trial.field]));
     const clue=CLAIM_CLUES.find(c=>c.id===trial.clue);
     if(clue){pair.append(E('span','bonus-contradiction-arrow','↕ 對照'),E('p','bonus-section-label','你指出的證據'),E('blockquote','',clue.text));button(pair,'提出矛盾','compare',undefined,'bonus-primary');button(pair,'重新翻附件','evidence',clue.evidence);}
     else {pair.append(E('p','','翻閱附件，點選能反駁這一欄的內容。'));EVIDENCE.forEach(e=>button(pair,e.title,'evidence',e.id));}
     content.append(pair);
    }
    const status=E('p','bonus-response',trial.feedback);status.setAttribute('role','status');content.append(status);
    for(const proof of trial.proofs){const text=CLAIM_CLUES.find(c=>c.id===proof.clue).text;content.append(E('p','bonus-proof',`✓ ${CLAIM_DECLARATIONS[proof.field]} ↔ ${text}`));}
    content.append(E('p','bonus-section-label',`已確認 ${trial.found.length} / 2 組矛盾`));
    if(trial.found.length===2){const end=E('div','bonus-tools');content.append(end);button(end,'退回補件','finish-a','return');button(end,'依現場紀錄更正後受理','finish-a','accept','bonus-primary');}
   }else{
    CLAIM_FIELDS.forEach(field=>{const group=E('fieldset','bonus-fieldset');group.append(E('legend','',field.label));field.options.forEach(([id,text])=>{const b=button(group,text,'field',`${field.id}:${id}`);b.setAttribute('aria-pressed',String(trial.form[field.id]===id));});const selected=field.options.find(o=>o[0]===trial.form[field.id]);if(selected){const reaction=E('p','bonus-response',selected[2]);reaction.setAttribute('role','status');group.append(reaction);}content.append(group);});
    const finish=button(content,'確認填寫 · 蓋章','finish-b',undefined,'bonus-primary');finish.disabled=!CLAIM_FIELDS.every(f=>trial.form[f.id]);
   }
   button(content,'回到玩法選擇','claims',undefined,'bonus-text-button');return;
  }
  if(route==='stamping'){const back=nav.querySelector('[data-action=rooms]');if(back)back.disabled=true;heading('武陵 · 出單中','正在處理這份事故');const status=E('p','bonus-stamp-progress','抬章 · 核對紀錄');status.setAttribute('role','status');content.append(status,E('p','bonus-description','龍泡泡：這次只蓋章，不蓋在我名字上。'));return;}
  if(route==='result'){
   const result=trial.result;heading(`結案文件 · 試辦 ${trial.mode}`,'武陵事故處理單');
   const paper=E('article','bonus-paper');paper.append(E('p','bonus-document-id','WUL-711-01 · 戲內文件'),E('h3','','711 雷擊與建物損失案'));
   resultRows().forEach(text=>paper.append(E('p','',text)));paper.append(E('strong','bonus-stamp',result.status),E('p','bonus-document-note','案件受理不代表核賠。鄰棟另案，梨花另附。'));content.append(paper,E('p','bonus-response',result.aside));
   const tools=E('div','bonus-tools');content.append(tools);button(tools,'保存圖片','export',undefined,'bonus-primary');button(tools,'再辦一次','trial',trial.mode);button(tools,'換另一玩法','trial',trial.mode==='A'?'B':'A');button(tools,'玩法選擇／回報偏好','claims');
  }
 }
 function resultRows(){const rows=[];if(trial.mode==='B')for(const f of CLAIM_FIELDS)rows.push(`${f.label}：${f.options.find(o=>o[0]===trial.form[f.id])?.[1]||'未填'}`);else rows.push('核對事項：自然雷擊／主動發射；無損失／建物毀損。');rows.push('證據：申請書、現場發射紀錄、店面前後對照。',...trial.result.reasons);return rows;}
 function modal(titleText){dialog.dataset.kind='';dialogKind='';dialogSelection=false;if(!dialog.open){dialogOpener=document.activeElement;dialogScroll=panel.scrollTop;}dialog.replaceChildren();const bar=E('div','bonus-dialog-heading');bar.append(E('h3','',titleText));button(bar,'關閉','dialog-close');dialog.append(bar);if(!dialog.open)dialog.showModal();return dialog;}
 function showEvidence(id){
  const e=EVIDENCE.find(e=>e.id===id);if(!e)return;const d=modal(e.title),comparing=route==='trial'&&trial.mode==='A'&&trial.field;
  d.append(E('p','bonus-reading',e.text),E('small','',e.note));
  if(comparing)d.append(E('p','bonus-evidence-instruction',`核對：${CLAIM_DECLARATIONS[trial.field]}\n點出一句話或照片中的位置，帶回對照。`));
  if(id==='photos'){
   const pair=E('div','bonus-photo-pair');
   for(const [file,text]of [['before','案發前'],['after','案發後']]){
    const figure=E('figure'),photo=E('div','bonus-evidence-photo'),img=E('img');img.src=`${import.meta.env.BASE_URL}images/bonus/${file}.png`;img.alt=`${text}的便利店固定取景`;photo.append(img);
    if(file==='after'&&comparing){const damage=button(photo,'①','clue','damage','bonus-photo-region bonus-photo-damage');damage.setAttribute('aria-label','指出店面與招牌的毀損');const pear=button(photo,'②','clue','pear-safe','bonus-photo-region bonus-photo-pear');pear.setAttribute('aria-label','指出保留的梨花');}
    figure.append(photo,E('figcaption','',text));pair.append(figure);
   }
   d.append(pair);
  }
  if(comparing){const clues=E('div','bonus-clues');CLAIM_CLUES.filter(c=>c.evidence===id).forEach(c=>button(clues,id==='photos'?(c.id==='damage'?'① 店面與招牌':'② 梨花樹'):c.text,'clue',c.id));d.append(clues);}
 }
 function showSources(){const l=LESSONS[lessonIndex],d=modal('出處與劇內設定');d.append(E('p','', '台詞回顧引用目前版本的劇本；情節解析是本作品的解讀。未核實的社群口號、事件或歌詞來源不指定作者／作品。'));for(const source of l.sources){const a=E('a','',`${source.label} ↗`);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';d.append(a);}if(!l.sources.length)d.append(E('p','','本章以劇內鋪陳與回收為主，沒有新增外部來源主張。'));}
 function exportPaper(){
  if(exportUrl)URL.revokeObjectURL(exportUrl);exportUrl=null;exportBlob=null;
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1500;const c=canvas.getContext('2d');
  c.fillStyle='#eee6cd';c.fillRect(0,0,1080,1500);c.strokeStyle='#36594a';c.lineWidth=5;c.strokeRect(45,45,990,1410);c.fillStyle='#28483e';c.font='bold 48px sans-serif';c.fillText('武陵事故處理單',90,145);c.font='26px sans-serif';c.fillText(`WUL-711-01 / 試辦 ${trial.mode} / 戲內文件`,90,205);let y=285;
  for(const line of ['711 雷擊與建物損失案',...resultRows(),'','案件受理不代表核賠。鄰棟另案，梨花另附。']){let part='';for(const ch of line){if(c.measureText(part+ch).width>880){c.fillText(part,90,y);part='';y+=44;}part+=ch;}c.fillText(part,90,y);y+=58;}
  c.save();c.translate(700,1260);c.rotate(-.1);c.strokeStyle=c.fillStyle='#a34b3b';c.lineWidth=6;c.strokeRect(-160,-70,330,120);c.font='bold 60px sans-serif';c.fillText(trial.result.status,-145,12);c.restore();
  const d=modal('保存事故處理單');d.append(E('p','','可下載圖片；手機也可以長按圖片保存。'));
  canvas.toBlob(blob=>{if(!blob||disposed||!dialog.open)return;exportBlob=blob;exportUrl=URL.createObjectURL(blob);const img=E('img','bonus-export');img.src=exportUrl;img.alt='本次理賠結案書';const a=E('a','bonus-download','下載結案書 PNG');a.href=exportUrl;a.download=`WUL-711-01-${trial.mode}.png`;d.append(a,img);if(navigator.share&&navigator.canShare?.({files:[new File([blob],'WUL-711-01.png',{type:'image/png'})]}))button(d,'分享圖片','share');},'image/png');
 }
 function syncLesson(time){
  if(route!=='lesson')return;
  const l=LESSONS[lessonIndex],reaction=pageIndex===l.analysis.length+1,state=lessonFrame(time-lessonAt,reaction&&course.eligible,reducedMotion());
  boardCaption.hidden=!(boardExpanded||pageIndex===2||reaction);
  if(state.reveal!==lastReveal){if(lastReveal>=0&&!reducedMotion())playEffect('chalk');lastReveal=state.reveal;}
  const key=`${lessonKey}:${state.reveal}:${state.dead}`;
  if(boardCaption.dataset.key!==key){boardCaption.dataset.key=key;boardCaption.replaceChildren(E('strong','',l.board));
   const lines=reaction?[l.diagnosis,'笑點死亡率逐步上升。']:[pageIndex?LESSON_NOTES[l.id][pageIndex-1]:'鋪陳 → 反差 → 回收','先看關鍵詞，再拆解。'];
   lines.slice(0,state.reveal+1).forEach(line=>boardCaption.append(E('p','',line)));
  }
 }
 function beginStamp(){
  if(route!=='trial'||!trial.result)return;
  if(!stampSequence.start(world.time,reducedMotion()))return;
  stampKind='claim';stampPhase='';route='stamping';room.stamp(world.time,trial.result.status);render();focusContent();
 }
 function advanceStamp(time){
  if(!['stamping','class-stamping'].includes(route))return;
  const beat=stampSequence.advance(time);if(beat.impact)playEffect('stamp');
  if(beat.phase!==stampPhase){stampPhase=beat.phase;const label=content.querySelector('.bonus-stamp-progress');if(label)label.textContent={lifting:stampKind==='class'?'抬章 · 確認死亡':'抬章 · 核對紀錄',impact:'落印 · '+(stampKind==='class'?'笑點已死亡':trial.result.status),printing:stampKind==='class'?'開立笑點死亡證明':'出單 · 附上現場紀錄',complete:'出單完成'}[beat.phase]||'處理中';}
  if(beat.done){if(stampKind==='class'){course.certify();persistCourse();route='class-result';render();classPrimary.focus({preventScroll:true});}else{progress.mark('finished',trial.mode);route='result';render();focusContent();}}
 }
 async function dispatch(action,value){
  if(busy||disposed)return;
  if(['stamping','class-stamping','class-wait'].includes(route)&&!['close','reading','text-size','class-menu','class-rooms'].includes(action))return;
  switch(action){
   case 'class-next':advanceClass();return;
   case 'class-menu':showClassMenu();return;
   case 'class-certificate':if(!course.stamped)return;dialog.close();route='class-result';render();classPrimary.focus({preventScroll:true});return;
   case 'class-rooms':dialog.close();await travel('rooms');return;
   case 'class-continue':if(!course.next())return;selectLesson(course.next(),true);render();panel.scrollTop=0;classPrimary.focus({preventScroll:true});return;
   case 'class-reset':course.steps={};course.stamped=false;persistCourse();deathMeter.reset(world.time);dialog.close();route='classroom';room.resetPaper();render();classPrimary.focus({preventScroll:true});return;
   case 'lesson-id':dialog.close();selectLesson(value);render();panel.scrollTop=0;classPrimary.focus({preventScroll:true});return;
   case 'reading':progress.data.reading=!progress.data.reading;progress.save();preferences();if(dialogKind==='class-menu'){showClassMenu();dialog.querySelector('[data-action=reading]')?.focus({preventScroll:true});}else toolbar.querySelector('[data-action=reading]')?.focus({preventScroll:true});return;
   case 'text-size':progress.data.textSize={18:22,22:26,26:18}[progress.data.textSize];progress.save();preferences();if(dialogKind==='class-menu'){showClassMenu();dialog.querySelector('[data-action=text-size]')?.focus({preventScroll:true});}else toolbar.querySelector('[data-action=text-size]')?.focus({preventScroll:true});return;
   case 'open':open();return;
   case 'close':close();return;
   case 'confirm':progress.data.warned=true;progress.save();route='rooms';break;
   case 'rooms':await travel('rooms');return;
   case 'classroom':if(route==='lesson'){route='classroom';break;}await travel('classroom');return;
   case 'claims':if(['trial','stamping','result','class-wait','class-stamping','class-result'].includes(route)){route='claims';break;}await travel('claims');return;
   case 'lesson':lessonIndex=Number(value);if(!LESSONS[lessonIndex])return;pageIndex=0;route='lesson';enterLessonPage();break;
   case 'next':pageIndex=Math.min(LESSONS[lessonIndex].analysis.length+1,pageIndex+1);enterLessonPage();break;
   case 'prev':dialog.close();if(pageIndex===4&&responseIndex>0)responseIndex--;else{pageIndex=Math.max(0,pageIndex-1);enterLessonPage();}break;
   case 'response-next':responseIndex=Math.min(lessonTurns().length-1,responseIndex+1);if(responseIndex===lessonTurns().length-1)progress.mark('read',LESSONS[lessonIndex].id);break;
   case 'next-lesson':if(responseIndex<lessonTurns().length-1)return;if(lessonIndex===LESSONS.length-1)route='classroom';else{lessonIndex++;pageIndex=0;enterLessonPage();}break;
   case 'board':dialog.close();boardExpanded=true;progress.data.reading=false;progress.save();preferences();room.setFocus('board');syncLesson(world.time);return;
   case 'sources':showSources();return;
   case 'dialog-close':dialog.close();return;
   case 'evidence':showEvidence(value);return;
   case 'trial':trial.reset(value);stampSequence.cancel();room.resetPaper();route='trial';break;
   case 'compare-field':if(!Object.hasOwn(CLAIM_DECLARATIONS,value))return;trial.field=value;trial.clue=null;keepPosition('compare-field',value);content.querySelector('.bonus-comparison')?.scrollIntoView({block:'nearest'});return;
   case 'clue':if(!trial.selectClue(value))return;dialogSelection=true;dialog.close();render();content.querySelector('.bonus-comparison')?.scrollIntoView({block:'nearest'});content.querySelector('[data-action=compare]')?.focus({preventScroll:true});return;
   case 'compare':trial.compare();render();content.querySelector('.bonus-response')?.scrollIntoView({block:'nearest'});return;
   case 'field':{const [field,id]=value.split(':');if(!CLAIM_FIELDS.find(f=>f.id===field)?.options.some(o=>o[0]===id))return;trial.form[field]=id;const scroll=panel.scrollTop;render();panel.scrollTop=scroll;content.querySelector(`[data-value="${value}"]`)?.focus({preventScroll:true});return;}
   case 'finish-a':if(!trial.finishA(value))return;beginStamp();return;
   case 'finish-b':if(!trial.finishB())return;beginStamp();return;
   case 'preference':if(!['A','B','both'].includes(value))return;progress.data.preference=value;progress.save();render();return;
   case 'export':exportPaper();return;
   case 'share':if(exportBlob){try{await navigator.share({files:[new File([exportBlob],'WUL-711-01.png',{type:'image/png'})]});}catch{/* Download remains available after cancellation. */}}return;
   default:return;
  }
  render();focusContent();
 }
 root.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)dispatch(b.dataset.action,b.dataset.value);},{signal:events.signal});
 entry.addEventListener('click',open,{signal:events.signal});
 dialog.addEventListener('close',()=>{if(dialogSelection){dialogSelection=false;return;}panel.scrollTop=dialogScroll;if(dialogOpener?.isConnected)dialogOpener.focus({preventScroll:true});},{signal:events.signal});
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();},{signal:events.signal});
 root.addEventListener('keydown',e=>{if(!active)return;if(e.key==='Escape'&&!dialog.open){e.preventDefault();close();}if(e.key==='Tab'&&!dialog.open){const nodes=[...root.querySelectorAll('button,a[href]')].filter(n=>!n.disabled&&n.getClientRects().length);if(!nodes.length)return;const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===content)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}},{signal:events.signal});
 const api={get active(){return active;},get state(){return {active,route,busy,lesson:LESSONS[lessonIndex].id,page:pageIndex,response:responseIndex,room:room?.state||null,presentation:lessonFrame(world.time-lessonAt,course.eligible,reducedMotion()),stampPhase,taps:progress.taps,...structuredClone(progress.data),course:{...course.saved,completed:course.completed,percentage:course.percentage,display:deathMeter.value(world.time)},trial:{mode:trial.mode,found:[...trial.found],errors:trial.errors,clue:trial.clue,proofs:structuredClone(trial.proofs),form:{...trial.form},result:trial.result?structuredClone(trial.result):null}};},
  handleTap(ray){if(active)return true;const allowed=['ready','complete'].includes(mission.state.phase);if(!allowed){progress.tap(false,mission.state.phase);return false;}const sign=pickBonusSign(world,ray);if(progress.tap(sign,mission.state.phase)){notice('龍泡泡：樓上還沒下班。');mount.classList.add('bonus-unlocked');const flash=world.container.animate([{filter:'brightness(1)'},{filter:'brightness(1.7)'},{filter:'brightness(1)'}],{duration:320});flash.onfinish=()=>mount.classList.remove('bonus-unlocked');updateEntry();}return sign;},
  update(){if(!['ready','complete'].includes(mission.state.phase))progress.taps=0;updateEntry();},
  tick(time,render=true){syncClass(time);advanceStamp(time);syncLesson(time);if(!render)return;world.renderer.info.reset();if(['classroom','lesson','claims','trial','stamping','result','class-wait','class-stamping','class-result'].includes(route)){ensureRoom().render(world.renderer,time,world.container.clientWidth,world.container.clientHeight);}else world.composer.render();world.renderCount++;},
  dispose(){disposed=true;transitionAnimation?.cancel();toast.getAnimations().forEach(a=>a.cancel());dialog.close();events.abort();if(active){busy=false;close();}room?.dispose();if(exportUrl)URL.revokeObjectURL(exportUrl);root.remove();entry.remove();toast.remove();}};
 world.bonus=api;updateEntry();return api;
}
