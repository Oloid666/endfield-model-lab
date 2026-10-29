import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {speakers,heatDemoLines} from '../src/mission-dialogue.js';
const oldName=/\u838a\u82b3\u5b9c|\u5e84\u82b3\u5b9c/;
for(const file of execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean)){
 if(!/\.(?:js|mjs|py|md|json|html|svg|txt)$/.test(file))continue;
 assert(!oldName.test(fs.readFileSync(file,'utf8')),`Misspelled character name: ${file}`);
}
assert.equal(speakers.zhuang,'莊方宜');assert.equal(heatDemoLines.find(x=>x.id==='meal_reaction').text,'你把晚餐電活了？變成這個紫色不妙物體？？');
console.log('Character copy: tracked text name audit and living-meal reaction passed.');
