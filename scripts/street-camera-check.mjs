import assert from 'node:assert/strict';
import {streetStageFrame,streetWide} from '../src/street-stage-camera.js';
for(const initial of [false,true]){
 for(let age=0;age<22;age+=.05){const s=streetStageFrame(age,12,initial);if(s.progress>0)assert(age>=s.buildAt);if(!initial&&age<5.3)assert.equal(s.progress,0);if(s.done)assert(age>=s.end+1.5);}
}
assert.equal(streetStageFrame(.2,12).phase,'closeup');assert.equal(streetStageFrame(1,12).phase,'ascent');assert.equal(streetStageFrame(2.5,12).phase,'gesture');assert.equal(streetStageFrame(4,12).phase,'pullback');assert.equal(streetStageFrame(6,12).phase,'building');assert.equal(streetStageFrame(18,12).phase,'hold');
for(const portrait of [false,true])for(let i=0;i<3;i++){const s=streetWide(i,portrait);assert(s.position[2]>=19);assert(s.position[1]>=7);assert.notDeepEqual(s.position,streetWide((i+1)%3,portrait).position);}
console.log('Street camera: ordered stages, wide-before-building, three views and hold passed.');
