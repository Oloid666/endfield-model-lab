import * as T from 'three';
import {Resources} from '../resources.js';
import {buildInterior} from '../interior.js';
import {createSurfaces} from '../surfaces.js';
import {buildDragon} from '../companion.js';
import {route,LENGTH,WIDTH,CHECKPOINTS} from './game.js';
export function createScene(canvas,state){
 const r=new Resources(),scene=new T.Scene(),renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
 scene.background=new T.Color('#9faf9d');scene.add(new T.HemisphereLight('#fff8de','#314f44',2.3));const sun=new T.DirectionalLight('#ffe4bb',2.2);sun.position.set(-2,8,4);scene.add(sun);
 const camera=new T.PerspectiveCamera(62,1,.015,35),root=new T.Group();scene.add(root);
 r.box(root,'#c7c9b4',[0,.15,-.5],[8.5,.3,5]);r.box(root,'#355d4a',[0,1.6,-3.1],[8.5,2.6,.12]);
 const glass=r.own(new T.MeshStandardMaterial({color:'#adc7be',transparent:true,opacity:.1,depthWrite:false}));buildInterior(root,r,createSurfaces(r),glass,[]);
 // Dollhouse cutaway: no roof or foreground wall. The existing shelves remain visible.
 r.mesh(r.geometry('PlaneGeometry',2,.4),r.label('武陵711・晚餐大逃亡',{font:'bold 55px sans-serif'}),root,[0,2.7,-3]);
 const hatch=r.box(root,'#315651',[-.6,.315,1],[.5,.025,.4]);
 const verts=[],indices=[];const count=Math.ceil(LENGTH/.04);
 for(let i=0;i<=count;i++){const s=i/count*LENGTH;for(const side of [-1,1]){const p=route(s,side*WIDTH/2);verts.push(p.x,p.y,p.z);}if(i<count){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}}
 const geo=r.own(new T.BufferGeometry());geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();const mat=r.material('#c2b687',{side:T.DoubleSide,roughness:.8});r.mesh(geo,mat,root);
 for(let s=0;s<LENGTH;s+=.24){for(const side of [-1,1]){const p=route(s,side*.31);r.box(root,'#61b6ab',[p.x,p.y+.018,p.z],[.035,.02,.035],{emissive:'#59b8a2',emissiveIntensity:.7});}if(Math.floor(s/.24)%3===0){const p=route(s),m=r.mesh(r.geometry('PlaneGeometry',.12,.16),r.label('↑',{width:64,height:64,font:'bold 50px sans-serif',bg:'#bdac73',color:'#244a42'}),root,[p.x,p.y+.008,p.z]);m.rotation.set(-Math.PI/2,0,Math.atan2(-p.fx,-p.fz));}}
 for(const [i,s] of [...CHECKPOINTS,LENGTH].entries()){const p=route(s);r.box(root,'#ddc47c',[p.x,p.y-.04,p.z],[.78,.07,.78]);const flag=r.mesh(r.geometry('PlaneGeometry',.48,.16),r.label(i===2?'安全區':`檢查點 ${i+1}`,{width:256,height:64,font:'bold 40px sans-serif'}),root,[p.x,p.y+.45,p.z]);r.box(root,'#425f54',[p.x-.25,p.y+.24,p.z],[.02,.48,.02]);}
 const end=route(LENGTH);r.box(root,'#b49a69',[end.x,end.y-.22,end.z],[1.1,.4,.8]);
 const liquid=r.mesh(r.geometry('PlaneGeometry',8.45,4.95,32,24),r.material('#739c8c',{transparent:true,opacity:.88,roughness:.3,metalness:.2,side:T.DoubleSide}),root,[0,.22,-.5]);liquid.rotation.x=-Math.PI/2;const base=liquid.geometry.attributes.position.array.slice();
 const leak=r.mesh(r.geometry('CylinderGeometry',.15,.25,.35,12),r.material('#81b7a0',{transparent:true,opacity:.8}),root,[-.6,.4,1]);
 const player=new T.Group();root.add(player);const blobGeo=r.own(new T.SphereGeometry(1,20,12));const pos=blobGeo.attributes.position;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),l=1+.18*Math.sin(x*6+z*4);pos.setXYZ(i,x*.085*l,(y+1)*.03,z*.12*l);}blobGeo.computeVertexNormals();const blob=r.mesh(blobGeo,r.material('#8956b2',{roughness:.4}),player);
 const dragon=buildDragon(r);root.add(dragon.root);dragon.root.scale.setScalar(.15);
 const harness=r.mesh(r.geometry('TorusGeometry',.57,.045,6,20),r.material('#ccae68'),dragon.root,[0,.6,0]);harness.rotation.x=Math.PI/2;
 const ropeGeo=r.own(new T.BufferGeometry());ropeGeo.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(51),3));const rope=new T.Line(ropeGeo,r.own(new T.LineBasicMaterial({color:'#e4b756'})));rope.frustumCulled=false;root.add(rope);
 const packs=state.goods.map(g=>{const group=new T.Group();root.add(group);if(g.kind==='drink'){r.mesh(r.geometry('CylinderGeometry',.055,.055,.19,10),r.material('#548b9c'),group,[0,.1,0]);r.cylinder(group,'#eee7ca',[0,.2,0],.04,.02);}else r.box(group,'#d7ac65',[0,.08,0],[.13,.16,.08]);r.mesh(r.geometry('PlaneGeometry',.085,.05),r.label(g.kind==='drink'?'醇乳':'脆餅',{width:128,height:64,font:'bold 40px sans-serif'}),group,[0,.1,.057]);return group;});
 const look=new T.Vector3(),target=new T.Vector3();let fx=0,fz=-1;
 function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
 function pose(dt,clock,snap=false){
  const p=route(state.s,state.offset),d=route(state.dragonS,state.dragonOffset);
  player.position.set(p.x,p.y+.012,p.z);player.rotation.y=Math.atan2(-p.fx,-p.fz);blob.scale.set(1,1+Math.sin(clock*5)*.035,1+state.speed*.6);
  dragon.update(clock,{allowIdleEmote:false});dragon.root.position.set(d.x,d.y+.012,d.z);dragon.root.rotation.y=Math.atan2(-d.fx,-d.fz);
  const a=ropeGeo.attributes.position;for(let i=0;i<17;i++){const t=i/16;a.setXYZ(i,p.x+(d.x-p.x)*t,p.y+.04+(d.y+.10-p.y-.04)*t-Math.sin(t*Math.PI)*.025,p.z+(d.z-p.z)*t);}a.needsUpdate=true;
  packs.forEach((m,i)=>{const g=state.goods[i],p=route(g.s,g.offset),age=g.age;m.visible=!g.hit||age<1.15;const side=g.offset>=0?1:-1;m.position.set(p.x+(g.hit?p.fz*side*age*.7:0),p.y+(g.hit?.75*age-.5*age*age:0),p.z-(g.hit?p.fx*side*age*.7:0));m.rotation.set(g.hit?age*5:0,g.hit?age*3:0,g.hit?side*age*4:0);});
  liquid.position.y=state.liquid;const lp=liquid.geometry.attributes.position;for(let i=0;i<lp.count;i++)lp.setZ(i,base[i*3+2]+Math.sin(base[i*3]*4+clock*1.4)*.006);lp.needsUpdate=true;
  leak.scale.y=.8+Math.sin(clock*3)*.12;leak.visible=state.running;hatch.visible=true;
  const dir=route(Math.min(LENGTH,state.s+.25)),alpha=snap?1:1-Math.exp(-dt*3);fx+=(dir.fx-fx)*alpha;fz+=(dir.fz-fz)*alpha;const len=Math.hypot(fx,fz)||1,portrait=camera.aspect<1,back=portrait?1.85:1.5;
  const cx=p.x*.6+d.x*.4,cz=p.z*.6+d.z*.4;
  // Stay inside the open dollhouse and frame both characters, even across ramps.
  target.set(cx-fx/len*back,Math.max(p.y,d.y)+(portrait?1.65:1.2),cz-fz/len*back);
  target.x=T.MathUtils.clamp(target.x,-4.1,4.1);target.z=T.MathUtils.clamp(target.z,-2,3.8);
  camera.position.lerp(target,snap?1:1-Math.exp(-dt*6));look.set(cx+fx/len*.35,(p.y+d.y)/2+.08,cz+fz/len*.35);camera.lookAt(look);
 }
 resize();return {resize,pose,render:()=>renderer.render(scene,camera)};
}
