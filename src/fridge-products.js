import * as T from 'three';

// Original merchandising data. Prices are scene props, never a checkout API.
export const FRIDGE_BAYS = [
  {id:'water-soda',name:'水・氣泡飲',rows:[['water-1000','mineral-1000'],['water-600','mineral-600'],['cola','citrus-soda'],['sparkling','grape-soda']]},
  {id:'tea-pet',name:'茶・無糖好茶',rows:[['green-tea','oolong'],['black-tea','barley-tea'],['jasmine','roast-tea'],['lemon-tea','milk-tea']]},
  {id:'dairy',name:'鮮乳・乳飲',rows:[['milk-1000','lowfat-1000'],['milk-400','soy-400'],['cultured','strawberry-milk'],['coffee-milk','oat-milk']]},
  {id:'juice-cans',name:'果汁・罐裝飲',rows:[['orange-juice','apple-juice'],['grape-juice','tomato-juice'],['coffee-can','cocoa-can'],['sports','fruit-water']]},
  {id:'chilled-food',name:'輕食・優格',rows:[['egg-sandwich','chicken-sandwich'],['green-salad','corn-salad'],['plain-yogurt','berry-yogurt'],['custard','cocoa-pudding']]},
];
const SKU_DEFS = [
  ['water-1000','山泉水','pet',.137,.35,.137,'#accbd8','#e0eff3',32],['mineral-1000','天然礦泉','pet',.137,.35,.137,'#9bbcc4','#e1edf0',35],
  ['water-600','純水','pet',.105,.275,.105,'#8fbdcf','#dfedf0',22],['mineral-600','礦泉水','pet',.105,.265,.105,'#91b8bd','#e0eeee',25],
  ['cola','可樂','pet',.11,.278,.11,'#a4453f','#302c29',35],['citrus-soda','柑橘汽水','pet',.11,.278,.11,'#d79e45','#dacb8f',35],
  ['sparkling','檸檬氣泡','pet',.115,.29,.115,'#8aa365','#d8e5d2',38],['grape-soda','葡萄氣泡','pet',.115,.285,.115,'#84628f','#8f6e99',38],
  ['green-tea','無糖綠茶','pet',.115,.285,.115,'#5d8a50','#b5a366',30],['oolong','焙香烏龍','pet',.115,.285,.115,'#967849','#9b7144',30],
  ['black-tea','原葉紅茶','pet',.115,.275,.115,'#994e42','#9d6044',30],['barley-tea','麥茶','pet',.115,.275,.115,'#c2ac76','#ae8d54',28],
  ['jasmine','茉莉清茶','pet',.115,.285,.115,'#7aa481','#c7b976',32],['roast-tea','焙茶','pet',.115,.285,.115,'#7b5d3d','#9c714b',32],
  ['lemon-tea','檸檬紅茶','pet',.115,.28,.115,'#c8a142','#b98440',35],['milk-tea','香醇奶茶','pet',.115,.28,.115,'#ad9372','#d4bb92',35],
  ['milk-1000','牧場鮮乳','carton',.137,.32,.123,'#4b8dab','#eff0df',92],['lowfat-1000','低脂鮮乳','carton',.137,.32,.123,'#61a38c','#edf0df',92],
  ['milk-400','小瓶鮮乳','carton',.112,.245,.1,'#5495bd','#f2eedb',42],['soy-400','原味豆乳','carton',.112,.245,.1,'#a9ab74','#ece2c5',32],
  ['cultured','活力乳酸','pet',.09,.2,.09,'#ce6e63','#f0e7d3',28],['strawberry-milk','草莓乳飲','pet',.09,.205,.09,'#d38d9a','#e6bac1',30],
  ['coffee-milk','咖啡牛乳','carton',.112,.235,.1,'#896744','#dec9a1',38],['oat-milk','燕麥飲','carton',.112,.235,.1,'#a18f65','#e6dab6',45],
  ['orange-juice','柳橙原汁','carton',.114,.26,.105,'#cf8c38','#dfad56',45],['apple-juice','蘋果原汁','carton',.114,.26,.105,'#aa7451','#e0bf75',45],
  ['grape-juice','葡萄原汁','carton',.114,.255,.105,'#80638b','#aa8ab3',45],['tomato-juice','番茄蔬果','carton',.114,.255,.105,'#b6664d','#c98d65',42],
  ['coffee-can','黑咖啡','can',.078,.145,.078,'#5f6052','#6c6653',35],['cocoa-can','醇可可','can',.078,.145,.078,'#916b50','#9f805f',35],
  ['sports','運動補給','pet',.111,.28,.111,'#619ec3','#d2e0d8',35],['fruit-water','蜜桃果水','pet',.111,.28,.111,'#c3949d','#e2c8bf',35],
  ['egg-sandwich','蛋沙拉三明治','sandwich',.16,.185,.14,'#d1b26a','#e4dbac',49],['chicken-sandwich','雞肉三明治','sandwich',.16,.185,.14,'#81916b','#ded6ad',59],
  ['green-salad','鮮蔬沙拉','salad',.203,.085,.165,'#6f9959','#83a45e',65],['corn-salad','玉米沙拉','salad',.203,.085,.165,'#ccac57','#c3bd73',65],
  ['plain-yogurt','原味優格','yogurt',.115,.12,.115,'#5f9dba','#f0edda',39],['berry-yogurt','莓果優格','yogurt',.115,.12,.115,'#b783a2','#e4c8d8',42],
  ['custard','雞蛋布丁','yogurt',.112,.1,.112,'#d4b266','#ebd698',32],['cocoa-pudding','可可布丁','yogurt',.112,.1,.112,'#8f6c50','#b2946e',35],
];
export const FRIDGE_SKUS = Object.fromEntries(SKU_DEFS.map((p,index)=>[p[0],{id:p[0],name:p[1],family:p[2],w:p[3],h:p[4],d:p[5],labelColor:p[6],fillColor:p[7],price:p[8],skin:index}]));

