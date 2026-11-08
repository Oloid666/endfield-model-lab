// Camera, microwave and creature share these story-clock boundaries.
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const p=clamp(x);return p*p*(3-2*p);};
export const BIRTH_TIMES=Object.freeze({swell:1.5,peek:4.5,escape:7,land:9.5,ready:11.5});
export const MEAL_BIRTH_DIALOGUE_AT=BIRTH_TIMES.ready;
export const MEAL_LANDING=[3.70,.33,.45];
export function mealBirthFrame(age=0,reduced=false){
 const t=Math.max(0,age),morph=ease((t-BIRTH_TIMES.swell)/(BIRTH_TIMES.peek-BIRTH_TIMES.swell)),escape=ease((t-BIRTH_TIMES.escape)/(BIRTH_TIMES.land-BIRTH_TIMES.escape)),land=ease((t-BIRTH_TIMES.land)/(BIRTH_TIMES.ready-BIRTH_TIMES.land));
 const fall=clamp((t-BIRTH_TIMES.land)/1.05),settle=ease((t-BIRTH_TIMES.land-1.05)/.95);
 const position=[3.545+(MEAL_LANDING[0]-3.545)*escape,t<BIRTH_TIMES.land?1.435+(1.28-1.435)*escape+(reduced?0:Math.sin(escape*Math.PI)*.04):1.28+(MEAL_LANDING[1]-1.28)*fall*fall,t<BIRTH_TIMES.land?1.43+(.88-1.43)*escape:.88+(MEAL_LANDING[2]-.88)*ease(fall)];
 const squash=reduced?0:Math.sin(settle*Math.PI)*.30;
 return {beat:t<BIRTH_TIMES.swell?'charred':t<BIRTH_TIMES.peek?'swelling':t<BIRTH_TIMES.escape?'peeking':t<BIRTH_TIMES.land?'escape':t<BIRTH_TIMES.ready?'landing':'alive',visible:t>=BIRTH_TIMES.swell,revealed:t>=BIRTH_TIMES.land,dialogueReady:t>=BIRTH_TIMES.ready,charred:1,morph,escape,position,scale:[(.15+.85*morph)*(1+squash*.35),(.12+.88*morph)*(1-squash),(.2+.8*morph)*(1+squash*.2)],doorAngle:1.5*ease((t-6.2)/.6)*(1-ease((t-BIRTH_TIMES.ready)/1.2)),arcCount:t<4.5?1:t<7?2:t<9.5?3:t<11.5?2:1};
}
