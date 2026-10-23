import * as T from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { config } from './config.js';

export function buildWeather(scene,r) {
  const root=new T.Group();scene.add(root);
  let seed=711;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const max=2200,positions=new Float32Array(max*6),origins=new Float32Array(max*4);
  for(let i=0;i<max;i++){origins[i*4]=(random()-.5)*24;origins[i*4+1]=random()*12;origins[i*4+2]=(random()-.5)*22;origins[i*4+3]=.8+random()*.6;}
  const geo=r.own(new T.BufferGeometry());geo.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geo.setDrawRange(0,config.rainCount.balanced*2);
  const material=r.own(new T.ShaderMaterial({transparent:true,depthWrite:false,
    vertexShader:'varying vec3 vRainWorld;void main(){vec4 p=modelMatrix*vec4(position,1.0);vRainWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',
    fragmentShader:'varying vec3 vRainWorld;void main(){float shop=exp(-abs(vRainWorld.z-2.0)*.7)*exp(-max(abs(vRainWorld.x)-4.5,0.0)*.6);float lamp=exp(-length(vRainWorld-vec3(-5.6,4.4,3.4))*.55);float light=max(shop,lamp);vec3 color=mix(vec3(.24,.39,.58),vec3(.85,.77,.59),light);gl_FragColor=vec4(color,.055+light*.22);}'
  }));
  const rain=new T.LineSegments(geo,material);rain.frustumCulled=false;root.add(rain);
  const splashMat=r.own(new T.MeshBasicMaterial({color:0xa2bdbb,transparent:true,opacity:.2,depthWrite:false,side:T.DoubleSide}));
  const splashes=new T.InstancedMesh(r.geometry('RingGeometry',.95,1,18),splashMat,36);splashes.frustumCulled=false;root.add(splashes);
  const drops=Array.from({length:36},()=>({x:(random()-.5)*18,z:5.3+random()*5,offset:random()*2}));
  const drips=new T.InstancedMesh(r.geometry('SphereGeometry',1,6,4),r.material('#8eafb3',{roughness:.22,metalness:.2}),10);root.add(drips);
  const cueDrop=r.mesh(r.geometry('SphereGeometry',1,8,6),r.material('#c5d1cf',{roughness:.12,metalness:.3}),root,[-2.03,2.6,2.94],[.012,.035,.012]);
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
  const nativeReflect=reflection.onBeforeRender;let lastFrame=-1,frame=0,stride=2;
  reflection.onBeforeRender=function(...args){if(frame===lastFrame||frame%stride!==0)return;lastFrame=frame;const wasVisible=root.visible;root.visible=false;nativeReflect.apply(this,args);root.visible=wasVisible;};
  r.own(reflection);
  return {root,reflection,update(t){frame++;reflection.material.uniforms.uTime.value=t;if(!root.visible)return;const fall=((t%58)-36.95)/.45;cueDrop.visible=fall>=0&&fall<=1;if(cueDrop.visible)cueDrop.position.y=2.62-fall*fall*2.25;
    for(let i=0;i<max;i++){
      const x=origins[i*4],y=12-((t*6.8*origins[i*4+3]+origins[i*4+1])%12),z=origins[i*4+2],j=i*6;
      // The canopy and enclosed building remain dry.
      const sheltered=Math.abs(x)<4.85&&z>-3.25&&z<2.9&&y<2.9;
      positions[j]=x;positions[j+1]=sheltered?-4:y;positions[j+2]=z;positions[j+3]=x-.025;positions[j+4]=(sheltered?-4:y)+.14;positions[j+5]=z-.015;
    }
    geo.attributes.position.needsUpdate=true;
    for(let i=0;i<drops.length;i++){const d=drops[i],p=(t*1.3+d.offset)%1;dummy.position.set(d.x,.002,d.z);dummy.scale.setScalar(p*.24+.005);dummy.updateMatrix();splashes.setMatrixAt(i,dummy.matrix);}splashes.instanceMatrix.needsUpdate=true;
    dummy.rotation.set(0,0,0);
    for(let i=0;i<10;i++){const p=(t*.95+i*.137)%1;dummy.position.set(-4.4+i*.98,2.62-p*p*2.38,2.94);dummy.scale.set(.009,.015+p*.028,.009);dummy.updateMatrix();drips.setMatrixAt(i,dummy.matrix);}drips.instanceMatrix.needsUpdate=true;
    dummy.rotation.x=-Math.PI/2;
  },quality(value){geo.setDrawRange(0,config.rainCount[value]*2);const size=config.reflection[value];reflection.getRenderTarget().setSize(size,size);reflection.material.uniforms.uTexel.value.set(1/size,1/size);stride=value==='high'?1:value==='low'?3:2;},dispose(){root.removeFromParent();reflection.removeFromParent();}};
}
