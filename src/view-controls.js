export const VIEW_CYCLES={
 street:[['front','正面'],['storeLeft','左側'],['pear','梨花'],['streetRight','右側'],['investigate','機房'],['traffic','紅綠燈'],['waterTank','水塔'],['reflection','積水反光']],
 interior:[['interior','櫃檯'],['poster1','小蔥海報'],['fridge','冰箱'],['oven','微波爐'],['poster3','梨諾海報'],['insideOut','店內望街'],['shelves','店內貨架'],['poster2','集點海報'],['cctv','攝影機']],
 detail:[['heroFront','莊右側正面'],['story','雙人'],['dragon','龍泡泡'],['back','莊背影'],['left','左近景'],['right','右近景']]
};
export function createViewControls(getWorld,getMission,signal){
 const dock=document.querySelector('.view-dock'),indices={},buttons=[...dock.querySelectorAll('[data-view]')];
 const menu=document.createElement('div');menu.className='view-picker';menu.hidden=true;menu.setAttribute('aria-label','直接選擇鏡位');dock.after(menu);
 function pick(group,index){const w=getWorld(),s=getMission()?.state;if(!w||s?.presentationLocked||['photo-return','photo-sending','finisher','purchase','walk-out','photo'].includes(s?.phase))return;menu.hidden=true;
  if(group==='reset'){w.resetStoryCamera();return;}
  const items=VIEW_CYCLES[group];indices[group]=index;const [name,label]=items[index];w.setWalking(false);w.setView(name,true);w.manualUntil=Infinity;w.autoCamera=false;
  for(const b of buttons){b.classList.toggle('active',b.dataset.view===group);b.setAttribute('aria-pressed',String(b.dataset.view===group));}
  const b=buttons.find(b=>b.dataset.view===group);b.querySelector('span').textContent=label;b.dataset.count=`${index+1}/${items.length}`;b.setAttribute('aria-label',`${label} ${index+1}/${items.length}`);
 }
 for(const b of buttons){const group=b.dataset.view;b.addEventListener('click',()=>pick(group,((indices[group]??-1)+1)%(VIEW_CYCLES[group]?.length||1)),{signal});if(!VIEW_CYCLES[group])continue;
  const arrow=document.createElement('button');arrow.className='view-expand';arrow.textContent='⌄';arrow.setAttribute('aria-label',`展開${b.textContent.trim()}鏡位`);arrow.setAttribute('aria-expanded','false');b.after(arrow);
  arrow.addEventListener('click',()=>{const opening=menu.hidden||menu.dataset.group!==group;menu.replaceChildren();menu.dataset.group=group;menu.hidden=!opening;arrow.setAttribute('aria-expanded',String(opening));if(opening)VIEW_CYCLES[group].forEach(([id,label],i)=>{const n=document.createElement('button');n.textContent=`${i+1} · ${label}`;n.type='button';n.addEventListener('click',()=>pick(group,i),{signal});menu.append(n);});},{signal});
 }
 document.addEventListener('pointerdown',e=>{if(!dock.contains(e.target)&&!menu.contains(e.target))menu.hidden=true;},{signal});document.addEventListener('keydown',e=>{if(e.key==='Escape')menu.hidden=true;},{signal});
 return {pick};
}
