import * as T from 'three';
import {buildRossiFigurine} from './rossi-figurine.js';
// One fixed pool for pixelated food; no postprocessing pass or per-frame allocation.
export function buildInvestigationProps(scene,r,{serverRoot=null}={}){
 const root=new T.Group();root.name='investigation-details';scene.add(root);
 const box=(owner,c,p,s,o={})=>r.box(owner,c,p,s,o),label=(owner,text,p,s,options={})=>r.mesh(r.geometry('PlaneGeometry',1,1),r.label(text,{width:1024,height:256,font:'bold 60px sans-serif',...options}),owner,p,s);
 const camera=new T.Group();camera.name='store-cctv';camera.position.set(3.87,2.53,-1.65);root.add(camera);camera.rotation.y=Math.PI;
 box(camera,'#687a77',[0,.12,-.14],[.08,.32,.1],{metalness:.6});box(camera,'#c4ccbd',[0,0,0],[.23,.19,.42],{metalness:.3});box(camera,'#24363c',[0,-.01,.219],[.16,.12,.025]);
 const lens=r.mesh(r.geometry('CylinderGeometry',.048,.048,.04,16),r.material('#152c33',{metalness:.8,roughness:.16}),camera,[0,-.01,.245]);lens.rotation.x=Math.PI/2;
 const led=r.mesh(r.geometry('SphereGeometry',.014,8,6),r.material('#e67965',{emissive:0xc43622,emissiveIntensity:1}),camera,[.075,.04,.24]);camera.rotation.y=-1.2;
 box(camera,'#687a77',[0,.47,0],[.07,.94,.07],{metalness:.6});
 const cable=new T.CatmullRomCurve3([new T.Vector3(0,.16,-.17),new T.Vector3(.2,.28,-.2),new T.Vector3(.4,.25,-.19)]);r.mesh(r.own(new T.TubeGeometry(cable,8,.012,4,false)),r.material('#24393d'),camera);
 const cargo=new T.Group();cargo.position.set(-3.4,.32,1.87);root.add(cargo);
 for(let i=0;i<2;i++){box(cargo,'#6c7565',[i*.43,i*.1+.26,0],[.4,.5,.43],{metalness:.3});box(cargo,'#b2a272',[i*.43,i*.1+.27,.22],[.07,.46,.012]);}
 label(cargo,'土產 / 店到店',[-.02,.32,.227],[.35,.12,1],{font:'bold 56px sans-serif'});
 const sheet=label(cargo,'息壤 10,000 噸',[.48,.76,.23],[.73,.2,1]);sheet.name='smuggling-manifest';
 label(cargo,'送貨方：終末地有限公司／地點：武陵 711',[.48,.59,.232],[.73,.12,1],{font:'bold 40px sans-serif'});
 const paperGroup=new T.Group();root.add(paperGroup);
 const posterPositions=[[-3.55,.90,2.91],[2.20,1.98,1.82],[3.30,1.98,1.82]];
 const posterUrl=`${import.meta.env?.BASE_URL||'/'}images/store-posters.png`;
 for(let i=1;i<3;i++){
   const texture=typeof document==='undefined'||typeof document.createElementNS!=='function'?null:r.own(new T.TextureLoader().load(posterUrl));
   if(texture){texture.colorSpace=T.SRGBColorSpace;texture.repeat.set(1/3,1);texture.offset.set(i/3,0);}
   const material=r.own(new T.MeshBasicMaterial({map:texture,color:texture?0xffffff:0xd6cfb2,side:T.FrontSide,toneMapped:false}));
   const poster=r.mesh(r.geometry('PlaneGeometry',.65,1.3),material,paperGroup,posterPositions[i]);
   poster.name=`store-poster-${i+1}`;
   const inside=r.mesh(r.geometry('PlaneGeometry',.65,1.3),material,paperGroup,[posterPositions[i][0],posterPositions[i][1],1.813]);inside.rotation.y=Math.PI;inside.name=`store-poster-${i+1}-inside`;
 }
 // The low server case keeps the enlarged figure between the front window mullions.
 const room=new T.Group();room.name='rossi-server-display';(serverRoot||root).add(room);room.position.set(.28,serverRoot?0:3.51,serverRoot?.70:1.42);
 box(room,'#344745',[0,.40,0],[.46,.80,.44]);box(room,'#203239',[0,.35,.23],[.40,.49,.025]);
 for(let i=0;i<3;i++)box(room,'#718784',[0,.25+i*.09,.25],[.30,.035,.018]);
 const figurine=buildRossiFigurine(r);figurine.scale.multiplyScalar(1.8);figurine.position.set(0,.80,.015);room.add(figurine);
 label(room,'禁止碰我老婆',[-.49,.43,.25],[.43,.10,1],{bg:'#2b3545',color:'#d0bbc9',font:'bold 58px sans-serif'});
 const pixels=r.own(new T.InstancedMesh(r.geometry('CircleGeometry',1,7),r.own(new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide})),96));pixels.frustumCulled=false;pixels.name='purple-food-mosaic';root.add(pixels);
 const dummy=new T.Object3D(),color=new T.Color(),spots=[new T.Vector3(3.2,1.85,1.06),new T.Vector3(3.83,1.55,1.06),new T.Vector3(3.1,1.1,1.94),new T.Vector3(3.8,.34,.3),new T.Vector3(2.55,.34,1.4),new T.Vector3(3.9,1.65,1.93)];
 for(let i=0;i<96;i++){pixels.setColorAt(i,color.setHSL(.75+(i%4)*.018,.4,.23+(i%5)*.075));pixels.setMatrixAt(i,dummy.matrix);}pixels.instanceColor.needsUpdate=true;
 const launch=new T.Vector3(3.45,1.67,1.1),collectionWorld=new T.Vector3();
 const crater=new T.Group();crater.name='server-impact-crater';root.add(crater);crater.visible=false;
 const dark=r.own(new T.MeshBasicMaterial({color:0x030c13})),hole=r.mesh(r.geometry('CircleGeometry',1.08,32),dark,crater,[0,.012,0]);hole.rotation.x=-Math.PI/2;
 for(let i=0;i<18;i++){const a=i/18*Math.PI*2,m=r.box(crater,i%2?'#506462':'#7c8275',[Math.cos(a)*1.05,.055,Math.sin(a)*1.05],[.34,.13,.24],{roughness:.96});m.rotation.set((i%3)*.13,a,i%2*.18);}
 let burstAt=-100,burstCount=0,lastFailures=0,wasPast=false,active=0,collectionDamage=0;
 function setCollectionDamage(damage=0){collectionDamage=damage;if(serverRoot)return;const p=Math.max(0,Math.min(1,(damage-50)/25)),q=p*p*(3-2*p);room.position.set(.28+1.05*q,3.51-3.12*q,1.42+3.7*q);room.rotation.set(.12*q,0,-.40*q);}
 function update(t,delta,state={}){
   const past=['flashback','hack','credentials','heat'].includes(state.phase),failures=state.heat?.failures||0;
   if(state.phase==='ready'){lastFailures=0;burstCount=0;burstAt=-100;}
   if(past&&failures>lastFailures){burstCount=Math.min(3,burstCount+1);burstAt=t;}
   if(past)lastFailures=failures;
   const stains=past?(state.phase==='heat'?Math.min(6,burstCount*3):0):Math.min(6,burstCount*3);
   active=stains*16;
   for(let i=0;i<96;i++){
     const spot=spots[Math.floor(i/16)],j=i%16,age=t-burstAt,flight=state.phase==='heat'&&age<1.1&&i>=Math.max(0,(stains-2)*16),p=Math.max(0,Math.min(1,age/1.1));
     dummy.position.set(spot.x+(j%4-1.5)*.065,spot.y+(Math.floor(j/4)-1.5)*.065,spot.z+.01*(i%3));
     if(!past&&(state.progress||0)>=62)dummy.position.y-=1.045;
     if(flight){dummy.position.lerpVectors(launch,dummy.position,p);dummy.position.y+=Math.sin(p*Math.PI)*.75;}
     dummy.scale.set(i<active?.035+(i%3)*.012:0,i<active?.018+(i%4)*.006:0,1);dummy.rotation.set(spot.y<.5?-Math.PI/2:0,0,i*2.4);dummy.updateMatrix();pixels.setMatrixAt(i,dummy.matrix);
   }
   pixels.instanceMatrix.needsUpdate=true;led.material.emissiveIntensity=.5+Math.sin(t*2)**2*.5;
   paperGroup.visible=(state.progress||0)<62||past;camera.visible=((state.progress||0)<62||past)&&(state.inspectCctv||past||state.phase==='cargo'&&Number((state.nodeId||'').split('_').at(-1))>=5||['observation','comm-request','briefing','login','captcha','lever','ascent','director-reminder','shoe-view','pylon-link','charge','fire-ready','combat','energy','rewind'].includes(state.phase));
   room.visible=!past;setCollectionDamage(state.collectionDamage??state.progress??0);cargo.visible=(state.progress||0)<62||past;
   wasPast=past;
 }
 return {root,camera,cargo,update,setCollectionDamage,breakServer(point){crater.position.set(point[0],.323,point[2]);crater.visible=true;},reset(){crater.visible=false;burstCount=0;lastFailures=0;burstAt=-100;setCollectionDamage(0);},get state(){return {crater:crater.visible,pixels:active,bursts:burstCount,cctv:true,manifest:true,collectionDamage,collectionPosition:room.getWorldPosition(collectionWorld).toArray(),figurine:{...figurine.userData}};}};
}
