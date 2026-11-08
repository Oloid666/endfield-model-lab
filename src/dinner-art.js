import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
function batchParts(root,r){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),groups=new Map();
 root.traverse(n=>{if(!n.isMesh||n.isInstancedMesh||n.userData.dynamic||Array.isArray(n.material)||n.material.map)return;const a=groups.get(n.material)||[];a.push(n);groups.set(n.material,a);});
 for(const [material,parts]of groups){if(parts.length<2)continue;const gs=parts.map(n=>{const g=n.geometry.index?n.geometry.toNonIndexed():n.geometry.clone();g.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,n.matrixWorld));return g;});const merged=mergeGeometries(gs,false);for(const g of gs)g.dispose();if(!merged)continue;const mesh=r.mesh(r.own(merged),material,root);mesh.name='dinner-material-batch';for(const n of parts)n.removeFromParent();}
}

// Original, deterministic 3D food. One resource cache per world, no model downloads.
const kitchens=new WeakMap();
function kitchen(r){
 if(kitchens.has(r))return kitchens.get(r);
 const geometries=new Map(),get=(key,make)=>{if(!geometries.has(key))geometries.set(key,r.own(make()));return geometries.get(key);};
 const rounded=(w,h,d,rad=.006)=>get(['round',w,h,d,rad].join(),()=>new RoundedBoxGeometry(w,h,d,2,Math.min(rad,h*.45)));
 const sphere=r.geometry('SphereGeometry',1,12,8),grain=r.geometry('SphereGeometry',1,8,6);
 const mat=(color,roughness=.65,extra={})=>r.material(color,{roughness,...extra});
 const m={ivory:mat('#e7ddc5',.48),paper:mat('#ebe1c7',.86),tray:mat('#24483e',.43),gold:mat('#ba9b58',.38,{metalness:.45}),rim:mat('#6b7963',.55),rice:mat('#fff5d6',.78),chicken:mat('#bd6928',.31),cut:mat('#d8ac79',.70),char:mat('#58331d',.8),green:mat('#345b2b',.84),leaf:mat('#627e35',.75),carrot:mat('#dc752e',.64),egg:mat('#fff0c9',.67),yolk:mat('#e9a82f',.45),sesame:mat('#e6c78b',.82),soup:mat('#ae7548',.48),lid:mat('#294b3d',.42)};
 const labels=new Map();
 function label(kind){
  if(labels.has(kind))return labels.get(kind);
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const c=canvas.getContext('2d');
  c.fillStyle=kind==='xaihi'?'#e8e0c8':'#eddfba';c.fillRect(0,0,1024,128);c.fillStyle=kind==='xaihi'?'#564361':'#25483c';c.fillRect(0,0,1024,15);
  c.textAlign='center';c.textBaseline='middle';c.font='bold 24px sans-serif';c.fillText(kind==='xaihi'?'夜班補給 · 咖哩雞便當':'夜班特選 · 雙主菜',512,25);
  c.font=kind==='zhuang'?'bold 56px sans-serif':'bold 78px sans-serif';c.fillText(kind==='tray'?'武陵夜班 · 好好吃飯':kind==='zhuang'?'照燒雞腿 × 炙燒鮭魚':'800 W / 3 分鐘',512,84);
  const map=r.own(new T.CanvasTexture(canvas));map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const material=r.own(new T.MeshStandardMaterial({map,roughness:.83,metalness:0}));labels.set(kind,material);return material;
 }
 const api={rounded,sphere,grain,m,label,get};kitchens.set(r,api);return api;
}
function randomStream(seed){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}

