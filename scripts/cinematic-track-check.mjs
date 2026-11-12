import assert from 'node:assert/strict';
import * as T from 'three';
import {CinematicTrack} from '../src/cinematic-track.js';
import {cinematicStoryShot,revisedStoryShot} from '../src/story-shots.js';
import {sequences} from '../src/mission-dialogue.js';
let checks=0;const check=(label,ok)=>{assert.ok(ok,label);checks++;};
const base={feet:[-1.25,.32,3.25],heroHead:[-1.25,1.98,3.25],dragon:[-2,1.5,3.5],heading:2.91};
function context(width=390,height=844){return {...base,width,height,aspect:width/height,portrait:width/height<.85};}
function sample(track,phase,clock,extra={},c=context()){return cinematicStoryShot({phase,clock,phaseElapsed:clock,purchaseElapsed:null,...extra},c,track);}
function assertEnvelope(track,frame,min,max,c){
 const camera=new T.PerspectiveCamera(frame.fov,c.aspect,.04,100);camera.position.fromArray(frame.position);camera.lookAt(new T.Vector3(...frame.target));camera.updateMatrixWorld();
 for(let i=0;i<8;i++){const q=new T.Vector3(i&1?max[0]:min[0],i&2?max[1]:min[1],i&4?max[2]:min[2]).project(camera),a=track.area;check('Whole device envelope clears UI/crop',q.z>-1&&q.z<1&&q.x>=a.left-1e-5&&q.x<=a.right+1e-5&&q.y>=a.bottom-1e-5&&q.y<=a.top+1e-5);}
}
for(const c of [context(320,740),context(),context(440,390),context(874,768)]){
 const track=new CinematicTrack();
 const f=sample(track,'login',10,{},c);check('Input fit succeeds',f.fitValid);assertEnvelope(track,f,[-3.75,.3,4.05],[.45,2.55,6.85],c);
 const held=JSON.stringify(f),count=track.fitCount;
 for(const phase of ['login','verify-talk','captcha','verified-talk','lever']){
  const q=sample(track,phase,12,{connection:{field:'password',lever:.8},dragon:[3,3,3]},c);check('Keys/field/lever never reframe input',JSON.stringify(q)===held&&track.fitCount===count);
 }
 sample(track,'login',12,{},context(c.width+20,c.height));check('Resize refits exactly once',track.fitCount===count+1);
 for(const phase of ['photo','cargo','hack','meal-spawn','tour','complete'])check('Protected sequences keep their camera system',sample(track,phase,phase==='complete'?4.1:4,{},c)===null);
 const first=sequences.intro.find(n=>n.cue==='opening-establish'),soup=sequences.intro.find(n=>n.cue==='opening-soup');check('Cues belong to actual retained dialogue',first?.id==='intro_2'&&soup?.id==='intro_5');
 sample(track,'intro',0,{node:first,nodeElapsed:0},c);check('Opening establishes the street',track.id==='cinematic-opening-establish');
 for(let t=1.2;t<=3.5;t+=.1){const q=sample(track,'intro',t,{node:first,nodeElapsed:t},c);check('Opening push stays outside frontage',q.position[2]>2.65&&q.position[1]>.2);}
 sample(track,'intro',4,{node:soup,nodeElapsed:0},c);check('Soup reminder has its own OTS',track.id==='cinematic-opening-shoulder');
 for(let t=0;t<=5;t+=.05){const q=sample(track,'ascent',10+t,{phaseElapsed:t,heroHead:[-1.25,1.98+t*.2,3.25]},c);check('Ascent stays on street side',q.position[2]>2.65&&q.position[1]>.2);}
 track.reset();const final={...c,feet:[-1.25,4.32,15.25],heroHead:[-1.25,5.95,15.25],grip:[-1.3,5.35,15.5],server:[0,1.21,1.06]};
 for(const t of [17,19,24]){const q=sample(track,'aim-final',t,{},final);check('Aim is a steady same-side shoulder shot',q.beat==='cinematic-final-shoulder'&&q.fitValid);}
 for(const [t,beat] of [[0,'face'],[2,'face'],[2.74,'face'],[2.75,'flight'],[4.349,'flight'],[4.35,'impact'],[4.89,'impact'],[5.5,'impact']]){
  const q=sample(track,'finisher',20+t,{phaseElapsed:t},final);check('Actual release/impact timing stays readable',q.beat==='cinematic-finisher-'+beat&&q.fitValid);
  const offset=new T.Vector3(...q.position).sub(track.axisOrigin);check('All new shot eyes remain on the same firing-axis side',offset.dot(track.axisRight)*track.axisSide>=0);
  check('Finisher is outside roof and walls',q.position[2]>2.65||Math.abs(q.position[0])>5.2||q.position[1]>7.2);
 }
 const a=sample(track,'finisher',24.89,{phaseElapsed:4.89},final),before=JSON.stringify(a.position);sample(track,'finisher',24.9,{phaseElapsed:4.9},final);check('Camera settles before impact',JSON.stringify(track.frame.position)===before);
}
// Actual landscape uses a right-side DOM panel over the same full-width renderer.
const landscape=context(844,390),panel={left:450,right:830,top:99,bottom:376,width:380,height:277};
globalThis.document={querySelectorAll:()=>[{getClientRects:()=>[panel],getBoundingClientRect:()=>panel}]};
const sidebar=new CinematicTrack();sample(sidebar,'terminal-quip',0,{},landscape);const previews=sidebar.fitCount;const sidebarFrame=sample(sidebar,'login',1,{},landscape);check('First real keyboard gate refits after preview dialogue',sidebar.fitCount===previews+1);check('Landscape keyboard reserves a left viewing region',sidebar.area.right<.05);assertEnvelope(sidebar,sidebarFrame,[-3.75,.3,4.05],[.45,2.55,6.85],landscape);const firing=new CinematicTrack(),firingContext={...landscape,feet:[-1.25,4.32,15.25],heroHead:[-1.25,5.95,15.25],grip:[-1.3,5.35,15.5],server:[0,1.21,1.06]};
const firingFrame=sample(firing,'aim-final',17,{},firingContext);check('HUD framing must preserve the final firing-axis side',new T.Vector3(...firingFrame.position).sub(firing.axisOrigin).dot(firing.axisRight)*firing.axisSide>0);// The preparation shot now shows the face and grip; the target returns in the flight/impact shots.
assertEnvelope(firing,firingFrame,[-1.75,5.0,14.85],[-.8,6.3,15.9],firingContext);
delete globalThis.document;
for(const phase of ['intro','terminal-deploy','ascent']){
 const run=hz=>{const track=new CinematicTrack();for(let n=0;n<=hz*3;n++)sample(track,phase,n/hz,{node:sequences.intro[1],nodeElapsed:n/hz});return {position:[...track.frame.position],target:[...track.frame.target],fov:track.frame.fov};};
 const a=run(30),b=run(60);check('Equal mission time gives equal pose at 30/60 Hz',JSON.stringify(a)===JSON.stringify(b));
}
// End of the return track must fit both faces in a narrow portrait frame.
for(const c of [context(320,740),context()]){
 const track=new CinematicTrack(),d=[-2.55,1.5,3.5],f=sample(track,'walk-out',4.9,{shopping:{segment:2}}, {...c,dragon:d});
 const camera=new T.PerspectiveCamera(f.fov,c.aspect,.04,100);camera.position.fromArray(f.position);camera.lookAt(new T.Vector3(...f.target));camera.updateMatrixWorld();
 for(const anchor of [c.heroHead,[d[0],d[1]+.32,d[2]]]){const q=new T.Vector3(...anchor).project(camera);check('Both returning faces remain inside portrait',Math.abs(q.x)<.85&&Math.abs(q.y)<.8&&q.z<1);}
}
const tr=new CinematicTrack(),c=context();let f=sample(tr,'intro',0,{node:sequences.intro[1]},c);f=sample(tr,'intro',1,{node:sequences.intro[1]},c);const hold=JSON.stringify(f);for(let n=0;n<60;n++)sample(tr,'intro',1,{node:sequences.intro[1]},c);check('Paused clock holds track exactly',JSON.stringify(tr.frame)===hold);
tr.reset();sample(tr,'intro',0,{node:sequences.intro[1]},c);check('Restart clears old track time and axis',tr.started===0&&!tr.axisReady);
for(const time of [0,3])sample(tr,'intro',time,{node:sequences.intro[1]}, {...c,reduced:true});check('Reduced motion disables push',tr.frame.progress===0);
check('Existing Rossi semantic cue is retained',revisedStoryShot({phase:'briefing',node:{cue:'rossi-closeup'}},c).beat==='briefing-rossi-closeup');
console.log(`Cinematic track: ${checks} checks passed.`);
