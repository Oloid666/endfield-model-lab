export function claimsReaction(age,field=0,policy=false,reduced=false){
 const t=Math.max(0,age),envelope=t<1?Math.sin(Math.PI*t):0;
 const fly=policy&&!reduced&&t<1.5?Math.sin(Math.PI*t/1.5)**2:0;
 return {intensity:envelope*(.3+Math.min(4,Math.max(0,field))*.16),fly,locked:t<(policy?1.5:1)};
}
