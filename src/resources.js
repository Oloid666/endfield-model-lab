import * as T from 'three';

export class Resources {
  constructor() { this.items = new Set(); this.geometries = new Map(); this.materials = new Map(); }
  own(item) { this.items.add(item); return item; }
  geometry(type, ...args) {
    const key = `${type}:${args.join(',')}`;
    if (!this.geometries.has(key)) this.geometries.set(key, this.own(new T[type](...args)));
    return this.geometries.get(key);
  }
  material(color, opts = {}) {
    const key = JSON.stringify([color, Object.fromEntries(Object.entries(opts).map(([k,v])=>[k,v?.isTexture?v.uuid:v?.isColor?v.getHex():v]))]);
    if (!this.materials.has(key)) this.materials.set(key, this.own(new T.MeshStandardMaterial({ color, roughness:.72, ...opts })));
    return this.materials.get(key);
  }
  mesh(geometry, material, parent, p=[0,0,0], s=[1,1,1]) {
    const mesh = new T.Mesh(geometry, material); mesh.position.fromArray(p); mesh.scale.fromArray(s); parent.add(mesh); return mesh;
  }
  box(parent, color, p, s, opts={}) { return this.mesh(this.geometry('BoxGeometry',1,1,1),this.material(color,opts),parent,p,s); }
  cylinder(parent,color,p,radius,height,opts={}) { return this.mesh(this.geometry('CylinderGeometry',radius,radius,height,12),this.material(color,opts),parent,p); }
  label(text,{width=1024,height=256,bg='#f1eee0',color='#24584d',font='bold 90px sans-serif',spacing=0}={}) {
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const c=canvas.getContext('2d'); c.fillStyle=bg;c.fillRect(0,0,width,height);c.fillStyle=color;c.font=font;c.textAlign='center';c.textBaseline='middle';
    if(spacing){const total=c.measureText(text).width+spacing*(text.length-1);let x=(width-total)/2;c.textAlign='left';for(const ch of text){c.fillText(ch,x,height/2);x+=c.measureText(ch).width+spacing;}}
    else c.fillText(text,width/2,height/2+4);
    const texture=this.own(new T.CanvasTexture(canvas));texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=2;
    return this.own(new T.MeshStandardMaterial({map:texture,roughness:.65,emissive:0xffffff,emissiveMap:texture,emissiveIntensity:.22}));
  }
  dispose(){for(const r of this.items)r.dispose?.();this.items.clear();this.geometries.clear();this.materials.clear();}
}
