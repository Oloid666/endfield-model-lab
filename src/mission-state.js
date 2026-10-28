import {RhythmHeat} from './rhythm-heat.js';
import {sequences,dinnerChoices,chargeLines,chatterGroups,hotspots,endingCaption,connectionPrompts,captchaLines,heatDemoLines,finalAmmoLines} from './mission-dialogue.js';

export const METER_TRAVEL=1.35;
export const METER_PERIOD=METER_TRAVEL*2;
export const CHARGE_DURATION=30;
export const SHOE_ORBIT_DURATION=8;
export const REWIND_DURATION=10;
export const HEAT_DEMO_DURATION=6;
export const RETURN_DURATION=3;
export const TOUR_DURATION=34;
export const LANDING_DURATION=sequences.landing.length*3;
export const HEAT_TARGET=.3;
export const FINAL_READY=9;
export const CHAPTERS=[{id:'intro',label:'晚餐與拍照'},{id:'cargo',label:'萬噸簽收'},{id:'terminal-deploy',label:'電網接通'},{id:'rewind',label:'三小時前'},{id:'last',label:'最後一擊'}];
export const CONNECTION_ACCOUNT='endfield_power';
export const CONNECTION_PASSWORD='5201314';
export const outputModes=[
  {id:'steady',label:'穩定輸出',hint:'容易命中',multiplier:1,speed:1,width:.18,miss:.38,perfect:.06,recoil:.7},
  {id:'strong',label:'提高火力',hint:'判定較窄',multiplier:1.2,speed:1.2,width:.15,miss:.34,perfect:.05,recoil:1.15},
  {id:'overload',label:'過載輸出',hint:'判定最窄',multiplier:1.5,speed:1.45,width:.12,miss:.29,perfect:.04,recoil:1.8},
];
const manualPhases=new Set(['intro','meal','cargo','photo-talk','photo-check','observation','credentials','verify-talk','verified-talk','briefing','energy','flashback','flashback-end','last','complete']);
const vcrPhases=new Set(['rewind','flashback','hack','credentials','heat-demo','heat','flashback-end','return']);
const preChargePhases=new Set(['ready','intro','purchase','choice','meal','briefing','login','captcha','lever','ascent','director-reminder','shoe-view','pylon-link']);
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
export function meterPosition(elapsed,period=METER_PERIOD){const p=((elapsed%period)+period)%period/(period/2);return p<=1?p:2-p;}
export function judgeMeter(position,final=false,settings=outputModes[0]){
  const distance=Math.abs(position-.5);
  if(distance>=settings.miss||(final&&distance>settings.width))return {result:'miss',power:0,damage:0};
  const power=Math.max(0,1-distance/settings.miss),result=distance<=settings.perfect?'perfect':distance<=settings.width?'strong':'hit';
  return {result,power,damage:Math.round((result==='perfect'?18:result==='strong'?13:8)*settings.multiplier)};
}

