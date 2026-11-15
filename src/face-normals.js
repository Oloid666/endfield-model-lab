import * as T from 'three';
// The original skin atlas is clean. Front-facing lower-lip vertices contain near-downward
// imported normals; soften only those normals. Mouth cavity, UVs, skin weights and positions stay intact.
export function softenLipNormals(source){
 const geometry=source.clone(),uv=geometry.attributes.uv,normal=geometry.attributes.normal,position=geometry.attributes.position;
 const n=new T.Vector3(),face=new T.Vector3();let count=0;
 for(let i=0;i<normal.count;i++){
  const x=(uv.getX(i)-.5)/.085,y=(uv.getY(i)-.369)/.038,d=Math.hypot(x,y),z=position.getZ(i);
  if(d>=1||normal.getZ(i)<=.12||z<.067)continue;
  const weight=(1-T.MathUtils.smoothstep(d,.3,1))*.78;
  face.set(position.getX(i)/.0064,(position.getY(i)-1.48)/.0064,(z-.035)/.0049).normalize();n.fromBufferAttribute(normal,i).lerp(face,weight).normalize();normal.setXYZ(i,n.x,n.y,n.z);count++;
 }
 normal.needsUpdate=true;geometry.userData.lipNormalsSoftened=count;return geometry;
}
