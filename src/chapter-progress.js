import {CHAPTERS} from './mission-state.js';
const KEY='rainy711.chapters.v1';
export class ChapterProgress{
 constructor(storage){this.storage=storage;this.data={version:1,chapter:'intro',branch:'A',unlocked:['intro'],complete:false};try{const d=JSON.parse(storage?.getItem(KEY));if(d?.version===1&&CHAPTERS.some(c=>c.id===d.chapter)){this.data={version:1,chapter:d.chapter,branch:['A','B','C'].includes(d.branch)?d.branch:'A',unlocked:CHAPTERS.filter(c=>d.unlocked?.includes(c.id)).map(c=>c.id),complete:d.complete===true};}}catch{}}
 reach(phase,branch){if(CHAPTERS.some(c=>c.id===phase)){this.data.chapter=phase;if(!this.data.unlocked.includes(phase))this.data.unlocked.push(phase);}if(branch)this.data.branch=branch;if(phase==='complete'){this.data.complete=true;this.data.unlocked=CHAPTERS.map(c=>c.id);}try{this.storage?.setItem(KEY,JSON.stringify(this.data));}catch{}}
}
