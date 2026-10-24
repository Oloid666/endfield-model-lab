import './playground.css';
import {PlaygroundMachine,prototypes} from './playground-state.js';

const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,Number(v)||0));
const pct=v=>`${Math.round(Number(v)||0)}%`;
const store=`<g class="lab-store"><path d="M244 81h140v119H244z" fill="#567270"/><path d="M237 72h154v23H237z" fill="#e9ddba"/><path d="M237 76h154v5H237z" fill="#c97852"/><path d="M237 84h154v5H237z" fill="#609779"/><path d="M251 113h119v72H251z" fill="#122d37"/><path d="M290 111v76m40-76v76M251 148h119" stroke="#9bb9ae" stroke-width="3"/><text x="313" y="107" text-anchor="middle" fill="#cbd6bc" font-size="8">7 / ELEVEN</text></g>`;
const pear=`<g transform="translate(395 125)"><path d="M0 78v-62m0 24-17-20m17 9 15-24" fill="none" stroke="#879987" stroke-width="4"/><g fill="#eee5d6"><circle r="10" cx="0" cy="10"/><circle r="10" cx="-17" cy="17"/><circle r="9" cx="12" cy="-1"/><circle r="9" cx="-3" cy="-9"/></g></g>`;
const svgShell=content=>`<svg class="lab-illustration" viewBox="0 0 440 240" role="img" aria-label="玩法示意圖"><defs><linearGradient id="lab-bg" x2="0" y2="1"><stop stop-color="#20383e"/><stop offset="1" stop-color="#10262f"/></linearGradient><radialGradient id="lab-light"><stop stop-color="#ffe6a6" stop-opacity=".34"/><stop offset="1" stop-color="#ffe6a6" stop-opacity="0"/></radialGradient></defs><rect width="440" height="240" rx="18" fill="url(#lab-bg)"/><ellipse cx="220" cy="208" rx="205" ry="22" fill="#85afa0" opacity=".09"/><path d="M17 205H423" stroke="#91aba0" stroke-opacity=".3"/>${content}</svg>`;
const illustrations={
  cannon:svgShell(`<ellipse cx="85" cy="125" rx="65" ry="79" fill="url(#lab-light)"/><g data-svg="hero"><circle cx="81" cy="115" r="14" fill="#e4ddc6"/><path d="m79 129-19 63h43l-16-63" fill="#91a28b"/><path d="M94 140h45" stroke="#c5d9c2" stroke-width="8"/><ellipse cx="82" cy="144" rx="39" ry="55" fill="none" stroke="#d7b974" stroke-width="2"/></g>${store}${pear}<path data-svg="beam" d="M141 140H310" stroke="#ffedb4" stroke-width="13" opacity="0"/><circle data-svg="blast" cx="310" cy="140" r="35" fill="#ffe8a6" opacity="0"/>`),
  compress:svgShell(`${store}${pear}<g data-svg="press"><path d="M250 29h127v15H250z" fill="#809b90"/><path d="M304 42v51" stroke="#b2b8a1" stroke-width="11"/><path d="M251 90h126v14H251z" fill="#ddbd7f"/></g><g data-svg="load" fill="#8ca18a" stroke="#cfcc9c" stroke-width="1"><path d="M104 150h44v42h-44zM136 117h42v42h-42zM74 176h43v25H74z"/><path d="M121 169h49v31h-49zM158 159h45v41h-45z"/></g><path d="m58 209 0-16m9 16v-8m9 8v-16m9 16v-8m9 8v-16" stroke="#d7b575"/><text x="109" y="225" text-anchor="middle" fill="#adc0af" font-size="10">一萬噸息壤</text><rect data-svg="cube" x="296" y="173" width="30" height="30" rx="3" fill="#a9b28f" opacity="0"/>`),
  washer:svgShell(`<rect x="120" y="25" width="203" height="185" rx="15" fill="#667e78"/><path d="M128 61h186" stroke="#bfd1b3" stroke-width="2"/><rect x="137" y="36" width="56" height="16" rx="3" fill="#203b43"/><circle cx="296" cy="44" r="8" fill="#d1b77c"/><circle cx="222" cy="133" r="65" fill="#142e36" stroke="#b6bfa8" stroke-width="8"/><g data-svg="drum"><path d="m174 116 42-27 37 15-7 52-49 26-24-23Z" fill="#aeae88"/><path d="m217 92 38 24 19 45-41 23-10-35Z" fill="#c4a974" opacity=".8"/><path d="M174 134h95M213 83l14 99" stroke="#5b7971" stroke-width="2"/></g><g data-svg="foam" fill="#dbebdf" opacity=".5"><circle cx="177" cy="159" r="17"/><circle cx="207" cy="168" r="21"/><circle cx="240" cy="167" r="16"/><circle cx="267" cy="156" r="14"/></g><path d="M107 218h227" stroke="#d9bb81" stroke-opacity=".5"/>`),
  microwave:svgShell(`<rect x="58" y="49" width="326" height="154" rx="13" fill="#647e76"/><rect x="73" y="66" width="240" height="119" rx="8" fill="#122c35" stroke="#adc0a8" stroke-width="2"/><g data-svg="tray"><ellipse cx="192" cy="148" rx="102" ry="20" fill="#c8c5a9"/><rect data-svg="zone0" x="103" y="109" width="54" height="43" rx="7" fill="#9e9d75"/><rect data-svg="zone1" x="166" y="109" width="54" height="43" rx="7" fill="#9e9d75"/><rect data-svg="zone2" x="229" y="109" width="54" height="43" rx="7" fill="#9e9d75"/></g><rect x="328" y="72" width="40" height="25" rx="3" fill="#18343b"/><text data-svg="heat" x="348" y="89" text-anchor="middle" fill="#d4e5ba" font-size="11">00</text><circle cx="348" cy="132" r="16" fill="#c3b683"/><circle cx="348" cy="171" r="8" fill="#9bb49d"/><g data-svg="steam" stroke="#d6e2cb" fill="none" opacity="0"><path d="M132 96q-13-15 0-30m64 30q-13-15 0-30m64 30q-13-15 0-30"/></g>`),
  scan:svgShell(`<path d="M34 188h372v13H34z" fill="#60796e"/><path d="M105 88h40l-4 98h-32z" fill="#d3bc87"/><path d="M102 82h46v9h-46z" fill="#c9d2b8"/><path d="M110 120h31v34h-31z" fill="#7b9f87"/><path d="m172 181 22-58 23 58z" fill="#ded9b9" stroke="#94a98d" stroke-width="3"/><path d="m185 154 20 1v25h-21z" fill="#4c6c5f"/><path d="M273 133h48l-7 53h-34z" fill="#a8ba91"/><path d="M269 128h56v9h-56z" fill="#daca9f"/><path d="M345 100h49v86h-49z" fill="#b3bba5"/><path d="M342 100h55v7h-55z" fill="#c07853"/><path d="M342 110h55v5h-55z" fill="#76a07d"/><path d="M351 127h37v47h-37z" fill="#264751"/><text x="125" y="224" text-anchor="middle" fill="#c7d4bd" font-size="10">咖啡</text><text x="194" y="224" text-anchor="middle" fill="#c7d4bd" font-size="10">飯糰</text><text x="297" y="224" text-anchor="middle" fill="#c7d4bd" font-size="10">甜點</text><text x="370" y="224" text-anchor="middle" fill="#c7d4bd" font-size="10">整間店</text><rect data-svg="scan-target" x="100" y="70" width="50" height="120" rx="7" fill="#edd18f" fill-opacity=".06" stroke="#e2c384" stroke-dasharray="4 3"/><g data-svg="scanner"><path d="M0 35v170" stroke="#f2cc8d" stroke-width="3"/><path d="M-15 35h30m-30 170h30" stroke="#f2cc8d" stroke-width="3"/><rect x="-8" y="35" width="16" height="170" fill="#efcc8c" opacity=".1"/></g>`),
  pack:svgShell(`<path d="m86 92 135-57 137 57v100L222 225 86 192Z" fill="#9e8d66"/><path d="m87 92 135 48 135-48M222 140v84" fill="none" stroke="#d7c599" stroke-width="3"/><path d="m87 92 135-57 135 57-135 48Z" fill="#bba779"/><g data-svg="lid" style="transform-origin:222px 105px"><path d="m135 79 88-37 87 37-87 35Z" fill="#d9c69b" stroke="#ece1bb" stroke-width="2"/><path d="M222 49v60" stroke="#8f7c52" stroke-width="7"/></g><path d="M180 163h79v33h-79Z" fill="#d5c7a0"/><text x="220" y="184" text-anchor="middle" fill="#3f554f" font-size="11">整店退貨</text>${pear}<g data-svg="seals" fill="#d9bd84"><circle cx="161" cy="118" r="5"/><circle cx="222" cy="142" r="5"/><circle cx="285" cy="119" r="5"/></g>`),
};
const controls={
  cannon:`<button data-act="lock" class="lab-primary" data-ui="cannon-action">鎖定出力</button>`,
  compress:`<button data-act="feed">投料</button><button data-act="press" class="lab-primary">壓縮</button><button data-act="vent">卸壓</button>`,
  washer:`<button data-act="rpm" data-value="0">停轉</button><button data-act="rpm" data-value="1">低速</button><button data-act="rpm" data-value="2">高速</button><button data-act="left">配重 ←</button><button data-act="right">配重 →</button><button data-act="drain" class="lab-primary">排水</button>`,
  microwave:`<button data-act="zone" data-value="0">左格</button><button data-act="zone" data-value="1">中格</button><button data-act="zone" data-value="2">右格</button><button data-act="power" class="lab-primary" data-ui="power-action">啟動加熱</button><button data-act="vent">開門散熱</button>`,
  scan:`<button data-act="scan" class="lab-primary">掃描</button>`,
  pack:`<button data-act="left">逆時針 ↶</button><button data-act="right">順時針 ↷</button><button data-act="lock" class="lab-primary">封箱</button>`,
};
const help={
  cannon:'先按一下鎖定出力，再按一下校準。高出力的命中區較窄。累積破壞 100%，拆掉店體。',
  compress:'先投料，再壓縮。壓力升高就卸壓。把一萬噸壓成一小塊，換三元折價券。',
  washer:'調整轉速，左右配重。高速洗得快，也更容易失衡。泡沫太多就排水。',
  microwave:'選一格再啟動。三格都要熱透。注意過熱，必要時開門散熱。',
  scan:'等掃描線進入目標再按掃描。看清要複製的是咖啡、甜點，還是整間店。',
  pack:'左右旋轉箱蓋。對準標記，再按封箱。連續封好三層，別壓到旁邊的梨花。',
};

