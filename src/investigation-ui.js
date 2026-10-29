import {createPhotoViewer} from './photo-viewer.js';
import {portrait} from './portrait.js';
import './investigation.css';
const E=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n;};
const phases=new Set(['shoe-view','pylon-link','fire-ready','photo-flight','photo','photo-review','comm-request','hack','heat']);
export function createInvestigationUI({mount,machine,capture,onAuto,getAuto,onGuide}){
 const abort=new AbortController();let buildAbort=new AbortController(),building=false;
 const listen=(el,type,fn)=>el.addEventListener(type,fn,{signal:building?buildAbort.signal:abort.signal});
 const root=E('section','investigation-ui');root.hidden=true;
 const title=E('span','investigation-kicker'),message=E('p','investigation-message');message.setAttribute('aria-live','polite');
 const actions=E('div','investigation-actions'),photoStage=E('div','photo-stage'),photoInner=E('div','photo-inner'),image=E('img','photo-evidence');image.alt='你拍下的雨夜便利店照片';photoInner.append(image);photoStage.append(photoInner);
 const callPortrait=E('img','call-portrait');portrait(callPortrait);callPortrait.alt='弭弗通訊肖像';
 const puzzle=E('div','hack-circuit');puzzle.setAttribute('aria-label','轉動四塊彎線，從左上繞下方連到右上');
 const rhythm=E('div','rhythm-lane'),judgment=E('i','rhythm-judgment');rhythm.append(judgment);const notes=[];
 for(let i=0;i<4;i++){const n=E('span','rhythm-note');n.textContent='●';rhythm.append(n);notes.push(n);}
 const rhythmStatus=E('p','rhythm-status');
 root.append(title,callPortrait,message,photoStage,puzzle,rhythm,rhythmStatus,actions);mount.append(root);
 const auto=E('p','cinematic-toggle','自由觀看 · 點下一句回到演出');auto.type='button';mount.append(auto);listen(auto,'click',()=>onAuto?.());
 const viewer=createPhotoViewer({mount,signal:abort.signal,onSend:()=>machine.sendPhoto(),onRetake:()=>{photo=null;machine.photoFaceValid=true;machine.phaseTo('photo');}});
 let guidance='',guideSince=0,guidePending='';let viewButton=null;
 let phase='',photo=null,scale=1,dx=0,dy=0,held=null,animationKey='',animations=[],startPointer=null;
 const points=new Map();let gestureStart=null;
 const transform=()=>{photoInner.style.transform=`translate(${dx}px,${dy}px) scale(${scale})`;};
 const button=(label,fn,cls='')=>{const b=E('button',cls,label);b.type='button';listen(b,'click',fn);actions.append(b);return b;};
 let capturing=false,pendingCapture=false,captureGeneration=0,disposed=false;async function snapshot(){if(capturing||machine.paused||machine.phase!=='photo')return;const generation=++captureGeneration,entered=machine.entered;capturing=true;root.setAttribute('aria-busy','true');message.textContent='正在處理清晰遠景與人物近照…';try{const result=await capture();if(disposed||generation!==captureGeneration||machine.phase!=='photo'||machine.entered!==entered)return;photo=result;machine.photoFaceValid=result.faceValid!==false;scale=1;dx=dy=0;transform();if(machine.paused)pendingCapture=true;else machine.takePhoto();}catch(e){message.textContent=e.message;}finally{capturing=false;root.removeAttribute('aria-busy');}}
 function inspect(id){if(scale<1.2){message.textContent='先放大照片，再點你想調查的異常。';return;}machine.investigate(id);}
 function build(s){
   buildAbort.abort();buildAbort=new AbortController();building=true;
   phase=s.phase;root.dataset.phase=phase;actions.replaceChildren();puzzle.replaceChildren();photoInner.querySelectorAll('button').forEach(n=>n.remove());animations.forEach(a=>a.cancel());animations=[];animationKey='';
   photoStage.hidden=true;callPortrait.hidden=phase!=='comm-request';puzzle.hidden=phase!=='hack';rhythm.hidden=rhythmStatus.hidden=phase!=='heat';
   if(phase==='shoe-view'){title.textContent='導播 · 合乎舟禮';message.textContent='鞋子環繞中。先看完這一圈。';button('再來一碗',()=>machine.anotherBowl(),'shoe-again');button('吃飽了',()=>machine.next(),'shoe-continue');}
   if(phase==='pylon-link'){title.textContent='天師樁 · 接入中';message.textContent='鏡頭回到遠景，繼續接通供電。';}
   if(phase==='fire-ready'){title.textContent='武陵儲能網 · 發射系統';message.textContent='系統：充能完畢。指針接近中央時按下砲擊。';button('進入發射系統',()=>machine.next(),'fire-continue');}
   if(phase==='photo-flight'){title.textContent='龍泡泡 · 攝影就位';for(const [text,d]of [['後退',1],['前進',-1]]){const b=button(text,()=>{},'flight-step');b.dataset.direction=d;let down=false,pressedAt=0;listen(b,'pointerdown',e=>{down=true;pressedAt=performance.now();b.setPointerCapture(e.pointerId);machine.fly(0,d);});for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(b,type,()=>{if(down){down=false;if(performance.now()-pressedAt<180)machine.stepFlight(d);machine.fly(0,0);}});listen(b,'keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();machine.fly(0,d);}});listen(b,'keyup',()=>machine.fly(0,0));}button('可以拍了',()=>machine.finishFlight(),'flight-ready');}
   if(phase==='photo'){title.textContent='拍張照片 · 報平安';message.textContent='拖曳調整拍攝方向，雙指縮放 · 把 711 招牌也拍進去';button('拍好了，給她看看',snapshot,'photo-shutter');}
   if(phase==='photo-review'){
     title.textContent='莊方宜與龍泡泡';message.textContent='一起確認照片，再傳給管理員。';viewButton=button('放大看有沒有眨眼',()=>viewer.open(photo,viewButton,true),'photo-open');button('重新拍',()=>machine.phaseTo('photo'));button('傳送給管理員',()=>machine.sendPhoto(),'photo-send');viewer.open(photo,viewButton);
   }else if(viewer.active)viewer.hide();
   if(phase==='comm-request'){title.textContent='巡衛通訊 · 請求接入';message.textContent='巡衛隊長・弭弗 請求接入';button('◉ 接通',()=>machine.acceptCall(),'call-accept');}
   if(phase==='hack'){
     title.textContent='塞西 · 電網維護終端 / login.php';message.textContent='點一下轉動線路。繞過防火牆：四塊彎線接通入口與出口，再開始駭入。';
     for(let i=0;i<4;i++){const b=E('button','hack-tile');b.type='button';b.dataset.tile=i;b.setAttribute('aria-label',`旋轉第 ${i+1} 塊線路`);const wire=E('span','hack-wire','┏');b.append(wire);listen(b,'click',()=>machine.hackRotate(i));puzzle.append(b);}
     button('開始駭入',()=>machine.hackSubmit());
   }
   if(phase==='heat'){
     title.textContent='微波加熱 · 功率控制';
     const hit=button('開始送電',()=>{},'rhythm-pad');hit.setAttribute('aria-label','節拍送電，圓點短按，長條按住到尾端');
     listen(hit,'pointerdown',e=>{if(e.isPrimary===false||e.button>0||held!==null||machine.paused)return;e.preventDefault();held=e.pointerId;hit.setPointerCapture(e.pointerId);machine.heatStart(source(e));});
     listen(hit,'pointerup',e=>{if(held!==e.pointerId)return;e.preventDefault();held=null;machine.heatStop(source(e));});
     for(const type of ['pointercancel','lostpointercapture'])listen(hit,type,()=>{if(held!==null){held=null;machine.heatCancel();}});
     listen(hit,'keydown',e=>{if(['Space','Enter'].includes(e.code)&&!e.repeat){e.preventDefault();machine.heatStart(source(e));}});listen(hit,'keyup',e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();machine.heatStop(source(e));}});
     button('重試本段',()=>{held=null;machine.heatRetry();},'rhythm-retry');
   }
   building=false;
 }
 let sourceAnchor=0,perfAnchor=performance.now();
 function source(e){let stamp=Number(e?.timeStamp)||performance.now();if(stamp>1e12)stamp-=performance.timeOrigin;return sourceAnchor+(stamp-perfAnchor)/1000;}
 function update(s){
   if(['intro','ready'].includes(s.phase)&&photo){photo=null;viewer.reset();}
   if(pendingCapture&&!s.paused&&s.phase==='photo'){pendingCapture=false;machine.takePhoto();return;}
   if(s.phase!=='photo-review'&&viewer.active)viewer.hide();
   if(s.phase!=='photo'){pendingCapture=false;captureGeneration++;}
   viewer.setPaused(s.paused);
   sourceAnchor=machine.sourceTime;perfAnchor=performance.now();
   auto.textContent='自由觀看 · 點下一句回到演出';auto.hidden=!!getAuto?.()||['photo-flight','photo','photo-review','hack','heat'].includes(s.phase);
   root.dataset.phase=s.phase;root.hidden=!phases.has(s.phase);if(root.hidden){if(phase!==s.phase){animations.forEach(a=>a.cancel());animations=[];phase=s.phase;}return;}if(phase!==s.phase)build(s);
   root.dataset.paused=String(s.paused);for(const b of root.querySelectorAll('button'))b.disabled=s.paused||capturing||b.classList.contains('photo-send')&&photo?.faceValid===false;
   if(s.phase==='shoe-view'){message.textContent=s.shoeReady?'龍泡泡：還要再看一圈？':'鞋子環繞中。先看完這一圈。';for(const b of actions.children)b.hidden=!s.shoeReady;}
   if(s.phase==='photo-flight'){const f=s.flight,zone=f.z<9.9?'近':f.z>11.1?'遠':'好';if(guidePending!==zone){guidePending=zone;guideSince=s.clock;}if((s.clock-guideSince>=.6||!guidance)&&guidance!==zone){guidance=zone;onGuide?.();}title.textContent='莊方宜 · 攝影就位';message.textContent=guidance==='好'?'莊：對，就這裡。可以拍了。':guidance==='遠'?'莊：太遠了，回來一些。':'莊：再退一點。';actions.querySelector('.flight-ready').disabled=!f.ready||s.paused;}
   if(s.phase==='hack'){if(s.hack.failures)message.textContent=s.hack.failures>1?'輔助路徑：┓ ┏ / ┗ ┛（由上至下）。':'線路未接通。入口在左上，出口在右上；先向下繞一圈。';}if(s.phase==='hack')for(let i=0;i<4;i++){const b=puzzle.children[i],turn=s.hack.turns[i];b.firstChild.style.transform=`rotate(${turn*90}deg)`;b.classList.toggle('connected',turn===[1,0,2,3][i]);}
   if(s.phase==='heat'){
     const h=s.heat,playing=h.status==='playing';
     message.textContent=h.status==='ready'?(h.completed?`第 ${h.completed+1} 段準備。圓點短按，長條按住到尾端。`:'第一輪：額定功率測試。圓點短按，長條按住。'):h.result||'電流到金線時按下。長條要按到尾端。';
     rhythmStatus.textContent=`${h.completed} / 3 段 · ${h.bpm} BPM · ${h.failures?'輔助 '+Math.min(3,h.failures):'標準'}${h.status==='burnt'?' · 已斷電':''}`;
     const pad=actions.querySelector('.rhythm-pad'),retry=actions.querySelector('.rhythm-retry');pad.textContent=h.status==='ready'?'開始送電':h.holding?'按住，等尾端到線':'● 短按 ／ ━ 長按';pad.disabled=s.paused||h.status==='burnt';retry.hidden=h.status!=='burnt';
     const key=`${h.attempts}:${h.round}`;
     if(playing&&animationKey!==key){animations.forEach(a=>a.cancel());animations=[];animationKey=key;for(let i=0;i<4;i++){const note=h.notes[i],n=notes[i];n.textContent=note.type==='hold'?'━':'●';n.style.width=note.type==='hold'?`${(note.end-note.at)*20}cqw`:'auto';const a=n.animate([{transform:'translateX(100cqw)'},{transform:'translateX(-30cqw)'}],{duration:6500,fill:'both',easing:'linear'});a.pause();animations.push(a);}}
     for(let i=0;i<4;i++){const note=h.notes[i],n=notes[i];n.hidden=!playing||!note;n.dataset.result=note?.result||'';if(note&&animations[i]){const wanted=(h.elapsed-note.at+4)*1000;if(!playing||s.paused||document.hidden){animations[i].pause();animations[i].currentTime=wanted;}else{if(Math.abs(Number(animations[i].currentTime)-wanted)>100)animations[i].currentTime=wanted;animations[i].play();}}}
   }
 }
 listen(window,'blur',()=>{machine.fly(0,0);if(held!==null){held=null;machine.heatCancel();}});
 return {update,get photo(){return photo;},get viewer(){return viewer.state;},snapshot,dispose(){disposed=true;captureGeneration++;abort.abort();buildAbort.abort();animations.forEach(a=>a.cancel());viewer.dispose();root.remove();auto.remove();}};
}
