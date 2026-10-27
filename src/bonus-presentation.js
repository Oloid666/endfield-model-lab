// Presentation clocks use World's active clock; background tabs do not consume them.
export function lessonFrame(age,reaction=false,reduced=false){
 const t=Math.max(0,age);
 return {reveal:reduced?2:t<.25?0:t<.7?1:2,dead:reaction&&(reduced||t>=.45),pose:reaction?(t<.45&&!reduced?'interrupted':'awkward'):'explain'};
}
export class StampSequence{
 constructor(){this.cancel();}
 start(time,reduced=false){if(this.active)return false;this.active=true;this.at=time;this.reduced=reduced;this.hit=false;this.completed=false;return true;}
 advance(time){
  if(!this.active)return {phase:'idle',impact:false,done:false};
  const age=Math.max(0,time-this.at),impactAt=this.reduced?0:.4,duration=this.reduced?.15:1.15;
  const impact=!this.hit&&age>=impactAt;if(impact)this.hit=true;
  const done=age>=duration&&!this.completed;if(done){this.completed=true;this.active=false;}
  return {age,impact,done,phase:age>=duration?'complete':age>=.65?'printing':age>=impactAt?'impact':'lifting'};
 }
 cancel(){this.active=false;this.at=0;this.hit=false;this.completed=false;}
}

export class SmoothMeter{
 constructor(){this.from=0;this.target=0;this.at=0;}
 value(time){const p=Math.max(0,Math.min(1,(time-this.at)/1.15));return this.from+(this.target-this.from)*p*p*(3-2*p);}
 set(target,time,snap=false){if(this.target===target)return;this.from=snap?target:this.value(time);this.target=target;this.at=time;}
 reset(time=0){this.from=this.target=0;this.at=time;}
}

// Reading position is independent of the four-topic graduation meter.
export function lessonProgress(cursor,count){return count>1?Math.round(Math.max(0,Math.min(count-1,cursor))/(count-1)*100):0;}
export function wrapBoardText(text,measure,width){
 const lines=[];for(const paragraph of String(text).split('\n')){let line='';for(const ch of paragraph){if(line&&measure(line+ch)>width){lines.push(line);line='';}line+=ch;}lines.push(line);}return lines;
}
