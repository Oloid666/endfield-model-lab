// All actors use the same pausable shopping clock. Ownership is not a position switch.
export const OPENING_HANDOFF={duration:3.2,contact:1.5,owner:1.9,release:2.1,clear:2.8};
export const DIRECTOR_BEAT={reply:4.8,lens:5.5,duration:7.5,return:1.5};
export const openingEase=(age,start,end)=>{const p=Math.max(0,Math.min(1,(age-start)/(end-start)));return p*p*(3-2*p);};
export function openingHandoff(age,out={}){
 out.travel=openingEase(age,.5,OPENING_HANDOFF.contact);
 out.reach=openingEase(age,.3,OPENING_HANDOFF.contact);
 out.grip=openingEase(age,1.25,OPENING_HANDOFF.contact);
 out.retract=openingEase(age,OPENING_HANDOFF.release,OPENING_HANDOFF.clear);
 out.drop=openingEase(age,OPENING_HANDOFF.release,2.35);
 out.back=openingEase(age,2.35,2.65);
 out.rest=openingEase(age,2.65,OPENING_HANDOFF.clear);
 out.returnBody=openingEase(age,.5,1.5)*(1-openingEase(age,2.65,OPENING_HANDOFF.duration));
 out.shared=age>=OPENING_HANDOFF.contact&&age<OPENING_HANDOFF.release;
 out.owner=age<OPENING_HANDOFF.owner?'dragon':'hero';
 return out;
}
