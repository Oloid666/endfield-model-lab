import * as T from 'three';
import {buildDragon} from './companion.js';
import {Resources} from './resources.js';
import {OpeningTimeline, WAITING_LINES} from './opening-timeline.js';
export const loadingJokes=WAITING_LINES;
export function createLoading(){
 const root=document.querySelector('#loading'),label=document.querySelector('#loading-message'),subtitle=document.querySelector('#loading-joke'),retry=document.querySelector('#asset-retry');
 const abort=new AbortController(),r=new Resources();let timeline=new OpeningTimeline(),timer=null,action=null,percent=0,world=null,presentation=null,last=performance.now(),rendered=false,compact=false,disposed=false,bootFrame=0,finishResolve=null,lastActivity=performance.now();
 const meter=document.createElement('progress'),number=document.createElement('strong'),status=document.createElement('div'),details=document.createElement('details'),summary=document.createElement('summary'),info=document.createElement('p'),interact=document.createElement('button');
 meter.max=100;meter.value=0;meter.setAttribute('aria-label','整體準備進度');number.className='loading-percent';status.className='loading-status';status.append(number,meter,label);summary.textContent='載入詳情';info.textContent='WebGL 2 · 場景、角色與光影準備';details.className='loading-details';details.append(summary,info);interact.className='loading-interact';interact.textContent='點一下龍泡泡';interact.hidden=true;root.append(interact,status,details);
 subtitle.setAttribute('aria-live','polite');root.removeAttribute('role');root.querySelector('.device-note').textContent='莊的晚餐 · 雨夜街角';
 const skip=document.createElement('button');skip.className='loading-skip';skip.textContent='略過已看開場';skip.hidden=true;root.append(skip);let seen=false;try{seen=sessionStorage.getItem('rainy711.opening.seen')==='1';}catch{}skip.addEventListener('click',()=>{if(!seen||!timeline.ready)return;timeline.index=6;timeline.age=0;timeline.reaction=-1;},{signal:abort.signal});
 const progress=value=>{lastActivity=performance.now();percent=Math.max(percent,Math.min(99,value));meter.value=percent;number.textContent=`${Math.floor(percent)}%`;};
 retry.addEventListener('click',()=>action?.(),{signal:abort.signal});
 const react=()=>{if(timeline.interact())paint();};interact.addEventListener('click',react,{signal:abort.signal});root.addEventListener('click',event=>{if(!event.target.closest('button,details'))react();},{signal:abort.signal});
 function paint(){skip.hidden=!seen||!timeline.ready||timeline.final||compact;const text=compact?'':timeline.text;if(subtitle.textContent!==text)subtitle.textContent=text;interact.hidden=compact||!timeline.idle||timeline.ready;if(timeline.ready&&!timeline.done&&label.textContent!=='場景已就緒 · 等龍泡泡講完電話')label.textContent='場景已就緒 · 等龍泡泡講完電話';}
 function rotate(){const now=performance.now(),dt=(now-last)/1000;last=now;if(!root.hidden&&!document.hidden&&!timeline.ready&&!action&&now-lastActivity>30000){info.textContent='目前階段超過 30 秒沒有進度。可繼續等待，或重新載入。';retry.hidden=false;action=()=>location.reload();}if(document.hidden)lastActivity=now;if(!compact)timeline.tick(dt,!document.hidden&&rendered);paint();if(timeline.done&&finishResolve){try{sessionStorage.setItem('rainy711.opening.seen','1');}catch{}percent=100;meter.value=100;number.textContent='100%';label.textContent='準備完成';const resolve=finishResolve;finishResolve=null;resolve();}}
 function makePresentation(renderer,container){
   const scene=new T.Scene();scene.background=new T.Color('#10232b');scene.add(new T.HemisphereLight(0xe1e6ce,0x26414b,2));const light=new T.DirectionalLight(0xffecd2,3);light.position.set(-2,4,6);scene.add(light);const d=buildDragon(r);scene.add(d.root);
   const phone=new T.Group();phone.name='opening-floating-phone';scene.add(phone);r.box(phone,'#182c32',[0,0,0],[.17,.32,.035]);r.box(phone,'#91d1bf',[0,0,.023],[.14,.27,.008],{emissive:0x6a9b8e,emissiveIntensity:.4});
   const ring=r.mesh(r.geometry('TorusGeometry',.12,.006,5,24),r.material('#a9ddcf',{emissive:0x7abca9,emissiveIntensity:.5}),phone,[0,-.24,0]);ring.rotation.x=Math.PI/2;
   const drops=new Float32Array(60*6);for(let i=0;i<60;i++){const x=((i*17)%61)/61*6-3,y=(i%15)/15*4-1;drops.set([x,y,-1.5,x+.015,y-.09,-1.5],i*6);}const rainGeometry=r.own(new T.BufferGeometry());rainGeometry.setAttribute('position',new T.BufferAttribute(drops,3));const rain=new T.LineSegments(rainGeometry,r.own(new T.LineBasicMaterial({color:0x9dbcc7,transparent:true,opacity:.18})));scene.add(rain);
   const camera=new T.PerspectiveCamera(38,1,.1,20),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
   presentation={render(){const t=reduced?0:timeline.time;camera.aspect=container.clientWidth/Math.max(1,container.clientHeight);camera.position.set(-.18,.8,camera.aspect<1?5.5:3.9);camera.lookAt(-.18,.5,0);camera.updateProjectionMatrix();
     d.update(t,{action:{kind:timeline.phone?'call':'normal',amount:.7},reaction:timeline.reaction<0?null:{id:timeline.reaction,age:timeline.reactionAge,large:false},nod:timeline.final?.4:0});
     d.root.position.y=Math.sin(t*1.5)*.035;d.root.rotation.y=timeline.final?T.MathUtils.smoothstep(timeline.age,1.5,2.5)*-.65:Math.sin(t*.4)*.08;
     // World-space mount: outside the body, with the screen turned toward the face.
     rain.visible=!reduced;rain.position.y=-(t*.25%1);phone.visible=timeline.phone;phone.position.set(-.75,.79+Math.sin(t*1.5)*.025,.32);phone.lookAt(-.15,.8,1.1);renderer.render(scene,camera);rendered=true;
   }};root.classList.add('has-dragon');
 }
 return {
  boot(container){const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.25));renderer.setSize(container.clientWidth,Math.max(1,container.clientHeight),false);container.append(renderer.domElement);makePresentation(renderer,container);const frame=()=>{if(disposed)return;if(!document.hidden)presentation?.render();bootFrame=requestAnimationFrame(frame);};frame();return renderer;},
  bind(w){world=w;cancelAnimationFrame(bootFrame);if(!presentation)makePresentation(w.renderer,w.container);w.loadingPresentation=presentation;progress(15);},progress,
  download(data){if(data?.ratio!=null)progress(15+60*data.ratio);const loaded=(Number(data?.loaded||0)/1048576).toFixed(1);label.textContent='下載角色模型';info.textContent=data?.total?`模型 ${loaded} / ${(data.total/1048576).toFixed(1)} MB`:`模型已收到 ${loaded} MB · 總大小尚未提供`;},
  rendererInfo(state,dpr){info.textContent=`WebGL 2 · ${state.parallel?'平行':'標準'}著色器編譯 · ${state.programs} 個著色程式 · 像素倍率 ${dpr}`;},
  async finish(){timeline.ready=true;progress(99);if(!disposed)await new Promise(resolve=>{finishResolve=resolve;});if(!disposed)await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));if(world)world.loadingPresentation=null;presentation=null;r.dispose();},
  show(text,{compact:small=false,onRetry=null}={}){compact=small;root.hidden=false;root.classList.remove('done');root.classList.toggle('compact',compact);document.querySelector('#app').classList.add('is-loading');label.textContent=text;action=onRetry;retry.hidden=!onRetry;if(compact){percent=0;progress(0);}if(!timer){last=performance.now();paint();timer=setInterval(rotate,50);}},
  stage(text){lastActivity=performance.now();label.textContent=/光影/.test(text)?'編譯著色器與人物光影':/衣袖/.test(text)?'解析角色骨架與動作':text.replace(/ · \d+%$/,'');info.textContent='WebGL 2 · '+label.textContent;},
  fail(text,onRetry){label.textContent=text;subtitle.textContent='街景會等你，點一下重試。';clearInterval(timer);timer=null;action=onRetry;retry.hidden=false;interact.hidden=true;},
  hide(){root.hidden=true;root.classList.add('done');document.querySelector('#app').classList.remove('is-loading');clearInterval(timer);timer=null;retry.hidden=true;},
  get state(){return {percent,stage:label.textContent,subtitle:timeline.text,ready:timeline.ready,done:timeline.done,idle:timeline.idle};},
  dispose(){disposed=true;clearInterval(timer);cancelAnimationFrame(bootFrame);finishResolve?.();finishResolve=null;abort.abort();r.dispose();}
 };
}
