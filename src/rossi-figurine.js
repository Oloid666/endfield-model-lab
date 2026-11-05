import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// A static, locally built miniature. All faces, eyes and costume details are geometry.
export function buildRossiFigurine(r){
 const root=new T.Group();root.name='rossi-miniature';
 const colors={red:'#c52c37',dark:'#29252d',hair:'#ddc29a',skin:'#f2d3b3',gold:'#e4a438',cream:'#f4e3c8',steel:'#7c8291',gem:'#9c5ea7'};
 const material=r.material('#ffffff',{roughness:.86,flatShading:true,vertexColors:true});
 const parts=[];
 function mesh(geo,color,p=[0,0,0],scale=[1,1,1]){const n=new T.Mesh(geo,material);n.userData.figureColor=new T.Color(colors[color]||color);n.position.fromArray(p);n.scale.fromArray(scale);root.add(n);parts.push(n);return n;}
 const cube=r.geometry('BoxGeometry',1,1,1);
 const box=(color,p,s)=>mesh(cube,color,p,s);
 function prism(color,points,z,depth=.07){const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return mesh(r.own(new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,steps:1,curveSegments:1})),color,[0,0,z]);}
 mesh(r.geometry('CylinderGeometry',.46,.50,.10,12),'dark',[0,.05,0]);
 for(const x of [-.15,.15]){box('dark',[x,.24,.06],[.20,.29,.28]);box('skin',[x,.41,.03],[.12,.12,.13]);}
 prism('red',[[-.27,1.10],[-.58,.34],[-.32,.25],[.34,.26],[.57,.37],[.27,1.10]],-.23,.08);
 mesh(r.geometry('CylinderGeometry',.19,.35,.47,8),'dark',[0,.68,0]);
 prism('red',[[-.065,.92],[-.075,.45],[.09,.45],[.065,.92]],.30,.025);
 box('dark',[0,.85,.04],[.44,.075,.50]);
 for(const side of [-1,1]){
  const arm=box('red',[side*.31,.89,.02],[.18,.32,.20]);arm.rotation.z=side*.30;
  const glove=box('dark',[side*.36,.70,.07],[.19,.21,.22]);glove.rotation.z=side*.15;
  prism('cream',[[side*.03,1.08],[side*.34,1.05],[side*.24,.96],[side*.03,1.02]],.18,.025);
 }
 // The red hood is behind the face; the two red-edged ears define Rossi's silhouette.
 mesh(r.geometry('SphereGeometry',.59,10,6),'red',[0,1.55,-.035],[1,1.05,.65]);
 mesh(r.geometry('SphereGeometry',.52,10,5),'hair',[0,1.47,.11],[1,1.03,.64]);
 mesh(r.geometry('SphereGeometry',.43,10,6),'skin',[0,1.43,.30],[1,1,.50]);
 for(const side of [-1,1]){
  prism('red',[[side*.28,1.93],[side*.61,2.30],[side*.59,1.62]],-.06,.16);
  prism('cream',[[side*.37,1.93],[side*.56,2.17],[side*.55,1.77]],.11,.025);
  prism('red',[[side*.43,1.99],[side*.68,1.37],[side*.48,1.43],[side*.38,1.91]],.19,.06);
  prism('hair',[[side*.37,1.67],[side*.54,1.50],[side*.49,1.22],[side*.60,1.05],[side*.51,.88],[side*.32,.94],[side*.46,1.03],[side*.34,1.20]],.23,.11);
  prism('hair',[[side*.12,1.88],[side*.38,1.81],[side*.41,1.51],[side*.24,1.60],[side*.16,1.44]],.48,.055);
  box('gold',[side*.185,1.385,.512],[.135,.17,.015]);
  box('#805333',[side*.185,1.405,.524],[.060,.090,.012]);
  box('cream',[side*.16,1.44,.534],[.028,.032,.012]);
  const brow=box('dark',[side*.19,1.49,.535],[.19,.035,.025]);brow.rotation.z=side*.10;
  box('#df9b8d',[side*.29,1.28,.48],[.10,.035,.012]);
 }
 prism('hair',[[-.16,1.91],[.06,1.96],[.20,1.70],[.07,1.49],[-.05,1.66],[-.15,1.55]],.51,.055);
 prism('#b97966',[[-.045,1.25],[.045,1.25],[0,1.20]],.52,.012);
 box('dark',[0,1.02,.25],[.23,.12,.12]);
 const jewel=mesh(r.geometry('OctahedronGeometry',.095),'gem',[0,1.03,.35],[.8,1.05,.4]);jewel.rotation.z=.08;
 // Simplified metal clasp and striped cord from the red hood reference.
 for(const [x,y]of [[-.43,1.89],[-.24,2.02]]){const ring=mesh(r.geometry('TorusGeometry',.065,.015,3,6),'steel',[x,y,.35]);ring.rotation.z=.5;}
 const cord=box('cream',[-.335,1.956,.37],[.26,.034,.027]);cord.rotation.z=.58;
 for(let i=0;i<3;i++){const stripe=box(i%2?'steel':'red',[-.41+i*.065,1.91+i*.04,.39],[.038,.035,.018]);stripe.rotation.z=-.5;}
 root.updateMatrixWorld(true);
 const geometries=[];for(const n of parts){const g=n.geometry.index?n.geometry.toNonIndexed():n.geometry.clone();g.applyMatrix4(n.matrix);const color=n.userData.figureColor,values=new Float32Array(g.attributes.position.count*3);for(let i=0;i<values.length;i+=3){values[i]=color.r;values[i+1]=color.g;values[i+2]=color.b;}g.setAttribute('color',new T.BufferAttribute(values,3));geometries.push(g);n.removeFromParent();}
 const merged=r.own(mergeGeometries(geometries,false));for(const g of geometries)g.dispose();const model=new T.Mesh(merged,material);model.castShadow=false;model.receiveShadow=false;model.userData.dynamic=true;root.add(model);
 root.scale.setScalar(.145);
 root.userData={...root.userData,triangles:merged.attributes.position.count/3,draws:1,procedural:true};
 return root;
}
