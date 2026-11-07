// One choreography is sampled by the state, tray renderer, creature and camera.
export const FIRST_HANDOFF_DURATION=1.2;
export const FIRST_HANDOFF_CONTACT=.70;
export const RESCUE_CONTACT=4.90;
export const RESCUE_READY=9;
export const rescueEase=x=>{const v=Math.max(0,Math.min(1,x));return v*v*(3-2*v);};
const mix=(a,b,t)=>a+(b-a)*t;
export function rescueTiming(age=0){
 const e=Math.max(0,age),press=Math.sin(Math.PI*rescueEase((e-4.8)/.65));
 return {age:e,beat:e<1.8?'shake':e<2.7?'run':e<3.7?'almost':e<4.9?'stretch':e<5.5?'weight':e<6.7?'thumb':e<9?'lower':'guard',
  approach:rescueEase((e-1.8)/.9),release:rescueEase((e-5.0)/.45),press,
  thumb:rescueEase((e-5.5)/.25)*(1-rescueEase((e-6.45)/.25)),ready:e>=RESCUE_READY};
}
function streetRoute(from,to,progress,out){
 const lane=Math.max(6.2,Math.min(from[2],to[2])),points=[from,[from[0],.025,lane],[to[0],.025,lane],to],lengths=[];let total=0;
 for(let i=0;i<3;i++){const d=Math.hypot(points[i+1][0]-points[i][0],points[i+1][2]-points[i][2]);lengths.push(d);total+=d;}
 let left=progress*total;
 for(let i=0;i<3;i++){const d=lengths[i];if(left<=d||i===2){const t=d?Math.min(1,left/d):1;out[0]=mix(points[i][0],points[i+1][0],t);out[2]=mix(points[i][2],points[i+1][2],t);break;}left-=d;}
 out[1]=.025+.305*(1-rescueEase((out[2]-4.50)/.30));return out;
}
export function trayRescueFrame(age,donor,pickup=[-1.25,.33,3.90],out={}){
 const t=rescueTiming(age),base=out.base||[0,0,0],tray=out.tray||[0,0,0],start=[2.45,.33,4.52],catchBase=[donor[0],donor[2]>4.65?.025:.33,donor[2]+.06];
 streetRoute(start,catchBase,t.approach,base);
 if(age>=9)streetRoute(catchBase,pickup,rescueEase((age-9)/7),base);
 const full=Math.max(.55,donor[1]-base[1]);let height=.22;
 if(age>=2.7&&age<3.7){height=mix(.22,full-.13,rescueEase((age-2.7)/.60))-.025*rescueEase((age-3.35)/.25);}
 else if(age>=3.7&&age<4.9)height=mix(full-.155,full,rescueEase((age-3.7)/1.2));
 else if(age>=4.9)height=mix(full,.55,rescueEase((age-6.7)/2.1));
 tray[0]=age<6.7?donor[0]:mix(donor[0],base[0],rescueEase((age-6.7)/2.1));tray[1]=age<6.7?donor[1]:base[1]+height;tray[2]=age<6.7?donor[2]:mix(donor[2],base[2],rescueEase((age-6.7)/2.1));
 if(age>=9){tray[0]=base[0];tray[1]=base[1]+.55;tray[2]=base[2];height=.55;}
 Object.assign(out,t,{base,tray,height,carrying:age>=RESCUE_CONTACT});return out;
}