// Blocking by SKU, two-deep facings and small intentional sell-through gaps.
export function createFridgeStock(){
  const products=[],bays=[];
  for(let bay=0;bay<FRIDGE_BAYS.length;bay++){
    const category=FRIDGE_BAYS[bay],cx=-3.35+bay*1.17,rows=[];
    for(let row=0;row<4;row++){
      const ids=category.rows[row],spec=FRIDGE_SKUS[ids[0]];
      const columns=spec.family==='salad'?4:spec.family==='sandwich'?5:spec.family==='can'?9:spec.w>.13?5:spec.w<.1?8:7;
      const step=.93/columns,depths=2,stacks=spec.family==='can'?2:1;
      const counts={};
      for(let col=0;col<columns;col++)for(let depth=0;depth<depths;depth++)for(let stack=0;stack<stacks;stack++){
        if(depth===1&&stack===0&&((bay*13+row*7+col*5)%17===3))continue;
        const sku=FRIDGE_SKUS[ids[col<Math.ceil(columns/2)?0:1]],x=cx-.465+step*(col+.5),y=.55+row*.45+stack*(sku.h+.012),z=-2.19-depth*.205;
        products.push({sku:sku.id,bay,row,depth,stack,x,y,z,rotation:((col+row+bay)%7===1?.025:0)});counts[sku.id]=(counts[sku.id]||0)+1;
      }
      rows.push({shelf:row,skus:ids,prices:ids.map(id=>FRIDGE_SKUS[id].price),counts,total:Object.values(counts).reduce((a,b)=>a+b,0)});
    }
    bays.push({id:category.id,name:category.name,x:cx,rows,total:rows.reduce((n,row)=>n+row.total,0),families:[...new Set(category.rows.flat().map(id=>FRIDGE_SKUS[id].family))]});
  }
  return {products,bays,total:products.length,skuCount:new Set(products.map(p=>p.sku)).size};
}

