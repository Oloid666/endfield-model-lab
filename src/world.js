import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { ThinGlassPass } from './glass.js';
import { applyWetPavement } from './wet-pavement.js';
import { makeNightEnvironment } from './surfaces.js';
import { config } from './config.js';
import { Resources } from './resources.js';
import { buildStore } from './store.js';
import { buildWeather } from './weather.js';

export class World {
  constructor(container,{onContextLost,onContextRestored,onManual,onFraming=()=>{}}) {
    this.onFraming=onFraming;this.r=new Resources();this.container=container;this.quality='balanced';this.time=0;this.disposed=false;this.renderCount=0;
    this.scene=new T.Scene();this.scene.background=new T.Color('#080f1d');this.scene.fog=new T.FogExp2('#101a2c',.009);
    this.camera=new T.PerspectiveCamera(37,1,.04,100);this.onTick=()=>{};this.manualUntil=0;
    this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.info.autoReset=false;this.renderer.transmissionResolutionScale=.5;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,config.dpr.balanced));container.append(this.renderer.domElement);
    this.contextLost=e=>{e.preventDefault();this.stop();onContextLost();};this.contextRestored=()=>{this.scene.environment=makeNightEnvironment(this.renderer,this.r);this.store.spill.shadow.needsUpdate=true;this.refreshGlassProbe();this.weather.invalidateReflection();onContextRestored();};
    this.renderer.domElement.addEventListener('webglcontextlost',this.contextLost);this.renderer.domElement.addEventListener('webglcontextrestored',this.contextRestored);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);Object.assign(this.controls,{enableDamping:true,dampingFactor:.065,minDistance:.75,maxDistance:44,maxPolarAngle:Math.PI*.49,minPolarAngle:.15,zoomSpeed:.8,panSpeed:.65,rotateSpeed:.5});
    this.controls.touches.ONE=T.TOUCH.ROTATE;this.controls.touches.TWO=T.TOUCH.DOLLY_PAN;
    this.manual=()=>{this.transition=null;this.currentView=null;this.manualUntil=this.time+14;onManual();};this.controls.addEventListener('start',this.manual);
    this.scene.add(new T.HemisphereLight(0x8aa9d9,0x1c2831,.36));
    const moon=new T.DirectionalLight(0x91b8d4,.65);moon.position.set(-5,10,5);this.scene.add(moon);
    const face=new T.DirectionalLight(0xffe4b8,.55);face.position.set(2,5,7);this.scene.add(face);
    const rim=new T.DirectionalLight(0x8dc9d1,.6);rim.position.set(4,4,-2);this.scene.add(rim);
    // Soft frontal keys target the performers, away from the window behind them.
    const portraitKey=new T.SpotLight(0xffeadc,88,10,.34,.9,2);portraitKey.position.set(-3.6,3.7,6.7);portraitKey.target.position.set(-1.6,1.3,2.5);this.scene.add(portraitKey,portraitKey.target);
    const portraitFill=new T.SpotLight(0xc3d8ed,28,9,.42,1,2);portraitFill.position.set(2,2.8,5.4);portraitFill.target.position.set(-1.4,1.25,2.5);this.scene.add(portraitFill,portraitFill.target);
    this.portrait={key:portraitKey,fill:portraitFill};
    const back=new T.DirectionalLight(0x7194d8,.75);back.position.set(-6,8,-9);this.scene.add(back);
    for(const [color,intensity,pos,range] of [[0x89b4f5,22,[-5.3,4.4,-2.8],12],[0x7ba3d2,25,[7,5.3,-3.4],14],[0xe3ad76,18,[-7.3,2.1,2],9]]){const light=new T.PointLight(color,intensity,range,2);light.position.fromArray(pos);this.scene.add(light);}
    // Mixed fluorescent/halogen light, with a long source reflected in wet surfaces.
    const glow=r=>{const c=document.createElement('canvas');c.width=16;c.height=128;const ctx=c.getContext('2d'),g=ctx.createLinearGradient(0,0,0,128);g.addColorStop(0,'rgba(142,182,255,0)');g.addColorStop(.45,'rgba(174,207,255,.1)');g.addColorStop(.5,'rgba(222,239,255,.22)');g.addColorStop(.55,'rgba(174,207,255,.1)');g.addColorStop(1,'rgba(142,182,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,16,128);const tex=r.own(new T.CanvasTexture(c));return r.own(new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));};
    this.r.mesh(this.r.geometry('PlaneGeometry',1,1),glow(this.r),this.scene,[0,3.51,2.2],[9.05,1.4,1]);
    this.r.mesh(this.r.geometry('BoxGeometry',1,1,1),this.r.material('#e6f1ff',{emissive:0xb6d5ff,emissiveIntensity:2.5}),this.scene,[0,3.45,2.16],[8.95,.045,.06]);
    for(const x of [-3.3,0,3.3]){const cold=new T.PointLight(0xb4d0ff,3,5,2);cold.position.set(x,3.48,2.36);this.scene.add(cold);}
    this.scene.environment=makeNightEnvironment(this.renderer,this.r);this.scene.environmentIntensity=.48;
    this.store=buildStore(this.scene,this.r);this.weather=buildWeather(this.scene,this.r);this.wet=applyWetPavement(this.store.wetMaterials||[],this.weather.reflection,this.r);this.refreshGlassProbe();
    const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:true});target.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);
    const gl=this.renderer.getContext(),samples=gl.getInternalformatParameter(gl.RENDERBUFFER,gl.RGBA16F,gl.SAMPLES)||[];
    target.samples=Math.min(4,Math.max(0,...samples));target.resolveDepthBuffer=true;this.msaaSamples=target.samples;this.supportedSamples=target.samples;
    this.composer=new EffectComposer(this.renderer,target);this.composer.addPass(new RenderPass(this.scene,this.camera));
    this.glassPass=new ThinGlassPass(this.scene,this.camera,this.store.glass);this.composer.addPass(this.glassPass);
    this.bloom=new UnrealBloomPass(new T.Vector2(1,1),.29,.62,1.05);this.composer.addPass(this.bloom);this.output=new OutputPass();this.composer.addPass(this.output);this.fxaa=new ShaderPass(FXAAShader);this.composer.addPass(this.fxaa);
    this.resize=()=>{if(this.disposed)return;const width=container.clientWidth,height=Math.max(1,container.clientHeight);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.weather?.invalidateReflection();this.renderer.setSize(width,height,false);this.composer.setSize(width,height);this.fxaa.uniforms.resolution.value.set(1/(width*this.renderer.getPixelRatio()),1/(height*this.renderer.getPixelRatio()));this.bloom.resolution.set(width*.5,height*.5);this.bloom.setSize(width*.5,height*.5);const mobile=width/height<.85;if(this.mobile!==mobile&&this.currentView)this.setView(this.currentView,true);this.mobile=mobile;};
    this.observer=new ResizeObserver(this.resize);this.observer.observe(container);this.resize();this.setView('street',true);
    this.visibility=()=>{this.previous=undefined;};document.addEventListener('visibilitychange',this.visibility);
  }
  refreshGlassProbe(){
    const target=this.r.own(new T.WebGLCubeRenderTarget(128,{type:T.HalfFloatType}));
    const camera=new T.CubeCamera(.1,45,target);camera.position.set(0,1.9,2.02);
    for(const mesh of this.store.glassMeshes)mesh.visible=false;
    const visible=this.weather.reflection.visible;this.weather.reflection.visible=false;
    camera.update(this.renderer,this.scene);
    for(const mesh of this.store.glassMeshes)mesh.visible=true;this.weather.reflection.visible=visible;
    this.store.glass.uniforms.uEnvironment.value=target.texture;
  }
  inspectLayout(){
    this.stop();this.renderer.clippingPlanes=[new T.Plane(new T.Vector3(0,-1,0),1.56)];this.glassPass.enabled=false;
    if(this.actors)this.actors.root.visible=false;this.setView('plan',true);this.composer.render();
  }
  setView(name,instant=false){
    this.weather?.invalidateReflection();
    this.currentView=name==='reset'?'street':name;
    const preset=config.views[name==='reset'?'street':name];if(!preset)return;
    const mobile=this.container.clientWidth/Math.max(1,this.container.clientHeight)<.85;
    const target=new T.Vector3().fromArray(mobile?preset.mobileTarget:preset.target),position=new T.Vector3().fromArray(mobile?preset.mobilePosition:preset.position);
    if(name==='detail'&&this.actors){const offset=this.actors.position.clone().sub(new T.Vector3(-1.25,.32,2.48));target.add(offset);position.add(offset);}
    // Flush damping once, so user momentum does not fight a selected preset.
    const damping=this.controls.enableDamping;this.controls.enableDamping=false;this.controls.update();this.controls.enableDamping=damping;
    if(instant||matchMedia('(prefers-reduced-motion: reduce)').matches){this.camera.position.copy(position);this.controls.target.copy(target);this.transition=null;}
    else this.transition={start:this.time,position:this.camera.position.clone(),target:this.controls.target.clone(),endPosition:position,endTarget:target};
    this.controls.update();const close=this.camera.position.distanceTo(this.controls.target)<(this.camera.aspect<.85?14:11);if(close!==this.closeFraming){this.closeFraming=close;this.onFraming(close);}
  }
  setQuality(value){if(!config.dpr[value])return;this.quality=value;this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,config.dpr[value]));this.composer.setPixelRatio(this.renderer.getPixelRatio());this.msaaSamples=Math.min(this.supportedSamples,value==='low'?2:4);for(const target of [this.composer.renderTarget1,this.composer.renderTarget2])if(target.samples!==this.msaaSamples){target.samples=this.msaaSamples;target.dispose();}this.bloom.enabled=value!=='low';this.weather.quality(value);this.store.glass.uniforms.uRefraction.value=value==='low'?.0012:value==='high'?.005:.003;const size=value==='low'?512:1024;this.store.spill.shadow.mapSize.set(size,size);this.store.spill.shadow.map?.dispose();this.store.spill.shadow.map=null;this.store.spill.shadow.needsUpdate=true;this.resize();}
  start(){this.stop();this.renderer.setAnimationLoop(now=>{
    if(document.hidden){this.previous=undefined;return;}
    const delta=this.previous===undefined?0:Math.max(0,(now-this.previous)/1000);this.previous=now;
    this.time+=delta;
    if(this.transition){const p=this.transition,w=T.MathUtils.smootherstep(this.time-p.start,0,1.5);this.camera.position.lerpVectors(p.position,p.endPosition,w);this.controls.target.lerpVectors(p.target,p.endTarget,w);if(w===1)this.transition=null;}
    this.controls.update();const close=this.camera.position.distanceTo(this.controls.target)<(this.camera.aspect<.85?14:11);if(close!==this.closeFraming){this.closeFraming=close;this.onFraming(close);}this.onTick(this.time,Math.min(delta,.08));this.actors?.update(this.time,Math.min(delta,.08));if(this.actors){const p=this.actors.position;this.portrait.key.position.set(p.x-2.35,3.7,p.z+4.22);this.portrait.key.target.position.set(p.x-.35,1.3,p.z);this.portrait.fill.position.set(p.x+3.25,2.8,p.z+2.92);this.portrait.fill.target.position.set(p.x-.15,1.25,p.z);}this.store.update?.(this.time,delta,this.actors?.position);this.store.glass.uniforms.uTime.value=this.time;this.wet.update(this.time);this.weather.update(this.time);this.renderer.info.reset();this.composer.render();this.renderCount++;
  });}
  stop(){this.renderer.setAnimationLoop(null);this.previous=undefined;}
  dispose(){if(this.disposed)return;this.disposed=true;this.stop();this.observer.disconnect();document.removeEventListener('visibilitychange',this.visibility);this.controls.removeEventListener('start',this.manual);this.controls.dispose();this.renderer.domElement.removeEventListener('webglcontextlost',this.contextLost);this.renderer.domElement.removeEventListener('webglcontextrestored',this.contextRestored);this.actors?.dispose();this.store.spill.shadow.dispose();this.weather.dispose();for(const pass of this.composer.passes)pass.dispose?.();this.composer.dispose();this.r.dispose();this.renderer.dispose();this.renderer.domElement.remove();}
}
