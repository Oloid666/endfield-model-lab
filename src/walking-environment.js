// The single owner of postgame road permission and store collision.
export function walkingEnvironment(floor,{postgame=false,intact=true,doorOpen=true}={}){
 const obstacles=intact?[...(floor.obstacles||floor.racks||[])]:[];
 if(intact&&!doorOpen)obstacles.push({x:-.22,z:1.895,w:1.6,d:.12});
 return {obstacles,street:postgame,entrance:intact?floor.entrance:{minX:-20,maxX:20,z:1.8}};
}
