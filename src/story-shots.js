// The six revised sequences have a single shot decision, after the legacy presets.
// Shot selection uses story events; motion uses the pausable scene clock.
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const p=clamp(x);return p*p*(3-2*p);};
const shot=(beat,position,target,fov)=>({beat,position,target,fov,cut:true});
function person(beat,p,{portrait,side=1,distance=3.7,push=0}={}){
 return shot(beat,[p[0]+side*1.3,p[1]+.26,p[2]+distance-push],[p[0]+side*.22,p[1],p[2]],portrait?40:32);
}
function caster(beat,feet,heading,portrait,head){const a=Math.sin(heading),b=Math.cos(heading),p=head||[feet[0],feet[1]+1.48,feet[2]];return shot(beat,[p[0]+a*3.4+b*.8,p[1]+.25,Math.max(2.35,p[2]+b*3.4-a*.8)],[p[0]+.10,p[1]-.10,p[2]],portrait?40:33);}

export function revisedStoryShot(s,{feet=[-1.25,.32,3.25],heroHead=null,dragon=[-2,1.5,3.5],portrait=false,reduced=false,heading=2.91,wirePoint=null,xaihiHead=null,mealPosition=null}={}){
 if(!s||s.postgame)return null;
 const e=s.phaseElapsed||0,age=s.nodeElapsed||0,index=Number((s.nodeId||'').split('_').at(-1))||0;
 const hero=heroHead?[heroHead[0],heroHead[1]+.04,heroHead[2]]:[feet[0],feet[1]+1.48,feet[2]],pet=[dragon[0],dragon[1]+.32,dragon[2]];
 const push=reduced?0:smooth(age/3)*.12;
 if(s.phase==='intro'&&s.purchaseElapsed==null){
  if(index===2&&age<1.2)return shot('opening-rain-establish',[-6.5,4.8,17],[-.3,2.8,1.4],portrait?58:44);
  if([6,8].includes(index)){const p=[(hero[0]+pet[0])/2,(hero[1]+pet[1])/2,(hero[2]+pet[2])/2];return shot('opening-pair',[p[0]+.8,p[1]+.55,p[2]+6.4],p,portrait?50:40);}
  return s.speaker==='zhuang'||s.node?.speaker==='zhuang'?person('opening-zhuang-side',hero,{portrait,side:1,distance:3.8,push}):person('opening-dragon-side',pet,{portrait,side:-1,distance:3.0,push});
 }
 if(s.phase==='briefing'){
  if(index<2)return shot('briefing-evidence',[1.4,4.9,5.8],[0,4.4,1.08],portrait?38:32);
  if(index===2)return caster('briefing-wants-her-book',feet,0,portrait,heroHead);
  if(index===3)return shot('briefing-book-evidence',[-.65,4.62,3.7],[-1.15,4.12,.7],portrait?34:28);
  if(index===4)return person('briefing-no-taste',hero,{portrait,side:1,distance:3.5});
  if(index<=6)return shot('briefing-copier',[2.0,4.82,4.5],[1.1,4.2,.72],portrait?35:29);
  if(index<=8)return shot('briefing-suspect-evidence',[.2,4.80,4.6],[-.1,4.5,1.12],portrait?36:30);
  if(index===9)return person('briefing-find-a-charge',hero,{portrait,side:1,distance:3.3});
  if(index<=12)return shot('briefing-pear-evidence',[9.7,4.7,6.1],[7.65,3.1,-.3],portrait?45:37);
  if(index<=15)return person('briefing-incident-time',hero,{portrait,side:1,distance:3.8});
  if(index<=19)return shot('briefing-built-to-demolish',[7.7,6.5,18.2],[.3,3,1],portrait?49:37);
  return person('briefing-final-instruction',s.speaker==='dragon'?pet:hero,{portrait,side:s.speaker==='dragon'?-1:1,distance:4.0});
 }
 if(s.phase==='charge'&&s.node){
  if(index===0||index===4||index===6||index===8)return caster(index===6?'charge-blank-time-reaction':'charge-caster-reaction',feet,heading,portrait,heroHead);
  if(index===1||index===2)return shot('charge-insured-store',[6.5,7.6,22],[0,2.8,1.5],portrait?57:44);
  if(index===3)return shot('charge-paper-trail',[-5.4,2.2,5.4],[-3.0,1.1,2.0],portrait?39:32);
  if(index===5)return shot('charge-forms-before-accident',[2.4,7.8,21],[-.4,3.1,1.4],portrait?56:43);
  if(index===7)return shot('charge-caster-and-grid',[feet[0]+6.2,feet[1]+.4,feet[2]+7.2],[feet[0],feet[1]+1.8,feet[2]],portrait?56:44);
  if(index===9)return person('charge-dragon-last-word',pet,{portrait,side:-1,distance:3.7});
 }
 if(s.phase==='meal-spawn'){
  if(e<2)return shot('birth-charred-meal',[3.35,1.83,-.12],[3.25,1.5,1.10],portrait?35:28);
  if(e<5)return shot('birth-arcs-before-creature',[3.5,2.3,-1.2],[3.43,1.57,1.10],portrait?62:46);
  if(e<8){const p=!reduced&&mealPosition?mealPosition:[3.22,1.50,1.0];return shot('birth-creature-reveal',[3.15,2.15,-1.3],[p[0],p[1]+.11,p[2]],portrait?64:48);}
  const p=mealPosition||[3.06,1.35,.8],h=xaihiHead||[2.17,1.8,.85];return shot('birth-creature-and-witness',[4.0,2.45,-1.2],[(h[0]+p[0])/2,(h[1]+p[1]+.11)/2,(h[2]+p[2])/2],portrait?64:48);
 }
 if(s.phase!=='hack'||!s.tablet)return null;
 const t=s.tablet,stage=t.stage;
 if(stage==='cable'){
  const a=t.age||0,p=wirePoint||[7.4,1.2,-14.56];
  if(reduced&&a<1.5)return shot('wire-source-hold',[9.8,2.65,-11.8],[7.2,1.05,-14.1],portrait?52:42);
  if(reduced&&a<4.9)return shot('wire-route-hold',[9.8,5.6,4.8],[5.9,.5,-7.5],portrait?62:48);
  if(a<1.5)return shot('wire-source-follow',[p[0]+2.1,p[1]+1.15,p[2]+2.3],[p[0],p[1]+.05,p[2]],portrait?48:39);
  if(a<4.9)return shot('wire-route-follow',[p[0]+2.4,p[1]+1.4,p[2]-1.3],[p[0],p[1]+.30,p[2]+.20],portrait?52:42);
  return shot('wire-microwave-arrival',[4.05,2.4,-.2],[4.32,1.35,1.10],portrait?72:48);
 }
 const temperature=()=>shot(stage==='defrost'?'fridge-temperature-reversal':'fridge-temperature-detail',[2.03,2.05,-.15],[1.79,1.92,-1.89],portrait?31:25);
 if(stage==='cooling'||stage==='defrost')return temperature();
 const face=xaihiHead||[1.2,1.75,-1.35],reaction=beat=>shot(beat,[face[0]+1.45,face[1]+.18,face[2]-.10],[face[0],face[1]-.03,face[2]],portrait?50:39);
 if(stage==='success')return t.dialogue?.speaker==='xaihi'?reaction('fridge-hopeful-profile'):temperature();
 if(stage==='hot'){
  if(t.dialogue?.speaker==='xaihi')return reaction('fridge-xaihi-reaction');
  if(t.dialogue?.speaker==='dragon')return shot(t.dialogue.cue==='song'?'fridge-dragon-song':'fridge-dragon-reaction',[-.55,1.95,-1.2],[1.7,1.48,-.65],portrait?50:40);
  return temperature();
 }
 return null;
}
