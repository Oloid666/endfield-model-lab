import * as T from 'three';
import {Resources} from './resources.js';
import {buildDragon} from './companion.js';
import {CLASS_MOTTO} from './bonus-data.js';
import {lessonFrame} from './bonus-presentation.js';

// A cutaway stage for the two upstairs rooms. It shares World's renderer and clock.
export function createBonusRoom(){
 const r=new Resources(),scene=new T.Scene();scene.background=new T.Color('#172b2b');
 const camera=new T.PerspectiveCamera(47,1,.05,40),classroom=new T.Group(),claims=new T.Group();scene.add(classroom,claims);
 scene.add(new T.HemisphereLight(0xfff1d2,0x314c48,2.6));const key=new T.DirectionalLight(0xffe5b8,2.1);key.position.set(-3,5,6);scene.add(key);
 const box=(parent,color,p,s)=>r.box(parent,color,p,s);
 const label=(parent,text,p,w=2,h=.3,color='#ecdfb7',bg='#203f38')=>r.mesh(r.geometry('PlaneGeometry',1,1),r.label(text,{width:1024,height:160,color,bg,font:'bold 64px sans-serif'}),parent,p,[w,h,1]);
 function shell(parent){
  box(parent,'#a99773',[0,-.07,0],[6,.14,5]);box(parent,'#596b5b',[0,1.6,-2.4],[6,3.2,.1]);box(parent,'#354d48',[-3,1.6,0],[.1,3.2,5]);box(parent,'#354d48',[3,1.6,0],[.1,3.2,5]);
  for(let x=-2.8;x<3;x+=.6)box(parent,'#776d58',[x,.005,0],[.018,.008,5]);
  box(parent,'#d1bc83',[0,3,-2.3],[5.8,.05,.05]);
  // Rainy blue window and clock make this feel like the floor above the street.
  box(parent,'#9ab8b5',[-2.94,1.8,.3],[.025,1.4,1.5]);for(const z of [-.45,.3,1.05])box(parent,'#283e39',[-2.91,1.8,z],[.045,1.5,.05]);
  const clock=r.mesh(r.geometry('CircleGeometry',.22,24),r.material('#eee6cd'),parent,[2.5,2.7,-2.32]);
  box(parent,'#273e35',[2.5,2.76,-2.30],[.025,.14,.02]);box(parent,'#273e35',[2.55,2.7,-2.30],[.12,.025,.02]);clock.name='class-clock';
 }
 shell(classroom);shell(claims);
 box(classroom,'#927b53',[0,1.91,-2.26],[4.8,1.94,.12]);
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=640;
 const texture=r.own(new T.CanvasTexture(canvas));texture.colorSpace=T.SRGBColorSpace;
 r.mesh(r.geometry('PlaneGeometry',1,1),r.own(new T.MeshBasicMaterial({map:texture})),classroom,[0,1.91,-2.185],[4.62,1.78,1]);
 box(classroom,'#baa779',[0,.91,-2.10],[4.9,.045,.13]);box(classroom,'#f5edcc',[.5,.95,-2.04],[.14,.025,.03]);
 for(const x of [-1.6,.3])for(const z of [.65,1.8]){
  box(classroom,'#a78b5e',[x,.72,z],[1.2,.09,.65]);for(const dx of [-.45,.45])box(classroom,'#35423a',[x+dx,.35,z],[.04,.7,.05]);
  box(classroom,'#8a7957',[x,.42,z+.6],[.65,.06,.5]);box(classroom,'#8a7957',[x,.72,z+.85],[.65,.55,.05]);
 }
 box(classroom,'#927c54',[1.8,.75,-.7],[1.1,.12,.65]);box(classroom,'#586047',[1.8,.36,-.7],[.75,.7,.45]);
 const dragon=buildDragon(r),dragonMount=new T.Group();dragonMount.add(dragon.root);classroom.add(dragonMount);dragonMount.position.set(1.6,.85,-.8);dragon.root.scale.setScalar(.8);dragon.root.rotation.y=-.2;
 // Glasses stay on the face, and the pointer follows the pointing arm.
 const body=dragon.root.children[0],rim=r.material('#2c3834',{metalness:.4});
 for(const x of [-.21,.21]){const ring=r.mesh(r.geometry('TorusGeometry',.15,.018,6,20),rim,body,[x,.69,.53]);ring.scale.y=.85;}
 box(body,'#2c3834',[0,.69,.55],[.13,.022,.02]);
 const pointer=new T.Group();pointer.position.set(-.53,.43,.12);body.add(pointer);const stick=box(pointer,'#b79f6c',[-.27,.4,0],[.027,.9,.027]);stick.rotation.z=.55;
 label(classroom,'左室 · 笑點解析小教室',[0,3.05,-2.18],3.5,.24);
 box(claims,'#8b7551',[0,.95,.1],[4.6,.15,1.1]);box(claims,'#3c6155',[0,.44,.2],[4.4,.88,.8]);
 label(claims,'武陵事故調查暨理賠中心',[0,2.7,-2.26],4.8,.44);
 label(claims,'案件已受理 ≠ 已核賠',[0,.55,.62],3,.3,'#f3deab','#3c6155');
 box(claims,'#b69b65',[-1.5,1.85,-2.26],[1.85,1.1,.08]);
 for(let i=0;i<3;i++){box(claims,'#e3dfcb',[-2.07+i*.57,1.85,-2.20],[.48,.8,.02]);label(claims,`0${i+1}`,[-2.07+i*.57,1.95,-2.18],.35,.16,'#33483d','#e3dfcb');}
 for(let i=0;i<4;i++)box(claims,'#e8dfc1',[-.9+i*.03,1.05,.2],[.65,.012,.8]);
 const stamp=new T.Group();claims.add(stamp);stamp.position.set(.55,1.04,.25);box(stamp,'#9a463c',[0,.03,0],[.35,.06,.25]);r.cylinder(stamp,'#6e4f39',[0,.18,0],.065,.26);r.mesh(r.geometry('SphereGeometry',.1,12,8),r.material('#6e4f39'),stamp,[0,.32,0]);
 box(claims,'#c5bfab',[1.5,1.19,-.2],[.8,.35,.6]);box(claims,'#263c36',[1.5,1.15,.105],[.62,.04,.02]);
 const output=box(claims,'#efe9d5',[1.5,1.04,.5],[.57,.015,.65]);
 const ink=label(claims,'已受理',[-.9,1.065,.2],.58,.22,'#a34b3b','#e8dfc1');ink.rotation.x=-Math.PI/2;ink.visible=false;
 const clerk=buildDragon(r),clerkMount=new T.Group();clerkMount.add(clerk.root);claims.add(clerkMount);clerkMount.position.set(0,1.1,-1.1);clerk.root.scale.setScalar(.85);
 let mode='classroom',focus='wide',boardKey='',paintKey='',boardAt=0,lastTime=null,stampAt=-Infinity,stampReduced=false,pose='explain';
 let boardData={title:'笑點解析小教室',lines:CLASS_MOTTO,life:1,reaction:false};
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function board(title='笑點解析小教室',lines=CLASS_MOTTO,life=1,time=0,reaction=false,key=''){
  const k=JSON.stringify([title,lines,life,reaction,key]);if(k===boardKey)return;boardKey=k;paintKey='';boardAt=time;boardData={title,lines,life,reaction};
 }
 function paint(time){
  const state=lessonFrame(time-boardAt,boardData.reaction,reduced()),k=`${boardKey}:${state.reveal}:${state.dead}`;
  if(k===paintKey)return;paintKey=k;
  const {title,lines,life}=boardData,c=canvas.getContext('2d');c.fillStyle='#21473b';c.fillRect(0,0,1536,640);
  c.strokeStyle='#c4d1ad55';c.lineWidth=2;c.strokeRect(28,26,1480,588);c.fillStyle='#f3e6ac';c.textAlign='left';c.font='bold 84px sans-serif';c.fillText(title,70,125,1380);
  const shown=boardData.reaction&&!state.dead?['笑點仍在搶救中。']:lines;
  c.font='66px sans-serif';shown.slice(0,state.reveal+1).forEach((line,i)=>{c.fillStyle=i===state.reveal?'#f3dfa0':'#d9e4c2';c.fillText(line,70,240+i*86,1380);});
  const alive=boardData.reaction?!state.dead:life>0;
  c.strokeStyle=alive?'#c5d6aa':'#d1ab8f';c.lineWidth=5;c.beginPath();c.moveTo(75,555);for(let x=75;x<1420;x+=10)c.lineTo(x,555+(x%160>100&&alive?Math.sin(x*.15)*27*Math.max(.2,life):0));c.stroke();
  c.font='30px sans-serif';c.fillStyle='#e1ddbb';c.fillText(alive?'笑點生命跡象 · 解析中':'死亡時間：講師說「也就是說」的那一刻',75,605);texture.needsUpdate=true;
 }
 const endPosition=new T.Vector3(),endTarget=new T.Vector3(),lookTarget=new T.Vector3();
 let frameKey='',firstFrame=true;
 function frame(width,height,time){
  const k=`${mode}:${focus}:${width}:${height}`;
  if(k!==frameKey){
   frameKey=k;camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix();const narrow=camera.aspect<1.2;
   let pos,target;
   if(mode==='claims') {pos=focus==='stamp'?[1.2,2.25,2.8]:[narrow?0:3,2.5,narrow?6.4:5.3];target=focus==='stamp'?[.1,1.05,.1]:[0,1.45,-.7];}
   else if(focus==='board'){pos=[0,1.95,narrow?3.6:2.6];target=[0,1.9,-2.1];}
   else if(focus==='teacher'){pos=[2.05,1.9,2.8];target=[1.5,1.5,-.75];}
   else if(focus==='reaction'){pos=[1.4,1.9,3.3];target=[1.6,1.4,-.8];}
   else {pos=[narrow?0:3.4,narrow?2.5:2.8,narrow?6.8:5.7];target=[0,1.5,-.9];}
   endPosition.fromArray(pos);endTarget.fromArray(target);
   if(firstFrame||reduced()){camera.position.copy(endPosition);lookTarget.copy(endTarget);firstFrame=false;}
  }
  const dt=lastTime===null?0:Math.max(0,time-lastTime),amount=reduced()?1:1-Math.exp(-dt*10);
  camera.position.lerp(endPosition,amount);lookTarget.lerp(endTarget,amount);camera.lookAt(lookTarget);
 }
 board();
 return {scene,camera,board,get state(){return {mode,focus,paperStamped:ink.visible};},resetPaper(){stampAt=-Infinity;ink.visible=false;stamp.position.y=1.04;output.position.z=.18;focus='wide';},
 setMode(value){if(mode!==value){mode=value;firstFrame=true;}classroom.visible=value==='classroom';claims.visible=value==='claims';focus='wide';frameKey='';},
 setFocus(value){focus=value;},perform(value){pose=value;},stamp(t,status){stampAt=t;stampReduced=reduced();focus='stamp';ink.visible=false;const c=ink.material.map.image.getContext('2d');c.fillStyle='#e8dfc1';c.fillRect(0,0,1024,160);c.fillStyle='#a34b3b';c.font='bold 110px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(status,512,80,1000);ink.material.map.needsUpdate=true;},
 render(renderer,time,width,height){
  frame(width,height,time);paint(time);
  const state=lessonFrame(time-boardAt,boardData.reaction,reduced()),interrupted=pose==='interrupted'||boardData.reaction&&state.pose==='interrupted',awkward=pose==='awkward'||boardData.reaction&&state.pose==='awkward';
  dragon.update(interrupted?boardAt:time,{gesture:interrupted||awkward?'look':'point',gestureAmount:interrupted||awkward?0:.8,curious:awkward?.8:0,lookYaw:0});
  dragonMount.position.y=.85+(interrupted?0:Math.sin(time*1.5)*.05);dragon.root.rotation.y=awkward?Math.atan2(camera.position.x-dragonMount.position.x,camera.position.z-dragonMount.position.z):-.2;
  pointer.rotation.z=interrupted?-.35:awkward?-1.1:Math.sin(time*.9)*.07;pointer.visible=pose!=='dismissed';
  clerk.update(time,{gesture:'nod',gestureAmount:.4});
  const age=time-stampAt;
  if(Number.isFinite(stampAt)&&age>=0){
   let lift=0;if(!stampReduced){if(age<.22)lift=age/.22*.3;else if(age<.4)lift=.3*(1-(age-.22)/.18);else if(age>.56&&age<.8)lift=Math.sin((age-.56)/.24*Math.PI)*.08;}
   stamp.position.y=1.04+lift;ink.visible=stampReduced||age>=.4;output.position.z=.18+.32*T.MathUtils.smoothstep(age,stampReduced?0:.65,stampReduced?.15:1.1);
  }
  renderer.setRenderTarget(null);renderer.render(scene,camera);lastTime=time;
 },dispose(){dragon.dispose();clerk.dispose();r.dispose();}};
}
