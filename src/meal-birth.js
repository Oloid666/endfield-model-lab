// Shared choreography: camera, appliance and creature read the same mission clock.
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{const p=clamp(x);return p*p*(3-2*p);};
export const MEAL_BIRTH_DIALOGUE_AT=6.8;
export const MEAL_LANDING=[3.38,1.28,1.12];
export function mealBirthFrame(age=0,reduced=false){
 const t=Math.max(0,age),morph=ease((t-.5)/1.7),escape=ease((t-2.4)/2.0),land=ease((t-4.4)/.8);
 const position=[3.545+(MEAL_LANDING[0]-3.545)*escape,1.435+(MEAL_LANDING[1]-1.435)*escape+(reduced?0:Math.sin(escape*Math.PI)*.07),1.43+(MEAL_LANDING[2]-1.43)*escape];
 const squash=reduced?0:Math.sin(land*Math.PI)*.4;
 return {beat:t<.5?'charred':t<2.4?'swelling':t<4.4?'escape':t<5.2?'landing':'alive',visible:t>=.5,revealed:t>=4.4,dialogueReady:t>=MEAL_BIRTH_DIALOGUE_AT,charred:1,morph,escape,position,scale:[(.15+.85*morph)*(1+squash*.35),(.12+.88*morph)*(1-squash),(.2+.8*morph)*(1+squash*.2)],doorAngle:.23*ease((t-1.9)/.5)*(1-ease((t-6.8)/1.2)),arcCount:t<1.5?1:t<3?2:t<4.8?3:t<7.3?4:1};
}
