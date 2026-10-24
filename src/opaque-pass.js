import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';

// Only opaque geometry needs MSAA. All following fullscreen passes are single-sample.
export class OpaquePass extends RenderPass{
  constructor(scene,camera,target){super(scene,camera);this.target=target;this.needsSwap=false;}
  render(renderer){super.render(renderer,null,this.target);}
  setSize(width,height){this.target.setSize(width,height);}
  dispose(){this.target.dispose();}
}
