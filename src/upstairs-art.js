import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {optimizeStaticSet} from './static-batches.js';
// Both rooms share a small procedural material kit; no downloaded assets or shadow maps.
export function upstairsArt(r){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');c.fillStyle='#70563f';c.fillRect(0,0,256,256);
 let seed=711;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<260;i++){c.strokeStyle=i%3?'#3d2f2228':'#bc967735';c.lineWidth=.3+random()*.7;c.beginPath();const y=random()*256;c.moveTo(0,y);c.bezierCurveTo(80,y+random()*5,180,y-random()*6,256,y+random()*4);c.stroke();}
 const grain=r.own(new T.CanvasTexture(canvas));grain.colorSpace=T.SRGBColorSpace;grain.wrapS=grain.wrapT=T.RepeatWrapping;
 const wood=r.own(new T.MeshStandardMaterial({color:'#c0a28b',map:grain,roughness:.64})),green=r.material('#29443d',{roughness:.77}),brass=r.material('#ad9360',{metalness:.65,roughness:.43}),wall=r.material('#8d9587',{roughness:.95}),paper=r.material('#e5dcc2',{roughness:.9});
 const rounded=new Map(),woodColors=new Set(['#927b53','#a78b5e','#927c54','#8b7551','#8a7957']);
 function box(parent,color,p,s){const key=s.join(',');if(!rounded.has(key))rounded.set(key,r.own(new RoundedBoxGeometry(...s,2,Math.min(.022,...s.map(v=>v*.16))).scale(1/s[0],1/s[1],1/s[2])));return r.mesh(rounded.get(key),woodColors.has(color)?wood:['#3c6155','#586047'].includes(color)?green:r.material(color),parent,p,s);}
 const block=(parent,mat,p,s)=>r.mesh(r.geometry('BoxGeometry',1,1,1),mat,parent,p,s);
 const tag=(parent,text,p,w=.5,h=.16)=>r.mesh(r.geometry('PlaneGeometry',w,h),r.label(text,{width:512,height:Math.max(128,Math.round(512*h/w)),font:'bold 64px sans-serif',bg:'#e5dcc2',color:'#29443d'}),parent,p);
 function lamp(parent,p){const g=new T.Group();g.position.fromArray(p);parent.add(g);r.mesh(r.geometry('CylinderGeometry',.14,.16,.035,20),brass,g,[0,0,0]);r.mesh(r.geometry('CylinderGeometry',.019,.019,.43,12),brass,g,[0,.23,0]);r.mesh(r.geometry('SphereGeometry',1,20,10,0,Math.PI*2,0,Math.PI/2),green,g,[0,.48,0],[.26,.14,.18]);r.mesh(r.geometry('CircleGeometry',.18,20),r.material('#ffdfab',{emissive:0xffb766,emissiveIntensity:1.8,side:T.DoubleSide}),g,[0,.47,0],[1,1,1]).rotation.x=Math.PI/2;const light=new T.PointLight(0xffd199,2.8,3,2);light.position.set(0,.41,0);g.add(light);return g;}
 function shell(parent){
  const stage=new T.Group();stage.name='upstairs-static-shell';parent.add(stage);
  block(stage,wall,[0,1.6,-2.4],[6,3.2,.12]);block(stage,wall,[-3,1.6,0],[.12,3.2,5]);block(stage,wall,[3,1.6,0],[.12,3.2,5]);
  block(stage,green,[0,.52,-2.32],[6,1.04,.045]);for(const x of [-2.92,2.92])block(stage,green,[x,.52,0],[.045,1.04,5]);
  for(const y of [.10,1.03]){block(stage,wood,[0,y,-2.28],[5.9,.065,.07]);for(const x of [-2.89,2.89])block(stage,wood,[x,y,0],[.07,.065,5]);}
  for(let row=0;row<10;row++)for(let col=0;col<3;col++){const offset=row%2?.24:0,x=-2+col*2;block(stage,wood,[x,.006,row*.5-2.25],[1.985,.025,.484]);if(offset)block(stage,brass,[x-.7,.02,row*.5-2.25],[.006,.002,.48]);}
  const window=new T.Group();window.name='rain-window';window.position.set(-2.86,1.95,-.4);parent.add(window);
  block(window,r.material('#183b4c',{metalness:.3,roughness:.32}),[0,0,0],[.035,1.6,2.15]);
  for(const z of [-1.13,0,1.13])block(window,wood,[.04,0,z],[.085,1.76,.065]);for(const y of [-.86,0,.86])block(window,wood,[.04,y,0],[.085,.055,2.3]);block(window,wood,[.1,-.88,0],[.27,.09,2.4]);
  for(let i=0;i<16;i++)block(window,r.material(i%3?'#467080':'#8b9a8a',{emissive:i%3?0x23495c:0x6b6d50,emissiveIntensity:.24}),[.03,-.62+random()*1.22,-.96+random()*1.92],[.012,.04+random()*.06,.025]);
  const rain=new T.InstancedMesh(r.geometry('BoxGeometry',.006,.10,.008),r.material('#80b1c3',{transparent:true,opacity:.25}),30);r.own(rain);window.add(rain);rain.name='window-rain-streaks';const dummy=new T.Object3D();
  // A framed clock belongs to each room, not a floating HUD.
  r.mesh(r.geometry('CylinderGeometry',.23,.23,.045,28),brass,stage,[2.51,2.65,-2.25]).rotation.x=Math.PI/2;
  r.mesh(r.geometry('CircleGeometry',.207,28),paper,stage,[2.51,2.65,-2.221]);
  block(stage,green,[2.51,2.70,-2.21],[.018,.12,.012]);const hand=block(stage,green,[2.56,2.65,-2.21],[.12,.018,.012]);hand.rotation.z=.3;
  const fill=new T.PointLight(0x719ec3,2.0,6,2);fill.position.set(-2.4,2.4,-.25);parent.add(fill);
  optimizeStaticSet(stage,r);optimizeStaticSet(window,r);
  return {update(t,reduced){for(let i=0;i<30;i++){dummy.position.set(.035,((i*.153-(reduced?0:t*.24))%1.5+1.5)%1.5-.75,-1+(i*7%29)/14.5);dummy.updateMatrix();rain.setMatrixAt(i,dummy.matrix);}rain.instanceMatrix.needsUpdate=true;}};
 }
 function dress(classroom,claims){
  const a=new T.Group(),b=new T.Group();a.name='classroom-crafted-props';b.name='claims-crafted-props';classroom.add(a);claims.add(b);
  // Teacher's tabletop props stay behind the working stamp surface.
  lamp(classroom,[2.50,.82,-.80]);lamp(claims,[1.88,1.05,-.15]);
  block(a,paper,[1.5,.825,-.85],[.40,.02,.25]);const book=block(a,wood,[1.5,.813,-.85],[.43,.014,.28]);book.rotation.y=-.13;
  r.mesh(r.geometry('CylinderGeometry',.065,.06,.16,16),green,a,[1.12,.90,-.83]);for(let i=0;i<4;i++)block(a,paper,[1.10+i*.012,1.0,-.83],[.009,.15,.009]);
  block(a,r.material('#8c9690'),[1.5,.952,-.85],[.10,.045,.055]);
  block(a,paper,[-1.6,.775,.65],[.52,.018,.35]);block(a,brass,[-1.35,.79,.68],[.014,.012,.30]);
  tag(a,'別把笑話講解到死',[2.49,2.20,-2.14],.48,.32);
  // Plant is a few shared primitive leaves and a clay pot.
  const plant=new T.Group();plant.position.set(-2.65,1.09,-.65);a.add(plant);r.mesh(r.geometry('CylinderGeometry',.11,.075,.19,16),r.material('#a1815f'),plant,[0,.095,0]);
  for(let i=0;i<6;i++){const leaf=r.mesh(r.geometry('SphereGeometry',1,10,6),r.material('#55745b'),plant,[Math.sin(i)*.10,.27+(i%3)*.055,Math.cos(i)*.10],[.09,.025,.15]);leaf.rotation.set(i*.25,i,.3);}
  // One framed policy, a low cabinet and a tiny zero-case joke.
  block(b,wood,[-.7,2.1,-2.24],[1.05,.98,.07]);const policy=tag(b,'保單',[-.7,2.1,-2.195],.86,.80);
  const cabinet=block(b,green,[2.42,.66,-1.86],[.72,1.22,.56]);for(const y of [.28,.65,1.02]){block(b,wood,[2.42,y,-1.56],[.66,.025,.02]);block(b,brass,[2.42,y+.18,-1.55],[.20,.028,.015]);}
  block(b,green,[-.97,1.037,.20],[.95,.015,.76]);
  const counter=tag(b,'本日已處理 0 件',[.96,1.23,.61],.75,.20);counter.rotation.x=-.16;block(b,brass,[.96,1.12,.57],[.80,.025,.19]);
  block(b,paper,[-1.70,1.055,.04],[.36,.025,.46]);for(const x of [-1.76,-1.63])block(b,brass,[x,1.072,-.10],[.018,.008,.065]);
  // Small standing umbrella by the rain window.
  r.mesh(r.geometry('CylinderGeometry',.15,.15,.37,14,true),brass,b,[-2.61,.2,.68]);for(const z of [.64,.72])r.mesh(r.geometry('CylinderGeometry',.017,.017,.85,8),green,b,[-2.61,.55,z]);
  optimizeStaticSet(a,r);optimizeStaticSet(b,r);
 }
 return {box,shell,dress};
}
