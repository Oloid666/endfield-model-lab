const home=[-2.55,1.5,3.5],doorOut=[-.22,1.3,2.75],doorIn=[-.22,1.3,1.05],counter=[2.05,1.34,1.45];
const smooth=p=>p*p*(3-2*p);
// Segment time advances only when the real doorway is clear.
export class ShoppingJourney{
 constructor(out=false){this.out=out;this.points=out?[counter,doorIn,doorOut,home]:[home,doorOut,doorIn,counter,counter];this.durations=out?[1.8,1.8,1.6]:[1.6,1.8,1.8,1.5];this.segment=0;this.age=0;this.done=false;this.waiting=false;this.position=[...this.points[0]];this.heading=out?-1.74:.9;}
 update(dt,doorOpen=1){
  this.waiting=false;let remaining=Math.max(0,dt);
  for(let guard=0;remaining>0&&!this.done&&guard<8;guard++){
   if(this.segment===1&&doorOpen<.82){this.waiting=true;break;}
   const duration=this.durations[this.segment],step=Math.min(remaining,duration-this.age);this.age+=step;remaining-=step;
   const a=this.points[this.segment],b=this.points[this.segment+1],p=smooth(Math.min(1,this.age/duration));for(let i=0;i<3;i++)this.position[i]=a[i]+(b[i]-a[i])*p;
   if(a[0]!==b[0]||a[2]!==b[2]){const desired=Math.atan2(b[0]-a[0],b[2]-a[2]),diff=desired-this.heading;this.heading+=Math.atan2(Math.sin(diff),Math.cos(diff))*Math.min(1,step*5);}
   if(this.age>=duration){this.segment++;this.age=0;if(this.segment>=this.durations.length)this.done=true;}
  }
 }
 get state(){return {position:[...this.position],heading:this.heading,waiting:this.waiting,segment:this.segment,done:this.done,collected:this.out||this.done,atCounter:!this.out&&this.segment>=3};}
}