function labelRect(index,category=false){
  return category?{x:index*384,y:1440,w:384,h:64}:{x:index%4*512,y:1280+Math.floor(index/4)*32,w:512,h:32};
}
function makeAtlas(r){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=2048;
  const c=canvas.getContext('2d');
  for(const sku of Object.values(FRIDGE_SKUS)){
    const x=sku.skin%8*256,y=Math.floor(sku.skin/8)*256;
    c.fillStyle=sku.labelColor;c.fillRect(x,y,256,256);
    c.fillStyle='#f2efdd';c.fillRect(x+12,y+12,232,30);c.fillStyle='#2c4e42';c.font='bold 15px sans-serif';c.textAlign='center';c.fillText('WULING SELECT',x+128,y+33);
    // Every food family has a graphic silhouette in addition to a colour label.
    c.fillStyle='#eee5c8';c.beginPath();c.ellipse(x+128,y+109,69,45,0,0,Math.PI*2);c.fill();
    if(sku.family==='sandwich'){
      c.fillStyle='#d8c895';c.beginPath();c.moveTo(x+75,y+140);c.lineTo(x+175,y+140);c.lineTo(x+90,y+76);c.closePath();c.fill();c.strokeStyle='#819259';c.lineWidth=9;c.beginPath();c.moveTo(x+85,y+133);c.lineTo(x+151,y+133);c.stroke();
    }else if(sku.family==='salad'){
      for(let k=0;k<7;k++){c.fillStyle=k%3?'#7b9c54':'#d8bc59';c.beginPath();c.ellipse(x+90+k%4*24,y+94+Math.floor(k/4)*26,15,10,k*.9,0,Math.PI*2);c.fill();}
    }else{
      c.fillStyle=sku.fillColor;c.beginPath();c.ellipse(x+128,y+109,44,32,-.2,0,Math.PI*2);c.fill();
      c.fillStyle=sku.family==='carton'?'#f2f0de':sku.labelColor;c.beginPath();c.ellipse(x+130,y+101,18,24,.4,0,Math.PI*2);c.fill();
    }
    c.fillStyle='#f8f2df';c.font='bold 24px sans-serif';c.fillText(sku.name,x+128,y+183);
    c.font='14px sans-serif';c.fillText(sku.family==='pet'?'CHILLED · FRESH':sku.family==='carton'?'KEEP REFRIGERATED':'READY TO ENJOY',x+128,y+209);
    c.fillStyle='#f1eddb';c.fillRect(x+50,y+225,156,21);c.fillStyle='#405849';
    for(let k=0;k<27;k++)c.fillRect(x+56+k*5.3,y+228,k%3?2:3,15);
  }
  for(let bay=0;bay<FRIDGE_BAYS.length;bay++){
    const category=FRIDGE_BAYS[bay],rect=labelRect(bay,true);
    c.fillStyle='#e3e9d6';c.fillRect(rect.x,rect.y,rect.w,rect.h);c.fillStyle='#3d6252';c.textAlign='center';c.font='bold 37px sans-serif';c.fillText(category.name,rect.x+rect.w/2,rect.y+45);
    for(let row=0;row<4;row++){
      const priceRect=labelRect(bay*4+row),ids=category.rows[row];
      c.fillStyle='#efeddb';c.fillRect(priceRect.x,priceRect.y,priceRect.w,priceRect.h);c.fillStyle='#3c5547';c.font='bold 25px sans-serif';
      for(let k=0;k<2;k++)c.fillText(`${FRIDGE_SKUS[ids[k]].name}  $${FRIDGE_SKUS[ids[k]].price}`,priceRect.x+priceRect.w*(k*.5+.25),priceRect.y+25);
    }
  }
  const map=r.own(new T.CanvasTexture(canvas));map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const material=r.own(new T.MeshStandardMaterial({map,roughness:.42,metalness:.025}));
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 instanceAtlas;');
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = vMapUv * instanceAtlas.zw + instanceAtlas.xy;\n#endif');
  };
  material.customProgramCacheKey=()=> 'fridge-atlas-v5';
  return material;
}

