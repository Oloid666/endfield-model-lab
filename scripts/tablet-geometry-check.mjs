import assert from 'node:assert/strict';
import * as T from 'three';
import fs from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Resources} from '../src/resources.js';
import {buildXaihi} from '../src/xaihi.js';
globalThis.ProgressEvent=class{constructor(t,p){Object.assign(this,p)}};
const ctx=new Proxy({measureText:()=>({width:40})},{get:(o,k)=>o[k]??(()=>{})});globalThis.document={createElement:()=>({getContext:()=>ctx,width:256,height:256})};
const bytes=await fs.readFile(new URL('../public/models/xaihi.glb',import.meta.url)),len=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+len)),binary=bytes.subarray(28+len,28+len+bytes.readUInt32LE(20+len));
json.buffers[0].uri='data:application/octet-stream;base64,'+binary.toString('base64');json.materials=json.materials.map(()=>({}));delete json.images;delete json.textures;delete json.samplers;

const gltf=await new GLTFLoader().parseAsync(JSON.stringify(json),'');
const r=new Resources(),actor=buildXaihi(new T.Scene(),r,gltf),board=actor.root.getObjectByName('xaihi-terminal');
for(const stage of ['search','php','temperature','grid','power','confirm','ready']){
 actor.reset();for(let i=0;i<120;i++)actor.update(i/30,1/30,{phase:'hack',tablet:{stage,age:i/30}});
 actor.root.updateMatrixWorld(true);const meshes=[];gltf.scene.traverse(n=>{if(n.isSkinnedMesh){n.skeleton.update();n.computeBoundingSphere();}if(n.isMesh)meshes.push(n);});
 const f=actor.tabletFrame(.462),eye=new T.Vector3(...f.position),ray=new T.Raycaster(),v=new T.Vector3(),d=new T.Vector3();let hidden=0,penetration=0,occluders={},maxDepth=0;
 for(let y=0;y<5;y++)for(let x=0;x<9;x++){
  board.localToWorld(v.set((x/8-.5)*.28,(y/4-.5)*.17,.018));const dist=v.distanceTo(eye);ray.set(eye,d.subVectors(v,eye).normalize());const hit=ray.intersectObjects(meshes,false).find(h=>h.distance<dist-.002);
  if(hit){hidden++;const id=gltf.parser.associations.get(hit.object)?.meshes;occluders[id]=(occluders[id]||0)+1;}
 }
 for(const m of meshes){for(let i=0;i<m.geometry.attributes.position.count;i++){m.getVertexPosition(i,v);m.localToWorld(v);board.worldToLocal(v);if(Math.abs(v.x)<.165&&Math.abs(v.y)<.115&&v.z>-.008&&v.z<.019){penetration++;maxDepth=Math.max(maxDepth,Math.min(.165-Math.abs(v.x),.115-Math.abs(v.y),v.z+.008,.019-v.z));}}}
 assert.equal(hidden,0,stage+': all central text/button sightlines are clear on the real skinned mesh');
 assert.ok(maxDepth<.003,stage+': no deep skin/sleeve penetration in the tablet: '+maxDepth);
 for(const aspect of [.462,2.164,1.6]){
  const f=actor.tabletFrame(aspect),camera=new T.PerspectiveCamera(f.fov,aspect,.01,20);camera.position.fromArray(f.position);camera.lookAt(new T.Vector3(...f.center));camera.updateMatrixWorld(true);
  for(const x of [-.175,.175])for(const y of [-.125,.125]){const p=board.localToWorld(new T.Vector3(x,y,.017)).project(camera);assert.ok(Math.abs(p.x)<.94&&p.y<.74&&p.y>-.50,stage+': full tablet stays above portrait/landscape UI and inside view '+aspect+': '+p.toArray());}
 }
 console.log(JSON.stringify({stage,hidden,occluders,penetration,maxDepth,palms:actor.state.palmPositions.map(p=>board.worldToLocal(new T.Vector3(...p)).toArray()),frame:f}));
}
