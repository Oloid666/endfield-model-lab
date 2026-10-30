const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createPassenger(){return {mode:'seated',age:0,risk:0,side:1,lastHit:10,stable:0,falls:0,saves:0,x:0,z:0,y:.12,vx:0,vz:0,roll:0,tip:0};}
export function strikePassenger(p,strength,side=1){
 if(p.mode==='fallen'&&strength<.5){p.vx+=(Math.sign(side)||p.side)*strength*.1;return;}
 p.side=Math.sign(side)||p.side;p.lastHit=0;p.stable=0;
 p.risk=clamp(p.risk+.08+strength*.20,0,1.25);
 if(p.mode==='seated'){p.mode='scrape';p.age=0;}
 if(p.mode==='fallen'){p.vx+=p.side*strength*.3;return;}
 if(p.mode==='recovering'&&strength>.45){p.mode='slipping';p.age=0;}
}
export function stepPassenger(p,dt,{speed=0,sideSpeed=0,offset=0,brake=false,tension=0}={}){
 const before=p.mode;p.age+=dt;p.lastHit+=dt;
 const stress=Math.max(0,Math.abs(offset)-.50)*speed*.10+Math.max(0,Math.abs(sideSpeed)-.8)*.07;
 const stable=(Math.abs(sideSpeed)<.65&&stress<.12&&p.lastHit>.5)||(brake&&speed<.5&&Math.abs(sideSpeed)<1.1&&p.lastHit>.35);
 p.stable=stable?p.stable+dt:0;
 p.risk=clamp(p.risk+(stress-(stable?(brake?.9:.38):.025))*dt,0,1.25);
 if(Math.abs(sideSpeed)>.5&&p.lastHit>.3)p.side=Math.sign(sideSpeed);
 if(['seated','scrape'].includes(p.mode)&&p.risk>.42){p.mode='slipping';p.age=0;}
 else if(p.mode==='seated'&&stress>.16){p.mode='scrape';p.age=0;}
 else if(p.mode==='scrape'&&p.stable>.6&&p.risk<.25){p.mode='seated';p.age=0;}
 else if(p.mode==='slipping'){
  if(p.risk>=.96&&p.age>.65){p.mode='fallen';p.age=0;p.falls++;p.x=p.side*.08;p.z=.02;p.vx=p.side*.85;p.vz=.25;}
  else if(p.risk<.32&&p.stable>.55){p.mode='recovering';p.age=0;p.saves++;}
 }else if(p.mode==='fallen'){
  p.vx+=(-18*(p.x-p.side*.15)-6*p.vx)*dt;p.vz+=(-18*(p.z-.06)-6*p.vz)*dt;p.x=clamp(p.x+p.vx*dt,-.25,.25);p.z=clamp(p.z+p.vz*dt,-.15,.23);
  p.y=Math.max(.055,.12+.55*p.age-2.5*p.age*p.age);
  p.roll=p.side*(Math.PI/2+Math.min(1,p.age/.6)*Math.PI*2);
  if(p.age>1&&p.stable>.8){p.mode='recovering';p.age=0;p.saves++;p.risk=Math.min(.3,p.risk);}
 }else if(p.mode==='recovering'){
  p.x*=Math.exp(-dt*7);p.z*=Math.exp(-dt*7);p.y+=(.12-p.y)*(1-Math.exp(-dt*7));p.roll*=Math.exp(-dt*9);
  if(p.age>.8){p.mode='seated';p.age=0;p.risk=.08;p.x=p.z=p.roll=0;p.y=.12;}
 }
 if(p.mode==='slipping'){p.x=p.side*(.045+p.risk*.035);p.z=.025;p.y=.12-p.risk*.035;p.roll=p.side*p.risk*.55;}
 else if(['seated','scrape'].includes(p.mode)){p.x+=(p.side*p.risk*.025-p.x)*(1-Math.exp(-dt*8));p.z=0;p.y=.12;p.roll=p.side*p.risk*.2;}
 const desired=clamp(sideSpeed*.09+p.side*p.risk*.18,-.35,.35);
 p.tip+=(desired-p.tip)*(1-Math.exp(-dt*9));
 return before===p.mode?null:p.mode;
}
