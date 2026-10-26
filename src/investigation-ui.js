import {portrait} from './portrait.js';
import './investigation.css';
const E=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n;};
const phases=new Set(['shoe-view','pylon-link','photo-flight','photo','photo-review','comm-request','hack','heat']);
export function createInvestigationUI({mount,machine,capture,onAuto,getAuto}){
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
 const auto=E('button','cinematic-toggle','◉ 自動運鏡');auto.type='button';mount.append(auto);listen(auto,'click',()=>onAuto?.());
 let phase='',photo=null,scale=1,dx=0,dy=0,held=null,animationKey='',animations=[],startPointer=null;
 const points=new Map();let gestureStart=null;
 const transform=()=>{photoInner.style.transform=`translate(${dx}px,${dy}px) scale(${scale})`;};
 const button=(label,fn,cls='')=>{const b=E('button',cls,label);b.type='button';listen(b,'click',fn);actions.append(b);return b;};
 function snapshot(){try{photo=capture();scale=1;dx=dy=0;transform();machine.takePhoto();}catch(e){message.textContent=e.message;}}
 function inspect(id){if(scale<1.2){message.textContent='先放大照片，再點你想調查的異常。';return;}machine.investigate(id);}
 function build(s){
   buildAbort.abort();buildAbort=new AbortController();building=true;
   phase=s.phase;root.dataset.phase=phase;actions.replaceChildren();puzzle.replaceChildren();photoInner.querySelectorAll('button').forEach(n=>n.remove());animations.forEach(a=>a.cancel());animations=[];animationKey='';
   photoStage.hidden=phase!=='photo-review';callPortrait.hidden=phase!=='comm-request';puzzle.hidden=phase!=='hack';rhythm.hidden=rhythmStatus.hidden=phase!=='heat';
   if(phase==='shoe-view'){title.textContent='導播 · 合乎舟禮';message.textContent='龍泡泡：這角度夠清楚了吧？';button('吃飽了',()=>machine.next(),'shoe-continue');}
   if(phase==='pylon-link'){title.textContent='天師樁 · 接入中';message.textContent='鏡頭回到遠景，繼續接通供電。';}
   if(phase==='photo-flight'){title.textContent='龍泡泡 · 攝影就位';for(const [text,d]of [['後退',-1],['前進',1]]){const b=button(text,()=>{},'flight-step');b.dataset.direction=d;let down=false,pressedAt=0;listen(b,'pointerdown',e=>{down=true;pressedAt=performance.now();b.setPointerCapture(e.pointerId);machine.fly(0,d);});for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(b,type,()=>{if(down){down=false;if(performance.now()-pressedAt<180)machine.stepFlight(d);machine.fly(0,0);}});listen(b,'keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();machine.fly(0,d);}});listen(b,'keyup',()=>machine.fly(0,0));}button('開始拍照',()=>machine.finishFlight(),'flight-ready');}
   if(phase==='photo'){title.textContent='拍張照片 · 報平安';message.textContent='龍泡泡已就位 · 把 711 招牌也留在畫面裡';button('●',snapshot,'photo-shutter');}
   if(phase==='photo-review'){
     title.textContent='照片預覽 · 傳給管理員';message.textContent='確認沒眨眼，發送給管理員，讓他知道有好好吃飯。';image.src=photo?.src||'';
     button('確認沒眨眼',()=>{image.src=photo.closeup||photo.src;scale=1;transform();},'photo-face');button('遠景',()=>{image.src=photo.src;scale=1;transform();});button('－',()=>{scale=Math.max(1,scale-.3);transform();});button('＋',()=>{scale=Math.min(2,scale+.25);transform();});button('重拍',()=>machine.phaseTo('photo'));button('發送',()=>{if(root.dataset.sending)return;root.dataset.sending='true';if(matchMedia('(prefers-reduced-motion: reduce)').matches){delete root.dataset.sending;machine.sendPhoto();return;}const a=actions.animate([{transform:'translateY(0)'},{transform:'translateY(-5px)'},{transform:'translateY(0)'}],{duration:450});animations.push(a);a.onfinish=()=>{delete root.dataset.sending;machine.sendPhoto();};},'photo-send');
   }
   if(phase==='comm-request'){title.textContent='巡衛通訊 · 請求接入';message.textContent='巡衛隊長・弭弗 請求接入';button('◉ 接通',()=>machine.acceptCall(),'call-accept');}
   if(phase==='hack'){
     title.textContent='賽希 · 電網維護終端 / login.php';message.textContent='點一下轉動線路。四塊彎線接通綠色入口與出口，再測試連線。';
     for(let i=0;i<4;i++){const b=E('button','hack-tile');b.type='button';b.dataset.tile=i;b.setAttribute('aria-label',`旋轉第 ${i+1} 塊線路`);const wire=E('span','hack-wire','┏');b.append(wire);listen(b,'click',()=>machine.hackRotate(i));puzzle.append(b);}
     button('測試連線',()=>machine.hackSubmit());button('接線提示',()=>{message.textContent='路線：左上→左下→右下→右上。轉動四塊彎線，兩兩相接。';});
   }
   if(phase==='heat'){
     title.textContent='極速加熱 · 慢放操作';
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
 listen(photoStage,'pointerdown',e=>{if(e.target.closest('button'))return;photoStage.setPointerCapture(e.pointerId);points.set(e.pointerId,{x:e.clientX,y:e.clientY});startPointer={x:e.clientX,y:e.clientY,dx,dy};if(points.size===2){const [a,b]=[...points.values()];gestureStart={distance:Math.hypot(a.x-b.x,a.y-b.y),scale};}});
 listen(photoStage,'pointermove',e=>{if(!points.has(e.pointerId))return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});if(points.size===2&&gestureStart){const [a,b]=[...points.values()];scale=Math.max(1,Math.min(2,gestureStart.scale*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,gestureStart.distance)));}else if(points.size===1&&startPointer){dx=Math.max(-160,Math.min(160,startPointer.dx+e.clientX-startPointer.x));dy=Math.max(-180,Math.min(180,startPointer.dy+e.clientY-startPointer.y));}transform();});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(photoStage,type,e=>{points.delete(e.pointerId);gestureStart=null;startPointer=null;});
 function update(s){
   sourceAnchor=machine.sourceTime;perfAnchor=performance.now();
   auto.textContent=getAuto?.()?'◉ 自動':'◎ 自動';auto.setAttribute('aria-pressed',String(!!getAuto?.()));auto.hidden=['photo-flight','photo','photo-review','hack','heat'].includes(s.phase);
   root.hidden=!phases.has(s.phase);if(root.hidden){if(phase!==s.phase){animations.forEach(a=>a.cancel());animations=[];phase=s.phase;}return;}if(phase!==s.phase)build(s);
   root.dataset.paused=String(s.paused);for(const b of root.querySelectorAll('button'))b.disabled=s.paused;
   if(s.phase==='photo-flight'){const f=s.flight;message.textContent=f.ready?'已就位。按開始拍照。':`按前進遠離店面，後退靠近店面 · 距離 ${Math.abs(f.z-10.5).toFixed(1)}m`;actions.querySelector('.flight-ready').disabled=!f.ready||s.paused;}if(s.phase==='photo-review'&&photo){const fit=Math.min(photoStage.clientWidth/photo.width,photoStage.clientHeight/photo.height);photoInner.style.width=`${photo.width*fit}px`;photoInner.style.height=`${photo.height*fit}px`;}
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
 listen(window,'blur',()=>{if(held!==null){held=null;machine.heatCancel();}});
 return {update,get photo(){return photo;},snapshot,dispose(){abort.abort();buildAbort.abort();animations.forEach(a=>a.cancel());root.remove();auto.remove();}};
}
