// One pausable scene clock drives both the judgement and the visible ring.
export const SHOT_CHARGE={full:1.2,warning:1.6,overheat:1.9,cooldown:.6};
export function chargeShot(age=0){
 const t=Math.max(0,age),amount=Math.min(1,t/SHOT_CHARGE.full);
 if(t>=SHOT_CHARGE.overheat-1e-8)return {status:'overheated',amount:0,power:0,damage:0,result:'vent',recoil:0};
 return {status:t>=SHOT_CHARGE.warning?'warning':t>=SHOT_CHARGE.full?'gold':'charging',amount,power:.35+.65*amount,damage:Math.round(8+14*amount),result:t>=SHOT_CHARGE.full?'perfect':amount>=.5?'strong':'hit',recoil:.55+.85*amount};
}
export const STRUGGLE_PERIOD=.36;
export const STRUGGLE_FRAMES=[{offset:0,value:.08},{offset:.12,value:.05},{offset:.31,value:.10},{offset:.49,value:.06},{offset:.66,value:.11},{offset:.83,value:.07},{offset:1,value:.08}];
export function strugglePosition(age=0){
 const p=((age%STRUGGLE_PERIOD)+STRUGGLE_PERIOD)%STRUGGLE_PERIOD/STRUGGLE_PERIOD;
 for(let i=1;i<STRUGGLE_FRAMES.length;i++){const a=STRUGGLE_FRAMES[i-1],b=STRUGGLE_FRAMES[i];if(p<=b.offset)return a.value+(b.value-a.value)*(p-a.offset)/(b.offset-a.offset);}
 return .08;
}