function wedgeGeometry(){
  const vertices=[-.5,0,-.5,.5,0,-.5,-.5,1,-.5,-.5,0,.5,.5,0,.5,-.5,1,.5];
  const index=[0,2,1,3,4,5,0,1,4,0,4,3,0,3,5,0,5,2,2,5,4,2,4,1];
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,0,1,0,0,1,0,0,1],2));geometry.setIndex(index);geometry.computeVertexNormals();return geometry;
}
function cartonGeometry(){
  // Gable top, sealed fin and rectangular body share one indexed mesh.
  const positions=[-.5,0,-.5,.5,0,-.5,.5,0,.5,-.5,0,.5,-.5,.79,-.5,.5,.79,-.5,.5,.79,.5,-.5,.79,.5,0,.98,-.5,0,.98,.5];
  const index=[0,2,1,0,3,2,0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7,4,5,8,7,9,6,4,8,9,4,9,7,5,6,9,5,9,8];
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,0,0,0,0,.79,1,.79,1,.79,0,.79,.5,.98,.5,.98],2));geo.setIndex(index);geo.computeVertexNormals();return geo;
}

function clearPackagingMaterial(r){
  // Clear packaging is a thin shell: the liquid/label beneath it receives PBR
  // lights. The shell contributes only a restrained rim and refrigerator-strip
  // glint, avoiding the full point/spot-light loop on transparent overdraw.
  return r.own(new T.ShaderMaterial({
    name:'FridgeClearPackaging',transparent:true,depthWrite:false,lights:false,
    vertexShader:`
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      void main(){
        vec4 localPosition=vec4(position,1.0);
        vec3 shellNormal=normal;
        #ifdef USE_INSTANCING
          mat3 instanceBasis=mat3(instanceMatrix);
          // Inverse-transpose for orthogonal, non-uniform instance scales.
          shellNormal/=max(vec3(dot(instanceBasis[0],instanceBasis[0]),dot(instanceBasis[1],instanceBasis[1]),dot(instanceBasis[2],instanceBasis[2])),vec3(.000001));
          shellNormal=instanceBasis*shellNormal;
          localPosition=instanceMatrix*localPosition;
        #endif
        vec4 worldPosition=modelMatrix*localPosition;
        vec3 viewNormal=normalize(normalMatrix*shellNormal);
        // Undo only the camera rotation; normalMatrix already handles the model.
        vWorldNormal=normalize(vec3(dot(viewMatrix[0].xyz,viewNormal),dot(viewMatrix[1].xyz,viewNormal),dot(viewMatrix[2].xyz,viewNormal)));
        vWorldPosition=worldPosition.xyz;
        gl_Position=projectionMatrix*viewMatrix*worldPosition;
      }`,
    fragmentShader:`
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      void main(){
        vec3 normal=normalize(vWorldNormal);
        vec3 viewDirection=normalize(cameraPosition-vWorldPosition);
        float rim=pow(1.0-clamp(dot(normal,viewDirection),0.0,1.0),3.0);
        float bay=clamp(floor((vWorldPosition.x+3.35)/1.17+.5),0.0,4.0);
        vec3 stripPosition=vec3(-3.35+bay*1.17-.49,vWorldPosition.y+.04,-2.095);
        vec3 halfDirection=normalize(normalize(stripPosition-vWorldPosition)+viewDirection);
        float glint=pow(max(dot(normal,halfDirection),0.0),48.0);
        vec3 tint=mix(vec3(.64,.78,.74),vec3(.94,1.0,.97),rim*.6)+glint*.3;
        float alpha=clamp(.025+rim*.175+glint*.095,.025,.28);
        gl_FragColor=vec4(tint,alpha);
      }`,
  }));
}

