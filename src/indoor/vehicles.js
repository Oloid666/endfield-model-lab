import * as T from 'three';
export function buildPallet(r,parent){
 const root=new T.Group();root.name='wuling-industrial-pallet';parent.add(root);
 r.box(root,'#354449',[0,.041,0],[.23,.028,.29],{metalness:.55});
 r.box(root,'#ddd9bc',[0,.059,0],[.20,.012,.255]);
 for(const side of [-1,1]){r.box(root,'#667b79',[side*.11,.075,0],[.012,.05,.27],{metalness:.6});
  for(const z of [-.105,.105])r.box(root,'#ddba5b',[side*.109,.083,z],[.016,.035,.035]);}
 for(const x of [-.065,.065])r.box(root,'#5a695f',[x,.069,0],[.012,.008,.22]);
 const label=r.mesh(r.geometry('PlaneGeometry',.15,.04),r.label('武陵・息壤運輸',{width:256,height:64,font:'bold 27px sans-serif'}),root,[0,.071,.1]);label.rotation.x=-Math.PI/2;
 const hook=r.mesh(r.geometry('TorusGeometry',.017,.005,5,12),r.material('#dbbe6a',{metalness:.6}),root,[0,.045,-.16]);hook.rotation.x=Math.PI/2;
 const plate=r.box(root,'#b5c1b1',[0,.066,.143],[.20,.035,.009]);
 const wheels=[];for(const x of [-.115,.115])for(const z of [-.095,.095]){r.box(root,'#748483',[x,.034,z],[.025,.035,.025]);const wheel=r.mesh(r.geometry('CylinderGeometry',.028,.028,.022,10),r.material('#24363b'),root,[x,.027,z]);wheel.rotation.z=Math.PI/2;wheels.push(wheel);}
 return {update(state,time){root.rotation.z=Math.max(-.12,Math.min(.12,-state.sideSpeed*.06));plate.rotation.x=state.playerImpact*.4;for(const w of wheels)w.rotation.x=time*state.speed*22;}};
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
  stars.visible=(p.mode==='fallen'&&p.age<1.3)||(state.reactions.dragon.hits>0&&state.reactions.dragon.age<1.1);stars.position.set(p.x,riderY+.14,p.z);stars.children.forEach((s,i)=>{const angle=time*5+i*Math.PI*2/3;s.position.set(Math.cos(angle)*.075,Math.sin(angle)*.01,Math.sin(angle)*.075);});
 }};
}
