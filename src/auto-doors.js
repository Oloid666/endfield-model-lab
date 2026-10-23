import * as T from 'three';

// Real two-leaf automatic entrance. All motion follows the scene clock.
export function buildAutomaticDoors(parent,r,glass,glassMeshes){
  const root=new T.Group();root.position.set(-.22,0,1.895);parent.add(root);
  const leaves=[];
  for(const side of [-1,1]){
    const leaf=new T.Group();leaf.position.x=side*.4;root.add(leaf);leaves.push({leaf,side});
    const pane=r.mesh(r.geometry('PlaneGeometry',1,1),glass,leaf,[0,1.47,0],[.77,2.29,1]);glassMeshes.push(pane);
    for(const x of [-.385,.385])r.box(leaf,'#5b6864',[x,1.47,.018],[.027,2.32,.055],{metalness:.7,roughness:.22});
    for(const y of [.315,2.625])r.box(leaf,'#5b6864',[0,y,.018],[.8,.035,.055],{metalness:.7,roughness:.22});
    r.box(leaf,'#57896d',[0,1.12,.04],[.75,.055,.012],{roughness:.4});
    r.box(leaf,'#ece9d6',[0,1.12,.047],[.1,.055,.005]);
    const marker=r.mesh(r.geometry('PlaneGeometry',1,1),r.label(side<0?'自動':'AUTO',{width:256,height:128,bg:'#356e59',color:'#f0f1d7',font:'bold 44px sans-serif'}),leaf,[side*.17,1.78,.032],[.24,.12,1]);
    leaf.traverse(mesh=>{if(mesh.isMesh){mesh.userData.dynamic=true;mesh.userData.hotspot='door';}});
  }
  r.box(root,'#a8afa2',[0,2.69,.03],[1.89,.15,.17],{metalness:.62,roughness:.3});
  r.box(root,'#1e3538',[0,2.68,.125],[.19,.05,.027],{roughness:.22});
  r.box(root,'#a9d8c1',[0,2.68,.142],[.028,.023,.006],{emissive:0x75d7a7,emissiveIntensity:.7});
  r.box(root,'#596961',[0,.315,0],[1.85,.018,.105],{metalness:.65,roughness:.24});
  let amount=0,heldUntil=0,lastTime=0,target=0;
  return {
    root,
    get open(){return amount;},
    get isOpen(){return amount>.82;},
    triggerDoor(){heldUntil=Math.max(heldUntil,lastTime+4);},
    update(t,delta=0,actorPosition){
      lastTime=t;
      const near=actorPosition&&Math.abs(actorPosition.x+.22)<.94&&Math.abs(actorPosition.z-1.86)<1.48;
      if(near)heldUntil=t+2.2;
      target=t<heldUntil?1:0;
      const dt=Math.max(0,Math.min(.1,delta||1/60));amount=T.MathUtils.damp(amount,target,target?4.8:2.8,dt);
      if(Math.abs(amount-target)<.0004)amount=target;
      for(const {leaf,side} of leaves)leaf.position.x=side*(.4+amount*.79);
    },
  };
}