export function createPlayground({mount,onOpen,onClose}={}){
  const machine=new PlaygroundMachine(),abort=new AbortController(),best=new Map();
  const entry=document.createElement('button');entry.className='playground-entry';entry.type='button';entry.innerHTML='<span>玩法試驗區</span><small>6 種操作，先玩再選</small><b aria-hidden="true">↗</b>';entry.setAttribute('aria-haspopup','dialog');
  const modal=document.createElement('section');modal.className='playground-modal';modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','playground-title');
  modal.innerHTML=`<div class="playground-frame"><header class="lab-header"><div><span class="lab-eyebrow">WULING · GAMEPLAY LAB</span><h2 id="playground-title">玩法試驗區</h2></div><button class="lab-close" data-nav="close" aria-label="返回雨夜街角">×</button></header><div class="lab-body"><section class="lab-lobby"><p class="lab-intro">先試操作，再決定晚餐會惹出什麼事。<br><span>這裡是簡易玩法原型，支線故事尚未接入。</span></p><div class="lab-cards">${prototypes.map((p,i)=>`<button class="lab-card" data-game="${p.id}"><span class="lab-card-number">0${i+1} / ${p.tag}</span><strong>${p.title}</strong><span class="lab-card-story">${p.story}</span><span class="lab-card-mechanic">${p.mechanic}</span><span class="lab-card-go">試玩 <b aria-hidden="true">↗</b></span></button>`).join('')}</div></section><section class="lab-game" hidden><nav class="lab-game-nav"><button data-nav="list">← 其他玩法</button><span class="lab-prototype-badge">簡易玩法原型</span><button data-nav="retry">重試 ↻</button></nav><h3 data-ui="title"></h3><p class="lab-help" data-ui="help"></p><div class="lab-picture"></div><div class="lab-metrics">${Array.from({length:6},()=>'<div hidden><span></span><strong></strong></div>').join('')}</div><div class="lab-meter-wrap"><div class="lab-meter-caption"><span data-ui="meter-title"></span><span data-ui="meter-value"></span></div><div class="lab-meter"><i class="lab-fill"></i><i class="lab-target"></i><b class="lab-needle"></b></div></div><div class="lab-controls"></div><p class="lab-message" data-ui="message" role="status" aria-live="polite"></p><div class="lab-result" hidden><span data-ui="result-kicker"></span><strong data-ui="result"></strong><p data-ui="best"></p><button data-nav="retry" class="lab-primary">再試一次</button><button data-nav="list">換一種玩法</button></div><p class="lab-footnote">僅測試操作。正式支線的模型、演出與結局，仍待製作。</p></section></div></div>`;
  mount.append(entry,modal);
  const q=s=>modal.querySelector(s),ui=Object.fromEntries([...modal.querySelectorAll('[data-ui]')].map(n=>[n.dataset.ui,n]));
  const lobby=q('.lab-lobby'),game=q('.lab-game'),picture=q('.lab-picture'),controlsNode=q('.lab-controls'),resultNode=q('.lab-result'),meter=q('.lab-meter'),needle=q('.lab-needle'),target=q('.lab-target'),fill=q('.lab-fill'),metricNodes=[...q('.lab-metrics').children];
  let opened=false,current=null,lastStatus=null,lastMessage='',restoreFocus=null,inertRecords=[],svg={},pulseAt=-Infinity,pulseHit=false;
  const listen=(node,type,fn,options={})=>node.addEventListener(type,fn,{...options,signal:abort.signal});
  function open(id){
    if(!opened){opened=true;restoreFocus=document.activeElement;modal.hidden=false;mount.classList.add('playground-open');entry.setAttribute('aria-expanded','true');
      inertRecords=[...mount.children].filter(n=>n!==modal).map(n=>[n,n.inert]);for(const [n]of inertRecords)n.inert=true;onOpen?.();}
    if(id&&prototypes.some(p=>p.id===id))select(id);else showList();
    q('.lab-close').focus();
  }
  function close(){
    if(!opened)return;opened=false;modal.hidden=true;mount.classList.remove('playground-open');entry.setAttribute('aria-expanded','false');for(const [n,v]of inertRecords)n.inert=v;inertRecords=[];onClose?.();
    if(restoreFocus?.isConnected)restoreFocus.focus();
  }
  function showList(){current=null;lobby.hidden=false;game.hidden=true;q('.lab-body').scrollTop=0;}
  function select(id){
    const p=prototypes.find(v=>v.id===id);if(!p)return;
    current=id;machine.select(id);lastStatus=null;lastMessage='';pulseAt=-Infinity;ui.title.textContent=p.title;ui.help.textContent=help[id];picture.innerHTML=illustrations[id];controlsNode.innerHTML=controls[id];for(const node of controlsNode.querySelectorAll('[data-ui]'))ui[node.dataset.ui]=node;lobby.hidden=true;game.hidden=false;svg=Object.fromEntries([...picture.querySelectorAll('[data-svg]')].map(n=>[n.dataset.svg,n]));q('.lab-body').scrollTop=0;render();
  }
  function render(){
    if(!current)return;const s=machine.state,running=s.status==='running';
    for(const [i,node]of metricNodes.entries()){const m=s.metrics?.[i];node.hidden=!m;if(m){node.children[0].textContent=m.label;node.children[1].textContent=m.value;}}
    controlsNode.querySelectorAll('button').forEach(b=>{b.disabled=!running;if(b.dataset.act==='zone')b.setAttribute('aria-pressed',String(Number(b.dataset.value)===s.zone));if(b.dataset.act==='rpm')b.setAttribute('aria-pressed',String(Number(b.dataset.value)===s.rpm));});
    if(s.message!==lastMessage){ui.message.textContent=s.message;lastMessage=s.message;}
    let value=s.progress/100,marker=null,center=.5,width=.16,title='完成進度',valueText=pct(s.progress);
    if(current==='cannon'){
      value=s.step==='power'?s.meter:s.power;marker=s.meter;width=s.sweetWidth||.18;title=s.step==='power'?'選出力：越高越強，校準越難':'校準：命中亮區才發砲';valueText=`出力 ${pct(s.power*100)}`;ui['cannon-action'].textContent=s.step==='power'?'鎖定出力':'校準・發砲';
      const impulse=pulseHit?clamp(1-(s.time-pulseAt)/.4):0;svg.hero.style.transform=`translateX(${-impulse*10}px)`;svg.beam.setAttribute('opacity',String(impulse*.85));svg.blast.setAttribute('opacity',String(impulse*.65));q('.lab-store')?.setAttribute('opacity',String(1-clamp(s.progress/100)*.85));
    }else if(current==='compress'){
      value=s.pressure/100;title='壓力：過高會把店壓壞';valueText=pct(s.pressure);svg.press.setAttribute('transform',`translate(0 ${clamp(s.progress/100)*62})`);svg.load.setAttribute('opacity',String(1-clamp(s.progress/100)*.8));svg.cube.setAttribute('opacity',String(clamp(s.progress/100)));
    }else if(current==='washer'){
      value=clamp((s.balance+1)/2);marker=value;width=.34;title='左右平衡：保持在中央';valueText=`${Math.round(s.balance*100)}% / 泡沫 ${pct(s.foam)}`;svg.drum.setAttribute('transform',`rotate(${s.time*(s.rpm||0)*100} 222 133)`);svg.foam.setAttribute('opacity',String(clamp(s.foam/100)*.8));
    }else if(current==='microwave'){
      value=clamp(s.heat/100);title='機器餘熱：過熱前散熱';valueText=pct(s.heat);ui['power-action'].textContent=s.power?'停止加熱':'啟動加熱';svg.heat.textContent=Math.round(s.heat);svg.steam.setAttribute('opacity',String(clamp((s.heat-50)/70)));for(let i=0;i<3;i++){const t=s.zones[i];svg['zone'+i].setAttribute('fill',`hsl(${45-clamp(t/120)*30} 45% ${38+clamp(t/120)*22}%)`);svg['zone'+i].setAttribute('stroke',s.zone===i?'#f9e1a9':'transparent');svg['zone'+i].setAttribute('stroke-width','3');}
    }else if(current==='scan'){
      value=0;marker=s.cursor;center=s.target;width=s.width;title='掃描線：停在亮區';valueText=`已掃描 ${s.scanned} 件`;svg.scanner.setAttribute('transform',`translate(${38+clamp(s.cursor)*365} 0)`);svg['scan-target'].setAttribute('x',String(38+(s.target-s.width/2)*365));svg['scan-target'].setAttribute('width',String(s.width*365));
    }else if(current==='pack'){
      value=0;marker=clamp((s.angle+90)/180);center=clamp((s.targetAngle+90)/180);width=15/180;title='箱蓋角度：白線對準亮區';valueText=`${Math.round(s.angle)}° → ${Math.round(s.targetAngle)}°`;svg.lid.setAttribute('transform',`rotate(${s.angle} 222 105)`);[...svg.seals.children].forEach((n,i)=>n.setAttribute('opacity',String(i<s.seals?1:.2)));
    }
    ui['meter-title'].textContent=title;ui['meter-value'].textContent=valueText;fill.style.transform=`scaleX(${clamp(value)})`;needle.hidden=marker===null;needle.style.left=`${clamp(marker)*100}%`;target.hidden=marker===null||(current==='cannon'&&s.step==='power');target.style.left=`${clamp(center-width/2)*100}%`;target.style.width=`${clamp(width)*100}%`;meter.dataset.danger=String((current==='compress'&&s.pressure>75)||(current==='microwave'&&s.heat>95));
    if(s.status!==lastStatus){lastStatus=s.status;resultNode.hidden=running;if(!running){const won=s.status==='won';ui['result-kicker'].textContent=won?'測試成功':'測試結束';ui.result.textContent=s.result||s.message;if(won)best.set(current,Math.max(best.get(current)||0,s.score||0));ui.best.textContent=`本次 ${Math.round(s.score||0)} 分${best.has(current)?` · 最高 ${Math.round(best.get(current))} 分`:''}`;}}
  }
  function action(name,value){const before=machine.state;const accepted=machine.act(name,value);const after=machine.state;if(before.id==='cannon'&&before.step==='aim'&&name==='lock'&&accepted){pulseAt=after.time;pulseHit=after.hits>before.hits;}render();return accepted;}
  listen(entry,'click',()=>open());
  listen(modal,'click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.game){select(b.dataset.game);return;}
    if(b.dataset.nav==='close')close();else if(b.dataset.nav==='list')showList();else if(b.dataset.nav==='retry'){select(current);}else if(b.dataset.act){action(b.dataset.act,b.dataset.value===undefined?undefined:Number(b.dataset.value));}
  });
  listen(document,'keydown',e=>{
    if(!opened)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}
    if(e.key==='Tab'){const list=[...modal.querySelectorAll('button:not(:disabled)')].filter(n=>n.getClientRects().length);if(!list.length)return;const first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  },{capture:true});
  return {open,close,select,action,update(time,delta){if(!opened||!current||document.hidden)return;machine.update(time,delta);render();},get state(){return {open:opened,screen:current?'game':'list',activeId:current,clock:machine.state.time,...machine.state};},dispose(){close();abort.abort();entry.remove();modal.remove();}};
}
