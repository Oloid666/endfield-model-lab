import * as T from 'three';
import { buildFridgeProducts, buildWindowPromotions } from './fridge-products.js';

// Metres: 8.5 × 4.7 shop; entrance → central aisle → rear fridges.
export function buildInterior(root,r,surfaces,glass,glassMeshes) {
  const box=(c,p,s,o={})=>r.box(root,c,p,s,o);
  const white='#c9d1c9',steel='#66766d';
  const metal={metalness:.78,roughness:.24};
  const atlas=document.createElement('canvas');atlas.width=1024;atlas.height=1024;const c=atlas.getContext('2d');
  const names=['海苔米香','焙茶','醇乳','脆餅','好米飯','可可','果實','燕麥'];
  const colors=['#2b6952','#b58e54','#467a9c','#be613c','#e9d8a6','#634a4a','#a35d71','#aeaa76'];
  for(let n=0;n<8;n++){
    const x=n%4*256,y=Math.floor(n/4)*512;c.fillStyle=colors[n];c.fillRect(x,y,256,512);
    c.fillStyle='#eee8d6';c.fillRect(x+12,y+28,232,56);c.fillStyle='#354b40';c.font='bold 24px sans-serif';c.textAlign='center';c.fillText('WULING SELECT',x+128,y+65);
    c.fillStyle='#f4edd9';c.beginPath();c.ellipse(x+128,y+224,75,87,0,0,Math.PI*2);c.fill();
    c.fillStyle=colors[(n+3)%8];c.beginPath();c.ellipse(x+128,y+224,48,40,-.3,0,Math.PI*2);c.fill();
    c.fillStyle='#253f34';c.font='bold 34px sans-serif';c.fillText(names[n],x+128,y+351);c.fillStyle='#f4edd9';c.font='18px sans-serif';c.fillText(n%2?'FRESH DAILY':'GOOD FOOD',x+128,y+390);
    c.fillStyle='#eee8d6';c.fillRect(x+30,y+430,196,60);for(let k=0;k<35;k++){c.fillStyle=k%3?'#24342d':'#cbcabc';c.fillRect(x+40+k*5,y+437,k%2?2:3,41);}
  }
  const map=r.own(new T.CanvasTexture(atlas));map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const goodsMaterial=r.own(new T.MeshStandardMaterial({map,roughness:.55})),goods=[];
  const dummy=new T.Object3D();
  for(let n=0;n<8;n++){
    const geo=r.own(new T.BoxGeometry(1,1,1)),uv=geo.attributes.uv;
    for(let k=0;k<uv.count;k++){uv.setXY(k,(n%4+uv.getX(k))/4,(1-Math.floor(n/4)+uv.getY(k))/2);}
    const mesh=new T.InstancedMesh(geo,goodsMaterial,100);root.add(mesh);goods.push({mesh,count:0});
  }
  function pack(x,y,z,w,h,d,n,rotation=0){const g=goods[n%8];dummy.position.set(x,y+h/2,z);dummy.scale.set(w,h,d);dummy.rotation.set(0,rotation,0);dummy.updateMatrix();g.mesh.setMatrixAt(g.count++,dummy.matrix);}
  const label=(text,p,s,options={},rot=0)=>{const m=r.mesh(r.geometry('PlaneGeometry',1,1),r.label(text,{width:512,height:128,font:'bold 48px sans-serif',bg:'#e0dec7',color:'#40584a',...options}),root,p,s);m.rotation.y=rot;return m;};
  // Five actual fridge bays, with a clear rear service aisle.
  for(let door=0;door<5;door++){
    const x=-3.35+door*1.17;
    box('#263d37',[x,1.57,-2.84],[1.14,2.46,.4]);
    box('#aabeb5',[x,1.56,-2.61],[1.01,2.2,.025],{emissive:0x8fb3c5,emissiveIntensity:.22});
    for(let row=0;row<4;row++){
      const y=.53+row*.45;box(white,[x,y,-2.33],[1.02,.035,.5],{roughness:.38,metalness:.12});
      box('#dddcc5',[x,y-.018,-2.065],[1.02,.055,.02]);
    }
    const pane=r.mesh(r.geometry('PlaneGeometry',1,1),glass,root,[x,1.54,-2.005],[1.03,2.23,1]);glassMeshes.push(pane);
    for(const dx of [-.54,.54]){
      box(steel,[x+dx,1.53,-2.03],[.032,2.28,.04],{metalness:.65,roughness:.25});
      box('#d3e6db',[x+dx*.91,1.53,-2.1],[.012,2.12,.014],{emissive:0xcce7df,emissiveIntensity:1.25,roughness:.3});
    }
    box('#cbd3c5',[x+.43,1.5,-1.99],[.02,.33,.025],{metalness:.7,roughness:.22});
  }
  const fridge=buildFridgeProducts(root,r),promotions=buildWindowPromotions(root,r);
  // Low double-sided gondolas. Left aisle 1.0m; rear aisle ≥0.85m; cashier aisle ≥1.2m.
  const racks=[{x:-2.7,z:-.25,w:1,d:1.65},{x:.6,z:-.32,w:.8,d:1.4}];
  racks.forEach((rack,index)=>{
    const {x,z,w,d}=rack;
    box('#56665b',[x,.42,z],[w,.22,d]);box('#bec6b8',[x,.94,z],[.045,1.17,d]);
    for(const dz of [-d/2+.04,d/2-.04])box('#758374',[x,1.0,z+dz],[.04,1.12,.04],{metalness:.35});
    for(let row=0;row<3;row++){
      const y=.56+row*.33;box(white,[x,y,z],[w+.08,.035,d+.04],{roughness:.46,metalness:.12});
      for(const side of [-1,1]){
        box('#c9b57a',[x+side*(w/2+.045),y+.02,z],[.024,.065,d]);
        for(let k=0;k<7;k++){
          const zz=z-d/2+.14+k*(d-.28)/6;
          pack(x+side*(w*.3),y+.02,zz,.18,.22,.15,index*3+row+k,side*Math.PI/2);
          box('#f1edd8',[x+side*(w/2+.06),y+.015,zz],[.012,.035,.085]);
        }
      }
      for(let k=0;k<4;k++)pack(x-w*.35+k*w*.23,y+.02,z+d/2+.025,.14,.2,.07,k+row+index);
    }
    label(index?'點心・即食':'米食・輕食',[x,1.48,z+d/2+.065],[w,.14,1],{font:'34px sans-serif'});
  });
  for(const g of goods){g.mesh.count=g.count;g.mesh.instanceMatrix.needsUpdate=true;g.mesh.computeBoundingSphere();}
  // Customer queue remains west of the counter; staff work in the 0.88m east aisle.
  // Heights are measured from the shop floor at y=.31: counter top=.98m.
  const cashier={x:2.85,z:.2,w:.86,d:2.1};
  box('#465d51',[2.85,.775,.2],[.86,.93,2.1]);
  box('#d3cdbd',[2.85,1.275,.2],[1,.07,2.22],{roughness:.25});
  box('#233b34',[2.41,.75,.2],[.025,.58,1.95]);
  box('#c8a56a',[2.395,1.06,.2],[.025,.025,2.04],{metalness:.6,roughness:.3});
  // Bagging end, then register, then heated-food bay. They do not share one surface.
  box('#b9b7a7',[2.87,1.321,.99],[.75,.016,.42],{roughness:.36});
  box('#526158',[2.91,1.35,.49],[.24,.07,.28]);
  const registerNeck=box('#263b36',[3.0,1.48,.46],[.07,.26,.08]);registerNeck.rotation.z=.12;
  const register=box('#253b35',[2.97,1.65,.46],[.075,.31,.4]);register.rotation.z=.09;
  label('POS · 24H',[3.013,1.65,.46],[.35,.24,1],{bg:'#213b34',color:'#b7d9ba',font:'bold 38px Arial'},Math.PI/2);
  // Independent customer-facing price display and payment terminal face the queue.
  box('#2b3f37',[2.56,1.41,.61],[.055,.2,.28]);
  label('NT$ 145',[2.526,1.42,.61],[.24,.14,1],{bg:'#142f2b',color:'#d0e5b3',font:'bold 46px Arial'},-Math.PI/2);
  const pay=box('#293f39',[2.46,1.344,.31],[.18,.06,.22]);pay.rotation.z=.2;
  box('#9abfa6',[2.366,1.372,.31],[.009,.045,.09],{emissive:0x70c2a0,emissiveIntensity:.32});
  box('#d3d1bf',[3.04,1.39,.04],[.24,.16,.25]);box('#1a2e29',[3.04,1.472,.04],[.2,.012,.025]);
  box('#f1edde',[3.04,1.478,.09],[.12,.006,.08]);
  // Recessed stainless hot-food bath: raised guard, broth, dividers and skewers.
  box('#a9b0a5',[2.85,1.36,-.57],[.66,.1,.62],metal);
  box('#7d6640',[2.85,1.418,-.57],[.56,.015,.5],{roughness:.3});
  for(const xx of [2.67,2.85,3.03])box('#b7c1b2',[xx,1.43,-.57],[.018,.035,.52],metal);
  for(const zz of [-.72,-.46])box('#b7c1b2',[2.85,1.43,zz],[.57,.035,.018],metal);
  for(const xx of [2.73,2.97])for(const zz of [-.7,-.44]){
    r.cylinder(root,'#cdb17b',[xx,1.445,zz],.064,.04);
    const skewer=box('#b99d68',[xx,1.535,zz],[.008,.2,.008]);skewer.rotation.z=.1;
  }
  for(const xx of [2.52,3.18])box('#afb9ac',[xx,1.61,-.86],[.018,.52,.018],metal);
  box('#dbe2d4',[2.85,1.87,-.82],[.71,.025,.2],{roughness:.14,metalness:.18});
  label('關東煮',[2.85,1.76,-.704],[.4,.13,1],{font:'bold 44px sans-serif',bg:'#cdbd91',color:'#4c543b'});
  label('結帳',[2.397,.92,.72],[.39,.22,1],{bg:'#233b34',color:'#eee5c8',font:'42px sans-serif'},-Math.PI/2);
  // Back service bench faces into the staff aisle. Coffee and microwave have their own bays.
  box('#52665a',[3.15,.765,-2.47],[1.94,.91,.78]);
  box('#cec9b6',[3.15,1.255,-2.47],[2.03,.07,.84],{roughness:.27});
  for(const xx of [2.56,3.14,3.73]){
    box('#2a4439',[xx,.83,-2.064],[.015,.74,.018]);
    box('#a7b3a2',[xx+.15,1.08,-2.05],[.16,.022,.025],metal);
  }
  // Microwave: vent slots, dark door, control column and a lit timer.
  box('#c2c9bb',[2.63,1.58,-2.48],[.77,.55,.61],{roughness:.36,metalness:.2});
  box('#243b35',[2.54,1.59,-2.164],[.49,.34,.024]);
  box('#728071',[2.78,1.59,-2.14],[.022,.27,.018],metal);
  label('00:45',[2.926,1.72,-2.16],[.13,.07,1],{bg:'#21392e',color:'#b3d195',font:'bold 44px Arial'});
  for(const yy of [1.46,1.54])r.cylinder(root,'#96a792',[2.91,yy,-2.135],.025,.025,metal).rotation.x=Math.PI/2;
  for(let k=0;k<6;k++)box('#66756a',[2.39+k*.075,1.876,-2.49],[.025,.008,.28]);
  // Espresso unit: a dedicated back-bar machine, with hoppers, brew head and tray.
  box('#2d3d36',[3.58,1.59,-2.49],[.56,.59,.53],{roughness:.32,metalness:.3});
  box('#b2b9aa',[3.58,1.52,-2.205],[.49,.29,.04],metal);
  box('#253d32',[3.58,1.68,-2.178],[.25,.13,.014],{roughness:.2});
  label('CITY CAFÉ',[3.58,1.69,-2.168],[.22,.07,1],{bg:'#1e372e',color:'#e8dcb9',font:'bold 38px Arial'});
  box('#1c2a24',[3.58,1.49,-2.145],[.18,.09,.1],metal);
  for(const xx of [3.54,3.62])r.cylinder(root,'#b9c3b0',[xx,1.438,-2.1],.012,.07,metal);
  box('#a8b1a4',[3.58,1.322,-2.1],[.47,.025,.27],metal);
  for(let k=0;k<9;k++)box('#293a31',[3.39+k*.045,1.337,-2.1],[.012,.007,.22]);
  for(const xx of [3.44,3.72]){
    r.cylinder(root,'#5b4e38',[xx,1.96,-2.49],.105,.18,{roughness:.4,metalness:.12});
    r.cylinder(root,'#303f34',[xx,2.058,-2.49],.115,.025,{roughness:.3});
  }
  // A waiting cup under the brew head, with paper sleeve and lid/cup storage beside it.
  const cupGeo=r.geometry('CylinderGeometry',.048,.035,.1,16);
  r.mesh(cupGeo,r.material('#f0e6cc',{roughness:.7}),root,[3.58,1.393,-2.09]);
  r.cylinder(root,'#97774f',[3.58,1.392,-2.09],.045,.04);
  for(let k=0;k<4;k++)r.mesh(cupGeo,r.material('#e8dfc7'),root,[3.98,1.34+k*.025,-2.39]);
  r.cylinder(root,'#d8d2bd',[3.98,1.345,-2.67],.065,.08);
  label('現煮咖啡',[3.58,2.2,-2.19],[.62,.18,1],{bg:'#d0c1a2',color:'#3b523f',font:'bold 48px sans-serif'});
  label('加熱服務',[2.63,2.08,-2.19],[.73,.14,1],{font:'36px sans-serif'});
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d'),gradient=sc.createRadialGradient(64,64,15,64,64,63);gradient.addColorStop(0,'rgba(9,17,14,.55)');gradient.addColorStop(1,'rgba(9,17,14,0)');sc.fillStyle=gradient;sc.fillRect(0,0,128,128);
  const shadowMap=r.own(new T.CanvasTexture(shadowCanvas)),shadowMat=r.own(new T.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false}));
  for(const rack of [...racks,{x:2.85,z:.2,w:.9,d:2.1}]){const sh=r.mesh(r.geometry('PlaneGeometry',1,1),shadowMat,root,[rack.x,.315,rack.z],[rack.w+.4,rack.d+.4,1]);sh.rotation.x=-Math.PI/2;}
  // Small perforations and shelf-edge strips supply detail without a wall of boxes.
  const walkObstacles=[...racks,cashier,{x:3.15,z:-2.47,w:1.94,d:.78}];
  return {fridgeCategories:fridge.categories,fridgeStock:fridge.stock,promotions,racks,entrance:{minX:-1,maxX:.6,z:1.8},cashier,coffee:{x:3.58,z:-2.49},staffAisle:.88,rearAisle:Math.min(...racks.map(rack=>rack.z-rack.d/2+2.005)),obstacles:walkObstacles,walkObstacles};
}
