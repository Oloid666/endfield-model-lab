export const TABLET_PAGES={
 search:['冷飲品質設定',['梨花冰沙 −40°C','氣泡水 0°C'],[['scan','冷鏈管理｜搜尋可用漏洞'],['grid-locked','電網供電｜稍後處理便當']]],
 'scan-php':['分析 711 網路協議中…',['識別管理閘道及服務版本','正在比對漏洞資料'],[]],
 php:['711 冷鏈管理閘道',['PHP 8.4.26｜未修補','PHP2Shell｜RCE（遠端程式碼執行）','CVSS 4.0：9.2 Critical','CVE-2026-109618 / 109619'],[['tool','使用 PHP2Shell 測試工具']]],
 fridge:['管理閘道權限已取得',['可探索：冷凍／冷藏控制器'],[['detect','偵測冰箱控制器']]],
 'scan-controller':['偵測冷鏈控制器中…',['讀取製冷、除霜與維修介面'],[]],
 controller:['發現冰箱控制器',['遠端維修介面可連線','管理驗證異常｜製冷、除霜、加熱'],[['control','使用 FrostControl 維修工具']]],
 temperature:['設定冷鏈溫度',['梨花冰沙：−40°C','氣泡水：0°C'],[['apply','套用溫度設定']]],
 hot:['工具預設：強制除霜',['蒸發器加熱測試執行中','實際溫度：+50°C'],[]],
 drink:['梨花冰沙 → 梨花水',['塞西：這杯先放涼。','龍泡泡：熱愛105°C的你，','滴滴清純的蒸餾水 🎶'],[['meal','飲料放旁邊，處理便當']]],
 grid:['微波爐：預計三分鐘',['塞西：太久。','龍泡泡：這次照說明書，好嗎？'],[['scan-grid','偵測電網漏洞']]],
 'scan-grid':['偵測電網漏洞中…',['檢查天師樁管理端與供電協議'],[]],
 backdoor:['3號天師樁：異常常駐程式',['NIKKE PC Launcher','供應鏈攻擊｜CDN腳本遭竄改','遠端存取通道仍在線','龍泡泡：上班守樁，順便守妮姬？'],[['enable','啟用後門']]],
 cable:['3號天師樁供電已接通',['塞西：不會駭。照工具說明借個通道。','能量正在沿線送往微波爐'],[]],
 power:['選擇供電功率',['請確認設備規格與輸出單位'],[['800w','800 W｜額定功率｜三分鐘'],['800mw','800 MW｜電網額定輸出']]],
 confirm:['確認套用：800 MW',['設備額定：800 W','輸出為設備額定的一百萬倍'],[['confirm','確認套用功率']]],
 ready:['800 MW 已套用',['塞西：借億點點。便當比較重要。'],[['start','開始極速加熱']]],
 done:['極速加熱',['加熱控制交接中'],[]]
};
const NEXT={scan:'scan-php',tool:'fridge',detect:'scan-controller',control:'temperature',apply:'hot',meal:'grid','scan-grid':'scan-grid',enable:'cable','800mw':'confirm',confirm:'ready',start:'done'};
export class VcrTablet{
 constructor(){this.reset();}
 reset(){this.stage='search';this.at=0;this.now=0;this.note='';this.until=0;this.rejects=0;this.hot=false;this.powered=false;this.revision=0;}
 input(action,time=this.now){if(!this.state.buttons.some(b=>b[0]===action)||time<this.until)return false;
  if(action==='grid-locked'){this.note='塞西：先處理冰沙和氣泡水。便當等一下。';this.until=time+1;this.revision++;return true;}
  if(action==='800w'){this.rejects++;this.note=this.rejects===1?'塞西：這個太慢了。\n龍泡泡：這叫正常功率。':'塞西：三分鐘，我剛剛看過了。';this.until=time+1.8;this.revision++;return true;}
  this.stage=NEXT[action];this.at=time;this.note='';this.until=time+.3;if(this.stage==='hot')this.hot=true;if(this.stage==='cable')this.powered=true;this.revision++;return true;
 }
 tick(time){this.now=time;const scan={'scan-php':['php',1.6],'scan-controller':['controller',1.3],'scan-grid':['backdoor',1.8]}[this.stage];if(scan&&time-this.at>=scan[1]){this.stage=scan[0];this.at=time;this.revision++;}if(this.stage==='hot'&&time-this.at>=12){this.stage='drink';this.at=time;this.revision++;}if(this.stage==='cable'&&time-this.at>=6){this.stage='power';this.at=time;this.revision++;}}
 get state(){const [title,baseLines,buttons]=TABLET_PAGES[this.stage];const lines=this.stage==='hot'?(this.now-this.at<6?['龍泡泡：正五十？！','你把設備的蒸發器切換成除霜模式了！']:['塞西：……借用法國駭客的小工具，','預設模式忘了改。']):baseLines;return {stage:this.stage,title,lines,buttons,hot:this.hot,powered:this.powered,age:Math.max(0,this.now-this.at),note:this.note,busy:this.now<this.until,revision:this.revision};}
}