export function buildFridgeProducts(root,r){
  const inventory=createFridgeStock(),atlasMaterial=makeAtlas(r),dummy=new T.Object3D(),tint=new T.Color();
  const bins=new Map();
  const instance=(name,geometry,material)=>{
    const mesh=new T.InstancedMesh(r.own(geometry),material,inventory.total),rect=new Float32Array(inventory.total*4);
    mesh.name='fridge-'+name;mesh.count=0;mesh.geometry.setAttribute('instanceAtlas',new T.InstancedBufferAttribute(rect,4));root.add(mesh);bins.set(name,mesh);return mesh;
  };
  const put=(mesh,p,s,sku,rotation=0,color,rect)=>{
    dummy.position.fromArray(p);dummy.scale.fromArray(s);dummy.rotation.set(0,rotation,0);dummy.updateMatrix();const n=mesh.count++;mesh.setMatrixAt(n,dummy.matrix);
    if(rect)mesh.geometry.attributes.instanceAtlas.setXYZW(n,rect.x/2048,1-(rect.y+rect.h)/2048,rect.w/2048,rect.h/2048);
    else mesh.geometry.attributes.instanceAtlas.setXYZW(n,sku.skin%8/8,(7-Math.floor(sku.skin/8))/8,1/8,1/8);
    if(color){tint.set(color);mesh.setColorAt(n,tint);}
  };
  const plastic=clearPackagingMaterial(r);
  const liquidMaterial=r.material('#ffffff',{roughness:.27,metalness:.015});
  const capMaterial=r.material('#ffffff',{roughness:.35,metalness:.045});
  const pet=instance('pet-shell',new T.LatheGeometry([new T.Vector2(0,0),new T.Vector2(.39,0),new T.Vector2(.48,.06),new T.Vector2(.48,.66),new T.Vector2(.44,.77),new T.Vector2(.23,.87),new T.Vector2(.22,.98),new T.Vector2(0,.98)],12),plastic);
  const liquid=instance('liquid',new T.CylinderGeometry(.43,.43,1,10),liquidMaterial);
  const wrap=instance('bottle-wrap',new T.CylinderGeometry(.485,.485,1,12,1,true),atlasMaterial);
  const caps=instance('caps',new T.CylinderGeometry(.235,.235,1,8),capMaterial);
  const cartons=instance('cartons',cartonGeometry(),atlasMaterial),seals=instance('carton-seals',new T.BoxGeometry(1,1,1),capMaterial);
  const cans=instance('cans',new T.CylinderGeometry(.5,.5,1,12),atlasMaterial),canLids=instance('can-lids',new T.CylinderGeometry(.48,.48,1,12),r.material('#a9b5a9',{metalness:.8,roughness:.27}));
  const sandwiches=instance('sandwiches',wedgeGeometry(),atlasMaterial);
  const salads=instance('salad-trays',new T.BoxGeometry(1,1,1),atlasMaterial),saladLids=instance('salad-lids',new T.BoxGeometry(1,1,1),plastic);
  const yogurts=instance('yogurt-pots',new T.CylinderGeometry(.5,.37,1,12),atlasMaterial),foil=instance('yogurt-lids',new T.CylinderGeometry(.525,.525,1,12),atlasMaterial);
  for(const entry of inventory.products){
    const sku=FRIDGE_SKUS[entry.sku],{x,y,z,rotation}=entry,{w,h,d}=sku;
    if(sku.family==='pet'){
      put(pet,[x,y,z],[w,h,d],sku,rotation);
      put(liquid,[x,y+h*.38,z],[w,h*.72,d],sku,rotation,sku.fillColor);
      put(wrap,[x,y+h*.48,z],[w,h*.33,d],sku,rotation);
      put(caps,[x,y+h*.985,z],[w,h*.065,d],sku,rotation,sku.labelColor);
    }else if(sku.family==='carton'){
      put(cartons,[x,y,z],[w,h,d],sku,rotation);put(seals,[x,y+h*.985,z],[w*.08,h*.045,d*.94],sku,rotation,'#eee9d6');
    }else if(sku.family==='can'){
      put(cans,[x,y+h*.5,z],[w,h,d],sku,rotation);put(canLids,[x,y+h+.001,z],[w,.006,d],sku,rotation);
    }else if(sku.family==='sandwich')put(sandwiches,[x,y,z],[w,h,d],sku,rotation);
    else if(sku.family==='salad'){
      put(salads,[x,y+h*.42,z],[w,h*.7,d],sku,rotation);put(saladLids,[x,y+h*.85,z],[w*1.015,h*.18,d*1.015],sku,rotation);
    }else if(sku.family==='yogurt'){
      put(yogurts,[x,y+h*.48,z],[w,h*.9,d],sku,rotation);put(foil,[x,y+h*.96,z],[w,.007,d],sku,rotation);
    }
  }
  const cards=instance('shelf-cards',new T.PlaneGeometry(1,1),atlasMaterial),fallbackSku=FRIDGE_SKUS['water-600'];
  for(let bay=0;bay<FRIDGE_BAYS.length;bay++){
    const x=-3.35+bay*1.17;
    put(cards,[x,2.68,-2.015],[.94,.16,1],fallbackSku,0,undefined,labelRect(bay,true));
    for(let row=0;row<4;row++)put(cards,[x,.53+row*.45-.018,-2.043],[1.0,.058,1],fallbackSku,0,undefined,labelRect(bay*4+row));
  }
  for(const mesh of bins.values()){

    mesh.instanceMatrix.needsUpdate=true;mesh.geometry.attributes.instanceAtlas.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();
  }
  return {categories:inventory.bays,stock:{total:inventory.total,skuCount:inventory.skuCount,bays:inventory.bays,drawCalls:bins.size,geometryFamilies:[...bins.keys()],atlasTextures:1,shelfCards:25,petTransmission:false,shellLighting:'unlit-fresnel',shellPBRLights:0}};
}

