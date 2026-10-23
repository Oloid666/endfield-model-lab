import * as T from 'three';

export function createExploration(world,{mount,onHotspot,signal}){
  const controls=document.createElement('div');controls.className='exploration-controls';
  const toggle=document.createElement('button');toggle.className='walk-toggle';toggle.type='button';toggle.textContent='◇ 散步';toggle.setAttribute('aria-pressed','false');
  const rain=document.createElement('button');rain.className='rain-response';rain.textContent='聽雨';rain.type='button';rain.addEventListener('click',()=>onHotspot('rain'),{signal});
  const pad=document.createElement('div');pad.className='walk-pad';pad.hidden=true;pad.setAttribute('role','group');pad.setAttribute('aria-label','拖曳搖桿行走，電腦可用方向鍵或 WASD');
  const knob=document.createElement('span');knob.className='walk-knob';pad.append(knob);
  const hint=document.createElement('span');hint.className='walk-hint';hint.textContent='拖曳走路 · 雙指縮放';pad.append(hint);
  controls.append(toggle,rain,pad);mount.append(controls);
  let active=false,padPointer=null,joyX=0,joyY=0,lastX=world.actors?.position.x||-1.25,lastZ=world.actors?.position.z||2.48;
  const keys=new Set(),direction=new T.Vector3(),right=new T.Vector3(),forward=new T.Vector3(),up=new T.Vector3(0,1,0);
  const reset=()=>{joyX=joyY=0;keys.clear();padPointer=null;knob.style.transform='translate(-50%,-50%)';world.actors?.setMove(0,0,false);};
  const setActive=value=>{active=value;toggle.setAttribute('aria-pressed',String(value));toggle.textContent=value?'◆ 停止散步':'◇ 散步';pad.hidden=!value;mount.classList.toggle('walking-mode',value);reset();if(value&&world.actors){lastX=world.actors.position.x;lastZ=world.actors.position.z;if(world.currentView==='detail')world.setView('awning');}};
  toggle.addEventListener('click',()=>setActive(!active),{signal});
  function padMove(event){if(event.pointerId!==padPointer)return;const b=pad.getBoundingClientRect();joyX=(event.clientX-b.left-b.width/2)/35;joyY=(event.clientY-b.top-b.height/2)/35;const len=Math.hypot(joyX,joyY);if(len>1){joyX/=len;joyY/=len;}knob.style.transform=`translate(calc(-50% + ${joyX*29}px),calc(-50% + ${joyY*29}px))`;}
  pad.addEventListener('pointerdown',e=>{if(padPointer!==null)return;padPointer=e.pointerId;pad.setPointerCapture(e.pointerId);padMove(e);},{signal});
  pad.addEventListener('pointermove',padMove,{signal});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(type,e=>{if(e.pointerId===padPointer)reset();},{signal});
  const validKey=e=>!e.target.closest('input,select,textarea,[contenteditable=true]')&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key);
  document.addEventListener('keydown',e=>{if(!active||!validKey(e))return;e.preventDefault();keys.add(e.key);},{signal});
  document.addEventListener('keyup',e=>keys.delete(e.key),{signal});window.addEventListener('blur',reset,{signal});document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();},{signal});
  const canvas=world.renderer.domElement,pointers=new Map(),ray=new T.Raycaster(),point=new T.Vector2();ray.layers.enable(1);let multi=false;
  canvas.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,time:performance.now(),moved:false});if(pointers.size>1)multi=true;},{signal});
  canvas.addEventListener('pointermove',e=>{const p=pointers.get(e.pointerId);if(p&&Math.hypot(e.clientX-p.x,e.clientY-p.y)>8)p.moved=true;},{signal});
  canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);if(!pointers.size)multi=false;},{signal});
  canvas.addEventListener('pointerup',e=>{
    const p=pointers.get(e.pointerId),valid=p&&!multi&&!p.moved&&performance.now()-p.time<350;pointers.delete(e.pointerId);if(!pointers.size)multi=false;if(!valid)return;
    const b=canvas.getBoundingClientRect();point.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);ray.setFromCamera(point,world.camera);
    for(const hit of ray.intersectObjects([world.actors?.root,world.store.root,world.weather.root].filter(Boolean),true)){
      let ancestor=hit.object,visible=true;while(ancestor){if(!ancestor.visible){visible=false;break;}ancestor=ancestor.parent;}if(!visible||hit.object.material?.visible===false)continue;
      let node=hit.object,kind;while(node&&!kind){kind=node.userData.hotspot;node=node.parent;}
      if(kind==='door'){world.store.triggerDoor();return;}if(kind){onHotspot(kind);return;}
      // Opaque walls and furniture must block hotspots behind them.
      if(!hit.object.material?.transparent&&hit.object.layers.mask===1)return;
    }
  },{signal});
  return {setActive,get active(){return active;},update(){
    if(!world.actors)return;
    if(!active){world.actors.setMove(0,0,false);return;}
    const x=joyX+(keys.has('d')||keys.has('ArrowRight')?1:0)-(keys.has('a')||keys.has('ArrowLeft')?1:0),y=joyY+(keys.has('s')||keys.has('ArrowDown')?1:0)-(keys.has('w')||keys.has('ArrowUp')?1:0);
    forward.copy(world.controls.target).sub(world.camera.position);forward.y=0;forward.normalize();right.crossVectors(forward,up);
    direction.copy(right).multiplyScalar(x).addScaledVector(forward,-y);if(direction.lengthSq()>.01)direction.normalize();else direction.set(0,0,0);world.actors.setMove(direction.x,direction.z,true);
    const dx=world.actors.position.x-lastX,dz=world.actors.position.z-lastZ;world.camera.position.x+=dx;world.camera.position.z+=dz;world.controls.target.x+=dx;world.controls.target.z+=dz;lastX=world.actors.position.x;lastZ=world.actors.position.z;
  },dispose(){reset();controls.remove();}};
}
