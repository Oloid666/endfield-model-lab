// Small, local gameplay studies. They do not change the story or save data.
export const prototypes = [
  {id:'cannon',title:'出力與校準',tag:'砲擊試作',story:'先決定出力，再把砲口拉回準星。力道愈大，校準愈難。',mechanic:'兩段時機 · 高出力風險'},
  {id:'compress',title:'一萬噸，只折三塊',tag:'息壤回收',story:'把萬噸息壤壓進回收機。先別問倉庫為什麼少了。',mechanic:'投料 · 壓縮 · 卸壓'},
  {id:'washer',title:'洗錢，請選強力洗程',tag:'洗衣店試作',story:'莊說把錢洗乾淨。這台機器真的只會洗。',mechanic:'轉速 · 配重 · 排泡沫'},
  {id:'microwave',title:'加熱一分鐘，全城供電',tag:'微波試作',story:'全城的電接上了，便當裡面還有冷飯。',mechanic:'分區加熱 · 過熱管理'},
  {id:'scan',title:'買一送一，送整間店',tag:'掃描試作',story:'先掃商品。準星偏一點，連店面也一起補貨。',mechanic:'掃描時機 · 目標縮小'},
  {id:'pack',title:'退貨，請附原包裝',tag:'包裝試作',story:'把整間店裝回紙箱。梨花不在退貨範圍。',mechanic:'旋轉對齊 · 三道封條'},
];

const clamp=(v,min=0,max=100)=>Math.min(max,Math.max(min,v));
const triangle=v=>{const p=((v%2)+2)%2;return p<=1?p:2-p;};
const metric=(label,value,percent)=>({label,value,percent});

