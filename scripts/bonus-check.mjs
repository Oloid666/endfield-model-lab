import assert from 'node:assert/strict';
import {lessonFrame,StampSequence,SmoothMeter,lessonProgress,wrapBoardText} from '../src/bonus-presentation.js';
import {BonusProgress,LESSONS,LESSON_NOTES,ClassCourse,lessonCardCount,CLASS_REQUIRED} from '../src/bonus-data.js';
import {ClaimsNegotiation,APPLICATION_FIELDS,SETTLEMENT_STAMPS} from '../src/claims-negotiation.js';
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
p.data.reading=true;p.data.textSize=26;p.save();check(new BonusProgress(storage).data.reading,true);check(new BonusProgress(storage).data.textSize,26);check(new BonusProgress({getItem:()=>JSON.stringify({textSize:100,reading:'yes'})}).data.textSize,18);
check(lessonFrame(0).reveal,0);check(lessonFrame(.3).reveal,1);check(lessonFrame(.8).reveal,2);check(lessonFrame(.2,true).dead,false);check(lessonFrame(.5,true).dead,true);check(lessonFrame(0,true,true).dead,true);
const stamp=new StampSequence();check(stamp.start(10),true);check(stamp.start(10.1),false);check(stamp.advance(10.2).impact,false);check(stamp.advance(10.41).impact,true);check(stamp.advance(10.42).impact,false);check(stamp.advance(10.8).phase,'printing');check(stamp.advance(11.2).done,true);check(stamp.advance(12).done,false);stamp.start(20);stamp.cancel();check(stamp.advance(25).impact,false);stamp.start(30,true);check(stamp.advance(30).impact,true);check(stamp.advance(30.2).done,true);
check(APPLICATION_FIELDS.map(f=>f.label),['事故原因','處理方式','損失情形','佐證附件','理賠金額']);
for(const field of APPLICATION_FIELDS)check(field.options.length,2);
for(let bits=0;bits<32;bits++){
 const n=new ClaimsNegotiation(),objections=[];
 check(n.next(),false);check(n.select('invalid'),false);check(n.finishStamp(),false);
 for(let field=0;field<5;field++){
  check(n.phase,'choice');check(n.field,field);check(n.policyholderVisible,false);
  const choice=APPLICATION_FIELDS[field].options[(bits>>field)&1];check(n.select(choice.id),true);check(n.select(choice.id),false);check(n.cue.text,choice.text);check(n.cue.speaker,'龍泡泡');n.next();
  if(field===1||field===4){check(n.phase,'objection');check(n.cue.event,'objection');objections.push(field);check(n.policyholderVisible,false);n.next();check(n.cue.event,undefined);n.next();}
 }
 check(objections,[1,4]);check(n.phase,'reveal');check(n.cue.text,'你看看要保人。');check(n.policyholderVisible,false);
 n.next();check(n.cue.text,'莊芳宜');check(n.policyholderVisible,true);check(n.polite,false);n.next();check(n.polite,true);n.next();check(n.phase,'business');
 check(n.cue.text,'我今天不是來談這個的。');n.next();check(n.cue.text.includes('每個月幾噸息壤'),true);n.next();check(n.cue.text.includes('立即辦理'),true);n.next();check(n.phase,'stamp');check(n.next(),false);
 for(let i=0;i<3;i++){check(n.stampIndex,i);check(n.finishStamp(),true);check(n.phase,i===2?'complete':'stamp');}
 check(n.finishStamp(),false);check(n.summary.length,5);check(Object.keys(n.choices).length,5);check(n.policyholderVisible,true);
 n.reset();check(n.phase,'choice');check(n.choices,{});check(n.stampIndex,0);check(n.policyholderVisible,false);
}
check(SETTLEMENT_STAMPS,['理賠通過','新案承保','長期合作']);
p.data.claimsSettled=true;p.save();check(new BonusProgress(storage).data.claimsSettled,true);check(new BonusProgress({getItem:()=>JSON.stringify({claimsSettled:'yes'})}).data.claimsSettled,false);
check(LESSONS.length,9);check(new Set(LESSONS.map(l=>l.id)).size,9);check(LESSONS.slice(0,2).map(l=>l.id),['general','mikoto']);
check(LESSONS[0].analysis.join('').includes('將軍是爻光'),true);check(LESSONS[1].analysis.join('').includes('御坂美琴'),true);
for(const l of LESSONS){check(l.analysis.length,3);check(LESSON_NOTES[l.id].length,3);check(l.analysis.every(s=>s.length>=60),true);check(l.recap.includes('undefined'),false);for(const source of l.sources)check(new URL(source.url).protocol,'https:');}
check(LESSONS[4].id,'login');check(LESSONS[5].id,'pear');
check(LESSONS[1].recap.includes('妳剛才才說我錯棚'),false);check(LESSONS[1].aside.includes('妳剛才才說我錯棚'),true);
check(LESSONS.find(l=>l.id==='taste').analysis.join('').includes('不能據此宣布'),false);check(LESSONS[4].analysis.join('').includes('未核實的最早出處'),false);
check([0,1,2,3,4,5].map(i=>lessonProgress(i,6)),[0,20,40,60,80,100]);check(lessonProgress(-2,6),0);check(lessonProgress(20,6),100);check(lessonProgress(0,0),0);
check(wrapBoardText('黑板不壓縮文字',t=>t.length,4),['黑板不壓','縮文字']);check(wrapBoardText('第一行\n第二行',t=>t.length,3),['第一行','第二行']);
check(CLASS_REQUIRED,4);const course=new ClassCourse({steps:{cargo:99,ammo:6},stamped:true,legacyCompleted:true});check(course.percentage,0);check(course.stamped,false);check(course.confirm('bad',0),false);check(course.confirm('cargo',-1),false);check(course.confirm('cargo',5),false);
for(let topic=0;topic<LESSONS.length;topic++){
 const l=LESSONS[topic];
 for(let i=0;i<lessonCardCount(l.id)-1;i++){course.confirm(l.id,i);check(course.percentage,Math.min(100,topic*25));}
 course.confirm(l.id,lessonCardCount(l.id)-1);check(course.percentage,Math.min(100,(topic+1)*25));check(course.eligible,topic>=3);
 for(let i=0;i<lessonCardCount(l.id);i++)course.confirm(l.id,i);check(course.completedCount,topic+1);
}
check(course.next('insurance'),'general');check(course.next('general'),'mikoto');check(course.certify(),true);check(new ClassCourse(course.saved).percentage,0);course.reset();check(course.percentage,0);check(course.stamped,false);check(course.next(),'general');
for(const l of LESSONS)check(l.aside.split('\n').length<=2,true);
const auto=new BonusProgress(storage);auto.data.unlocked=false;check(auto.complete('ready'),false);check(auto.complete('tour'),false);check(auto.complete('complete'),true);check(auto.complete('complete'),false);check(new BonusProgress(storage).data.unlocked,true);
const meter=new SmoothMeter();meter.set(100,0);check(meter.value(0),0);check(meter.value(.5)>0&&meter.value(.5)<100,true);const halfway=meter.value(.5);meter.set(100,.5);check(meter.value(.5),halfway);check(meter.value(1.2),100);meter.reset(5);check(meter.value(5),0);meter.set(60,5,true);check(meter.value(5),60);
console.log(`Bonus: ${checks} checks passed (including all 32 negotiation combinations).`);
