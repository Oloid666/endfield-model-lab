// Every reveal uses the mission clock, including the deliberately late eye bar.
export const TABLET_PAGES={
 search:['找個降溫的方法',['梨花冰沙 −40°C','氣泡水 0°C'],[['scan','搜尋降溫方法']]],
 'scan-php':['分析 711 網路協議中…',['識別管理閘道與服務版本'],[]],
 php:['711 冷鏈管理閘道',['PHP 8.4.26｜未修補','PHP2Shell｜遠端程式碼執行（RCE）','CVSS 4.0：9.2 / 10 · Critical','CVE-2026-109618'],[['tool','使用 PHP2Shell 工具']]],
 fridge:['管理閘道權限已取得',['可探索：冰箱控制器'],[['detect','偵測冰箱控制器']]],
 'scan-controller':['偵測冷鏈控制器中…',['讀取遠端維修介面'],[]],
 controller:['發現冰箱控制器',['遠端維修介面可連線'],[['control','使用 FrostControl 維修工具']]],
 'walk-fridge':['前往冰箱',['正在確認設備位置'],[]],
 temperature:['冷鏈溫度設定',['實際溫度：+4°C','目標：冰沙 −40°C／氣泡水 0°C'],[['apply','套用溫度設定']]],
 cooling:['指令已送出',['正在讀取實際溫度…'],[]],
 success:['溫度下降中',['實際溫度：−8°C'],[]],
 defrost:['控制器回應異常',['實際溫度正在回升','模式：強制除霜'],[]],
 hot:['設備警示',['實際溫度：+50°C','模式：強制除霜'],[['meal','先去熱便當']]],
 'walk-counter':['回到加熱櫃檯',['先處理便當'],[]],
 'meal-label':['便當加熱說明',['正在查看包裝標籤'],[]],
 grid:['找個加速的方法',['探索微波爐的供電設備'],[['scan-grid','偵測電網漏洞']]],
 'scan-grid':['偵測電網漏洞中…',['檢查天師樁供電協議'],[]],
 backdoor:['3號天師樁：異常常駐程式',['NIKKE PC Launcher','供應鏈攻擊｜CDN 腳本遭竄改','遠端存取通道：在線'],[]],
 'rapi-request':['3號天師樁管理電腦',['NIKKE PC Launcher'],[]],
 'rapi-answer':['3號天師樁管理電腦',['NIKKE PC Launcher'],[]],
 'rapi-mask':['3號天師樁管理電腦',['遠端存取通道：在線'],[['enable','啟用後門']]],
 cable:['3號天師樁供電已接通',['能量正在沿線送往微波爐'],[]],
 power:['選擇供電功率',['設備額定與電網輸出'],[['800w','800 W｜設備額定'],['800mw','800 MW｜電網輸出']]],
 confirm:['確認套用：800 MW',['設備額定：800 W','輸出為設備額定的一百萬倍'],[['confirm','確認套用功率']]],
 ready:['800 MW 已套用',['設備供電已接通'],[['start','開始極速加熱']]],
 done:['極速加熱',['加熱控制交接中'],[]]
};
const NEXT={scan:'scan-php',tool:'fridge',detect:'scan-controller',control:'walk-fridge',apply:'cooling',meal:'walk-counter','scan-grid':'scan-grid',enable:'cable','800mw':'confirm',confirm:'ready',start:'done'};
const AUTO={'scan-php':['php',1.6],'scan-controller':['controller',1.3],'walk-fridge':['temperature',3.2],cooling:['success',2],success:['defrost',0],defrost:['hot',3.6],'walk-counter':['meal-label',3.2],'meal-label':['grid',0],'scan-grid':['backdoor',1.8],backdoor:['rapi-request',1.5],'rapi-request':['rapi-answer',0],cable:['power',6]};
const TALKS={
 success:[['xaihi','嗯，有降。','satisfied'],['dragon','成功了？']],
 hot:[['dragon','正五十？！你把蒸發器切到除霜模式了！'],['xaihi','……法國🇫🇷駭客工具，預設模式忘了改。','avert'],['dragon','熱愛105°C的你～🎶\n滴滴清純的蒸餾水～','song'],['xaihi','……飲料晚點再說。先熱便當。','side-eye']],
 'meal-label':[['xaihi','微波三分鐘……','read-label'],['xaihi','太久了。我找個快一點的。','tablet']],
 backdoor:[['xaihi','這台天師樁的管理電腦，怎麼還開著妮姬？'],['dragon','上班守樁，順便守妮姬？']],
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
  const busy=this.now<this.until||this.stage==='search'&&age<1.2||this.stage==='backdoor'&&age<1.5;
  return {stage:this.stage,title,lines:this.stage==='cooling'?['指令已送出',`實際溫度：${signedTemperature(temperature)}`]:base,buttons:this.talks.length?[]:buttons,dialogue:this.talks[0]||null,dialogueAge:Math.max(0,this.now-this.talkAt),hot:this.hot,powered:this.powered,censored:this.censored,censorAt:this.censorAt,temperature,note:this.note,age,busy,revision:this.revision,wireBeat:this.stage==='cable'?(age<1.5?'source':age<4?'route':'sink'):null};
 }
}
