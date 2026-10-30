import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Resources} from '../resources.js';
import {buildDragon} from '../companion.js';
import {buildStore} from '../store.js';
import {road,height,LENGTH,WIDTH,BENDS} from './track.js';

export function createRaceScene(canvas,state){
  const r=new Resources(),scene=new T.Scene();scene.background=new T.Color('#8497a1');scene.fog=new T.Fog('#8497a1',75,185);
  const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
  scene.add(new T.HemisphereLight('#e0f4ff','#424a3a',2.1));const sun=new T.DirectionalLight('#ffe3b1',2.7);sun.position.set(-30,70,20);scene.add(sun);
  const camera=new T.PerspectiveCamera(65,1,.1,240),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store=buildStore(scene,r),shop=road(40,-13.3);store.root.position.set(shop.x,shop.y,shop.z);
  function ribbon(offset,width,material,depth=0){
    const verts=[],indices=[];for(let i=0;i<=LENGTH+45;i++){
      const s=i-20;for(const side of [-1,1]){const p=road(s,offset+side*width/2);verts.push(p.x,p.y+depth,p.z);}
      if(i<LENGTH+45){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}
    }
    const g=r.own(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();r.mesh(g,material,scene);
  }
  ribbon(0,WIDTH*2,r.material('#33454a'));
  for(const side of [-1,1])ribbon(side*(WIDTH-.2),.15,r.material('#e5dfc0'),.025);
  for(let s=-18;s<LENGTH+22;s+=5){
    const p=road(s),stripe=r.box(scene,'#d7b76b',[p.x,p.y+.025,p.z],[.14,.025,2.4]);stripe.rotation.y=-p.heading;
    for(const side of [-1,1]){
      const edge=road(s,side*(WIDTH+.2));r.box(scene,'#819c9d',[edge.x,edge.y+.65,edge.z],[.16,1.3,.16]);
      const rail=r.box(scene,'#c7ccc0',[edge.x,edge.y+.85,edge.z],[.18,.23,5.12]);rail.rotation.y=-edge.heading;
    }
    if(s%25===2){const block=r.box(scene,'#b8b8a0',[p.x,p.y-.98,p.z],[WIDTH*2+1,1.45,5]);block.rotation.y=-p.heading;}
  }
  for(const b of BENDS){
    for(const s of [b.start-18,b.start+12,b.start+36]){
      const at=road(s,-b.side*(WIDTH+.7)),sign=new T.Group();sign.position.set(at.x,at.y,at.z);sign.rotation.y=-at.heading;scene.add(sign);
      r.box(sign,'#788783',[0,1.1,0],[.12,2.2,.12]);r.mesh(r.geometry('PlaneGeometry',1.6,.85),r.label(b.side>0?'右彎 →':'← 左彎',{width:256,height:128,font:'bold 42px sans-serif',bg:'#253c3e',color:'#efd191'}),sign,[0,2.1,0]);
    }
  }
  for(let i=0;i<50;i++){
    const s=i*11,side=i%2?1:-1,p=road(s,side*(21+i%4*2)),h=3+i%7*1.7;
    const m=r.box(scene,i%3?'#687e80':'#c7c9ac',[p.x,p.y+h/2-1,p.z],[4,h,5]);m.rotation.y=-p.heading+i*.19;
    if(i%3===0){for(let j=0;j<3;j++)r.box(scene,'#e0dcc1',[p.x+Math.sin(j)*1.5,p.y+j*1.1,p.z+2],[2.5,1,2.2]);}
    else r.box(scene,'#dccf8c',[p.x,p.y+h*.65,p.z+2.51],[2.5,.35,.025],{emissive:'#a39353',emissiveIntensity:.6});
  }
  const mid=road(LENGTH/2);r.box(scene,'#526a60',[mid.x,-10,mid.z],[800,2,800]);
  const end=road(LENGTH),finish=new T.Group();finish.position.set(end.x,end.y,end.z);finish.rotation.y=-end.heading;scene.add(finish);
  for(const side of [-1,1])r.box(finish,'#839a91',[side*6,3,0],[.4,6,.4]);r.mesh(r.geometry('PlaneGeometry',11,1.6),r.label('終點・龍泡泡還在嗎？',{font:'bold 60px sans-serif'}),finish,[0,5,0]);
  // Batch only static top-level scenery. Keep the store, signs and actors independent.
  scene.updateMatrixWorld(true);const batches=new Map();
  for(const mesh of [...scene.children]){
    if(!mesh.isMesh||Array.isArray(mesh.material)||mesh.material.transparent)continue;
    const list=batches.get(mesh.material)||[];list.push(mesh);batches.set(mesh.material,list);
  }
  for(const [material,meshes] of batches){
    if(meshes.length<2)continue;
    const geometries=meshes.map(m=>m.geometry.clone().applyMatrix4(m.matrixWorld));
    const merged=mergeGeometries(geometries);
    if(merged){r.mesh(r.own(merged),material,scene);for(const m of meshes)m.removeFromParent();}
    for(const g of geometries)g.dispose();
  }
  const player=new T.Group();scene.add(player);const geo=r.own(new T.SphereGeometry(1,24,12)),rest=geo.attributes.position.array.slice();
  const blob=r.mesh(geo,r.material('#9461b8',{roughness:.35,metalness:.12}),player,[0,.12,0]);
  for(let i=0;i<geo.attributes.position.count;i++){const j=i*3,x=rest[j],y=rest[j+1],z=rest[j+2],l=1+.17*Math.sin(x*7+z*4);geo.attributes.position.setXYZ(i,x*.55*l,(y+1)*.2,z*.8*l);}geo.computeVertexNormals();
  const dragon=buildDragon(r);scene.add(dragon.root);dragon.root.scale.setScalar(1.25);
  const harness=r.mesh(r.geometry('TorusGeometry',.57,.045,6,28),r.material('#c6a75d'),dragon.root,[0,.6,0]);harness.rotation.x=Math.PI/2;
  const shadows=[player,dragon.root].map(()=>{const m=r.mesh(r.geometry('CircleGeometry',.8,16),r.own(new T.MeshBasicMaterial({color:'#12282c',transparent:true,opacity:.3,depthWrite:false})),scene);m.rotation.x=-Math.PI/2;return m;});
  // A visible round rope, updated in place, with sag only while slack.
  const ropeGeo=r.own(new T.BufferGeometry()),ropeArray=new Float32Array(25*6*3),ropeIndices=[];
  for(let i=0;i<24;i++)for(let j=0;j<6;j++){const a=i*6+j,b=i*6+(j+1)%6;ropeIndices.push(a,b,a+6,b,b+6,a+6);}
  ropeGeo.setAttribute('position',new T.BufferAttribute(ropeArray,3));ropeGeo.setIndex(ropeIndices);const ropeMat=r.material('#e9cb7d');ropeMat.side=T.DoubleSide;r.mesh(ropeGeo,ropeMat,scene);
  const boxes=state.boxes.map(b=>r.box(scene,'#bfa77d',[b.x,height(b.s)+.65,b.z],[1.3,1.3,1.3]));
  const sparksGeo=r.own(new T.BufferGeometry()),sparksArray=new Float32Array(36*3);sparksGeo.setAttribute('position',new T.BufferAttribute(sparksArray,3));const sparks=new T.Points(sparksGeo,r.own(new T.PointsMaterial({color:'#ffe4a0',size:.16})));sparks.frustumCulled=false;scene.add(sparks);
  const target=new T.Vector3(),look=new T.Vector3();let shake=0,lastEvent=null,eventTime=-10,lastHeading=0;
  function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
  function hit(event,clock){lastEvent=event;eventTime=clock;shake=reduced?0:event.strength*.22;}
  function pose(dt,clock,snap=false){
    const p=state.player,d=state.dragon,speed=Math.min(1,state.speed/26);
    player.position.set(p.x,height(p.s)+.08,p.z);player.rotation.y=Math.PI-p.heading;
    blob.scale.set(1+state.slip*.025,1-p.impact*.45,1+speed*.35);
    dragon.update(clock,{walk:0,allowIdleEmote:false,action:d.impact>.2?{kind:'shock',amount:d.impact}:null});
    dragon.root.position.set(d.x,height(d.s)+.12,d.z);dragon.root.rotation.set(d.impact*.65,Math.PI-d.heading,-Math.max(-.65,Math.min(.65,Math.sin(d.heading-p.heading)*.8)));
    for(let i=0;i<2;i++){const b=i?d:p;shadows[i].position.set(b.x,height(b.s)+.025,b.z);}
    const dx=d.x-p.x,dz=d.z-p.z,len=Math.hypot(dx,dz)||1,slack=Math.max(0,1-state.ropeLength/(state.ropeMode==='long'?6:4.5));
    for(let i=0;i<25;i++){
      const t=i/24,x=p.x+dx*t,z=p.z+dz*t,y=T.MathUtils.lerp(height(p.s)+.32,height(d.s)+.75,t)-Math.sin(t*Math.PI)*(.06+slack*.17);
      for(let j=0;j<6;j++){const a=j/6*Math.PI*2,k=(i*6+j)*3;ropeArray[k]=x+dz/len*Math.sin(a)*.043;ropeArray[k+1]=y+Math.cos(a)*.043;ropeArray[k+2]=z-dx/len*Math.sin(a)*.043;}
    }
    ropeGeo.attributes.position.needsUpdate=true;ropeGeo.computeVertexNormals();ropeGeo.computeBoundingSphere();ropeMat.color.set(state.tension>35?'#f4a55b':'#e9cb7d');
    boxes.forEach((mesh,i)=>{const b=state.boxes[i];mesh.position.set(b.x,height(b.s)+.65,b.z);mesh.rotation.set(Math.sin(b.angle)*b.impact*.4,b.angle,Math.cos(b.angle)*b.impact*.4);});
    // Chase along the road's direction, not a fixed world axis. Enclose both bodies on phones.
    const ahead=road(p.s+9),desiredHeading=ahead.heading,delta=Math.atan2(Math.sin(desiredHeading-lastHeading),Math.cos(desiredHeading-lastHeading));
    lastHeading+=delta*(snap?1:1-Math.exp(-dt*3.5));
    const fx=Math.sin(lastHeading),fz=-Math.cos(lastHeading),nx=Math.cos(lastHeading),nz=Math.sin(lastHeading),portrait=camera.aspect<1;
    const lateralSpan=Math.abs(dx*nx+dz*nz),back=(portrait?14.2:10.5)+lateralSpan*(portrait?.7:.32);
    const cx=p.x*.6+d.x*.4,cz=p.z*.6+d.z*.4;
    target.set(cx-fx*back,height(p.s)+(portrait?8:5.8)+lateralSpan*.2,cz-fz*back);
    camera.position.lerp(target,snap?1:1-Math.exp(-dt*7));shake*=Math.exp(-dt*12);camera.position.x+=Math.sin(clock*100)*shake;
    look.set(cx+fx*7,height(p.s)+.3,cz+fz*7);camera.lookAt(look);camera.fov=reduced?67:63+speed*8;camera.updateProjectionMatrix();
    const age=clock-eventTime;sparks.visible=!!lastEvent&&age<.32;
    if(sparks.visible){for(let i=0;i<36;i++){sparksArray[i*3]=lastEvent.x+Math.sin(i*73)*age*(3+lastEvent.strength*7);sparksArray[i*3+1]=height(lastEvent.s)+.4+Math.abs(Math.cos(i*29))*age*6-age*age*12;sparksArray[i*3+2]=lastEvent.z+Math.cos(i*41)*age*(3+lastEvent.strength*7);}sparksGeo.attributes.position.needsUpdate=true;}
  }
  resize();return {resize,hit,pose,render:()=>renderer.render(scene,camera),reset(){lastEvent=null;shake=0;lastHeading=0;},get camera(){return camera;}};
}
