import {sequences,dinnerChoices,chargeLines,chatterGroups,hotspots,endingCaption} from './mission-dialogue.js';

export const METER_TRAVEL=1.35;
export const METER_PERIOD=METER_TRAVEL*2;
export function meterPosition(elapsed){const p=((elapsed%METER_PERIOD)+METER_PERIOD)%METER_PERIOD/METER_TRAVEL;return p<=1?p:2-p;}
export function judgeMeter(position,final=false){
  const distance=Math.abs(position-.5);
  if(distance>=.38||(final&&distance>.18))return {result:'miss',power:0,damage:0};
  const power=Math.max(0,1-distance/.38);
  return {result:distance<=.06?'perfect':distance<=.18?'strong':'hit',power,damage:distance<=.06?18:distance<=.18?13:8};
}

// One scene clock owns text, charge, shots and the final animation. No timers or RAF.
export class MissionMachine{
  constructor(hooks={}){
    this.hooks=hooks;this.time=0;this.sourceTime=0;this.phase='ready';this.entered=0;this.nodeEntered=0;
    this.node=null;this.lines=[];this.index=0;this.branch=null;this.progress=0;this.paused=false;this.auto=false;
    this.revealed=0;this.revision=0;this.shots=0;this.hits=0;this.lastAttack=-Infinity;this.feedback=null;
    this.targets=[];this.target=null;this.ended=false;this.quietUntil=Infinity;this.chatDeck=[];this.lastChat=-1;
    this.chatCounts={};this.cooldowns={};this.lastHotspot=-Infinity;this.randomState=71130;this.sequenceKind=null;
  }
  random(){this.randomState=(this.randomState*1664525+1013904223)>>>0;return this.randomState/4294967296;}
  emit(){this.revision++;this.hooks.onState?.(this.state);}
  phaseTo(phase,entered=this.time){
    this.phase=phase;this.entered=entered;this.lines=[];this.index=0;this.node=null;this.revealed=0;this.sequenceKind=null;
    if(phase==='charge')this.line(chargeLines[0],entered);
    if(phase==='landing')this.line(sequences.landing[0],entered);
    if(phase==='complete'){this.progress=100;this.ended=true;this.quietUntil=this.time+8+this.random()*6;}
    this.hooks.onStage?.(phase,this.state);this.emit();
  }
  line(node,entered=this.time){this.node=node;this.nodeEntered=entered;this.revealed=0;this.hooks.onGesture?.(node?.gesture||'hold',node||{speaker:'zhuang'});this.emit();}
  sequence(phase,lines){this.phaseTo(phase);this.lines=lines;this.index=0;this.line(lines[0]);}
  start(){
    this.branch=null;this.progress=0;this.ended=false;this.paused=false;this.shots=0;this.hits=0;this.lastAttack=-Infinity;this.feedback=null;
    this.chatDeck=[];this.lastChat=-1;this.chatCounts={};this.cooldowns={};this.lastHotspot=-Infinity;this.quietUntil=Infinity;this.target=this.targets[0]?.id??null;
    this.hooks.onDinner?.(null);this.sequence('intro',sequences.intro);return true;
  }
  replay(){this.start();this.phaseTo('choice');return true;}
  setTargets(targets){this.targets=Array.isArray(targets)?targets.map((v,i)=>({id:v.id??i,label:v.label||`目標 ${i+1}`,position:v.position})):[];this.target=this.targets[0]?.id??null;this.emit();}
  selectTarget(id){
    if(!['combat','aim-final'].includes(this.phase)||this.paused)return false;
    const target=this.targets.find(v=>String(v.id)===String(id));if(!target)return false;
    this.target=target.id;this.emit();return true;
  }
  finishSequence(){
    if(this.phase==='intro')this.phaseTo('choice');
    else if(this.phase==='meal')this.sequence('briefing',sequences.briefing);
    else if(this.phase==='briefing')this.phaseTo('charge');
    else if(this.phase==='last')this.phaseTo('aim-final');
    else if(this.phase==='complete'){this.node=null;this.lines=[];this.sequenceKind=null;this.quietUntil=this.time+8+this.random()*6;this.emit();}
  }
  next(){
    if(this.paused||!this.node||!['intro','meal','briefing','last','complete'].includes(this.phase))return false;
    if(this.revealed<this.node.text.length){this.revealed=this.node.text.length;this.emit();return true;}
    if(++this.index<this.lines.length)this.line(this.lines[this.index]);else this.finishSequence();return true;
  }
  skip(){if(this.paused||!['intro','meal','briefing','last','complete'].includes(this.phase))return false;this.finishSequence();return true;}
  choose(id){
    if(this.phase!=='choice'||this.paused||!dinnerChoices.some(v=>v.id===id))return false;
    this.branch=id;this.hooks.onDinner?.(id);this.sequence('meal',sequences['meal'+id]);return true;
  }
  setAuto(value){this.auto=Boolean(value);this.emit();}
  setPaused(value){this.paused=Boolean(value);this.emit();}
  meterAt(sourceTime=this.sourceTime){const advance=this.paused?0:(Number.isFinite(sourceTime)?sourceTime-this.sourceTime:0);return meterPosition(Math.max(0,this.time+advance-this.entered));}
  attack(sourceTime){
    if(this.paused||!['combat','aim-final'].includes(this.phase))return false;
    const inputTime=Number.isFinite(sourceTime)?this.time+sourceTime-this.sourceTime:this.time;
    if(Number.isFinite(sourceTime)&&sourceTime>this.sourceTime)this.update(sourceTime);
    if(inputTime<this.entered)return false;
    if(this.time-this.lastAttack<.6)return false;
    const final=this.phase==='aim-final',position=meterPosition(inputTime-this.entered),judgement=judgeMeter(position,final);
    this.shots++;this.lastAttack=this.time;
    if(judgement.result!=='miss'){this.hits++;if(!final)this.progress=Math.min(99,this.progress+judgement.damage);}
    const event={...judgement,position,progress:this.progress,target:final?'server':this.target,finisher:final&&judgement.result!=='miss',finalAttempt:final,time:this.time,number:this.shots};
    this.feedback=event;
    if(event.finisher)this.phaseTo('finisher');
    this.emit();this.hooks.onAttack?.(event);
    if(!final&&this.progress>=99)this.sequence('last',sequences.last);
    return event;
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
  update(sourceTime){
    if(!Number.isFinite(sourceTime))return;
    const delta=Math.max(0,sourceTime-this.sourceTime);this.sourceTime=Math.max(this.sourceTime,sourceTime);
    if(this.paused)return;this.time+=delta;
    if(this.phase==='charge'){
      const elapsed=this.time-this.entered;
      if(elapsed>=30){this.phaseTo('combat',this.entered+30);return;}
      let index=0;for(let i=1;i<chargeLines.length;i++)if(chargeLines[i].at<=elapsed)index=i;
      if(this.node!==chargeLines[index])this.line(chargeLines[index],this.entered+chargeLines[index].at);
    }
    if(this.phase==='finisher'&&this.time-this.entered>=9)this.phaseTo('landing',this.entered+9);
    if(this.phase==='landing'){
      const elapsed=this.time-this.entered;
      if(elapsed>=3){this.phaseTo('complete',this.entered+3);return;}
      const index=elapsed>=1.5?1:0;if(this.node!==sequences.landing[index])this.line(sequences.landing[index],this.entered+index*1.5);
    }
    if(this.phase==='complete'&&!this.node&&this.time>=this.quietUntil){this.nextChat();return;}
    if(this.node){
      const textLength=this.node.text.length,elapsed=this.time-this.nodeEntered;
      const revealed=['charge','landing'].includes(this.phase)?textLength:Math.min(textLength,Math.floor(elapsed*30));
      if(revealed>this.revealed){this.revealed=revealed;this.emit();}
      if((this.auto||this.phase==='complete')&&['intro','meal','briefing','last','complete'].includes(this.phase)&&elapsed>=Math.max(3.3,textLength/30+1.7)){
        this.revealed=textLength;this.next();
      }
    }
  }
  get state(){
    const elapsed=Math.max(0,this.time-this.entered),meter=this.meterAt(),target=this.targets.find(v=>v.id===this.target);
    return {phase:this.phase,node:this.node,nodeId:this.node?.id||null,speaker:this.node?.speaker||null,text:this.node?.text||'',revealed:this.revealed,
      branch:this.branch,choices:this.phase==='choice'?dinnerChoices:[],waitingChoice:this.phase==='choice',progress:this.progress,
      energy:Math.max(0,100-this.progress/99*100),charge:this.phase==='charge'?Math.min(100,elapsed/30*100):['ready','intro','choice','meal','briefing'].includes(this.phase)?0:100,
      meter,meterElapsed:elapsed,meterPeriod:METER_PERIOD,phaseElapsed:elapsed,time:this.time,clock:this.time,sourceTime:this.sourceTime,paused:this.paused,auto:this.auto,
      target:this.target,targetLabel:target?.label||'店面外牆',targets:this.targets,feedback:this.feedback,shots:this.shots,hits:this.hits,
      canAttack:['combat','aim-final'].includes(this.phase)&&!this.paused&&this.time-this.lastAttack>=.6,
      ended:this.ended,busy:!!this.node||!['ready','complete'].includes(this.phase),sequenceKind:this.sequenceKind,endingCaption,revision:this.revision};
  }
}
