import * as T from 'three';
// Shared conservative body envelope, transformed into each mesh's own coordinates.
// Renderer tests it independently for the main, reflection and shadow cameras.
export function actorBounds(body,pivot,{height=1.1,radius=1.75}={}){
 const meshes=[];body.traverse(n=>{if(n.isMesh){n.frustumCulled=true;n.boundingSphere=new T.Sphere();meshes.push(n);}});
 const world=new T.Sphere(),inverse=new T.Matrix4();
 return ()=>{world.center.set(0,height,0).applyMatrix4(pivot.matrixWorld);world.radius=radius*pivot.matrixWorld.getMaxScaleOnAxis();for(const mesh of meshes)mesh.boundingSphere.copy(world).applyMatrix4(inverse.copy(mesh.matrixWorld).invert());};
}
