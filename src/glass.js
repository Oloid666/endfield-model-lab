import * as T from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

export function makeThinGlass(r,dropMap){
  return r.own(new T.ShaderMaterial({
    name:'RainyThinGlass',depthWrite:false,depthTest:false,
    uniforms:{uScene:{value:null},uDepth:{value:null},uEnvironment:{value:null},uDropMap:{value:dropMap},uResolution:{value:new T.Vector2(1,1)},uRefraction:{value:.003},uTime:{value:0},uRain:{value:1}},
    vertexShader:`varying vec3 vWorld;varying vec3 vNormalWorld;varying vec3 vTangent;varying vec3 vBitangent;varying vec2 vPane;varying vec2 vMeter;
      void main(){vPane=uv;vMeter=uv*vec2(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz));vec4 world=modelMatrix*vec4(position,1.0);vWorld=world.xyz;vNormalWorld=normalize(mat3(modelMatrix)*normal);vTangent=normalize(mat3(modelMatrix)*vec3(1,0,0));vBitangent=normalize(mat3(modelMatrix)*vec3(0,1,0));gl_Position=projectionMatrix*viewMatrix*world;}`,
    fragmentShader:`uniform sampler2D uScene;uniform sampler2D uDepth;uniform sampler2D uDropMap;uniform samplerCube uEnvironment;uniform vec2 uResolution;uniform float uRefraction;uniform float uTime;uniform float uRain;
      varying vec3 vWorld;varying vec3 vNormalWorld;varying vec3 vTangent;varying vec3 vBitangent;varying vec2 vPane;varying vec2 vMeter;
      float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      vec3 bead(vec2 p,float density){
        vec2 cell=floor(p*density),q=fract(p*density)-.5;
        float seed=hash21(cell);q-=vec2(seed-.5,hash21(cell+7.3)-.5)*.48;
        q.y*=.76;float radius=mix(.09,.23,seed);
        float mask=1.0-smoothstep(radius*.65,radius,length(q));
        mask*=step(.24,seed);return vec3(-q*mask*3.0,mask);
      }
      vec3 water(vec2 p){
        vec3 still=bead(p,18.0)+bead(p+vec2(3.21,.7),29.0)*.55;
        float lane=floor(p.x*5.8),seed=hash21(vec2(lane,4.7));
        float x=(lane+.24+seed*.5)/5.8;
        float motion=uTime*(.18+seed*.16)+sin(uTime*.71+seed*8.0)*.1;
        float y=fract((p.y+motion)/1.8+seed)*1.8-.3;
        float dx=p.x-x;vec2 q=vec2(dx*58.0,y*48.0);
        float head=1.0-smoothstep(.55,1.0,length(q));
        float trail=exp(-abs(dx)*850.0)*smoothstep(0.0,.03,y)*(1.0-smoothstep(.05,.43,y));
        return still+vec3(-q*head*.85+vec2(-sign(dx)*trail*.45,trail*.04),head+trail*.35)*uRain;
      }
      void main(){
        vec2 screen=gl_FragCoord.xy/uResolution;
        if(gl_FragCoord.z>texture2D(uDepth,screen).x+.000015)discard;
        // Rear refrigerator doors stay mostly dry. Exterior panes receive rain.
        float outside=smoothstep(-1.7,1.2,vWorld.z)+step(4.1,abs(vWorld.x));
        vec3 wet=water(vMeter);wet*=mix(.13,1.0,clamp(outside,0.0,1.0));vec2 drops=wet.xy;
        vec3 n=normalize(vNormalWorld+vTangent*drops.x*.65+vBitangent*drops.y*.65);vec3 view=normalize(cameraPosition-vWorld);
        float fresnel=.095+.81*pow(1.0-abs(dot(n,view)),4.0);
        vec3 through=texture2D(uScene,clamp(screen+drops*uRefraction,vec2(.001),vec2(.999))).rgb;
        vec2 blur=vec2(1.3,1.3)/uResolution*(.4+wet.z*1.8);
        through=through*.56+(texture2D(uScene,screen+blur).rgb+texture2D(uScene,screen-blur).rgb)*.22;
        vec3 reflection=textureCube(uEnvironment,reflect(-view,n)).rgb;
        float edge=min(min(vPane.x,1.0-vPane.x),min(vPane.y,1.0-vPane.y));
        vec3 glass=through*vec3(.91,.96,.945);
        glass=mix(glass,reflection,fresnel);
        vec3 halfLight=normalize(view+normalize(vec3(-.2,.75,.9)));
        float glint=pow(max(dot(n,halfLight),0.0),40.0)*wet.z;
        glass+=vec3(.7,.82,.87)*glint*.24;
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
