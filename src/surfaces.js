import * as T from 'three';

// Original procedural material maps. Created once, shared across the scene.
export function createSurfaces(r) {
  let seed=7112026;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const tex=(canvas,repeat=1,color=false)=>{const t=r.own(new T.CanvasTexture(canvas));if(color)t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repeat,repeat);t.anisotropy=4;return t;};
  function canvas(size){const c=document.createElement('canvas');c.width=c.height=size;return[c,c.getContext('2d')];}
  const [stucco,c]=canvas(512);c.fillStyle='#b5b1a3';c.fillRect(0,0,512,512);
  for(let i=0;i<18000;i++){const v=rand(),a=.025+rand()*.09;c.fillStyle=v<.5?`rgba(30,36,34,${a})`:`rgba(255,251,231,${a})`;const s=1+rand()*3;c.fillRect(rand()*512,rand()*512,s,s);}
  for(let i=0;i<70;i++){const x=rand()*512,y=rand()*512,g=c.createRadialGradient(x,y,0,x,y,20+rand()*60);g.addColorStop(0,'rgba(41,48,43,.12)');g.addColorStop(1,'rgba(41,48,43,0)');c.fillStyle=g;c.fillRect(0,0,512,512);}
  for(let i=0;i<15;i++){c.fillStyle='rgba(35,44,38,.09)';c.fillRect(rand()*512,0,.5+rand()*2,30+rand()*170);}
  const plaster=tex(stucco,2,true),plasterBump=tex(stucco,2);
  const [wood,w]=canvas(512);w.fillStyle='#6f5941';w.fillRect(0,0,512,512);
  for(let i=0;i<1100;i++){const y=rand()*512;w.strokeStyle=`rgba(${rand()<.5?'25,19,12':'192,158,105'},${rand()*.18})`;w.lineWidth=.3+rand()*1.4;w.beginPath();w.moveTo(0,y);w.bezierCurveTo(140,y-5+rand()*10,330,y+rand()*6,512,y+rand()*3);w.stroke();}
  const woodMap=tex(wood,2,true),woodBump=tex(wood,2);
  const [pavers,p]=canvas(512);p.fillStyle='#797c77';p.fillRect(0,0,512,512);
  for(let i=0;i<12000;i++){const v=rand()<.5?30:210;p.fillStyle=`rgba(${v},${v},${v},${rand()*.18})`;p.fillRect(rand()*512,rand()*512,1,1);}
  p.strokeStyle='#424b48';p.lineWidth=3;for(let y=0;y<512;y+=128){p.beginPath();p.moveTo(0,y);p.lineTo(512,y);p.stroke();for(let x=(y/128%2)*128;x<512;x+=256){p.beginPath();p.moveTo(x,y);p.lineTo(x,y+128);p.stroke();}}
  const paving=tex(pavers,4,true),pavingBump=tex(pavers,4);
  const [rough,q]=canvas(256);q.fillStyle='#505050';q.fillRect(0,0,256,256);for(let i=0;i<7000;i++){q.fillStyle=`rgba(240,240,240,${rand()*.3})`;q.fillRect(rand()*256,rand()*256,1,1);}const roughness=tex(rough,2);
  const [drops,d]=canvas(256);d.fillStyle='#808080';d.fillRect(0,0,256,256);
  for(let i=0;i<120;i++){const x=rand()*256,y=rand()*256,s=.7+rand()*2;const g=d.createRadialGradient(x-s*.3,y-s*.4,.1,x,y,s);g.addColorStop(0,'#d0d0d0');g.addColorStop(.55,'#929292');g.addColorStop(1,'#747474');d.fillStyle=g;d.beginPath();d.ellipse(x,y,s,s*(1+rand()*.9),0,0,Math.PI*2);d.fill();if(i%6===0){d.strokeStyle='#868686';d.lineWidth=.6;d.beginPath();d.moveTo(x,y);d.bezierCurveTo(x+2,y+7,x-1,y+13,x,y+22);d.stroke();}}
  const glassBump=tex(drops,1);
  const [pack,k]=canvas(256);k.fillStyle='#eeeeea';k.fillRect(0,0,256,256);k.fillStyle='#ffffff';k.fillRect(12,40,232,112);k.fillStyle='#414846';k.font='bold 35px sans-serif';k.textAlign='center';k.fillText('SELECT',128,88);k.font='18px sans-serif';k.fillText('Fresh & warm',128,120);k.fillStyle='#89918b';k.fillRect(20,165,216,12);for(let i=0;i<32;i++){k.fillStyle=i%3?'#292f2b':'#c9ccbe';k.fillRect(30+i*6,203,2+rand()*2,33);}
  const packaging=tex(pack,1,true);
  const [window,win]=canvas(512);const wg=win.createRadialGradient(150,170,10,200,240,390);wg.addColorStop(0,'#e5bc7a');wg.addColorStop(.6,'#9e825b');wg.addColorStop(1,'#302f2b');win.fillStyle=wg;win.fillRect(0,0,512,512);
  for(const side of [0,1])for(let i=0;i<8;i++){win.fillStyle=i%2?'rgba(73,57,39,.24)':'rgba(221,201,156,.36)';win.fillRect(side?365+i*18:i*18,0,14,512);}
  win.fillStyle='#242b28';win.fillRect(190,365,130,15);win.fillRect(210,380,8,132);win.fillRect(285,380,8,132);win.fillRect(228,302,45,62);
  const windowMap=tex(window,1,true);
  const wall={map:plaster,bumpMap:plasterBump,bumpScale:.018,roughness:.88};
  const timber={map:woodMap,bumpMap:woodBump,bumpScale:.012,roughness:.49};
  const pavement={map:paving,bumpMap:pavingBump,bumpScale:.035,roughnessMap:roughness,roughness:.54,metalness:.06};
  return {wall,timber,pavement,glassBump,roughness,packaging,windowMap};
}

export function makeNightEnvironment(renderer,r) {
  const s=new T.Scene();s.background=new T.Color('#030916');
  s.add(new T.HemisphereLight(0x697f9f,0x070b0f,1));
  function panel(color,intensity,p,scale,rotation=0){const m=new T.MeshBasicMaterial({color:new T.Color(color).multiplyScalar(intensity),side:T.DoubleSide});const mesh=new T.Mesh(new T.PlaneGeometry(1,1),m);mesh.position.fromArray(p);mesh.scale.fromArray(scale);mesh.rotation.y=rotation;s.add(mesh);}
  panel('#92b7e8',.6,[0,9,0],[18,12,1]);s.children.at(-1).rotation.x=Math.PI/2;
  panel('#fff4cf',5,[0,2.2,-7],[9,1.2,1]);
  panel('#f5bd79',2.8,[-6,2,-2],[2,3,1],Math.PI/2);
  panel('#fe7837',5,[0,3.3,7],[9,.15,1]);panel('#17a779',4,[0,3,7],[9,.23,1]);panel('#ef343b',4,[0,2.7,7],[9,.15,1]);
  panel('#6ba8cf',1.4,[8,4,0],[4,5,1],-Math.PI/2);
  const pmrem=new T.PMREMGenerator(renderer);const target=r.own(pmrem.fromScene(s,.08,.1,50));pmrem.dispose();
  for(const child of s.children){child.geometry?.dispose();child.material?.dispose();}
  return target.texture;
}
