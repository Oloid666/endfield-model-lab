import * as T from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { config } from './config.js';

export function buildWeather(scene,r) {
  const root=new T.Group();scene.add(root);
  let seed=711;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const max=2200,origins=new Float32Array(max*8),tips=new Float32Array(max*2);
  for(let i=0;i<max;i++){
    const x=(random()-.5)*24,y=random()*12,z=(random()-.5)*22,speed=.8+random()*.6;
    origins.set([x,y,z,speed,x,y,z,speed],i*8);tips[i*2+1]=1;
  }
  const geo=r.own(new T.BufferGeometry());geo.setAttribute('position',new T.BufferAttribute(new Float32Array(max*6),3));geo.setAttribute('aOrigin',new T.BufferAttribute(origins,4));geo.setAttribute('aTip',new T.BufferAttribute(tips,1));geo.setDrawRange(0,config.rainCount.balanced*2);
  const material=r.own(new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0}},
    vertexShader:`attribute vec4 aOrigin;attribute float aTip;uniform float uTime;varying vec3 vRainWorld;
      void main(){float y=12.0-mod(uTime*6.8*aOrigin.w+aOrigin.y,12.0);vec3 p=vec3(aOrigin.x,y,aOrigin.z);
      bool sheltered=abs(p.x)<4.85&&p.z>-3.25&&p.z<2.9&&y<2.9;if(sheltered)p.y=-4.0;
      p+=vec3(-.025,.14,-.015)*aTip;vec4 world=modelMatrix*vec4(p,1.0);vRainWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,
    fragmentShader:'varying vec3 vRainWorld;void main(){float shop=exp(-abs(vRainWorld.z-2.0)*.7)*exp(-max(abs(vRainWorld.x)-4.5,0.0)*.6);float lamp=exp(-length(vRainWorld-vec3(-5.6,4.4,3.4))*.55);float light=max(shop,lamp);vec3 color=mix(vec3(.24,.39,.58),vec3(.85,.77,.59),light);gl_FragColor=vec4(color,.055+light*.22);}'
  }));
  const rain=new T.LineSegments(geo,material);rain.frustumCulled=false;root.add(rain);
  const splashMat=r.own(new T.MeshBasicMaterial({color:0xa2bdbb,transparent:true,opacity:.2,depthWrite:false,side:T.DoubleSide}));
  const splashes=new T.InstancedMesh(r.geometry('RingGeometry',.95,1,18),splashMat,36);splashes.frustumCulled=false;root.add(splashes);
  const drops=Array.from({length:36},()=>({x:(random()-.5)*18,z:5.3+random()*5,offset:random()*2}));
  const dropMaterial=r.own(new T.MeshBasicMaterial({color:0xbcd7df,transparent:true,opacity:.36,depthWrite:false}));
  const drips=new T.InstancedMesh(r.geometry('SphereGeometry',1,8,6),dropMaterial,10);root.add(drips);
  const cueDrop=r.mesh(r.geometry('SphereGeometry',1,8,6),dropMaterial,root,[-2.03,2.6,2.94],[.006,.024,.006]);
  const streamMaterial=r.own(new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:material.uniforms.uTime},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform float uTime;varying vec2 vUv;void main(){float flow=.5+.5*sin((vUv.y+uTime*.8)*95.0);float glint=pow(max(0.0,sin(vUv.x*3.14159)),3.0);gl_FragColor=vec4(vec3(.62,.77,.82),(.065+flow*.13)*glint);}'}));
  for(const x of [-4.5,4.5])r.mesh(r.geometry('CylinderGeometry',.008,.006,2.3,6),streamMaterial,root,[x,1.47,2.94]);
  const dummy=new T.Object3D();dummy.rotation.x=-Math.PI/2;
  const reflection=new Reflector(r.geometry('PlaneGeometry',23,28),{textureWidth:384,textureHeight:384,color:0x879b99,clipBias:.003,multisample:0});
  reflection.rotation.x=-Math.PI/2;reflection.position.set(0,-.012,1);
  reflection.material.uniforms.uTime={value:0};
  reflection.material.uniforms.uTexel={value:new T.Vector2(1/384,1/384)};
  reflection.material.vertexShader=reflection.material.vertexShader
    .replace('varying vec4 vUv;','varying vec4 vUv;\nvarying vec3 vWorldPosition;')
    .replace('vUv = textureMatrix * vec4( position, 1.0 );','vUv = textureMatrix * vec4( position, 1.0 );\nvWorldPosition=(modelMatrix*vec4(position,1.0)).xyz;');
  reflection.material.fragmentShader=reflection.material.fragmentShader
    .replace('uniform vec3 color;',`uniform vec3 color;
      uniform float uTime;
      uniform vec2 uTexel;
      varying vec3 vWorldPosition;
      float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise21(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);}`)
    .replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec2 world=vWorldPosition.xz;
      float puddle=smoothstep(.38,.7,noise21(world*.64)+noise21(world*1.7)*.2);
      float aggregate=noise21(world*90.0);
      float ripple=sin(world.x*36.0+world.y*12.0+uTime*1.8)*sin(world.y*24.0-uTime*1.1);
      vec2 distortion=vec2(noise21(world*8.0+vec2(uTime*.035,0.0))-.5,ripple*.2)*.0018;
      vec2 uv=vUv.xy/vUv.w+distortion;
      vec2 blur=uTexel*mix(3.7,.65,puddle);
      vec3 reflected=texture2D(tDiffuse,uv).rgb*.4;
      reflected+=(texture2D(tDiffuse,uv+vec2(blur.x,0)).rgb+texture2D(tDiffuse,uv-vec2(blur.x,0)).rgb+texture2D(tDiffuse,uv+vec2(0,blur.y)).rgb+texture2D(tDiffuse,uv-vec2(0,blur.y)).rgb)*.15;
      vec4 base=vec4(reflected,1.0);`)
    .replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );',`float noV=max(dot(normalize(cameraPosition-vWorldPosition),vec3(0,1,0)),0.0);
      float fresnel=.05+.65*pow(1.0-noV,3.0);
      vec3 asphalt=vec3(.006,.011,.019)*(.65+aggregate*.6);
      float reflectionWeight=mix(.18,.62,puddle)+fresnel*.28;
      gl_FragColor=vec4(asphalt+base.rgb*reflectionWeight,1.0);`);
  scene.add(reflection);
  const nativeReflect=reflection.onBeforeRender;let lastFrame=-1,frame=0,stride=2,forceReflection=true,lastCapture=-Infinity,now=0,interval=1/12,captures=0;
  reflection.onBeforeRender=function(...args){if(frame===lastFrame||(!forceReflection&&(frame-lastFrame<stride||now-lastCapture<interval)))return;lastFrame=frame;lastCapture=now;captures++;forceReflection=false;const wasVisible=root.visible;root.visible=false;try{nativeReflect.apply(this,args);}finally{root.visible=wasVisible;}};
  r.own(reflection);
  return {root,reflection,get metrics(){return {rainOnGPU:true,rainCount:geo.drawRange.count/2,reflectionCaptures:captures,reflectionInterval:interval,reflectionFrameGap:stride};},invalidateReflection(){forceReflection=true;lastFrame=-1;},update(t){frame++;now=t;material.uniforms.uTime.value=t;reflection.material.uniforms.uTime.value=t;if(!root.visible)return;const fall=((t%58)-36.95)/.45;cueDrop.visible=fall>=0&&fall<=1;if(cueDrop.visible)cueDrop.position.y=2.62-fall*fall*2.25;
    for(let i=0;i<drops.length;i++){const d=drops[i],p=(t*1.3+d.offset)%1;dummy.position.set(d.x,.002,d.z);dummy.scale.setScalar(p*.24+.005);dummy.updateMatrix();splashes.setMatrixAt(i,dummy.matrix);}splashes.instanceMatrix.needsUpdate=true;
    dummy.rotation.set(0,0,0);
    for(let i=0;i<10;i++){const p=(t*.95+i*.137)%1;dummy.position.set(-4.4+i*.98,2.62-p*p*2.38,2.94);dummy.scale.set(.009,.015+p*.028,.009);dummy.updateMatrix();drips.setMatrixAt(i,dummy.matrix);}drips.instanceMatrix.needsUpdate=true;
    dummy.rotation.x=-Math.PI/2;
  },quality(value){geo.setDrawRange(0,config.rainCount[value]*2);const size=config.reflection[value];reflection.getRenderTarget().setSize(size,size);reflection.material.uniforms.uTexel.value.set(1/size,1/size);stride=value==='low'?3:2;interval=value==='high'?1/20:value==='low'?1/8:1/12;forceReflection=true;lastFrame=-1;},dispose(){root.removeFromParent();reflection.removeFromParent();}};
}
