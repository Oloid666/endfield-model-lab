// Pointer cancellation is never a short tap. Call cancel() before disabling UI.
export function bindHoldButton(button,{start,stop,tap,enabled=()=>true},signal){
 let pointer=null,key=null,at=0,lastKey=-Infinity;
 const listen=(type,fn)=>button.addEventListener(type,fn,{signal});
 function finish(normal=false){
  if(pointer===null&&key===null)return;
  const id=pointer,short=performance.now()-at<180;pointer=key=null;stop();
  if(id!==null&&button.hasPointerCapture?.(id))button.releasePointerCapture(id);
  if(normal&&short&&enabled())tap();
 }
 listen('pointerdown',e=>{if(button.disabled||!enabled()||e.isPrimary===false||e.button>0||pointer!==null||key!==null)return;e.preventDefault();pointer=e.pointerId;at=performance.now();button.setPointerCapture(e.pointerId);start();});
 listen('pointerup',e=>{if(pointer!==e.pointerId)return;e.preventDefault();finish(true);});
 for(const type of ['pointercancel','lostpointercapture'])listen(type,e=>{if(pointer===e.pointerId)finish();});
 listen('keydown',e=>{if(!['Enter',' '].includes(e.key))return;e.preventDefault();if(e.repeat||button.disabled||!enabled()||key!==null||pointer!==null)return;key=e.key;at=performance.now();start();});
 listen('keyup',e=>{if(e.key!==key)return;e.preventDefault();lastKey=performance.now();finish(true);});
 listen('blur',()=>finish());
 listen('click',e=>{if(e.detail===0&&performance.now()-lastKey>250&&enabled()&&!button.disabled)tap();});
 return ()=>finish();
}
