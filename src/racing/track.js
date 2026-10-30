// Arc-length sampled road: heading belongs to the road, never to the player.
export const LENGTH=520, WIDTH=7.2;
export const BENDS=[
  {start:55,end:125,angle:70,label:'右急彎',side:1},
  {start:165,end:240,angle:-100,label:'左急彎',side:-1},
  {start:285,end:350,angle:85,label:'右急彎',side:1},
  {start:395,end:455,angle:-55,label:'左彎',side:-1},
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function headingAt(s){return BENDS.reduce((h,b)=>{const t=clamp((s-b.start)/(b.end-b.start),0,1);return h+b.angle*Math.PI/180*t*t*(3-2*t);},0);}
export const height=s=>24-s*.045;
const samples=[{x:0,z:0,heading:0}];
for(let s=1;s<=LENGTH;s++){
  const prev=samples[s-1],h=headingAt(s-.5);
  samples.push({x:prev.x+Math.sin(h),z:prev.z-Math.cos(h),heading:headingAt(s)});
}
export function road(s,offset=0){
  const u=clamp(s,0,LENGTH),i=Math.min(LENGTH-1,Math.floor(u)),t=u-i,a=samples[i],b=samples[i+1];
  const heading=a.heading+(b.heading-a.heading)*t,nx=Math.cos(heading),nz=Math.sin(heading),extra=s-u;
  return {x:a.x+(b.x-a.x)*t+Math.sin(heading)*extra+nx*offset,
    z:a.z+(b.z-a.z)*t-Math.cos(heading)*extra+nz*offset,y:height(s),heading,nx,nz,s};
}
export function project(x,z,hint){
  // Local lookup is safe on this non-crossing track, with a global fallback for recovery.
  const min=Number.isFinite(hint)?clamp(Math.floor(hint)-35,0,LENGTH-1):0;
  const max=Number.isFinite(hint)?clamp(Math.ceil(hint)+35,0,LENGTH-1):LENGTH-1;
  let best=Infinity,bestS=0;
  for(let i=min;i<=max;i++){
    const a=samples[i],b=samples[i+1],dx=b.x-a.x,dz=b.z-a.z;
    const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1);
    const distance=(x-a.x-dx*t)**2+(z-a.z-dz*t)**2;
    if(distance<best){best=distance;bestS=i+t;}
  }
  if(Number.isFinite(hint)&&best>30**2)return project(x,z);
  const p=road(bestS);return {...p,offset:(x-p.x)*p.nx+(z-p.z)*p.nz};
}
export function nextBend(s){return BENDS.find(b=>b.end>s)||null;}