export class PlaygroundMachine {
  constructor(){this.id=null;this.data=null;this.clock=0;}
  select(id){
    if(!prototypes.some(p=>p.id===id))return false;
    this.id=id;this.clock=0;
    const base={id,status:'running',time:0,progress:0,message:'',result:'',score:0};
    const game={
      cannon:{step:'power',power:.25,meter:0,sweetWidth:.2,shots:0,hits:0,entered:0,message:'第一步：鎖定出力。高出力的校準區更窄。'},
      compress:{pressure:10,load:0,compacted:0,vents:0,message:'投料後按壓縮。壓力過高，先卸壓。'},
      washer:{rpm:0,balance:.06,foam:10,clean:0,drains:0,message:'開低速或高速。配重靠近中央，泡沫高了就排水。'},
      microwave:{zone:0,zones:[20,20,20],power:false,heat:0,vents:0,message:'選區域，開電源。三格都要 80°C，任何一格別超過 112°C。'},
      scan:{cursor:0,target:.24,width:.14,attempts:0,scanned:0,message:'等掃描線進入金色商品，再按掃描。共七次機會。'},
      pack:{angle:-30,targetAngle:0,stage:0,seals:0,integrity:100,message:'旋轉紙箱，對準虛線再封箱。共三道封條。'},
    }[id];
    this.data={...base,...game};return true;
  }
  reset(){return this.id?this.select(this.id):false;}
  finish(won,result){const d=this.data;d.status=won?'won':'lost';d.result=result;d.message=result;if(won)d.progress=100;d.score=won?Math.max(1,Math.round(1000-d.time*7-(d.shots||0)*12-(d.vents||0)*20-(d.drains||0)*12-(d.attempts||0)*15)):0;}
  act(action,value){
    const d=this.data;if(!d||d.status!=='running')return false;
    if(this.id==='cannon'){
      if(action!=='lock')return false;
      if(d.step==='power'){
        d.step='aim';d.sweetWidth=.34-d.power*.22;d.entered=d.time;d.meter=0;
        d.message=`出力 ${Math.round(d.power*100)}%。第二步：等指針進入中央校準區。`;
      }else{
        d.shots++;const distance=Math.abs(d.meter-.5);
        if(distance<=d.sweetWidth/2){d.hits++;const damage=Math.round(24+d.power*28);d.progress=clamp(d.progress+damage);d.message=distance<.025?`完美校準！造成 ${damage} 點破壞。`:`命中！造成 ${damage} 點破壞。`;}
        else d.message='失準！高出力的後座把砲口推開了。';
        if(d.progress>=100)this.finish(true,'店體拆除。梨花沒事，判定無損失。');
        else if(d.shots>=6)this.finish(false,'六次機會用完。先校準，再談威力。');
        else {d.step='power';d.entered=d.time;d.power=.25;d.meter=0;}
      }
    }else if(this.id==='compress'){
      if(action==='feed'){if(d.load>=100){d.message='料槽已滿，先壓縮。';return false;}d.load=clamp(d.load+25);d.pressure+=14;d.message='投入一批息壤。料多了，壓力也上來了。';}
      else if(action==='press'){if(d.load<10){d.message='沒有足夠的料。先投料。';return false;}const amount=Math.min(25,d.load);d.load-=amount;d.compacted=clamp(d.compacted+amount);d.pressure+=18;d.progress=d.compacted;d.message=`已壓縮 ${Math.round(d.compacted)}%。機器開始懷疑自己的用途。`;}
      else if(action==='vent'){d.pressure=clamp(d.pressure-36);d.vents++;d.message='安全卸壓。梨花沒有被吹到。';}
      else return false;
      if(d.pressure>=100)this.finish(false,'壓力爆表。回收機先被回收了。');
      else if(d.compacted>=100)this.finish(true,'萬噸息壤壓成一塊。折價券：三元。還有集點。');
    }else if(this.id==='washer'){
      if(action==='rpm'&&[0,1,2].includes(Number(value))){d.rpm=Number(value);d.message=d.rpm===2?'強力洗程。注意配重與泡沫。':d.rpm===1?'低速運轉。慢一點，比較穩。':'停止轉動。';}
      else if(action==='left'){d.balance=clamp(d.balance-.23,-1.1,1.1);d.message='往左移配重。';}
      else if(action==='right'){d.balance=clamp(d.balance+.23,-1.1,1.1);d.message='往右移配重。';}
      else if(action==='drain'){d.foam=clamp(d.foam-42);d.rpm=0;d.drains++;d.message='排水完成。請重新選轉速。';}
      else return false;
      if(Math.abs(d.balance)>=1)this.finish(false,'配重失衡。便利店開始跟著洗衣機轉。');
    }else if(this.id==='microwave'){
      if(action==='zone'&&[0,1,2].includes(Number(value))){d.zone=Number(value);d.message=`切換到第 ${d.zone+1} 格。`;} 
      else if(action==='power'){d.power=!d.power;d.message=d.power?'全城供電接通。記得換區域。':'暫停加熱。';}
      else if(action==='vent'){d.heat=clamp(d.heat-42);d.power=false;d.vents++;d.message='排熱完成。請重新開電源。';}
      else return false;
    }else if(this.id==='scan'){
      if(action!=='scan')return false;
      d.attempts++;
      if(Math.abs(d.cursor-d.target)<=d.width/2){d.scanned++;d.progress=d.scanned/3*100;d.message='商品掃描成功。下一件更小，速度也更快。';d.target=[.24,.71,.43][d.scanned]??.43;d.width=[.14,.12,.1][d.scanned]??.1;}
      else d.message=Math.abs(d.cursor-d.target)>.3?'掃到了整間店！補貨範圍有點太大。':'差一點，掃到包裝外側了。';
      if(d.scanned>=3)this.finish(true,'三件商品掃描完成。這次沒有多送一間店。');
      else if(d.attempts>=7)this.finish(false,'掃描機超額補貨。街角多了三間便利店。');
    }else if(this.id==='pack'){
      if(action==='left')d.angle=clamp(d.angle-15,-90,90);
      else if(action==='right')d.angle=clamp(d.angle+15,-90,90);
      else if(action==='lock'){
        if(Math.abs(d.angle-d.targetAngle)<=7.5){d.seals++;d.stage++;d.progress=d.seals/3*100;d.message='這道封條對準了。換下一面。';d.targetAngle=[0,60,-45][d.stage]??-45;if(d.seals>=3)this.finish(true,'整間店裝箱完成。梨花留在原地。龍泡泡列為隨貨贈品。');}
        else {d.integrity-=35;d.message='封條歪了。紙箱快碰到梨花，先重新對齊。';if(d.integrity<=0)this.finish(false,'紙箱破了。原包裝不接受這種原包裝。');}
      }else return false;
    }
    return true;
  }
  update(time,delta){
    const d=this.data;if(!d||d.status!=='running')return;
    const dt=clamp(Number.isFinite(delta)?delta:0,0,.1);this.clock+=dt;d.time=this.clock;
    if(this.id==='cannon'){
      const elapsed=d.time-d.entered;
      if(d.step==='power'){d.power=.25+triangle(elapsed*.7)*.75;d.meter=(d.power-.25)/.75;}
      else d.meter=triangle(elapsed*(.75+d.power*.85));
    }else if(this.id==='compress')d.pressure=clamp(d.pressure-dt*4.5);
    else if(this.id==='washer'){
      if(d.rpm){d.balance+=(Math.sin(d.time*1.3)*.18+.07)*d.rpm*dt;d.foam+=d.rpm===2?11*dt:3.2*dt;d.clean=clamp(d.clean+(d.rpm===2?11:4)*Math.max(0,1-Math.abs(d.balance))*dt);d.progress=d.clean;}
      if(Math.abs(d.balance)>=1)this.finish(false,'配重失衡。整間店跟著洗衣機轉了。');
      else if(d.foam>=100)this.finish(false,'泡沫淹過收銀台。錢洗乾淨了，店也是。');
      else if(d.clean>=100)this.finish(true,'強力洗程完成。錢洗白了，晚餐要怎麼付？');
    }else if(this.id==='microwave'){
      if(d.power){for(let i=0;i<3;i++)d.zones[i]=Math.max(20,d.zones[i]+(i===d.zone?17:-.2)*dt);d.heat+=5*dt;}
      else d.heat=clamp(d.heat-dt*1.4);
      d.progress=d.zones.reduce((n,v)=>n+clamp((v-20)/60*100),0)/3;
      if(d.zones.some(v=>v>112)||d.heat>=100)this.finish(false,'便當過熱。全城供電不代表全功率加熱。');
      else if(d.zones.every(v=>v>=80))this.finish(true,'三格都熱好了。螢幕顯示：請再靜置一分鐘。');
    }else if(this.id==='scan')d.cursor=triangle(d.time*(.7+d.scanned*.18));
    else if(this.id==='pack'&&d.time>=45)this.finish(false,'物流車走了。今晚先把紙箱拆開吃飯。');
  }
  get state(){
    const d=this.data;if(!d)return {id:null,status:'ready',time:0,progress:0,message:'選一種玩法開始。',result:'',score:0,metrics:[]};
    let metrics=[];
    if(this.id==='cannon')metrics=[metric('出力',`${Math.round(d.power*100)}%`,d.power*100),metric('射擊',`${d.shots} / 6`),metric('破壞',`${Math.round(d.progress)}%`,d.progress)];
    else if(this.id==='compress')metrics=[metric('壓力',`${Math.round(d.pressure)}%`,d.pressure),metric('料槽',`${Math.round(d.load)}%`,d.load),metric('回收',`${Math.round(d.compacted)}%`,d.compacted)];
    else if(this.id==='washer')metrics=[metric('轉速',['停止','低速','高速'][d.rpm]),metric('泡沫',`${Math.round(d.foam)}%`,d.foam),metric('洗淨',`${Math.round(d.clean)}%`,d.clean)];
    else if(this.id==='microwave')metrics=[...d.zones.map((v,i)=>metric(`第 ${i+1} 格`,`${Math.round(v)}°C`,clamp(v/112*100))),metric('機體熱度',`${Math.round(d.heat)}%`,d.heat)];
    else if(this.id==='scan')metrics=[metric('商品',`${d.scanned} / 3`,d.scanned/3*100),metric('機會',`${7-d.attempts} / 7`)];
    else if(this.id==='pack')metrics=[metric('封條',`${d.seals} / 3`,d.seals/3*100),metric('完整度',`${Math.max(0,d.integrity)}%`,Math.max(0,d.integrity)),metric('剩餘',`${Math.max(0,Math.ceil(45-d.time))} 秒`)];
    return {...d,zones:d.zones?[...d.zones]:undefined,metrics};
  }
}
