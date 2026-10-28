import * as T from 'three';
import { config } from './config.js';
import { sampleIdle } from './idle.js';
import { buildDragon } from './companion.js';
import { makeLocomotion } from './locomotion.js';
import { makeFollower } from './follower.js';
import { buildMeals } from './meal-props.js';

const aliases={look:'player',lookPlayer:'player',lookDragon:'dragon',lookGoods:'goods',lookPhone:'phone',receiveBag:'receive',holdFood:'hold',shakeHead:'shake',adjustSleeve:'sleeve',rainStartle:'rain',celebrate:'happy',bow:'nod',sigh:'exhale',hug:'hold',protect:'hold',offer:'receive'};

export function buildPerformance({scene,r,root,pivot,poses,eyelids,bones,byId,gltf,dragon:providedDragon}){
  function remember(key,bone){
    if(!bone)return;const inverse=bone.getWorldQuaternion(new T.Quaternion()).invert();
    poses[key]={bone,rest:bone.position.clone(),q:bone.quaternion.clone(),x:new T.Vector3(1,0,0).applyQuaternion(inverse),y:new T.Vector3(0,1,0).applyQuaternion(inverse),z:new T.Vector3(0,0,1).applyQuaternion(inverse)};
  }
  // Finger roots are selected by verified GLB node IDs. Names in this asset are damaged.
  const fingers=[];for(const [i,id]of [349,353,357,361,396,400,404,408].entries()){const key=`finger${i}`;remember(key,byId(id));if(poses[key])fingers.push(key);}
  // Verified mouth-corner and cheek joints, not a new morph or a material overlay.
  // Offsets are under two millimetres in the source rig and deliberately asymmetric.
  const smileJoints=[];
  for(const [id,dx,dy,dz]of [[171,.00025,.0018,.0001],[175,.00025,.0018,.0001],[172,.00012,.00105,0],[176,.00012,.00105,0],[173,0,.00035,0],[177,0,.00035,0],[181,-.00015,.0011,0],[185,-.00015,.0011,0],[182,-.0001,.0007,0],[186,-.0001,.0007,0],[160,0,.00045,0],[168,0,.0003,0]]){
    const key=`smile${id}`;remember(key,byId(id));if(poses[key])smileJoints.push({key,offset:new T.Vector3(dx,dy,dz)});
  }
  const secondary=[];
  for(const bone of bones){
    const name=bone.name,id=gltf.parser.associations.get(bone)?.nodes;
    const chain=/clothes_base_.*__jnt(\d+)_/.exec(name)||/hair_base_.*__jnt(\d+)_/.exec(name);
    const ribbon=/clothes_ribbon_.*_0[12]_jnt_/.test(name),sleeve=/sleeve_base_/.test(name);
    // One joint out of four along the long chains. Small rotations, no cloth solver.
    if((chain&&Number(chain[1])%4===2)||ribbon||sleeve){
      const key=`secondary${id}`;remember(key,bone);secondary.push({key,id,type:name.startsWith('hair')?'hair':ribbon?'ribbon':sleeve?'sleeve':'cloth',weight:chain?Math.min(1,Number(chain[1])/10):1});
    }
  }
  const quaternion=new T.Quaternion(),axis=new T.Quaternion();
  function pose(name,pitch=0,yaw=0,roll=0){const p=poses[name];if(p){quaternion.setFromAxisAngle(p.x,pitch).multiply(axis.setFromAxisAngle(p.y,yaw)).multiply(axis.setFromAxisAngle(p.z,roll));p.bone.quaternion.copy(p.q).multiply(quaternion);}}
  const dragon=providedDragon||buildDragon(r);dragon.root.scale.setScalar(.59);dragon.root.position.set(-.82,.005,.09);dragon.root.rotation.y=.15;root.add(dragon.root);
  const soot=new T.Group();dragon.root.add(soot);for(let i=0;i<9;i++){const dot=r.mesh(r.geometry('SphereGeometry',1,8,6),r.material('#423f39',{roughness:1}),soot,[(i%3-1)*.21,.28+Math.floor(i/3)*.24,.41],[.09,.035,.025]);dot.rotation.z=i*.8;}soot.visible=false;
  const tape=new T.Group();soot.add(tape);for(const [x,y,z,angle]of [[-.23,1.02,.39,-.3],[.43,.48,.3,.6]]){const patch=r.box(tape,'#d7b88d',[x,y,z],[.2,.075,.014],{roughness:.95});patch.rotation.z=angle;r.box(tape,'#e6d5b6',[x,y,z+.01],[.065,.07,.008]);}for(let i=0;i<5;i++)r.box(soot,'#72695c',[-.25+i*.12,.3+(i%2)*.12,.425],[.06,.018,.008],{roughness:1});

  const meal=buildMeals(r,root),dragonMeal=buildMeals(r,dragon.foodMount,.68);meal.setDinner(null);dragonMeal.setDinner(null);
  const phone=new T.Group();phone.name='phone';phone.userData.hotspot='phone';root.add(phone);
  r.box(phone,'#1a272b',[0,0,0],[.075,.145,.012],{roughness:.25,metalness:.45});
  const screen=r.box(phone,'#9dbbc4',[0,.002,.008],[.063,.118,.004],{emissive:0x6d9fa8,emissiveIntensity:.4,roughness:.2});
  for(let i=0;i<3;i++)r.box(phone,'#d9e1d4',[0,.027-i*.024,.011],[.045,.004,.002],{emissive:0x798e85,emissiveIntensity:.2});
  phone.traverse(n=>n.userData.hotspot='phone');phone.visible=false;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d'),gradient=c.createRadialGradient(64,64,5,64,64,63);gradient.addColorStop(0,'rgba(5,15,19,.65)');gradient.addColorStop(1,'rgba(5,15,19,0)');c.fillStyle=gradient;c.fillRect(0,0,128,128);
  const shadowMap=r.own(new T.CanvasTexture(canvas)),shadowMaterial=r.own(new T.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false}));
  const shadows=[];for(const [x,s]of [[0,.7],[-.82,.53]]){const shadow=r.mesh(r.geometry('PlaneGeometry',1,1),shadowMaterial,root,[x,.006,.04],[s,.48,1]);shadow.rotation.x=-Math.PI/2;shadows.push(shadow);}
  scene.add(root);root.updateMatrixWorld(true);
  const locomotion=makeLocomotion(root,pivot),follower=makeFollower(root.position,locomotion),idle={};let raining=true,dinner=null,lastTime=0,lastWalking=false;
  const pivotRest=pivot.position.clone(),cinematic={phase:'',elapsed:0,charge:0,flight:0,recoil:0,distance:1.2,height:2.7,castingElapsed:null,launchOverride:null};
  let smileTarget=0,smileAmount=0;
  const companionAction={kind:'',amount:0};
  const heroWorld=new T.Vector3(),projectileWorld=new T.Vector3();let dragonHeading=0;let castActive=false,projectileActive=false,projectileRoll=0,landingFeet=false;
  const castPhases=new Set(['login','captcha','lever','ascent','director-reminder','shoe-view','pylon-link','charge','fire-ready','combat','energy','last','aim-final','finisher','landing']);
  const walkPose={shoulderL:0,shoulderR:0,elbowL:0,elbowR:0,wristL:0,wristR:0};
  function relax(key,target,rate,delta){walkPose[key]=T.MathUtils.lerp(walkPose[key],target,delta>0?1-Math.exp(-Math.min(delta,.06)*rate):1);return walkPose[key];}
  let sceneAction={},sceneHeading=.08,reaction=null;
 const reactionTexts=['有，有在聽。','這次很合乎舟禮。','導播，這個有拍到嗎？','再來一碗？','唉，還沒下班。','又是我背鍋。','我先沉默一下。','你剛剛是不是又按我？'];let reactionDeck=[],lastReaction=-1,reactionUntil=-Infinity;

  const gesture={name:'',start:-100,speaker:''};
  const feet=['L','R'].map(side=>({side,hip:poses['hip'+side]?.bone,knee:poses['knee'+side]?.bone,foot:poses['foot'+side]?.bone,target:new T.Vector3(),local:new T.Vector3(),orientation:new T.Quaternion(),localOrientation:new T.Quaternion()}));
  const pivotInverse=pivot.getWorldQuaternion(new T.Quaternion()).invert();
  for(const leg of feet)if(leg.foot){leg.foot.getWorldPosition(leg.target);leg.local.copy(leg.target);pivot.worldToLocal(leg.local);leg.foot.getWorldQuaternion(leg.orientation);leg.localOrientation.copy(pivotInverse).multiply(leg.orientation);leg.upperLength=leg.hip.getWorldPosition(new T.Vector3()).distanceTo(leg.knee.getWorldPosition(new T.Vector3()));leg.lowerLength=leg.knee.getWorldPosition(new T.Vector3()).distanceTo(leg.target);}
  const jointPosition=new T.Vector3(),footPosition=new T.Vector3(),toFoot=new T.Vector3(),toTarget=new T.Vector3(),handPosition=new T.Vector3(),rootQuaternion=new T.Quaternion(),dragonWorldPosition=new T.Vector3();
  const deltaQuaternion=new T.Quaternion(),worldQuaternion=new T.Quaternion(),parentQuaternion=new T.Quaternion();
  const desiredKnee=new T.Vector3(),kneePosition=new T.Vector3(),pole=new T.Vector3(),legDirection=new T.Vector3(),targetDirection=new T.Vector3();
  const pelvis=poses.pelvis,parentScale=pelvis?.bone.parent.getWorldScale(new T.Vector3())||new T.Vector3(1,1,1);
  const inverseParent=pelvis?.bone.parent.getWorldQuaternion(new T.Quaternion()).invert()||new T.Quaternion();
  const shiftAxis=new T.Vector3(1,0,0).applyQuaternion(inverseParent).divide(parentScale),downAxis=new T.Vector3(0,-1,0).applyQuaternion(inverseParent).divide(parentScale);
  const footNames=['hipL','kneeL','footL','hipR','kneeR','footR'];
  function pinFeet(){
    for(const leg of feet){
      if(!leg.hip||!leg.knee||!leg.foot)continue;
      if(status.moving){
        // Analytic knee placement handles toe clearance even at a straight-leg pose.
        leg.hip.getWorldPosition(jointPosition);legDirection.copy(leg.target).sub(jointPosition);
        const distance=Math.max(.05,Math.min(leg.upperLength+leg.lowerLength-.0001,legDirection.length()));legDirection.normalize();
        const along=(leg.upperLength**2-leg.lowerLength**2+distance**2)/(2*distance),height=Math.sqrt(Math.max(0,leg.upperLength**2-along**2));
        pole.set(Math.sin(status.heading),0,Math.cos(status.heading));pole.addScaledVector(legDirection,-pole.dot(legDirection)).normalize();
        desiredKnee.copy(jointPosition).addScaledVector(legDirection,along).addScaledVector(pole,height);
        leg.knee.getWorldPosition(kneePosition);toFoot.copy(kneePosition).sub(jointPosition).normalize();toTarget.copy(desiredKnee).sub(jointPosition).normalize();
        deltaQuaternion.setFromUnitVectors(toFoot,toTarget);leg.hip.getWorldQuaternion(worldQuaternion);worldQuaternion.premultiply(deltaQuaternion);leg.hip.parent.getWorldQuaternion(parentQuaternion).invert();leg.hip.quaternion.copy(parentQuaternion.multiply(worldQuaternion));leg.hip.updateWorldMatrix(false,false);
        leg.knee.getWorldPosition(jointPosition);leg.foot.getWorldPosition(footPosition);toFoot.copy(footPosition).sub(jointPosition).normalize();targetDirection.copy(leg.target).sub(jointPosition).normalize();
        deltaQuaternion.setFromUnitVectors(toFoot,targetDirection);leg.knee.getWorldQuaternion(worldQuaternion);worldQuaternion.premultiply(deltaQuaternion);leg.knee.parent.getWorldQuaternion(parentQuaternion).invert();leg.knee.quaternion.copy(parentQuaternion.multiply(worldQuaternion));leg.knee.updateWorldMatrix(false,false);
      }else{
        for(let iteration=0;iteration<3;iteration++)for(let jointIndex=0;jointIndex<2;jointIndex++){
          const joint=jointIndex===0?leg.knee:leg.hip;
          joint.getWorldPosition(jointPosition);leg.foot.getWorldPosition(footPosition);toFoot.copy(footPosition).sub(jointPosition).normalize();toTarget.copy(leg.target).sub(jointPosition).normalize();
          deltaQuaternion.setFromUnitVectors(toFoot,toTarget);joint.getWorldQuaternion(worldQuaternion);worldQuaternion.premultiply(deltaQuaternion);joint.parent.getWorldQuaternion(parentQuaternion).invert();joint.quaternion.copy(parentQuaternion.multiply(worldQuaternion));joint.updateWorldMatrix(false,false);
        }
      }
      leg.foot.parent.getWorldQuaternion(parentQuaternion).invert();leg.foot.quaternion.copy(parentQuaternion.multiply(leg.orientation));leg.foot.updateWorldMatrix(false,false);
    }
  }
  function settleFeet(){root.updateMatrixWorld(true);for(const leg of feet)if(leg.foot){leg.foot.getWorldPosition(leg.target);leg.foot.getWorldQuaternion(leg.orientation);}}
  const cinematicStatus={phase:'',lift:0,forward:0,heading:.08,airborne:false,dragonProjectile:false,recoil:0};
  const status={phase:0,action:'settle',footDrift:0,moving:false,speed:0,distance:0,clothJoints:secondary.length,dinner:null,gesture:'',companion:follower.state,arms:walkPose,cinematic:cinematicStatus,smile:0,smileJointCount:smileJoints.length,companionAction:''};
  const api={root,heroRoot:pivot,status,supported:Object.keys(config.zhuangNodes).every(name=>poses[name]),
    get position(){return root.position;},get moving(){return status.moving;},
    // Feet origins in world metres. Follower and walking root remain on the ground.
    get heroPosition(){return pivot.getWorldPosition(heroWorld).toArray();},
    get heelCenter(){const left=feet[0].foot,right=feet[1].foot;if(!left||!right)return api.heroPosition;const a=left.getWorldPosition(new T.Vector3()),b=right.getWorldPosition(new T.Vector3());return a.add(b).multiplyScalar(.5).toArray();},
    get deviceGripPosition(){const hand=poses.wristR?.bone;if(hand)return hand.getWorldPosition(handPosition).toArray();return api.heroPosition;},
    get gripPosition(){const hand=poses.wristL?.bone;if(hand)return hand.getWorldPosition(handPosition).toArray();return api.heroPosition;},
    get dragonGripPosition(){return dragon.hand.getWorldPosition(handPosition).toArray();},
    get dragonPosition(){return dragon.root.getWorldPosition(dragonWorldPosition).toArray();},
    get poseData(){return {head:poses.head?.bone.quaternion.toArray(),wrist:poses.wristL?.bone.quaternion.toArray(),hip:poses.hipL?.bone.quaternion.toArray(),knee:poses.kneeL?.bone.quaternion.toArray(),armL:poses.armL?.bone.quaternion.toArray(),armR:poses.armR?.bone.quaternion.toArray(),elbow:poses.elbowL?.bone.quaternion.toArray(),cloth:secondary.length?poses[secondary[0].key].bone.quaternion.toArray():null,smileCorners:[poses.smile171?.bone.position.toArray(),poses.smile181?.bone.position.toArray()]};},
    setSceneAction(value){sceneAction=value||{};},cancelReaction(){reaction=null;},reactDragon(time,large=false){if(time<reactionUntil)return null;if(!reactionDeck.length){reactionDeck=Array.from({length:8},(_,i)=>i);for(let i=7;i>0;i--){const j=Math.floor(Math.random()*(i+1));[reactionDeck[i],reactionDeck[j]]=[reactionDeck[j],reactionDeck[i]];}if(reactionDeck.at(-1)===lastReaction)[reactionDeck[0],reactionDeck[7]]=[reactionDeck[7],reactionDeck[0]];}const id=reactionDeck.pop();lastReaction=id;reaction={id,at:time,large};reactionUntil=time+3;return reactionTexts[id];},setRain(value){raining=value;},setMove:(x,z,enabled=true)=>locomotion.setMove(x,z,enabled),setObstacles(layout){locomotion.setObstacles(layout);follower.invalidate();},
    setGesture(name,node={}){gesture.name=aliases[name]||String(name||'');gesture.start=lastTime;gesture.speaker=node.speaker||'';},
    setDinner(value){dinner=['A','B','C'].includes(String(value).toUpperCase())?String(value).toUpperCase():null;meal.setDinner(dinner);dragonMeal.setDinner(dinner);status.dinner=dinner;if(!dinner){smileTarget=smileAmount=0;companionAction.kind='';companionAction.amount=0;}},
    setSmile(value){smileTarget=T.MathUtils.clamp(Number(value)||0,0,1);},
    setCompanionAction(value){companionAction.kind=value?.kind||'';companionAction.amount=T.MathUtils.clamp(Number(value?.amount)||0,0,1);status.companionAction=companionAction.kind;},
    setCinematic(value){
      const active=Boolean(value&&castPhases.has(value.phase));
      if(castActive&&!active)landingFeet=true;
      castActive=active;cinematic.phase=value?.phase||'';cinematic.elapsed=Math.max(0,Number(value?.elapsed)||0);cinematic.charge=T.MathUtils.clamp(Number(value?.charge)||0,0,1);cinematic.flight=T.MathUtils.clamp(Number(value?.flight)||0,0,1);cinematic.recoil=T.MathUtils.clamp(Number(value?.recoil)||0,0,1.8);cinematic.distance=Number.isFinite(value?.distance)?value.distance:1.2;cinematic.height=Number.isFinite(value?.height)?value.height:2.7;cinematic.castingElapsed=Number.isFinite(value?.castingElapsed)?Math.max(0,value.castingElapsed):Number.isFinite(value?.ascentElapsed)?Math.max(0,value.ascentElapsed):null;cinematic.launchOverride=Number.isFinite(value?.launchOverride)?T.MathUtils.clamp(value.launchOverride,0,1):null;
      if(!active){pivot.position.copy(pivotRest);projectileActive=false;}
    },
    setSoot(value){soot.visible=value;},setDragonHeading(value){dragonHeading=value;},setDragonProjectile(position,roll=0){projectileActive=Boolean(position);if(position)projectileWorld.fromArray(position);projectileRoll=Number(roll)||0;},
    teleport(x,z){const success=locomotion.teleport(x,z);if(success){lastWalking=true;follower.reset();api.update(lastTime,0);}return success;},
    update(t,delta=0){
      lastTime=t;const motion=locomotion.update(delta),walk=motion.amount,walking=motion.moving;
      const rising=['login','captcha','lever','ascent','director-reminder','shoe-view','pylon-link','charge'].includes(cinematic.phase),age=cinematic.castingElapsed??cinematic.elapsed;
      const quick=Math.min(cinematic.height,1.2)*T.MathUtils.smootherstep(age,0,.8),slow=T.MathUtils.smootherstep(age,1.15,14);
      const launch=cinematic.launchOverride??(rising?(quick+(cinematic.height-Math.min(cinematic.height,1.2))*slow)/Math.max(.01,cinematic.height):cinematic.phase==='landing'?1-T.MathUtils.smootherstep(cinematic.elapsed,0,2.8):1);
      const travel=cinematic.launchOverride??(rising?slow:launch);
      const recoil=castActive?cinematic.recoil:0,lift=castActive?cinematic.height*launch:0,forward=castActive?cinematic.distance*travel:0;
      pivot.position.copy(pivotRest);pivot.position.y+=lift+(lift>.1?Math.sin(t*1.8)*.025*launch:0);pivot.position.z+=forward+recoil*.62;pivot.position.y+=recoil*.085;
      if(!castActive&&!walking&&Number.isFinite(sceneAction.heading)){const q=sceneAction.heading-sceneHeading;sceneHeading+=Math.atan2(Math.sin(q),Math.cos(q))*(delta>0?1-Math.exp(-delta*5):1);pivot.rotation.y=sceneHeading;}
      if(castActive&&lift>.1){pivot.position.x+=Math.sin(t*.8)*.018;pose('head',Math.sin(t*.7)*.015);}
      if(castActive)pivot.rotation.y=T.MathUtils.lerp(.08,Math.PI-.23,rising?T.MathUtils.smootherstep(age,3,12):1);
      if(castActive&&['director-reminder','shoe-view','pylon-link'].includes(cinematic.phase))pivot.rotation.y=Math.PI-.23;
      Object.assign(cinematicStatus,{phase:cinematic.phase,lift,forward,heading:pivot.rotation.y,airborne:lift>.015,dragonProjectile:projectileActive,recoil});
      sampleIdle(t,idle);if(!raining){idle.rain=0;idle.startle=0;}
      const elapsed=t-gesture.start,g=T.MathUtils.smoothstep(elapsed,0,.3)*(1-T.MathUtils.smoothstep(elapsed,2.1,2.75));
      const dragonSpeaker=gesture.speaker==='dragon'||gesture.speaker==='龍泡泡'||gesture.speaker==='龍';
      const gest=name=>!dragonSpeaker&&gesture.name===name?g:0;
      const sleeve=dinner||sceneAction.photoLook?0:Math.max(idle.sleeve,gest('sleeve')),attention=Math.max(idle.dragon,gest('dragon')),goods=Math.max(idle.goods,gest('goods')),rain=Math.max(idle.rain,gest('rain'));
      const phoneLook=sceneAction.photoLook||sceneAction.handover?1:Math.max(idle.phone||0,gest('phone')),hold=dinner?1:Math.max(gest('hold'),gest('receive'),gest('eat'));
      const nod=Math.max(idle.nod,gest('nod')*Math.sin(elapsed*5)),shake=gest('shake')*Math.sin(elapsed*6.3),point=gest('point'),wave=gest('wave'),player=gest('player'),exhale=Math.max(idle.exhale,gest('exhale'));
      Object.assign(status,{phase:idle.phase,gesture:g>.01?gesture.name:'',moving:walking,speed:motion.speed,distance:motion.distance,walkPhase:motion.phase,walkBlend:walk,heading:motion.heading});
      status.action=walking?'walking':g>.1?gesture.name:idle.startle>.1?'rain-response':sleeve>.1?'adjust-sleeve':attention>.1?'look-at-dragon':goods>.1?'look-at-display':'rest';
      for(const name of footNames)poses[name]?.bone.quaternion.copy(poses[name].q);
      const stride=Math.sin(motion.phase),breathe=Math.sin(t*1.17)*.007+Math.sin(t*.53)*.003;
      if(pelvis){pelvis.bone.position.copy(pelvis.rest).addScaledVector(shiftAxis,idle.shift*.009*(1-walk)).addScaledVector(downAxis,idle.shift*.002+walk*(.012+.008*Math.cos(motion.phase*2)));pose('pelvis',walk*.012,walk*stride*.014,idle.shift*.009*(1-walk)+walk*stride*.012);}
      pose('spine',breathe-exhale*.022-phoneLook*.045+walk*.018,-goods*.035-walk*Math.sin(motion.phase-.15)*.022,-idle.shift*.004+walk*Math.sin(motion.phase-.35)*.004);
      pose('head',.015+(sceneAction.photoLook?.12:0)+attention*.17+nod*.065-rain*.065+phoneLook*.12,-attention*.35-goods*.25+rain*.15+shake*.12,-player*.025+Math.sin(t*.27)*.008);
      const sway=Math.sin(t*.63)*.012,freeLeft=(1-hold*.94)*(1-sleeve*.75),freeRight=(1-phoneLook*.94)*(1-wave*.9)*(1-point*.8);
      const shoulderL=relax('shoulderL',walk*(-stride*.085+Math.sin(motion.phase*.5-.4)*.008)*freeLeft,8,delta);
      const shoulderR=relax('shoulderR',walk*(Math.sin(motion.phase+.08)*.108+Math.sin(motion.phase*2-.6)*.009)*freeRight,9,delta);
      const elbowL=relax('elbowL',walk*(.025+Math.sin(motion.phase-.55)*.022)*freeLeft,5.5,delta),elbowR=relax('elbowR',walk*(.035-Math.sin(motion.phase-.7)*.028)*freeRight,5,delta);
      const wristL=relax('wristL',walk*Math.sin(motion.phase-1)*.018*freeLeft,4.5,delta),wristR=relax('wristR',-walk*Math.sin(motion.phase-1.12)*.021*freeRight,4,delta);
      pose('armL',.025+sleeve*.12+hold*.36+shoulderL,.04,-.88+sleeve*.12+hold*.26+point*.23+walk*Math.sin(motion.phase-.45)*.005*freeLeft);
      pose('armR',-.015+sleeve*.12+phoneLook*.32+point*.12+shoulderR,-.035,.9-sleeve*.1-phoneLook*.28-wave*.48-point*.24+sway);
      pose('elbowL',.08+sleeve*.32+hold*.78+point*.2+elbowL,.015,.025+sleeve*.13+hold*.12);pose('wristL',sleeve*.1+hold*.13+wristL,hold*.08,sleeve*.1-hold*.08);
      pose('elbowR',.08+sleeve*.25+phoneLook*.9+wave*.65+point*.1+elbowR,0,-.035-sleeve*.09-phoneLook*.08);pose('wristR',.015+sleeve*.06+phoneLook*.16+wristR,0,-sleeve*.08+wave*Math.sin(elapsed*8)*.2);
      for(let i=0;i<fingers.length;i++)pose(fingers[i],(i<4?hold*.28:phoneLook*.18)+Math.sin(t*.41+i)*.012,0,0);
      const eye=-Math.max(idle.goodsEyes,goods)*.13-Math.max(idle.dragonEyes,attention)*.14+rain*.06;pose('eyeL',0,eye);pose('eyeR',0,eye);
      if(walking)smileTarget=0;smileAmount=T.MathUtils.lerp(smileAmount,smileTarget,delta>0?1-Math.exp(-Math.min(delta,.08)*3):1);status.smile=smileAmount;
      for(const p of eyelids)p.b.position.lerpVectors(p.rest,p.target,Math.max(idle.blink,smileAmount*.045));
      for(const item of smileJoints)poses[item.key].bone.position.copy(poses[item.key].rest).addScaledVector(item.offset,smileAmount);
      for(const s of secondary){const phase=s.id*.51,wind=Math.sin(t*.81-phase)*.6+Math.sin(t*1.37-phase*.2)*.4,amplitude=s.type==='ribbon'?.021:s.type==='sleeve'?.018:s.type==='hair'?.012:.006;pose(s.key,wind*amplitude*s.weight+walk*Math.sin(motion.phase-.75-phase*.1)*amplitude*1.7,0,Math.sin(t*.56-phase)*amplitude*.6*s.weight);}
      if(castActive){
        const summon=(rising?T.MathUtils.smootherstep(age,0,7):1)*Math.max(.15,launch),release=cinematic.phase==='finisher'?Math.exp(-Math.max(0,cinematic.elapsed-.7)*2):0;
        const foodArm=cinematic.phase==='aim-final'||cinematic.phase==='finisher'||cinematic.phase==='landing';
        status.action=cinematic.phase==='charge'?'summoning':cinematic.phase==='landing'?'landing':'casting';
        pose('spine',-.025*summon-recoil*.17,Math.sin(t*.7)*.01,-.018*summon+recoil*.025);pose('head',-.035*summon+recoil*.085+Math.sin(t*.8)*.012,.065*summon+Math.sin(t*.53)*.018,Math.sin(t*.6)*.01);
        pose('armL',foodArm?.8:.28*summon,-.035,-.88+summon*(foodArm?.26:.32));
        pose('elbowL',foodArm?.88:.45*summon,.02,foodArm?.12:.035);pose('wristL',foodArm?.13:.04,0,-.06*summon);
        pose('armR',.88*summon+release*.16-recoil*.24,.04,.9-summon*.58+recoil*.16);pose('elbowR',.1+summon*.3-release*.18+recoil*.38,0,-.05);pose('wristR',-.08*summon,0,Math.sin(t*.9)*.015);
        pose('hipL',.04*launch,0,0);pose('hipR',-.065*launch,0,0);pose('kneeL',-.055*launch);pose('kneeR',-.23*launch);pose('footL',-.08*launch+Math.sin(t*.8)*.02);pose('footR',-.14*launch+Math.cos(t*.7)*.015);
        for(const s of secondary){const phase=s.id*.37,amplitude=s.type==='ribbon'?.055:s.type==='sleeve'?.038:s.type==='hair'?.032:.016;pose(s.key,(Math.sin(t*2-phase)*.6+.4)*amplitude*s.weight*launch+recoil*amplitude*2.8*Math.sin(phase),0,Math.cos(t*1.3-phase)*amplitude*.45*launch+recoil*amplitude*1.6);}
      }
      root.updateMatrixWorld(true);
      if(landingFeet){settleFeet();landingFeet=false;}
      if(walking&&!castActive){
        pivot.getWorldQuaternion(rootQuaternion);
        for(let i=0;i<feet.length;i++){const leg=feet[i],cycle=motion.phase+i*Math.PI;leg.target.copy(leg.local);leg.target.z+=Math.sin(cycle)*.155*walk;leg.target.y+=Math.max(0,Math.cos(cycle))*.075*walk;pivot.localToWorld(leg.target);leg.orientation.copy(rootQuaternion).multiply(leg.localOrientation);pose('hip'+leg.side,Math.sin(cycle)*.21*walk);pose('knee'+leg.side,-Math.max(0,Math.cos(cycle))*.35*walk);}
        root.updateMatrixWorld(true);
      }else if(!castActive){pivot.getWorldQuaternion(rootQuaternion);for(const leg of feet){leg.target.copy(leg.local);pivot.localToWorld(leg.target);leg.orientation.copy(rootQuaternion).multiply(leg.localOrientation);}}
      if(!castActive)pinFeet();status.footDrift=0;if(!castActive)for(const leg of feet)if(leg.foot)status.footDrift=Math.max(status.footDrift,leg.foot.getWorldPosition(footPosition).distanceTo(leg.target));lastWalking=walking;
      const companion=follower.update(delta,t);
      idle.dragon=attention;idle.rain=rain;idle.nod=Math.max(idle.nod,gest('happy'));idle.walk=companion.walk;idle.walkPhase=companion.phase;idle.lookYaw=companion.lookYaw;idle.lookPitch=companion.lookPitch;idle.followerMode=companion.mode;idle.glance=companion.glance;idle.gesture=status.gesture;idle.gestureAmount=g;idle.holding=!!dinner;idle.gestureAmount=sceneAction.photoLook?0:g;idle.action=companionAction;idle.projectile=projectileActive&&['aim-final','finisher','landing','tour','complete'].includes(cinematic.phase)&&!['key','lever'].includes(companionAction.kind);idle.phoneHold=sceneAction.photoLook;idle.allowIdleEmote=sceneAction.playful&&!castActive;idle.singing=sceneAction.singing;idle.reaction=reaction&&t-reaction.at<2?{...reaction,age:t-reaction.at}:null;dragon.update(t,idle);status.companionExpression=dragon.state.mood;
      dragonWorldPosition.copy(projectileActive?projectileWorld:heroWorld.fromArray(companion.position));root.worldToLocal(dragonWorldPosition);dragon.root.position.copy(dragonWorldPosition);dragon.root.rotation.set(sceneAction.photoLook?.25:projectileActive?-.08:0,projectileActive?dragonHeading:companion.heading,projectileActive?projectileRoll:0);dragon.root.scale.set(.59,idle.projectile?.55:.59,.59);
      meal.mount.visible=sceneAction.mealVisible!==false&&Boolean(dinner)&&(!castActive||['aim-final','finisher','landing'].includes(cinematic.phase));dragonMeal.mount.visible=Boolean(dinner)&&!projectileActive;
      shadows[0].position.set(0,.006-(castActive?.116*launch:0),.04+forward);shadows[0].scale.set(.7+lift*.07,.48+lift*.045,1);
      shadows[1].visible=!projectileActive;
      shadows[1].position.x=dragon.root.position.x;shadows[1].position.z=dragon.root.position.z;root.updateMatrixWorld(true);
      if(poses.wristL){poses.wristL.bone.getWorldPosition(handPosition);root.worldToLocal(handPosition);meal.mount.position.copy(handPosition);meal.mount.position.y+=.015;meal.mount.position.z+=.055;meal.mount.rotation.set(-.025,pivot.rotation.y,0);}
      phone.visible=phoneLook>.06&&!castActive&&!sceneAction.externalDevice;
      if(phone.visible&&poses.wristR){poses.wristR.bone.getWorldPosition(handPosition);root.worldToLocal(handPosition);phone.position.copy(handPosition);phone.position.y+=.055;phone.position.z+=.025;phone.rotation.set(-.23,motion.heading+.1,-.08);screen.material.emissiveIntensity=.35+phoneLook*.7;}
    },
    dispose(){for(const p of Object.values(poses)){p.bone.quaternion.copy(p.q);p.bone.position.copy(p.rest);}for(const p of eyelids)p.b.position.copy(p.rest);root.removeFromParent();},
  };
  api.update(0,0);return api;
}