export function buildBento(r,parent,{variant='zhuang'}={}){
 const k=kitchen(r),{m}=k,root=new T.Group();root.name=variant+'-crafted-bento';parent.add(root);
 const isX=variant==='xaihi',shell=r.material(isX?'#46404a':'#263c34',{roughness:.42});
 const mesh=(geo,mat,p,s=[1,1,1],owner=root)=>r.mesh(geo,mat,owner,p,s);
 // Closed underside, moulded feet and a raised rim remain visible from below/side.
 mesh(k.rounded(.30,.024,.19,.007),shell,[0,.012,0]);
 for(const z of [-.091,.091])mesh(k.rounded(.286,.015,.009,.003),shell,[0,.030,z]);
 for(const x of [-.146,.146])mesh(k.rounded(.009,.015,.178,.003),shell,[x,.030,0]);
 mesh(k.rounded(.276,.006,.164,.002),isX?m.paper:m.ivory,[0,.027,0]);
 for(const x of [-.11,.11])for(const z of [-.065,.065])mesh(k.rounded(.025,.006,.015,.002),shell,[x,-.002,z]);
 for(const x of [-.09,-.045,0,.045,.09])mesh(k.rounded(.002,.002,.12,.0006),shell,[x,-.001,0]);
 // Front label is bonded to the box, rather than a freestanding piece of paper.
 const label=mesh(r.geometry('PlaneGeometry',.258,.034),k.label(variant),[0,.018,.096]);label.name='bento-packaging-heating-label';
 const labelPoint=new T.Object3D();labelPoint.position.set(0,.020,.099);root.add(labelPoint);
 if(!isX){
  for(const z of [-.092,.092])mesh(k.rounded(.286,.002,.002,.0005),m.gold,[0,.038,z]);
  mesh(k.rounded(.003,.018,.164,.001),shell,[-.021,.037,0]);
  mesh(k.rounded(.160,.014,.003,.001),shell,[.063,.035,.001]);
 }
 const solids=new T.Group();solids.name='crafted-bento-ingredients';root.add(solids);
 const riceMat=r.own(m.rice.clone()),meatMat=r.own(m.chicken.clone()),vegMat=r.own(m.green.clone()),eggMat=r.own(m.egg.clone()),yolkMat=r.own(m.yolk.clone()),accentMat=r.own(m.carrot.clone());
 const leafMat=r.own(m.leaf.clone()),sesameMat=r.own(m.sesame.clone()),charMat=r.own(m.char.clone());
 const dynamicMaterials=[riceMat,meatMat,vegMat,eggMat,yolkMat,accentMat,leafMat,sesameMat,charMat],original=dynamicMaterials.map(x=>x.color.clone());
 const add=(geo,mat,p,s=[1,1,1])=>mesh(geo,mat,p,s,solids);
 const protein=new T.Group();protein.name='thick-teriyaki-chicken';solids.add(protein);protein.position.set(...(isX?[.046,.041,-.020]:[.028,.043,-.044]));protein.scale.set(...(isX?[1,1,1]:[.82,1.30,.70]));
 const meat=(g,m,p,s=[1,1,1])=>mesh(g,m,p,s,protein);
 // Rice mound + many rounded individual grains; all grains share one draw.
 add(k.sphere,riceMat,[-.078,.042,-.005],[.060,.017,.075]);
 const rice=r.own(new T.InstancedMesh(k.grain,riceMat,180));rice.name='rounded-rice-grains';solids.add(rice);
 const dummy=new T.Object3D(),rng=randomStream(isX?71131:71187),color=new T.Color();
 for(let i=0;i<180;i++){
  const a=rng()*Math.PI*2,rad=Math.sqrt(rng()),x=Math.cos(a)*rad,z=Math.sin(a)*rad;
  dummy.position.set(-.078+x*.056,.043+Math.sqrt(Math.max(0,1-rad*rad))*.015+rng()*.005,-.005+z*.068);dummy.rotation.set(rng()*.5,rng()*Math.PI,rng()*.4);dummy.scale.set(.0021,.0019,.0050+rng()*.0017);dummy.updateMatrix();rice.setMatrixAt(i,dummy.matrix);color.setRGB(.88+rng()*.12,.88+rng()*.10,.82+rng()*.15);rice.setColorAt(i,color);
 }
 rice.instanceMatrix.needsUpdate=true;rice.computeBoundingSphere();
 // A closed, irregular fillet with a browned skin top and a warm cut edge.
 const fillet=k.get('fillet',()=>{
  const g=new T.SphereGeometry(1,28,16),p=g.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),edge=1+.06*Math.sin(z*8+x*3);p.setXYZ(i,x*.055*edge,y*.015+.012,z*.060*(1+.06*Math.sin(x*7)));color.set(y>.25?'#b67b36':y>-.15?'#874622':'#ddb181');color.multiplyScalar(.75+.25*Math.sin(x*19+z*13)**2);colors.push(color.r,color.g,color.b);}
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
 });
 const skin=r.own(new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.35}));dynamicMaterials.push(skin);original.push(skin.color.clone());
 const chicken=meat(fillet,skin,[0,0,0]);chicken.rotation.y=-.10;
 for(let i=0;i<4;i++){
  const x=.012+i*.022;const cut=meat(k.rounded(.002,.009,.083,.0007),meatMat,[x-.046,.017,.002]);cut.rotation.z=.1;cut.rotation.y=-.10;
 }
 // Thin charred grill lines conform to the curved skin, not painted black bars.
 for(let i=0;i<5;i++){
  const x=-.039+i*.018,points=[];for(let j=0;j<7;j++){const z=-.037+j*.012;points.push(new T.Vector3(x,.0125+Math.sqrt(Math.max(0,1-(x/.055)**2-(z/.060)**2))*.015,z));}
  const g=k.get('grill-'+i,()=>new T.TubeGeometry(new T.CatmullRomCurve3(points),6,.0008,4,false));const n=meat(g,charMat,[0,0,0]);n.rotation.y=-.10;
 }
 // Broccoli has clustered florets, a stem and leaf silhouettes.
 for(let i=0;i<(isX?3:2);i++){
  const x=isX?.015+i*.039:.083+i*.035,z=isX?.057+(i%2)*.005:.067;add(k.rounded(.010,.018,.010,.003),leafMat,[x,.042,z]);
  for(let j=0;j<5;j++){const a=j*2.4;add(k.sphere,vegMat,[x+Math.cos(a)*.009,.054+(j%2)*.004,z+Math.sin(a)*.008],[.011,.010,.011]);}
 }
 for(let i=0;i<2;i++){const c=add(r.geometry('CylinderGeometry',.014,.014,.005,12),accentMat,[.113,.046,-.056+i*.027]);c.rotation.z=.15;}
 // Half egg: a real cut white with a slightly recessed glossy yolk.
 add(k.sphere,eggMat,isX?[.112,.047,.012]:[.010,.047,.054],[.024,.014,.030]);add(k.sphere,yolkMat,isX?[.112,.059,.012]:[.010,.059,.054],[.014,.0035,.017]);
 const sesame=r.own(new T.InstancedMesh(k.grain,sesameMat,28));protein.add(sesame);
 for(let i=0;i<28;i++){const x=-.038+rng()*.076,z=-.035+rng()*.070;dummy.position.set(x*Math.cos(-.1)+z*Math.sin(-.1),.0128+Math.sqrt(Math.max(0,1-(x/.055)**2-(z/.060)**2))*.015,-x*Math.sin(-.1)+z*Math.cos(-.1));dummy.rotation.set(0,rng()*6.28,.2);dummy.scale.set(.0009,.0007,.0020);dummy.updateMatrix();sesame.setMatrixAt(i,dummy.matrix);}sesame.instanceMatrix.needsUpdate=true;sesame.computeBoundingSphere();
 if(!isX){
  // The second main has its own skin edge, volume, fat marbling and toasted surface.
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle='#e5a071';c.fillRect(0,0,256,128);
  c.lineCap='round';for(let i=-4;i<14;i++){c.strokeStyle=i%3===0?'#f8d9b0':'#f1bf8d';c.lineWidth=3+(i%2);c.beginPath();c.moveTo(i*26,-8);c.quadraticCurveTo(i*26-20,64,i*26-22,136);c.stroke();}
  for(let i=0;i<35;i++){c.fillStyle=i%2?'#a86a3c':'#c17c45';c.fillRect((i*71)%250,(i*29)%122,2,3);}
  const map=r.own(new T.CanvasTexture(canvas));map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const fishMat=r.own(new T.MeshStandardMaterial({map,color:'#ffe5c1',roughness:.30})),skinMat=r.material('#667062',{roughness:.45});dynamicMaterials.push(fishMat);original.push(fishMat.color.clone());
  const fish=add(k.rounded(.069,.018,.043,.006),fishMat,[.087,.050,.025]);fish.name='seared-salmon-main';fish.rotation.y=-.10;
  const fishSkin=add(k.rounded(.069,.004,.043,.0015),skinMat,[.087,.040,.025]);fishSkin.rotation.y=-.10;
  for(let i=0;i<2;i++)add(k.rounded(.015,.013,.027,.004),yolkMat,[.040+i*.016,.045,.059]);
  // A few nori flakes and scallions replace uniform decoration with deliberate accents.
  for(let i=0;i<12;i++){const fleck=add(k.rounded(.002,.0007,.005,.00025),leafMat,[-.102+(i%4)*.015,.060+Math.sin(i)*.001,-.040+Math.floor(i/4)*.029]);fleck.rotation.y=i*1.7;}
 }
 if(isX){const sauce=add(k.sphere,r.material('#ad803c',{roughness:.42}),[.047,.039,-.016],[.066,.006,.067]);sauce.name='curry-sauce';dynamicMaterials.push(sauce.material);original.push(sauce.material.color.clone());}
 const originalRoughness=dynamicMaterials.map(mat=>mat.roughness);
 batchParts(solids,r);solids.traverse(n=>{if(n.isMesh)n.userData.dynamic=true;});batchParts(root,r);
 // Keep the deforming ingredients separate from the package on later static passes.
 root.traverse(n=>{if(n.isMesh)n.userData.dynamic=true;});
 const burnt=new T.Color('#29231c'),purple=new T.Color('#694084'),warmRice=new T.Color('#e8d4aa');
 return {root,solids,label,labelPoint,materials:dynamicMaterials,
  cook(heat=0,charred=0,fusion=0){for(let i=0;i<dynamicMaterials.length;i++){const mat=dynamicMaterials[i];mat.color.copy(original[i]);if(i===0)mat.color.lerp(warmRice,heat*.20);mat.color.lerp(burnt,charred).lerp(purple,fusion);mat.roughness=T.MathUtils.lerp(originalRoughness[i],.94,charred);}},
 };
}

