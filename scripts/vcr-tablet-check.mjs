import assert from 'node:assert/strict';
import {VcrTablet} from '../src/vcr-tablet.js';
import {MissionMachine} from '../src/mission-state.js';
import {qualityLocked,FrameStats} from '../src/performance-guard.js';
import {AdaptiveQuality} from '../src/adaptive-quality.js';
let checks=0;const check=(name,ok)=>{assert.ok(ok,name);checks++;};
const t=new VcrTablet();let time=0;const step=(seconds=.4)=>t.tick(time+=seconds),tap=id=>{step();return t.input(id,time);};
check('Only cold drink task at opening',t.state.buttons.length===1&&!t.state.lines.join('').includes('電網'));
check('Reading camera settles before input',!t.input('scan',0));step(1.3);
check('Unknown button cannot advance',!tap('enable')&&t.stage==='search');
function talks(){let n=0;while(t.state.dialogue&&n++<8){step(1.6);check('Dialogue is manually advanced',t.input('talk-next',time));}check('Dialogue never traps controls',n<8);}
for(const [id,next]of [['scan','php'],['tool','fridge'],['detect','controller'],['control','temperature']]){check(`Explicit ${id} input`,tap(id));if(!t.state.buttons.length)step(3.3);check(`Reached ${next}`,t.stage===next);}
check('Equipment remains cold until apply',!t.hot&&!t.powered);check('Apply starts defrost scene',tap('apply')&&t.stage==='defrost');step(3.9);check('Defrost has its own duration',t.stage==='defrost');step(.2);check('Hot reaction has Dragon speaker',t.stage==='hot'&&t.state.dialogue.speaker==='dragon');
step(100);check('Hot dialogue cannot auto skip',t.state.dialogue.text.includes('正五十'));check('Actions wait until conversation ends',!tap('open'));talks();check('Door opening requires input',tap('open')&&t.stage==='pickup');step(3.3);check('Bottle inspection has Xaihi dialogue',t.stage==='drink'&&t.state.dialogue.speaker==='xaihi');talks();
check('Drink is put aside before return walk',tap('meal')&&t.stage==='walk-counter');step(3.3);talks();check('Now microwave can scan grid',tap('scan-grid')&&t.stage==='scan-grid');step(2);check('NIKKE analysis separated from dialogue',t.stage==='backdoor'&&t.state.dialogue.speaker==='dragon');talks();check('Enable starts cable route',tap('enable')&&t.stage==='cable');
step(1);check('Wire begins at source',t.state.wireBeat==='source');step(1);check('Wire then shows route',t.state.wireBeat==='route');step(2.1);check('Wire ends at microwave',t.state.wireBeat==='sink');step(2);talks();check('Power choices only after wire arrives',t.stage==='power'&&t.state.buttons.length===2);
check('800 W is clickable',tap('800w')&&t.stage==='power'&&t.state.dialogue.text.includes('太慢'));check('Refusal cannot be bypassed by overload',!tap('800mw'));talks();check('Second refusal varies text',tap('800w')&&t.state.dialogue.text.includes('剛剛'));talks();check('800 MW asks confirmation',tap('800mw')&&t.stage==='confirm');step(30);check('Confirmation is manual',t.stage==='confirm');check('Confirm enables start',tap('confirm')&&t.stage==='ready');check('Start completes tablet',tap('start')&&t.stage==='done');
t.reset();check('Reset clears incident input state',t.stage==='search'&&!t.hot&&!t.powered&&!t.state.dialogue);
const m=new MissionMachine({tabletMode:true});m.phaseTo('hack');m.update(2);m.setPaused(true);check('Paused tablet rejects input',!m.tabletAction('scan'));m.update(50);check('Pause holds camera age',m.state.tablet.age===2);m.setPaused(false);check('Resume accepts input',m.tabletAction('scan'));m.start();check('Restart exits tablet',!m.state.tablet&&!m.state.fridgeHot);
const frame=new MissionMachine({tabletMode:true});frame.phaseTo('finisher');frame.update(.1);check('10 FPS does not slow cinematic clock',frame.state.phaseElapsed===.1);frame.update(.2);check('No accumulated slow motion',frame.state.phaseElapsed===.2);
const heat=new MissionMachine();heat.phaseTo('heat');heat.rhythm.round=1;heat.rhythm.first=false;heat.heatStart(0);heat.setPaused(true);check('Background interruption keeps completed segment',heat.rhythm.round===1&&heat.rhythm.status==='ready'&&!heat.rhythm.holding);heat.update(30);heat.setPaused(false);check('Interrupted rhythm can restart',heat.heatStart(heat.sourceTime)&&heat.rhythm.round===1);
for(const phase of ['combat','aim-final','finisher','landing','heat','meal-spawn'])check('Expensive quality changes locked in '+phase,qualityLocked({phase}));check('Safe scene accepts quality',!qualityLocked({phase:'flashback'}));
const hold=new MissionMachine();hold.phaseTo('heat');hold.rhythm.round=1;hold.rhythm.first=false;hold.heatStart(0);const long=hold.rhythm.notes.find(n=>n.type==='hold');hold.heatStart(long.at);check('Fixture is actually holding a long note',hold.rhythm.holding);hold.setPaused(true);check('Pausing a held note releases it without losing completed rounds',!hold.rhythm.holding&&hold.rhythm.round===1&&hold.rhythm.status==='ready');
const quality=new AdaptiveQuality();let q=null;for(let i=0;i<100;i++)q=quality.sample(.8,true,'balanced')||q;check('Visible severe frames cause downgrade',q==='low');const metrics=new FrameStats();metrics.sample(.01);metrics.sample(.2);check('Long frames recorded independently',metrics.state.longFrames===1&&metrics.state.p95Ms===200);

// Exercise the actual quality entrypoint: protected phases must not touch the renderer.
const {World}=await import('../src/world.js');let cheap=0;
const fake={missionState:{phase:'combat'},qualityBudget:null,siege:{quality(){cheap++;}},tianshi:{quality(){cheap++;}},microwave:{quality(){cheap++;}},get renderer(){throw Error('GPU resources accessed during combat');}};
World.prototype.setQuality.call(fake,'low',true);check('Actual quality entrypoint defers GPU work',fake.pendingQuality==='low'&&cheap===3);World.prototype.setQuality.call(fake,'low',true);check('Budget downgrade is applied once',cheap===3);

console.log(`VCR repair: ${checks} checks passed.`);
