import {CHAPTERS} from './mission-state.js';
export const DEBUG_DESTINATIONS=[
 ...CHAPTERS.map(c=>({id:'chapter:'+c.id,label:c.label,group:'主線章節'})),
 {id:'fridge',label:'冰箱降溫與反轉',group:'重點演出'},
 {id:'nikke',label:'妮姬啟動器木馬',group:'重點演出'},
 {id:'birth',label:'紫色生物誕生',group:'重點演出'},
 {id:'figurine',label:'洛西手辦與少女自介',group:'重點演出'},
 {id:'first-restore',label:'卡洞後首次復原',group:'重點演出'},
 {id:'claims',label:'二樓理賠',group:'二樓與結尾'},
 {id:'classroom',label:'八題笑點小學堂',group:'二樓與結尾'},
 {id:'rating',label:'結尾評分',group:'二樓與結尾'},
 {id:'street',label:'回通關街角・拆屋／復原',group:'二樓與結尾'}
];
// Session memory only. A jump is not a normal restart and cannot consume the unlock.
export function createDebugTravel({mount,mission,onJump,isPerforming=()=>false,signal}){
 let unlocked=false,jumping=false,generation=0,disposed=false;
 const root=document.createElement('section');root.className='debug-travel';root.hidden=true;
 const toggle=document.createElement('button');toggle.type='button';toggle.className='debug-travel-toggle';toggle.textContent='快速測試';
 const dialog=document.createElement('dialog');dialog.className='debug-travel-dialog';dialog.setAttribute('aria-label','快速測試・本次遊玩有效');
 const title=document.createElement('h2');title.textContent='快速測試';const note=document.createElement('p');note.textContent='本次遊玩有效。重新開始或重新整理後隱藏。';
 const status=document.createElement('p');status.setAttribute('role','status');
 const close=document.createElement('button');close.type='button';close.textContent='返回';close.addEventListener('click',()=>dialog.close(),{signal});dialog.append(title,note);
 for(const group of [...new Set(DEBUG_DESTINATIONS.map(d=>d.group))]){
  const section=document.createElement('section'),heading=document.createElement('h3');heading.textContent=group;section.append(heading);
  for(const item of DEBUG_DESTINATIONS.filter(d=>d.group===group)){const b=document.createElement('button');b.type='button';b.textContent=item.label;b.dataset.debugDestination=item.id;section.append(b);}
  dialog.append(section);
 }
 dialog.append(status,close);root.append(toggle,dialog);mount.append(root);
 dialog.addEventListener('close',()=>{if(!dialog.open){mission.setPaused(false,'debug-menu');if(!jumping&&!root.hidden)toggle.focus({preventScroll:true});}},{signal});
 toggle.addEventListener('click',()=>{if(!unlocked||jumping)return;mission.setPaused(true,'debug-menu');status.textContent='';dialog.showModal();close.focus();},{signal});
 async function go(id){
  if(!unlocked||jumping||!DEBUG_DESTINATIONS.some(d=>d.id===id))return false;
  jumping=true;const token=++generation;toggle.disabled=true;dialog.close();mission.setPaused(false,'debug-menu');
  try{await onJump(id,()=>!disposed&&token===generation);return !disposed&&token===generation;}
  catch(error){if(!disposed&&token===generation){status.textContent='畫面暫時無法準備，請再試一次。';mission.setPaused(true,'debug-menu');dialog.showModal();}console.warn('測試場景未能載入',error.message);return false;}
  finally{if(token===generation){jumping=false;toggle.disabled=false;root.hidden=!unlocked||isPerforming();}}
 }
 dialog.addEventListener('click',e=>{const b=e.target.closest('[data-debug-destination]');if(b)go(b.dataset.debugDestination);},{signal});
 return {get state(){return {unlocked,jumping};},get jumping(){return jumping;},go,unlock(){unlocked=true;},reset(){generation++;unlocked=jumping=false;dialog.close();mission.setPaused(false,'debug-load');mission.setPaused(false,'debug-menu');root.hidden=true;toggle.disabled=false;},update(){root.hidden=!unlocked||jumping||isPerforming();},dispose(){disposed=true;generation++;dialog.close();root.remove();}};
}
