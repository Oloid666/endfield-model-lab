// Shared story-clock score: state, performers, creature, UI and cameras.
export const FIRST_HANDOFF_DURATION=1.2;
export const FIRST_HANDOFF_CONTACT=.70;
export const RESCUE_CONTACT=8.80;
export const RESCUE_READY=17;
export const RESCUE_WAITING=Object.freeze([.15,.025,14.45]);
export const RESCUE_TIMES=Object.freeze({notice:2,arrive:4,lowered:6,almost:7.2,retry:7.8,contact:RESCUE_CONTACT,release:9.05,okay:9.5,thumb:10.6,guard:12,return:14,ready:RESCUE_READY});
export const rescueEase=x=>{const v=Math.max(0,Math.min(1,x));return v*v*(3-2*v);};
const mix=(a,b,t)=>a+(b-a)*t;
export function rescueTiming(age=0){
 const e=Math.max(0,age),T=RESCUE_TIMES,lowered=rescueEase((e-T.arrive)/2)*(1-rescueEase((e-T.return)/3));
 const emoji=e<1?'':e<2.2?'👀':e<3.2?'✋':e<4.2?'😌':e<5.2?'🍱':e<6.4?'🫴':e<9.5?'':e<10.6?'👌':e<12?'👍':'';
 return {age:e,beat:e<2?'notice':e<4?'approach':e<6?'descend':e<7.8?'almost':e<8.8?'reach':e<9.5?'weight':e<10.6?'okay':e<12?'thumb':e<14?'guard':'return',approach:rescueEase((e-2)/2),lowered,release:rescueEase((e-9.05)/.45),press:Math.sin(Math.PI*rescueEase((e-8.65)/.85)),thumb:rescueEase((e-10.6)/.25)*(1-rescueEase((e-11.75)/.25)),emoji,ready:e>=RESCUE_READY};
}
function streetRoute(from,to,progress,out){
 const lane=Math.max(6.2,Math.min(from[2],to[2])),points=[from,[from[0],.025,lane],[to[0],.025,lane],to],lengths=[];let total=0;
 for(let i=0;i<3;i++){const d=Math.hypot(points[i+1][0]-points[i][0],points[i+1][2]-points[i][2]);lengths.push(d);total+=d;}
 let left=progress*total;
 for(let i=0;i<3;i++){const d=lengths[i];if(left<=d||i===2){const t=d?Math.min(1,left/d):1;out[0]=mix(points[i][0],points[i+1][0],t);out[2]=mix(points[i][2],points[i+1][2],t);break;}left-=d;}
 out[1]=.025+.305*(1-rescueEase((out[2]-4.50)/.30));return out;
}
export function trayRescueFrame(age,donor,pickup=[-1.25,.33,3.90],out={}){
 const t=rescueTiming(age),base=out.base||[0,0,0],tray=out.tray||[0,0,0],start=RESCUE_WAITING,catchBase=[donor[0],donor[2]>4.65?.025:.33,donor[2]+.06];
 streetRoute(start,catchBase,t.approach,base);
 if(age>=14)streetRoute(catchBase,pickup,rescueEase((age-14)/6),base);
 const lowY=catchBase[1]+1.25,donorY=mix(donor[1],lowY,rescueEase((age-4)/2)),goal=out.handoffPoint||[donor[0],donorY,donor[2]],fullHeight=Math.max(.28,goal[1]-catchBase[1]);let height=.28;
 if(age>=6&&age<7.8)height=mix(.28,fullHeight-.14,rescueEase((age-6)/1.2))-.03*rescueEase((age-7.2)/.6);
 else if(age>=7.8&&age<RESCUE_CONTACT)height=mix(fullHeight-.17,fullHeight,rescueEase((age-7.8)/1));
 else if(age>=RESCUE_CONTACT)height=mix(fullHeight,.55,rescueEase((age-12)/2));
 tray[0]=age<12?goal[0]:mix(goal[0],base[0],rescueEase((age-12)/2));tray[1]=age<12?goal[1]:base[1]+height;tray[2]=age<12?goal[2]:mix(goal[2],base[2],rescueEase((age-12)/2));
 if(age>=14){tray[0]=base[0];tray[1]=base[1]+.55;tray[2]=base[2];height=.55;}
 Object.assign(out,t,{base,tray,height,carrying:age>=RESCUE_CONTACT});return out;
}