// Four original illustrated promotions share one atlas/material. These are scene
// artwork, not current offers from the convenience-store brand.
export function buildWindowPromotions(root,r){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1536;
  const c=canvas.getContext('2d'),ink='#294e40',paper='#e9e4ce';
  const themes=[['#1c6551','今晚，吃頓熱的。','熱便當＋湯','89'],['#665343','CITY CAFÉ','雨天，也留一杯熱的',''],['#e6d8a2','好好吃飯。','輕食・每日到店','49'],['#607d7c','慢一點，剛剛好。','熱飲・甜點・一點好心情','']];
  for(let n=0;n<4;n++){
    const x=n%2*512,y=Math.floor(n/2)*768,[bg,title,subtitle,price]=themes[n];
    c.save();c.translate(x,y);c.fillStyle=bg;c.fillRect(0,0,512,768);
    c.strokeStyle=paper;c.lineWidth=3;c.strokeRect(18,18,476,732);c.fillStyle=paper;c.textAlign='center';c.font='bold 16px Arial';c.fillText('WULING · OPEN 24 HOURS',256,58);
    c.font=n===1?'bold 58px Arial':'bold 43px sans-serif';c.fillStyle=n===2?ink:paper;c.fillText(title,256,143);
    if(n===0){
      c.fillStyle='#d8d5b6';c.beginPath();c.roundRect(66,225,380,285,36);c.fill();c.fillStyle='#6b694d';c.beginPath();c.roundRect(80,239,352,257,23);c.fill();
      c.fillStyle='#f0e9d0';c.beginPath();c.roundRect(95,255,170,224,17);c.fill();
      c.strokeStyle='#d1c7a5';c.lineWidth=3;for(let k=0;k<24;k++){const xx=111+k%5*28,yy=275+Math.floor(k/5)*38;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx+7,yy+4);c.stroke();}
      for(let k=0;k<4;k++){c.fillStyle=k%2?'#bd764a':'#a4633d';c.beginPath();c.ellipse(337,290+k*43,66,24,-.2,0,Math.PI*2);c.fill();}
      c.fillStyle='#759958';c.beginPath();c.ellipse(321,452,45,20,.3,0,Math.PI*2);c.fill();
      c.strokeStyle='#ecdcb8';c.lineWidth=4;for(const xx of [200,260,320]){c.beginPath();c.moveTo(xx,208);c.bezierCurveTo(xx-20,188,xx+18,177,xx,163);c.stroke();}
    }else if(n===1){
      c.fillStyle='#e9dfc7';c.beginPath();c.moveTo(144,286);c.lineTo(375,286);c.lineTo(345,516);c.lineTo(174,516);c.closePath();c.fill();c.fillStyle='#b39564';c.fillRect(163,365,191,74);
      c.fillStyle='#43392c';c.beginPath();c.ellipse(260,282,122,23,0,0,Math.PI*2);c.fill();c.fillStyle='#e5dbc4';c.font='bold 29px Arial';c.fillText('CITY CAFÉ',258,412);
      c.strokeStyle='#d7c7a4';c.lineWidth=7;for(const xx of [211,268,323]){c.beginPath();c.moveTo(xx,251);c.bezierCurveTo(xx-31,216,xx+27,197,xx,172);c.stroke();}
    }else if(n===2){
      c.fillStyle='#bcc5a2';c.beginPath();c.roundRect(70,243,374,276,26);c.fill();
      c.fillStyle='#f0e4ba';c.beginPath();c.moveTo(108,482);c.lineTo(398,482);c.lineTo(132,260);c.closePath();c.fill();
      c.strokeStyle='#84a05e';c.lineWidth=18;c.beginPath();c.moveTo(122,455);c.lineTo(340,455);c.stroke();c.strokeStyle='#d4b560';c.lineWidth=24;c.beginPath();c.moveTo(121,422);c.lineTo(303,422);c.stroke();
      c.fillStyle='#fbf3d3';c.beginPath();c.moveTo(117,395);c.lineTo(270,395);c.lineTo(131,277);c.closePath();c.fill();
    }else{
      c.fillStyle='#d9c9ad';c.beginPath();c.arc(255,346,139,Math.PI,0);c.lineTo(116,346);c.fill();c.strokeStyle='#e6dcc6';c.lineWidth=10;c.beginPath();c.moveTo(255,344);c.lineTo(255,488);c.quadraticCurveTo(255,529,289,510);c.stroke();
      c.fillStyle='#adc5b7';for(let k=0;k<15;k++){const xx=65+k%5*94,yy=215+Math.floor(k/5)*112;c.beginPath();c.ellipse(xx,yy,5,17,.2,0,Math.PI*2);c.fill();}
    }
    c.fillStyle=n===2?ink:paper;c.font='bold 30px sans-serif';c.fillText(subtitle,256,600);
    if(price){c.font='bold 67px Arial';c.fillText(`$${price}`,256,687);}else{c.font='22px sans-serif';c.fillText('一個人也好，兩個人更暖。',256,678);}
    c.restore();
  }
  const map=r.own(new T.CanvasTexture(canvas));map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const material=r.own(new T.MeshStandardMaterial({map,roughness:.79,metalness:0}));
  const placements=[{x:-3.54,y:1.92,w:.75,h:1.1,n:0},{x:3.5,y:1.94,w:.75,h:1.1,n:1},{x:-2.63,y:2.25,w:.55,h:.65,n:2},{x:2.58,y:2.22,w:.55,h:.65,n:3}];
  for(const p of placements){
    const geometry=r.own(new T.PlaneGeometry(1,1)),uv=geometry.attributes.uv;
    for(let k=0;k<uv.count;k++)uv.setXY(k,(p.n%2+uv.getX(k))/2,(1-Math.floor(p.n/2)+uv.getY(k))/2);
    const mesh=r.mesh(geometry,material,root,[p.x,p.y,1.873],[p.w,p.h,1]);mesh.rotation.z=p.n%2?.009:-.007;
    for(const side of [-1,1])r.box(root,'#cbd0bb',[p.x+side*p.w*.36,p.y+p.h*.48,1.877],[.075,.025,.003],{roughness:.9});
  }
  return {count:4,frontGlassCoverage:placements.reduce((n,p)=>n+p.w*p.h,0)/(6.44*2.08),illustrated:true};
}
