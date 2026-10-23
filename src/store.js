import * as T from 'three';
import { createSurfaces } from './surfaces.js';
import { buildTrees } from './trees.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Original street set. Repeated products, tiles and frames share resources.
export function buildStore(scene, r) {
  const root = new T.Group();scene.add(root);
  const surfaces=createSurfaces(r);
  const B=(c,p,s,o={})=>{
    let options=o,color=c;
    if(['#637774','#6a807a','#293e43'].includes(c)){options={...surfaces.wall,...o};color=c==='#293e43'?'#78828a':'#d4d0c4';}
    else if(['#64716d','#d2c7a6'].includes(c)){options={...surfaces.pavement,...o};color='#d3d5d0';}
    else if(['#193739','#304c48'].includes(c)){options={roughness:.29,metalness:.42,...o};}
    else if(c==='#9a7953'){options={...surfaces.timber,...o};color='#c4b090';}
    return r.box(root,color,p,s,options);
  };
  const text=(str,p,s,options={},rotation=0)=>{const m=r.mesh(r.geometry('PlaneGeometry',1,1),r.label(str,options),root,p,s);m.rotation.y=rotation;return m;};
  const dark='#193739', wall='#637774', trim='#a3afa0', cream='#c7c4ac', green='#155b42';
  // Island, pavements, drains and a complete enclosed building.
  B('#293e44',[0,-.22,0],[23,.4,22],{roughness:.35});
  B('#64716d',[0,.015,-.1],[13.7,.32,10]);
  B('#a1a79a',[0,.13,4.87],[13.8,.22,.18]);
  B('#d2c7a6',[0,.24,2.5],[9.2,.14,2.25]);
  for(let i=0;i<20;i++)B('#4c5b57',[-6.6+i*.7,.184,3.5],[.018,.006,2.7]);
  for(const z of [2.1,2.8,3.5,4.2])B('#4b5c59',[0,.186,z],[13.4,.006,.012]);
  B('#293638',[0,.205,4.55],[9.8,.025,.22]);
  for(let i=0;i<75;i++)B('#85928b',[-4.8+i*.13,.224,4.55],[.035,.008,.2]);
  // Main shop shell. Its interior remains readable through open display bays.
  B(wall,[0,1.8,-3.13],[8.8,3.25,.24]);
  B(wall,[-4.3,1.8,-.72],[.22,3.25,4.7]);
  B(wall,[4.3,.46,-.72],[.22,.34,4.7]);
  B(wall,[4.3,3.01,-.72],[.22,.6,4.7]);
  for(const z of [-3.02,-1.5,0,1.6])B(dark,[4.3,1.68,z],[.13,2.16,.065],{metalness:.45,roughness:.3});
  B('#d4c8a7',[0,.24,-.72],[8.5,.13,4.7]);
  B('#d2c9ac',[0,3.31,-.72],[8.8,.16,5]);
  // Interior floor tiles.
  for(let x=-4;x<=4;x+=.8)B('#938e77',[x,.311,-.7],[.015,.004,4.7]);
  for(let z=-2.9;z<1.7;z+=.8)B('#938e77',[0,.311,z],[8.5,.004,.015]);
  // Upper floor: Wuling-inspired plaster, wood lattice and tiled roof.
  B('#6a807a',[0,4.5,-.73],[8.8,2.2,4.95]);
  B(dark,[0,3.55,1.78],[8.95,.2,.2]);
  B(dark,[0,5.55,1.78],[8.95,.18,.2]);
  for(const x of [-4.25,-1.65,1.65,4.25])B('#304c48',[x,4.55,1.79],[.12,1.95,.15]);
  for(const x of [-2.85,0,2.85]){
    B('#273d3a',[x,4.58,1.795],[1.8,1.28,.12]);
    B(x===0?'#78827c':'#e2d0ad',[x,4.58,1.86],[1.64,1.13,.025],{map:surfaces.windowMap,emissiveMap:surfaces.windowMap,emissive:0xffdba2,emissiveIntensity:x===0?.08:.65,roughness:.7});
    for(const dx of [-.55,0,.55])B(dark,[x+dx,4.58,1.9],[.045,1.17,.04]);
    B(dark,[x,4.58,1.9],[1.7,.05,.04]);
    for(let i=0;i<6;i++)B(i%2?'#a89f86':'#8e8875',[x+.31+i*.075,4.57,1.915],[.04,1.08,.025],{roughness:.96});
    B('#50645c',[x,3.87,1.97],[2,.16,.35]);
  }
  // Decorative corner trims and side lattice.
  for(const x of [-4.42,4.42])B('#2e4846',[x,4.5,-.73],[.12,2.17,4.97]);
  B('#38544f',[4.49,4.55,-.5],[.06,1.1,2.4]);
  for(let z=-1.6;z<.8;z+=.3)B('#779187',[4.535,4.55,z],[.02,1,.04]);
  // Weathered flat roof, parapets, railings and utility tank.
  B('#354246',[0,5.72,-.74],[9.2,.25,5.4],{roughness:.65});
  B('#6a807a',[0,5.94,-3.37],[9.1,.34,.14]);
  B('#6a807a',[-4.52,5.94,-.74],[.14,.34,5.4]);
  for(const z of [1.94,-3.4]){
    B('#34413f',[0,6.35,z],[9.1,.045,.045],{metalness:.6,roughness:.32});
    B('#34413f',[0,6.02,z],[9.1,.035,.035],{metalness:.6,roughness:.32});
    for(let x=-4.5;x<=4.5;x+=.36)B('#34413f',[x,6.18,z],[.027,.67,.027],{metalness:.6,roughness:.32});
  }
  const tank=r.cylinder(root,'#77837e',[1.8,6.6,-1.7],.58,1.5,{metalness:.65,roughness:.38});
  r.cylinder(root,'#a0aaa1',[1.8,7.37,-1.7],.61,.08,{metalness:.7,roughness:.25});
  for(const y of [5.94,6.65,7.23])r.cylinder(root,'#424e4c',[1.8,y,-1.7],.596,.04,{metalness:.6,roughness:.32});
  B('#5c6865',[-2.1,6.1,-1.5],[1.9,.6,1.4],{roughness:.8});
  for(let z=-2.1;z<-1;z+=.15)B('#293737',[-2.1,6.41,z],[1.65,.03,.04]);
  // Bright wraparound sign band.
  B('#e5e2ce',[0,3.09,1.95],[9.15,.63,.38],{emissive:0xd6d4ae,emissiveIntensity:1.4});
  const stripes=[['#da702d',3.27],['#17784d',3.09],['#d13e35',2.92]];
  for(const [c,y] of stripes){B(c,[0,y,2.15],[9.1,.12,.025],{emissive:new T.Color(c),emissiveIntensity:1.8});B(c,[4.58,y,-.55],[.03,.12,5.4],{emissive:new T.Color(c),emissiveIntensity:1.5});B(c,[-4.58,y,-.55],[.03,.12,5.4]);}
  function logoMaterial(tall=false){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=tall?896:512;const c=canvas.getContext('2d');c.fillStyle='#f7f6ee';c.fillRect(0,0,512,canvas.height);
    c.fillStyle='#e97421';c.font='bold 440px Arial';c.textAlign='center';c.fillText('7',270,385);
    c.fillStyle='#f7f6ee';c.fillRect(52,246,410,80);c.fillStyle='#08794d';c.font='bold 70px Arial';c.fillText('ELEVEN',256,309);
    if(tall){c.fillStyle='#d33736';c.fillRect(20,530,472,336);c.fillStyle='#f7f6ee';c.font='bold 72px Arial';c.fillText('ATM',256,659);c.font='40px sans-serif';c.fillText('24 小時營業',256,772);}
    const map=r.own(new T.CanvasTexture(canvas));map.colorSpace=T.SRGBColorSpace;
    return r.own(new T.MeshStandardMaterial({map,emissiveMap:map,emissive:0xffffff,emissiveIntensity:.8,roughness:.32}));
  }
  B('#ece7cf',[0,3.1,2.19],[1.3,.73,.08],{emissive:0xeee4b9,emissiveIntensity:1.2});
  r.mesh(r.geometry('PlaneGeometry',1,1),logoMaterial(),root,[0,3.1,2.238],[.73,.69,1]);
  // Lit blade sign, separate from the dark upper wall.
  B('#1b3433',[4.65,3.9,1.3],[.18,1.7,.13]);
  B('#e7e1c3',[5.08,4.05,1.3],[.84,1.96,.24],{emissive:0xecdcc1,emissiveIntensity:1.25});
  r.mesh(r.geometry('PlaneGeometry',1,1),logoMaterial(true),root,[5.08,4.05,1.429],[.78,1.9,1]);
  // Canopy with an illuminated underside. Slender supports frame the actors.
  B('#24332f',[0,2.79,2.23],[9.65,.09,1.28],{roughness:.24,metalness:.35});
  B('#49746a',[0,2.7,2.87],[9.72,.12,.08],{roughness:.3});
  B('#ced6bc',[0,2.69,2.55],[8.9,.025,.045],{emissive:0xffd69a,emissiveIntensity:2.5});
  for(const x of [-4.63,4.63]){B('#314d47',[x,1.48,2.78],[.11,2.5,.11],{roughness:.45});B('#777e6d',[x,.33,2.78],[.26,.2,.26]);}
  // Reflected street and neon remain visible over the warm interior.
  const glass=r.own(new T.MeshPhysicalMaterial({color:0xe2efeb,roughness:.035,metalness:.08,transmission:0,transparent:true,opacity:.25,thickness:.045,ior:1.48,attenuationColor:0xbad8d0,attenuationDistance:6,depthWrite:false,side:T.FrontSide,clearcoat:1,clearcoatRoughness:.035,bumpMap:surfaces.glassBump,bumpScale:.006,envMapIntensity:2.2}));
  // Preserve a clear interior at the default mobile tier; increase reflection at grazing angles.
  glass.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      #ifndef USE_TRANSMISSION
      float paneFresnel=pow(1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0),2.0);
      diffuseColor.a=.18+paneFresnel*.55;
      #endif
      #include <opaque_fragment>`);
  };
  const glassMeshes=[];
  for(const [x,width] of [[-2.84,2.75],[.5,2.95],[3.38,1.55]]){
    B(dark,[x,.45,1.74],[width,.26,.18]);
    B(cream,[x,.59,1.79],[width,.055,.23],{metalness:.45,roughness:.3});
    glassMeshes.push(r.mesh(r.geometry('PlaneGeometry',1,1),glass,root,[x,1.65,1.84],[width,2.08,1]));
    for(const dx of [-width/2,width/2])B(dark,[x+dx,1.69,1.82],[.07,2.18,.08]);
    B(dark,[x,2.7,1.82],[width,.08,.09]);
  }
  const sideGlass=r.mesh(r.geometry('PlaneGeometry',1,1),glass,root,[4.43,1.65,-.72],[4.45,2.08,1]);sideGlass.rotation.y=Math.PI/2;glassMeshes.push(sideGlass);
  for(const x of [-2.85,0,2.85])glassMeshes.push(r.mesh(r.geometry('PlaneGeometry',1,1),glass,root,[x,4.58,1.95],[1.64,1.12,1]));
  // Door, handles, safety strips.
  for(const x of [-.9,.05])B('#557b6a',[x,1.65,1.87],[.035,2.07,.06]);
  for(const x of [-.5,-.35])B('#c2c6ac',[x,1.48,1.91],[.028,.34,.045],{metalness:.6,roughness:.3});
  B('#b8a870',[-.43,1.05,1.89],[.94,.06,.025]);
  // Rear refrigerator wall and chilled drinks.
  B('#354b42',[0,1.55,-2.85],[7.9,2.35,.4]);
  for(let x=-3.6;x<4;x+=1.2){
    B('#b4c5b0',[x,1.55,-2.59],[1.1,2.05,.03],{emissive:0xd8e3bd,emissiveIntensity:.22});
    B('#526353',[x+.52,1.55,-2.54],[.04,2.07,.05]);
    for(const y of [.7,1.18,1.66,2.14])B('#d7d6b9',[x,y,-2.36],[1.05,.045,.4]);
  }
  const productColors=['#cd7849','#b4bb64','#dde0be','#b74b46','#4f927c','#b8a4c0','#dba24c'];
  const products=[];
  for(let i=0;i<7;i++){
    const inst=new T.InstancedMesh(r.geometry('BoxGeometry',1,1,1),r.material(productColors[i],{roughness:.48,map:surfaces.packaging}),90);root.add(inst);products.push({inst,count:0});
  }
  const dummy=new T.Object3D();
  function product(x,y,z,w,h,d,index){const p=products[index%products.length];dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,0,0);dummy.updateMatrix();p.inst.setMatrixAt(p.count++,dummy.matrix);}
  for(let col=0;col<38;col++)for(let row=0;row<4;row++)product(-3.8+col*.2,.88+row*.48,-2.4,.11,.25,.12,(col+row*3)%7);
  // Central gondola, visible through the glass.
  for(const x of [-2.6,2.2]){
    B('#a8a895',[x,.86,-.75],[1.7,1.1,.68]);
    for(const y of [.53,.91,1.29]){
      B('#e3d4ab',[x,y,-.75],[1.85,.05,.82]);
      for(let col=0;col<9;col++)product(x-.76+col*.19,y+.13,-.43,.14,.21,.14,col+Math.round(y*4));
      B('#d2b664',[x,y+.01,-.315],[1.8,.07,.015]);
    }
  }
  for(const {inst,count} of products){inst.count=count;inst.instanceMatrix.needsUpdate=true;inst.computeBoundingSphere();}
  // Counter, register, microwave and oden pot.
  B('#5f705e',[2.43,.87,.83],[2.65,1.12,.75]);
  B('#d1c7a3',[2.43,1.46,.8],[2.8,.12,.95],{roughness:.4});
  B('#273b33',[2.56,1.76,.74],[.44,.44,.2]);
  B('#a7cbb0',[2.56,1.78,.86],[.34,.24,.018],{emissive:0x98c4a5,emissiveIntensity:.6});
  B('#e1d8b9',[3.48,1.78,.65],[.73,.53,.6]);
  B('#2a3f3b',[3.4,1.78,.961],[.48,.32,.025]);
  B('#e1bd76',[3.72,1.84,.967],[.06,.07,.025],{emissive:0xf6c77f,emissiveIntensity:1.4});
  B('#697c70',[1.5,1.55,.8],[.62,.12,.6],{metalness:.6});
  for(const x of [1.32,1.58])for(const z of [.65,.92]){
    const food=r.cylinder(root,'#c8aa6a',[x,1.65,z],.09,.08);
    const stick=B('#b9a373',[x,1.84,z],[.014,.35,.014]);stick.rotation.z=.1;
  }
  text('熱食 · 好好吃飯',[2.45,.96,1.216],[1.7,.27,1],{width:1024,height:128,font:'52px sans-serif',bg:'#5f705e',color:'#e0d9bb'});
  // Warm ceiling strips; practical light is restrained to three real lights.
  for(const x of [-2.3,2.2])B('#fbefc3',[x,3.17,-.6],[.07,.035,3.5],{emissive:0xffe2a3,emissiveIntensity:3});
  const warm=new T.PointLight(0xffd5a0,35,9,2);warm.position.set(0,2.75,-.4);root.add(warm);
  const doorway=new T.PointLight(0xffe1b5,16,7,2);doorway.position.set(.4,2.5,2.2);root.add(doorway);
  // A single cached shadow map anchors the canopy, street furniture and trees.
  const spill=new T.SpotLight(0xffd4a0,45,13,Math.PI*.36,.65,2);spill.position.set(0,2.63,1.4);spill.target.position.set(0,.1,5.2);spill.castShadow=true;spill.shadow.mapSize.set(1024,1024);spill.shadow.camera.near=.2;spill.shadow.camera.far=14;spill.shadow.bias=-.0003;spill.shadow.normalBias=.025;spill.shadow.autoUpdate=false;spill.shadow.needsUpdate=true;root.add(spill,spill.target);
  // Small wall sconces, warm pools on plaster.
  for(const x of [-3.75,3.7]){
    B('#b6a37a',[x,4.8,1.94],[.16,.36,.12],{emissive:0xffcc84,emissiveIntensity:2});
    const sconce=new T.PointLight(0xffc584,3.5,2.4,2);sconce.position.set(x,4.75,2.13);root.add(sconce);
  }
  // Sidewall utility details, vent, condenser and downpipe.
  B('#abb5a4',[4.47,4.44,-1.2],[.25,.85,1.27]);
  for(let i=0;i<8;i++)B('#5c7068',[4.61,4.14+i*.08,-1.2],[.02,.024,1.1]);
  const pipe=r.cylinder(root,'#4b6f65',[4.64,2.83,-2.55],.055,5.3,{metalness:.3});
  B('#3d5b54',[4.65,.32,-2.36],[.11,.11,.4]);
  // Outside seating, food bag and hot drink. Reserved for later story blocking.
  const bench=new T.Group();bench.position.set(2.75,.25,2.65);root.add(bench);
  for(const z of [-.22,0,.22])r.box(bench,'#9a7953',[0,.52,z],[2,.09,.16],{roughness:.6});
  for(const x of [-.75,.75])r.box(bench,'#31443b',[x,.27,0],[.08,.5,.48]);
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
  for(const x of [5.3,5.95]){r.cylinder(root,'#455f57',[x,.65,2.8],.25,.85);r.cylinder(root,'#82907c',[x,1.08,2.8],.27,.08);}
  buildTrees(root,r);
  // Street markings, curb paint, low bollards and a warm streetlamp.
  for(let i=0;i<6;i++)B('#b4b9a0',[-6.5+i*.72,-.009,8],[.37,.012,2.5],{roughness:.33});
  for(const x of [-10,-5,0,5,10])B('#c2b78e',[x,-.008,10.3],[2.6,.01,.065],{roughness:.35});
  B('#a38555',[0,.251,4.98],[12.3,.035,.055]);
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
  // Fine utility cables, not a collision or walking system.
  for(const z of [-3.7,-3.9]){
    const curve=new T.QuadraticBezierCurve3(new T.Vector3(-10,7,z),new T.Vector3(0,5.4,z),new T.Vector3(10,7,z));
    const geo=r.own(new T.TubeGeometry(curve,32,.012,3,false));r.mesh(geo,r.material('#172c32'),root);
  }
  // Merge the static set by material. Keep instanced goods, glass and lights separate.
  root.updateMatrixWorld(true);
  const batches=new Map(), sources=[];
  root.traverse(mesh=>{
    if(!mesh.isMesh||mesh.isInstancedMesh||mesh.material.transparent||mesh.material.transmission>0)return;
    const geometry=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    const list=batches.get(mesh.material)||[];list.push(geometry);batches.set(mesh.material,list);sources.push(mesh);
  });
  for(const mesh of sources)mesh.removeFromParent();
  for(const [material,geometries] of batches){const merged=mergeGeometries(geometries);if(merged){const mesh=new T.Mesh(r.own(merged),material);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}for(const g of geometries)g.dispose();}
  return {root,glass,glassMeshes,spill};
}
