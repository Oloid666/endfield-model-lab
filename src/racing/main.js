// Gameplay reference: 部長と峠 https://oichikonnyaku.com/touge/
// Original prototype implementation; no reference-game source/assets used.
import * as T from 'three';
import {Resources} from '../resources.js';
import {buildDragon} from '../companion.js';
import {buildStore} from '../store.js';
import {createRace,center,height,slope,WIDTH,LENGTH} from './physics.js';
import './style.css';

const $=id=>document.getElementById(id),race=createRace(),state=race.state,r=new Resources();
const scene=new T.Scene();scene.background=new T.Color('#768b97');scene.fog=new T.Fog('#768b97',60,185);
let renderer;
try{renderer=new T.WebGLRenderer({canvas:$('game'),antialias:true,powerPreference:'high-performance'});}catch(error){$('intro').innerHTML='<h2>無法啟動3D畫面</h2><p>請確認瀏覽器支援 WebGL，或改用其他瀏覽器重試。</p>';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
scene.add(new T.HemisphereLight('#d9f0ff','#424a3a',2.1));const sun=new T.DirectionalLight('#ffe3b1',2.7);sun.position.set(-30,70,20);scene.add(sun);
const camera=new T.PerspectiveCamera(61,1,.1,230),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const store=buildStore(scene,r);store.root.position.set(-18,height(15),-15);store.root.rotation.y=.45;
// Road follows one height field. Both bodies use their own sampled ground height.
function ribbon(offset,width,mat){const verts=[],indices=[];for(let i=0;i<=320;i++){const s=-35+i*2;for(const side of [-1,1])verts.push(center(s)+offset+side*width/2,height(s),-s);if(i<320){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}}const g=r.own(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();return r.mesh(g,mat,scene);}
ribbon(0,WIDTH*2,r.material('#35474b'));for(const side of [-1,1])ribbon(side*(WIDTH-.18),.14,r.material('#e5dfc0',{emissive:'#343728'}));
for(let s=-30;s<LENGTH+30;s+=7){r.box(scene,'#d7b76b',[center(s),height(s)+.012,-s],[.14,.025,3]);for(const side of [-1,1]){r.box(scene,'#819c9d',[center(s)+side*(WIDTH+.2),height(s)+.65,-s],[.18,1.3,.18]);const rail=r.box(scene,'#c7ccc0',[center(s)+side*(WIDTH+.2),height(s)+.85,-s],[.18,.23,7.1]);rail.rotation.y=-Math.atan(slope(s));}}
// A small city silhouette and pale material stacks; detail deliberately limited for this test.
for(let i=0;i<60;i++){const s=i*10-15,side=i%2?1:-1,x=center(s)+side*(14+(i%4)*3),h=3+i%7*1.7;
 const m=r.box(scene,i%3?'#687e80':'#c7c9ac',[x,height(s)+h/2-1,-s],[4,h,5]);m.rotation.y=i*.19;
 if(i%3===0){for(let j=0;j<3;j++)r.box(scene,'#e0dcc1',[x+Math.sin(j)*1.5,height(s)+j*1.1,-s+2],[2.5,1,2.2]);}
 else{r.box(scene,'#dccf8c',[x,height(s)+h*.65,-s+2.51],[2.5,.35,.025],{emissive:'#a39353',emissiveIntensity:.6});}}
const ground=r.box(scene,'#526a60',[0,-12,-290],[400,2,850]);
const finish=new T.Group();finish.position.set(center(LENGTH),height(LENGTH),-LENGTH);scene.add(finish);for(const side of [-1,1])r.box(finish,'#839a91',[side*6,3,0],[.4,6,.4]);r.mesh(r.geometry('PlaneGeometry',11,1.6),r.label('終點・龍泡泡還在嗎？',{font:'bold 60px sans-serif'}),finish,[0,5,0]);
const player=new T.Group();scene.add(player);
const geo=r.own(new T.SphereGeometry(1,24,12)),rest=geo.attributes.position.array.slice();
const skin=r.material('#9461b8',{roughness:.35,metalness:.12});const blob=r.mesh(geo,skin,player,[0,.16,0]);
for(let i=0;i<geo.attributes.position.count;i++){const j=i*3,x=rest[j],y=rest[j+1],z=rest[j+2],l=1+.17*Math.sin(x*7+z*4);geo.attributes.position.setXYZ(i,x*.55*l,(y+1)*.2,z*.8*l);}geo.computeVertexNormals();
const dragon=buildDragon(r);scene.add(dragon.root);dragon.root.scale.setScalar(1.25);
const harness=r.mesh(r.geometry('TorusGeometry',.57,.045,6,28),r.material('#c6a75d'),dragon.root,[0,.6,0]);harness.rotation.x=Math.PI/2;
const ropeGeo=r.own(new T.BufferGeometry());ropeGeo.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(51),3));const rope=new T.Line(ropeGeo,r.own(new T.LineBasicMaterial({color:'#f5cd72'})));scene.add(rope);
const boxes=state.boxes.map(b=>r.box(scene,'#bfa77d',[b.x,height(b.s)+.6,-b.s],[1.2,1.2,1.2]));
const sparksGeo=r.own(new T.BufferGeometry()),sparksArray=new Float32Array(36*3);sparksGeo.setAttribute('position',new T.BufferAttribute(sparksArray,3));const sparks=new T.Points(sparksGeo,r.own(new T.PointsMaterial({color:'#ffe4a0',size:.15})));scene.add(sparks);
const keys=new Set(),touch={steer:0,brake:false,drift:false},target=new T.Vector3(),look=new T.Vector3();let paused=false,acc=0,last=performance.now(),lastImpact=0,shake=0,visualTime=0,started=false;
function clearInput(){keys.clear();touch.steer=0;touch.brake=touch.drift=false;$('steer').style.setProperty('--steer','0');$('steer').querySelector('i').style.transform='';$('steer').setAttribute('aria-valuenow','0');for(const id of ['brake','drift'])$(id).classList.remove('active');}
function setPause(value){if(!started||state.finished)return;paused=value;clearInput();acc=0;$('pause').textContent=value?'繼續':'暫停';}
function input(){return {steer:Math.max(-1,Math.min(1,touch.steer+(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0))),brake:touch.brake||keys.has('ArrowDown')||keys.has('KeyS'),drift:touch.drift||keys.has('Space'),boost:keys.has('ArrowUp')||keys.has('KeyW')};}
function start(){race.reset();started=true;paused=false;state.running=true;acc=0;lastImpact=0;clearInput();$('intro').hidden=true;$('result').hidden=true;$('impact').textContent='';$('pause').disabled=false;$('pause').textContent='暫停';pose(1,true);}
$('start').onclick=start;$('again').onclick=start;$('reset').onclick=()=>{if(started)start();};$('pause').onclick=()=>setPause(!paused);
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD'].includes(e.code)){e.preventDefault();if(started&&!paused&&!state.finished)keys.add(e.code);}if(e.code==='Escape')setPause(!paused);});addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>setPause(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)setPause(true);});
let steerPointer=null;
function steerMove(e){const b=$('steer').getBoundingClientRect();touch.steer=Math.max(-1,Math.min(1,(e.clientX-b.left-b.width/2)/(b.width*.36)));$('steer').querySelector('i').style.transform=`translateX(${touch.steer*b.width*.32}px)`;$('steer').setAttribute('aria-valuenow',Math.round(touch.steer*100));}
$('steer').onpointerdown=e=>{if(!state.running||paused)return;steerPointer=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);steerMove(e);};$('steer').onpointermove=e=>{if(e.pointerId===steerPointer)steerMove(e);};
function releaseSteer(){steerPointer=null;touch.steer=0;$('steer').querySelector('i').style.transform='';$('steer').setAttribute('aria-valuenow','0');}
for(const type of ['pointerup','pointercancel','lostpointercapture'])$('steer').addEventListener(type,releaseSteer);
for(const id of ['brake','drift']){const el=$(id);el.onpointerdown=e=>{if(!state.running||paused)return;el.setPointerCapture(e.pointerId);touch[id]=true;el.classList.add('active');};for(const type of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(type,()=>{touch[id]=false;el.classList.remove('active');});}
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
function pose(dt,snap=false){const p=state.player,d=state.dragon,speed=p.vs/25;
 player.position.set(p.x,height(p.s)+.08,-p.s);player.rotation.y=Math.atan2(-p.vx,-Math.max(p.vs,.1));blob.scale.set(1+Math.abs(p.vx)*.01,1-state.impact*.55,1+speed*.35);
 dragon.update(visualTime,{walk:0,allowIdleEmote:false});
 dragon.root.position.set(d.x,height(d.s)+.12,-d.s);dragon.root.rotation.set(state.impact*.6,Math.atan2(-d.vx,-Math.max(d.vs,.1)),-Math.max(-.5,Math.min(.5,(d.vx-p.vx)*.05)));
 const pos=ropeGeo.attributes.position;for(let i=0;i<17;i++){const t=i/16;pos.setXYZ(i,T.MathUtils.lerp(p.x,d.x,t),T.MathUtils.lerp(height(p.s)+.3,height(d.s)+.8,t)-Math.sin(t*Math.PI)*.2,-T.MathUtils.lerp(p.s,d.s,t));}pos.needsUpdate=true;ropeGeo.computeBoundingSphere();
 boxes.forEach((mesh,i)=>{const b=state.boxes[i];mesh.position.set(b.x,height(b.s)+.6,-b.s);mesh.rotation.set(b.hit?state.time*.8:0,b.hit?state.time:0,0);});
 if(state.impact>lastImpact+.05){shake=reduced?0:.22;}lastImpact=state.impact;shake*=Math.exp(-dt*10);
 const portrait=camera.aspect<1,back=portrait?11:9;
 target.set(p.x*.65+d.x*.35,height(p.s)+(portrait?7:5.3),-p.s+back);
 const alpha=snap?1:1-Math.exp(-dt*7);camera.position.lerp(target,alpha);if(shake)camera.position.x+=Math.sin(visualTime*100)*shake;
 look.set(p.x*.5+center(p.s+15)*.5,height(p.s)+.2,-p.s-10);camera.lookAt(look);
 camera.fov=reduced?65:61+Math.min(8,speed*7);camera.updateProjectionMatrix();
 sparks.visible=state.impact>0;for(let i=0;i<36;i++){const t=state.impact,origin=state.impactKind==='dragon'?d:p;sparksArray[i*3]=origin.x+Math.sin(i*73)*t*4;sparksArray[i*3+1]=height(origin.s)+.4+Math.abs(Math.cos(i*29))*t*3;sparksArray[i*3+2]=-origin.s+Math.cos(i*41)*t*5;}sparksGeo.attributes.position.needsUpdate=true;sparksGeo.computeBoundingSphere();
 $('stats').textContent=`${Math.round(p.vs*3.6)} km/h · ${state.score} 分 · ${state.time.toFixed(1)} 秒`;$('progress').value=p.s;
 $('impact').textContent=state.impact>.12?(state.impactKind==='dragon'?'龍泡泡重擊 +200':state.impactKind==='box'?'撞倒貨箱 +75':'擦撞護欄'):'';
}
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;if(!paused){visualTime+=dt;if(state.running){acc+=dt;while(acc>=1/120){race.step(1/120,input());acc-=1/120;}}pose(dt);
 if(state.finished&&$('result').hidden){$('result').hidden=false;$('summary').textContent=`${state.time.toFixed(1)} 秒 · ${state.score} 分 · 撞倒 ${state.hits} 箱 · 最高 ${Math.round(state.peak)} km/h`;$('pause').disabled=true;clearInput();}}
 renderer.render(scene,camera);}
pose(1,true);requestAnimationFrame(frame);
// Read-only diagnostics for validating the isolated prototype, not a public API.
window.__racing={get state(){return structuredClone(state);},get input(){return input();},get paused(){return paused;}};
