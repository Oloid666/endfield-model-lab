import * as T from 'three';

// Surface patches follow the same breathing/rotation group as the actual body.
export function buildDragonBandages(r,parent){
 const tape=new T.Group();tape.name='dragon-curved-bandages';parent.add(tape);
 for(const [cx,cy,angle]of [[-.17,.98,-.3],[.34,.48,.6]]){
  const patch=new T.Group();tape.add(patch);
  function layer(w,h,color,offset,du=0,dv=0){
   const geo=r.own(new T.PlaneGeometry(w,h,12,4)),p=geo.attributes.position,n=new T.Vector3();
   for(let i=0;i<p.count;i++){
    const u=p.getX(i)+du,v=p.getY(i)+dv,x=cx+u*Math.cos(angle)-v*Math.sin(angle),y=cy+u*Math.sin(angle)+v*Math.cos(angle),z=.49*Math.sqrt(Math.max(.001,1-(x/.56)**2-((y-.63)/.59)**2));
    n.set(x/(.56*.56),(y-.63)/(.59*.59),z/(.49*.49)).normalize();p.setXYZ(i,x+n.x*offset,y+n.y*offset,z+n.z*offset);
   }
   geo.computeVertexNormals();const mesh=r.mesh(geo,r.material(color,{roughness:.94}),patch);mesh.name='dragon-bandage-surface';return mesh;
  }
  layer(.294,.112,'#d7ae76',.010);layer(.091,.096,'#f6e2bc',.013);
  for(const side of [-1,1])for(const dv of [-.026,.026])layer(.009,.009,'#856c4b',.014,side*.102,dv);
 }
 return tape;
}
