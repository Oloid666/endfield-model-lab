import * as T from 'three';

// Reuse the one street reflection for raised exterior paving. No second renderer.
export function applyWetPavement(materials,reflection,r){
  const time={value:0},strength={value:1};
  reflection.updateMatrixWorld(true);
  const uniform={uWetTime:time,uWetStrength:strength,uWetReflection:{value:reflection.getRenderTarget().texture},uWetMatrix:{value:reflection.material.uniforms.textureMatrix.value},uWetInverseMatrix:{value:reflection.matrixWorld.clone().invert()}};
  // A render target cannot be sampled while it is being written. Disable the
  // reflected lobe during the mirror capture, while retaining the shaded paving.
  const fallback=r.own(new T.DataTexture(new Uint8Array([0,0,0,255]),1,1));fallback.needsUpdate=true;
  const capture=reflection.onBeforeRender;
  reflection.onBeforeRender=function(...args){
    uniform.uWetReflection.value=fallback;
    try{return capture.apply(this,args);}finally{uniform.uWetReflection.value=reflection.getRenderTarget().texture;}
  };
  for(const material of new Set(materials)){
    material.onBeforeCompile=shader=>{
      Object.assign(shader.uniforms,uniform);
      shader.vertexShader='varying vec3 vWetWorld;varying vec3 vWetNormal;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWetWorld=(modelMatrix*vec4(transformed,1.0)).xyz;vWetNormal=normalize(mat3(modelMatrix)*objectNormal);');
      shader.fragmentShader=`uniform float uWetTime;uniform float uWetStrength;uniform sampler2D uWetReflection;uniform mat4 uWetMatrix;uniform mat4 uWetInverseMatrix;varying vec3 vWetWorld;varying vec3 vWetNormal;
        float wetHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float wetNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(wetHash(i),wetHash(i+vec2(1,0)),f.x),mix(wetHash(i+vec2(0,1)),wetHash(i+vec2(1,1)),f.x),f.y);}
        `+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
        float wetTop=step(.8,vWetNormal.y);float exposed=smoothstep(2.3,3.4,vWetWorld.z);
        float wetPool=smoothstep(.33,.73,wetNoise(vWetWorld.xz*.92)+wetNoise(vWetWorld.xz*3.1)*.2);
        float wetAmount=wetTop*(.27+exposed*.73)*uWetStrength;
        roughnessFactor=mix(roughnessFactor,mix(.28,.085,wetPool),wetAmount);
        diffuseColor.rgb*=1.0-wetAmount*.32;`);
      shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
        vec4 wetProjected=uWetMatrix*uWetInverseMatrix*vec4(vWetWorld,1.0);
        vec2 wetUV=wetProjected.xy/wetProjected.w;
        vec2 wetRipple=vec2(sin(vWetWorld.z*27.0+uWetTime*1.6),cos(vWetWorld.x*23.0-uWetTime*1.3))*.0008;
        vec3 wetRef=texture2D(uWetReflection,wetUV+wetRipple).rgb*.5;
        wetRef+=(texture2D(uWetReflection,wetUV+vec2(.004,0)).rgb+texture2D(uWetReflection,wetUV-vec2(.004,0)).rgb)*.25;
        float wetFresnel=pow(1.0-abs(dot(normalize(cameraPosition-vWetWorld),vec3(0,1,0))),3.0);
        float wetWeight=wetAmount*(.1+wetPool*.22+wetFresnel*.25);
        outgoingLight=outgoingLight*(1.0-wetWeight*.35)+wetRef*wetWeight;
        #include <opaque_fragment>`);
    };
    material.customProgramCacheKey=()=> 'wet-raised-pavement-v4';material.needsUpdate=true;
  }
  return {update(t){time.value=t;},setRain(value){strength.value=value?1:.45;}};
}
