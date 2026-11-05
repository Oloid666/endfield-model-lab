import * as T from 'three';

// Fictional device UI and local effects only: this never accesses a real network.
export function buildVcrEffects(scene,r){
 const root=new T.Group();root.name='vcr-cold-chain';root.visible=false;scene.add(root);
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const lights=[];
 for(const x of [.16,1.33]){const mat=r.own(new T.MeshBasicMaterial({color:'#8feaff',transparent:true,opacity:.12,depthWrite:false}));lights.push(r.mesh(r.geometry('PlaneGeometry',1.01,2.18),mat,root,[x,1.56,-1.99]));}
 const warning=r.box(root,'#ff4020',[1.85,1.8,-1.95],[.08,.10,.04],{emissive:'#ff3010',emissiveIntensity:1});
 const vapor=[];
 for(let i=0;i<8;i++){const mat=r.own(new T.MeshBasicMaterial({color:'#d8eff1',transparent:true,opacity:0,depthWrite:false}));vapor.push(r.mesh(r.geometry('SphereGeometry',1,7,5),mat,root));}
 const display=document.createElement('canvas');display.width=512;display.height=128;const dc=display.getContext('2d'),dt=r.own(new T.CanvasTexture(display));dt.colorSpace=T.SRGBColorSpace;
 r.mesh(r.geometry('PlaneGeometry',.9,.225),r.own(new T.MeshBasicMaterial({map:dt})),root,[.65,2.62,-1.96]);let displayText='';
 function temperature(text,hot){if(text===displayText)return;displayText=text;dc.fillStyle=hot?'#571b18':'#0e343f';dc.fillRect(0,0,512,128);dc.fillStyle=hot?'#ffce90':'#b9f7ff';dc.font='bold 52px monospace';dc.textAlign='center';dc.fillText(text,256,82);dt.needsUpdate=true;}
 const path=new T.CatmullRomCurve3([[6.7,3,-15.3],[13,.6,-15.3],[14,.38,4],[-.2,.38,3.1],[-.2,.38,1.7],[2,.4,1.6],[3.4,1.4,1.25]].map(p=>new T.Vector3(...p)),false,'centripetal');
 const cable=r.mesh(r.own(new T.TubeGeometry(path,100,.025,5,false)),r.material('#243b36'),root);
 const pulse=r.mesh(r.geometry('SphereGeometry',.075,8,6),r.material('#8ce9bd',{emissive:'#63edba',emissiveIntensity:2}),root);
 const monitor=new T.Group();monitor.name='pylon-03-launcher';monitor.position.set(6.7,3.7,-14.7);root.add(monitor);r.box(monitor,'#233536',[0,0,0],[.9,.65,.08]);
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=704;const c=canvas.getContext('2d');c.fillStyle='#222b3b';c.fillRect(0,0,1024,704);c.fillStyle='#788ba0';c.fillRect(0,0,1024,72);c.font='bold 36px sans-serif';c.fillStyle='#fff';c.fillText('03 · 天師樁管理電腦',38,50);
 c.fillStyle='#4e314f';c.fillRect(32,100,960,560);c.fillStyle='#c49bb9';c.beginPath();c.arc(780,250,72,0,Math.PI*2);c.fill();c.fillRect(700,320,160,280);c.fillStyle='#fff';c.font='bold 112px sans-serif';c.fillText('NIKKE',74,280);c.font='40px sans-serif';c.fillText('PC Launcher',78,350);c.fillStyle='#f2bd84';c.font='32px sans-serif';c.fillText('CDN 腳本遭竄改',78,460);c.fillText('遠端存取通道：在線',78,520);c.font='24px sans-serif';c.fillText('劇情示意畫面',76,625);
 const texture=r.own(new T.CanvasTexture(canvas));texture.colorSpace=T.SRGBColorSpace;r.mesh(r.geometry('PlaneGeometry',.83,.57),r.own(new T.MeshBasicMaterial({map:texture})),monitor,[0,0,.05]);
 let active=false,hot=false,stage='',age=0,hotAt=null;
 const coldColor=new T.Color('#8feaff'),hotColor=new T.Color('#ff3020');
 return {root,path,reset(){active=hot=false;hotAt=null;root.visible=false;},update(s){active=!!s?.vcr;root.visible=active;if(!active){hotAt=null;return;}hot=!!s.fridgeHot;stage=s.tablet?.stage||'';age=s.tablet?.age||0;
  if(hot)hotAt??=s.clock||0;else hotAt=null;const warmAge=hot?Math.max(0,(s.clock||0)-hotAt):0,warmth=Math.min(1,warmAge/2);
  lights.forEach(m=>{m.material.color.copy(coldColor).lerp(hotColor,warmth);m.material.opacity=hot?.32+.08*(reduced?0:Math.sin((s.clock||0)*2)**2):stage==='temperature'?.22:.04;});warning.visible=hot;
  temperature(hot?'+50°C · DEFROST':stage==='temperature'?'−40°C / 0°C':'COLD CHAIN',hot);
  vapor.forEach((m,i)=>{m.visible=hot&&['hot','drink'].includes(stage);const p=reduced?.3:((warmAge*.35+i/8)%1);m.position.set(.2+(i%3)*.4,1.9+p*.8,-1.83);m.scale.set(.08+p*.12,.06+p*.17,.05);m.material.opacity=(1-p)*.12;});
  cable.visible=pulse.visible=!!s.cablePowered;monitor.visible=['backdoor','cable'].includes(stage);
  if(cable.visible)pulse.position.copy(path.getPointAt(stage==='cable'?Math.min(1,age/6):((s.clock||0)*.25)%1));
 },get state(){return {active,hot,stage,age};}};
}
