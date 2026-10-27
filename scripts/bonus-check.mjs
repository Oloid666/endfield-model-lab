import assert from 'node:assert/strict';
import {lessonFrame,StampSequence} from '../src/bonus-presentation.js';
import {BonusProgress,ClaimTrial,CLAIM_FIELDS,LESSONS,LESSON_NOTES,claimResult} from '../src/bonus-data.js';
let checks=0;const check=(actual,expected)=>{assert.deepEqual(actual,expected);checks++;};
const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
const p=new BonusProgress(storage);
for(let i=0;i<6;i++)check(p.tap(true,'ready'),false);
check(p.data.unlocked,false);p.tap(false,'ready');check(p.taps,0);
for(let i=0;i<6;i++)p.tap(true,'ready');check(p.tap(true,'intro'),false);check(p.taps,0);
for(let i=0;i<6;i++)p.tap(true,'complete');check(p.tap(true,'complete'),true);check(p.tap(true,'complete'),false);
check(new BonusProgress(storage).data.unlocked,true);
p.mark('read','cargo');p.mark('read','cargo');p.mark('read','bogus');check(new BonusProgress(storage).data.read,['cargo']);
const denied=new BonusProgress({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});for(let i=0;i<7;i++)denied.tap(true,'ready');check(denied.data.unlocked,true);
const invalid=new BonusProgress({getItem:()=>JSON.stringify({read:['bogus'],finished:'B',preference:'evil'})});check(invalid.data.read,[]);check(invalid.data.finished,[]);check(invalid.data.preference,'');
for(const raw of ['broken',JSON.stringify({read:{},finished:42}),JSON.stringify(null)])check(new BonusProgress({getItem:()=>raw}).data.unlocked,false);
const a=new ClaimTrial();check(a.finishA('accept'),false);a.field='cause';check(a.compare('damage'),false);check(a.compare('time'),false);check(a.errors,2);check(a.feedback.includes('提示'),true);check(a.compare('thunder'),true);a.field='cause';check(a.compare('thunder'),true);check(a.found,['cause']);a.field='loss';check(a.compare('damage'),true);check(a.finishA('return'),true);check(a.result.status,'退回補件');check(a.finishA('accept'),true);check(a.result.status,'更正受理');a.reset('B');check(a.result,null);check(a.found,[]);check(a.finishB(),false);
check(a.selectClue('thunder'),false);a.reset('A');a.field='cause';check(a.selectClue('invalid'),false);check(a.selectClue('thunder'),true);check(a.compare(),true);check(a.proofs,[{field:'cause',clue:'thunder'}]);a.reset('A');check(a.proofs,[]);
p.data.reading=true;p.data.textSize=26;p.save();check(new BonusProgress(storage).data.reading,true);check(new BonusProgress(storage).data.textSize,26);check(new BonusProgress({getItem:()=>JSON.stringify({textSize:100,reading:'yes'})}).data.textSize,18);
check(lessonFrame(0).reveal,0);check(lessonFrame(.3).reveal,1);check(lessonFrame(.8).reveal,2);check(lessonFrame(.2,true).dead,false);check(lessonFrame(.5,true).dead,true);check(lessonFrame(0,true,true).dead,true);
const stamp=new StampSequence();check(stamp.start(10),true);check(stamp.start(10.1),false);check(stamp.advance(10.2).impact,false);check(stamp.advance(10.41).impact,true);check(stamp.advance(10.42).impact,false);check(stamp.advance(10.8).phase,'printing');check(stamp.advance(11.2).done,true);check(stamp.advance(12).done,false);stamp.start(20);stamp.cancel();check(stamp.advance(25).impact,false);stamp.start(30,true);check(stamp.advance(30).impact,true);check(stamp.advance(30.2).done,true);
let accepted=0;
for(const [cause]of CLAIM_FIELDS[0].options)for(const [responsibility]of CLAIM_FIELDS[1].options)for(const [loss]of CLAIM_FIELDS[2].options){
 const r=claimResult({cause,responsibility,loss});const good=cause==='human'&&responsibility==='zhuang'&&loss==='building';check(r.status,good?'更正受理':'退回補件');if(good)accepted++;
 if(loss==='pear')check(r.reasons[0].startsWith('損失漏報'),true);
}
check(accepted,1);check(claimResult({cause:'invalid',responsibility:'zhuang',loss:'building'}),null);
check(LESSONS.length,8);check(new Set(LESSONS.map(l=>l.id)).size,8);
for(const l of LESSONS){check(l.analysis.length,3);check(LESSON_NOTES[l.id].length,3);check(l.analysis.every(s=>s.length>=60),true);check(l.recap.includes('undefined'),false);for(const source of l.sources)check(new URL(source.url).protocol,'https:');}
console.log(`Bonus: ${checks} checks passed (including all 18 claim combinations).`);
