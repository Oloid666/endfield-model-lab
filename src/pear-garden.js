import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// A separate planted corner: the shop can fall without removing the pear trees.
export function buildPearGarden(scene,r){
  const root=new T.Group();root.name='pear-garden';scene.add(root);
  const center=[7.65,.29,-.65],up=new T.Vector3(0,1,0),dummy=new T.Object3D(),direction=new T.Vector3(),color=new T.Color();
  const time={value:0};let seed=711430,quality='balanced',protectedTarget=false,shieldAmount=0;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const stone=r.own(new T.MeshStandardMaterial({color:'#76847e',roughness:.27,metalness:.12}));stone.userData.wetPavement=true;
  const wall=r.material('#596a62',{roughness:.72,metalness:.03});
  const soil=r.material('#252e27',{roughness:.96});
  const bark=r.material('#5b5040',{roughness:.91});
  const bronze=r.material('#7d7356',{roughness:.38,metalness:.56});
  const stoneParts=[],wallParts=[],barkParts=[],bronzeParts=[];
  const box=r.geometry('BoxGeometry',1,1,1),branch=r.geometry('CylinderGeometry',.58,1,1,7);
  function part(list,geometry,p,scale,rotation){dummy.position.fromArray(p);dummy.scale.fromArray(scale);dummy.rotation.set(0,0,0);if(rotation)dummy.rotation.fromArray(rotation);dummy.updateMatrix();list.push(geometry.clone().applyMatrix4(dummy.matrix));}
  function join(list,material,name){if(!list.length)return;const geometry=mergeGeometries(list,false);for(const piece of list)piece.dispose();if(!geometry)return;const mesh=new T.Mesh(r.own(geometry),material);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}
  function twig(a,b,radius){direction.copy(b).sub(a);dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,direction.clone().normalize());dummy.scale.set(radius,direction.length(),radius);dummy.updateMatrix();barkParts.push(branch.clone().applyMatrix4(dummy.matrix));}

  // Wet, jointed stone extends the pavement into the narrow planted courtyard.
  part(wallParts,box,[7.7,.105,-.6],[3.3,.21,4.5]);
  for(let row=0;row<6;row++)for(let col=0;col<4;col++){
    part(stoneParts,box,[6.48+col*.815,.225,-2.48+row*.745],[.792,.065,.719]);
  }
  // Low rear wall, one short seat, and a clear opening toward the pavement.
  part(wallParts,box,[7.72,.46,-2.91],[3.4,.58,.19]);
  part(stoneParts,box,[7.72,.76,-2.91],[3.5,.075,.24]);
  part(wallParts,box,[9.31,.37,-.82],[.17,.4,3.95]);
  part(stoneParts,box,[8.65,.67,1.42],[1.3,.12,.39]);
  for(const x of [8.19,9.11])part(wallParts,box,[x,.43,1.42],[.16,.37,.3]);

  const trees=[{x:7.03,z:.59,height:4.15,spread:1.16},{x:8.5,z:-.54,height:3.6,spread:1.02},{x:7.48,z:-2.02,height:4.5,spread:1.09}];
  const tips=[];
  for(let treeIndex=0;treeIndex<trees.length;treeIndex++){
    const tree=trees[treeIndex],base=new T.Vector3(tree.x,.29,tree.z),fork=base.clone().add(new T.Vector3(.06,1.48,-.05));
    const planting=r.mesh(r.geometry('CylinderGeometry',.65,.65,.035,20),soil,root,[tree.x,.276,tree.z],[1.06,1,1]);planting.receiveShadow=true;
    const rim=r.mesh(r.geometry('TorusGeometry',.69,.047,5,24),wall,root,[tree.x,.283,tree.z],[1.06,1,1]);rim.rotation.x=-Math.PI/2;rim.receiveShadow=true;
    twig(base,fork,.12);const upper=base.clone().add(new T.Vector3(-.06,tree.height*.81,.04));twig(fork,upper,.066);
    // Buttress roots and bent branches keep the silhouette legible between blooms.
    for(let k=0;k<4;k++){const a=k*Math.PI/2+.3;twig(base.clone().add(new T.Vector3(Math.cos(a)*.28,-.005,Math.sin(a)*.28)),base.clone().add(new T.Vector3(0,.34,0)),.035);}
    const ends=[];
    for(let k=0;k<8;k++){
      const a=k*2.399963+treeIndex*.72,spread=tree.spread*(.66+random()*.38);
      const start=base.clone().add(new T.Vector3(.025,1.12+k*.2,0));
      const elbow=base.clone().add(new T.Vector3(Math.sin(a)*spread*.53,tree.height*(.47+k*.035),Math.cos(a)*spread*.53));
      const end=base.clone().add(new T.Vector3(Math.sin(a)*spread,tree.height*(.57+k*.038)+random()*.17,Math.cos(a)*spread));
      twig(start,elbow,.046-random()*.01);twig(elbow,end,.027-random()*.007);
      for(let j=0;j<3;j++){
        const aa=a+(j-1)*.86+(random()-.5)*.35,length=.24+random()*.31;
        const tip=end.clone().add(new T.Vector3(Math.sin(aa)*length,.16+random()*.34,Math.cos(aa)*length));twig(end,tip,.011+random()*.006);ends.push({a:end,b:tip});
      }
    }
    ends.push({a:upper,b:base.clone().add(new T.Vector3(.1,tree.height+.12,-.12))});twig(ends.at(-1).a,ends.at(-1).b,.018);tips.push(ends);
    // Recessed garden uplights, aimed into branches, share a single real light.
    part(bronzeParts,box,[tree.x+.29,.32,tree.z+.43],[.15,.1,.17],[-.3,0,0]);
  }
  join(stoneParts,stone,'pear-wet-stone');join(wallParts,wall,'pear-courtyard-stone');join(barkParts,bark,'pear-branches');join(bronzeParts,bronze,'pear-uplights');

  function flowerGeometry(){
    const positions=[],colors=[],indices=[],normalColor=new T.Color('#f6f0e9'),pink=new T.Color('#d9b8b5'),gold=new T.Color('#9e8157');
    const add=(x,y,z,c)=>{positions.push(x,y,z);colors.push(c.r,c.g,c.b);};
    for(let petal=0;petal<5;petal++){
      const angle=petal*Math.PI*2/5,co=Math.cos(angle),si=Math.sin(angle),start=positions.length/3;
      for(const [x,y,z]of [[0,.035,.012],[-.155,.215,-.012],[.155,.215,-.012],[-.18,.382,.012],[.18,.382,.012],[0,.51,.045]])add(x*co-y*si,x*si+y*co,z,y<.1?pink:normalColor);
      for(const i of [0,1,2,1,3,4,1,4,2,3,5,4])indices.push(start+i);
    }
    const start=positions.length/3;add(0,0,.027,pink);
    for(let k=0;k<5;k++){const a=k*Math.PI*2/5;add(Math.cos(a)*.075,Math.sin(a)*.075,.03,gold);}
    for(let k=0;k<5;k++)indices.push(start,start+1+k,start+1+(k+1)%5);
    const geometry=r.own(new T.BufferGeometry());geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
  }
  function windMaterial(options,falling=false){
    const material=r.own(new T.MeshStandardMaterial({...options,side:T.DoubleSide}));
    material.onBeforeCompile=shader=>{
      shader.uniforms.uPearTime=time;
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uPearTime;');
      const movement=falling?`
        vec3 pearOrigin=instanceMatrix[3].xyz;
        float pearSeed=fract(pearOrigin.x*.313+pearOrigin.z*.719);
        float pearFall=fract(uPearTime*.095+pearSeed);
        mvPosition.y-=pearFall*(pearOrigin.y-.29);
        mvPosition.x+=sin(pearFall*7.2+pearSeed*9.0)*.25;
        mvPosition.z+=sin(pearFall*4.0+pearSeed*15.0)*.16;`:`
        float pearHeight=max(mvPosition.y-.8,0.0);
        mvPosition.x+=sin(uPearTime*.78+mvPosition.y*1.15+mvPosition.z*.63)*.009*pearHeight;
        mvPosition.z+=sin(uPearTime*.57+mvPosition.x*.83)*.006*pearHeight;`;
      shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',T.ShaderChunk.project_vertex.replace('mvPosition = modelViewMatrix * mvPosition;',`${movement}\nmvPosition = modelViewMatrix * mvPosition;`));
    };
    material.customProgramCacheKey=()=>falling?'pear-falling-v1':'pear-wind-v1';return material;
  }
  const blossoms=r.own(new T.InstancedMesh(flowerGeometry(),windMaterial({color:'#fffaf2',vertexColors:true,roughness:.79,emissive:0xecd9c6,emissiveIntensity:.09}),3600));root.add(blossoms);blossoms.name='pear-five-petal-blossoms';blossoms.receiveShadow=true;
  for(let i=0;i<3600;i++){
    const ends=tips[i%3],segment=ends[Math.floor(random()*ends.length)],along=.12+random()*.95;
    dummy.position.lerpVectors(segment.a,segment.b,along);dummy.position.x+=(random()-.5)*.34;dummy.position.y+=(random()-.5)*.32;dummy.position.z+=(random()-.5)*.34;
    dummy.rotation.set((random()-.5)*Math.PI*1.7,random()*Math.PI*2,random()*Math.PI*2);dummy.scale.setScalar((.068+random()*.045)*1.42);dummy.updateMatrix();blossoms.setMatrixAt(i,dummy.matrix);
    color.setHSL(.065+random()*.035,.02+random()*.035,.86+random()*.1);blossoms.setColorAt(i,color);
  }
  blossoms.instanceMatrix.needsUpdate=true;blossoms.instanceColor.needsUpdate=true;blossoms.computeBoundingSphere();

  const leafGeometry=r.own(new T.BufferGeometry());leafGeometry.setAttribute('position',new T.Float32BufferAttribute([0,-.5,0,-.24,-.08,.07,.24,-.08,.07,-.16,.29,.045,.16,.29,.045,0,.5,0,0,0,.11],3));leafGeometry.setIndex([0,1,6,0,6,2,1,3,6,2,6,4,3,5,6,4,6,5]);leafGeometry.computeVertexNormals();
  const leaves=r.own(new T.InstancedMesh(leafGeometry,windMaterial({color:'#8caa7f',roughness:.57}),420));leaves.name='pear-new-leaves';root.add(leaves);
  for(let i=0;i<420;i++){
    const ends=tips[i%3],segment=ends[Math.floor(random()*ends.length)];dummy.position.lerpVectors(segment.a,segment.b,random());dummy.position.y-=.015;
    dummy.rotation.set(random()*Math.PI,(random()-.5)*Math.PI*2,random()*Math.PI);const size=.09+random()*.08;dummy.scale.set(size*.66,size,size);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);
    color.setHSL(.24+random()*.045,.18+random()*.13,.24+random()*.18);leaves.setColorAt(i,color);
  }
  leaves.instanceMatrix.needsUpdate=true;leaves.instanceColor.needsUpdate=true;leaves.computeBoundingSphere();

  const petalGeometry=r.own(new T.BufferGeometry());petalGeometry.setAttribute('position',new T.Float32BufferAttribute([0,-.5,.04,-.35,-.08,-.03,.35,-.08,-.03,-.26,.3,.025,.26,.3,.025,0,.5,.1],3));petalGeometry.setIndex([0,1,2,1,3,4,1,4,2,3,5,4]);petalGeometry.computeVertexNormals();
  const fallen=r.own(new T.InstancedMesh(petalGeometry,r.own(new T.MeshStandardMaterial({color:'#e6dcd6',roughness:.31,side:T.DoubleSide})),72));fallen.name='pear-fallen-petals';root.add(fallen);
  for(let i=0;i<72;i++){
    const tree=trees[i%3],angle=random()*Math.PI*2,rr=.25+random()*.8;dummy.position.set(tree.x+Math.cos(angle)*rr,.267+random()*.008,tree.z+Math.sin(angle)*rr);dummy.rotation.set(-Math.PI/2,0,random()*Math.PI*2);dummy.scale.setScalar(.04+random()*.025);dummy.updateMatrix();fallen.setMatrixAt(i,dummy.matrix);
  }
  fallen.instanceMatrix.needsUpdate=true;fallen.computeBoundingSphere();
  const falling=r.own(new T.InstancedMesh(petalGeometry,windMaterial({color:'#f1e4df',roughness:.73,emissive:0xf1d9ce,emissiveIntensity:.045},true),30));falling.name='pear-falling-petals';falling.frustumCulled=false;root.add(falling);
  for(let i=0;i<30;i++){
    const tree=trees[i%3],angle=random()*Math.PI*2;dummy.position.set(tree.x+Math.cos(angle)*.8,tree.height*.8+.3+random()*.6,tree.z+Math.sin(angle)*.8);dummy.rotation.set(random()*Math.PI,random()*Math.PI,random()*Math.PI);dummy.scale.setScalar(.045+random()*.025);dummy.updateMatrix();falling.setMatrixAt(i,dummy.matrix);
  }
  falling.instanceMatrix.needsUpdate=true;

  // One restrained uplight keeps white blossom readable without flattening it.
  const light=new T.PointLight(0xffd8b1,5.5,5.8,2);light.position.set(7.8,1.65,-.55);root.add(light);
  const protection=new T.Group();protection.name='pear-protection';root.add(protection);protection.position.set(center[0],.285,center[2]);protection.visible=false;
  const ringMaterial=r.own(new T.MeshBasicMaterial({color:'#e6c97e',transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}));
  const ring=r.mesh(r.geometry('RingGeometry',2.37,2.395,80),ringMaterial,protection);ring.rotation.x=-Math.PI/2;
  const arcGeometry=r.geometry('TorusGeometry',2.49,.008,3,64,Math.PI*.63),arcs=r.own(new T.InstancedMesh(arcGeometry,ringMaterial,3));protection.add(arcs);
  for(let i=0;i<3;i++){dummy.position.set(0,.02,0);dummy.rotation.set(-Math.PI/2,0,i*Math.PI*2/3);dummy.scale.set(1,1,1);dummy.updateMatrix();arcs.setMatrixAt(i,dummy.matrix);}arcs.instanceMatrix.needsUpdate=true;arcs.computeBoundingSphere();
  function setQuality(value){quality=['low','balanced','high'].includes(value)?value:'balanced';blossoms.count=quality==='low'?1400:quality==='high'?3600:2700;leaves.count=quality==='low'?240:420;falling.count=quality==='low'?12:quality==='high'?30:24;}
  setQuality('balanced');
  return {root,center,wetMaterials:[stone],
    update(t,delta=0,options){time.value=t;if(options?.protected!==undefined)protectedTarget=Boolean(options.protected);shieldAmount=T.MathUtils.damp(shieldAmount,protectedTarget?1:0,3,Math.max(0,Math.min(.1,delta)));protection.visible=shieldAmount>.003;ringMaterial.opacity=shieldAmount*(.16+Math.sin(t*1.7)*.025);protection.rotation.y=Math.sin(t*.22)*.04;},
    quality:setQuality,
    reset(){protectedTarget=false;shieldAmount=0;ringMaterial.opacity=0;protection.visible=false;time.value=0;},
    get state(){return {quality,trees:trees.length,blossoms:blossoms.count,newLeaves:leaves.count,fallingPetals:falling.count,protected:protectedTarget,shield:shieldAmount,center:[...center]};},
  };
}
