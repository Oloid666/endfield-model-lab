import * as T from 'three';

// A small original fan model, adapted from the permitted dragon-only reference.
// Eyes are painted on a curved surface. The rest of the racing props are excluded.
export function buildDragon(r) {
  const root=new T.Group(),body=new T.Group();root.add(body);root.name='dragon';root.userData.hotspot='dragon';
  const foodMount=new T.Group();foodMount.position.set(0,.42,.53);body.add(foodMount);
  const sphere=r.geometry('SphereGeometry',1,20,16);
  const white=r.material('#e0e4cc',{roughness:.74});
  const part=(mat,p,s,parent=body)=>r.mesh(sphere,mat,parent,p,s);
  part(white,[0,.63,0],[.56,.59,.49]);
  const feet=[];for(const side of [-1,1]){
    feet.push(part(white,[side*.23,.14,.12],[.15,.14,.17]));
    const horn=r.mesh(r.geometry('ConeGeometry',.12,.48,10),r.material('#bf9e52',{roughness:.48}),body,[side*.32,1.17,-.02]);horn.rotation.z=side*-.32;
  }
  const arms=[];for(const side of [-1,1])arms.push(part(white,[side*.53,.43,.07],[.16,.11,.15]));
  const ears=[];for(const side of [-1,1]){const ear=part(white,[side*.49,.88,-.025],[.12,.14,.075]);ear.rotation.z=side*-.28;ears.push(ear);}
  const tail=r.mesh(r.geometry('ConeGeometry',.15,.53,10),r.material('#80ab8d'),body,[0,.27,-.48]);tail.rotation.x=-1.1;
  const tuft=r.mesh(r.geometry('ConeGeometry',.1,.25,8),r.material('#a9c0b3'),body,[0,1.34,-.08]);tuft.rotation.z=-.18;
  r.box(body,'#b65843',[.42,1.19,.05],[.28,.06,.08]);r.box(body,'#b65843',[.54,1.03,.03],[.06,.3,.05]);
  function face(blink,mood='normal'){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
    c.lineWidth=8;c.strokeStyle='#344d42';c.lineCap='round';
    for(const x of [70,186]){
      if(blink||mood==='happy'){c.beginPath();c.moveTo(x-25,137);c.quadraticCurveTo(x,145,x+25,137);c.stroke();}
      else{const shock=mood==='shock',doubt=mood==='doubt',g=c.createLinearGradient(0,75,0,178);g.addColorStop(0,'#408572');g.addColorStop(1,'#c1c777');c.fillStyle=g;c.beginPath();c.roundRect(x-(shock?29:27),shock?81:doubt&&x===70?111:88,shock?58:54,shock?88:doubt&&x===70?55:80,20);c.fill();c.stroke();c.beginPath();c.moveTo(x-29,shock?72:doubt&&x===70?102:88);c.lineTo(x+29,shock?66:doubt&&x===70?111:88);c.stroke();c.fillStyle='#e7efc6';c.beginPath();c.ellipse(x-6,shock?105:108,shock?6:7,shock?8:10,0,0,Math.PI*2);c.fill();}
    }
    c.lineWidth=5;c.beginPath();
    if(mood==='shock'){c.ellipse(128,195,12,17,0,0,Math.PI*2);c.fillStyle='#344d42';c.fill();}
    else if(mood==='doubt'){c.moveTo(108,194);c.quadraticCurveTo(128,187,150,191);c.stroke();}
    else{c.moveTo(108,188);c.quadraticCurveTo(116,202,128,191);c.quadraticCurveTo(141,202,150,187);c.stroke();}
    const map=r.own(new T.CanvasTexture(canvas));map.colorSpace=T.SRGBColorSpace;return map;
  }
  const maps=[face(false),face(true),face(false,'happy'),face(false,'shock'),face(false,'doubt')];
  const material=r.own(new T.MeshBasicMaterial({map:maps[0],transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
  const vertices=[],uv=[],index=[];
  for(let row=0;row<=6;row++)for(let col=0;col<=12;col++){
    const u=col/12,v=row/6,x=(u-.5)*.91,y=(.5-v)*.68;
    const z=.492-Math.pow(x,2)*.88-Math.pow(y,2)*.28;
    vertices.push(x,.64+y,z);uv.push(u,1-v);if(row&&col){const i=row*13+col;index.push(i-14,i-1,i-13,i-13,i-1,i);}
  }
  const geo=r.own(new T.BufferGeometry());geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();r.mesh(geo,material,body);
  root.traverse(n=>n.userData.hotspot='dragon');
  const marks=['!','👍','✦','♪','…','汗','…','?'];
  const markMaps=marks.map(text=>{const canvas=document.createElement('canvas');canvas.width=256;canvas.height=160;const c=canvas.getContext('2d');c.fillStyle='#173b38';c.beginPath();c.roundRect(12,12,232,132,28);c.fill();c.strokeStyle='#d9c38c';c.lineWidth=5;c.stroke();c.fillStyle='#f5e5af';c.textAlign='center';c.textBaseline='middle';c.font='bold 96px sans-serif';c.fillText(text,128,82);const map=r.own(new T.CanvasTexture(canvas));map.colorSpace=T.SRGBColorSpace;return map;});
  const emote=new T.Sprite(r.own(new T.SpriteMaterial({map:markMaps[0],transparent:true,depthTest:false})));emote.position.set(0,1.7,0);emote.scale.set(.62,.39,1);emote.visible=false;body.add(emote);
  const thumb=part(white,[.66,.56,.08],[.055,.14,.065]);thumb.visible=false;
  const flightLines=new T.Group();body.add(flightLines);for(let i=0;i<4;i++){const line=r.mesh(r.geometry('PlaneGeometry',.018,.3+i*.04),r.material('#d9e4cc',{transparent:true,opacity:.65}),flightLines,[(i%2?1:-1)*(.7+Math.floor(i/2)*.12),.55,0]);line.rotation.z=(i%2?1:-1)*.4;}flightLines.visible=false;
  const microphone=new T.Group();body.add(microphone);r.box(microphone,'#26363c',[0,-.1,0],[.045,.22,.045]);r.mesh(r.geometry('SphereGeometry',.075,12,8),r.material('#9ba7a5',{metalness:.7,roughness:.5}),microphone,[0,.05,0]);microphone.name='floating-singing-microphone';microphone.position.set(.34,.55,.72);microphone.visible=false;
  root.traverse(n=>n.userData.hotspot='dragon');
  const state={mood:'normal',action:''};
  return {root,foodMount,hand:arms[1],get state(){return {...state};},update(t,s={}){
    const blink=Math.max(0,1-Math.abs((t+.7)%4.3-.15)/.11);
    const action=s.action?.kind||'',effort=T.MathUtils.clamp(Number(s.action?.amount)||0,0,1),shocked=action==='shock'||!!s.projectile;
    state.mood=shocked?'shock':action==='lever'?'doubt':blink>.3?'blink':(s.nod||0)>.15?'happy':'normal';state.action=action;
    material.map=maps[shocked?3:action==='lever'?4:blink>.3?1:(s.nod||0)>.15?2:0];
    const gesture=s.gestureAmount||0,happy=s.gesture==='happy'?gesture:0,wave=s.gesture==='wave'?gesture:0,point=s.gesture==='point'?gesture:0,roll=s.gesture==='roll'?gesture:0,nod=s.gesture==='nod'?gesture:0;
    const curiosity=Math.max(s.curious||0,s.glance?.35:0),startle=Math.max(s.startle||0,s.gesture==='rain'?gesture*.7:0),attention=s.dragon||0,walk=s.walk||0;
    const catchUp=s.followerMode==='catch-up'?1:0,hesitate=s.followerMode==='hesitate'?1:0,phase=s.walkPhase||0;
    body.rotation.set(curiosity*.11-startle*.12+walk*.035+nod*Math.sin(t*7)*.06+(s.lookPitch||0),attention*.3+(s.rain||0)*.15+(s.lookYaw||0)*.72,curiosity*-.05+startle*.11+walk*Math.sin(phase)*.035+happy*Math.sin(gesture*Math.PI)*.28+roll*Math.PI);
    body.position.y=walk*Math.max(0,Math.cos(phase*2))*.006+Math.sin(t*Math.PI*2/3.6)*(s.allowIdleEmote?.055:.025);
    const breath=Math.sin(t*Math.PI*2/3.6)*.008;body.scale.set(1+startle*.035+breath,1-startle*.075-breath,1+startle*.035+breath);
    root.position.y=.005;
    arms[0].rotation.z=-curiosity*.3+startle*.45-(s.holding?.28:0)+walk*Math.sin(phase-.3)*.075;arms[1].rotation.z=attention*.22-startle*.45+(s.holding?.28:0)+wave*Math.sin(t*9)*.45+point*.8-walk*Math.sin(phase-.5)*.09;
    arms[0].position.set(-.53,.43,.07);arms[1].position.set(.53,.43,.07);
    for(let i=0;i<feet.length;i++){const stride=Math.sin((s.walkPhase||0)+i*Math.PI);feet[i].position.z=.12+walk*stride*.11;feet[i].position.y=.14+walk*Math.max(0,stride)*.06;feet[i].rotation.x=walk*stride*.22;}
    for(let i=0;i<ears.length;i++){const side=i?1:-1;ears[i].rotation.z=side*(-.28-startle*.18-catchUp*.09+curiosity*.1)+Math.sin(t*.65+i)*.009;ears[i].rotation.x=hesitate*.08+(s.lookYaw||0)*side*.08;}
    tail.rotation.z=Math.sin(t*(catchUp?3.2:1.1))*(.016+curiosity*.07+catchUp*.07)+curiosity*.09;
    tail.rotation.x=-1.1+walk*.09+hesitate*.06;tuft.rotation.z=-.18+(s.lookYaw||0)*.1;
    if(action==='key'){
      body.rotation.x=-.08;body.position.y=-Math.sin(effort*Math.PI)*.035;
      body.scale.set(1+effort*.05,1-effort*.08,1+effort*.04);
      arms[0].rotation.z=-.25;arms[1].rotation.z=.32;
      feet[0].rotation.x=-.16-effort*.25;feet[1].rotation.x=-.10;
    }else if(action==='lever'){
      body.rotation.x=-.16-effort*.16;body.rotation.z=-.08*Math.sin(effort*Math.PI);
      arms[0].position.set(-.32,.7,.36);arms[1].position.set(.32,.7,.36);
      arms[0].rotation.z=-.85;arms[1].rotation.z=.85;
      feet[0].position.z=.22;feet[1].position.z=-.02;tail.rotation.x=-.88;
    }
    if(!s.reaction&&s.allowIdleEmote&&t%10<1.6)s.reaction={id:[0,1,3,7,4,2][Math.floor(t/10)%6],age:t%10,large:false};
    if(s.phoneHold){arms[1].position.set(.6,.52,.28);arms[1].rotation.z=.25;}
    microphone.visible=!!s.singing;microphone.position.y=.55+(s.singing?Math.sin(t*2)*.025:0);if(s.singing){arms[1].position.set(.35,.62,.35);arms[1].rotation.z=.65;body.rotation.z+=Math.sin(t*2)*.06;}
    if(action==='call'){arms[0].position.set(-.4,.75,.2);arms[0].rotation.z=-.85;body.rotation.z=Math.sin(t*1.1)*.05;}
    emote.visible=!!s.reaction;thumb.visible=false;flightLines.visible=false;
    if(s.reaction&&!s.projectile){const {id,age,large}=s.reaction,p=Math.max(0,Math.min(1,age/2)),ease=Math.sin(p*Math.PI),reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
      emote.material.map=markMaps[id];emote.position.y=1.7+(reduced?0:ease*.08);
      if(id===0)arms[1].rotation.z=.6+Math.sin(age*9)*.35*ease;
      if(id===1){arms[1].rotation.z=.8;thumb.visible=true;material.map=maps[2];}
      if(id===2&&!reduced)body.rotation.y+=Math.sin(p*Math.PI*2)*Math.PI*(large?1:.06);
      if(id===3&&!reduced){body.position.y+=ease*(large?.2:.025);body.rotation.z+=Math.sin(p*Math.PI*2)*(large?.18:.03);}
      if([4,5,6].includes(id)){body.position.y-=ease*.045;body.rotation.x+=ease*.12;material.map=maps[4];}
      if(id===7){body.rotation.z-=ease*.12;material.map=maps[4];}
      flightLines.visible=!reduced&&large&&[2,3].includes(id)&&p>.1&&p<.85;
    }
    if(s.projectile){microphone.visible=!!s.singing;
      body.rotation.set(0,0,0);body.position.y=0;body.scale.set(1,.94,1);
      arms[0].rotation.z=-1.08;arms[1].rotation.z=1.08;
      for(let i=0;i<feet.length;i++){feet[i].position.y=.23;feet[i].position.z=.04;feet[i].rotation.x=-.3;}
      tail.rotation.x=-.76;tail.rotation.z=0;
    }
  },dispose(){root.removeFromParent();}};
}
