export const STREET_WIDES=[
 {position:[0,7,23],target:[0,3,1.8],fov:43,mobileFov:56},
 {position:[-14,10,19],target:[0,2.8,.5],fov:46,mobileFov:60},
 {position:[14,11,20],target:[.6,2.8,.5],fov:46,mobileFov:60},
];
const clamp=v=>Math.max(0,Math.min(1,v));
export function streetStageFrame(age,duration,initial=false){
 const buildAt=5.3,end=buildAt+Math.max(5,duration),phase=age>=end?'hold':age>=buildAt?'building':age<.6?'closeup':age<2.2?'ascent':age<3.1?'gesture':'pullback';
 return {phase,buildAt,end,progress:clamp((age-buildAt)/(end-buildAt)),pull:clamp((age-3.1)/2.2),lift:clamp((age-.6)/1.6),done:age>=end+1.5};
}
export function streetWide(index=0,portrait=false){const s=STREET_WIDES[index%3];return {position:[...s.position],target:[...s.target],fov:portrait?s.mobileFov:s.fov};}
