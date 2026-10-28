import * as T from 'three';
import { createSurfaces } from './surfaces.js';
import { makeThinGlass } from './glass.js';
import { buildInterior } from './interior.js';
import { buildTrees } from './trees.js';
import { buildAutomaticDoors } from './auto-doors.js';
import { buildStreetProps } from './street-props.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {collectBuildingPart,makeDestructibleStore} from './destructible-store.js';

// Original street set. Repeated products, tiles and frames share resources.
export function buildStore(scene, r) {
  const root = new T.Group();scene.add(root);
  const surfaces=createSurfaces(r),buildingParts={};let section;
  const wetMaterials=new Set();
  const B=(c,p,s,o={})=>{
    let options=o,color=c;
    if(['#637774','#6a807a','#293e43'].includes(c)){options={...surfaces.wall,...o};color=c==='#293e43'?'#78828a':'#d4d0c4';}
    else if(['#64716d','#d2c7a6'].includes(c)){options={...surfaces.pavement,...o};color='#d3d5d0';}
    else if(['#193739','#304c48'].includes(c)){options={roughness:.29,metalness:.42,...o};}
    else if(c==='#9a7953'){options={...surfaces.timber,...o};color='#c4b090';}
    const mesh=r.box(root,color,p,s,options);
    if((['#64716d','#d2c7a6','#a1a79a','#92988e','#4c5b57','#4b5c59'].includes(c))&&p[1]<.31){mesh.material.userData.wetPavement=true;wetMaterials.add(mesh.material);}
    return mesh;
  };
  const text=(str,p,s,options={},rotation=0)=>{const m=r.mesh(r.geometry('PlaneGeometry',1,1),r.label(str,options),root,p,s);m.rotation.y=rotation;return m;};
  const dark='#193739', wall='#637774', trim='#a3afa0', cream='#c7c4ac', green='#155b42';
  // Island, pavements, drains and a complete enclosed building.
  B('#293e44',[0,-.22,1],[23,.4,28],{roughness:.35});
  B('#64716d',[0,.015,-.1],[13.7,.32,10]);
  // Both crossing landings have a curb opening and a sloped approach.
  B('#a1a79a',[-6.65,.13,4.87],[.5,.22,.18]);B('#a1a79a',[1.38,.13,4.87],[11.05,.22,.18]);
  B('#64716d',[0,.015,12.65],[23,.32,2.1]);
  B('#a1a79a',[-8.95,.13,11.65],[5.1,.22,.18]);B('#a1a79a',[3.67,.13,11.65],[15.65,.22,.18]);
  for(const [z,tilt] of [[4.82,.22],[11.72,-.22]]){const ramp=B('#92988e',[-5.25,.09,z],[2.16,.1,.72],{roughness:.68});ramp.rotation.x=tilt;}

  B('#d2c7a6',[0,.24,2.5],[9.2,.14,2.25]);
  for(let i=0;i<20;i++)B('#4c5b57',[-6.6+i*.7,.184,3.5],[.018,.006,2.7]);
  for(const z of [2.1,2.8,3.5,4.2])B('#4b5c59',[0,.186,z],[13.4,.006,.012]);
  B('#293638',[.4,.205,4.55],[9,.025,.22]);
  for(let i=0;i<75;i++){const x=-4.8+i*.13;if(x>-6.4&&x<-4.1)continue;B('#85928b',[x,.224,4.55],[.035,.008,.2]);}
  // Main shop shell. Its interior remains readable through open display bays.
  section=new Set(root.children);
  B(wall,[0,1.8,-3.13],[8.8,3.25,.24]);
  B(wall,[-4.3,1.8,-.72],[.22,3.25,4.7]);
  B(wall,[4.3,.46,-.72],[.22,.34,4.7]);
  B(wall,[4.3,3.01,-.72],[.22,.6,4.7]);
  for(const z of [-3.02,-1.5,0,1.6])B(dark,[4.3,1.68,z],[.13,2.16,.065],{metalness:.45,roughness:.3});
  B('#d4c8a7',[0,.24,-.72],[8.5,.13,4.7]);
  const upperFloorSlab=B('#d2c9ac',[0,3.31,-.72],[8.8,.16,5]);
  // Interior floor tiles.
  for(let x=-4;x<=4;x+=.8)B('#938e77',[x,.311,-.7],[.015,.004,4.7]);
  for(let z=-2.9;z<1.7;z+=.8)B('#938e77',[0,.311,z],[8.5,.004,.015]);
  collectBuildingPart(root,buildingParts,'structure',section);section=new Set(root.children);
  // Hollow upper floor: the centre window opens onto a real server room.
  B('#6a807a',[0,4.5,-3.12],[8.8,2.2,.22]);
  for(const x of [-4.29,4.29])B('#6a807a',[x,4.5,-.73],[.22,2.2,4.95]);
  B('#6a807a',[0,3.51,-.73],[8.8,.12,4.95]);
  B('#6a807a',[0,3.75,1.76],[8.8,.53,.22]);
  B('#6a807a',[0,5.34,1.76],[8.8,.52,.22]);
  for(const [x,width]of [[-4.075,.65],[-1.425,1.05],[1.425,1.05],[4.075,.65]])B('#6a807a',[x,4.57,1.76],[width,1.1,.22]);
  B(dark,[0,3.55,1.78],[8.95,.2,.2]);
  B(dark,[0,5.55,1.78],[8.95,.18,.2]);
  for(const x of [-4.25,-1.65,1.65,4.25])B('#304c48',[x,4.55,1.79],[.12,1.95,.15]);
  for(const x of [-2.85,0,2.85]){
    if(x!==0){B('#273d3a',[x,4.58,1.795],[1.8,1.28,.12]);B('#e2d0ad',[x,4.58,1.86],[1.64,1.13,.025],{map:surfaces.windowMap,emissiveMap:surfaces.windowMap,emissive:0xffdba2,emissiveIntensity:.65,roughness:.7});}
    for(const dx of [-.55,0,.55])B(dark,[x+dx,4.58,1.9],[.045,1.17,.04]);
    B(dark,[x,4.58,1.9],[1.7,.05,.04]);
    if(x!==0)for(let i=0;i<6;i++)B(i%2?'#a89f86':'#8e8875',[x+.31+i*.075,4.57,1.915],[.04,1.08,.025],{roughness:.96});
    B('#50645c',[x,3.87,1.97],[2,.16,.35]);
  }
  // Decorative corner trims and side lattice.
  for(const x of [-4.42,4.42])B('#2e4846',[x,4.5,-.73],[.12,2.17,4.97]);
  B('#38544f',[4.49,4.55,-.5],[.06,1.1,2.4]);
  for(let z=-1.6;z<.8;z+=.3)B('#779187',[4.535,4.55,z],[.02,1,.04]);
  collectBuildingPart(root,buildingParts,'upper',section);section=new Set(root.children);
  // Weathered flat roof, parapets, railings and utility tank.
  B('#354246',[0,5.72,-.74],[9.2,.25,5.4],{roughness:.65});
  B('#6a807a',[0,5.94,-3.37],[9.1,.34,.14]);
  B('#6a807a',[-4.52,5.94,-.74],[.14,.34,5.4]);
  for(const z of [1.94,-3.4]){
    B('#34413f',[0,6.35,z],[9.1,.045,.045],{metalness:.6,roughness:.32});
    B('#34413f',[0,6.02,z],[9.1,.035,.035],{metalness:.6,roughness:.32});
    for(let x=-4.5;x<=4.5;x+=.36)B('#34413f',[x,6.18,z],[.027,.67,.027],{metalness:.6,roughness:.32});
  }
  // Two refined stainless tanks, screened by a slatted utility enclosure.
  for(const tx of [1.15,2.2]){
    const foot=r.cylinder(root,'#536665',[tx,5.98,-1.7],.49,.18,{metalness:.55,roughness:.35});
    const geo=r.own(new T.LatheGeometry([new T.Vector2(0,0),new T.Vector2(.37,0),new T.Vector2(.44,.1),new T.Vector2(.45,.2),new T.Vector2(.45,1.2),new T.Vector2(.41,1.3),new T.Vector2(.28,1.38),new T.Vector2(0,1.39)],32));
    r.mesh(geo,r.material('#a4b5ac',{metalness:.8,roughness:.24}),root,[tx,6.04,-1.7]);
    for(const y of [6.25,6.7,7.12])r.cylinder(root,'#71877f',[tx,y,-1.7],.459,.022,{metalness:.8,roughness:.22});
    r.cylinder(root,'#bac4b6',[tx,7.45,-1.7],.15,.04,{metalness:.7,roughness:.27});
    r.cylinder(root,'#798e84',[tx+.32,6.02,-1.8],.035,.26,{metalness:.6,roughness:.35});
  }
  B('#5c6865',[-2.1,6.1,-1.5],[1.9,.6,1.4],{roughness:.8});
  for(let z=-2.1;z<-1;z+=.15)B('#293737',[-2.1,6.41,z],[1.65,.03,.04]);
  for(const x of [-.1,3.32])B('#3d5a52',[x,6.58,-1.7],[.045,1.35,2.3],{metalness:.4,roughness:.48});
  for(let y=6.05;y<7.22;y+=.12)B('#607b6b',[1.61,y,-.55],[3.5,.055,.045],{metalness:.4,roughness:.5});
  collectBuildingPart(root,buildingParts,'roof',section);section=new Set(root.children);
  // A continuous fluorescent lightbox, accurate band proportions and inset logo.
  B('#c8d0bd',[0,3.1,1.96],[9.18,.7,.4],{metalness:.28,roughness:.35});
  B('#ecefe0',[0,3.1,2.167],[9.03,.59,.015],{emissive:0xe2eacb,emissiveIntensity:1.25,roughness:.25});
  const stripes=[['#ee812d',3.285],['#158151',3.102],['#d84636',2.925]];
  for(const [c,y] of stripes){
    B(c,[0,y,2.181],[9.02,.116,.008],{emissive:new T.Color(c),emissiveIntensity:1.15,roughness:.3});
    B(c,[4.595,y,-.55],[.018,.116,5.35],{emissive:new T.Color(c),emissiveIntensity:1.1});
    B(c,[-4.595,y,-.55],[.018,.116,5.35],{emissive:new T.Color(c),emissiveIntensity:.5});
  }
  function logoMaterial(tall=false){
    const canvas=document.createElement('canvas');canvas.width=tall?768:1536;canvas.height=tall?1792:384;const c=canvas.getContext('2d');
    c.fillStyle='#f6f5e8';c.fillRect(0,0,canvas.width,canvas.height);
    // The familiar cut seven is drawn as a vector silhouette, not a font glyph.
    const ox=tall?70:55,oy=tall?90:16,scale=tall?.92:.58;
    c.save();c.translate(ox,oy);c.scale(scale,scale);
    c.fillStyle='#ed7a23';c.beginPath();c.moveTo(78,24);c.lineTo(610,24);c.lineTo(610,138);c.lineTo(315,138);c.lineTo(315,201);c.lineTo(78,201);c.closePath();c.fill();
    c.fillStyle='#d24a35';c.beginPath();c.moveTo(345,160);c.lineTo(580,160);c.lineTo(402,562);c.lineTo(210,562);c.closePath();c.fill();
    c.fillStyle='#f6f5e8';c.fillRect(18,205,650,109);c.fillStyle='#087d4d';c.textAlign='center';c.font='900 105px Arial';c.fillText('ELEVEN',349,290);c.restore();
    if(!tall){c.fillStyle='#176d4b';c.textAlign='left';c.font='bold 132px Arial';c.fillText('7-ELEVEN',565,187);c.font='40px sans-serif';c.fillStyle='#637563';c.fillText('OPEN 24 HOURS',570,266);}
    else{c.fillStyle='#d74436';c.fillRect(32,955,704,780);c.fillStyle='#fbf5e2';c.textAlign='center';c.font='bold 175px Arial';c.fillText('ATM',384,1280);c.font='58px sans-serif';c.fillText('24H · 每一刻都在',384,1480);}
    const map=r.own(new T.CanvasTexture(canvas));map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
    return r.own(new T.MeshStandardMaterial({map,emissiveMap:map,emissive:0xffffff,emissiveIntensity:.8,roughness:.3}));
  }
  B('#f3f1df',[0,3.1,2.197],[2.73,.615,.045],{emissive:0xe1e8c8,emissiveIntensity:1});
  const mainLogo=r.mesh(r.geometry('PlaneGeometry',1,1),logoMaterial(),root,[0,3.1,2.224],[2.66,.57,1]);mainLogo.userData.salvageSign=true;mainLogo.userData.bonusSign=true;
  // Double-faced projecting lightbox and visible mounting brackets.
  for(const y of [3.58,4.77])B('#435a50',[4.78,y,1.3],[.75,.055,.07],{metalness:.6,roughness:.32});
  B('#798f7e',[5.08,4.12,1.3],[.97,2.24,.24],{metalness:.6,roughness:.3});
  B('#e9e9d7',[5.08,4.12,1.43],[.9,2.16,.025],{emissive:0xf0e8c9,emissiveIntensity:1});
  for(const [z,rotation] of [[1.451,0],[1.169,Math.PI]]){const sign=r.mesh(r.geometry('PlaneGeometry',1,1),logoMaterial(true),root,[5.08,4.12,z],[.87,2.11,1]);sign.rotation.y=rotation;sign.userData.interactiveLight=true;}
  collectBuildingPart(root,buildingParts,'sign',section);section=new Set(root.children);
  // Canopy with an illuminated underside. Slender supports frame the actors.
  B('#24332f',[0,2.79,2.23],[9.65,.09,1.28],{roughness:.24,metalness:.35});
  B('#49746a',[0,2.7,2.87],[9.72,.12,.08],{roughness:.3});
  B('#ced6bc',[0,2.69,2.55],[8.9,.025,.045],{emissive:0xffd69a,emissiveIntensity:.85});
  for(const x of [-4.63,4.63]){B('#314d47',[x,1.48,2.78],[.11,2.5,.11],{roughness:.45});B('#777e6d',[x,.33,2.78],[.26,.2,.26]);}
  collectBuildingPart(root,buildingParts,'structure',section);section=new Set(root.children);
  // Reflected street and neon remain visible over the warm interior.
  const glass=makeThinGlass(r,surfaces.glassBump);
  const glassMeshes=[];
  for(const [x,width] of [[-2.62,3.14],[2.4,3.3]]){
    B(dark,[x,.45,1.74],[width,.26,.18]);B(cream,[x,.59,1.79],[width,.055,.23],{metalness:.45,roughness:.3});
    glassMeshes.push(r.mesh(r.geometry('PlaneGeometry',1,1),glass,root,[x,1.65,1.84],[width,2.08,1]));
  }
  // Separate automatic entrance: the leaves slide behind the fixed display panes.
  const automaticDoors=buildAutomaticDoors(root,r,glass,glassMeshes);
  for(const x of [-4.23,-1.02,.6,4.23])B(dark,[x,1.68,1.88],[.06,2.2,.065]);
  // Illustrated window promotions are built from one shared atlas in the interior.
  const sideGlass=r.mesh(r.geometry('PlaneGeometry',1,1),glass,root,[4.43,1.65,-.72],[4.45,2.08,1]);sideGlass.rotation.y=Math.PI/2;glassMeshes.push(sideGlass);
  for(const x of [-2.85,0,2.85])glassMeshes.push(r.mesh(r.geometry('PlaneGeometry',1,1),glass,root,[x,4.58,1.95],[1.64,1.12,1]));
  collectBuildingPart(root,buildingParts,'glass',section);section=new Set(root.children);
  const floorPlan=buildInterior(root,r,surfaces,glass,glassMeshes);
  collectBuildingPart(root,buildingParts,'interior',section);section=new Set(root.children);
  buildingParts.interior.add(upperFloorSlab);
  const productColors=['#cd7849','#b4bb64','#dde0be','#b74b46','#4f927c','#b8a4c0','#dba24c'];
  // Warm ceiling strips; practical light is restrained to three real lights.
  for(const x of [-2.3,2.2])B('#fbefc3',[x,3.17,-.6],[.07,.035,3.5],{emissive:0xffe2a3,emissiveIntensity:1.1});
  const warm=new T.PointLight(0xffd8af,10,6,2);warm.position.set(-1.4,2.75,-1.1);root.add(warm);
  const doorway=new T.PointLight(0xffdfbc,7,5.5,2);doorway.position.set(2.5,2.65,-.8);root.add(doorway);
  // A single cached shadow map anchors the canopy, street furniture and trees.
  const spill=new T.SpotLight(0xffd4a0,13,10,Math.PI*.36,.65,2);spill.position.set(0,2.63,1.4);spill.target.position.set(0,.1,5.2);spill.castShadow=true;spill.shadow.mapSize.set(1024,1024);spill.shadow.camera.near=.2;spill.shadow.camera.far=14;spill.shadow.bias=-.0003;spill.shadow.normalBias=.025;spill.shadow.autoUpdate=false;spill.shadow.needsUpdate=true;root.add(spill,spill.target);
  collectBuildingPart(root,buildingParts,'interior',section);section=new Set(root.children);
  // Small wall sconces, warm pools on plaster.
  for(const x of [-3.75,3.7]){
    B('#b6a37a',[x,4.8,1.94],[.16,.36,.12],{emissive:0xffcc84,emissiveIntensity:2});
    const sconce=new T.PointLight(0xffc584,2,2.4,2);sconce.position.set(x,4.75,2.13);root.add(sconce);
  }
  // Sidewall utility details, vent, condenser and downpipe.
  const pipe=r.cylinder(root,'#4b6f65',[4.64,2.83,-2.55],.055,5.3,{metalness:.3});
  B('#3d5b54',[4.65,.32,-2.36],[.11,.11,.4]);
  collectBuildingPart(root,buildingParts,'upper',section);
  // A street bench has slatted seat and back, cast legs, armrests and real fasteners.
  const bench=new T.Group();bench.position.set(2.75,.25,2.65);root.add(bench);
  for(const z of [-.22,-.075,.075,.22])r.box(bench,'#9a7953',[0,.52,z],[2,.075,.125],{...surfaces.timber,roughness:.5});
  for(const y of [.75,.95,1.15])r.box(bench,'#9a7953',[0,y,-.24],[2,.115,.065],{...surfaces.timber,roughness:.53});
  for(const x of [-.78,.78]){
    r.box(bench,'#31443b',[x,.28,0],[.075,.5,.47],{metalness:.55,roughness:.4});
    r.box(bench,'#31443b',[x,.83,-.27],[.075,.77,.075],{metalness:.55,roughness:.4});
    r.box(bench,'#31443b',[x,.77,.02],[.065,.055,.56],{metalness:.55,roughness:.4});
    r.box(bench,'#31443b',[x,.66,.25],[.065,.22,.065],{metalness:.55,roughness:.4});
    for(const z of [-.2,.2])r.cylinder(bench,'#92a18e',[x,.563,z],.014,.004,{metalness:.7,roughness:.25});
  }
  B('#bba578',[3.25,1.01,2.61],[.38,.48,.25]);
  const handle=r.mesh(r.geometry('TorusGeometry',.1,.014,5,14),r.material('#bba578'),root,[3.25,1.29,2.61]);
  r.cylinder(root,'#e5d0a6',[2.7,.91,2.62],.09,.22);r.cylinder(root,'#3c4338',[2.7,1.025,2.62],.096,.024);
  // Outdoor shopboard.
  const board=new T.Group();board.position.set(-3.35,.22,2.95);board.rotation.y=.18;root.add(board);
  r.box(board,'#a48a5e',[0,.6,0],[.8,1.12,.1]);
  const bm=r.mesh(r.geometry('PlaneGeometry',1,1),r.label('熱的，剛剛好。',{width:512,height:1024,font:'40px sans-serif',bg:'#183f35',color:'#e8d6a9'}),board,[0,.61,.056],[.67,.96,1]);
  r.box(board,'#896c49',[-.32,.12,-.25],[.07,.3,.65]);r.box(board,'#896c49',[.32,.12,-.25],[.07,.3,.65]);
  // Side vending machine, bins, parcels.
  B('#405a53',[-5.2,1.18,.65],[.85,1.95,.78]);
  B('#d9d5b6',[-5.2,1.35,1.05],[.69,1.12,.025],{emissive:0xd8c58e,emissiveIntensity:.38});
  text('DRINK',[-5.2,2.02,1.06],[.7,.23,1],{font:'bold 62px Arial',height:128,bg:'#405a53',color:'#e5d9af'});
  for(let x=0;x<3;x++)for(let y=0;y<3;y++)B(productColors[(x+y)%7],[-5.42+x*.22,.98+y*.27,1.083],[.11,.2,.015]);
  B('#263933',[-5.2,.53,1.06],[.52,.18,.03]);

  buildTrees(root,r);
  // Crossing runs across the front road, from z=4.9 to z=11.65.
  for(let i=0;i<9;i++)B('#c8c9b9',[-5.25,-.004,5.38+i*.69],[2.1,.012,.34],{roughness:.6});
  for(const x of [-9,-.9,4.5,9.7])B('#b6b6a2',[x,-.004,8.28],[2.2,.012,.065],{roughness:.55});
  for(const x of [-6.5,6.5]){r.cylinder(root,'#293f42',[x,.72,4.1],.065,1.1,{metalness:.3});r.cylinder(root,'#ccbc83',[x,1.02,4.1],.067,.08);}
  const lamp=new T.Group();lamp.position.set(-6.35,.2,3.4);root.add(lamp);
  r.cylinder(lamp,'#304b4a',[0,2.7,0],.065,5.4,{metalness:.5});
  r.box(lamp,'#304b4a',[.4,5.32,0],[.85,.09,.09]);r.box(lamp,'#e5d8ae',[.73,5.24,0],[.5,.08,.25],{emissive:0xffdca4,emissiveIntensity:3});
  const lampLight=new T.PointLight(0xffd49b,11,8,2);lampLight.position.set(.73,4.9,0);lamp.add(lampLight);
  // Background volumes make rotations show a complete street instead of a facade.
  for(const [x,z,w,h,d] of [[-8,-5,4,7,5],[6.8,-6.7,4.5,8,4],[0,-8.5,7,6,3]]){
    B('#293e43',[x,h/2-.1,z],[w,h,d]);B('#23393c',[x,h+.05,z],[w+.3,.18,d+.3]);
    for(let y=2;y<h-1;y+=1.7)for(let dx=-w/2+.6;dx<w/2;dx+=1.3)B('#607b70',[x+dx,y,z+d/2+.02],[.55,.75,.025],{emissive:0x70876a,emissiveIntensity:((y+dx)%3)>.8?.13:0});
  }
  const streetProps=buildStreetProps(root,r,surfaces);
  // Fine utility cables frame the back street.
  for(const z of [-3.7,-3.9]){
    const curve=new T.QuadraticBezierCurve3(new T.Vector3(-10,7,z),new T.Vector3(0,5.4,z),new T.Vector3(10,7,z));
    const geo=r.own(new T.TubeGeometry(curve,32,.012,3,false));r.mesh(geo,r.material('#172c32'),root);
  }
  for(const mesh of glassMeshes)mesh.layers.set(1);
  const destruction=makeDestructibleStore(root,r,buildingParts,spill);
  // Merge the static street set. Destructible parts have already been merged by milestone.
  root.updateMatrixWorld(true);
  const batches=new Map(), sources=[];
  root.traverse(mesh=>{
    if(!mesh.isMesh||mesh.userData.dynamic||mesh.material===glass||mesh.isInstancedMesh||mesh.material.transparent||mesh.material.transmission>0)return;
    const geometry=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    const list=batches.get(mesh.material)||[];list.push(geometry);batches.set(mesh.material,list);sources.push(mesh);
  });
  for(const mesh of sources)mesh.removeFromParent();
  for(const [material,geometries] of batches){const merged=mergeGeometries(geometries);if(merged){const mesh=new T.Mesh(r.own(merged),material);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}for(const g of geometries)g.dispose();}
  return {root,glass,glassMeshes,spill,streetProps,floorPlan,destruction,wetMaterials:[...wetMaterials],walkObstacles:floorPlan.obstacles||floorPlan.racks,doors:automaticDoors,triggerDoor:()=>automaticDoors.triggerDoor(),update:(t,delta,actorPosition,companionPosition,viewerPosition)=>automaticDoors.update(t,delta,actorPosition,companionPosition,viewerPosition)};
}
