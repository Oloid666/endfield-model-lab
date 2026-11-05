// Local story controls, driven exclusively by the mission clock.
export const TABLET_PAGES={
 search:['冷飲品質設定',['梨花冰沙 −40°C','氣泡水 0°C'],[['scan','搜尋可用漏洞']]],
 'scan-php':['分析 711 網路協議中…',['識別管理閘道與服務版本'],[]],
 php:['711 冷鏈管理閘道',['PHP 8.4.26｜未修補','PHP2Shell｜遠端程式碼執行（RCE）','CVSS 4.0：9.2 / 10 · Critical','CVE-2026-109618'],[['tool','使用 PHP2Shell 工具']]],
 fridge:['管理閘道權限已取得',['可探索：冰箱控制器'],[['detect','偵測冰箱控制器']]],
 'scan-controller':['偵測冷鏈控制器中…',['讀取遠端維修介面'],[]],
 controller:['發現冰箱控制器',['遠端維修介面可連線'],[['control','使用 FrostControl 維修工具']]],
 'walk-fridge':['前往冰箱',['正在確認設備位置'],[]],
 temperature:['冷鏈溫度設定',['目前：+4°C｜製冷中','目標：冰沙 −40°C／氣泡水 0°C'],[['apply','套用溫度設定']]],
 defrost:['套用設定中…',['控制器回應：除霜加熱'],[]],
 hot:['設備警示',['實際溫度：+50°C','模式：強制除霜'],[['open','打開冰箱，確認飲料']]],
 pickup:['梨花冰沙 → 梨花水',['正在取出飲料'],[]],
 drink:['飲料檢查完成',['冰箱仍處於除霜加熱模式'],[['meal','飲料放旁邊，處理便當']]],
 'walk-counter':['回到加熱櫃檯',['飲料已放到旁邊'],[]],
 grid:['微波爐：預計三分鐘',['設備額定：800 W'],[['scan-grid','偵測電網漏洞']]],
 'scan-grid':['偵測電網漏洞中…',['檢查天師樁供電協議'],[]],
 backdoor:['3號天師樁：異常常駐程式',['NIKKE PC Launcher','供應鏈攻擊｜CDN 腳本遭竄改','遠端存取通道：在線'],[['enable','啟用後門']]],
 cable:['3號天師樁供電已接通',['能量正在沿線送往微波爐'],[]],
 power:['選擇供電功率',['請確認設備規格與輸出單位'],[['800w','800 W｜設備額定｜三分鐘'],['800mw','800 MW｜電網輸出']]],
 confirm:['確認套用：800 MW',['設備額定：800 W','輸出為設備額定的一百萬倍'],[['confirm','確認套用功率']]],
 ready:['800 MW 已套用',['設備供電已接通'],[['start','開始極速加熱']]],
 done:['極速加熱',['加熱控制交接中'],[]]
};
const NEXT={scan:'scan-php',tool:'fridge',detect:'scan-controller',control:'walk-fridge',apply:'defrost',open:'pickup',meal:'walk-counter','scan-grid':'scan-grid',enable:'cable','800mw':'confirm',confirm:'ready',start:'done'};
const AUTO={'scan-php':['php',1.6],'scan-controller':['controller',1.3],'walk-fridge':['temperature',3.2],defrost:['hot',4],pickup:['drink',3.2],'walk-counter':['grid',3.2],'scan-grid':['backdoor',1.8],cable:['power',6]};
const TALKS={hot:[['dragon','正五十？！你把設備的蒸發器切換成除霜模式了！'],['xaihi','……借用法國駭客的小工具，預設模式忘了改。']],drink:[['xaihi','這杯先放涼。'],['dragon','熱愛105°C的你 🎶 滴滴清純的蒸餾水～']],grid:[['xaihi','三分鐘？太久了。']],backdoor:[['dragon','上班守樁，順便守妮姬？']],power:[['xaihi','不會駭。照工具說明借個通道而已。']]};
export class VcrTablet{
 constructor(){this.reset();}
 reset(){this.stage='search';this.at=0;this.now=0;this.until=0;this.rejects=0;this.hot=false;this.powered=false;this.revision=0;this.talks=[];}
 enter(stage,time){this.stage=stage;this.at=time;this.until=time+.3;this.talks=(TALKS[stage]||[]).map(([speaker,text])=>({speaker,text}));if(stage==='defrost')this.hot=true;if(stage==='cable')this.powered=true;this.revision++;}
 input(action,time=this.now){if(time<this.until||this.stage==='search'&&time-this.at<1.2||this.stage==='backdoor'&&time-this.at<1.5)return false;if(action==='talk-next'&&this.talks.length){this.talks.shift();this.until=time+.25;this.revision++;return true;}
  if(this.talks.length||!TABLET_PAGES[this.stage][2].some(b=>b[0]===action))return false;
  if(action==='800w'){this.rejects++;this.talks=[{speaker:'xaihi',text:this.rejects===1?'這個太慢了。':'三分鐘，我剛剛看過了。'}];if(this.rejects===1)this.talks.push({speaker:'dragon',text:'這叫正常功率。'});this.until=time+.3;this.revision++;return true;}
  this.enter(NEXT[action],time);return true;
 }
 tick(time){this.now=time;const next=AUTO[this.stage];if(!this.talks.length&&next&&time-this.at>=next[1])this.enter(next[0],time);}
 get state(){const [title,lines,buttons]=TABLET_PAGES[this.stage],age=Math.max(0,this.now-this.at);return {stage:this.stage,title,lines,buttons:this.talks.length?[]:buttons,dialogue:this.talks[0]||null,hot:this.hot,powered:this.powered,age,busy:this.now<this.until||(this.stage==='search'&&age<1.2)||(this.stage==='backdoor'&&age<1.5),revision:this.revision,wireBeat:this.stage==='cable'?(age<1.5?'source':age<4?'route':'sink'):null};}
}
