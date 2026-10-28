// Independent input surface: gestures never reach the 3D camera.
export function photoBounds(stageWidth,stageHeight,imageWidth,imageHeight,scale){
 const fit=Math.min(stageWidth/imageWidth,stageHeight/imageHeight);
 return {width:imageWidth*fit,height:imageHeight*fit,x:Math.max(0,(imageWidth*fit*scale-stageWidth)/2),y:Math.max(0,(imageHeight*fit*scale-stageHeight)/2)};
}
export function createPhotoViewer({mount,signal,onSend,onRetake,onClose}){
 const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n;};
 const root=el('section','phone-gallery');root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','照片相簿');
 const header=el('header','gallery-header'),title=el('strong','','全景 · 1 / 2'),close=el('button','','返回一起看手機');close.type='button';header.append(title,close);
 const stage=el('div','gallery-stage'),image=el('img','gallery-image');image.alt='本次拍攝的照片';image.draggable=false;stage.append(image);
 const hint=el('p','gallery-hint','左右滑換照片，雙指放大。'),tools=el('div','gallery-tools'),footer=el('footer','gallery-footer');
 const button=(owner,text,fn)=>{const b=el('button','',text);b.type='button';b.addEventListener('click',fn,{signal});owner.append(b);return b;};
 button(tools,'縮小',()=>zoom(scale-.5));button(tools,'放大',()=>zoom(scale+.5));button(tools,'適合畫面',()=>zoom(1));
 const retake=button(footer,'重新拍',()=>{hide();onRetake();}),send=button(footer,'傳送給管理員',()=>{if(!send.disabled&&onSend()!==false)hide();});
 root.append(header,stage,hint,tools,footer);mount.append(root);
 let photo=null,index=0,scale=1,x=0,y=0,opener=null,gesture=null,paused=false;const pointers=new Map();
 const bounds=()=>photoBounds(stage.clientWidth||1,stage.clientHeight||1,image.naturalWidth||1,image.naturalHeight||1,scale);
 function paint(snap=false){const b=bounds();image.style.width=b.width+'px';image.style.height=b.height+'px';image.style.transition=snap&&!matchMedia('(prefers-reduced-motion: reduce)').matches?'transform 200ms ease-out':'none';image.style.transform=`translate(${x}px,${y}px) scale(${scale})`;}
 function settle(){const b=bounds();x=Math.max(-b.x,Math.min(b.x,x));y=Math.max(-b.y,Math.min(b.y,y));paint(true);}
 function maxZoom(){const b=bounds();return Math.max(1,Math.min(3,(image.naturalWidth||1)/Math.max(1,b.width)/(window.devicePixelRatio||1)));}
 function zoom(value){if(paused)return;scale=Math.max(1,Math.min(maxZoom(),value));settle();}
 function load(){image.onload=null;title.textContent=index?'人物近照 · 2 / 2':'全景 · 1 / 2';image.src=index?photo.closeup:photo.src;image.onload=()=>{scale=Math.min(scale,maxZoom());settle();};paint();}
 function change(step){if(paused)return;const next=Math.max(0,Math.min(1,index+step));if(index!==next){index=next;scale=1;x=y=0;load();}else{x=step>0?-35:35;paint();requestAnimationFrame(settle);}}
 function clear(){pointers.clear();gesture=null;settle();}
 function hide(){root.hidden=true;mount.classList.remove('gallery-open');clear();opener?.focus({preventScroll:true});onClose?.();}
 close.addEventListener('click',hide,{signal});
 stage.addEventListener('pointerdown',e=>{if(paused||e.button>0)return;e.preventDefault();stage.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const p=[...pointers.values()];gesture={x,y,scale,startX:p[0].x,startY:p[0].y,lastX:p[0].x,lastY:p[0].y,pinch:p.length>1?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0,multi:p.length>1};},{signal});
 stage.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!gesture)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const p=[...pointers.values()];gesture.lastX=e.clientX;gesture.lastY=e.clientY;
  if(p.length===2){scale=Math.max(1,Math.min(maxZoom(),gesture.scale*Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)/Math.max(1,gesture.pinch)));}
  else{const b=bounds(),rawX=gesture.x+e.clientX-gesture.startX,rawY=gesture.y+e.clientY-gesture.startY;const rubber=(v,max)=>Math.abs(v)<=max?v:Math.sign(v)*(max+(Math.abs(v)-max)*.2);x=rubber(rawX,b.x);y=scale===1?0:rubber(rawY,b.y);}
  paint();hint.hidden=true;
 },{signal});
 function release(e){if(!pointers.has(e.pointerId))return;const g=gesture;pointers.delete(e.pointerId);if(e.type==='pointerup'&&g&&!g.multi&&scale===1&&Math.abs(g.lastX-g.startX)>55)change(g.lastX<g.startX?1:-1);else settle();if(pointers.size){const p=[...pointers.values()][0];gesture={x,y,scale,startX:p.x,startY:p.y,lastX:p.x,lastY:p.y,pinch:0,multi:true};}else gesture=null;}
 for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,release,{signal});
 stage.addEventListener('dblclick',()=>zoom(scale===1?2:1),{signal});stage.addEventListener('wheel',e=>{e.preventDefault();zoom(scale-e.deltaY*.003);},{signal,passive:false});
 root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();hide();}if(e.key==='ArrowLeft'){e.preventDefault();change(-1);}if(e.key==='ArrowRight'){e.preventDefault();change(1);}if(e.key==='Tab'){const nodes=[...root.querySelectorAll('button:not(:disabled)')],i=nodes.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();nodes.at(-1).focus();}else if(!e.shiftKey&&i===nodes.length-1){e.preventDefault();nodes[0].focus();}}},{signal});
 const observer=new ResizeObserver(()=>{if(!root.hidden)settle();});observer.observe(stage);
 document.addEventListener('visibilitychange',()=>{clear();},{signal});
 return {open(value,button,portrait=false){if(photo!==value){photo=value;index=0;scale=1;x=y=0;}if(portrait){index=1;scale=1;x=y=0;}opener=button;root.hidden=false;mount.classList.add('gallery-open');load();close.focus({preventScroll:true});},hide,get active(){return !root.hidden;},get state(){return {index,scale,x,y,maxZoom:maxZoom(),...bounds()};},setPaused(value){paused=value;send.disabled=retake.disabled=paused;if(paused)clear();},dispose(){observer.disconnect();root.remove();}};
}
