export const VIEW_CYCLES={
 street:[['front','正面'],['storeLeft','左側'],['pear','梨花'],['streetRight','右俯瞰'],['investigate','機房'],['traffic','紅綠燈'],['waterTank','水塔'],['reflection','積水反光']],
 interior:[['interior','櫃檯'],['fridge','冰箱'],['oven','微波爐'],['insideOut','店內望街'],['shelves','店內貨架'],['poster2','集點海報'],['cctv','攝影機']],
 detail:[['heroFront','莊右側正面'],['poster3','梨諾海報'],['poster1','小蔥海報'],['story','雙人'],['dragon','龍泡泡'],['back','莊背影'],['left','左近景']]
};
export function createViewControls(getWorld,getMission,signal){
 const dock=document.querySelector('.view-dock'),home=dock.parentElement,settings=document.querySelector('#settings'),indices={},buttons=[...dock.querySelectorAll('[data-view]')];
 function pick(group,index){const w=getWorld(),s=getMission()?.state;if(!w||w.streetShow?.active||s?.presentationLocked||['photo-return','photo-sending','finisher','purchase','walk-out','photo'].includes(s?.phase))return;
  if(group==='reset'){w.resetStoryCamera();return;}
  const items=VIEW_CYCLES[group];indices[group]=index;const [name,label]=items[index];w.setWalking(false);w.setView(name,true);w.manualUntil=Infinity;w.autoCamera=false;
  for(const b of buttons){b.classList.toggle('active',b.dataset.view===group);b.setAttribute('aria-pressed',String(b.dataset.view===group));}
  const b=buttons.find(b=>b.dataset.view===group);b.querySelector('span').textContent=label;b.dataset.count=`${index+1}/${items.length}`;b.setAttribute('aria-label',`${label} ${index+1}/${items.length}`);
 }
 for(const b of buttons){const group=b.dataset.view;b.addEventListener('click',()=>pick(group,((indices[group]??-1)+1)%(VIEW_CYCLES[group]?.length||1)),{signal});}
 return {pick,update(){const inside=!['ready','complete'].includes(getMission()?.state.phase);const parent=inside?settings:home;if(dock.parentElement!==parent)parent.append(dock);dock.classList.toggle('in-menu',inside);}};
}
