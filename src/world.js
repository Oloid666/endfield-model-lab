import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { config } from './config.js';
import { Resources } from './resources.js';
import { buildStore } from './store.js';
import { buildWeather } from './weather.js';

export class World {
  constructor(container,{onContextLost,onContextRestored,onManual}) {
    this.r=new Resources();this.container=container;this.quality='balanced';this.time=0;this.disposed=false;this.renderCount=0;
    this.scene=new T.Scene();this.scene.background=new T.Color('#132630');this.scene.fog=new T.FogExp2('#132630',.025);
    this.camera=new T.PerspectiveCamera(37,1,.1,100);
    this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.18;this.renderer.info.autoReset=false;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,config.dpr.balanced));container.append(this.renderer.domElement);
    this.contextLost=e=>{e.preventDefault();this.stop();onContextLost();};this.contextRestored=()=>onContextRestored();
    this.renderer.domElement.addEventListener('webglcontextlost',this.contextLost);this.renderer.domElement.addEventListener('webglcontextrestored',this.contextRestored);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);Object.assign(this.controls,{enableDamping:true,dampingFactor:.065,minDistance:5.5,maxDistance:44,maxPolarAngle:Math.PI*.48,minPolarAngle:.2,zoomSpeed:.7,panSpeed:.65,rotateSpeed:.5});
    this.controls.touches.ONE=T.TOUCH.ROTATE;this.controls.touches.TWO=T.TOUCH.DOLLY_PAN;
    this.manual=()=>{this.transition=null;this.currentView=null;onManual();};this.controls.addEventListener('start',this.manual);
    this.scene.add(new T.HemisphereLight(0xa6c6dc,0x364438,1.05));
    const moon=new T.DirectionalLight(0x91b8d4,1.3);moon.position.set(-5,10,5);this.scene.add(moon);
    const face=new T.DirectionalLight(0xffe4b8,1.5);face.position.set(2,5,7);this.scene.add(face);
    const rim=new T.DirectionalLight(0x8dc9d1,1);rim.position.set(4,4,-2);this.scene.add(rim);
    this.store=buildStore(this.scene,this.r);this.weather=buildWeather(this.scene,this.r);
    this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));
    this.bloom=new UnrealBloomPass(new T.Vector2(1,1),.18,.35,1.25);this.composer.addPass(this.bloom);this.output=new OutputPass();this.composer.addPass(this.output);
    this.resize=()=>{if(this.disposed)return;const width=container.clientWidth,height=Math.max(1,container.clientHeight);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.renderer.setSize(width,height,false);this.composer.setSize(width,height);this.bloom.resolution.set(width*.5,height*.5);this.bloom.setSize(width*.5,height*.5);const mobile=width/height<.85;if(this.mobile!==mobile&&this.currentView)this.setView(this.currentView,true);this.mobile=mobile;};
    this.observer=new ResizeObserver(this.resize);this.observer.observe(container);this.resize();this.setView('street',true);
    this.visibility=()=>{this.previous=undefined;};document.addEventListener('visibilitychange',this.visibility);
  }
  setView(name,instant=false){
    this.currentView=name==='reset'?'street':name;
    const preset=config.views[name==='reset'?'street':name];if(!preset)return;
    const mobile=this.container.clientWidth/Math.max(1,this.container.clientHeight)<.85;
    const target=new T.Vector3().fromArray(mobile?preset.mobileTarget:preset.target),position=new T.Vector3().fromArray(mobile?preset.mobilePosition:preset.position);
    // Flush damping once, so user momentum does not fight a selected preset.
    const damping=this.controls.enableDamping;this.controls.enableDamping=false;this.controls.update();this.controls.enableDamping=damping;
    if(instant||matchMedia('(prefers-reduced-motion: reduce)').matches){this.camera.position.copy(position);this.controls.target.copy(target);this.transition=null;}
    else this.transition={start:this.time,position:this.camera.position.clone(),target:this.controls.target.clone(),endPosition:position,endTarget:target};
    this.controls.update();
  }
  setQuality(value){if(!config.dpr[value])return;this.quality=value;this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,config.dpr[value]));this.composer.setPixelRatio(this.renderer.getPixelRatio());this.bloom.enabled=value!=='low';this.weather.quality(value);this.resize();}
  start(){this.stop();this.renderer.setAnimationLoop(now=>{
    if(document.hidden){this.previous=undefined;return;}
    const delta=this.previous===undefined?0:Math.min((now-this.previous)/1000,.08);this.previous=now;
    this.time+=delta;
    if(this.transition){const p=this.transition,w=T.MathUtils.smootherstep(this.time-p.start,0,1.5);this.camera.position.lerpVectors(p.position,p.endPosition,w);this.controls.target.lerpVectors(p.target,p.endTarget,w);if(w===1)this.transition=null;}
    this.controls.update();this.actors?.update(this.time);this.weather.update(this.time);this.renderer.info.reset();this.composer.render();this.renderCount++;
  });}
  stop(){this.renderer.setAnimationLoop(null);this.previous=undefined;}
  dispose(){if(this.disposed)return;this.disposed=true;this.stop();this.observer.disconnect();document.removeEventListener('visibilitychange',this.visibility);this.controls.removeEventListener('start',this.manual);this.controls.dispose();this.renderer.domElement.removeEventListener('webglcontextlost',this.contextLost);this.renderer.domElement.removeEventListener('webglcontextrestored',this.contextRestored);this.actors?.dispose();this.weather.dispose();for(const pass of this.composer.passes)pass.dispose?.();this.composer.dispose();this.r.dispose();this.renderer.dispose();this.renderer.domElement.remove();}
}
