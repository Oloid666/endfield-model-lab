const DRAFT='rainy711.feedback-draft.v1',PENDING='rainy711.feedback-request.v1';
export const FEEDBACK_CATEGORIES={general:'整體感想',praise:'喜歡的地方',bug:'卡住／操作問題',idea:'想新增的內容'};
export function feedbackEndpoint(location=globalThis.location){return location.hostname==='oloid666.github.io'?'https://endfield10000t.aura87.online/api/feedback':new URL('/api/feedback',location.origin).href;}
function requestId(){
 if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
 const b=crypto.getRandomValues(new Uint8Array(16));b[6]=b[6]&15|64;b[8]=b[8]&63|128;const h=Array.from(b,n=>n.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
}
export function createFeedbackService({endpoint=feedbackEndpoint(),version='local',context=()=>({}),onSent=()=>{},storage,fetcher=globalThis.fetch,timeout=10000}={}){
 if(storage===undefined)try{storage=sessionStorage;}catch{}
 const read=key=>{try{return JSON.parse(storage?.getItem(key)||'null');}catch{return null;}};
 const write=(key,data)=>{try{storage?.setItem(key,JSON.stringify(data));}catch{}};
 let draft=read(DRAFT)||{message:'',category:'general'},pending=read(PENDING);
 if(typeof draft.message!=='string'||!FEEDBACK_CATEGORIES[draft.category])draft={message:'',category:'general'};
 return {
  get draft(){return {...draft};},
  saveDraft(value){draft={message:value.message.slice(0,1000),category:FEEDBACK_CATEGORIES[value.category]?value.category:'general'};write(DRAFT,draft);},
  async submit({rating=null,message='',category='general'},{signal}={}){
   const info=context(),payload={rating,message:message.trim(),category,build_version:version,phase:info.phase||'unknown',play_mode:info.play_mode||'unknown'},key=JSON.stringify(payload);
   if(!pending||pending.key!==key){pending={key,id:requestId()};write(PENDING,pending);}
   const controller=new AbortController(),abort=()=>controller.abort(),timer=setTimeout(abort,timeout);signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
   try{
    const response=await fetcher(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:pending.id,...payload}),signal:controller.signal,credentials:'omit'});
    let data;try{data=await response.json();}catch{throw Error('目前無法連到收件服務，文字已保留。');}
    if(!response.ok||data?.ok!==true){const messages={429:'送出次數較多，請稍候再試。文字已保留。',503:'收件服務尚未就緒或暫時忙碌，文字已保留。',400:'請檢查內容長度與星等後再試。'};throw Error(messages[response.status]||'尚未成功送出，文字已保留，請再試一次。');}
    if(draft.message.trim()===payload.message){draft={message:'',category:'general'};write(DRAFT,draft);}
    try{onSent();}catch{}return data;
   }catch(error){if(controller.signal.aborted)throw Error('連線中斷或等待逾時，文字已保留，請再試一次。');throw error;}
   finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
  }
 };
}
