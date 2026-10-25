// All times are mission-clock seconds. No timer or rendering loop.
export class RhythmHeat {
  constructor(){this.round=0;this.failures=0;this.attempts=0;this.first=true;this.status='ready';this.notes=[];this.origin=0;this.holding=false;this.active=-1;this.revision=0;this.result='';}
  get level(){return Math.min(3,this.failures);}
  get window(){return [.14,.12,.10][Math.min(2,this.round)]+this.level*.045;}
  start(now){
    if(this.status!=='ready')return false;
    this.attempts++;this.origin=now;this.status='playing';this.result='';this.holding=false;this.active=-1;
    this.bpm=Math.max(65,[90,110,130][this.round]-this.level*15);this.beat=60/this.bpm;
    const patterns=[['tap','tap','tap','tap'],['tap','hold','tap','tap'],['hold','tap','hold','tap']];
    let cursor=1.5;this.notes=patterns[this.round].map(type=>{const note={type,at:cursor*this.beat,end:(cursor+(type==='hold'?1:0))*this.beat,result:'pending'};cursor+=type==='hold'?2:1;return note;});
    this.forced=this.first;this.revision++;return true;
  }
  down(now){
    if(this.status!=='playing'||this.holding)return false;
    const t=now-this.origin,index=this.notes.findIndex(n=>['pending','miss'].includes(n.result)&&Math.abs(t-n.at)<=this.window);
    if(index<0){this.result='等電流到判定線再按';return false;}
    const n=this.notes[index];
    if(n.type==='hold'){this.holding=true;this.active=index;n.result='holding';this.result='按住，尾端到線再放';}
    else {n.result='hit';this.result='穩了';}
    return true;
  }
  up(now){
    if(!this.holding)return false;
    const n=this.notes[this.active];n.result=Math.abs(now-this.origin-n.end)<=this.window*1.4?'hit':'miss';this.result=n.result==='hit'?'穩了':'長按放開時機不對';this.holding=false;this.active=-1;return true;
  }
  cancel(){if(this.status==='playing'){this.status='ready';this.holding=false;this.active=-1;this.result='已中斷，本段重新準備';} }
  update(now){
    if(this.status!=='playing')return;
    const t=now-this.origin;
    if(this.forced&&t>=this.beat*3){this.fail('surge');return;}
    for(const n of this.notes){if(n.result==='pending'&&t>n.at+this.window+.25)n.result='miss';if(n.result==='holding'&&t>n.end+this.window*1.4+.25){n.result='miss';this.holding=false;this.active=-1;}}
    if(t>this.notes.at(-1).end+this.window+.65){
      if(this.notes.filter(n=>n.result==='hit').length>=3){this.round++;this.status=this.round===3?'won':'ready';this.result=this.round===3?'加熱完成：0.3 秒':'本段完成';this.revision++;}
      else this.fail('timing');
    }
  }
  fail(reason){if(reason==='surge')this.first=false;this.status='burnt';this.holding=false;this.active=-1;this.failures++;this.result=reason==='surge'?'電網突波！設備失控，非操作失誤。':'節拍失穩，便當逃出去了。';this.revision++;}
  retry(){if(this.status!=='burnt')return false;this.status='ready';this.result=this.level>=2?'人類操作相容模式：啟用。':'功率已調低，判定已放寬。';return true;}
  state(now){const t=Math.max(0,now-this.origin);return {status:this.status,round:Math.min(2,this.round),completed:this.round,failures:this.failures,attempts:this.attempts,holding:this.holding,powered:this.holding||this.notes.some(n=>n.result==='hit'&&t-n.at>=0&&t-n.at<.2),forced:this.forced,revision:this.revision,result:this.result,bpm:this.bpm||90,window:this.window,elapsed:t,notes:this.notes.map(n=>({...n})),progress:Math.min(1,(this.round+(this.status==='playing'?Math.min(1,t/(this.notes.at(-1)?.end||1)):0))/3),electricalTime:Math.min(.3,this.round*.1),demoIndex:-1,demoProgress:0};}
}
