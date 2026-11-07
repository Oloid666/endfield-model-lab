// Every reveal uses the mission clock, including the deliberately late eye bar.
// Slow down near both sockets so the final arrival is visible before power selection.
export function wireProgress(age){const t=Math.max(0,Math.min(6,age));return t<.4?0:t<1.6?(t-.4)/1.2*.09:t<4.9?.09+(t-1.6)/3.3*.826:.916+(t-4.9)/1.1*.084;}
export const TABLET_PAGES={
 search:['冰箱溫度設定',['梨花冰沙 −40°C／氣泡水 0°C','調整溫度需要登入管理後台','請輸入管理員密碼'],[['scan','找找進入後台的方法']]],
 'scan-php':['分析 711 網路協議中…',['識別管理閘道與服務版本'],[]],
 php:['找到未修補的管理入口',['PHP 8.4.26｜未修補','PHP2Shell｜遠端程式碼執行（RCE）','CVSS 4.0：9.2 / 10 · Critical','CVE-2026-109618'],[['tool','用工具打開後台']]],
 fridge:['管理後台已開啟',['PHP2Shell 執行完成','可查看：冰箱控制器'],[['detect','查看冰箱設定']]],
 'scan-controller':['偵測冷鏈控制器中…',['讀取遠端維修介面'],[]],
 controller:['發現冰箱控制器',['遠端維修介面可連線','FrostControl 維修工具就緒'],[['control','連上冰箱']]],
 'walk-fridge':['前往冰箱',['正在確認設備位置'],[]],
 temperature:['冷鏈溫度設定',['實際溫度：+4°C','目標：冰沙 −40°C／氣泡水 0°C'],[['apply','把溫度調低']]],
 cooling:['指令已送出',['正在讀取實際溫度…'],[]],
 success:['溫度下降中',['實際溫度：−8°C'],[]],
 defrost:['控制器回應異常',['實際溫度正在回升','模式：強制除霜'],[]],
 hot:['設備警示',['實際溫度：+50°C','模式：強制除霜'],[['meal','先去熱便當']]],
 'walk-counter':['回到加熱櫃檯',['先處理便當'],[]],
 'meal-label':['便當加熱說明',['正在查看包裝標籤'],[]],
 grid:['找個加速的方法',['探索微波爐的供電設備'],[['scan-grid','找個加熱快一點的方法']]],
 'scan-grid':['尋找可用的電網入口',['檢查天師樁遠端維修連線'],[]],
 'grid-found':['3號天師樁：找到異常通道',['維修網段出現異常遠端連線','目標：天師樁主控電腦'],[['inspect-console','查看管理電腦']]],
 backdoor:['3號天師樁：偵測到竊密木馬',['NIKKE PC Launcher｜帳號密碼可能外洩','供應鏈攻擊｜CDN 腳本遭竄改','憑證竊取 Credential theft','C2 遠端控制通道：在線｜可操作天師樁供電'],[]],
 'rapi-request':['3號天師樁管理電腦',['NIKKE PC Launcher'],[]],
 'rapi-answer':['3號天師樁管理電腦',['NIKKE PC Launcher'],[]],
 'rapi-mask':['3號天師樁管理電腦',['遠端存取通道：在線'],[['enable','接通天師樁電源']]],
 cable:['3號天師樁供電已接通',['電腦負責控制，電網負責供電','能量沿線送往微波爐'],[]],
 power:['選擇供電功率',['設備額定與電網輸出'],[['800w','正常加熱（800 W）'],['800mw','借用電網（800 MW）']]],
 confirm:['確認套用：800 MW',['設備額定：800 W','輸出為設備額定的一百萬倍'],[['confirm','確認借電']]],
 ready:['800 MW 已套用',['設備供電已接通'],[['start','開始熱便當']]],
 done:['極速加熱',['加熱控制交接中'],[]]
};
const NEXT={scan:'scan-php',tool:'fridge',detect:'scan-controller',control:'walk-fridge',apply:'cooling',meal:'walk-counter','scan-grid':'scan-grid','inspect-console':'backdoor',enable:'cable','800mw':'confirm',confirm:'ready',start:'done'};
const AUTO={'scan-php':['php',1.6],'scan-controller':['controller',1.3],'walk-fridge':['temperature',3.2],cooling:['success',2],success:['defrost',0],defrost:['hot',3.6],'walk-counter':['meal-label',3.2],'meal-label':['grid',0],'scan-grid':['grid-found',4.8],backdoor:['rapi-request',1.5],'rapi-request':['rapi-answer',0],cable:['power',6]};
const TALKS={
 search:[['xaihi','冰箱能不能再調冷一點……'],['xaihi','要從後台設定，還要密碼。'],['dragon','妳知道密碼？'],['xaihi','不知道。我找找別的方法。']],
 php:[['xaihi','管理後台有個漏洞，不用密碼也能進去。'],['xaihi','PHP 出了個大漏洞，賽馬娘停服維修……我才有時間出門。','maintenance']],
 success:[['xaihi','嗯，有降。','satisfied'],['dragon','成功了？']],
 hot:[['dragon','正五十？！妳把蒸發器切到除霜模式了！'],['xaihi','……借了法國駭客的工具，忘了改預設模式。','avert'],['dragon','熱愛105°C的你～🎶\n滴滴清純的蒸餾水～','song'],['xaihi','……飲料晚點再說。先熱便當。','side-eye']],
 'meal-label':[['xaihi','微波三分鐘……','read-label'],['xaihi','太久了。我找個快一點的。','tablet']],
 'grid-found':[['xaihi','咦，這邊有機會。']],
 backdoor:[['xaihi','怎麼還裝了妮姬？'],['xaihi','這台妮姬啟動器裡有木馬，會偷玩家的帳號密碼。'],['dragon','玩遊戲還附贈盜帳號？'],['xaihi','惡意程式混進正常更新，叫供應鏈攻擊。這台也留下遠端通道。'],['dragon','別人偷帳號，妳偷電？'],['xaihi','留下來的通道還能用。這樣我們可以周轉一下。']],
 'rapi-request':[['rapi','可以幫我打馬賽克嗎？']],
 'rapi-answer':[['dragon','可以！']],
 power:[['dragon','妳連這套都會？'],['xaihi','不會駭。照工具說明借個通道而已。']]
};
export const signedTemperature=n=>`${n<0?'−':n>0?'+':''}${Math.abs(n)}°C`;
export class VcrTablet{
 constructor(){this.reset();}
 reset(){this.stage='search';this.at=this.now=this.until=this.talkAt=0;this.rejects=0;this.hot=false;this.powered=false;this.censored=false;this.censorAt=null;this.revision=0;this.talks=[];this.note='';}
 enter(stage,time){this.stage=stage;this.at=this.now=this.talkAt=time;this.until=time+.3;this.note='';this.talks=(TALKS[stage]||[]).map(([speaker,text,cue])=>({speaker,text,cue}));if(stage==='defrost')this.hot=true;if(stage==='cable')this.powered=true;if(stage==='rapi-answer'){this.censorAt=time+.7;this.until=time+1.7;}this.revision++;}
 input(action,time=this.now){
  if(this.state.busy||time<this.until)return false;
  if(action==='talk-next'&&this.talks.length){this.talks.shift();this.talkAt=time;this.until=time+.25;this.revision++;return true;}
  if(this.talks.length||!TABLET_PAGES[this.stage][2].some(b=>b[0]===action))return false;
  if(action==='800w'){this.rejects++;if(this.rejects===1)this.talks=[{speaker:'xaihi',text:'這個太慢了。'},{speaker:'dragon',text:'這叫正常功率。'}];else this.note='額定功率已看過了。塞西還在找更快的方法。';this.until=time+.3;this.revision++;return true;}
  this.enter(NEXT[action],time);return true;
 }
 tick(time){
  this.now=time;
  if(this.censorAt!==null&&!this.censored&&time>=this.censorAt){this.censored=true;this.revision++;}
  if(this.stage==='rapi-answer'){if(time-this.at>=1.7)this.enter('rapi-mask',time);return;}
  const next=AUTO[this.stage];if(!this.talks.length&&next&&time>=this.until&&time-this.at>=next[1])this.enter(next[0],time);
 }
 get state(){
  const [title,base,buttons]=TABLET_PAGES[this.stage],age=Math.max(0,this.now-this.at);
  const temperature=this.stage==='cooling'?Math.round(4-12*Math.min(1,age/2)):this.stage==='success'?-8:this.stage==='defrost'?Math.round(-8+58*Math.max(0,Math.min(1,(age-.6)/3))):this.hot?50:4;
  const busy=this.now<this.until||this.stage==='search'&&age<1.9||this.stage==='backdoor'&&age<1.5;
  return {stage:this.stage,title,lines:this.stage==='scan-grid'?[...(age>=1.4?['1號天師樁：遠端維修已封鎖']:['1號天師樁：檢查中…']),...(age>=2.8?['2號天師樁：未發現可用入口']:age>=1.4?['2號天師樁：檢查中…']:[]),...(age>=4.1?['3號天師樁：偵測到異常遠端連線']:age>=2.8?['3號天師樁：檢查中…']:[])]:this.stage==='cooling'?['指令已送出',`實際溫度：${signedTemperature(temperature)}`]:base,buttons:this.talks.length?[]:buttons,dialogue:this.talks[0]||null,dialogueAge:Math.max(0,this.now-this.talkAt),hot:this.hot,powered:this.powered,censored:this.censored,censorAt:this.censorAt,temperature,notification:['php','fridge','scan-controller','controller'].includes(this.stage)?'賽馬娘｜維護中':null,note:this.note,age,busy,revision:this.revision+(this.stage==='scan-grid'?Math.floor(age/1.4):0),wireBeat:this.stage==='cable'?(age<.4?'control':age<1.6?'source':age<4.9?'route':'sink'):null};
 }
}
