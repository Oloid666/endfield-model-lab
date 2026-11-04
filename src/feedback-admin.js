import {feedbackEndpoint} from './feedback-client.js';
import {feedbackCSV} from './feedback-export.js';
import './feedback-admin.css';
const $=id=>document.getElementById(id),names={general:'整體感想',praise:'喜歡的地方',bug:'卡住／操作問題',idea:'想新增的內容'};
let token='',items=[],next=null,serial=0;
function logout(){serial++;token='';items=[];next=null;$('token').value='';$('login').hidden=false;$('dashboard').hidden=true;$('items').replaceChildren();$('summary').textContent='';}
function showItems(){
 $('items').replaceChildren();for(const item of items){const card=document.createElement('article'),title=document.createElement('h2'),meta=document.createElement('small'),message=document.createElement('p');
  title.textContent=(item.rating?'★'.repeat(item.rating)+' · ':'')+(names[item.category]||item.category);
  meta.textContent=new Date(item.created_at).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'})+' · '+item.build_version+' · '+item.phase+' · '+item.play_mode;
  message.textContent=item.message||'（僅提供星等）';card.append(title,meta,message);$('items').append(card);
 }
 $('older').hidden=!next;$('export').disabled=!items.length;
}
async function load(cursor=null){
 const request=++serial;$('status').textContent='正在讀取…';const controls=['refresh','older','category','rating','message-only','export'];controls.forEach(id=>$(id).disabled=true);
 try{
  const url=new URL(feedbackEndpoint());if($('message-only').value)url.searchParams.set('message_only','1');if($('category').value)url.searchParams.set('category',$('category').value);if($('rating').value)url.searchParams.set('rating',$('rating').value);if(cursor)url.searchParams.set('cursor',cursor);
  const response=await fetch(url,{headers:{Authorization:'Bearer '+token},cache:'no-store',credentials:'omit'});if(request!==serial)return;
  if(!response.ok){if(response.status===401){logout();throw Error('管理密碼不正確，請重新輸入。');}throw Error(response.status===503?'資料庫或管理密碼尚未設定，請先完成 Cloudflare 綁定。':'暫時無法讀取，請稍後再試。');}
  const data=await response.json();if(request!==serial)return;items=data.items;next=data.next;$('login').hidden=true;$('dashboard').hidden=false;
  $('summary').textContent='全部回饋 '+data.summary.total+' 筆 · 文字意見 '+(data.summary.with_message??0)+' 筆 · 有星等 '+data.summary.rated+' 筆 · 平均 '+(data.summary.average_rating??'—')+' 星';
  showItems();$('status').textContent=items.length?'本頁 '+items.length+' 筆，依時間由新到舊。':'目前沒有符合條件的回饋。';
 }catch(error){if(request===serial||!token)$('status').textContent=error.message||'連線失敗，請重試。';}
 finally{if(request===serial){controls.forEach(id=>$(id).disabled=false);$('export').disabled=!items.length;}}
}
$('login').onsubmit=event=>{event.preventDefault();token=$('token').value;$('token').value='';void load();};
$('refresh').onclick=()=>void load();$('category').onchange=$('rating').onchange=$('message-only').onchange=()=>void load();$('older').onclick=()=>void load(next);
$('logout').onclick=()=>{logout();$('status').textContent='已登出。';};
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([feedbackCSV(items)],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='rainy711-feedback.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
addEventListener('pagehide',logout);
