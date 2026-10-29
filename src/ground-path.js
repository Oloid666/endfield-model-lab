// A bounded grid through the central doorway. Furniture remains solid.
export function groundPath(from,to,obstacles=[],intact=true){
 const step=.3,minX=-15,minZ=-3,w=101,h=81,cell=p=>[Math.max(0,Math.min(w-1,Math.round((p[0]-minX)/step))),Math.max(0,Math.min(h-1,Math.round((p[2]-minZ)/step)))],point=(x,z)=>[minX+x*step,.33,minZ+z*step];
 const blocked=(x,z)=>{const p=point(x,z);if(!intact)return false;if(p[2]<2.15&&(p[0]<-4.35||p[0]>4.35||p[2]<-2.7))return true;if(Math.abs(p[2]-1.895)<.3&&(p[0]<-.52||p[0]>.08))return true;return obstacles.some(o=>Math.abs(p[0]-o.x)<o.w/2+.22&&Math.abs(p[2]-o.z)<o.d/2+.22);};
 const [sx,sz]=cell(from);let [tx,tz]=cell(to);if(blocked(tx,tz)){let found=null;for(let radius=1;radius<=4&&!found;radius++)for(let dx=-radius;dx<=radius&&!found;dx++)for(let dz=-radius;dz<=radius;dz++){const x=tx+dx,z=tz+dz;if(x>=0&&x<w&&z>=0&&z<h&&!blocked(x,z)){found=[x,z];break;}}if(!found)return [];[tx,tz]=found;}const start=sz*w+sx,end=tz*w+tx,previous=new Int32Array(w*h).fill(-1),queue=[start];previous[start]=start;
 for(let n=0;n<queue.length&&previous[end]<0;n++){const at=queue[n],x=at%w,z=Math.floor(at/w);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,id=nz*w+nx;if(nx<0||nx>=w||nz<0||nz>=h||previous[id]>=0||blocked(nx,nz))continue;previous[id]=at;queue.push(id);}}
 if(previous[end]<0)return [];
 const path=[];for(let at=end;at!==start;at=previous[at])path.push(point(at%w,Math.floor(at/w)));return path.reverse();
}
