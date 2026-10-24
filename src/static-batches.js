import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Keep the original linear colors as vertex data. Share the PBR program and draw.
export function optimizeStaticSet(root,r){
  root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),transform=new T.Matrix4(),groups=new Map();let before=0;
  root.traverse(mesh=>{
    if(!mesh.isMesh)return;before++;
    const m=mesh.material;
    if(mesh.isInstancedMesh||mesh.isSkinnedMesh||mesh.userData.dynamic||mesh.userData.hotspot||Array.isArray(m)||!m?.isMeshStandardMaterial||m.transparent||m.emissive.getHex()||m.userData.wetPavement)return;
    if(Object.values(m).some(value=>value?.isTexture))return;
    const key=JSON.stringify([m.roughness,m.metalness,m.side,m.depthWrite,m.depthTest,m.flatShading,mesh.castShadow,mesh.receiveShadow]);
    const group=groups.get(key)||{material:m,meshes:[]};group.meshes.push(mesh);groups.set(key,group);
  });
  let removed=0,draws=0;
  for(const {material:m,meshes} of groups.values()){
    if(meshes.length<2)continue;
    const geometries=[];
    for(const mesh of meshes){
      const geometry=mesh.geometry.clone();transform.multiplyMatrices(inverse,mesh.matrixWorld);geometry.applyMatrix4(transform);
      const prior=geometry.getAttribute('color'),colors=new Float32Array(geometry.getAttribute('position').count*3);
      // Each source has its own color, even when roughness and metalness match.
      const color=mesh.material.color;for(let i=0;i<colors.length/3;i++){colors[i*3]=color.r*(prior?prior.getX(i):1);colors[i*3+1]=color.g*(prior?prior.getY(i):1);colors[i*3+2]=color.b*(prior?prior.getZ(i):1);}
      geometry.setAttribute('color',new T.BufferAttribute(colors,3));geometries.push(geometry);
    }
    const merged=mergeGeometries(geometries,false);for(const geometry of geometries)geometry.dispose();if(!merged)continue;
    const material=r.own(new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:m.roughness,metalness:m.metalness,side:m.side,depthWrite:m.depthWrite,depthTest:m.depthTest,flatShading:m.flatShading}));
    const mesh=new T.Mesh(r.own(merged),material);mesh.castShadow=meshes[0].castShadow;mesh.receiveShadow=meshes[0].receiveShadow;mesh.userData.staticBatch=true;root.add(mesh);merged.computeBoundingSphere();
    for(const source of meshes)source.removeFromParent();removed+=meshes.length;draws++;
  }
  return {meshesBefore:before,meshesAfter:before-removed+draws,consolidated:removed,sharedDraws:draws};
}
