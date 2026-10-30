import * as T from 'three';
const pulse=(age,duration=1)=>age>=duration?0:Math.sin(Math.PI*age/duration);
export function buildBlob(r,parent){
 const root=new T.Group();root.name='elastic-purple-driver';root.position.y=.075;parent.add(root);
 const shape=new T.Group();root.add(shape);const mat=r.material('#9259bb',{roughness:.3}),ball=r.geometry('SphereGeometry',1,16,10);
 const body=r.mesh(ball,mat,shape,[0,.035,0],[.072,.037,.10]);
 const lobes=[];for(let i=0;i<3;i++)lobes.push(r.mesh(ball,mat,shape,[0,.035,0],[.045,.035,.07]));
 const threads=[];for(let i=0;i<2;i++)threads.push(r.mesh(r.geometry('CylinderGeometry',.006,.006,1,6),mat,shape));
 const eyes=[];for(const x of [-.025,.025]){const eye=new T.Group();root.add(eye);r.mesh(ball,r.material('#f4f0cf'),eye,[0,0,0],[.017,.021,.012]);r.mesh(ball,r.material('#263e3c'),eye,[0,0,.010],[.008,.012,.004]);eye.position.set(x,.06,.079);eyes.push(eye);}
 const drops=[];for(let i=0;i<9;i++)drops.push(r.mesh(ball,mat,root,[0,0,0],[.009,.009,.009]));
 const crumb=[];for(let i=0;i<5;i++)crumb.push(r.box(root,'#d7b76e',[0,0,0],[.012,.012,.009]));
 const straw=r.box(root,'#f4d899',[.03,.09,0],[.007,.09,.007]);straw.rotation.z=-.25;
 return {root,update(state){const q=state.reactions.player,a=q.age,t=pulse(a,1),split=['split','triple'].includes(q.mode)&&a<1;
  shape.scale.set(1,1,1);shape.rotation.z=0;body.visible=!split;
  if(q.mode==='pancake')shape.scale.set(1+t*.65,1-t*.78,1+t*.35);
  else if(q.mode==='banana')shape.rotation.z=q.side*t*.65;
  else if(q.mode==='dent')shape.scale.set(1+t*.2,1-t*.25,1);
  else if(!split)shape.scale.set(1+Math.abs(state.sideSpeed)*.06,1,1+state.speed*.025);
  const n=q.mode==='split'?2:3;
  lobes.forEach((m,i)=>{m.visible=split&&i<n;const angle=i/n*Math.PI*2;m.position.set(Math.cos(angle)*t*.09,.035+Math.sin(a*8+i)*t*.012,Math.sin(angle)*t*.065);});
  threads.forEach((m,i)=>{m.visible=split&&i<n-1;if(m.visible){const from=lobes[i].position,to=lobes[i+1].position,v=to.clone().sub(from);m.position.copy(from).add(to).multiplyScalar(.5);m.scale.y=v.length();m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());}});
  eyes.forEach((e,i)=>{const l=lobes[i%n];e.position.set((i?1:-1)*.025+(split?l.position.x*.7:0),.06-t*(q.mode==='pancake'?.035:0),.079+(split?l.position.z*.6:0));e.rotation.z=Math.sin(a*17+i)*t*.4;});
  drops.forEach((d,i)=>{d.visible=a<.6&&q.hits>0;d.position.set(Math.cos(i*2.4)*a*.28,.04+a*.35-a*a*.55,Math.sin(i*2.4)*a*.28);});
  crumb.forEach((c,i)=>{c.visible=q.kind==='snack'&&a<2;c.position.set(Math.sin(i*4)*.065,.065+Math.cos(i*6)*.02,Math.cos(i*4)*.07);});straw.visible=q.kind==='drink'&&a<1.7;
 }};
}
export function buildRiderInjuries(r,parent){
 const root=new T.Group();root.name='rider-cartoon-injuries';parent.add(root);const ball=r.geometry('SphereGeometry',1,12,8);
 const bruise=r.mesh(ball,r.material('#8b6b9c'),root,[-.024,.068,.042],[.022,.014,.008]);
 const bumps=[-.025,.027].map(x=>r.mesh(ball,r.material('#d2b4c0'),root,[x,.12,.005],[.019,.024,.018]));
 const patch=r.box(root,'#d6bc81',[.028,.053,.048],[.035,.014,.006]);patch.rotation.z=.4;r.box(root,'#edddad',[.028,.053,.052],[.014,.009,.002]);
 const crumbs=[];for(let i=0;i<5;i++)crumbs.push(r.box(root,'#d7b366',[Math.sin(i*3)*.045,.035+i*.016,.041],[.009,.008,.008]));
 const bag=r.box(root,'#d8b76c',[0,.075,.058],[.12,.11,.017]);const bagLabel=r.mesh(r.geometry('PlaneGeometry',.08,.05),r.label('脆餅',{width:128,height:64,font:'bold 38px sans-serif'}),root,[0,.075,.068]);
 const eyeMat=r.label('＠ ＠',{width:256,height:128,font:'bold 77px sans-serif',bg:'#00000000',color:'#42533e'}),dizzy=r.mesh(r.geometry('PlaneGeometry',.085,.045),eyeMat,root,[0,.075,.052]);
 return {root,update(state){const q=state.reactions.dragon,a=q.age;bruise.visible=q.damage>=1;bumps.forEach((b,i)=>b.visible=q.damage>=2+i);patch.visible=q.damage>=2;crumbs.forEach(c=>c.visible=q.kind==='snack'&&a<2);bag.visible=q.mode==='bag'&&a<.6;bagLabel.visible=bag.visible;bag.rotation.z=Math.sin(a*25)*.2;dizzy.visible=q.mode==='dizzy'&&a<1;}};
}
