import * as T from 'three';

// A/B/C are three distinct meshes. All geometry and textures are made once.
export function buildMeals(r,parent,scale=1){
  const mount=new T.Group();mount.name='food';mount.userData.hotspot='food';mount.scale.setScalar(scale);parent.add(mount);
  const branches={};
  const item=(group,color,p,s,options={})=>r.box(group,color,p,s,options);
  const cup=(group,p,color='#d7c7a7',radius=.055,height=.15)=>{
    const body=r.cylinder(group,color,p,radius,height,{roughness:.45});
    r.cylinder(group,'#293f38',[p[0],p[1]+height/2+.006,p[2]],radius*1.05,.014,{roughness:.5});
    return body;
  };
  for(const name of ['A','B','C']){const group=new T.Group();group.name=`meal-${name}`;mount.add(group);branches[name]=group;}
  const a=branches.A;
  item(a,'#344437',[0,0,0],[.26,.045,.18],{roughness:.38});item(a,'#e5d8b5',[-.055,.035,0],[.12,.045,.14]);
  for(let i=0;i<3;i++){r.mesh(r.geometry('SphereGeometry',1,10,8),r.material(i===0?'#b27041':'#74934b'),a,[.062,.035,-.055+i*.055],[.045,.025,.028]);}
  cup(a,[.19,.03,.005],'#a7764c',.055,.12);
  const b=branches.B;
  const triangle=new T.Shape();triangle.moveTo(-.075,-.065);triangle.lineTo(.075,-.065);triangle.quadraticCurveTo(.087,-.055,.075,-.035);triangle.lineTo(.012,.08);triangle.quadraticCurveTo(0,.095,-.012,.08);triangle.lineTo(-.075,-.035);triangle.lineTo(-.075,-.065);
  const riceGeo=r.own(new T.ExtrudeGeometry(triangle,{depth:.055,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:2,steps:1}));
  r.mesh(riceGeo,r.material('#e9e3cb',{roughness:.9}),b,[-.065,.03,0]);item(b,'#274b3d',[-.065,-.015,.067],[.068,.08,.01]);
  r.mesh(r.geometry('SphereGeometry',1,14,10),r.material('#a87846',{roughness:.65}),b,[.09,.03,.01],[.041,.055,.041]);
  const c=branches.C;
  cup(c,[-.075,.02,0],'#f0d6a3',.065,.09);r.cylinder(c,'#9b663f',[-.075,.07,0],.062,.012);
  cup(c,[.105,.04,0],'#c79465',.057,.16);item(c,'#c5b68a',[.105,.035,.055],[.085,.052,.008]);
  mount.traverse(n=>n.userData.hotspot='food');
  return {mount,setDinner(name){const branch=String(name||'').toUpperCase();mount.visible=Object.hasOwn(branches,branch);for(const [id,g]of Object.entries(branches))g.visible=id===branch;},branches};
}
