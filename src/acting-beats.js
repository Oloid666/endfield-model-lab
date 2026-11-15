// Scene-clock driven, allocation-free acting cues shared by the existing rigs.
const ease=(x,a,b)=>{const p=Math.max(0,Math.min(1,(x-a)/(b-a)));return p*p*(3-2*p);};
export function xaihiBeat(cue,age,out={}){
 const eye=ease(age,0,.16),head=ease(age,.10,.55),body=ease(age,.24,.95);
 out.eye=eye;out.head=head;out.body=body;out.eyeYaw=out.eyePitch=out.headYaw=out.headPitch=out.shoulder=out.tabletLift=out.tabletTurn=out.freeHand=out.smile=0;
 if(cue==='satisfied'){out.eyeYaw=-.09*eye;out.headYaw=-.07*head;out.headPitch=-.045*head;out.tabletLift=.07*body;out.smile=.5*head;}
 if(cue==='avert'){out.eyeYaw=.21*eye;out.eyePitch=.055*eye;out.headYaw=.18*head;out.headPitch=.075*head;out.shoulder=.055*body;out.tabletLift=-.025*body;out.tabletTurn=.16*body;out.freeHand=body;out.smile=-.12*head;}
 if(cue==='side-eye'){out.eyeYaw=-.14*eye;out.headYaw=-.19*head;out.headPitch=-.035*head;out.shoulder=-.025*body;out.tabletLift=.035*body;out.tabletTurn=-.13*body;out.freeHand=body;}
 return out;
}

const SONG_KEYS=[[-.035,0,-.055,-.10,.20],[.035,.025,.06,-.50,.35],[0,0,-.08,.18,.08],[.025,.035,.08,-.68,.42],[0,.008,-.035,-.35,.16],[-.025,0,.035,-.82,.28]];
export function singingBeat(age,reduced=false,out={}){
 const beat=60/104,phrase=beat*4,part=Math.max(0,age)/phrase,index=Math.floor(part)%6,u=part%1,p=u*u*(3-2*u),a=SONG_KEYS[index],b=SONG_KEYS[(index+1)%6],rhythm=Math.sin(age/beat*Math.PI),soft=reduced?0:1;
 out.index=index;out.x=(a[0]+(b[0]-a[0])*p)*soft;out.y=(a[1]+(b[1]-a[1])*p)*soft;
 out.roll=(a[2]+(b[2]-a[2])*p+rhythm*.018)*soft;out.pitch=Math.sin(age/beat*Math.PI-.25)*.022*soft;
 out.armL=-.12+(a[3]+(b[3]-a[3])*p)*soft;out.armR=.32+(a[4]+(b[4]-a[4])*p)*soft;return out;
}
export function bookLayout(age,out={}){
 const travel=ease(age,.8,1.85),settle=ease(age,2.5,4.5);
 out.x=.10*(1-travel);out.y=1.215-.165*travel-.98*settle;out.z=-1.57*(1-travel);
 out.scale=.28+.37*travel+1.2*ease(age,1.85,3.2);return out;
}
