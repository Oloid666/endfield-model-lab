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
  const tail=r.mesh(r.geometry('ConeGeometry',.15,.53,10),r.material('#80ab8d'),body,[0,.27,-.48]);tail.rotation.x=-1.1;
  const tuft=r.mesh(r.geometry('ConeGeometry',.1,.25,8),r.material('#a9c0b3'),body,[0,1.34,-.08]);tuft.rotation.z=-.18;
  r.box(body,'#b65843',[.42,1.19,.05],[.28,.06,.08]);r.box(body,'#b65843',[.54,1.03,.03],[.06,.3,.05]);
  function face(blink,mood='normal'){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
    c.lineWidth=8;c.strokeStyle='#344d42';c.lineCap='round';
    for(const x of [70,186]){
      if(blink||mood==='happy'){c.beginPath();c.moveTo(x-25,137);c.quadraticCurveTo(x,145,x+25,137);c.stroke();}
      else{const g=c.createLinearGradient(0,75,0,178);g.addColorStop(0,'#408572');g.addColorStop(1,'#c1c777');c.fillStyle=g;c.beginPath();c.roundRect(x-27,88,54,80,20);c.fill();c.stroke();c.beginPath();c.moveTo(x-29,88);c.lineTo(x+29,88);c.stroke();c.fillStyle='#e7efc6';c.beginPath();c.ellipse(x-6,108,7,10,0,0,Math.PI*2);c.fill();}
    }
    c.lineWidth=5;c.beginPath();c.moveTo(108,188);c.quadraticCurveTo(116,202,128,191);c.quadraticCurveTo(141,202,150,187);c.stroke();
    const map=r.own(new T.CanvasTexture(canvas));map.colorSpace=T.SRGBColorSpace;return map;
  }
  const maps=[face(false),face(true),face(false,'happy')];
  const material=r.own(new T.MeshBasicMaterial({map:maps[0],transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
  const vertices=[],uv=[],index=[];
  for(let row=0;row<=6;row++)for(let col=0;col<=12;col++){
    const u=col/12,v=row/6,x=(u-.5)*.91,y=(.5-v)*.68;
    const z=.492-Math.pow(x,2)*.88-Math.pow(y,2)*.28;
    vertices.push(x,.64+y,z);uv.push(u,1-v);if(row&&col){const i=row*13+col;index.push(i-14,i-1,i-13,i-13,i-1,i);}
  }
  const geo=r.own(new T.BufferGeometry());geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();r.mesh(geo,material,body);
  root.traverse(n=>n.userData.hotspot='dragon');
  return {root,foodMount,update(t,s={}){
    const blink=Math.max(0,1-Math.abs((t+.7)%4.3-.15)/.11);
    material.map=maps[blink>.3?1:(s.nod||0)>.15?2:0];
    const gesture=s.gestureAmount||0,happy=s.gesture==='happy'?gesture:0,wave=s.gesture==='wave'?gesture:0,point=s.gesture==='point'?gesture:0,roll=s.gesture==='roll'?gesture:0,nod=s.gesture==='nod'?gesture:0;
    const curiosity=s.curious||0,startle=Math.max(s.startle||0,s.gesture==='rain'?gesture*.7:0),attention=s.dragon||0,walk=s.walk||0;
    body.rotation.set(curiosity*.11-startle*.12+walk*.035+nod*Math.sin(t*7)*.06,attention*.3+(s.rain||0)*.15,curiosity*-.05+startle*.11+walk*Math.sin(s.walkPhase||0)*.045+happy*Math.sin(gesture*Math.PI)*.28+roll*Math.PI);
    body.scale.set(1+startle*.035,1-startle*.075,1+startle*.035);
    root.position.y=.005;
    arms[0].rotation.z=-curiosity*.3+startle*.45-(s.holding?.28:0);arms[1].rotation.z=attention*.22-startle*.45+(s.holding?.28:0)+wave*Math.sin(t*9)*.45+point*.8;
    for(let i=0;i<feet.length;i++){const stride=Math.sin((s.walkPhase||0)+i*Math.PI);feet[i].position.z=.12+walk*stride*.11;feet[i].position.y=.14+walk*Math.max(0,stride)*.06;feet[i].rotation.x=walk*stride*.22;}
    tail.rotation.z=Math.sin(t*1.1)*.045+curiosity*.13;
  },dispose(){root.removeFromParent();}};
}
