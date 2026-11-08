import * as T from 'three';
import {optimizeStaticSet} from './static-batches.js';
import {signedTemperature,wireProgress,FRIDGE_HOT_C} from './vcr-tablet.js';

export function buildVcrEffects(scene,r,{powerOutput=null}={}){
 const root=new T.Group();root.name='cold-chain-and-grid-props';scene.add(root);
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const fridge=new T.Group();fridge.name='fridge-attached-effects';root.add(fridge);
 const panel=new T.Group();panel.name='fridge-temperature-controller';panel.position.set(1.79,1.92,-1.92);fridge.add(panel);
 r.box(panel,'#1b3036',[0,0,0],[.48,.35,.055],{roughness:.4,metalness:.35});
 const lcd=document.createElement('canvas');lcd.width=512;lcd.height=320;const dc=lcd.getContext('2d'),dt=r.own(new T.CanvasTexture(lcd));dt.colorSpace=T.SRGBColorSpace;
 r.mesh(r.geometry('PlaneGeometry',.445,.30),r.own(new T.MeshBasicMaterial({map:dt})),panel,[0,0,.032]);let displayKey='';
 function display(temp,mode,target){const key=[temp,mode,target].join();if(key===displayKey)return;displayKey=key;dc.setTransform(.5,0,0,.5,0,0);dc.fillStyle='#0b222a';dc.fillRect(0,0,1024,640);dc.fillStyle='#9bb9bb';dc.font='36px sans-serif';dc.fillText('711  /  冷鏈控制 · 實際溫度',45,68);dc.fillStyle=mode==='cool'?'#a8efff':mode==='rising'?'#ffc66f':'#ff967c';dc.font='bold 176px monospace';dc.fillText(signedTemperature(temp),40,283);dc.font='44px sans-serif';dc.fillText(mode==='cool'?'● 製冷中':mode==='rising'?'● 除霜加熱啟動':'● 過熱警示',45,375);dc.fillStyle='#d1dfe0';dc.font='34px sans-serif';dc.fillText(target?'目標 −40°C  /  0°C':'遠端維修 · 除霜模式',45,477);dc.fillStyle='#7f9d9f';dc.font='30px sans-serif';dc.fillText(mode==='cool'?'遠端溫度回報':'FR · DEFAULT: DEFROST',45,568);dt.needsUpdate=true;}
 const railMat=r.own(new T.MeshBasicMaterial({color:'#d5f4ff',toneMapped:false})),rails=r.own(new T.InstancedMesh(r.geometry('BoxGeometry',1,1,1),railMat,3)),dummy=new T.Object3D();fridge.add(rails);
 [[.80,1.54,-1.98,.012,2.14,.015],[1.84,1.54,-1.98,.012,2.14,.015],[1.32,2.61,-1.98,1.05,.012,.015]].forEach((v,i)=>{dummy.position.fromArray(v);dummy.scale.set(...v.slice(3));dummy.updateMatrix();rails.setMatrixAt(i,dummy.matrix);});
 const steamCanvas=document.createElement('canvas');steamCanvas.width=steamCanvas.height=64;const sc=steamCanvas.getContext('2d'),sg=sc.createRadialGradient(32,32,0,32,32,31);sg.addColorStop(0,'rgba(255,255,255,.8)');sg.addColorStop(.45,'rgba(255,255,255,.45)');sg.addColorStop(1,'rgba(255,255,255,0)');sc.fillStyle=sg;sc.fillRect(0,0,64,64);const steamMap=r.own(new T.CanvasTexture(steamCanvas));steamMap.colorSpace=T.SRGBColorSpace;
 const vaporMat=r.own(new T.MeshBasicMaterial({map:steamMap,color:'#d5e5e5',transparent:true,opacity:.42,depthWrite:false})),vapor=r.own(new T.InstancedMesh(r.geometry('PlaneGeometry',1,1),vaporMat,12));vapor.frustumCulled=false;fridge.add(vapor);

 const frost=r.mesh(r.geometry('PlaneGeometry',1.0,.30),r.own(new T.MeshBasicMaterial({color:'#d8f8ff',transparent:true,opacity:0,depthWrite:false})),fridge,[1.32,2.12,-1.95]);frost.name='fridge-thin-frost';
 // Heating instructions belong to the lunch-box packaging, not a world-space card.
 const source=new T.Vector3(7.44,3.08,-15.3);if(powerOutput){powerOutput.updateWorldMatrix(true,false);powerOutput.getWorldPosition(source);}
 const path=new T.CatmullRomCurve3([source.toArray(),[7.85,2.95,-15.3],[7.85,.43,-14.2],[5.1,.43,-4.4],[4.75,.43,.7],[4.55,1.16,.7],[4.28,1.16,.7],[4.1,1.25,1.43],[3.99,1.6,1.43]].map(p=>new T.Vector3(...p)),false,'centripetal');
 const cable=r.mesh(r.own(new T.TubeGeometry(path,90,.023,5,false)),r.material('#223c3b'),root);
 for(const x of [4.58,4.35])r.box(root,'#52685f',[x,1.16,.7],[.13,.22,.2]);
 r.cylinder(root,'#96bca8',[3.99,1.6,1.43],.05,.07).rotation.z=Math.PI/2;
 const flowMat=r.own(new T.ShaderMaterial({transparent:true,depthWrite:false,toneMapped:false,uniforms:{head:{value:0}},vertexShader:'varying float along;void main(){along=uv.x;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying float along;uniform float head;void main(){float front=(1.-smoothstep(head-.012,head+.012,along));float tail=smoothstep(head-.16,head-.13,along);float a=front*tail;gl_FragColor=vec4(.45,1.,.74,a*.94);}'}));
 const flow=r.mesh(r.own(new T.TubeGeometry(path,100,.060,5,false)),flowMat,root);flow.frustumCulled=false;
 const energyHead=r.mesh(r.geometry('SphereGeometry',.11,8,5),r.own(new T.MeshBasicMaterial({color:'#d0ffda',toneMapped:false})),root);energyHead.name='wire-energy-head';energyHead.visible=false;
 r.cylinder(root,'#95b9ad',source.toArray(),.055,.06).rotation.z=Math.PI/2;
 // Keep the terminal in front of the third pylon podium, not inside its solid base.
 const consoleRoot=new T.Group();consoleRoot.name='pylon-03-maintenance-console';consoleRoot.position.set(7.4,0,-13.15);root.add(consoleRoot);
 r.box(consoleRoot,'#314b4b',[0,.7,0],[1.15,1.25,.58],{emissive:'#153032',emissiveIntensity:.4});r.box(consoleRoot,'#5c7271',[0,1.36,.16],[1.3,.08,.8]);r.box(consoleRoot,'#1b3038',[0,1.85,-.1],[1.24,.84,.10]);r.box(consoleRoot,'#1b3038',[0,1.41,.30],[.67,.035,.22]);r.box(consoleRoot,'#849b91',[.48,1.42,.28],[.08,.035,.11]);r.box(consoleRoot,'#203b37',[0,2.48,0],[1.52,.08,1.2]);optimizeStaticSet(consoleRoot,r);
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=680;const c=canvas.getContext('2d');let art=null,artLoaded=false,censored=false,forensics=false,controlConfirmed=false;
 function paintLauncher(){c.fillStyle='#e8e7e3';c.fillRect(0,0,1024,680);c.fillStyle='#1b2d39';c.fillRect(0,0,1024,56);c.fillStyle='#e1e8e6';c.font='28px sans-serif';c.fillText('TIANSHI 03   /   維護終端',26,39);if(art){const h=610,w=art.width*h/art.height;c.drawImage(art,600-w/2,64,w,h);}c.fillStyle='#13202e';c.font='bold 114px sans-serif';c.fillText('NIKKE',44,230);c.font='29px sans-serif';c.fillText('GODDESS OF VICTORY',50,277);c.fillText('PC LAUNCHER',50,323);c.fillStyle='#c5473b';c.fillRect(50,495,320,70);c.fillStyle='#fff';c.font='bold 38px sans-serif';c.fillText('啟動遊戲',125,543);c.fillStyle='#647278';c.font='22px sans-serif';c.fillText('版本更新完成   ·   帳戶已登入',50,610);if(forensics){c.fillStyle='#2c3139';c.fillRect(40,350,510,122);c.fillStyle='#ffd4a3';c.font='25px sans-serif';c.fillText('供應鏈攻擊 · CDN 腳本遭竄改',55,382);c.fillText('竊密木馬 · Credential theft',55,419);c.fillStyle='#94e5cd';c.fillText('C2 遠端控制通道 · 在線',55,455);}if(texture)texture.needsUpdate=true;}
 const basePaintLauncher=paintLauncher;
 function repaintLauncher(){basePaintLauncher();if(controlConfirmed){c.fillStyle='#173e34';c.fillRect(40,350,510,122);c.fillStyle='#d8f3df';c.font='bold 29px sans-serif';c.fillText('控制指令已送出',55,393);c.font='25px sans-serif';c.fillText('供電來源：3號天師樁儲能模組',55,441);if(texture)texture.needsUpdate=true;}if(censored&&art){const scale=610/art.height,left=600-art.width*scale/2;c.fillStyle='#030303';c.fillRect(left+198*scale,64+113*scale,112*scale,37*scale);if(texture)texture.needsUpdate=true;}}
 let texture=null;repaintLauncher();texture=r.own(new T.CanvasTexture(canvas));texture.colorSpace=T.SRGBColorSpace;
 r.mesh(r.geometry('PlaneGeometry',1.16,.76),r.own(new T.MeshBasicMaterial({map:texture})),consoleRoot,[0,1.85,-.039]).name='pylon-03-launcher-screen';
 if(typeof Image!=='undefined'){const img=new Image();img.onload=()=>{art=img;artLoaded=true;repaintLauncher();};img.src=`${import.meta.env?.BASE_URL||'/'}images/nikke-rapi.webp`;}
 let active=false,hot=true,stage='',age=0,temperature=FRIDGE_HOT_C,hotAt=null;
 return {root,path,panel,reset(){hotAt=null;censored=forensics=controlConfirmed=false;repaintLauncher();},update(s,{intact=true,camera=null}={}){active=!!s?.vcr;stage=s?.tablet?.stage||'';age=s?.tablet?.age||0;fridge.visible=!!intact;
  const confirmed=stage==='cable';if(confirmed!==controlConfirmed){controlConfirmed=confirmed;repaintLauncher();}
  const incident=['backdoor','rapi-request','rapi-answer','rapi-mask'].includes(stage);if(incident!==forensics){forensics=incident;repaintLauncher();}
  if(s?.tablet&&censored!==!!s.tablet.censored){censored=!!s.tablet.censored;repaintLauncher();}
  const past=active&&!['return','rewind'].includes(s.phase)||s?.phase==='rewind'&&s.rewindProgress>.98;
  hot=!past||!!s?.fridgeHot;if(past&&!s?.fridgeHot)hotAt=null;if(past&&s?.fridgeHot)hotAt??=s.clock;
  temperature=past?(s?.tablet?.temperature??(hot?FRIDGE_HOT_C:4)):FRIDGE_HOT_C;
  const mode=stage==='defrost'?'rising':hot?'hot':'cool';display(temperature,mode,past);railMat.color.set(mode==='cool'?'#b6eaff':mode==='rising'?'#ffc65b':'#ff6244');railMat.color.multiplyScalar(hot&&mode==='hot'&&!reduced?.85+.15*Math.sin((s?.clock||0)*3)**2:1);
  frost.material.opacity=past?Math.max(0,Math.min(.16,-temperature/80)):0;frost.visible=frost.material.opacity>0;
  vapor.visible=hot&&temperature>=40&&(!past||stage==='hot'||stage==='defrost');for(let i=0;i<12;i++){const p=reduced?.4:(((s?.clock||0)*.24+i/12)%1);dummy.position.set(.82+(i%4)*.20+Math.sin(i+p)*.05,2.38+p*.72,-1.74-Math.sin(i*.8)*.10);if(camera)dummy.quaternion.copy(camera.quaternion);dummy.scale.set(.25+p*.26,.30+p*.34,1);dummy.updateMatrix();vapor.setMatrixAt(i,dummy.matrix);}vapor.instanceMatrix.needsUpdate=true;
  flow.visible=past&&stage==='cable'&&age>=.4;energyHead.visible=flow.visible;if(flow.visible){flowMat.uniforms.head.value=wireProgress(age);path.getPointAt(wireProgress(age),energyHead.position);}
 },get state(){return {active,hot,stage,age,temperature,artLoaded,censored,forensics,fridgeVisible:fridge.visible,energyVisible:energyHead.visible,energyPosition:energyHead.position.toArray(),powerSource:source.toArray(),sourceKind:'tianshi-grid',controlConfirmed};}};
}
