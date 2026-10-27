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
