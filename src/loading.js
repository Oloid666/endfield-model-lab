export const loadingJokes=[
'莊芳宜同意下班。正在確認她說的是哪一天。','正在把「再五分鐘」換算成實際時間。','正在關閉工作群。工作群拒絕關閉。','正在替晚餐排程。目前排在明天。','正在請莊芳宜休息。她要求提供理由。','管理員的訊息尚未抵達。她已經看了三次。','正在練習自然地問：「管理員吃了嗎？」','正在確認龍泡泡不是機器人。牠對題目有意見。','正在整理龍泡泡的發言。刪除後只剩標點。','正在降低龍泡泡音量。牠找到設定了。','正在補貨。請勿把息壤放進關東煮。','正在加熱晚餐。這次按設備說明操作。','正在確認第二件六折是否適用於加班。','正在把十張重置券折成承重牆。','正在安裝玻璃。請珍惜製作人員的努力。','正在準備雨景。這部分沒有室內版本。'];
export function createLoading(){
 const root=document.querySelector('#loading'),label=document.querySelector('#loading-message'),joke=document.querySelector('#loading-joke'),retry=document.querySelector('#asset-retry');let index=Math.floor(Math.random()*loadingJokes.length),timer=null,action=null;
 const rotate=()=>{joke.textContent=loadingJokes[index++%loadingJokes.length];};
 retry.addEventListener('click',()=>action?.());
 return {show(text,{compact=false,onRetry=null}={}){root.hidden=false;root.classList.remove('done');root.classList.toggle('compact',compact);label.textContent=text;action=onRetry;retry.hidden=!onRetry;if(!timer){rotate();timer=setInterval(rotate,5000);}},stage(text){label.textContent=text;},fail(text,onRetry){clearInterval(timer);timer=null;label.textContent=text;joke.textContent='街景會等你，人物可以再請一次。';action=onRetry;retry.hidden=false;},hide(){root.classList.add('done');clearInterval(timer);timer=null;retry.hidden=true;},dispose(){clearInterval(timer);}};
}
