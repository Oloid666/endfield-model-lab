// Two shot sizes on the same course. Preview hazards, then hold the overview through recovery.
export function createCameraDirector(){
 let time=0,until=0,shot='close',blend=0,reason='直道';
 return {reset(){time=0;until=0;shot='close';blend=0;reason='直道';},update({mode='auto',bend=0,grade=0,span=0,dt=0,snap=false}){
  time+=Math.min(.25,Math.max(0,dt));
  if(mode==='auto'){
   const hazard=bend>.42||grade>.22||span>.68;
   if(hazard){shot='wide';until=time+.65;reason=bend>.42?'彎道':span>.68?'甩動':'坡道';}
   else if(time>=until&&bend<.22&&grade<.12&&span<.48){shot='close';reason='直道';}
  }else{shot=mode==='wide'?'wide':'close';reason='手動';}
  const target=shot==='wide'?1:0;blend=snap?target:blend+(target-blend)*(1-Math.exp(-dt*4.5));
  return {shot,blend,reason};
 }};
}
