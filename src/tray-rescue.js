// Shared story clock: hold high, toss one real tray, catch, acknowledge, resume aim.
export const FIRST_HANDOFF_DURATION=1.2;
export const FIRST_HANDOFF_CONTACT=.70;
export const RESCUE_RELEASE=5.5;
export const RESCUE_CONTACT=7;
export const RESCUE_READY=12;
export const RESCUE_WAITING=Object.freeze([.15,.025,14.45]);
export const RESCUE_TIMES=Object.freeze({notice:1.5,arrive:4.5,release:RESCUE_RELEASE,contact:RESCUE_CONTACT,okay:8.2,thumb:8.8,guard:10.1,return:12,ready:RESCUE_READY});
export const rescueEase=x=>{const v=Math.max(0,Math.min(1,x));return v*v*(3-2*v);};
const mix=(a,b,t)=>a+(b-a)*t;
export function rescueTiming(age=0){
 const e=Math.max(0,age),emoji=e<2.2?'':e<2.9?'✋':e<3.6?'😌':e<4.3?'🍱':e<5.5?'🫴':e<8.2?'':e<8.8?'👌':e<10.1?'👍':'';
 return {age:e,beat:e<1.5?'hold':e<2.2?'notice':e<4.5?'approach':e<5.5?'prepare-toss':e<7?'fall':e<8.2?'weight':e<8.8?'okay':e<10.1?'thumb':e<12?'guard':'aim',approach:rescueEase((e-2.2)/2.3),lowered:0,release:rescueEase((e-RESCUE_RELEASE)/.3),press:e>=7&&e<8.2?Math.sin(Math.PI*rescueEase((e-7)/1.2)):0,thumb:rescueEase((e-8.8)/.22)*(1-rescueEase((e-9.88)/.22)),emoji,ready:e>=RESCUE_READY};
}
function streetRoute(from,to,progress,out){
 const lane=Math.max(6.2,Math.min(from[2],to[2])),points=[from,[from[0],.025,lane],[to[0],.025,lane],to],lengths=[];let total=0;
 for(let i=0;i<3;i++){const d=Math.hypot(points[i+1][0]-points[i][0],points[i+1][2]-points[i][2]);lengths.push(d);total+=d;}
 let left=progress*total;
 for(let i=0;i<3;i++){const d=lengths[i];if(left<=d||i===2){const t=d?Math.min(1,left/d):1;out[0]=mix(points[i][0],points[i+1][0],t);out[2]=mix(points[i][2],points[i+1][2],t);break;}left-=d;}
 out[1]=.025+.305*(1-rescueEase((out[2]-4.50)/.30));return out;
}
export function trayRescueFrame(age,donor,pickup=[-1.25,.33,3.90],out={}){
 const t=rescueTiming(age),base=out.base||[0,0,0],tray=out.tray||[0,0,0],origin=out.handoffPoint||donor,catchBase=[donor[0]+.10,donor[2]>4.65?.025:.33,donor[2]+.42];
 streetRoute(RESCUE_WAITING,catchBase,t.approach,base);
 if(age>=12)streetRoute(catchBase,pickup,rescueEase((age-12)/6),base);
 const u=Math.max(0,Math.min(1,(age-RESCUE_RELEASE)/(RESCUE_CONTACT-RESCUE_RELEASE))),catchY=catchBase[1]+.64;
 let height=age<5.5?.28:age<6.7?mix(.28,.53,rescueEase((age-5.5)/.8)):mix(.53,.64,rescueEase((age-6.7)/.3));
 if(age<RESCUE_RELEASE){tray[0]=origin[0];tray[1]=origin[1];tray[2]=origin[2];}
 else if(age<RESCUE_CONTACT){tray[0]=mix(origin[0],catchBase[0],u);tray[1]=mix(origin[1],catchY,u*u)+.08*Math.sin(u*Math.PI);tray[2]=mix(origin[2],catchBase[2],u);}
 else{height=.64-.045*t.press; height=mix(height,.55,rescueEase((age-10.1)/1.1));tray[0]=base[0];tray[1]=base[1]+height;tray[2]=base[2];}
 Object.assign(out,t,{base,tray,height,airborne:age>=RESCUE_RELEASE&&age<RESCUE_CONTACT,tilt:age>=RESCUE_RELEASE&&age<RESCUE_CONTACT?Math.sin(u*Math.PI)*.065:0,carrying:age>=RESCUE_CONTACT});return out;
}
