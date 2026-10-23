// One shared scene clock. Events have an approach, hold and release.
const smooth=(a,b,t)=>{const v=Math.min(1,Math.max(0,(t-a)/(b-a)));return v*v*(3-2*v);};
const windowed=(t,a,b,c,d)=>smooth(a,b,t)*(1-smooth(c,d,t));
const BLINKS=[2.4,7,11.4,11.74,18.8,24.9,30.2,35.9,40.5,48.1,54.8];
export function sampleIdle(time,out){
  const t=time%58;
  out.phase=t;
  out.goodsEyes=windowed(t,6.2,6.7,11.4,12.1);
  out.goods=windowed(t,6.6,8.0,11,13);
  out.dragonEyes=windowed(t,16.6,17,21.7,22.2);
  out.dragon=windowed(t,17,18.2,21,23);
  out.sleeve=windowed(t,26,27.5,29.2,31);
  out.rain=windowed(t,34,35.3,38.8,40.5);
  out.curious=windowed(t,14,15.1,17.1,18.2);
  out.startle=windowed(t,37.4,37.52,37.72,38.7);
  out.nod=windowed(t,20.2,20.55,20.7,21.1);
  out.shift=windowed(t,3.5,6,44,47);
  out.exhale=windowed(t,43,44.3,45,47);
  out.phone=windowed(t,49,50.3,52,53.8);
  let blink=0;
  for(const at of BLINKS)blink=Math.max(blink,Math.max(0,1-Math.abs(t-at)/.1));
  out.blink=blink;
  return out;
}