export function buildDinnerTray(r,parent){
 const k=kitchen(r),{m}=k,root=new T.Group();root.name='crafted-dinner-tray';parent.add(root);
 const add=(g,mat,p,s=[1,1,1])=>r.mesh(g,mat,root,p,s);
 add(k.rounded(.52,.040,.25,.009),m.tray,[.025,0,0]);
 for(const z of [-.119,.119])add(k.rounded(.49,.008,.005,.0018),m.gold,[.025,.020,z]);
 for(const x of [-.225,.275])add(k.rounded(.005,.008,.23,.0018),m.gold,[x,.020,0]);
 for(const x of [-.18,.23])for(const z of [-.085,.085])add(k.rounded(.025,.005,.018,.0015),m.rim,[x,-.022,z]);
 for(const z of [-.065,0,.065])add(k.rounded(.39,.002,.003,.0006),m.rim,[.025,-.0205,z]);
 const seal=add(r.geometry('PlaneGeometry',.10,.026),k.label('tray'),[.025,-.022,0]);seal.rotation.x=Math.PI/2;
 const bento=buildBento(r,root);bento.root.position.set(-.066,.025,-.009);bento.root.scale.set(1.06,1,1.06);
 // Sealed chopsticks sit in the front lip, clear of both food and cup.
 for(const z of [.105,.111])add(k.rounded(.29,.004,.003,.001),m.soup,[-.035,.026,z]);
 add(k.rounded(.235,.007,.014,.002),m.paper,[-.045,.029,.108]);
 for(const x of [-.142,.051])add(k.rounded(.003,.001,.014,.0004),m.gold,[x,.033,.108]);
 const bowl=new T.Group();bowl.name='lidded-hot-soup';bowl.position.set(.19,.022,.005);root.add(bowl);
 const profile=[[0,0],[.030,0],[.037,.006],[.058,.086],[.060,.094],[.056,.098],[.052,.090],[.032,.011],[0,.011]].map(p=>new T.Vector2(...p));
 r.mesh(k.get('soup-bowl',()=>new T.LatheGeometry(profile,28)),m.soup,bowl);
 for(const y of [.012,.087]){const ring=r.mesh(r.geometry('TorusGeometry',y<.02?.035:.056,.002,6,28),m.gold,bowl,[0,y,0]);ring.rotation.x=Math.PI/2;}
 r.mesh(r.geometry('CylinderGeometry',.060,.059,.009,28),m.lid,bowl,[0,.099,0]);
 const lidRing=r.mesh(r.geometry('TorusGeometry',.047,.0015,6,28),m.gold,bowl,[0,.105,0]);lidRing.rotation.x=Math.PI/2;
 const stamp=r.mesh(r.geometry('CircleGeometry',.029,24),r.label('熱湯',{width:256,height:256,font:'bold 88px sans-serif',bg:'#dfc58c',color:'#26473b'}),bowl,[0,.104,0]);stamp.rotation.x=-Math.PI/2;
 for(const x of [-.012,0,.012])r.mesh(r.geometry('CircleGeometry',.0015,6),m.rim,bowl,[x,.105,-.037]).rotation.x=-Math.PI/2;
 batchParts(root,r);root.traverse(n=>{if(n.isMesh)n.userData.dynamic=true;});
 return {root,bento,bowl};
}
