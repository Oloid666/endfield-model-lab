import {DIRECTOR_BEAT} from './opening-handoff.js';
import {LANDING_SETTLE_DURATION,DINNER_CLOSING,FAKE_END_DURATION} from './ending-title.js';
import {RESCUE_READY,RESCUE_WAITING} from './tray-rescue.js';
import {faceFrame} from './cinematic-track.js';
import {mealBirthFrame,BIRTH_TIMES} from './meal-birth.js';
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
// Focused story sequences share the deterministic track; other authored shots remain intact.
export function cinematicStoryShot(s,context,track){
 if(!s||s.postgame)return null;
 const c=Object.assign(track.context,context);c.aspect=context.aspect||(c.portrait?390/844:844/390);c.width=context.width||(c.portrait?390:844);c.height=context.height||(c.portrait?844:390);
 const feet=c.feet||[-1.25,.32,3.25],clock=s.clock||0,e=s.phaseElapsed||0,origin=clock-e,nodeOrigin=clock-(s.nodeElapsed||0),f=track.frame;
 const h=track.head,d=track.pet,mid=track.mid;
 if(c.heroHead)h.fromArray(c.heroHead);else h.set(feet[0],feet[1]+1.48,feet[2]);
 d.fromArray(c.dragon||[-2,1.5,3.5]);d.y+=.32;mid.copy(h).lerp(d,.5);
 // Land first; anchor the camera to the actual head rather than flying across a foot-based preset.
 if(s.phase==='landing'&&(e<LANDING_SETTLE_DURATION||s.node?.event==='explosion-after')){
  const settling=e<LANDING_SETTLE_DURATION,age=s.nodeElapsed||0,distance=settling?3.2:2.2-(c.reduced?0:.08*smooth(age/1.2)),yaw=c.heading||0,side=settling?.9:.7;
  track.enter(settling?'landing-settle-side':'landing-satisfied-face',s,c,settling?origin:nodeOrigin);
  track.p.set(h.x+Math.sin(yaw)*distance+Math.cos(yaw)*side,h.y+(settling?.12:.08),h.z+Math.cos(yaw)*distance-Math.sin(yaw)*side);
  track.t.copy(h);track.t.y-=settling?.6:.12;
  return track.pose(track.p,track.t,c.portrait?(settling?46:40):(settling?38:32));
 }
 if(s.phase==='tour'&&e>=DINNER_CLOSING.start||s.phase==='complete'&&e<FAKE_END_DURATION){
  const p=c.tray||[feet[0],feet[1]+1.1,feet[2]+.65],yaw=c.heading||0,age=s.phase==='tour'?e-DINNER_CLOSING.start:DINNER_CLOSING.end-DINNER_CLOSING.start;
  const push=c.reduced?0:.12*smooth(Math.min(age,DINNER_CLOSING.title-DINNER_CLOSING.start)/2.3);
  track.offset.set(.85,.44,1.45-push).applyAxisAngle(TUP,yaw);track.p.fromArray(p).add(track.offset);track.t.fromArray(p);track.t.y+=.06;
  track.enter('dinner-closing',s,c,origin);return track.pose(track.p,track.t,c.portrait?38:30);
 }
 if(s.phase==='director-reminder'){
  const lens=c.filmCamera?.position||[d.x+.75,d.y+.08,d.z+1.5];
  if(e<DIRECTOR_BEAT.reply){
   const wide=e<.6;track.enter(wide?'director-camera-establish':'director-dragon-front',s,c,origin);
   track.p.set(d.x+(wide?1.7:.20),d.y+(wide?.45:.2),d.z+(wide?3.8:3.2));track.t.copy(d);track.t.y-=wide?.12:.12;
   return track.pose(track.p,track.t,c.portrait?(wide?45:38):(wide?38:32));
  }
  if(e<DIRECTOR_BEAT.lens){
   if(track.enter('director-camera-recording',s,c,origin+DIRECTOR_BEAT.reply)){track.p.set(lens[0]+1.1,lens[1]+.3,lens[2]-.55);track.t.fromArray(lens);track.fitBox([lens[0]-.4,lens[1]-.3,lens[2]-.4],[lens[0]+.4,lens[1]+.3,lens[2]+.4],track.p,track.t,c.portrait?38:32,c);}
   return track.pose(track.fixedP,track.fixedT,c.portrait?38:32);
  }
  track.enter('director-dragon-thanks',s,c,origin+DIRECTOR_BEAT.lens);
  track.p.set(d.x+.2,d.y+.2,d.z+3.2);track.t.copy(d);track.t.y-=.12;return track.pose(track.p,track.t,c.portrait?38:32);
 }
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
 if(s.phase==='photo-pose'||s.phase==='meal-reclaim'&&e>=1.35){
  const p=c.tray||[feet[0],feet[1]+1.1,feet[2]+.65],yaw=c.heading||0,offset=track.offset.set(1.05,.30,1.55);offset.applyAxisAngle(TUP,yaw);track.p.fromArray(p).add(offset);track.t.fromArray(p);track.t.y+=.06;track.enter('cinematic-dinner-hero',s,c,origin);return track.pose(track.p,track.t,c.portrait?38:30);
 }
 if(s.phase==='walk-out'){
  if(s.shopping?.handoff){
   const p=c.tray||[feet[0],feet[1]+1.1,feet[2]+.65];
   if(track.enter('cinematic-meal-handoff',s,c,origin+e-s.shopping.handoffElapsed)){
    track.t.copy(h).add(d).multiplyScalar(.5);track.t.y=Math.max(p[1]+.12,track.t.y-.20);
    track.p.copy(track.t).add(track.offset.set(1,.35,3.7));
    track.fitBox([Math.min(h.x-.30,d.x-.35),Math.min(feet[1]+.8,d.y-.35),Math.min(h.z-.35,d.z-.35)],[Math.max(h.x+.30,d.x+.35),Math.max(h.y+.25,d.y+.5),Math.max(h.z+.4,d.z+.55,p[2]+.4)],track.p,track.t,c.portrait?45:35,c);
   }
   return track.fixed(clock,1.5,.35,c.portrait?45:35,c.reduced);
  }
  const outside=(s.shopping?.segment||0)>=2;
  track.enter(outside?'cinematic-return-pair':'cinematic-return-door',s,c,origin);
  if(!outside)return track.pose([-.22,2.45,5.6],d,c.portrait?58:46);
  const u=clamp((d.x+.22)/(-2.55+.22));track.frame.progress=u;
  if(c.reduced)track.p.set(-.6,2.5,c.portrait?10.4:6.8);else{track.returnCurve.getPointAt(u,track.p);if(c.portrait)track.p.z+=3.6;}
  track.t.copy(d).lerp(mid,smooth((u-.65)/.35));return track.pose(track.p,track.t,c.portrait?50:40);
 }
 if(s.phase==='photo-check'||s.phase==='photo-review'){
  const shoulder=s.phase==='photo-review'||e>=2;
  if(track.enter(shoulder?'cinematic-photo-review-shoulder':'cinematic-photo-review-pair',s,c,shoulder?origin+2:origin)){
   if(shoulder){track.p.set(-1.65,2.1,2.65);track.t.set(-1.72,1.73,3.98);track.fixedP.copy(track.p);track.fixedT.copy(track.t);}
   else{
    track.p.copy(mid).add(PAIR_OFFSET);track.t.copy(mid);track.t.y-=.25;
    track.fitBox([Math.min(h.x-.45,d.x-.45),1.3,3.05],[Math.max(h.x+.45,d.x+.45),Math.max(h.y,d.y)+.3,4.2],track.p,track.t,c.portrait?48:38,c);
   }
  }
  return track.fixed(clock,1.5,shoulder?.06:.12,c.portrait?(shoulder?54:48):(shoulder?43:38),c.reduced);
 }
 if(s.node?.event==='server-survives'){
  const p=c.server||[0,1.21,1.06],detail=(s.nodeElapsed||0)>=1.2;
  if(track.enter(detail?'cinematic-surviving-server-detail':'cinematic-surviving-server-reveal',s,c,nodeOrigin+(detail?1.2:0))){
   track.p.set(p[0]+(detail?1.5:6),p[1]+(detail?.65:5.5),p[2]+(detail?3.5:12));track.t.set(p[0],p[1]+.45,p[2]);
   track.fixedP.copy(track.p);track.fixedT.copy(track.t);
  }
  return track.fixed(clock,1.5,detail?-.25:.18,c.portrait?(detail?40:54):(detail?32:44),c.reduced);
 }
 if(s.phase==='meal-handoff'||s.phase==='meal-reclaim'){
  track.enter('cinematic-'+s.phase,s,c,origin);
  const p=c.tray||[-1.25,1.42,3.9];return track.pose([p[0]+1.65,p[1]+.38,p[2]+2.4],[p[0],p[1]+.12,p[2]],c.portrait?43:35);
 }
 if(s.phase==='aim-final'&&e>=1.5&&e<2.2&&!c.rescue){
  const b=RESCUE_WAITING;track.enter('cinematic-rescue-notice',s,c,origin);return track.pose([b[0]+1.4,b[1]+.62,b[2]+2.7],[b[0],b[1]+.3,b[2]],c.portrait?48:38);
 }
 if(s.phase==='aim-final'&&e>=1.5&&e<RESCUE_READY&&c.rescue){
  const r=c.rescue,p=r.tray,b=r.base;let beat='rescue-'+r.beat,eye,target,fov,min,max;
  if(e<4.5){eye=[b[0]+1.4,b[1]+.62,b[2]+2.7];target=[b[0],b[1]+.3,b[2]];fov=c.portrait?48:38;min=[b[0]-.5,b[1],b[2]-.4];max=[b[0]+.5,b[1]+.70,b[2]+.4];}
  else if(e<5.5){const y=(b[1]+h.y)*.5;eye=[p[0]+3.4,y+.35,p[2]+6];target=[p[0],y,p[2]];fov=c.portrait?57:47;min=[p[0]-.6,b[1],p[2]-.5];max=[Math.max(p[0]+.8,h.x+.5),h.y+.35,p[2]+.5];}
  else if(e<7){track.enter('rescue-fall-follow',s,c,origin);return track.pose([p[0]+1.4,p[1]+.5,p[2]+3.4],[p[0],p[1],p[2]],c.portrait?46:36);}
  else if(e<10.1){eye=[p[0]+1.1,b[1]+1.1,p[2]+2.7];target=[p[0]+.08,b[1]+.43,p[2]];fov=c.portrait?42:33;min=[p[0]-.46,b[1],p[2]-.35];max=[p[0]+.65,p[1]+.35,p[2]+.4];}
  else {track.enter('rescue-back-to-held',s,c,origin);track.p.copy(h).add(RISE_END);track.t.copy(h);track.t.y-=.40;return track.pose(track.p,track.t,c.portrait?54:44);}
  if(track.enter(beat,s,c,origin)){track.rescueOrigin=[...b];track.p.fromArray(eye);track.t.fromArray(target);track.fitBox(min,max,track.p,track.t,fov,c,'wide');}
  if(e<4.5){track.offset.set(b[0]-track.rescueOrigin[0],b[1]-track.rescueOrigin[1],b[2]-track.rescueOrigin[2]);track.p.copy(track.fixedP).add(track.offset);track.t.copy(track.fixedT).add(track.offset);return track.pose(track.p,track.t,fov);}
  return track.pose(track.fixedP,track.fixedT,fov);
 }
 if(s.phase==='charge'){
  const segment=e<5?'array':e<10?'hero':e<14?'pylon':e<22?'hero-close':'ready';track.enter('cinematic-charge-'+segment,s,c,origin);
  if(segment==='array')return track.pose([14,16,34],[0,5,-6],c.portrait?76:55);
  if(segment==='pylon')return track.pose([12,11,-3],[6.7,8,-15.3],c.portrait?58:46);
  if(segment==='ready')return track.pose([2,8.5,27],[0,3,1.6],c.portrait?57:44);
  const near=segment==='hero-close',distance=near?3.2:5.3,heading=c.heading??2.91;
  track.p.set(h.x+Math.sin(heading)*distance+Math.cos(heading)*.9,h.y-(near?-.15:.60),Math.max(3.3,h.z+Math.cos(heading)*distance-Math.sin(heading)*.9));track.t.copy(h);track.t.y-=near?.12:.45;
  return track.pose(track.p,track.t,c.portrait?(near?44:52):(near?36:44));
 }
 if(s.phase==='terminal-deploy'){
  if(e<1.0){track.enter('cinematic-book-summon',s,c,origin);return track.pose([.1,2.7,7.8],[-1.25,1.4,4.1],c.portrait?57:46);}
  if(e>=4.8){track.enter('cinematic-book-login',s,c,origin);return track.pose([-1.65,3.6,7.0],[-1.65,.94,5.45],c.portrait?62:44);}
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
 const aiming=s.phase==='aim-final'&&e>=RESCUE_READY,finishing=s.phase==='finisher'&&e<6.2;
 if(aiming||finishing){
  const server=c.server||[0,1.21,1.06];track.captureAxis(feet,h.toArray(track.headArray||(track.headArray=[0,0,0])),server,c.heading??2.91);
  if(aiming){
   if(track.enter('cinematic-final-shoulder',s,c,origin+RESCUE_READY)){
    const face=faceFrame(feet,c.heading??2.91,3.2,1.6,1.9,1.3);track.p.fromArray(face.position);track.t.copy(h).lerp(track.offset.fromArray(c.grip||h.toArray()),.55);track.t.y-=.08;
    const g=c.grip||h.toArray();track.fitBox([Math.min(h.x,g[0])-.45,Math.min(h.y,g[1])-.35,Math.min(h.z,g[2])-.4],[Math.max(h.x,g[0])+.45,Math.max(h.y,g[1])+.35,Math.max(h.z,g[2])+.4],track.p,track.t,c.portrait?58:46,c,'wide',true);
   }
   return track.pose(track.fixedP,track.fixedT,c.portrait?58:46);
  }
  if(e<2.75){
   if(track.enter('cinematic-finisher-face',s,c,origin)){
    const face=faceFrame(feet,c.heading??2.91,2.0,.75,1.9,1.48);track.p.fromArray(face.position);track.t.set(h.x,h.y-.08,h.z);
    track.fitBox([h.x-.35,h.y-.40,h.z-.3],[h.x+.35,h.y+.35,h.z+.3],track.p,track.t,c.portrait?40:32,c);
   }
   return track.fixed(clock,1.2,.08,c.portrait?40:32,c.reduced);
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

export function revisedStoryShot(s,{feet=[-1.25,.32,3.25],heroHead=null,dragon=[-2,1.5,3.5],portrait=false,reduced=false,heading=2.91,wirePoint=null,wireHoldPoint=null,powerSource=[7.44,3.08,-15.3],server=null,xaihiHead=null,mealPosition=null}={}){
 if(!s||s.postgame)return null;
 const e=s.phaseElapsed||0,age=s.nodeElapsed||0,index=Number((s.nodeId||'').split('_').at(-1))||0;
 const hero=heroHead?[heroHead[0],heroHead[1]+.04,heroHead[2]]:[feet[0],feet[1]+1.48,feet[2]],pet=[dragon[0],dragon[1]+.32,dragon[2]];
 const push=reduced?0:smooth(age/3)*.12;
 if(s.phase==='rewind')return shot('rewind-exterior-lock',[22,8,34],[0,3.1,.8],portrait?28:22);
 if(s.node?.event==='phone-away'){
  if(age<.7)return shot('sigh-phone-away',[pet[0]+1.8,pet[1]+.6,pet[2]+4.4],[pet[0]+.35,pet[1]-.12,pet[2]],portrait?48:38);
  return person('sigh-quiet-reaction',pet,{portrait,side:1,distance:2.4,push});
 }
 if(s.node?.event==='backfire-complaint')return person('dialogue-backfire-reaction',pet,{portrait,side:-1,distance:2.7,push});

 if(s.phase==='briefing'){
  if(s.node?.cue==='rossi-collection')return shot('briefing-rossi-collection',[.85,4.9,5.8],[.28,4.61,1.43],portrait?32:27);
  if(s.node?.cue==='rossi-closeup')return shot('briefing-rossi-closeup',[.55,5.55,4.6],[.28,4.66,1.43],portrait?33:28);
  if(s.node?.cue==='age-reaction')return person('briefing-age-reaction',hero,{portrait,side:1,distance:3.3});
  if(index<2)return shot('briefing-evidence',[.45,4.84,5.7],[.28,4.57,1.43],portrait?36:30);
  if(index===2)return caster('briefing-wants-her-book',feet,0,portrait,heroHead);
  if(index===3)return shot('briefing-book-evidence',[1.25,5.0,4.5],[-1.05,4.15,.7],portrait?36:30);
  if(index===4)return person('briefing-no-taste',hero,{portrait,side:1,distance:3.5});
  if(index<=6)return person('briefing-zhuang-reaction',hero,{portrait,side:-1,distance:1.85});
  if(index<=8)return shot('briefing-suspect-evidence',[.5,4.8,4.7],[.28,4.58,1.43],portrait?36:30);
  if(index===9)return person('briefing-find-a-charge',hero,{portrait,side:1,distance:3.3});
  if(index<=12)return shot('briefing-pear-evidence',[9.7,4.7,6.1],[7.65,3.1,-.3],portrait?45:37);
  if(index<=15)return person('briefing-incident-time',hero,{portrait,side:1,distance:3.8});
  if(index<=19)return shot('briefing-built-to-demolish',[22+(reduced?0:smooth(age/6)*2),8,34],[0,3.1,.8],portrait?28:22);
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
  if(s.node?.event==='meal-refusal'){const h=xaihiHead||[1.8,1.8,.85];return shot('birth-xaihi-refusal',[h[0]+1.22,h[1]+.08,h[2]-1.12],[h[0]+.04,h[1]-.10,h[2]-.04],portrait?32:30);}
  const birth=mealBirthFrame(e,reduced),p=e<BIRTH_TIMES.ready?birth.position:mealPosition||birth.position;
  if(e<BIRTH_TIMES.swell)return shot('birth-charred-meal',[3.2,2.05,-.08],[3.545,1.46,1.43],portrait?35:28);
  if(e<BIRTH_TIMES.escape)return shot('birth-swelling-in-tray',[2.9,1.9,-.35],[3.545,1.52,1.43],portrait?38:31);
  if(e<BIRTH_TIMES.ready)return shot(reduced?'birth-escape-hold':'birth-escape-follow',reduced?[3.65,2.0,-.7]:[3.65,p[1]+.55,p[2]-1.45],[p[0],p[1]+.10,p[2]],portrait?60:42);
  const h=xaihiHead||[2.17,1.8,.85];return shot('birth-creature-and-witness',[(h[0]+p[0])/2+.1,2.65,-2.55],[(h[0]+p[0])/2,(h[1]+p[1]+.11)/2,(h[2]+p[2])/2],portrait?68:48);
 }
 if(s.phase!=='hack'||!s.tablet)return null;
 const t=s.tablet,stage=t.stage;
 if(stage==='cable'){
  const a=t.age||0,p=wirePoint||powerSource;
  if(a<.4)return shot('grid-control-confirm',[7.7,2.1,-10.3],[7.4,1.85,-13.189],portrait?45:36);
  if(a<1.6)return shot('wire-source-hold',[powerSource[0]+3.1,powerSource[1]+1.5,powerSource[2]+3.2],[powerSource[0],powerSource[1]-.65,powerSource[2]],portrait?54:46);
  if(a>=4.9)return shot('wire-microwave-arrival',[2.6,2.7,-1.3],[3.8,1.35,1.2],portrait?72:54);
  if(reduced){const h=wireHoldPoint||p;return shot('wire-route-hold-'+(a<2.7?0:a<3.9?1:2),[h[0]+1,h[1]+3.5,h[2]-4.5],h,portrait?84:66);}
  return a<4.9?shot('wire-route-follow',[p[0]+1.0,p[1]+1.4,p[2]-1.8],[p[0],p[1]+.12,p[2]],portrait?60:48):shot('wire-microwave-arrival',[2.6,2.7,-1.3],[3.8,1.35,1.2],portrait?72:54);
 }
 const temperature=()=>shot(stage==='defrost'?'fridge-temperature-reversal':'fridge-temperature-detail',[2.03,2.05,-.15],[1.79,1.92,-1.89],portrait?31:25);
 if(stage==='cooling'||stage==='defrost')return temperature();
 const face=xaihiHead||[1.2,1.75,-1.35],reaction=beat=>shot(beat,[face[0]+1.35,face[1]+.14,face[2]+.05],[face[0],face[1]-.20,face[2]],portrait?45:39);
 if(stage==='success')return t.dialogue?.speaker==='xaihi'?reaction('fridge-hopeful-profile'):temperature();
 if(stage==='hot'){
  if(t.dialogue?.speaker==='xaihi')return reaction('fridge-xaihi-reaction');
  if(t.dialogue?.speaker==='dragon')return shot(t.dialogue.cue==='song'?'fridge-dragon-song':'fridge-dragon-reaction',[-.55,1.95,-1.2],[1.7,1.48,-.65],portrait?50:40);
  return temperature();
 }
 return null;
}
