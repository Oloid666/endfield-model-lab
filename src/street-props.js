import * as T from 'three';

// Original, metre-sized street fixtures. Static geometry is batched by the store.
export function buildStreetProps(root,r,surfaces){
  const box=(c,p,s,o={})=>r.box(root,c,p,s,o);
  const steel={metalness:.65,roughness:.3},rubber={roughness:.94};
  const label=(text,p,s,options={},rotation=0)=>{const m=r.mesh(r.geometry('PlaneGeometry',1,1),r.label(text,{width:512,height:256,font:'bold 62px sans-serif',...options}),root,p,s);m.rotation.y=rotation;return m;};
  const tube=(a,b,radius,color='#71847c',opts=steel)=>{
    const va=new T.Vector3(...a),vb=new T.Vector3(...b),direction=vb.clone().sub(va);
    const m=r.mesh(r.geometry('CylinderGeometry',radius,radius,direction.length(),8),r.material(color,opts),root,va.clone().add(vb).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());return m;
  };
  // Recessed rubber entrance mat with a ribbed surface and aluminium edge.
  box('#424b43',[-.22,.326,2.24],[1.7,.025,.64],{roughness:.95});
  for(let i=0;i<24;i++)box('#222e2b',[-1.025+i*.07,.341,2.24],[.025,.007,.59],rubber);
  label('歡迎光臨',[-.22,.343,2.25],[.62,.16,1],{bg:'#424b43',color:'#c7bb8d',font:'bold 50px sans-serif'}).rotation.x=-Math.PI/2;

  // Wall-mounted outdoor condenser: fan hub, curved grille, brackets and pipes.
  box('#bec8bb',[4.5,3.98,-1.38],[.35,.65,1.12],{metalness:.32,roughness:.45});
  const fan=r.mesh(r.geometry('CircleGeometry',.245,24),r.material('#243d39',{roughness:.6}),root,[4.682,3.98,-1.15]);fan.rotation.y=Math.PI/2;
  for(let k=0;k<5;k++){
    const a=k*Math.PI*2/5;const blade=box('#6e8177',[4.69,3.98+Math.sin(a)*.115,-1.15+Math.cos(a)*.115],[.014,.11,.22],{metalness:.5,roughness:.4});blade.rotation.x=-a+.7;
  }
  for(const rad of [.08,.15,.21,.252]){const ring=r.mesh(r.geometry('TorusGeometry',rad,.006,4,24),r.material('#a3b0a1',steel),root,[4.714,3.98,-1.15]);ring.rotation.y=Math.PI/2;}
  for(const a of [0,Math.PI/3,-Math.PI/3]){const spoke=box('#a3b0a1',[4.718,3.98,-1.15],[.008,.51,.008],steel);spoke.rotation.x=a;}
  for(let k=0;k<9;k++)box('#63796e',[4.685,3.73+k*.057,-1.72],[.02,.024,.23]);
  for(const zz of [-1.72,-.9]){box('#5d7169',[4.48,3.57,zz],[.45,.035,.045],steel);tube([4.3,3.42,zz],[4.67,3.57,zz],.018);}
  tube([4.54,3.7,-1.9],[4.54,.45,-1.9],.027,'#a9b8a6',{roughness:.7});

  // City bicycle with real wheel planes, diamond frame, crank and handlebars.
  const bx=-4.95,bz=2.6,wy=.55,wheel=.37;
  for(const dx of [-.57,.57]){
    const wheelMesh=r.mesh(r.geometry('TorusGeometry',wheel,.026,6,32),r.material('#243230',rubber),root,[bx+dx,wy,bz]);
    const rim=r.mesh(r.geometry('TorusGeometry',wheel-.035,.01,4,32),r.material('#8d9c91',steel),root,[bx+dx,wy,bz]);
    for(let s=0;s<12;s++){const a=s*Math.PI/6;tube([bx+dx,wy,bz],[bx+dx+Math.sin(a)*(wheel-.04),wy+Math.cos(a)*(wheel-.04),bz],.0025,'#8b9d94',steel);}
    r.mesh(r.geometry('CylinderGeometry',.035,.035,.16,12),r.material('#a4ada0',steel),root,[bx+dx,wy,bz]).rotation.x=Math.PI/2;
  }
  const rear=[bx-.57,wy,bz],front=[bx+.57,wy,bz],crank=[bx-.08,wy-.06,bz],seat=[bx-.22,wy+.54,bz],head=[bx+.39,wy+.57,bz];
  for(const [a,b] of [[rear,crank],[rear,seat],[crank,seat],[seat,head],[crank,head],[head,front]])tube(a,b,.023,'#7c8f7f',{metalness:.42,roughness:.43});
  tube(seat,[bx-.24,wy+.65,bz],.018);box('#253530',[bx-.24,wy+.69,bz],[.27,.055,.15],rubber);
  tube(head,[bx+.43,wy+.8,bz],.018);tube([bx+.43,wy+.8,bz-.24],[bx+.43,wy+.8,bz+.24],.018);
  for(const zz of [bz-.17,bz+.17])box('#283a34',[bx+.43,wy+.8,zz],[.08,.035,.13],rubber);
  const chainring=r.mesh(r.geometry('TorusGeometry',.11,.012,4,18),r.material('#819387',steel),root,crank);tube([bx-.08,wy-.06,bz],[bx-.08,wy-.21,bz+.09],.012);box('#253831',[bx-.08,wy-.21,bz+.11],[.16,.035,.075]);
  tube([bx-.18,.7,bz-.04],[bx-.34,.28,bz-.2],.016,'#6f8177',steel);
  // Basket makes the bicycle read as a commuter bicycle rather than a toy.
  for(const zz of [-.16,.16]){tube([bx+.65,1.15,bz+zz],[bx+.65,1.44,bz+zz],.012);tube([bx+.36,1.15,bz+zz],[bx+.36,1.44,bz+zz],.012);}
  for(const y of [1.16,1.28,1.42])for(const zz of [-.16,.16])tube([bx+.35,y,bz+zz],[bx+.66,y,bz+zz],.007);

  // Two sorted recycling bins. Openings, lids, seams and labels give scale.
  for(const [x,name,color] of [[5.25,'一般垃圾','#61736a'],[5.89,'資源回收','#567e78']]){
    box(color,[x,.72,2.8],[.53,.89,.52],{metalness:.22,roughness:.55});
    box('#849184',[x,1.19,2.8],[.57,.07,.56],{metalness:.5,roughness:.35});
    box('#172d2a',[x,1.04,3.065],[.37,.17,.025]);
    box('#9da78c',[x,1.14,3.07],[.4,.025,.033],steel);
    label(name,[x,.68,3.067],[.4,.18,1],{width:512,height:256,bg:color,color:'#d5dec8',font:'bold 56px sans-serif'});
    for(const xx of [-.2,.2])box('#263c34',[x+xx,.255,2.8],[.055,.07,.39]);
    box('#324d42',[x,.38,3.068],[.48,.009,.008],steel);
  }

  // Blue parking blade sign and small regulations plate by the side street.
  r.cylinder(root,'#64766d',[6.25,1.76,.14],.038,3.2,steel);
  box('#183e64',[6.25,3.02,.14],[.62,.65,.07],{roughness:.3,emissive:0x254d7a,emissiveIntensity:.25});
  label('P',[6.25,3.03,.181],[.52,.57,1],{bg:'#183e64',color:'#e9efdb',font:'bold 230px Arial'});
  label('24H  停車場 →',[6.25,2.53,.181],[.75,.18,1],{width:768,height:128,bg:'#e0e1d0',color:'#325b52',font:'bold 52px sans-serif'});

  // Traffic signal at the crossing: shaded housings, lenses, a coloured light pool.
  const signalX=-6.5,signalZ=4.35;
  r.cylinder(root,'#334b47',[signalX,2.12,signalZ],.055,3.9,steel);
  box('#213832',[signalX,3.57,signalZ],[.3,.9,.27],{roughness:.45});
  const lenses=[];
  for(const [y,color,intensity] of [[3.84,'#e6534b',2.1],[3.57,'#96794c',.1],[3.3,'#3d7865',.12]]){
    const lens=r.mesh(r.geometry('CircleGeometry',.085,20),r.material(color,{emissive:new T.Color(color),emissiveIntensity:intensity,roughness:.25}),root,[signalX,y,signalZ+.141]);lens.userData.dynamic=true;lenses.push(lens);
    box('#213832',[signalX,y+.092,signalZ+.16],[.22,.045,.16],{roughness:.45});
  }
  label('行人穿越道',[signalX,2.7,signalZ+.155],[.61,.17,1],{bg:'#175f62',color:'#dfe8d4',font:'bold 56px sans-serif'});
  const red=new T.PointLight(0xff5b4b,3.8,4.8,2);red.position.set(signalX,3.63,signalZ+.4);root.add(red);
  // Painted parking bay and stop line on the far road edge.
  for(const x of [1.1,3.3,5.5,7.7])box('#a7b2a0',[x,-.001,10.98],[.045,.009,1.22],{roughness:.6});
  box('#a7b2a0',[4.4,-.001,10.38],[6.65,.009,.045],{roughness:.6});
  box('#c8c9b5',[-3.55,-.001,6.6],[.13,.009,3.2],{roughness:.6});

  // Side and rear neighbours use lit recesses, shutters, reveals and roof cornices.
  for(const [x,z,w,h,d] of [[-8,-5,4,7,5],[6.8,-6.7,4.5,8,4],[0,-8.5,7,6,3]]){
    for(const y of [1.45,3.15,4.85,6.55]){
      if(y>h-.5)continue;
      for(let dx=-w/2+.72;dx<w/2-.3;dx+=1.25){
        const xx=x+dx,zz=z+d/2+.04;
        box('#2c4445',[xx,y,zz],[.85,1.02,.13]);
        const lit=((Math.round(dx*8)+Math.round(y*3)+Math.round(x))%3)!==0;
        box(lit?'#a1b8b1':'#40585a',[xx,y,zz+.075],[.68,.84,.018],{map:surfaces.windowMap,emissiveMap:surfaces.windowMap,emissive:lit?0xf3c58d:0x548f9d,emissiveIntensity:lit?.5:.14,roughness:.6});
        box('#475e59',[xx,y,zz+.095],[.025,.87,.025]);box('#475e59',[xx,y-.01,zz+.095],[.71,.025,.025]);
        box('#64756a',[xx,y-.54,zz+.06],[1.02,.11,.27]);
      }
    }
    for(const yy of [.5,h-1.05])box('#475958',[x,yy,z+d/2+.045],[w+.13,.13,.15]);
    box('#203b40',[x+w/2-.26,h/2,z+d/2+.15],[.065,h,.065],{metalness:.25});
    for(let sy=.75;sy<h;sy+=1.6)box('#576e68',[x+w/2-.26,sy,z+d/2+.16],[.12,.09,.09],steel);
  }
  const alley=new T.PointLight(0x7cbdc8,9,11,2);alley.position.set(4.8,3.7,-4.5);root.add(alley);
  box('#92bbc0',[4.8,4.0,-4.5],[.15,.5,.2],{emissive:0x7cbdc8,emissiveIntensity:1.15});

  return {lights:[red,alley],setSignal(index){const colors=['#ff5b4b','#68dc95','#efc66d'],order=[0,2,1];lenses.forEach((l,i)=>l.material.emissiveIntensity=i===order[index]?2.2:.04);red.color.set(colors[index]);},lenses};
}
