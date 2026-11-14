import * as T from 'three';
import {DIRECTOR_BEAT} from './opening-handoff.js';
// A story prop only: no MediaDevices, recording permission or second renderer.
export function buildDirectorCamera(scene,r){
 const root=new T.Group();root.name='director-film-camera';scene.add(root);root.visible=false;
 r.box(root,'#70978e',[0,0,0],[.36,.24,.25],{metalness:.3,roughness:.55,emissive:0x35594f,emissiveIntensity:.35});
 r.box(root,'#d9c590',[0,.115,0],[.37,.025,.27],{metalness:.4,roughness:.5,emissive:0x766339,emissiveIntensity:.25});
 const lens=r.cylinder(root,'#12272c',[0,0,.20],.105,.22,{metalness:.5,roughness:.28});lens.rotation.x=Math.PI/2;
 const rim=r.cylinder(root,'#c8b984',[0,0,.31],.11,.025,{metalness:.4,roughness:.4,emissive:0x766339,emissiveIntensity:.3});rim.rotation.x=Math.PI/2;
 const glass=r.cylinder(root,'#346778',[0,0,.326],.085,.009,{metalness:.6,roughness:.18,emissive:0x173f50,emissiveIntensity:.3});glass.rotation.x=Math.PI/2;
 for(const x of [-.11,.11])r.box(root,'#183336',[x,.18,0],[.03,.11,.035]);
 r.box(root,'#183336',[0,.235,0],[.25,.035,.04]);
 r.box(root,'#a4c5ad',[0,0,-.132],[.24,.14,.008],{emissive:0x517c69,emissiveIntensity:.25});
 const red=r.mesh(r.geometry('SphereGeometry',.022,8,6),r.material('#954e42',{emissive:0xf23e2b,emissiveIntensity:.08}),root,[.135,.1,.145]);
 const target=new T.Vector3();const state={visible:false,recording:false,position:[0,0,0],target:[0,0,0]};
 return {root,state,update(s,dragon,reduced=false){
  state.visible=s?.phase==='director-reminder';root.visible=state.visible;
  if(!state.visible){state.recording=false;return;}
  const e=s.phaseElapsed||0;root.position.set(dragon[0]+.75,dragon[1]+.4+(reduced?0:Math.sin(e*1.3)*.012),dragon[2]+1.5);
  target.set(dragon[0],dragon[1]+.36,dragon[2]);root.lookAt(target);
  state.recording=e>=DIRECTOR_BEAT.reply;red.material.emissiveIntensity=state.recording?1.2:.08;
  root.position.toArray(state.position);target.toArray(state.target);
 },reset(){root.visible=false;state.visible=state.recording=false;},dispose(){root.removeFromParent();}};
}
