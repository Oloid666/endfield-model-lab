import * as T from 'three';

export function buildTrees(parent,r) {
  let seed=57411;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const up=new T.Vector3(0,1,0);
  const bark=r.material('#35382a',{roughness:.78});
  const branchGeo=r.geometry('CylinderGeometry',.5,1,1,7);
  // Curved lanceolate leaves. Silhouette has actual gaps, with no sphere crowns.
  const vertices=[0,-.5,0,-.16,-.25,.025,.16,-.25,.025,-.22,0,.06,.22,0,.06,-.13,.3,.025,.13,.3,.025,0,.5,0,0,0,.095];
  const leafGeo=r.own(new T.BufferGeometry());leafGeo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));leafGeo.setIndex([0,1,8,0,8,2,1,3,8,2,8,4,3,5,8,4,8,6,5,7,8,6,8,7]);leafGeo.computeVertexNormals();
  const leafMaterial=r.own(new T.MeshStandardMaterial({color:'#82a570',roughness:.37,metalness:.02,side:T.DoubleSide}));
  const dummy=new T.Object3D(),color=new T.Color();
  for(const [tx,tz] of [[-5.9,-.65],[10.1,-4.8]]){
    const tree=new T.Group();tree.position.set(tx,.73,tz);parent.add(tree);
    r.box(parent,'#535d57',[tx,.44,tz],[1.05,.48,1.1],{roughness:.82});r.box(parent,'#1d2923',[tx,.69,tz],[.94,.03,.99]);
    const tips=[];
    function branch(a,b,radius){const delta=b.clone().sub(a),mesh=new T.Mesh(branchGeo,bark);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.set(radius,delta.length(),radius);mesh.quaternion.setFromUnitVectors(up,delta.normalize());tree.add(mesh);}
    const base=new T.Vector3(0,0,0),fork=new T.Vector3(.06,1.55,.03);branch(base,fork,.13);
    branch(fork,new T.Vector3(-.04,3.37,-.08),.065);
    for(let i=0;i<8;i++){
      const a=i*2.399,spread=.65+rand()*.65,height=1.7+i*.17;
      const start=new T.Vector3(.04,1.15+i*.22,0),end=new T.Vector3(Math.sin(a)*spread,height+.65,Math.cos(a)*spread);
      branch(start,end,.045+rand()*.018);
      for(let j=0;j<4;j++){
        const ang=a+(rand()-.5)*1.7,dist=.32+rand()*.55;
        const tip=end.clone().add(new T.Vector3(Math.sin(ang)*dist,.25+rand()*.55,Math.cos(ang)*dist));branch(end,tip,.015+rand()*.012);tips.push(tip);
      }
    }
    tips.push(new T.Vector3(0,3.65,0));
    const leafCount=tips.length*48;
    const leaves=new T.InstancedMesh(leafGeo,leafMaterial,leafCount);leaves.castShadow=true;leaves.receiveShadow=true;tree.add(leaves);
    let index=0;
    for(const tip of tips)for(let i=0;i<48;i++){
      const angle=rand()*Math.PI*2,rr=Math.cbrt(rand())*.58,y=(rand()-.5)*.7;
      dummy.position.set(tip.x+Math.sin(angle)*rr,tip.y+y,tip.z+Math.cos(angle)*rr);
      dummy.rotation.set(rand()*Math.PI,(rand()-.5)*Math.PI*2,(rand()-.5)*Math.PI);
      const s=.18+rand()*.2;dummy.scale.set(s*.7,s,s);dummy.updateMatrix();leaves.setMatrixAt(index,dummy.matrix);
      color.setHSL(.23+rand()*.1,.22+rand()*.22,.13+rand()*.16);leaves.setColorAt(index++,color);
    }
    leaves.instanceMatrix.needsUpdate=true;leaves.instanceColor.needsUpdate=true;leaves.computeBoundingSphere();
  }
}
