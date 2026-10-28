import assert from 'node:assert/strict';
import {photoBounds} from '../src/photo-viewer.js';
import {MissionMachine} from '../src/mission-state.js';
let checks=0;const check=v=>{assert.ok(v);checks++;};
for(const [w,h] of [[320,300],[390,500],[1366,600],[1920,850],[440,250]])for(const [iw,ih] of [[1024,1280],[2048,1024]]){
 const base=photoBounds(w,h,iw,ih,1);check(base.x===0&&base.y===0);check(base.width<=w+.001&&base.height<=h+.001);check(Math.abs(base.width/base.height-iw/ih)<1e-8);const zoom=photoBounds(w,h,iw,ih,3);check(zoom.x>=0&&zoom.y>=0);check(zoom.x>0||zoom.y>0);
}
const m=new MissionMachine();m.phaseTo('photo-flight');m.flight={x:0,z:10.5,vx:0,vz:0};m.update(.1);check(!m.finishFlight());m.update(.59);check(!m.finishFlight());m.update(.61);check(m.finishFlight());m.phaseTo('photo-flight');m.flight.z=11.5;m.update(.8);check(!m.finishFlight());
console.log(`Viewer/positioning: ${checks} aspect, bounds and steady-shot checks passed.`);
