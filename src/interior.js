import * as T from 'three';

// Metres: 8.5 × 4.7 shop; entrance → central aisle → rear fridges.
export function buildInterior(root,r,surfaces,glass,glassMeshes) {
  const box=(c,p,s,o={})=>r.box(root,c,p,s,o);
  const white='#c9d1c9',steel='#66766d';
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
  const bottleGeo=r.own(new T.LatheGeometry([new T.Vector2(0,0),new T.Vector2(.048,0),new T.Vector2(.053,.025),new T.Vector2(.053,.17),new T.Vector2(.028,.21),new T.Vector2(.025,.26),new T.Vector2(0,.26)],10));
  const bottles=new T.InstancedMesh(bottleGeo,r.material('#ced9bf',{roughness:.25,metalness:.02}),140);root.add(bottles);let bottleCount=0;
  const labelMat=r.label('武陵  冷藏  SELECT',{width:512,height:128,bg:'#f4edda',color:'#3f594a',font:'bold 37px sans-serif'});
  const labels=new T.InstancedMesh(r.geometry('CylinderGeometry',.054,.054,.085,10),labelMat,140),caps=new T.InstancedMesh(r.geometry('CylinderGeometry',.027,.027,.025,10),r.material('#c0c9bb',{roughness:.35}),140);root.add(labels,caps);
  const tint=new T.Color();
  function bottle(x,y,z,n){dummy.position.set(x,y,z);dummy.rotation.set(0,0,0);dummy.scale.setScalar(1);dummy.updateMatrix();bottles.setMatrixAt(bottleCount,dummy.matrix);tint.set(colors[n%8]);bottles.setColorAt(bottleCount,tint);dummy.position.set(x,y+.117,z);dummy.updateMatrix();labels.setMatrixAt(bottleCount,dummy.matrix);dummy.position.y=y+.26;dummy.updateMatrix();caps.setMatrixAt(bottleCount,dummy.matrix);bottleCount++;}
  const label=(text,p,s,options={},rot=0)=>{const m=r.mesh(r.geometry('PlaneGeometry',1,1),r.label(text,{width:512,height:128,font:'bold 48px sans-serif',bg:'#e0dec7',color:'#40584a',...options}),root,p,s);m.rotation.y=rot;return m;};
  // Five actual fridge bays, with a clear rear service aisle.
  for(let door=0;door<5;door++){
    const x=-3.35+door*1.17;
    box('#263d37',[x,1.57,-2.84],[1.14,2.46,.4]);
    box('#aabeb5',[x,1.56,-2.61],[1.01,2.2,.025],{emissive:0x8fb3c5,emissiveIntensity:.22});
    for(let row=0;row<4;row++){
      const y=.53+row*.45;box(white,[x,y,-2.33],[1.02,.035,.5],{roughness:.38,metalness:.12});
      for(let k=0;k<6;k++)bottle(x-.4+k*.16,y+.02,-2.21,door+row+k);
      box('#dddcc5',[x,y-.018,-2.065],[1.02,.055,.02]);
    }
    const pane=r.mesh(r.geometry('PlaneGeometry',1,1),glass,root,[x,1.54,-2.005],[1.03,2.23,1]);glassMeshes.push(pane);
    for(const dx of [-.54,.54])box(steel,[x+dx,1.53,-2.03],[.032,2.28,.04],{metalness:.65,roughness:.25});
    box('#cbd3c5',[x+.43,1.5,-1.99],[.02,.33,.025],{metalness:.7,roughness:.22});
    label(door<3?'冷藏飲品':'鮮乳・茶',[x,2.68,-2.015],[.94,.16,1],{font:'36px sans-serif'});
  }
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
  bottles.count=bottleCount;bottles.instanceMatrix.needsUpdate=true;bottles.instanceColor.needsUpdate=true;bottles.computeBoundingSphere();for(const mesh of [labels,caps]){mesh.count=bottleCount;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}
  // Side counter: customers on its left, 0.85m staff space on its right.
  box('#4b6253',[2.85,.82,.2],[.86,1.0,2.1]);box('#c1bda6',[2.85,1.35,.2],[1,.1,2.22],{roughness:.31});
  box('#263b37',[2.73,1.57,.73],[.16,.38,.47]);
  label('歡迎光臨',[2.64,1.59,.73],[.37,.24,1],{bg:'#193d36',color:'#9bc8ac',font:'30px sans-serif'},-Math.PI/2);
  box('#323f39',[2.58,1.42,.94],[.26,.04,.24]);box('#a3ad99',[2.82,1.42,-.7],[.62,.08,.55],{metalness:.65,roughness:.25});
  for(const xx of [2.65,2.9])for(const zz of [-.82,-.58]){
    r.cylinder(root,'#c8ab6a',[xx,1.49,zz],.08,.07);const stick=box('#b9a373',[xx,1.64,zz],[.012,.27,.012]);stick.rotation.z=.1;
  }
  // Microwave and bagging area behind the cashier, clear of the entrance.
  box('#53675d',[3.72,.83,-1.67],[.8,1.02,.66]);box('#c8cabb',[3.72,1.64,-1.67],[.75,.55,.58]);
  box('#1d3030',[3.64,1.65,-1.368],[.48,.34,.025]);box('#d6a960',[3.96,1.72,-1.35],[.045,.055,.02],{emissive:0xd5a45e,emissiveIntensity:.4});
  label('熱食・微波',[3.72,2.08,-1.32],[.75,.14,1],{font:'32px sans-serif'});
  label('結帳',[2.35,1.02,.72],[.4,.23,1],{bg:'#4b6253',color:'#e0d9bd',font:'42px sans-serif'},-Math.PI/2);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d'),gradient=sc.createRadialGradient(64,64,15,64,64,63);gradient.addColorStop(0,'rgba(9,17,14,.55)');gradient.addColorStop(1,'rgba(9,17,14,0)');sc.fillStyle=gradient;sc.fillRect(0,0,128,128);
  const shadowMap=r.own(new T.CanvasTexture(shadowCanvas)),shadowMat=r.own(new T.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false}));
  for(const rack of [...racks,{x:2.85,z:.2,w:.9,d:2.1}]){const sh=r.mesh(r.geometry('PlaneGeometry',1,1),shadowMat,root,[rack.x,.315,rack.z],[rack.w+.4,rack.d+.4,1]);sh.rotation.x=-Math.PI/2;}
  // Small perforations and shelf-edge strips supply detail without a wall of boxes.
  return {racks,entrance:{minX:-1,maxX:.6,z:1.8},cashier:{x:2.85,z:.2},rearAisle:Math.min(...racks.map(rack=>rack.z-rack.d/2+2.005))};
}
