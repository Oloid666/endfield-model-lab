import * as T from 'three';
import {optimizeStaticSet} from './static-batches.js';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
const canonical=value=>['BACKSPACE','backspace','Delete','⌫'].includes(String(value))?'⌫':['Enter','ENTER','enter','submit','↵'].includes(String(value))?'↵':String(value??'').toLowerCase();

// A physical local terminal. The DOM handles touch; this stage supplies exact foot targets.
export function buildConnectionStage(scene,r){
  const root=new T.Group();root.name='dragon-login-terminal-v8';root.position.set(-1.65,.335,3.25);scene.add(root);root.visible=false;
  const shell=new T.Group(),keyboard=new T.Group(),captcha=new T.Group(),leverRoot=new T.Group();root.add(shell,keyboard,captcha,leverRoot);
  const unitBox=r.geometry('BoxGeometry',1,1,1),metal=r.material('#203c3d',{roughness:.42,metalness:.63}),edge=r.material('#83958b',{roughness:.33,metalness:.65});
  const box=(owner,mat,p,s)=>r.mesh(unitBox,mat,owner,p,s);
  box(shell,metal,[0,.025,0],[3.88,.14,2.53]);
  for(const x of [-1.95,1.95])box(shell,edge,[x,.053,0],[.035,.18,2.57]);
  for(const z of [-1.27,1.27])box(shell,edge,[0,.053,z],[3.88,.18,.035]);
  for(const x of [-1.78,1.78])for(const z of [-1.1,1.1])r.mesh(r.geometry('CylinderGeometry',.04,.04,.015,8),edge,shell,[x,.13,z]);
  const stripe=r.material('#b5bc9d',{emissive:0x78bda1,emissiveIntensity:.12,roughness:.46});box(shell,stripe,[0,.11,-1.16],[1.76,.01,.035]);
  const accountLabel=r.mesh(r.geometry('PlaneGeometry',1,1),r.label('天師樁 · 接入終端',{width:1024,height:128,font:'bold 48px sans-serif',bg:'#203c3d',color:'#ccd7b8'}),shell,[0,.131,-1.15],[1.77,.18,1]);accountLabel.rotation.x=-Math.PI/2;
  optimizeStaticSet(shell,r);

  const letters='abcdefghijklmnopqrstuvwxyz'.split(''),glyphs=[...letters,'_','⌫',...'0123456789','↵'];
  const cols=8,rows=Math.ceil(glyphs.length/cols),canvas=document.createElement('canvas');canvas.width=1024;canvas.height=rows*128;
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 76px sans-serif';ctx.fillStyle='#e9e5c9';
  glyphs.forEach((glyph,index)=>ctx.fillText(glyph,index%cols*128+64,Math.floor(index/cols)*128+66));
  const map=r.own(new T.CanvasTexture(canvas));map.colorSpace=T.SRGBColorSpace;map.anisotropy=2;
  const material=r.own(new T.MeshBasicMaterial({map,transparent:true,alphaTest:.1,depthWrite:false,toneMapped:false}));
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 instanceKeyUV;');
    shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv=vMapUv*instanceKeyUV.zw+instanceKeyUV.xy;\n#endif');
  };material.customProgramCacheKey=()=> 'dragon-keycap-atlas-v8';
  const records=[];
  function add(key,field,x,z,w,d){records.push({key,field,x,z,w,d,index:records.length});}
  [...letters,'_','⌫'].forEach((key,i)=>add(key,'account',-1.5+i%6*.6,-.84+Math.floor(i/6)*.42,.5,.32));
  add('↵','account',1.2,.84,1.08,.32);
  ['1','2','3','4','5','6','7','8','9','⌫','0','↵'].forEach((key,i)=>add(key,'password',-.95+i%3*.95,-.75+Math.floor(i/3)*.5,.78,.38));
  const bodies=r.own(new T.InstancedMesh(unitBox,r.own(new T.MeshStandardMaterial({color:0xffffff,roughness:.46,metalness:.32})),records.length));bodies.instanceMatrix.setUsage(T.DynamicDrawUsage);bodies.frustumCulled=false;bodies.name='physical-dragon-keycaps';keyboard.add(bodies);
  const labelGeometry=r.own(new T.PlaneGeometry(1,1));labelGeometry.setAttribute('instanceKeyUV',new T.InstancedBufferAttribute(new Float32Array(records.length*4),4));
  const labels=r.own(new T.InstancedMesh(labelGeometry,material,records.length));labels.instanceMatrix.setUsage(T.DynamicDrawUsage);labels.frustumCulled=false;keyboard.add(labels);
  const normalColor=new T.Color('#29484b'),pressedColor=new T.Color('#bdc18d'),dummy=new T.Object3D();
  for(const record of records){
    const index=glyphs.indexOf(record.key);labelGeometry.attributes.instanceKeyUV.setXYZW(record.index,index%cols/cols,1-(Math.floor(index/cols)+1)/rows,1/cols,1/rows);bodies.setColorAt(record.index,normalColor);
  }
  labelGeometry.attributes.instanceKeyUV.needsUpdate=true;bodies.instanceColor.needsUpdate=true;
  // The captcha remains a diegetic plate, not a connection to an external service.
  const ivory=r.material('#d3d4c0',{roughness:.56,metalness:.1});box(captcha,ivory,[0,.135,0],[2.76,.085,.82]);
  for(const x of [-.99,-.58])box(captcha,edge,[x,.192,0],[.025,.014,.42]);
  for(const z of [-.2,.2])box(captcha,edge,[-.785,.192,z],[.43,.014,.025]);
  const captchaText=r.mesh(r.geometry('PlaneGeometry',1,1),r.label('我不是機器人',{width:1024,height:256,font:'bold 120px sans-serif',bg:'#d3d4c0',color:'#29423c'}),captcha,[.37,.181,0],[1.68,.41,1]);captchaText.rotation.x=-Math.PI/2;
  const tick=new T.Group();tick.position.set(-.785,.212,0);captcha.add(tick);
  const green=r.material('#438875',{emissive:0x39a785,emissiveIntensity:.36,roughness:.4});
  const tick1=box(tick,green,[-.055,0,.04],[.14,.025,.035]);tick1.rotation.y=-.7;const tick2=box(tick,green,[.035,0,-.025],[.22,.025,.035]);tick2.rotation.y=.8;
  optimizeStaticSet(captcha,r);
  // A horizontal heavy rail gives the companion something substantial to pull.
  box(leverRoot,metal,[0,.12,.02],[3.1,.13,.72]);
  const rail=r.mesh(r.geometry('CylinderGeometry',.045,.045,2.7,12),edge,leverRoot,[0,.255,.02]);rail.rotation.z=Math.PI/2;
  for(const x of [-1.43,1.43])box(leverRoot,ivory,[x,.22,.02],[.22,.29,.54]);
  const track=r.mesh(r.geometry('PlaneGeometry',1,1),r.label('向右接通  →',{width:1024,height:128,font:'bold 75px sans-serif',bg:'#203c3d',color:'#d5d5b7'}),leverRoot,[0,.205,.44],[2.3,.27,1]);track.rotation.x=-Math.PI/2;
  const handle=new T.Group();handle.name='dragon-connection-lever-handle';handle.position.set(-1.18,.25,.02);leverRoot.add(handle);
  box(handle,edge,[0,0,0],[.22,.17,.3]);box(handle,metal,[0,.17,0],[.095,.29,.1]);
  const grip=r.mesh(r.geometry('CylinderGeometry',.065,.065,.5,12),r.material('#b5bda0',{roughness:.42,metalness:.45}),handle,[0,.31,0]);grip.rotation.x=Math.PI/2;
  optimizeStaticSet(handle,r);
  // Keep the handle separate before batching the fixed rail: its entire assembly moves.
  handle.traverse(node=>{if(node.isMesh)node.userData.dynamic=true;});
  optimizeStaticSet(leverRoot,r);
  // The rail batch excludes this moving assembly on the external scene pass.
  root.traverse(node=>{if(node.isMesh){node.userData.dynamic=true;node.castShadow=false;node.receiveShadow=true;}});
  let phase='ready',field='account',lastKey='',keyNumber=0,keyAt=-Infinity,lever=0,pressed=false;
  let count=0;
  const position=[0,0,0];
  function localKey(key,forField=field){const k=canonical(key);return records.find(record=>record.key===k&&record.field===forField)||records.find(record=>record.key===k);}
  function keyPosition(key){
    if(['verify','captcha','check'].includes(String(key).toLowerCase()))return [root.position.x-.785,root.position.y+.21,root.position.z];
    const record=localKey(key);if(!record)return [root.position.x,root.position.y+.21,root.position.z];
    return [root.position.x+record.x,root.position.y+.21,root.position.z+record.z];
  }
  function leverPosition(value=lever){return [root.position.x-1.18+2.36*clamp(value),root.position.y+.37,root.position.z+.02];}
  function update(t,delta,state={}){
    phase=state.phase||'ready';const c=state.connection||{},clock=Number.isFinite(state.clock)?state.clock:t;
    root.visible=['terminal-deploy','login','captcha','lever'].includes(phase);if(!root.visible){pressed=false;return;}
    field=c.field==='password'?'password':'account';lastKey=canonical(c.lastKey);keyNumber=Number(c.keyNumber)||0;keyAt=Number.isFinite(c.keyAt)?c.keyAt:-Infinity;lever=clamp(c.lever);
    const deploy=phase==='terminal-deploy'?clamp(state.phaseElapsed/2):1;root.scale.set(1,Math.max(.03,deploy),Math.max(.03,deploy));root.position.y=.335+(1-deploy)*.7;keyboard.visible=['terminal-deploy','login'].includes(phase);captcha.visible=phase==='captcha';leverRoot.visible=phase==='lever';tick.visible=Boolean(c.verified);handle.position.x=-1.18+2.36*lever;
    const age=clock-keyAt,depression=age>=0&&age<.38?Math.sin(age/.38*Math.PI)*.048:0;pressed=depression>.002;count=0;
    for(const record of records){
      const active=record.field===field,down=active&&record.key===lastKey?depression:0;
      dummy.rotation.set(0,0,0);dummy.position.set(record.x,.13-down,record.z);dummy.scale.set(active?record.w:0,active?.1:0,active?record.d:0);dummy.updateMatrix();bodies.setMatrixAt(record.index,dummy.matrix);
      dummy.position.y=.185-down;dummy.rotation.x=-Math.PI/2;dummy.scale.set(active?Math.min(record.w*.63,.36):0,active?.24:0,1);dummy.updateMatrix();labels.setMatrixAt(record.index,dummy.matrix);
      bodies.setColorAt(record.index,down>.003?pressedColor:normalColor);if(active)count++;
    }
    bodies.instanceMatrix.needsUpdate=true;labels.instanceMatrix.needsUpdate=true;bodies.instanceColor.needsUpdate=true;
  }
  update(0,0,{phase:'ready'});
  return {root,keyPosition,leverPosition,
    reset(){phase='ready';field='account';lastKey='';keyNumber=0;keyAt=-Infinity;lever=0;pressed=false;root.visible=false;handle.position.x=-1.18;},update,
    get state(){return {visible:root.visible,phase,field,lastKey,keyNumber,pressed,lever,keys:count,position:root.position.toArray(),keyTop:root.position.y+.21,leverPosition:leverPosition(),physical:true};}
  };
}
