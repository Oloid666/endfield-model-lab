import {faceFrame} from './cinematic-track.js';
import {mealBirthFrame} from './meal-birth.js';
// Revised sequences have a single shot decision, after the legacy presets.
// Shot selection uses story events; motion uses the pausable scene clock.
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const p=clamp(x);return p*p*(3-2*p);};
const shot=(beat,position,target,fov)=>({beat,position,target,fov,cut:true});
function person(beat,p,{portrait,side=1,distance=3.7,push=0}={}){
 return shot(beat,[p[0]+side*1.3,p[1]+.26,p[2]+distance-push],[p[0]+side*.22,p[1],p[2]],portrait?40:32);
}
function caster(beat,feet,heading,portrait,head){const a=Math.sin(heading),b=Math.cos(heading),p=head||[feet[0],feet[1]+1.48,feet[2]];return shot(beat,[p[0]+a*3.4+b*.8,p[1]+.25,Math.max(2.35,p[2]+b*3.4-a*.8)],[p[0]+.10,p[1]-.10,p[2]],portrait?40:33);}

const TERMINAL=[-1.65,.335,5.45];
const INPUT_PHASES=new Set(['terminal-quip','login','verify-talk','captcha','verified-talk','lever']);
// Only these three sequences use the new deterministic track. Other shots keep their authoring.
export function cinematicStoryShot(s,context,track){
 if(!s||s.postgame)return null;
 const c=Object.assign(track.context,context);c.aspect=context.aspect||(c.portrait?390/844:844/390);c.width=context.width||(c.portrait?390:844);c.height=context.height||(c.portrait?844:390);
 const feet=c.feet||[-1.25,.32,3.25],clock=s.clock||0,e=s.phaseElapsed||0,origin=clock-e,nodeOrigin=clock-(s.nodeElapsed||0),f=track.frame;
 const h=track.head,d=track.pet,mid=track.mid;
 if(c.heroHead)h.fromArray(c.heroHead);else h.set(feet[0],feet[1]+1.48,feet[2]);
 d.fromArray(c.dragon||[-2,1.5,3.5]);d.y+=.32;mid.copy(h).lerp(d,.5);
 if(s.phase==='intro'&&s.purchaseElapsed==null){
  if(s.node?.cue==='opening-establish'&&(s.nodeElapsed||0)<1.2){track.enter('cinematic-opening-establish',s,c,nodeOrigin);return track.pose([-6.5,4.8,17],[-.3,2.8,1.4],c.portrait?58:44);}
  const soup=s.node?.cue==='opening-soup',id=soup?'cinematic-opening-shoulder':'cinematic-opening-pair';
  if(track.enter(id,s,c,s.node?.cue==='opening-establish'?nodeOrigin+1.2:nodeOrigin)){
   if(soup){
    track.forward.copy(h).sub(d);track.forward.y=0;track.forward.normalize();track.right.crossVectors(track.forward,TUP).normalize();
    track.p.copy(d).addScaledVector(track.forward,-2.8).addScaledVector(track.right,2.2);track.p.y+=.35;track.t.copy(h);
    track.fitBox([h.x-.45,h.y-.8,h.z-.4],[h.x+.45,h.y+.35,h.z+.4],track.p,track.t,c.portrait?40:34,c);
   }else{
    track.p.copy(mid).add(PAIR_OFFSET);track.t.copy(mid);
    track.fitBox([Math.min(h.x-.55,d.x-.45),Math.min(h.y-1.7,d.y-.4),Math.min(h.z-.4,d.z-.4)],[Math.max(h.x+.55,d.x+.45),Math.max(h.y+.3,d.y+.55),Math.max(h.z+.4,d.z+.4)],track.p,track.t,c.portrait?46:36,c);
   }
   track.fixedP.z=Math.max(2.65,track.fixedP.z);
  }
  return track.fixed(clock,2.2,soup?.15:.25,c.portrait?(soup?40:46):(soup?34:36),c.reduced);
 }
 if((s.phase==='intro'||s.phase==='purchase')&&s.purchaseElapsed!=null){
  const counter=!!s.shopping?.atCounter;track.enter(counter?'cinematic-counter-collection':'cinematic-store-approach',s,c,origin);
  return track.pose(counter?[2.95,2.65,-.3]:[-.22,2.45,5.4],d,c.portrait?58:47);
 }
 if(s.phase==='walk-out'){
  const outside=(s.shopping?.segment||0)>=2;
  track.enter(outside?'cinematic-return-pair':'cinematic-return-door',s,c,origin);
  if(!outside)return track.pose([-.22,2.45,5.6],d,c.portrait?58:46);
  const u=clamp((d.x+.22)/(-2.55+.22));track.frame.progress=u;
  if(c.reduced)track.p.set(-.6,2.5,c.portrait?10.4:6.8);else{track.returnCurve.getPointAt(u,track.p);if(c.portrait)track.p.z+=3.6;}
  track.t.copy(d).lerp(mid,smooth((u-.65)/.35));return track.pose(track.p,track.t,c.portrait?50:40);
 }
 if(s.phase==='terminal-deploy'){
  if(track.enter('cinematic-terminal-unfold',s,c,origin)){
   track.p.set(.2,5.9,12.5);track.t.set(-1.65,.9,5.45);
   track.fitBox([-3.75,.3,4.05],[.45,2.35,6.8],track.p,track.t,c.portrait?74:55,c);
  }
  return track.fixed(clock,5.5,.35,c.portrait?74:55,c.reduced);
 }
 if(INPUT_PHASES.has(s.phase)){
  if(track.enter(s.phase==='terminal-quip'?'cinematic-terminal-preview':'cinematic-terminal-input',s,c,nodeOrigin)){
   track.p.set(TERMINAL[0]+.4,TERMINAL[1]+4.6,TERMINAL[2]+4.2);track.t.set(TERMINAL[0],TERMINAL[1]+.55,TERMINAL[2]);
   track.fitBox([-3.75,.3,4.05],[.45,2.55,6.85],track.p,track.t,c.portrait?76:56,c,'input');
  }
  return track.pose(track.fixedP,track.fixedT,c.portrait?76:56);
 }
 if(s.phase==='ascent'){
  track.enter('cinematic-authorized-ascent',s,c,origin);
  if(!track.riseReady){track.riseOrigin.copy(h);track.riseReady=true;}
  const u=c.reduced?1:smooth(e/5);f.progress=u;track.p.copy(track.riseOrigin).addScaledVector(RISE_START,1-u).addScaledVector(RISE_END,u);track.t.copy(h);track.t.y-=.45;
  return track.pose(track.p,track.t,c.portrait?48+6*u:40+6*u);
 }
 const aiming=s.phase==='aim-final'&&e>=6,finishing=s.phase==='finisher'&&e<6.2;
 if(aiming||finishing){
  const server=c.server||[0,1.21,1.06];track.captureAxis(feet,h.toArray(track.headArray||(track.headArray=[0,0,0])),server,c.heading??2.91);
  if(aiming){
   if(track.enter('cinematic-final-shoulder',s,c,origin+6)){
    track.p.copy(h).addScaledVector(track.axisForward,-3.8).addScaledVector(track.axisRight,1.2*track.axisSide);track.p.y+=.35;track.t.copy(h).multiplyScalar(.3).addScaledVector(track.offset.fromArray(server),.7);
    track.fitBox([server[0]-.45,server[1]-.6,server[2]-.4],[server[0]+.45,server[1]+1.25,server[2]+.4],track.p,track.t,c.portrait?58:46,c,'wide',true);
   }
   return track.pose(track.fixedP,track.fixedT,c.portrait?58:46);
  }
  if(e<2.75){
   if(track.enter('cinematic-finisher-face',s,c,origin)){
    const face=faceFrame(feet,c.heading??2.91,4.4,2.6,2.1,1.45);track.p.fromArray(face.position);track.t.set(h.x,h.y-.25,h.z);
    track.fitBox([feet[0]-.9,feet[1]+.95,feet[2]-.7],[feet[0]+.9,h.y+.35,feet[2]+.7],track.p,track.t,c.portrait?47:42,c);
   }
   return track.fixed(clock,1.2,.15,c.portrait?47:42,c.reduced);
  }
  if(e<4.35){track.enter('cinematic-finisher-flight',s,c,origin+2.75);track.sideAligned(c.portrait?[0,9.6,33]:[5,10,31]);return track.pose(track.p,[-1,3.2,7.5],c.portrait?63:54);}
  if(track.enter('cinematic-finisher-impact',s,c,origin+4.35)){
   track.sideAligned([5.8,7.5,8.5]);track.t.set(server[0],server[1]+1.5,server[2]);
   track.fitBox([-5.1,.3,-3.5],[5.1,6.7,4.5],track.p,track.t,c.portrait?68:60,c,'wide');
  }
  // Settle before the actual 4.9s impact; the blast itself never drives the path.
  return track.fixed(clock,.35,c.reduced?0:.1,c.portrait?68:60,c.reduced);
 }
 return null;
}
const TUP={x:0,y:1,z:0},PAIR_OFFSET={x:1.1,y:.35,z:5.8},RISE_START={x:2.6,y:.5,z:5.5},RISE_END={x:4,y:3.2,z:9};

