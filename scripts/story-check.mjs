import assert from 'node:assert/strict';
import {StoryMachine} from '../src/story-state.js';
import {nodes,chatGroups,hotspotGroups} from '../src/dialogue.js';

let checks=0;const check=(condition,message)=>{assert.ok(condition,message);checks++;};
for(const node of Object.values(nodes)){
  for(const key of ['id','speaker','text','mood','gesture','next'])assert.ok(key in node,`${node.id}: ${key}`);
  if(node.next&&!node.next.startsWith('$'))assert.ok(nodes[node.next],`${node.id}: missing next`);
  for(const choice of node.choices||[])assert.ok(nodes[choice.next],`${node.id}: missing choice destination`);
}
check(chatGroups.length>=14,'at least fourteen chatter groups');
check(chatGroups.every(group=>group.length>=2&&group.length<=4),'chatter groups have two to four lines');
check(Object.values(hotspotGroups).every(groups=>groups.length>=3),'three reactions per hotspot');
const advance=machine=>{machine.revealed=machine.text().length;machine.next();};
const goTo= (machine,id)=>{let limit=150;while(machine.state.nodeId!==id&&limit-->0)advance(machine);assert.equal(machine.state.nodeId,id);};
const toIdle=machine=>{let limit=150;while(machine.state.busy&&limit-->0)advance(machine);assert.equal(machine.state.phase,'idle');};

for(const branch of ['A','B','C'])for(const coda of ['quiet','send','keep']){
  const dinnerCalls=[],scenes=[];const machine=new StoryMachine({onDinner:v=>dinnerCalls.push(v),onScene:v=>scenes.push(v)});
  machine.start();goTo(machine,'choose_dinner');machine.setAuto(true);machine.update(100000);
  check(machine.state.waitingChoice&&machine.state.branch===null,'dinner choice never auto-selects');
  check(machine.skip()===false,'skip cannot bypass dinner choice');
  check(machine.choose(branch),'dinner selection accepted');
  goTo(machine,'coda_offer');
  check(machine.state.ended&&machine.state.branch===branch,'branch ending is reached');
  check(machine.state.endingLabel.length>0,'ending has a name');
  if(coda==='quiet'){machine.choose('quiet');toIdle(machine);}else{
    machine.choose('listen');goTo(machine,'choose_message');machine.update(200000);
    check(machine.state.nodeId==='choose_message','coda choice also never auto-selects');machine.choose(coda);toIdle(machine);
    check(machine.state.endingLabel.includes(coda==='send'?'一盞等你的燈':'今晚先照顧自己'),'coda changes the ending label');
  }
  check(dinnerCalls.length===2&&dinnerCalls[0]===null&&dinnerCalls[1]===branch,'props selected once per dinner');
  check(scenes.join(',')==='store,awning','camera cues only occur at scene transitions');
  check(machine.quietUntil-machine.time>=8&&machine.quietUntil-machine.time<=14,'quiet interval is eight to fourteen seconds');
  const before=machine.state.revision;machine.update(machine.quietUntil-.01);check(machine.state.revision===before,'no chatter during quiet interval');
  const seen=new Set();for(let i=0;i<chatGroups.length;i++){
    machine.update(machine.quietUntil+.01);check(machine.state.phase==='chat','chatter starts after quiet interval');seen.add(machine.lastChat);toIdle(machine);
  }
  check(seen.size===chatGroups.length,'chatter deck does not repeat within one cycle');
  for(const kind of Object.keys(hotspotGroups)){
    machine.update(machine.time+7);if(machine.state.busy)toIdle(machine);
    check(machine.hotspot(kind),`${kind} hotspot starts`);check(!machine.hotspot(kind),'overlapping taps are rejected');
    toIdle(machine);check(!machine.hotspot(kind),'same object has a cooldown');
  }
  const nodeBefore=machine.state.nodeId;machine.replay();check(machine.state.nodeId==='dinner_0'&&!machine.state.ended&&machine.branch===null,'replay resets the ending and dinner');
  check(!machine.hotspot('dragon'),'hotspots do not interrupt the main story');
  machine.setPaused(true);const reveal=machine.state.revealed;machine.update(machine.time+50);check(machine.state.revealed===reveal,'pause freezes dialogue reveal');
}
console.log(JSON.stringify({passed:true,checks,nodeCount:Object.keys(nodes).length,chatterGroups:chatGroups.length,hotspotKinds:Object.keys(hotspotGroups).length,paths:9},null,2));
