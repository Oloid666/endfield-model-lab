import {nodes,chatGroups,hotspotGroups,branchTitles,segmentExits} from './dialogue.js';

// A single scene-clock-driven state machine. It does not own timers or a render loop.
export class StoryMachine {
  constructor(hooks={}){
    this.hooks=hooks;this.time=0;this.node=null;this.branch=null;this.phase='ready';this.ended=false;
    this.revealed=0;this.entered=0;this.auto=false;this.paused=false;this.quietUntil=Infinity;this.memory='';
    this.sequence=[];this.sequenceIndex=0;this.chatDeck=[];this.lastChat=-1;this.chatCounts={};this.cooldowns={};this.lastHotspot=-Infinity;this.randomState=71611;this.revision=0;
  }
  random(){this.randomState=(this.randomState*1664525+1013904223)>>>0;return this.randomState/4294967296;}
  text(){return this.node?.text||'';}
  resolve(id){return id==='$ending'?`ending_${this.branch||'A'}_0`:id;}
  enter(id){
    if(id==='$idle'||!id){this.toIdle();return;}
    const next=nodes[this.resolve(id)];if(!next)throw new Error(`Missing story node: ${id}`);
    this.node=next;this.phase=next.choices?'choice':next.segment==='ending'?'ending':'main';this.entered=this.time;this.revealed=0;this.revision++;
    if(next.ending)this.ended=true;
    if(next.scene)this.hooks.onScene?.(next.scene);
    this.hooks.onGesture?.(next.gesture,next);
    this.hooks.onState?.(this.state);
  }
  start(){this.branch=null;this.memory='';this.ended=false;this.sequence=[];this.hooks.onDinner?.(null);this.enter('opening_0');}
  replay(){this.sequence=[];this.sequenceIndex=0;this.ended=false;this.branch=null;this.memory='';this.cooldowns={};this.hooks.onDinner?.(null);this.enter('dinner_0');}
  next(){
    if(!this.node||this.paused)return false;
    if(this.revealed<this.text().length){this.revealed=this.text().length;this.revision++;return true;}
    if(this.node.choices)return false;
    if(this.phase==='chat'||this.phase==='hotspot'){
      this.sequenceIndex++;
      if(this.sequenceIndex<this.sequence.length)this.enterSequenceLine();else this.toIdle();
    }else this.enter(this.node.next);
    return true;
  }
  choose(id){
    if(this.paused||!this.node?.choices)return false;
    const choice=this.node.choices.find(item=>item.id===id);if(!choice)return false;
    if(choice.branch){this.branch=choice.branch;this.hooks.onDinner?.(this.branch);}
    if(choice.memory)this.memory=choice.memory;
    this.enter(choice.next);return true;
  }
  skip(){
    if(!this.node||this.node.choices||this.paused)return false;
    if(this.phase==='chat'||this.phase==='hotspot'){this.toIdle();return true;}
    this.enter(segmentExits[this.node.segment]||'$idle');return true;
  }
  setAuto(value){this.auto=Boolean(value);this.revision++;}
  setPaused(value){this.paused=Boolean(value);this.revision++;}
  toIdle(){
    this.node=null;this.phase=this.ended?'idle':'ready';this.sequence=[];this.quietUntil=this.ended?this.time+8+this.random()*6:Infinity;this.revealed=0;this.revision++;
    this.hooks.onGesture?.('hold',{speaker:'zhuang',segment:'idle'});this.hooks.onState?.(this.state);
  }
  enterSequenceLine(){
    const [speaker,text,gesture='look']=this.sequence[this.sequenceIndex];
    this.node={id:`${this.phase}_${this.sequenceIndex}_${this.revision}`,segment:this.phase,speaker,text,mood:'soft',gesture,next:null};this.entered=this.time;this.revealed=0;this.revision++;
    this.hooks.onGesture?.(gesture,this.node);this.hooks.onState?.(this.state);
  }
  runSequence(lines,phase){this.sequence=lines;this.sequenceIndex=0;this.phase=phase;this.enterSequenceLine();}
  nextChat(){
    if(!this.chatDeck.length){
      this.chatDeck=chatGroups.map((_,i)=>i);
      for(let i=this.chatDeck.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.chatDeck[i],this.chatDeck[j]]=[this.chatDeck[j],this.chatDeck[i]];}
      if(this.chatDeck.at(-1)===this.lastChat)[this.chatDeck[0],this.chatDeck[this.chatDeck.length-1]]=[this.chatDeck.at(-1),this.chatDeck[0]];
    }
    this.lastChat=this.chatDeck.pop();this.runSequence(chatGroups[this.lastChat],'chat');
  }
  hotspot(kind){
    if(this.paused||this.phase!=='idle'||this.time-(this.cooldowns[kind]??-Infinity)<6||this.time-this.lastHotspot<2.8||!hotspotGroups[kind])return false;
    const index=this.chatCounts[kind]||0;this.chatCounts[kind]=index+1;this.cooldowns[kind]=this.time;this.lastHotspot=this.time;
    this.runSequence(hotspotGroups[kind][index%hotspotGroups[kind].length],'hotspot');return true;
  }
  update(time){
    // The caller already freezes scene time in background; this also supports an explicit pause.
    const delta=Math.max(0,time-this.time);this.time=time;
    if(this.paused){this.entered+=delta;if(Number.isFinite(this.quietUntil))this.quietUntil+=delta;return;}
    if(this.phase==='idle'&&time>=this.quietUntil){this.nextChat();return;}
    if(!this.node)return;
    const total=this.text().length,characters=Math.min(total,Math.floor((time-this.entered)*27));
    if(characters>this.revealed){this.revealed=characters;this.revision++;}
    // Choices are never auto-advanced. Chatter/hotspots finish themselves so they cannot block forever.
    const automatic=this.auto||this.phase==='chat'||this.phase==='hotspot';
    if(automatic&&!this.node.choices&&time-this.entered>Math.max(3.8,total/27+2.2))this.next();
  }
  get state(){return {phase:this.phase,nodeId:this.node?.id||null,node:this.node,branch:this.branch,waitingChoice:Boolean(this.node?.choices),ended:this.ended,busy:Boolean(this.node),revealed:this.revealed,auto:this.auto,paused:this.paused,endingLabel:this.ended?`${branchTitles[this.branch]||''}${this.memory?` · ${this.memory}`:''}`:'',revision:this.revision};}
}

