import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {optimizeStaticSet} from './static-batches.js';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
const pastPhases=new Set(['flashback','heat-demo','heat','flashback-end']);

// One persistent, hollow appliance. Its clean history and charred present share geometry.
export function buildMicrowave(scene,r,{position=[3.45,.31,1.43]}={}){
  const root=new T.Group();root.name='charred-microwave-v8';root.position.fromArray(position);root.rotation.y=Math.PI;scene.add(root);
  const cabinet=new T.Group(),oven=new T.Group();root.add(cabinet,oven);oven.position.y=1.29;
  const unitBox=r.geometry('BoxGeometry',1,1,1),bodyMaterial=r.own(new T.MeshStandardMaterial({color:0x222724,roughness:.91,metalness:.17}));
  const trimMaterial=r.own(new T.MeshStandardMaterial({color:0x455149,roughness:.65,metalness:.43}));
  const dark=r.material('#0d191b',{roughness:.78}),steel=r.material('#798c83',{roughness:.33,metalness:.73});
  const box=(owner,mat,p,s)=>r.mesh(unitBox,mat,owner,p,s);
  r.box(cabinet,'#445a51',[0,.43,0],[1.09,.85,.48],{roughness:.7,metalness:.12});
  r.box(cabinet,'#c8c9b9',[0,.91,0],[1.18,.1,.57],{roughness:.35,metalness:.2});
  for(const x of [-.25,.25]){
    r.box(cabinet,'#334a42',[x,.45,.248],[.49,.74,.015]);
    r.box(cabinet,'#9eab97',[x,.73,.267],[.18,.022,.025],{roughness:.36,metalness:.6});
  }
  const serviceLabel=r.mesh(r.geometry('PlaneGeometry',1,1),r.label('加熱服務',{width:512,height:128,font:'bold 44px sans-serif',bg:'#d3cfb6',color:'#32483d'}),cabinet,[0,.83,.263],[.7,.12,1]);
  optimizeStaticSet(cabinet,r);
  // A six-sided casing with an actual food cavity, separate door frame and side controls.
  box(oven,bodyMaterial,[0,.275,0],[1.04,.06,.62]);box(oven,bodyMaterial,[0,-.275,0],[1.04,.06,.62]);
  box(oven,bodyMaterial,[-.5,0,0],[.05,.52,.62]);box(oven,bodyMaterial,[.5,0,0],[.05,.52,.62]);
  box(oven,bodyMaterial,[0,0,-.285],[1.02,.51,.055]);
  // The door faces the shop aisle. Its vented rear remains readable from the wet street.
  const rear=new T.Group();rear.name='microwave-vented-rear';oven.add(rear);
  box(rear,trimMaterial,[0,.015,-.317],[.88,.36,.008]);
  for(let row=0;row<3;row++)for(let col=0;col<8;col++)box(rear,dark,[-.335+col*.095,-.09+row*.08,-.325],[.064,.022,.009]);
  for(const x of [-.395,.395])for(const y of [-.125,.155]){
    const screw=r.mesh(r.geometry('CylinderGeometry',.011,.011,.006,8),steel,rear,[x,y,-.327]);screw.rotation.x=Math.PI/2;
  }
  box(rear,steel,[.255,-.208,-.319],[.17,.047,.008]);
  for(let i=0;i<3;i++)box(rear,dark,[.21+i*.045,-.208,-.325],[.025,.005,.004]);
  optimizeStaticSet(rear,r);
  box(oven,dark,[-.09,0,-.245],[.73,.45,.025]);
  for(const x of [-.465,.277])box(oven,trimMaterial,[x,0,.32],[.045,.52,.048]);
  for(const y of [-.24,.24])box(oven,trimMaterial,[-.095,y,.32],[.78,.04,.048]);
  box(oven,bodyMaterial,[.39,0,.312],[.2,.51,.07]);
  const pane=r.mesh(r.geometry('PlaneGeometry',1,1),r.own(new T.MeshStandardMaterial({color:0x7a9b9b,transparent:true,opacity:.13,roughness:.25,metalness:.15,side:T.DoubleSide,depthWrite:false})),oven,[-.095,0,.35],[.7,.43,1]);pane.name='microwave-glazed-door';
  for(const x of [.24,.268])box(oven,steel,[x,0,.39],[.018,.28,.025]);
  box(oven,steel,[.254,0,.409],[.023,.26,.025]);
  for(let i=0;i<8;i++)box(oven,dark,[-.4+i*.075,.309,-.04],[.036,.008,.29]);
  for(const x of [-.39,.39])for(const z of [-.21,.21])box(oven,dark,[x,-.33,z],[.09,.06,.1]);
  for(const y of [-.11,-.2])r.mesh(r.geometry('CylinderGeometry',.031,.031,.018,12),steel,oven,[.4,y,.362]).rotation.x=Math.PI/2;
  const displayBack=box(oven,dark,[.39,.14,.355],[.17,.115,.015]);
  const labels={};
  const texts={clean:'03:00',burning:'ERR',heating:'0.30 s',warm:'極速保溫',charred:'極速保溫'};
  for(const mode of ['clean','burning','heating','warm']){
    const material=r.label(texts[mode],{width:512,height:160,font:mode==='warm'?'bold 65px sans-serif':'bold 100px monospace',bg:'#102720',color:mode==='burning'?'#f4b47c':'#b8efb0'});material.emissiveIntensity=.6;
    const label=r.mesh(r.geometry('PlaneGeometry',1,1),material,oven,[.39,.14,.367],[.16,.082,1]);label.name='microwave-display-'+mode;label.visible=false;labels[mode]=label;
  }
  const warningLight=r.mesh(r.geometry('SphereGeometry',.016,8,6),r.own(new T.MeshBasicMaterial({color:0xdbb95f,toneMapped:false})),oven,[.4,.035,.367]);
  // Permanent burn marks are real surface patches, not a featureless black cube.
  const soot=new T.Group();soot.name='microwave-burn-scars';oven.add(soot);
  const sootMaterial=r.own(new T.MeshStandardMaterial({color:0x080e10,roughness:.99,metalness:0}));
  for(let i=0;i<12;i++){
    const x=-.45+(i%6)*.18,y=i<6?.25:-.24;
    const mark=box(soot,sootMaterial,[x,y,.354],[.1+(i%3)*.025,.025+(i%4)*.009,.007]);mark.rotation.z=(i%3-1)*.13;
  }
  for(let i=0;i<5;i++)box(soot,sootMaterial,[.522,.18-i*.09,-.12+i*.035],[.007,.045,.12]);
  const rearScars=new T.Group();rearScars.name='microwave-rear-burn-scars';soot.add(rearScars);
  for(let i=0;i<6;i++){
    const scar=box(rearScars,sootMaterial,[-.37+i*.13,.21+(i%2)*.025,-.331],[.07+(i%3)*.016,.03+(i%2)*.02,.006]);scar.rotation.z=(i%3-1)*.18;
  }
  // The tray and food retain colour cues while the outer appliance stays charred.
  const foodGroup=new T.Group();foodGroup.name='microwave-meal';oven.add(foodGroup);
  const tray=r.mesh(r.geometry('CylinderGeometry',.255,.255,.018,28),r.material('#aaa994',{roughness:.4,metalness:.25}),foodGroup,[-.095,-.19,-.005]);
  box(foodGroup,r.material('#dfddcb',{roughness:.61}),[-.095,-.16,.015],[.57,.055,.36]);
  const riceMaterial=r.own(new T.MeshStandardMaterial({color:0xe6d9b6,roughness:.86})),mealMaterial=r.own(new T.MeshStandardMaterial({color:0x9b7042,roughness:.66}));
  const rice=r.own(new T.InstancedMesh(r.geometry('BoxGeometry',1,1,1),riceMaterial,24)),dummy=new T.Object3D();foodGroup.add(rice);
  for(let i=0;i<24;i++){dummy.position.set(-.28+(i%6)*.042,-.105+((i%3)*.008),-.08+Math.floor(i/6)*.054);dummy.scale.set(.045,.038,.049);dummy.rotation.set(i*.02,i*.33,0);dummy.updateMatrix();rice.setMatrixAt(i,dummy.matrix);}rice.instanceMatrix.needsUpdate=true;rice.computeBoundingSphere();
  for(let i=0;i<5;i++){const food=r.mesh(r.geometry('SphereGeometry',1,7,5),mealMaterial,foodGroup,[.045+(i%2)*.09,-.087+Math.floor(i/3)*.015,-.08+Math.floor(i/2)*.075],[.075,.045,.059]);food.rotation.z=i*.3;}
  const vegetables=r.material('#68804c',{roughness:.82});for(let i=0;i<5;i++)r.mesh(r.geometry('OctahedronGeometry',.045,0),vegetables,foodGroup,[.12+(i%2)*.05,-.08,.08+(i%3)*.026]);
  const sparkleMaterial=r.own(new T.MeshBasicMaterial({color:new T.Color(.5,1.1,1.8),transparent:true,opacity:.8,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));
  const arcSegments=7,arcCount=4,arcs=r.own(new T.InstancedMesh(r.geometry('CylinderGeometry',1,1,1,4,1,true),sparkleMaterial,arcCount*arcSegments));arcs.name='microwave-live-electric-arcs';arcs.frustumCulled=false;arcs.instanceMatrix.setUsage(T.DynamicDrawUsage);oven.add(arcs);
  const arcStart=[[-.45,.19,.37],[.29,.15,-.347],[.38,-.12,.38],[-.28,.33,-.18]],arcEnd=[[-.16,.32,.37],[-.1,.31,-.347],[.55,.08,.25],[-.45,.11,.29]],a=new T.Vector3(),b=new T.Vector3(),direction=new T.Vector3(),up=new T.Vector3(0,1,0);
  const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;const ctx=glowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,1,32,32,31);gradient.addColorStop(0,'rgba(255,255,255,.62)');gradient.addColorStop(.45,'rgba(255,255,255,.24)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const cloudMap=r.own(new T.CanvasTexture(glowCanvas)),clouds=[];
  for(let i=0;i<7;i++){
    const material=r.own(new T.SpriteMaterial({map:cloudMap,color:0x9ba8a4,transparent:true,opacity:0,depthWrite:false})),sprite=new T.Sprite(material);sprite.visible=false;oven.add(sprite);clouds.push({sprite,material});
  }
  const spill=r.mesh(r.geometry('PlaneGeometry',1,1),r.own(new T.MeshBasicMaterial({map:cloudMap,color:0x85d4e5,transparent:true,opacity:.04,depthWrite:false,blending:T.AdditiveBlending})),root,[0,.973,.06],[1.42,.92,1]);spill.rotation.x=-Math.PI/2;
  const countMeshes=()=>{let count=0;oven.traverse(node=>{if(node.isMesh)count++;});return count;};
  const ovenMeshesBefore=countMeshes();
  // Visibility and colour animation remain separate from the fixed housing batches.
  const keepDynamic=owner=>owner.traverse(node=>{if(node.isMesh||node.isSprite)node.userData.dynamic=true;});
  for(const owner of [pane,...Object.values(labels),warningLight,soot,foodGroup,arcs,...clouds.map(item=>item.sprite)])keepDynamic(owner);
  // The general batcher bakes material colours. Preserve these two live materials so
  // the earlier CCTV casing can still change from clean paint to the charred present.
  oven.updateMatrixWorld(true);
  const inverseOven=oven.matrixWorld.clone().invert(),transform=new T.Matrix4();
  for(const [name,material]of [['shell',bodyMaterial],['trim',trimMaterial]]){
    const meshes=[];oven.traverse(node=>{if(node.isMesh&&node.material===material&&!node.userData.dynamic)meshes.push(node);});
    if(meshes.length>1){
      const geometries=meshes.map(mesh=>{const geometry=mesh.geometry.clone();transform.multiplyMatrices(inverseOven,mesh.matrixWorld);geometry.applyMatrix4(transform);return geometry;});
      const merged=mergeGeometries(geometries,false);for(const geometry of geometries)geometry.dispose();
      if(merged){const mesh=new T.Mesh(r.own(merged),material);mesh.name='microwave-live-'+name;mesh.userData.dynamic=true;oven.add(mesh);merged.computeBoundingSphere();for(const source of meshes)source.removeFromParent();}
    }
    // Also protect a single remaining live-material surface if a future layout changes.
    oven.traverse(node=>{if(node.isMesh&&node.material===material)node.userData.dynamic=true;});
  }
  const ovenBatch=optimizeStaticSet(oven,r),ovenMeshesAfter=countMeshes();
  let mode='charred',forced=null,charred=1,foodState='cold',arcActive=false,activeArcs=0,steam=0,wreck=false,warming=true,lastPhase='ready',clock=0;
  const cleanColor=new T.Color('#c4c8ba'),burntColor=new T.Color('#202825'),cleanTrim=new T.Color('#85978a'),burntTrim=new T.Color('#394940'),riceCold=new T.Color('#d8cdb0'),riceHot=new T.Color('#eee2ba'),riceBurnt=new T.Color('#332b20'),meatHot=new T.Color('#b17b45'),meatBurnt=new T.Color('#251f19');
  const currentPosition=[...position];
  function modeFor(state){
    if(forced)return forced;if(state.microwaveMode)return state.microwaveMode;
    const phase=state.phase||'ready';if(phase==='flashback')return 'clean';if(phase==='heat-demo')return 'burning';if(phase==='heat')return 'heating';if(phase==='flashback-end')return 'warm';if(phase==='rewind'&&state.rewindProgress>.72)return 'clean';return 'charred';
  }
  function arcPoint(index,p,t,out){const s=arcStart[index],e=arcEnd[index],jitter=Math.sin(p*39+t*43+index*7)*.035*Math.sin(p*Math.PI),side=s[2]<-.3&&e[2]<-.3?-1:1;out.set(s[0]+(e[0]-s[0])*p+jitter,s[1]+(e[1]-s[1])*p+Math.cos(p*29-t*37)*.034*Math.sin(p*Math.PI),s[2]+(e[2]-s[2])*p+Math.sin(p*Math.PI)*.06*side);return out;}
  function update(t,delta,state={}){
    lastPhase=state.phase||'ready';clock=lastPhase==='ready'?t:Number.isFinite(state.clock)?state.clock:t;mode=modeFor(state);
    const heat=state.heat||{},past=pastPhases.has(lastPhase)||(lastPhase==='rewind'&&state.rewindProgress>.72);
    wreck=(state.progress||0)>=62&&!past;cabinet.visible=!wreck;
    const wantedY=wreck?.245:1.29;oven.position.y=T.MathUtils.damp(oven.position.y,wantedY,7,Math.min(.1,Math.max(0,delta)));if(Math.abs(oven.position.y-wantedY)<.001)oven.position.y=wantedY;
    oven.rotation.z=T.MathUtils.damp(oven.rotation.z,wreck?-.11:0,6,Math.min(.1,Math.max(0,delta)));
    charred=mode==='clean'?0:mode==='burning'?clamp((heat.demoIndex||0)*.86+(heat.demoProgress||0)*1.4):1;
    soot.visible=charred>.18;bodyMaterial.color.copy(cleanColor).lerp(burntColor,charred);bodyMaterial.roughness=.36+charred*.58;trimMaterial.color.copy(cleanTrim).lerp(burntTrim,charred);
    foodState=mode==='burning'&&(heat.demoProgress||0)>.5||heat.status==='burnt'?'burnt':heat.status==='won'?'hot':'cold';
    const hot=clamp(heat.progress||0);riceMaterial.color.copy(riceCold).lerp(riceHot,hot);mealMaterial.color.copy(meatHot);if(foodState==='burnt'){riceMaterial.color.copy(riceBurnt);mealMaterial.color.copy(meatBurnt);}
    warming=['warm','charred'].includes(mode);const labelMode=mode==='charred'?'warm':mode;for(const [key,label]of Object.entries(labels))label.visible=key===labelMode;
    const visibleFood=past||!wreck;foodGroup.visible=visibleFood;
    const strong=mode==='burning'||mode==='heating'&&heat.holding;
    const pulse=strong?1:Math.sin(clock*4.7)+Math.sin(clock*9.3+.8)>.82?.7:0;
    arcActive=pulse>0&&mode!=='clean';activeArcs=arcActive?(strong?4:2):0;arcs.visible=arcActive;
    for(let arc=0;arc<arcCount;arc++)for(let segment=0;segment<arcSegments;segment++){
      if(arc<activeArcs){arcPoint(arc,segment/arcSegments,clock,a);arcPoint(arc,(segment+1)/arcSegments,clock,b);direction.copy(b).sub(a);const length=direction.length();direction.normalize();dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,direction);const radius=strong?.006:.0035;dummy.scale.set(radius,length,radius);}else dummy.scale.setScalar(0);
      dummy.updateMatrix();arcs.setMatrixAt(arc*arcSegments+segment,dummy.matrix);
    }
    arcs.instanceMatrix.needsUpdate=true;warningLight.visible=mode!=='clean'&&(strong||Math.sin(clock*3.1)>.1);spill.material.opacity=arcActive?(strong?.12:.065):.018;spill.visible=!wreck;
    const smoking=mode==='burning'&&(heat.demoProgress||0)>.42||heat.status==='burnt',steaming=smoking||mode==='heating'&&heat.holding&&hot>.4||heat.status==='won';steam=0;
    for(let i=0;i<clouds.length;i++){
      const item=clouds[i],life=((clock*(smoking?.7:.48)+i*.137)%1+1)%1;item.sprite.visible=steaming&&(smoking||i<3);if(!item.sprite.visible)continue;steam++;
      item.sprite.position.set(-.25+Math.sin(i*2.1+clock*.3)*.17,.26+life*(smoking?1.1:.66),.16+Math.cos(i*1.7)*.12);item.sprite.scale.setScalar((.09+life*.5)*(smoking?1.3:.72));item.material.color.setHex(smoking?0x677772:0xc0d2c7);item.material.opacity=Math.sin(life*Math.PI)*(smoking?.55:.23);
    }
    currentPosition[0]=root.position.x;currentPosition[1]=root.position.y+oven.position.y;currentPosition[2]=root.position.z;
  }
  root.traverse(node=>{if(node.isMesh||node.isSprite){node.userData.dynamic=true;node.castShadow=false;node.receiveShadow=true;}});
  update(0,0,{phase:'ready',clock:0,progress:0});
  return {root,cabinet,oven,position:currentPosition,
    setMode(value){forced=value==='auto'||!value?null:value;},
    reset(){forced=null;mode='charred';oven.position.y=1.29;oven.rotation.set(0,0,0);update(0,0,{phase:'ready',progress:0});},update,
    get state(){return {mode,phase:lastPhase,charred,arcActive,arcs:activeArcs,steam,food:foodState,wreck,warming,position:[...currentPosition],counterVisible:cabinet.visible,batches:{meshesBefore:ovenMeshesBefore,meshesAfter:ovenMeshesAfter,sharedDraws:ovenBatch.sharedDraws},display:mode==='clean'?'03:00':mode==='burning'?'ERR':mode==='heating'?'0.30 s':'極速保溫'};}
  };
}
