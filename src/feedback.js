import './feedback.css';
import {FEEDBACK_CATEGORIES as categories} from './feedback-client.js';
export {createFeedbackService,feedbackEndpoint} from './feedback-client.js';
const element=(tag,cls='',text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
export function createFeedbackForm({service,initialRating=0,requireRating=false,onRating=()=>{},onFinish=()=>{},onSkip=()=>{},isCurrent=()=>true}={}){
 const root=element('section','feedback-form');let rating=initialRating,pending=false,disposed=false,controller=null;const draft=service.draft;
 const stars=element('div','rating-stars');stars.setAttribute('role','group');stars.setAttribute('aria-label','一至五星評分');const starButtons=[];
 for(let i=1;i<=5;i++){const b=element('button');b.type='button';b.setAttribute('aria-label',i+' 星');b.onclick=()=>{rating=i;onRating(i);update();};stars.append(b);starButtons.push(b);}root.append(stars);
 if(!requireRating)root.append(element('p','feedback-hint','星等可不選；留言與問題都歡迎。'));
 const typeLabel=element('label','feedback-label','意見類型'),select=element('select');for(const [value,title]of Object.entries(categories)){const o=element('option','',title);o.value=value;select.append(o);}select.value=draft.category;typeLabel.append(select);root.append(typeLabel);
 const label=element('label','feedback-label','想對我們說什麼？（選填）'),text=element('textarea');text.rows=4;text.maxLength=1000;text.value=draft.message;text.placeholder='哪一幕最好笑？哪裡卡住了？還想看到什麼？';label.append(text);root.append(label);
 const length=element('small','feedback-length'),hint=element('p','feedback-hint','文字意見只交給作品作者，不公開、不送進 GA4。請勿填寫密碼、電話或其他個人資料。草稿會暫存在這個分頁的瀏覽器工作階段。');root.append(length,hint);
 const status=element('p','feedback-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.append(status);
 const actions=element('div','feedback-actions'),submit=element('button','bonus-primary'),skip=element('button','bonus-text-button',requireRating?'略過，繼續謝幕':'取消');submit.type=skip.type='button';skip.onclick=()=>{controller?.abort();onSkip();};
 const fallback=element('button','bonus-text-button','只送星等，繼續（留言未送出）');fallback.type='button';fallback.hidden=true;fallback.onclick=()=>{if(rating)onFinish({rating,stored:false});};actions.append(submit,skip,fallback);root.append(actions);
 function current(){return !disposed&&root.isConnected&&isCurrent();}
 function update(){
  length.textContent=text.value.length+' / 1000';starButtons.forEach((b,i)=>{b.textContent=i<rating?'★':'☆';b.setAttribute('aria-pressed',String(i+1===rating));b.disabled=pending;});
  const hasText=!!text.value.trim();submit.textContent=pending?'送出中…':requireRating?(rating?(hasText?'送出評分與意見':'送出評分'):'先選一顆到五顆星'):'送出意見';
  submit.disabled=pending||(requireRating?!rating:!hasText);text.disabled=select.disabled=pending;
 }
 function save(){service.saveDraft({message:text.value,category:select.value});fallback.hidden=true;status.textContent='';update();}
 text.addEventListener('input',save);select.addEventListener('change',save);
 submit.onclick=async()=>{
  if(pending||submit.disabled)return;const value={rating:rating||null,message:text.value.trim(),category:select.value};
  // A star-only rating keeps its existing GA4 flow even when the database is unavailable.
  if(requireRating&&!value.message){void service.submit(value).catch(()=>{});onFinish({rating,stored:false});return;}
  pending=true;status.textContent='正在送出，請稍候。';controller=new AbortController();update();
  try{await service.submit(value,{signal:controller.signal});if(current()){status.textContent='已收到，謝謝你的意見！';onFinish({rating,stored:true});}}
  catch(error){if(current()){status.textContent=error.message||'尚未成功送出，文字已保留。';fallback.hidden=!requireRating||!rating;}}
  finally{pending=false;if(current())update();}
 };
 update();return {root,dispose(){disposed=true;controller?.abort();}};
}
export function createFeedbackDialog({service,onOpen=()=>{},onClose=()=>{}}){
 const dialog=element('dialog','feedback-dialog');dialog.setAttribute('aria-label','意見與問題回報');document.body.append(dialog);let form=null,opener=null;
 function close(){form?.dispose();form=null;dialog.close();onClose();if(opener?.getClientRects().length)opener.focus();else document.querySelector('#menu-toggle')?.focus();}
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 return {open(){if(dialog.open)return;opener=document.activeElement;onOpen();dialog.replaceChildren(element('h2','','留一句話給龍泡泡'));
   form=createFeedbackForm({service,onFinish:()=>{form?.dispose();form=null;dialog.replaceChildren(element('h2','','已收到你的意見！'));const b=element('button','','返回遊戲');b.type='button';b.onclick=close;dialog.append(b);b.focus();},onSkip:close,isCurrent:()=>dialog.open});dialog.append(form.root);dialog.showModal();},dispose(){form?.dispose();dialog.remove();}};
}
