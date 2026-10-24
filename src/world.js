import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OpaquePass } from './opaque-pass.js';
import { optimizeStaticSet } from './static-batches.js';
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
import { WalkCamera } from './walk-camera.js';
import { buildPearGarden } from './pear-garden.js';
import { buildSiegeEffects } from './siege-effects.js';
import { MissionDirector } from './mission-director.js';

export class World {
  constructor(container,{onContextLost,onContextRestored,onManual,onFraming=()=>{},onZone=()=>{}}) {
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
    this.onManualView=onManual;this.walkCamera=new WalkCamera(this.camera,this.controls,onZone);
    this.manual=()=>{this.transition=null;this.currentView=null;this.manualUntil=this.time+14;onManual();};this.controls.addEventListener('start',this.manual);
    this.scene.add(new T.HemisphereLight(0x8aa9d9,0x1c2831,.36));
    const moon=new T.DirectionalLight(0x91b8d4,.65);moon.position.set(-5,10,5);this.scene.add(moon);
    const rim=new T.DirectionalLight(0x8dc9d1,.6);rim.position.set(4,4,-2);this.scene.add(rim);
    // Soft frontal keys target the performers, away from the window behind them.
    const portraitKey=new T.SpotLight(0xffeadc,88,10,.34,.9,2);portraitKey.position.set(-3.6,3.7,6.7);portraitKey.target.position.set(-1.6,1.3,2.5);this.scene.add(portraitKey,portraitKey.target);
    const portraitFill=new T.SpotLight(0xc3d8ed,28,9,.42,1,2);portraitFill.position.set(2,2.8,5.4);portraitFill.target.position.set(-1.4,1.25,2.5);this.scene.add(portraitFill,portraitFill.target);
    this.portrait={key:portraitKey,fill:portraitFill};
    const alleyFill=new T.PointLight(0x7ba3d2,25,14,2);alleyFill.position.set(7,5.3,-3.4);this.scene.add(alleyFill);
    // Mixed fluorescent/halogen light, with a long source reflected in wet surfaces.
    const glow=r=>{const c=document.createElement('canvas');c.width=16;c.height=128;const ctx=c.getContext('2d'),g=ctx.createLinearGradient(0,0,0,128);g.addColorStop(0,'rgba(142,182,255,0)');g.addColorStop(.45,'rgba(174,207,255,.1)');g.addColorStop(.5,'rgba(222,239,255,.22)');g.addColorStop(.55,'rgba(174,207,255,.1)');g.addColorStop(1,'rgba(142,182,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,16,128);const tex=r.own(new T.CanvasTexture(c));return r.own(new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));};
    this.shopFixtures=[this.r.mesh(this.r.geometry('PlaneGeometry',1,1),glow(this.r),this.scene,[0,3.51,2.2],[9.05,1.4,1]),
    this.r.mesh(this.r.geometry('BoxGeometry',1,1,1),this.r.material('#e6f1ff',{emissive:0xb6d5ff,emissiveIntensity:2.5}),this.scene,[0,3.45,2.16],[8.95,.045,.06])];
    this.scene.environment=makeNightEnvironment(this.renderer,this.r);this.scene.environmentIntensity=.48;
    this.store=buildStore(this.scene,this.r);this.batchStats=optimizeStaticSet(this.store.root,this.r);
    this.garden=buildPearGarden(this.scene,this.r);this.siege=buildSiegeEffects(this.scene,this.r);
    this.weather=buildWeather(this.scene,this.r);this.wet=applyWetPavement([...(this.store.wetMaterials||[]),...(this.garden.wetMaterials||[])],this.weather.reflection,this.r);
    this.director=new MissionDirector(this);this.refreshGlassProbe();
    const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:true});target.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);
    const gl=this.renderer.getContext(),samples=gl.getInternalformatParameter(gl.RENDERBUFFER,gl.RGBA16F,gl.SAMPLES)||[];
    target.samples=Math.min(4,Math.max(0,...samples));target.resolveDepthBuffer=true;this.msaaSamples=target.samples;this.supportedSamples=target.samples;
    this.opaqueTarget=target;this.composer=new EffectComposer(this.renderer,new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:false}));this.composer.addPass(new OpaquePass(this.scene,this.camera,target));
    this.glassPass=new ThinGlassPass(this.scene,this.camera,this.store.glass,target);this.composer.addPass(this.glassPass);
    this.bloom=new UnrealBloomPass(new T.Vector2(1,1),.29,.62,1.05);this.composer.addPass(this.bloom);this.output=new OutputPass();this.composer.addPass(this.output);this.fxaa=new ShaderPass(FXAAShader);this.composer.addPass(this.fxaa);
    this.resize=()=>{if(this.disposed)return;const width=container.clientWidth,height=Math.max(1,container.clientHeight);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.weather?.invalidateReflection();this.renderer.setSize(width,height,false);this.composer.setSize(width,height);this.fxaa.uniforms.resolution.value.set(1/(width*this.renderer.getPixelRatio()),1/(height*this.renderer.getPixelRatio()));this.bloom.resolution.set(width*.5,height*.5);this.bloom.setSize(width*.5,height*.5);const mobile=width/height<.85;if(this.mobile!==mobile&&this.currentView)this.setView(this.currentView,true);this.mobile=mobile;};
    this.observer=new ResizeObserver(this.resize);this.observer.observe(container);this.resize();this.setView('street',true);
    this.visibility=()=>{this.previous=undefined;this.onClockState?.(!document.hidden&&this.running);};document.addEventListener('visibilitychange',this.visibility);
  }
  refreshGlassProbe(){
    const target=this.glassProbe||(this.glassProbe=this.r.own(new T.WebGLCubeRenderTarget(128,{type:T.HalfFloatType})));
    const camera=new T.CubeCamera(.1,45,target);camera.position.set(0,1.9,2.02);
    const panes=this.store.glassMeshes.map(mesh=>mesh.visible);for(const mesh of this.store.glassMeshes)mesh.visible=false;
    const visible=this.weather.reflection.visible;this.weather.reflection.visible=false;
    camera.update(this.renderer,this.scene);
    this.store.glassMeshes.forEach((mesh,i)=>mesh.visible=panes[i]);this.weather.reflection.visible=visible;
    this.store.glass.uniforms.uEnvironment.value=target.texture;
  }
  inspectLayout(){
    this.stop();this.renderer.clippingPlanes=[new T.Plane(new T.Vector3(0,-1,0),1.56)];this.glassPass.drawGlass=false;
    if(this.actors)this.actors.root.visible=false;this.setView('plan',true);this.composer.render();
  }
  setView(name,instant=false){
    this.weather?.invalidateReflection();
    this.walkCamera.onZone(false);
    this.currentView=name==='reset'?'street':name;
    const preset=config.views[name==='reset'?'street':name];if(!preset)return;
    this.camera.fov=37;this.camera.updateProjectionMatrix();
    const mobile=this.container.clientWidth/Math.max(1,this.container.clientHeight)<.85;
    const target=new T.Vector3().fromArray(mobile?preset.mobileTarget:preset.target),position=new T.Vector3().fromArray(mobile?preset.mobilePosition:preset.position);
    if(name==='detail'&&this.actors){const offset=this.actors.position.clone().sub(new T.Vector3(-1.25,.32,2.48));target.add(offset);position.add(offset);}
    // Flush damping once, so user momentum does not fight a selected preset.
    const damping=this.controls.enableDamping;this.controls.enableDamping=false;this.controls.update();this.controls.enableDamping=damping;
    if(instant||matchMedia('(prefers-reduced-motion: reduce)').matches){this.camera.position.copy(position);this.controls.target.copy(target);this.transition=null;}
    else this.transition={start:this.time,position:this.camera.position.clone(),target:this.controls.target.clone(),endPosition:position,endTarget:target};
    this.controls.update();const close=this.camera.position.distanceTo(this.controls.target)<(this.camera.aspect<.85?14:11);if(close!==this.closeFraming){this.closeFraming=close;this.onFraming(close);}
  }
  setQuality(value){if(!config.dpr[value])return;this.quality=value;this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,config.dpr[value]));this.composer.setPixelRatio(this.renderer.getPixelRatio());this.msaaSamples=Math.min(this.supportedSamples,value==='low'?2:4);for(const target of [this.opaqueTarget])if(target.samples!==this.msaaSamples){target.samples=this.msaaSamples;target.dispose();}this.bloom.enabled=value!=='low';this.weather.quality(value);this.garden.quality(value);this.siege.quality(value);this.store.glass.uniforms.uRefraction.value=value==='low'?.0012:value==='high'?.005:.003;const size=value==='low'?512:1024;this.store.spill.shadow.mapSize.set(size,size);this.store.spill.shadow.map?.dispose();this.store.spill.shadow.map=null;this.store.spill.shadow.needsUpdate=true;this.resize();}
  setWalking(value){const was=this.walkCamera.enabled;this.walkCamera.setEnabled(value,this.actors?.position);if(was&&!value)this.manualUntil=this.time+14;if(value){this.manualUntil=this.time;this.transition=null;this.currentView=null;this.onManualView();this.weather.invalidateReflection();}}
  projectPoint(point){const p=new T.Vector3().fromArray(point).project(this.camera);return p.toArray();}
  tick(t,delta=.016,render=true){
    this.time=t;this.onTick(t,delta);this.director.beforeActors(this.missionState);this.actors?.update(t,delta);this.director.afterActors(t,delta);
    if(this.actors){
      const p=this.actors.position;this.walkCamera.update(p,delta,this.time<this.manualUntil);
      if(this.walkCamera.automatic&&this.currentView){this.currentView=null;this.onManualView();}
      const h=this.actors.heroPosition||p.toArray();
      const cast=this.actors.status.cinematic,yaw=cast?.phase?cast.heading:0,c=Math.cos(yaw),s=Math.sin(yaw);
      this.portrait.key.position.set(h[0]-2.35*c+4.22*s,h[1]+3.38,h[2]+2.35*s+4.22*c);this.portrait.key.target.position.set(h[0]-.35,h[1]+.98,h[2]);
      this.portrait.fill.position.set(h[0]+3.25*c+2.92*s,h[1]+2.48,h[2]-3.25*s+2.92*c);this.portrait.fill.target.position.set(h[0]-.15,h[1]+.93,h[2]);
    }
    this.store.update(t,delta,this.actors?.position,this.actors?.status.companion?.position);
    this.controls.update();const close=this.camera.position.distanceTo(this.controls.target)<(this.camera.aspect<.85?14:11);
    if(close!==this.closeFraming){this.closeFraming=close;this.onFraming(close);}
    const damage=this.store.destruction.state.progress;this.weather.setShelter(damage<80,damage<44);
    this.store.glass.uniforms.uTime.value=t;this.wet.update(t);this.weather.update(t);
    if(render){this.renderer.info.reset();this.composer.render();this.renderCount++;}
  }
  start(){this.stop();this.running=true;this.onClockState?.(!document.hidden);this.renderer.setAnimationLoop(now=>{
    if(document.hidden){this.previous=undefined;return;}
    const delta=this.previous===undefined?0:Math.max(0,(now-this.previous)/1000);this.previous=now;
    this.time+=delta;
    if(this.transition){const p=this.transition,w=T.MathUtils.smootherstep(this.time-p.start,0,1.5);this.camera.position.lerpVectors(p.position,p.endPosition,w);this.controls.target.lerpVectors(p.target,p.endTarget,w);if(w===1)this.transition=null;}
    this.tick(this.time,Math.min(delta,.08));
  });}
  stop(){this.renderer.setAnimationLoop(null);this.previous=undefined;this.running=false;this.onClockState?.(false);}
  dispose(){if(this.disposed)return;this.disposed=true;this.stop();this.observer.disconnect();document.removeEventListener('visibilitychange',this.visibility);this.controls.removeEventListener('start',this.manual);this.controls.dispose();this.renderer.domElement.removeEventListener('webglcontextlost',this.contextLost);this.renderer.domElement.removeEventListener('webglcontextrestored',this.contextRestored);this.actors?.dispose();this.siege.dispose();this.garden.root.removeFromParent();this.store.spill.shadow.dispose();this.weather.dispose();for(const pass of this.composer.passes)pass.dispose?.();this.composer.dispose();this.r.dispose();this.renderer.dispose();this.renderer.domElement.remove();}
}
