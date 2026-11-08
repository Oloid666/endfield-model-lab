import {Vector3} from 'three';
const meanings={'👀':'注意到了','✋':'先別急','😌':'慢慢來','🍱':'晚餐','🫴':'交給我保管','👌':'沒問題','👍':'接好了'};
export function creatureCommunication(container){
 const mount=container.parentElement||container,node=document.createElement('div'),point=new Vector3();node.className='creature-communication';node.hidden=true;node.setAttribute('role','status');node.setAttribute('aria-live','polite');mount.append(node);let last='';
 return {update(camera,position,emoji){
  if(!emoji){node.hidden=true;last='';return;}
  point.fromArray(position);point.y+=.35;point.project(camera);if(point.z>=1||point.z<=-1){node.hidden=true;return;}
  if(emoji!==last){node.textContent=emoji;node.setAttribute('aria-label',meanings[emoji]||emoji);node.dataset.emotion=emoji;last=emoji;}
  const scene=container.getBoundingClientRect(),parent=mount.getBoundingClientRect(),w=scene.width,h=scene.height;
  let floor=h-70;const panel=mount.querySelector('.mission-combat:not([hidden])');if(panel){const r=panel.getBoundingClientRect();if(r.width>w*.5)floor=Math.min(floor,r.top-scene.top-12);}
  const x=Math.max(40,Math.min(w-40,(point.x+1)*w/2+54)),y=Math.max(Math.min(170,h*.25),Math.min(floor,(1-point.y)*h/2-10));
  node.style.left=`${scene.left-parent.left+x}px`;node.style.top=`${scene.top-parent.top+y}px`;node.hidden=false;
 },dispose(){node.remove();}};
}