// One monotonic scene source clock owns dialogue, input, VCR and cinematics. No timers or RAF.
export class MissionMachine{
  constructor(hooks={}){
    this.hooks=hooks;this.time=0;this.sourceTime=0;this.phase='ready';this.entered=0;this.nodeEntered=0;
    this.node=null;this.lines=[];this.index=0;this.branch=null;this.progress=0;this.paused=false;this.auto=false;
    this.revealed=0;this.revision=0;this.shots=0;this.hits=0;this.lastAttack=-Infinity;this.feedback=null;
    this.targets=[];this.target=null;this.ended=false;this.quietUntil=Infinity;this.chatDeck=[];this.lastChat=-1;
    this.chatCounts={};this.cooldowns={};this.lastHotspot=-Infinity;this.randomState=71130;this.sequenceKind=null;
    this.output='steady';this.meterEntered=0;this.attackHoldUntil=0;this.purchaseStarted=null;this.shoeOrbitStart=0;this.shoeRounds=0;
    this.castingEntered=null;this.castingPaused=0;this.castingFrozen=0;this.vcrStarted=null;this.vcrSnapshot=null;
    this.resetInteraction();
  }
  resetInteraction(){
    this.flightStableAt=null;this.failures={};this.seenHeatFailures=0;this.flight=null;this.loginAside='';this.asideCounts={};this.investigation=null;this.photoTaken=false;this.hackTurns=[1,2,3,1];this.hackMoves=0;this.hackFailures=0;this.rhythm=new RhythmHeat();
    this.connection={field:'account',account:'',password:'',lastKey:'',keyAt:-Infinity,keyNumber:0,error:'',verified:false,lever:0};

  }
  random(){this.randomState=(this.randomState*1664525+1013904223)>>>0;return this.randomState/4294967296;}
  emit(){this.revision++;this.hooks.onState?.(this.state);}
  action(type,value,extra={}){this.hooks.onAction?.({type,value,time:this.time,...extra});}
  phaseTo(phase,entered=this.time){
    this.phase=phase;this.entered=entered;this.lines=[];this.index=0;this.node=null;this.revealed=0;this.sequenceKind=null;
    this.meterEntered=entered;
    if(phase==='login'){
      this.line(connectionPrompts.account,entered);
    }
    if(phase==='verify-talk'){this.lines=captchaLines;this.line(captchaLines[0],entered);}
    if(phase==='lever')this.line(connectionPrompts.verified,entered);
    if(phase==='charge'){this.castingEntered=entered;this.line(chargeLines[0],entered);}
    if(phase==='shoe-view'){this.shoeOrbitStart=entered;this.shoeRounds=0;}
    if(phase==='fire-ready')this.line({id:'fire_ready',speaker:'system',text:'充能完畢。進入發射系統。指針接近中央時按下砲擊。',gesture:'look'},entered);
    if(phase==='rewind'){
      this.castingFrozen=this.castingElapsed;
      this.vcrStarted=entered;
      this.vcrSnapshot={progress:this.progress,branch:this.branch,shots:this.shots,hits:this.hits,output:this.output,target:this.target};
      this.action('vcr-freeze',true,{snapshot:{...this.vcrSnapshot}});
    }
    if(phase==='terminal-deploy')this.line({id:'terminal_book',speaker:'zhuang',text:'BOOK！',gesture:'point',event:'book-open'},entered);
    if(phase==='heat-demo')this.line(heatDemoLines[0],entered);
    if(phase==='heat')this.line(connectionPrompts.heat,entered);
    if(phase==='return')this.line(connectionPrompts.returned,entered);
    if(phase==='aim-final')this.line(finalAmmoLines[0],entered);
    if(phase==='landing')this.line(sequences.landing[0],entered);
    if(phase==='tour')this.progress=100;
    if(phase==='complete'){this.progress=100;this.ended=true;this.quietUntil=this.time+8+this.random()*6;}
    if(phase==='aim-final')this.meterEntered=entered+FINAL_READY;
    this.hooks.onStage?.(phase,this.state);this.emit();
  }
  line(node,entered=this.time){this.node=node;this.nodeEntered=entered;this.revealed=0;if(node?.id==='intro_9')this.purchaseStarted=entered;this.hooks.onGesture?.(node?.gesture||'hold',node||{speaker:'zhuang'});this.emit();}
  sequence(phase,lines){this.phaseTo(phase);this.lines=lines;this.index=0;this.line(lines[0]);}
  start(){
    this.branch=null;this.progress=0;this.ended=false;this.paused=false;this.shots=0;this.hits=0;this.lastAttack=-Infinity;this.feedback=null;
    this.output='steady';this.attackHoldUntil=0;this.castingEntered=null;this.castingPaused=0;this.castingFrozen=0;this.vcrStarted=null;this.vcrSnapshot=null;this.purchaseStarted=null;this.shoeOrbitStart=0;this.shoeRounds=0;this.resetInteraction();
    this.chatDeck=[];this.lastChat=-1;this.chatCounts={};this.cooldowns={};this.lastHotspot=-Infinity;this.quietUntil=Infinity;this.target=this.targets[0]?.id??null;
    this.hooks.onDinner?.(null);this.sequence('intro',sequences.intro);return true;
  }
  replay(){this.start();return true;}
  setTargets(targets){this.targets=Array.isArray(targets)?targets.map((v,i)=>({id:v.id??i,label:v.label||`目標 ${i+1}`,position:v.position})):[];this.target=this.targets[0]?.id??null;this.emit();}
  selectTarget(id){
    if(!['combat','aim-final'].includes(this.phase)||this.paused)return false;
    const target=this.targets.find(v=>String(v.id)===String(id));if(!target)return false;
    this.target=target.id;this.emit();return true;
  }
  finishSequence(){
    if(this.phase==='intro'){this.branch='A';this.hooks.onDinner?.('A');this.phaseTo('purchase');}
    else if(this.phase==='meal')this.sequence('briefing',sequences.briefing);
    else if(this.phase==='verify-talk')this.phaseTo('captcha');
    else if(this.phase==='verified-talk')this.phaseTo('lever');
    else if(this.phase==='briefing')this.phaseTo('terminal-deploy');
    else if(this.phase==='energy')this.phaseTo('rewind');
    else if(this.phase==='flashback')this.phaseTo('hack');
    else if(this.phase==='credentials')this.phaseTo('heat');
    else if(this.phase==='photo-talk'){this.flight={x:-2,z:3.25,vx:0,vz:0};this.phaseTo('photo-flight');}
    else if(this.phase==='photo-check')this.phaseTo('photo-review');
    else if(this.phase==='cargo')this.sequence('observation',sequences.observation);
    else if(this.phase==='observation')this.phaseTo('comm-request');
    else if(this.phase==='flashback-end')this.phaseTo('return');
    else if(this.phase==='last')this.phaseTo('aim-final');
    else if(this.phase==='complete'){this.node=null;this.lines=[];this.sequenceKind=null;this.quietUntil=this.time+8+this.random()*6;this.emit();}
  }
  next(){
    if(this.phase==='shoe-view'&&!this.paused&&this.shoeReady){this.phaseTo('pylon-link');return true;}
    if(this.phase==='fire-ready'&&!this.paused){this.phaseTo('combat');return true;}
    if(this.paused||this.state.presentationLocked||!this.node||!manualPhases.has(this.phase))return false;
    if(this.revealed<this.node.text.length){this.revealed=this.node.text.length;this.emit();return true;}
    if(++this.index<this.lines.length)this.line(this.lines[this.index]);else this.finishSequence();return true;
  }
  skip(){if(this.state.presentationLocked||this.paused||!manualPhases.has(this.phase))return false;this.finishSequence();return true;}
  get shoeReady(){return this.phase==='shoe-view'&&this.time-this.shoeOrbitStart>=SHOE_ORBIT_DURATION;}
  anotherBowl(){if(!this.shoeReady||this.paused)return false;this.shoeRounds++;this.shoeOrbitStart=this.time;this.emit();return true;}
  choose(id){
    if(this.phase!=='choice'||this.paused||!dinnerChoices.some(v=>v.id===id))return false;
    this.branch=id;this.hooks.onDinner?.(id);this.sequence('meal',sequences['meal'+id]);return true;
  }
  stepFlight(d){if(this.phase!=='photo-flight'||this.paused)return;this.flight.z=clamp(this.flight.z+d*.3,3.25,12);this.flight.x=-2+2*clamp((this.flight.z-5)/5.5);this.emit();}
  fly(x,z){if(this.phase!=='photo-flight'||this.paused)return false;this.flight.vx=Math.max(-1,Math.min(1,x));this.flight.vz=Math.max(-1,Math.min(1,z));return true;}
  finishFlight(){if(this.phase!=='photo-flight'||this.paused||Math.abs(this.flight.z-10.5)>.6||this.time-(this.flightStableAt??this.time)<.5)return false;this.phaseTo('photo');return true;}
  takePhoto(){if(this.phase!=='photo'||this.paused)return false;this.photoTaken=true;this.phaseTo('photo-return');return true;}
  sendPhoto(){if(this.phase!=='photo-review'||this.paused)return false;this.investigation='floor';this.phaseTo('photo-sending');this.line({id:'photo_sent',speaker:'dragon',text:'送出了。',gesture:'phone',event:'photo-send'});this.action('photo-send',true);return true;}
  investigate(id){
    if(this.phase!=='investigate'||this.paused||!['floor','server'].includes(id))return false;
    this.investigation=id;this.sequence(id==='floor'?'cargo':'observation',sequences[id==='floor'?'cargo':'observation']);return true;
  }
  acceptCall(){if(this.phase!=='comm-request'||this.paused)return false;this.sequence('briefing',sequences.briefing);return true;}
  hackRotate(index){
    if(this.phase!=='hack'||this.paused||!Number.isInteger(index)||index<0||index>3)return false;
    this.hackTurns[index]=(this.hackTurns[index]+1)%4;this.hackMoves++;this.action('hack-turn',index);
    this.emit();return true;
  }
  hackSubmit(){
    if(this.phase!=='hack'||this.paused)return false;
    // U-shaped path: top-left → bottom-left → bottom-right → top-right.
    if(this.hackTurns.every((v,i)=>v===[1,0,2,3][i]))this.sequence('credentials',sequences.credentials);
    else{this.recordFailure('hack');this.hackFailures++;this.action('hack-failed',this.hackFailures);this.emit();}return true;
  }
  keyChunk(value){
    if(this.paused||this.phase!=='login')return false;
    const expected=this.connection.field==='account'?['endfield','_','power']:['520','1314'];
    if(![...expected,'admin','love','boss','kiss','0000','8888'].includes(value))return false;const c0=this.connection;(c0.chunks??=[]).push(value);
    for(const c of value)if(!this.key(c))return false;
    if(!expected.slice(0,(this.connection.chunks||[]).length).every((v,i)=>v===this.connection.chunks[i]))this.recordFailure('login');this.commentLogin();const c=this.connection;if(c[c.field]===(c.field==='account'?CONNECTION_ACCOUNT:CONNECTION_PASSWORD))this.submitLogin();return true;
  }
  commentLogin(correct=false){const value=this.connection.account;const kind=correct?'correct':value.includes('kiss')?'kiss':value.includes('love')?'love':'wrong';const pool=kind==='kiss'?['等等，誰親誰？這是帳號欄！']:kind==='love'?['等等，誰愛誰？這是帳號欄！']:kind==='correct'?['帳號對了。接著輸入密碼。']:['你輸入的是帳號，還是辦公室八卦？','電網還沒接通，人際關係先短路了。'];const n=this.asideCounts[kind]||0;this.asideCounts[kind]=n+1;this.loginAside=pool[n%pool.length];}
  key(value){
    if(this.paused||this.phase!=='login'||typeof value!=='string')return false;
    const c=this.connection,field=c.field;let next=c[field];
    if(['backspace','Backspace','⌫'].includes(value)){const chunk=c.chunks?.pop();next=next.slice(0,-(chunk?.length||1));}
    else if(['clear','Clear'].includes(value))next='';
    else{
      if(value.length!==1||(field==='password'?!/^[0-9]$/.test(value):!/^[a-z_]$/.test(value))||next.length>=(field==='password'?16:32))return false;
      next+=value;
    }
    c[field]=next;if(value==='backspace')this.commentLogin();c.error='';c.lastKey=value;c.keyAt=this.time;c.keyNumber++;
    this.action('key',value,{field,keyNumber:c.keyNumber});this.emit();return true;
  }
  submitLogin(){
    if(this.paused||this.phase!=='login')return false;
    const c=this.connection,expected=c.field==='account'?CONNECTION_ACCOUNT:CONNECTION_PASSWORD;
    if(c[c.field]!==expected){this.recordFailure('login');c.error=c.field==='account'?'帳號不對。可重聽提示，再修改。':'密碼不對。可退格修改。';this.action('login-error',c.field);this.emit();return false;}
    c.error='';this.commentLogin(true);
    if(c.field==='account'){c.field='password';c.chunks=[];this.line(connectionPrompts.password);this.action('login-account',true);this.emit();}
    else {this.action('login-complete',true);this.phaseTo('verify-talk');}
    return true;
  }
  replayPrompt(){if(this.paused||this.phase!=='login')return false;this.line(connectionPrompts[this.connection.field]);this.action('dictation',this.connection.field);return true;}
  verify(){
    if(this.paused||this.phase!=='captcha')return false;
    this.connection.verified=true;this.connection.error='';this.action('verify',true);this.sequence('verified-talk',[connectionPrompts.verified]);return true;
  }
  setLever(value){
    if(this.paused||this.phase!=='lever'||!Number.isFinite(value))return false;
    this.connection.lever=clamp(value);this.action('lever',this.connection.lever);this.emit();
    if(this.connection.lever>=.98){this.connection.lever=1;this.action('grid-connect',true);this.phaseTo('ascent');this.line({id:'ascent_authorized',speaker:'system',text:'系統：允許起飛。',gesture:'look'});}
    return true;
  }
  logicalInput(sourceTime){return this.time+(Number.isFinite(sourceTime)?sourceTime-this.sourceTime:0);}
  heatStart(sourceTime){
    if(this.paused||this.phase!=='heat')return false;
    const time=this.logicalInput(sourceTime);let result;
    if(this.rhythm.status==='ready')result=this.rhythm.start(time);else result=this.rhythm.down(time);
    this.action('heat-start',result);this.emit();return result;
  }
  heatStop(sourceTime){if(this.paused||this.phase!=='heat')return false;const ok=this.rhythm.up(this.logicalInput(sourceTime));this.emit();return ok;}
  heatRetry(){if(this.paused||this.phase!=='heat')return false;const ok=this.rhythm.retry();this.emit();return ok;}
  heatCancel(){if(this.phase!=='heat')return false;this.rhythm.cancel();this.emit();return true;}
  setAuto(value){this.auto=Boolean(value);this.emit();}
  setPaused(value){if(value&&this.rhythm.status==='playing')this.heatCancel();this.paused=Boolean(value);this.emit();}
  holdAttack(seconds){if(!Number.isFinite(seconds)||seconds<0)return false;this.attackHoldUntil=Math.max(this.attackHoldUntil,this.time+seconds);this.emit();return true;}
  setOutput(id){
    if(this.paused||this.phase!=='combat'||!outputModes.some(mode=>mode.id===id))return false;
    if(this.output===id)return true;
    this.output=id;this.meterEntered=this.time;this.emit();return true;
  }
  get meterSettings(){
    const final=this.phase==='aim-final',mode=final?outputModes[1]:outputModes.find(v=>v.id===this.output)||outputModes[0];
    const stage=Math.min(3,Math.floor(this.progress/27));
    return {...mode,period:METER_PERIOD/(mode.speed*(1+stage*.1)),stage};
  }
  meterAt(sourceTime=this.sourceTime){const advance=this.paused?0:(Number.isFinite(sourceTime)?sourceTime-this.sourceTime:0);return meterPosition(Math.max(0,this.time+advance-this.meterEntered),this.meterSettings.period);}
  attack(sourceTime){
    if(this.paused||this.state.presentationLocked||!['combat','aim-final'].includes(this.phase))return false;
    const inputTime=this.logicalInput(sourceTime);
    if(Number.isFinite(sourceTime)&&sourceTime>this.sourceTime)this.update(sourceTime);
    if(inputTime<this.meterEntered||this.time<this.attackHoldUntil||this.time-this.lastAttack<.6)return false;
    const final=this.phase==='aim-final',settings=this.meterSettings,position=meterPosition(inputTime-this.meterEntered,settings.period),judgement=judgeMeter(position,final,settings);
    this.shots++;this.lastAttack=this.time;if(judgement.result==='miss')this.recordFailure(this.phase);
    if(judgement.result!=='miss'){this.hits++;if(!final)this.progress=Math.min(99,this.progress+judgement.damage);}
    const event={...judgement,position,progress:this.progress,target:final?'server':this.target,finisher:final&&judgement.result!=='miss',finalAttempt:final,time:this.time,number:this.shots,mode:settings.id,recoil:settings.recoil};
    this.feedback=event;this.meterEntered=this.time;
    if(event.finisher)this.phaseTo('finisher');
    this.emit();this.hooks.onAttack?.(event);
    if(!final&&this.progress>=99)this.sequence('energy',sequences.energy);
    return event;
  }
  recordFailure(phase){this.failures[phase]=(this.failures[phase]||0)+1;}
  assist(){
    if(this.paused||!this.state.canAssist||this.state.presentationLocked)return false;
    if(this.phase==='login'){this.connection.account=CONNECTION_ACCOUNT;this.connection.password=CONNECTION_PASSWORD;this.connection.field='password';return this.submitLogin();}
    if(this.phase==='hack'){this.hackTurns=[1,0,2,3];return this.hackSubmit();}
    if(this.phase==='heat'){this.rhythm.cancel();this.rhythm.round=3;this.rhythm.status='won';this.action('heat-assisted',true);this.sequence('flashback-end',sequences['flashback-end']);return true;}
    if(['combat','aim-final'].includes(this.phase)){const target=this.phase;this.meterEntered=this.time-this.meterSettings.period/4;this.lastAttack=-Infinity;this.attackHoldUntil=this.time;if(target==='combat')this.progress=Math.max(85,this.progress);return this.attack();}
    return false;
  }
  restoreChapter(id,branch='A'){
    if(!CHAPTERS.some(c=>c.id===id))return false;
    this.start();this.branch=['A','B','C'].includes(branch)?branch:'A';this.hooks.onDinner?.(this.branch);
    if(id==='intro')return true;
    this.purchaseStarted=null;this.investigation='floor';this.connection.verified=true;
    if(['rewind','last'].includes(id)){this.progress=99;this.castingEntered=this.time-30;}
    this.hooks.onRestore?.(id,this.state);
    if(id==='cargo'||id==='last')this.sequence(id,sequences[id]);else this.phaseTo(id);
    return true;
  }
  runChat(lines,kind){this.lines=lines;this.index=0;this.sequenceKind=kind;this.line(lines[0]);}
  nextChat(){
    if(!this.chatDeck.length){
      this.chatDeck=chatterGroups.map((_,i)=>i);
      for(let i=this.chatDeck.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.chatDeck[i],this.chatDeck[j]]=[this.chatDeck[j],this.chatDeck[i]];}
      if(this.chatDeck.at(-1)===this.lastChat)[this.chatDeck[0],this.chatDeck[this.chatDeck.length-1]]=[this.chatDeck.at(-1),this.chatDeck[0]];
    }
    this.lastChat=this.chatDeck.pop();this.runChat(chatterGroups[this.lastChat],'chat');
  }
  hotspot(kind){
    if(this.paused||this.phase!=='complete'||this.node||!hotspots[kind]||this.time-(this.cooldowns[kind]??-Infinity)<6||this.time-this.lastHotspot<2.8)return false;
    const count=this.chatCounts[kind]||0;this.chatCounts[kind]=count+1;this.cooldowns[kind]=this.time;this.lastHotspot=this.time;
    this.runChat(hotspots[kind][count%hotspots[kind].length],'hotspot');return true;
  }
  timedLine(nodes,elapsed,step=0){
    let index=0;for(let i=1;i<nodes.length;i++)if((nodes[i].at??i*step)<=elapsed)index=i;
    if(this.node!==nodes[index])this.line(nodes[index],this.entered+(nodes[index].at??index*step));
  }
  restorePresent(){
    if(this.vcrSnapshot){const s=this.vcrSnapshot;this.progress=s.progress;this.branch=s.branch;this.shots=s.shots;this.hits=s.hits;this.output=s.output;this.target=s.target;}
    if(this.vcrStarted!==null)this.castingPaused+=this.time-this.vcrStarted;
    this.vcrStarted=null;this.action('vcr-return',true,{snapshot:this.vcrSnapshot?{...this.vcrSnapshot}:null});
    this.sequence('last',sequences.last);
  }
  update(sourceTime){
    if(!Number.isFinite(sourceTime))return;
    const delta=Math.max(0,sourceTime-this.sourceTime);this.sourceTime=Math.max(this.sourceTime,sourceTime);
    if(this.paused)return;this.time+=delta;if(this.phase==='photo-flight'&&this.flight){const f=this.flight,dt=Math.min(.1,delta);f.x=-2+2*Math.max(0,Math.min(1,(f.z-5)/5.5));f.z=Math.max(3.25,Math.min(12,f.z+f.vz*3*dt));}
    if(this.phase==='photo-flight'){if(Math.abs(this.flight.z-10.5)>.6)this.flightStableAt=null;else this.flightStableAt??=this.time;}
    // Catch up continuous cinematics after a late frame, but stop on every manual or input gate.
    for(let guard=0;guard<10;guard++){
      const elapsed=this.time-this.entered,phase=this.phase;let changed=false;
      if(phase==='ascent'&&elapsed>=5){this.phaseTo('director-reminder',this.entered+5);this.line({id:'director_reminder_0',speaker:'dragon',text:'等等！導播，這邊重點不要漏掉！要照顧一下玩家！',gesture:'point'});changed=true;}
      else if(phase==='director-reminder'&&elapsed>=5){this.phaseTo('shoe-view',this.entered+5);changed=true;}
      else if(phase==='pylon-link'&&elapsed>=4){this.phaseTo('charge',this.entered+4);changed=true;}
      else if(phase==='charge'&&elapsed>=CHARGE_DURATION){this.phaseTo('fire-ready',this.entered+CHARGE_DURATION);changed=true;}
      else if(phase==='terminal-deploy'&&elapsed>=6){this.phaseTo('login',this.entered+6);changed=true;}
      else if(phase==='photo-sending'&&elapsed>=1.2){this.sequence('cargo',sequences.cargo);changed=true;}
      else if(phase==='photo-return'&&elapsed>=2.5){this.sequence('photo-check',sequences.photoCheck);changed=true;}
      else if(phase==='purchase'&&elapsed>=Math.max(0,6-(this.purchaseStarted===null?0:this.entered-this.purchaseStarted))){this.phaseTo('walk-out');changed=true;}
      else if(phase==='walk-out'&&elapsed>=5){this.phaseTo('photo-pose',this.entered+5);changed=true;}
      else if(phase==='photo-pose'&&elapsed>=2){this.sequence('photo-talk',sequences.photoTalk);changed=true;}
      else if(phase==='rewind'&&elapsed>=REWIND_DURATION){this.sequence('flashback',sequences.flashback);changed=true;}
      else if(phase==='heat-demo'&&elapsed>=HEAT_DEMO_DURATION){this.phaseTo('heat',this.entered+HEAT_DEMO_DURATION);changed=true;}
      else if(phase==='return'&&elapsed>=RETURN_DURATION){this.restorePresent();changed=true;}
      else if(phase==='finisher'&&elapsed>=9){this.phaseTo('landing',this.entered+9);changed=true;}
      else if(phase==='landing'&&elapsed>=LANDING_DURATION){this.phaseTo('tour',this.entered+LANDING_DURATION);changed=true;}
      else if(phase==='tour'&&elapsed>=TOUR_DURATION){this.phaseTo('complete',this.entered+TOUR_DURATION);changed=true;}
      if(!changed)break;
    }
    const elapsed=Math.max(0,this.time-this.entered);
    if(this.phase==='charge')this.timedLine(chargeLines,elapsed);
    else if(this.phase==='director-reminder'&&elapsed>=2.7&&this.node?.id!=='director_reminder_1')this.line({id:'director_reminder_1',speaker:'system',text:'導播：差點忘了，謝謝龍董。',gesture:'look'},this.entered+2.7);

    else if(this.phase==='lever'&&elapsed>=3&&this.node!==connectionPrompts.lever)this.line(connectionPrompts.lever,this.entered+3);
    else if(this.phase==='heat-demo')this.timedLine(heatDemoLines,elapsed);
    else if(this.phase==='aim-final')this.timedLine(finalAmmoLines,elapsed);
    else if(this.phase==='landing')this.timedLine(sequences.landing,elapsed,3);
    if(this.phase==='heat'){
      const revision=this.rhythm.revision;this.rhythm.update(this.time);
      if(this.rhythm.failures>this.seenHeatFailures){if(!this.rhythm.forced)this.recordFailure('heat');this.seenHeatFailures=this.rhythm.failures;}
      if(this.rhythm.revision!==revision){this.action('heat-stop',this.rhythm.status==='burnt'?'burnt':'charged',{forced:this.rhythm.forced});this.emit();}
      if(this.rhythm.status==='won')this.sequence('flashback-end',sequences['flashback-end']);
    }
    if(this.phase==='complete'&&!this.epiloguePending&&!this.node&&this.time>=this.quietUntil){this.nextChat();return;}
    if(this.node){
      const textLength=this.node.text.length,nodeElapsed=this.time-this.nodeEntered;
      const revealed=['charge','captcha','lever','heat-demo','heat','return','aim-final','landing'].includes(this.phase)?textLength:Math.min(textLength,Math.floor(nodeElapsed*30));
      if(revealed>this.revealed){this.revealed=revealed;this.emit();}
      if((this.auto||this.phase==='complete')&&manualPhases.has(this.phase)&&nodeElapsed>=Math.max(3.3,textLength/30+1.7)){
        this.revealed=textLength;this.next();
      }
    }
  }
  get castingElapsed(){return this.castingEntered===null?0:this.vcrStarted!==null?this.castingFrozen:Math.max(0,this.time-this.castingEntered-this.castingPaused);}
  get state(){
    const elapsed=Math.max(0,this.time-this.entered),meter=this.meterAt(),target=this.targets.find(v=>v.id===this.target),settings=this.meterSettings,c=this.connection;
    const connection={...c,value:c[c.field],expected:c.field==='account'?CONNECTION_ACCOUNT:CONNECTION_PASSWORD,captchaReady:this.phase==='captcha'};
    const heat=this.rhythm.state(this.time);
    const vcr=vcrPhases.has(this.phase),combatHoldRemaining=Math.max(0,this.attackHoldUntil-this.time),reverse=clamp((elapsed-.4)/(REWIND_DURATION-1));
    const rewindProgress=this.phase==='rewind'?reverse*reverse*(3-2*reverse):0,rewindStage=this.phase!=='rewind'?null:elapsed<.4?'freeze':elapsed>=REWIND_DURATION-.6?'settle':'reverse';
    return {phase:this.phase,node:this.node,nodeId:this.node?.id||null,nodeElapsed:this.node?Math.max(0,this.time-this.nodeEntered):0,speaker:this.node?.speaker||null,text:this.node?.text||'',revealed:this.revealed,
      branch:this.branch,choices:this.phase==='choice'?dinnerChoices:[],waitingChoice:this.phase==='choice',progress:this.progress,
      energy:Math.max(0,100-this.progress/99*100),charge:this.phase==='charge'?Math.min(100,30+elapsed/CHARGE_DURATION*70):this.phase==='ascent'?Math.min(30,Math.max(0,elapsed-1)*7.5):['director-reminder','shoe-view','pylon-link'].includes(this.phase)?30:preChargePhases.has(this.phase)?0:100,
      meter,meterElapsed:Math.max(0,this.time-this.meterEntered),meterPeriod:settings.period,meterSettings:settings,output:this.output,outputModes,
      landingDuration:LANDING_DURATION,tourDuration:TOUR_DURATION,chargeDuration:CHARGE_DURATION,rewindDuration:REWIND_DURATION,returnDuration:RETURN_DURATION,heatDemoDuration:HEAT_DEMO_DURATION,
      phaseElapsed:elapsed,time:this.time,clock:this.time,sourceTime:this.sourceTime,paused:this.paused,auto:this.auto,castingElapsed:this.castingElapsed,
      loginAside:this.loginAside,purchaseElapsed:this.purchaseStarted===null?null:Math.max(0,this.time-this.purchaseStarted),shoeReady:this.shoeReady,shoeOrbitElapsed:this.phase==='shoe-view'?Math.max(0,this.time-this.shoeOrbitStart):0,shoeRounds:this.shoeRounds,flight:this.flight?{...this.flight,ready:Math.abs(this.flight.z-10.5)<=.6&&this.time-(this.flightStableAt??this.time)>=.5}:null,investigation:this.investigation,photoTaken:this.photoTaken,hack:{turns:[...this.hackTurns],moves:this.hackMoves,failures:this.hackFailures},connection,login:connection,heat,vcr,rewindProgress,rewindStage,returnProgress:this.phase==='return'?clamp(elapsed/RETURN_DURATION):0,vcrElapsed:vcr&&this.vcrStarted!==null?Math.max(0,this.time-this.vcrStarted):0,replayStage:vcr?this.phase:null,vcrSnapshot:this.vcrSnapshot?{...this.vcrSnapshot}:null,
      target:this.target,targetLabel:target?.label||'店面外牆',targets:this.targets,feedback:this.feedback,shots:this.shots,hits:this.hits,attackHoldUntil:this.attackHoldUntil,combatHoldRemaining,attackHeld:combatHoldRemaining>0,
      presentationLocked:this.node?.event==='dragon-capture'&&this.time-this.nodeEntered<2.1||this.node?.event==='pear-tour'&&this.time-this.nodeEntered<6||this.phase==='photo-check'&&elapsed<5||this.phase==='aim-final'&&elapsed<FINAL_READY||this.phase==='photo-talk'&&this.node?.event==='camera-handover'&&this.time-this.nodeEntered<1.5,failures:{...this.failures},canAssist:(this.failures[this.phase]||0)>=5,
      canAttack:(this.phase!=='aim-final'||elapsed>=FINAL_READY)&&['combat','aim-final'].includes(this.phase)&&!this.paused&&this.time-this.lastAttack>=.6&&combatHoldRemaining===0,
      ended:this.ended,busy:!!this.node||!['ready','complete'].includes(this.phase),sequenceKind:this.sequenceKind,endingCaption,revision:this.revision};
  }
}
