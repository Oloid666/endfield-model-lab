import * as T from 'three';
export function buildBento(r,parent){
 const root=new T.Group();root.name='bento-cart';parent.add(root);
 r.box(root,'#333e37',[0,.038,0],[.19,.025,.235]);r.box(root,'#f0e6c7',[0,.056,0],[.175,.013,.22]);
 for(const side of [-1,1])r.box(root,'#415748',[side*.092,.073,0],[.012,.06,.23]);
 for(const side of [-1,1])r.box(root,'#415748',[0,.073,side*.113],[.19,.06,.012]);
 const lid=new T.Group();lid.position.set(0,.096,.113);root.add(lid);r.box(lid,'#d6d6bb',[0,0,-.105],[.19,.009,.21]);
 r.mesh(r.geometry('PlaneGeometry',.105,.075),r.label('武陵711',{width:256,height:128,font:'bold 36px sans-serif',bg:'#f1e6bf',color:'#355d49'}),lid,[0,-.005,-.11]).rotation.x=Math.PI/2;
 const wheels=[];for(const x of [-.091,.091])for(const z of [-.075,.075]){const wheel=r.mesh(r.geometry('CylinderGeometry',.025,.025,.017,10),r.material('#273a3c'),root,[x,.025,z]);wheel.rotation.z=Math.PI/2;wheels.push(wheel);}
 return {update(state,time){lid.rotation.x=1.05-state.playerImpact*.9;root.rotation.z=Math.max(-.12,Math.min(.12,-state.sideSpeed*.06));for(const w of wheels)w.rotation.x=time*state.speed*22;}};
}
export function buildChair(r,parent){
 const root=new T.Group(),tilt=new T.Group();root.name='wuling-maintenance-chair';root.add(tilt);parent.add(root);
 // Foot frame and caster forks move independently of the sprung seat.
 r.cylinder(root,'#617479',[0,.065,0],.014,.085,{metalness:.6});
 const forks=[],wheels=[];
 for(let i=0;i<5;i++){const a=i/5*Math.PI*2,arm=r.box(root,'#617479',[Math.sin(a)*.045,.04,Math.cos(a)*.045],[.014,.014,.105],{metalness:.6});arm.rotation.y=a;
  const fork=new T.Group();fork.position.set(Math.sin(a)*.095,.025,Math.cos(a)*.095);root.add(fork);r.box(fork,'#92a49c',[0,0,0],[.025,.035,.015]);const wheel=r.mesh(r.geometry('CylinderGeometry',.021,.021,.018,8),r.material('#243938'),fork,[0,-.004,0]);wheel.rotation.z=Math.PI/2;forks.push(fork);wheels.push(wheel);}
 tilt.position.y=.015;r.box(tilt,'#356259',[0,.105,.005],[.15,.035,.15]);
 const back=r.box(tilt,'#284c48',[0,.176,-.062],[.15,.13,.025]);back.rotation.x=-.13;
 r.box(tilt,'#d5bb6b',[0,.205,-.077],[.105,.012,.006]);for(let i=0;i<4;i++){const stripe=r.box(tilt,'#34463c',[-.04+i*.025,.205,-.081],[.01,.014,.005]);stripe.rotation.z=-.4;}
 for(const side of [-1,1]){r.box(tilt,'#718582',[side*.078,.133,.005],[.009,.065,.01]);r.box(tilt,'#294c47',[side*.078,.17,.013],[.025,.018,.10]);}
 const grip=r.mesh(r.geometry('CylinderGeometry',.009,.009,1,7),r.material('#e0e4cc'),root);grip.visible=false;
 const sweat=new T.Group();root.add(sweat);r.mesh(r.geometry('SphereGeometry',.012,8,6),r.material('#88d6df',{emissive:'#357c8c',emissiveIntensity:.3}),sweat,[0,0,0]);const tip=r.mesh(r.geometry('ConeGeometry',.011,.025,8),r.material('#88d6df'),sweat,[0,.016,0]);sweat.visible=false;
 const stars=new T.Group();root.add(stars);const label=r.label('★',{width:64,height:64,font:'bold 50px sans-serif',bg:'#00000000',color:'#ffe09b'});
 for(let i=0;i<3;i++){const sprite=new T.Sprite(r.own(new T.SpriteMaterial({map:label.map,transparent:true,depthWrite:false})));sprite.scale.setScalar(.045);stars.add(sprite);}stars.visible=false;
 const a=new T.Vector3(),b=new T.Vector3(),direction=new T.Vector3(),up=new T.Vector3(0,1,0);
 return {root,tilt,update(state,time,riderY=state.passenger.y){const p=state.passenger;tilt.rotation.z=p.tip;tilt.rotation.x=Math.sin(time*17)*state.dragonImpact*.1;back.rotation.x=-.13-state.dragonImpact*.25;
  for(const [i,f] of forks.entries()){f.rotation.y=Math.sin(time*11+i)*Math.min(.8,Math.abs(state.dragonSideSpeed)*.5);wheels[i].rotation.x=time*Math.hypot(state.dragonVX,state.dragonVZ)*28;}
  const loose=p.mode==='fallen'||p.mode==='recovering';grip.visible=loose;
  if(loose){a.set(p.x,riderY+.035,p.z);b.set(p.side*.06,.047,.03);direction.copy(b).sub(a);grip.position.copy(a).add(b).multiplyScalar(.5);grip.scale.y=direction.length();grip.quaternion.setFromUnitVectors(up,direction.normalize());}
  sweat.visible=p.risk>.26&&p.mode!=='fallen';sweat.position.set(p.x+p.side*.06,p.y+.12+Math.sin(time*6)*.006,p.z+.04);
  stars.visible=p.mode==='fallen'&&p.age<1.3;stars.position.set(p.x,riderY+.14,p.z);stars.children.forEach((s,i)=>{const angle=time*5+i*Math.PI*2/3;s.position.set(Math.cos(angle)*.075,Math.sin(angle)*.01,Math.sin(angle)*.075);});
 }};
}
