import * as T from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

export function makeThinGlass(r,dropMap){
  return r.own(new T.ShaderMaterial({
    name:'RainyThinGlass',depthWrite:false,depthTest:false,
    uniforms:{uScene:{value:null},uDepth:{value:null},uEnvironment:{value:null},uDropMap:{value:dropMap},uResolution:{value:new T.Vector2(1,1)},uRefraction:{value:.00065}},
    vertexShader:`varying vec3 vWorld;varying vec3 vNormalWorld;varying vec3 vTangent;varying vec3 vBitangent;varying vec2 vPane;
      void main(){vPane=uv;vec4 world=modelMatrix*vec4(position,1.0);vWorld=world.xyz;vNormalWorld=normalize(mat3(modelMatrix)*normal);vTangent=normalize(mat3(modelMatrix)*vec3(1,0,0));vBitangent=normalize(mat3(modelMatrix)*vec3(0,1,0));gl_Position=projectionMatrix*viewMatrix*world;}`,
    fragmentShader:`uniform sampler2D uScene;uniform sampler2D uDepth;uniform sampler2D uDropMap;uniform samplerCube uEnvironment;uniform vec2 uResolution;uniform float uRefraction;
      varying vec3 vWorld;varying vec3 vNormalWorld;varying vec3 vTangent;varying vec3 vBitangent;varying vec2 vPane;
      void main(){
        vec2 screen=gl_FragCoord.xy/uResolution;
        if(gl_FragCoord.z>texture2D(uDepth,screen).x+.000015)discard;
        vec2 texel=vec2(1.0/256.0,0.0);float h=texture2D(uDropMap,vPane).r;
        vec2 drops=vec2(texture2D(uDropMap,vPane+texel.xy).r-h,texture2D(uDropMap,vPane+texel.yx).r-h);
        vec3 n=normalize(vNormalWorld+vTangent*drops.x*.35+vBitangent*drops.y*.35);vec3 view=normalize(cameraPosition-vWorld);
        float fresnel=.035+.88*pow(1.0-max(dot(n,view),0.0),4.0);
        vec3 through=texture2D(uScene,clamp(screen+drops*uRefraction,vec2(.001),vec2(.999))).rgb;
        vec3 reflection=textureCube(uEnvironment,reflect(-view,n)).rgb;
        float edge=min(min(vPane.x,1.0-vPane.x),min(vPane.y,1.0-vPane.y));
        vec3 glass=through*vec3(.96,.985,.98);
        glass=mix(glass,reflection,fresnel);
        glass*=mix(.87,1.0,smoothstep(0.0,.018,edge));
        gl_FragColor=vec4(glass,1.0);
      }`
  }));
}

// Opaque scene and depth are produced once. All panes reuse them.
export class ThinGlassPass extends Pass {
  constructor(scene,camera,material){
    super();this.scene=scene;this.camera=camera;this.material=material;this.needsSwap=true;
    this.copy=new T.ShaderMaterial({uniforms:{tDiffuse:{value:null}},depthTest:false,depthWrite:false,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',fragmentShader:'uniform sampler2D tDiffuse;varying vec2 vUv;void main(){gl_FragColor=texture2D(tDiffuse,vUv);}'});
    this.quad=new FullScreenQuad(this.copy);
  }
  render(renderer,writeBuffer,readBuffer){
    this.copy.uniforms.tDiffuse.value=readBuffer.texture;
    renderer.setRenderTarget(writeBuffer);this.quad.render(renderer);
    this.material.uniforms.uScene.value=readBuffer.texture;this.material.uniforms.uDepth.value=readBuffer.depthTexture;
    this.material.uniforms.uResolution.value.set(readBuffer.width,readBuffer.height);
    const background=this.scene.background,mask=this.camera.layers.mask,autoClear=renderer.autoClear;
    this.scene.background=null;this.camera.layers.set(1);renderer.autoClear=false;
    renderer.render(this.scene,this.camera);
    this.scene.background=background;this.camera.layers.mask=mask;renderer.autoClear=autoClear;
  }
  dispose(){this.copy.dispose();this.quad.dispose();}
}