export function revisedStoryShot(s,{feet=[-1.25,.32,3.25],heroHead=null,dragon=[-2,1.5,3.5],portrait=false,reduced=false,heading=2.91,wirePoint=null,xaihiHead=null,mealPosition=null}={}){
 if(!s||s.postgame)return null;
 const e=s.phaseElapsed||0,age=s.nodeElapsed||0,index=Number((s.nodeId||'').split('_').at(-1))||0;
 const hero=heroHead?[heroHead[0],heroHead[1]+.04,heroHead[2]]:[feet[0],feet[1]+1.48,feet[2]],pet=[dragon[0],dragon[1]+.32,dragon[2]];
 const push=reduced?0:smooth(age/3)*.12;
 if(s.phase==='briefing'){
  if(s.node?.cue==='rossi-collection')return shot('briefing-rossi-collection',[.85,4.9,5.8],[.28,4.61,1.43],portrait?32:27);
  if(s.node?.cue==='rossi-closeup')return shot('briefing-rossi-closeup',[.55,4.8,4.6],[.28,4.61,1.43],portrait?33:28);
  if(s.node?.cue==='age-reaction')return person('briefing-age-reaction',hero,{portrait,side:1,distance:3.3});
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
  const birth=mealBirthFrame(e,reduced),p=e<8?birth.position:mealPosition||birth.position;
  if(e<3)return shot('birth-charred-meal',[3.2,2.05,-.08],[3.545,1.46,1.43],portrait?35:28);
  if(e<4.8)return shot('birth-swelling-in-tray',[2.9,1.9,-.35],[3.545,1.52,1.43],portrait?38:31);
  if(e<8)return shot(reduced?'birth-escape-hold':'birth-escape-follow',reduced?[3.08,2.0,-.7]:[p[0]-.25,p[1]+.55,p[2]-1.8],[p[0],p[1]+.10,p[2]],portrait?60:42);
  const h=xaihiHead||[2.17,1.8,.85];return shot('birth-creature-and-witness',[(h[0]+p[0])/2+.1,2.65,-2.55],[(h[0]+p[0])/2,(h[1]+p[1]+.11)/2,(h[2]+p[2])/2],portrait?68:48);
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
