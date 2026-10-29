// Original theatrical insurance negotiation. Every wording reaches the same happy ending.
export const APPLICATION_FIELDS=[
 {id:'cause',label:'事故原因',options:[
  {id:'A',text:'雷擊造成建物損壞。雷電由要保人提供，未另計費。'},
  {id:'B',text:'雷電精準命中，建物未及閃避。建議加強建物危機意識。'}]},
 {id:'handling',label:'處理方式',options:[
  {id:'A',text:'設備汰舊換新。汰舊已完成，換新等待貴公司出資。'},
  {id:'B',text:'永久停用異常光源。為確保成效，連同裝燈的樓一起停用。'}]},
 {id:'loss',label:'損失情形',options:[
  {id:'A',text:'梨花完整，重要資產無損。便利店部分，建議不要影響整體評價。'},
  {id:'B',text:'招牌已安全抵達地面，樓板亦完成降落。現場物件均無高處墜落之虞。'}]},
 {id:'evidence',label:'佐證附件',options:[
  {id:'A',text:'梨花正面、側面照片各一張。充分證明本次事故沒有傷到梨花。'},
  {id:'B',text:'事故前店面照片一張。事故後因店面較不完整，改附同角度的空氣。'}]},
 {id:'amount',label:'理賠金額',options:[
  {id:'A',text:'便利店重建費全額，另加兩份便當。便當屬必要安撫支出。'},
  {id:'B',text:'以足夠蓋回一間 711 為準。若仍有不足，請再賠一間。'}]},
];
export const OBJECTIONS=[
 [{speaker:'保險代表',text:'你們自己打雷把店拆了，還把這叫設備改善？！',event:'objection'},
  {speaker:'龍泡泡',text:'改善後確實沒有再被投訴太亮。'}],
 [{speaker:'保險代表',text:'報告避重就輕，請款倒是一點都沒少！',event:'objection'},
  {speaker:'保險代表',text:'請要保人本人來說明，不要只派代辦！'}],
];
const REVEAL=[
 {speaker:'龍泡泡',text:'你看看要保人。'},
 {speaker:'保單',text:'莊方宜',event:'policyholder'},
 {speaker:'保險代表',text:'……本公司一向重視每位保戶。'},
];
const BUSINESS=[
 {speaker:'龍泡泡',text:'我今天不是來談這個的。'},
 {speaker:'龍泡泡',text:'我是來談後面的生意。每個月幾噸息壤，新的產險，長期合作。'},
 {speaker:'保險代表',text:'原來是長期合作！本案立即辦理，新產險我們一起談。'},
];
export const SETTLEMENT_STAMPS=['理賠通過','新案承保','長期合作'];
export class ClaimsNegotiation{
 constructor(){this.reset();}
 reset(){this.phase='choice';this.field=0;this.line=0;this.round=-1;this.choices={};this.stampIndex=0;this.revision=0;}
 select(id){if(this.phase!=='choice'||!APPLICATION_FIELDS[this.field].options.some(o=>o.id===id))return false;this.choices[APPLICATION_FIELDS[this.field].id]=id;this.phase='read';this.revision++;return true;}
 next(){
  if(this.phase==='read'){
   if(this.field===1||this.field===4){this.round=this.field===1?0:1;this.line=0;this.phase='objection';}
   else{this.field++;this.phase='choice';}
  }else if(this.phase==='objection'){
   if(++this.line>=OBJECTIONS[this.round].length){this.line=0;if(this.round===0){this.field++;this.phase='choice';}else this.phase='reveal';}
  }else if(this.phase==='reveal'){
   if(++this.line>=REVEAL.length){this.phase='business';this.line=0;}
  }else if(this.phase==='business'){
   if(++this.line>=BUSINESS.length){this.phase='stamp';this.line=0;}
  }else return false;
  this.revision++;return true;
 }
 finishStamp(){if(this.phase!=='stamp')return false;this.stampIndex++;if(this.stampIndex===SETTLEMENT_STAMPS.length)this.phase='complete';this.revision++;return true;}
 get cue(){
  if(this.phase==='read')return {speaker:'龍泡泡',text:APPLICATION_FIELDS[this.field].options.find(o=>o.id===this.choices[APPLICATION_FIELDS[this.field].id]).text};
  if(this.phase==='objection')return OBJECTIONS[this.round][this.line];
  if(this.phase==='reveal')return REVEAL[this.line];
  if(this.phase==='business')return BUSINESS[this.line];
  return null;
 }
 get policyholderVisible(){return this.phase==='reveal'&&this.line>=1||['business','stamp','complete'].includes(this.phase);}
 get polite(){return this.phase==='reveal'&&this.line>=2||['business','stamp','complete'].includes(this.phase);}
 get summary(){return APPLICATION_FIELDS.filter(f=>this.choices[f.id]).map(f=>`${f.label}：${f.options.find(o=>o.id===this.choices[f.id]).text}`);}
 get state(){return {phase:this.phase,field:this.field,line:this.line,round:this.round,choices:{...this.choices},cue:this.cue?{...this.cue}:null,stampIndex:this.stampIndex,policyholderVisible:this.policyholderVisible,polite:this.polite};}
}
